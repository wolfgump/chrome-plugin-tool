// Global variables
let requests = [];
let selectedRequest = null;
let originalRequest = null;
let currentMethodFilter = 'ALL';
let isResendingRequest = false;
let lastResendTime = 0;
const RESEND_COOLDOWN = 500;
let searchDebounceTimer = null;
const SEARCH_DEBOUNCE_DELAY = 300;
let currentTool = 'json-formatter';
let isInitialized = false;
let requestsLoaded = false;
let toolChangedEventAttached = false;
let requestsBeingLoaded = false;

// DOM Elements - HTTP记录器相关元素已禁用
// const requestList = document.getElementById('requestList');
// const filterInput = document.getElementById('filterInput');
// const clearButton = document.getElementById('clearButton');
// const methodFilter = document.getElementById('methodFilter');

// 初始化函数
function initialize() {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }
  
  console.log("Initializing panel...");
  
  // 设置事件监听器 - 不包含HTTP记录器
  setupEventListeners();
  
  // 设置工具切换事件监听器
  setupToolNavigation();
  
  // 检查URL hash来确定初始工具
  const hash = window.location.hash.substring(1); // 移除#号
  if (hash && hash !== 'http-recorder') {
    currentTool = hash;
    switchTool(hash);
  } else {
    // 默认显示JSON格式化工具
    switchTool('json-formatter');
  }
  
  // 不加载HTTP请求数据，因为功能已禁用
  // loadRequests();
  
  isInitialized = true;
  console.log("Panel initialization completed - HTTP recorder disabled");
}

// 设置工具导航
function setupToolNavigation() {
  if (toolChangedEventAttached) {
    console.log("Tool navigation already set up");
    return;
  }
  
  console.log("Setting up tool navigation...");
  const navButtons = document.querySelectorAll('.nav-button');
  console.log("Found nav buttons:", navButtons.length);
  
  navButtons.forEach(button => {
    console.log("Adding click listener to button:", button.getAttribute('data-tool'));
    button.addEventListener('click', () => {
      const tool = button.getAttribute('data-tool');
      console.log("Button clicked for tool:", tool);
      switchTool(tool);
    });
  });
  
  toolChangedEventAttached = true;
}

// 切换工具
function switchTool(tool) {
  console.log("Switching to tool:", tool);
  
  // 如果试图切换到HTTP记录器，重定向到JSON格式化工具
  if (tool === 'http-recorder') {
    console.log("HTTP recorder is disabled, redirecting to json-formatter");
    tool = 'json-formatter';
    window.showNotification('info', 'HTTP记录器功能已禁用');
  }
  
  // 更新导航按钮状态
  const navButtons = document.querySelectorAll('.nav-button');
  navButtons.forEach(btn => {
    const btnTool = btn.getAttribute('data-tool');
    console.log("Checking button:", btnTool);
    if (btnTool === tool) {
      console.log("Activating button:", btnTool);
      btn.classList.add('active');
    } else {
      console.log("Deactivating button:", btnTool);
      btn.classList.remove('active');
    }
  });
  
  // 更新工具面板显示
  const toolPanels = document.querySelectorAll('.tool-panel');
  toolPanels.forEach(panel => {
    const panelId = panel.id;
    console.log("Checking panel:", panelId);
    if (panelId === `${tool}-tool`) {
      console.log("Activating panel:", panelId);
      panel.classList.add('active');
    } else {
      console.log("Deactivating panel:", panelId);
      panel.classList.remove('active');
    }
  });
  
  currentTool = tool;
  console.log("Current tool set to:", currentTool);
  
  // HTTP记录器功能已禁用，不加载请求数据
  // if (tool === 'http-recorder' && !requestsLoaded) {
  //   console.log("Loading requests for HTTP recorder");
  //   loadRequests();
  // }
}

// Set up event listeners for UI elements
function setupEventListeners() {
  console.log("Setting up event listeners (HTTP recorder disabled)");
  
  // 移除所有HTTP记录器相关的事件监听器
  // 只保留工具切换相关的监听器
  
  console.log("Event listeners setup completed (HTTP recorder disabled)");
}

// 加载请求数据
function loadRequests() {
  console.log("HTTP记录器功能已禁用 - loadRequests");
  return;
}

// 渲染请求列表
function renderRequestList() {
  console.log("HTTP记录器功能已禁用 - renderRequestList");
  return;
}

// 显示请求详情
function showRequestDetails(request) {
  console.log("HTTP记录器功能已禁用 - showRequestDetails");
  return;
}

// 准备修改表单
function prepareModifyForm(request) {
  console.log("HTTP记录器功能已禁用 - prepareModifyForm");
  return;
}

// 修改并重新发送请求
function modifyAndResend() {
  console.log("HTTP记录器功能已禁用 - modifyAndResend");
  return;
}

// 显示修改后的响应 - 已禁用
function showModifiedResponse(response) {
  console.log("HTTP记录器功能已禁用 - showModifiedResponse");
  return;
}

// 清除请求详情 - 已禁用
function clearRequestDetails() {
  console.log("HTTP记录器功能已禁用 - clearRequestDetails");
  return;
}

// 防抖渲染请求列表 - 已禁用
function debouncedRenderRequestList() {
  console.log("HTTP记录器功能已禁用 - debouncedRenderRequestList");
  return;
}

// 监听来自background的消息 - 简化版本，移除HTTP记录器相关消息处理
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("Panel received message:", message);
  
  // HTTP记录器功能已禁用，忽略相关消息
  if (message.action === 'newRequest' || message.action === 'requestUpdated') {
    console.log("HTTP记录器功能已禁用，忽略消息:", message.action);
    return;
  }
  
  // 其他消息正常处理（如果有的话）
  console.log("Ignoring message - HTTP recorder disabled");
});

// 初始化
document.addEventListener('DOMContentLoaded', initialize);