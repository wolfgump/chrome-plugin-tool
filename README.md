# HTTP Request Recorder Chrome Extension

This Chrome extension allows you to record, view, modify, and resend HTTP requests similar to Chrome's network panel but with added functionality.

## Features

1. **Record HTTP Requests**: Captures all HTTP requests made by your browser including:
   - URL
   - Request headers
   - Request body
   - Response headers
   - Response body

2. **View Request Details**: Examine the complete details of any captured request.

3. **Modify and Resend**: Modify any aspect of a captured request and resend it:
   - Change URL
   - Edit request headers
   - Modify request body
   - Change HTTP method

## Installation

Since this extension is not published to the Chrome Web Store yet, you can install it in developer mode:

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the directory containing this extension
5. The extension icon should appear in your browser toolbar

## How to Use

### Recording Requests

1. After installing the extension, it will automatically start recording HTTP requests made by your browser.
2. Click on the extension icon in the toolbar to see a summary of recorded requests.
3. Click "Open Request Panel" to view the full panel with all recorded requests.

### Viewing Request Details

1. In the request panel, click on any request in the list to view its details.
2. Use the tabs (Headers, Request, Response) to navigate between different sections of the request.

### Modifying and Resending Requests

1. Click on a request in the list to select it.
2. Go to the "Modify & Resend" tab.
3. Edit any part of the request:
   - Modify the URL
   - Change the HTTP method using the dropdown
   - Edit request headers
   - Modify the request body
4. Click "Send Request" to send the modified request.
5. View the response in the section below.

### Clearing Recorded Data

- Click the "Clear All" button in the panel to remove all recorded requests.
- Alternatively, click "Clear Recorded Data" in the popup menu.

## Browser Compatibility

This extension is designed for Google Chrome and other Chromium-based browsers that support Manifest V3 extensions.

## Known Limitations

- Cannot capture and modify binary data (images, videos, etc.)
- May not capture requests initiated by browser extensions
- Cannot capture responses from requests that return binary data

## License

This project is licensed under the MIT License - see the LICENSE file for details. 