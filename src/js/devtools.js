// Create a panel in the DevTools
chrome.devtools.panels.create(
  "HTTP Recorder", // Panel title
  "../images/icon16.png", // Panel icon
  "../html/panel.html", // Panel content
  (panel) => {
    // Panel created
    console.log("HTTP Recorder panel created");
  }
); 