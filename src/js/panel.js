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

// DOM Elements
const requestList = document.getElementById('requestList');
const filterInput = document.getElementById('filterInput');
const clearButton = document.getElementById('clearButton');
const methodFilter = document.getElementById('methodFilter');

// 初始化函数
function initialize() {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }
  
  console.log("Initializing panel...");
  
  // 设置事件监听器
  setupEventListeners();
  
  // 设置工具切换事件监听器
  setupToolNavigation();
  
  // 加载已保存的请求数据
  loadRequests();
  
  isInitialized = true;
  console.log("Panel initialization completed");
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
  
  // 如果是HTTP记录器，加载请求数据
  if (tool === 'http-recorder' && !requestsLoaded) {
    console.log("Loading requests for HTTP recorder");
    loadRequests();
  }
}

// Set up event listeners for UI elements
function setupEventListeners() {
  // Clear all requests
  if (clearButton && !clearButton._eventInitialized) {
    clearButton._eventInitialized = true;
    
    clearButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'clearRequests' }, response => {
        if (response.success) {
          requests = [];
          renderRequestList();
          clearRequestDetails();
        }
      });
    });
  }
  
  // Filter requests by text - 使用防抖版本
  if (filterInput && !filterInput._eventInitialized) {
    filterInput._eventInitialized = true;
    
    filterInput.addEventListener('input', () => {
      debouncedRenderRequestList();
    });
  }
  
  // Filter requests by method - 使用防抖版本
  if (methodFilter && !methodFilter._eventInitialized) {
    methodFilter._eventInitialized = true;
    
    methodFilter.addEventListener('change', () => {
      currentMethodFilter = methodFilter.value;
      console.log("Method filter changed to:", currentMethodFilter);
      debouncedRenderRequestList();
    });
  }
  
  // Send modified request
  const sendButton = document.getElementById('send-request');
  if (sendButton && !sendButton._eventInitialized) {
    sendButton._eventInitialized = true;
    console.log("Adding click event listener to send-request button");
    
    sendButton.addEventListener('click', () => {
      console.log("Send button clicked, calling modifyAndResend()");
      modifyAndResend();
    });
  }
  
  // 添加重置按钮事件监听，恢复原始请求数据
  const resetButton = document.getElementById('reset-request');
  if (resetButton && !resetButton._eventInitialized) {
    resetButton._eventInitialized = true;
    
    resetButton.addEventListener('click', () => {
      if (originalRequest) {
        prepareModifyForm(originalRequest);
      }
    });
  }
  
  console.log("Event listeners setup completed");
}

// 加载请求数据
function loadRequests() {
  if (requestsBeingLoaded) {
    console.log("Requests are already being loaded");
    return;
  }
  
  requestsBeingLoaded = true;
  console.log("Loading requests...");
  
  chrome.runtime.sendMessage({ action: 'getRequests' }, response => {
    if (response) {
      requests = response;
      console.log(`Loaded ${requests.length} requests`);
      renderRequestList();
    }
    requestsLoaded = true;
    requestsBeingLoaded = false;
  });
}

