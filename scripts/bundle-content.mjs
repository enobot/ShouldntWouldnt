import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distSrc = join(root, "dist", "src");
const entryFile = join(distSrc, "content", "entry.js");

function moduleId(file) {
  return relative(distSrc, file).replaceAll("\\", "/");
}

function resolveSpec(fromFile, spec) {
  if (!spec.startsWith(".")) throw new Error(`Only relative imports can be bundled (${spec} from ${fromFile})`);
  const target = resolve(dirname(fromFile), spec);
  return target.endsWith(".js") ? target : `${target}.js`;
}

function bindingList(raw) {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith("type ") && part !== "type")
    .map((part) => {
      const [local, alias] = part.replace(/^type\s+/, "").split(/\s+as\s+/);
      if (!local || local === "type") return "";
      return alias ? `${local.trim()}: ${alias.trim()}` : `${local.trim()}: ${local.trim()}`;
    })
    .filter(Boolean);
}

function transform(file, code) {
  const deps = [];
  let next = code.replace(/^\uFEFF?/, "");
  next = next.replace(/^\s*import\s+type\s+[\s\S]*?;\s*$/gm, "");
  next = next.replace(/^\s*export\s+type\s+[\s\S]*?;\s*$/gm, "");
  next = next.replace(/import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["'];?/g, (_, names, spec) => {
    const target = resolveSpec(file, spec);
    deps.push(target);
    const bindings = bindingList(names);
    if (bindings.length === 0) return "";
    return `const { ${bindings.join(", ")} } = require(${JSON.stringify(moduleId(target))});`;
  });
  next = next.replace(/import\s*["']([^"']+)["'];?/g, (_, spec) => {
    deps.push(resolveSpec(file, spec));
    return "";
  });

  const exported = [];
  next = next.replace(/export\s+function\s+(\w+)/g, (_, name) => {
    exported.push([name, name]);
    return `function ${name}`;
  });
  next = next.replace(/export\s+class\s+(\w+)/g, (_, name) => {
    exported.push([name, name]);
    return `class ${name}`;
  });
  next = next.replace(/export\s+(const|let|var)\s+(\w+)/g, (_, kind, name) => {
    exported.push([name, name]);
    return `${kind} ${name}`;
  });
  next = next.replace(/export\s*\{([\s\S]*?)\}\s*;?/g, (_, names) => {
    for (const part of names.split(",")) {
      const cleaned = part.trim();
      if (!cleaned || cleaned.startsWith("type ")) continue;
      const [local, alias] = cleaned.split(/\s+as\s+/);
      if (!local || local.startsWith("type")) continue;
      exported.push([(alias ?? local).trim(), local.trim()]);
    }
    return "";
  });

  if (/\bimport\b|\bexport\b/.test(next)) {
    throw new Error(`A module import or export remained in ${moduleId(file)}`);
  }
  const assignments = exported.map(([alias, local]) => `exports.${alias} = ${local};`).join("\n");
  return { deps, body: `${next}\n${assignments}\n` };
}

const modules = new Map();

function load(file) {
  const id = moduleId(file);
  if (modules.has(id)) return;
  modules.set(id, null);
  const transformed = transform(file, readFileSync(file, "utf8"));
  for (const dep of transformed.deps) load(dep);
  modules.set(id, transformed.body);
}

load(entryFile);

const body = [...modules.entries()]
  .map(([id, source]) => {
    if (source === null) throw new Error(`Missing module body for ${id}`);
    return `registry[${JSON.stringify(id)}] = function (exports, require) {\n${source}};`;
  })
  .join("\n");

const bundled = `(function () {
  "use strict";
  var registry = Object.create(null);
  function require(id) {
    var mod = registry[id];
    if (!mod) throw new Error("Missing " + id);
    if (!mod.exports) {
      mod.exports = {};
      mod.factory(mod.exports, require);
    }
    return mod.exports;
  }
  ${body.replaceAll("registry[", "registry[")}
  Object.keys(registry).forEach(function (id) {
    var factory = registry[id];
    registry[id] = { factory: factory, exports: null };
  });
  require("content/entry.js");
})();
`;

writeFileSync(join(root, "dist", "content.js"), bundled);
console.log("BUILD_OK");
