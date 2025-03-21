document.addEventListener('DOMContentLoaded', () => {
  const openPanelButton = document.getElementById('openPanel');
  const openJsonToolButton = document.getElementById('openJsonTool');
  
  // Open the HTTP request recorder tool
  if (openPanelButton) {
    openPanelButton.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/html/panel.html') });
    });
  }
  
  // Open the JSON formatter tool
  if (openJsonToolButton) {
    openJsonToolButton.addEventListener('click', () => {
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('src/html/panel.html#json-formatter') 
      });
    });
  }
}); 