// 渲染请求列表
function renderRequestList() {
  if (!requestList) return;
  
  const searchText = filterInput ? filterInput.value.toLowerCase() : '';
  
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchText === '' || 
      request.url.toLowerCase().includes(searchText) ||
      request.method.toLowerCase().includes(searchText);
    
    const matchesMethod = currentMethodFilter === 'ALL' || 
      request.method === currentMethodFilter;
    
    return matchesSearch && matchesMethod;
  });
  
  requestList.innerHTML = '';
  
  filteredRequests.forEach(request => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${request.method}</td>
      <td>${request.status || 'pending'}</td>
      <td>${request.url}</td>
      <td>${request.type}</td>
      <td>${new Date(request.timeStamp).toLocaleTimeString()}</td>
    `;
    
    row.addEventListener('click', () => {
      showRequestDetails(request);
    });
    
    requestList.appendChild(row);
  });
}

// 显示请求详情
function showRequestDetails(request) {
  selectedRequest = request;
  originalRequest = JSON.parse(JSON.stringify(request));
  
  // 更新General信息
  const generalInfo = document.getElementById('general-info');
  if (generalInfo) {
    generalInfo.innerHTML = `
      <p><strong>Request URL:</strong> ${request.url}</p>
      <p><strong>Request Method:</strong> ${request.method}</p>
      <p><strong>Status Code:</strong> ${request.status || 'pending'}</p>
      <p><strong>Type:</strong> ${request.type}</p>
      <p><strong>Time:</strong> ${new Date(request.timeStamp).toLocaleString()}</p>
    `;
  }
  
  // 更新请求头
  const requestHeaders = document.getElementById('request-headers');
  if (requestHeaders) {
    requestHeaders.innerHTML = Object.entries(request.requestHeaders)
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
      .join('');
  }
  
  // 更新响应头
  const responseHeaders = document.getElementById('response-headers');
  if (responseHeaders) {
    responseHeaders.innerHTML = Object.entries(request.responseHeaders)
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
      .join('');
  }
  
  // 更新请求体
  const requestBody = document.getElementById('request-body');
  if (requestBody) {
    try {
      const formattedBody = JSON.stringify(JSON.parse(request.requestBody), null, 2);
      requestBody.textContent = formattedBody;
    } catch (e) {
      requestBody.textContent = request.requestBody;
    }
  }
  
  // 更新响应体
  const responseBody = document.getElementById('response-body');
  if (responseBody) {
    try {
      const formattedBody = JSON.stringify(JSON.parse(request.responseBody), null, 2);
      responseBody.textContent = formattedBody;
    } catch (e) {
      responseBody.textContent = request.responseBody;
    }
  }
  
  // 准备修改表单
  prepareModifyForm(request);
}

// 准备修改表单
function prepareModifyForm(request) {
  const urlInput = document.getElementById('modify-url');
  const methodSelect = document.getElementById('modify-method');
  const headersTextarea = document.getElementById('modify-headers');
  const bodyTextarea = document.getElementById('modify-body');
  
  if (urlInput) urlInput.value = request.url;
  if (methodSelect) methodSelect.value = request.method;
  if (headersTextarea) {
    headersTextarea.value = Object.entries(request.requestHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }
  if (bodyTextarea) {
    try {
      const formattedBody = JSON.stringify(JSON.parse(request.requestBody), null, 2);
      bodyTextarea.value = formattedBody;
    } catch (e) {
      bodyTextarea.value = request.requestBody;
    }
  }
}

// 修改并重新发送请求
function modifyAndResend() {
  if (isResendingRequest) {
    console.log("A request is already being sent");
    return;
  }
  
  const now = Date.now();
  if (now - lastResendTime < RESEND_COOLDOWN) {
    console.log("Please wait before sending another request");
    return;
  }
  
  isResendingRequest = true;
  lastResendTime = now;
  
  const urlInput = document.getElementById('modify-url');
  const methodSelect = document.getElementById('modify-method');
  const headersTextarea = document.getElementById('modify-headers');
  const bodyTextarea = document.getElementById('modify-body');
  
  if (!urlInput || !methodSelect || !headersTextarea || !bodyTextarea) {
    console.error("Required form elements not found");
    isResendingRequest = false;
    return;
  }
  
  const modifiedRequest = {
    url: urlInput.value,
    method: methodSelect.value,
    headers: {},
    body: bodyTextarea.value
  };
  
  // 解析请求头
  headersTextarea.value.split('\n').forEach(line => {
    const [key, ...values] = line.split(':');
    if (key && values.length > 0) {
      modifiedRequest.headers[key.trim()] = values.join(':').trim();
    }
  });
  
  // 发送修改后的请求
  chrome.runtime.sendMessage({
    action: 'resendModifiedRequest',
    request: modifiedRequest
  }, response => {
    if (response && response.success) {
      showModifiedResponse(response);
    }
    isResendingRequest = false;
  });
}

// 显示修改后的响应
function showModifiedResponse(response) {
  const responseSection = document.getElementById('modified-response-section');
  const statusDiv = document.getElementById('modified-response-status');
  const headersTab = document.getElementById('modified-response-headers-tab');
  const bodyTab = document.getElementById('modified-response-body-tab');
  const headersContent = document.getElementById('modified-response-headers');
  const bodyContent = document.getElementById('modified-response-body');
  
  if (responseSection) responseSection.style.display = 'block';
  if (statusDiv) {
    statusDiv.innerHTML = `<p><strong>Status:</strong> ${response.status}</p>`;
  }
  if (headersContent) {
    headersContent.textContent = JSON.stringify(response.headers, null, 2);
  }
  if (bodyContent) {
    try {
      const formattedBody = JSON.stringify(JSON.parse(response.body), null, 2);
      bodyContent.textContent = formattedBody;
    } catch (e) {
      bodyContent.textContent = response.body;
    }
  }
}

// 清除请求详情
function clearRequestDetails() {
  selectedRequest = null;
  originalRequest = null;
  
  const elements = [
    'general-info',
    'request-headers',
    'response-headers',
    'request-body',
    'response-body',
    'modified-response-section'
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '';
      if (id === 'modified-response-section') {
        element.style.display = 'none';
      }
    }
  });
}

// 防抖版本的renderRequestList
function debouncedRenderRequestList() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  searchDebounceTimer = setTimeout(() => {
    renderRequestList();
  }, SEARCH_DEBOUNCE_DELAY);
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'newRequest') {
    requests.unshift(message.request);
    if (currentTool === 'http-recorder') {
      renderRequestList();
    }
  } else if (message.action === 'requestUpdated') {
    const index = requests.findIndex(r => r.id === message.request.id);
    if (index !== -1) {
      requests[index] = message.request;
      if (currentTool === 'http-recorder') {
        renderRequestList();
      }
    }
  }
});

// 初始化
document.addEventListener('DOMContentLoaded', initialize);