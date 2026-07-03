# LMS Share browser extension

This is a minimal Manifest V3 extension for Chrome and Microsoft Edge. It lets a teacher send the current tab's title and URL to the LMS Share builder.

## Development install

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `extension/` directory.
5. Run the LMS Share app locally with `npm run dev`.
6. Visit an `http(s)` page and click the LMS Share toolbar button.

## App URL

The extension currently points to the local Vite dev server:

```js
const APP_BASE_URL = 'http://localhost:5173/';
```

Before publishing the extension, change `APP_BASE_URL` in `popup.js` to the deployed LMS Share origin, for example:

```js
const APP_BASE_URL = 'https://your-lms-share-app.up.railway.app/';
```

## Permissions

The extension uses `activeTab` and `tabs` so it can read the active tab's title and URL only when the teacher opens the popup. It does not inspect page content or request broad host permissions.
