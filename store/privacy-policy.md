# Privacy policy

Shouldn't Wouldn't, version 0.1.1. This policy describes what this version of the extension actually does. It is the notice to publish with the Chrome Web Store listing. It is not a law firm's opinion, and it does not change what a website does with information a person chooses to submit.

Contact: support@shouldntwouldnt.com

## What the extension is

Shouldn't Wouldn't was created to help you and your loved ones browse with greater confidence. It is a free Chrome extension that shows a local reminder when a page looks like it is asking for sensitive information. Think Twice Before You Share.

It is a privacy reminder. It is not a guarantee that a website is safe, legitimate, or trustworthy, and it is not a guarantee that a website is dangerous.

## What it examines on a page

Form analysis happens locally in your browser. To decide whether to show a reminder, the extension reads:

- the kind of control (for example, a password box, an email box, or a text box)
- the field's `name`, `id`, autocomplete token, and placeholder
- the label and other short descriptive text next to the field (text inside form controls, drop-down
  options, and editable areas such as rich-text boxes is skipped)
- the page's hostname and whether the address starts with `http` or `https`
- the `action` attribute of a form that already contains a field the extension has warned about

It uses those details to recognize requests for information such as a Social Security number, payment card, bank account, password, government ID, email address, phone number, street address, or date of birth. It also looks locally for an insecure connection and for a hostname that is a close lookalike of a well-known name. Many deceptive names are missed on purpose. The extension does not ask a reputation service whether a site is safe.

The toolbar popup shows the hostname, the connection scheme, two counts, and a short status. Those details stay in the popup while it is open. They are not written to a list of sites you have visited.

The Chrome Web Store asks developers to declare data an extension handles even when it never leaves the device. For this extension, that is website content: the field details and page address listed above, examined on your computer to decide whether to show a reminder. They are not stored, not sent to the developer or anyone else, not sold, and not used for any other purpose.

## Hiding characters on screen

For fields that appear to ask for a Social Security number, card number, bank account or routing number, government ID, passport, or driver's license, the extension draws the characters you type as dots, using a browser display setting on that field. A Show button in the reminder reveals them, and Hide covers them again. This changes only what your screen shows. The extension does not read, copy, or store what you type to do this, and the website still receives exactly what you enter.

## When a page hides a reminder

If a page keeps removing a reminder, or covers one, the extension marks its toolbar button with "!" for that tab and the popup says so. The page's content script tells the extension's background script only that this happened. No page address, field, or typed text is included. The mark is cleared when that page goes away.

## What is saved

The extension saves one setting in Chrome's local extension storage (`chrome.storage.local`): whether protection is on or off. The stored value is only `true` or `false`, under the key `protectionEnabled`.

That choice stays in this browser profile when you move between websites, refresh a page, close Chrome, or when Chrome restarts the extension's background script. It is not sent to Shouldn't Wouldn't, and this extension does not use Chrome's sync storage. Removing the extension deletes the setting. The setting is not encrypted by the extension. It is not a password, a card number, or anything typed into a form.

Until you dismiss it, a reminder stays on the page. A dismissal lasts until that page closes. It is kept in memory only.

## What it does not do

We don't read what you type into forms. The extension does not read field values, form data, keystrokes, clipboard contents, the text inside a comment box, or text typed into an editable area of a page.

One limit, stated plainly: a few websites repeat what you typed in their own page text, for example in an error message next to the field. If a field points to such a message as its description, the extension may read that page text when it looks at the field again. It is used only on your computer to match words such as "card number", and it is never saved or sent.

We don't collect, save, share, or sell your personal information. Local review of field labels is not a copy kept by the developer. This version does not save Social Security numbers, passwords, credit card numbers, or anything else entered into a form.

It does not send browsing history, page addresses, form fields, or typed input to a server. It has no account, analytics, advertising, error reporting, or payment feature. It does not use cookies, `localStorage`, `sessionStorage`, or IndexedDB. It does not call a phishing-reputation service, Google Safe Browsing, or Google Web Risk.

## Why it needs access to websites

The reminder has to appear beside a form while that form is on the screen. The extension therefore runs on ordinary `http` and `https` pages. Chrome describes that access broadly, because a content script is allowed to see the page. In this extension, that access is used to read the field metadata listed above and to insert the reminder. It is not used to read what you type or to change what you submit.

The `storage` permission is used only to remember the on/off setting described above.

Chrome still lets a person limit which sites an extension may visit.

## What a reminder cannot do

Shouldn't Wouldn't cannot guarantee that every website is safe. A website can still hide, cover, or remove a reminder, and this extension cannot stop a site that is trying to do that. The words of a reminder sit in a closed shadow root so the page cannot rewrite them, and the extension puts a removed note back a limited number of times. A site that keeps deleting the note, or that covers it with another element, can still hide it. That limit is deliberate. The extension does not place a blocking overlay over the page, and it does not stop you from typing or submitting.

Websites you choose to submit information to may collect that information under their own privacy policies.

## Children

The extension is a reminder for adults, including parents. It is not a children's account or service. It does not ask anyone for a name, email address, or payment, and it does not send what a person types.

## How long information stays

- The on/off setting remains until you change it or remove the extension.
- A dismissed reminder, a Show or Hide choice, and the stronger site note are discarded when the page closes.
- The toolbar "!" mark is cleared when the page that hid a reminder goes away, or when the tab closes.
- Nothing is sent to the developer, so there is no developer copy to delete. To delete the saved setting, turn protection on again or remove the extension in `chrome://extensions`.

## Chrome Web Store limited use

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Changes

If a later version starts sending information off the device, storing anything typed into a form, or adding analytics, this policy has to be rewritten before that version is published.

Questions: support@shouldntwouldnt.com
