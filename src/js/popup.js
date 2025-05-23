document.addEventListener('DOMContentLoaded', () => {
  const openJsonToolButton = document.getElementById('openJsonTool');
  const openAiToolButton = document.getElementById('openAiTool');
  const openFullPanelButton = document.getElementById('openFullPanel');
  
  // 打开JSON格式化工具
  if (openJsonToolButton) {
    openJsonToolButton.addEventListener('click', () => {
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('src/html/panel.html#json-formatter') 
      });
      window.close(); // 关闭popup
    });
  }
  
  // 打开AI接口测试工具
  if (openAiToolButton) {
    openAiToolButton.addEventListener('click', () => {
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('src/html/panel.html#ai-api-tester') 
      });
      window.close(); // 关闭popup
    });
  }
  
  // 打开完整面板
  if (openFullPanelButton) {
    openFullPanelButton.addEventListener('click', () => {
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('src/html/panel.html') 
      });
      window.close(); // 关闭popup
    });
  }
}); 