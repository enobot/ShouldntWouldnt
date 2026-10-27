# Install Shouldn't Wouldn't unpacked

This is a developer load, not a Chrome Web Store install. Version 0.1.1 was submitted to the Chrome Web Store on October 26, 2026 and is pending review; Google has not approved it yet. This repository is at 0.1.2, which will be uploaded after that review.

1. Install Node.js 22 or newer.
2. In this repository, run `npm install`, then `npm test`, then `npm run build`. The build writes `dist/content.js`, the compiled popup and service worker, and the icons. Load unpacked only after that build. `dist/` is not committed. To check exactly what would be uploaded, run `npm run package` and load the unzipped `release/shouldnt-wouldnt-0.1.2.zip` instead.
3. Open Chrome and go to `chrome://extensions`.
4. Turn on Developer mode.
5. Choose Load unpacked and select the repository root, the folder that contains `manifest.json`.
6. Pin Shouldn't Wouldn't if you want the popup one click away.

The popup starts from "Unable to determine" until it can read the active tab. On `chrome://` pages, the Chrome Web Store, PDFs, and the new tab page, it stays on "Unable to determine" because the content script is only matched to `http` and `https`.

## Try the mock pages

`file://` pages are not injected. Serve the fixtures:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/fixtures/` and use the links there. The pages contain fake labels, not real personal data. Use an `http://` address when you want to see the insecure-connection reminder.

Turning protection off is saved in this browser profile. Reloading the extension, leaving Chrome idle, or quitting Chrome does not turn it back on. Remove the extension to delete that saved choice.

## Remove it

On `chrome://extensions`, choose Remove. Chrome deletes the saved on/off setting with the extension.
