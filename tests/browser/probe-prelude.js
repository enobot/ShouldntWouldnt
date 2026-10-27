// Test-only prelude. scripts/../harness copies the built extension and puts this file in front of
// dist/content.js, so it runs in the content script's isolated world before the extension code.
// It wraps the DOM and extension APIs that could expose typed values or send data, and records any
// use. It also counts observer callbacks and DOM queries for the performance report.
// It is never part of the shipped extension.
(function () {
  "use strict";
  var stats = {
    violations: [],
    mutationCallbacks: 0,
    mutationRecords: 0,
    shadowLookups: 0,
    queryCalls: 0,
    queryResults: 0,
    messages: [],
    storageWrites: [],
    storageReads: 0,
  };
  var OriginalObserver = MutationObserver;
  var originalGetAttribute = Element.prototype.getAttribute;
  var originalClosest = Element.prototype.closest;
  var originalParent = Object.getOwnPropertyDescriptor(Node.prototype, "parentElement").get;
  var originalSetAttribute = Element.prototype.setAttribute;

  function where() {
    var stack = String(new Error().stack || "").split("\n");
    return stack.slice(3, 5).join(" | ").replace(/\s+/g, " ");
  }

  function flag(kind) {
    stats.violations.push(kind + " @ " + where());
  }

  function wrapGetter(proto, prop, kind, filter) {
    var desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (!desc || !desc.get) return;
    Object.defineProperty(proto, prop, {
      configurable: true,
      enumerable: desc.enumerable,
      get: function () {
        if (!filter || filter(this)) flag(kind);
        return desc.get.call(this);
      },
      set: desc.set,
    });
  }

  function wrapMethod(owner, prop, before) {
    var original = owner && owner[prop];
    if (typeof original !== "function") return;
    try {
      owner[prop] = function () {
        var result = before.apply(this, arguments);
        if (result && result.skip) return result.value;
        return original.apply(this, arguments);
      };
    } catch (_) {
      // Some host objects refuse assignment. Their use is still covered by the source scan.
    }
  }

  function privateText(node) {
    if (!node) return false;
    var el = node.nodeType === 1 ? node : originalParent.call(node);
    if (!el) return false;
    if (originalClosest.call(el, "textarea, input")) return true;
    if (node.nodeType === 1 && node.querySelector && Element.prototype.querySelector.call(node, "textarea")) return true;
    var editable = originalClosest.call(el, "[contenteditable]");
    return !!editable && originalGetAttribute.call(editable, "contenteditable") !== "false";
  }

  [
    [HTMLInputElement.prototype, ["value", "defaultValue", "valueAsNumber", "valueAsDate", "selectionStart", "selectionEnd", "files"]],
    [HTMLTextAreaElement.prototype, ["value", "defaultValue", "textLength", "selectionStart", "selectionEnd"]],
    [HTMLSelectElement.prototype, ["value", "selectedIndex", "selectedOptions"]],
    [HTMLOptionElement.prototype, ["selected"]],
    [HTMLElement.prototype, ["innerText", "outerText"]],
  ].forEach(function (pair) {
    pair[1].forEach(function (prop) {
      wrapGetter(pair[0], prop, pair[0].constructor.name + "." + prop);
    });
  });
  wrapGetter(Node.prototype, "textContent", "textContent of typed text", privateText);
  wrapGetter(Node.prototype, "nodeValue", "nodeValue of typed text", privateText);
  wrapGetter(CharacterData.prototype, "data", "data of typed text", privateText);
  wrapGetter(Attr.prototype, "value", "value attribute", function (attr) {
    return String(attr.name).toLowerCase() === "value";
  });
  wrapGetter(Attr.prototype, "nodeValue", "value attribute", function (attr) {
    return String(attr.name).toLowerCase() === "value";
  });

  wrapMethod(Element.prototype, "getAttribute", function (name) {
    if (String(name).toLowerCase() === "value") flag("getAttribute(value)");
  });
  wrapMethod(Element.prototype, "getAttributeNode", function (name) {
    if (String(name).toLowerCase() === "value") flag("getAttributeNode(value)");
  });
  wrapMethod(Element.prototype, "setAttribute", function (name) {
    var lower = String(name).toLowerCase();
    if (lower === "src" || lower === "href" || lower === "srcset" || lower === "action" || lower === "formaction") {
      flag("setAttribute(" + lower + ")");
    }
  });
  wrapMethod(EventTarget.prototype, "addEventListener", function (type) {
    var watched = ["input", "beforeinput", "change", "keydown", "keyup", "keypress", "paste", "copy", "cut", "compositionupdate", "compositionend", "textInput"];
    if (watched.indexOf(String(type)) >= 0) flag("addEventListener(" + type + ")");
  });

  ["fetch"].forEach(function (name) {
    wrapMethod(window, name, function () {
      flag(name);
    });
  });
  wrapMethod(XMLHttpRequest.prototype, "open", function () {
    flag("XMLHttpRequest");
  });
  wrapMethod(navigator, "sendBeacon", function () {
    flag("sendBeacon");
  });
  wrapMethod(document, "execCommand", function () {
    flag("execCommand");
  });
  wrapMethod(window, "getSelection", function () {
    flag("getSelection");
  });
  if (window.DataTransfer) {
    wrapMethod(DataTransfer.prototype, "getData", function () {
      flag("DataTransfer.getData");
    });
  }
  if (navigator.clipboard) {
    wrapMethod(navigator.clipboard, "readText", function () {
      flag("clipboard.readText");
    });
    wrapMethod(navigator.clipboard, "read", function () {
      flag("clipboard.read");
    });
  }
  ["FormData", "WebSocket", "EventSource", "RTCPeerConnection", "Worker", "SharedWorker"].forEach(function (name) {
    var Original = window[name];
    if (typeof Original !== "function") return;
    window[name] = function () {
      flag(name);
      return Reflect.construct(Original, arguments);
    };
  });
  [
    [HTMLImageElement.prototype, "src"],
    [HTMLScriptElement.prototype, "src"],
    [HTMLIFrameElement.prototype, "src"],
    [HTMLLinkElement.prototype, "href"],
    [HTMLAnchorElement.prototype, "href"],
    [HTMLFormElement.prototype, "action"],
  ].forEach(function (pair) {
    var desc = Object.getOwnPropertyDescriptor(pair[0], pair[1]);
    if (!desc || !desc.set) return;
    Object.defineProperty(pair[0], pair[1], {
      configurable: true,
      enumerable: desc.enumerable,
      get: desc.get,
      set: function (next) {
        flag(pair[0].constructor.name + "." + pair[1] + " set");
        desc.set.call(this, next);
      },
    });
  });

  window.MutationObserver = function (callback) {
    return new OriginalObserver(function (records, observer) {
      stats.mutationCallbacks += 1;
      stats.mutationRecords += records.length;
      return callback(records, observer);
    });
  };
  [Document.prototype, Element.prototype, DocumentFragment.prototype].forEach(function (proto) {
    var original = proto.querySelectorAll;
    proto.querySelectorAll = function () {
      var result = original.apply(this, arguments);
      stats.queryCalls += 1;
      stats.queryResults += result.length;
      return result;
    };
  });

  try {
    if (chrome.dom && chrome.dom.openOrClosedShadowRoot) {
      var lookup = chrome.dom.openOrClosedShadowRoot.bind(chrome.dom);
      chrome.dom.openOrClosedShadowRoot = function (el) {
        stats.shadowLookups += 1;
        return lookup(el);
      };
    }
  } catch (_) {
    // Counting is best effort.
  }
  try {
    var send = chrome.runtime.sendMessage.bind(chrome.runtime);
    chrome.runtime.sendMessage = function (message) {
      stats.messages.push(JSON.stringify(message));
      return send.apply(null, arguments);
    };
  } catch (_) {
    flag("could not wrap runtime.sendMessage");
  }
  try {
    var set = chrome.storage.local.set.bind(chrome.storage.local);
    chrome.storage.local.set = function (items) {
      stats.storageWrites.push(JSON.stringify(items));
      return set.apply(null, arguments);
    };
    var get = chrome.storage.local.get.bind(chrome.storage.local);
    chrome.storage.local.get = function () {
      stats.storageReads += 1;
      return get.apply(null, arguments);
    };
  } catch (_) {
    flag("could not wrap storage");
  }

  new OriginalObserver(function () {
    var request = originalGetAttribute.call(document.documentElement, "data-sw-probe-request") || "";
    if (request.indexOf("canary") === 0) {
      // Proves the traps are live in this world: read a value the way a bug would.
      var input = document.querySelector("input");
      if (input) void input.value;
    }
    originalSetAttribute.call(document.documentElement, "data-sw-probe", JSON.stringify(stats));
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-sw-probe-request"] });
})();
