// 存储捕获的请求，限制最多500个 - 已禁用
let capturedRequests = [];
const MAX_REQUESTS = 500;

// 用于存储已处理的请求ID，避免重复 - 已禁用
const processedRequestIds = new Set();

// 用于存储最近的URL和时间戳，用于限制请求频率 - 已禁用
const recentUrls = new Map();
const URL_COOLDOWN = 1000; // 1秒内同一URL只记录一次

// 初始化变量 - HTTP记录功能已完全禁用
let isRecording = false;

// HTTP请求监听器已完全禁用
// 所有webRequest监听器都被注释掉，不会捕获任何HTTP请求

// chrome.webRequest.onBeforeRequest.addListener(
//   function(details) {
//     // HTTP记录功能已禁用
//     return;
//   },
//   { urls: ["<all_urls>"] },
//   ["requestBody"]
// );

// 监听请求头 - 已禁用
// chrome.webRequest.onBeforeSendHeaders.addListener(
//   function(details) {
//     // HTTP记录功能已禁用
//     return;
//   },
//   { urls: ["<all_urls>"] },
//   ["requestHeaders"]
// );

// 监听响应头 - 已禁用
// chrome.webRequest.onHeadersReceived.addListener(
//   function(details) {
//     // HTTP记录功能已禁用
//     return;
//   },
//   { urls: ["<all_urls>"] },
//   ["responseHeaders"]
// );

// 监听响应体 - 已禁用
// chrome.webRequest.onCompleted.addListener(
//   function(details) {
//     // HTTP记录功能已禁用
//     return;
//   },
//   { urls: ["<all_urls>"] }
// );

// 添加请求到列表 - 功能保留但不会被调用
function addRequest(request) {
  // HTTP记录功能已禁用，此函数不会被调用
  console.log('HTTP记录功能已禁用');
  return;
}

// 更新请求 - 功能保留但不会被调用
function updateRequest(request) {
  // HTTP记录功能已禁用，此函数不会被调用
  console.log('HTTP记录功能已禁用');
  return;
}

// 查找请求 - 功能保留但不会被调用
function findRequest(requestId) {
  // HTTP记录功能已禁用，此函数不会被调用
  console.log('HTTP记录功能已禁用');
  return null;
}

// 通知所有面板 - 功能保留但不会被调用
function notifyPanels(action, data) {
  // HTTP记录功能已禁用，此函数不会被调用
  console.log('HTTP记录功能已禁用');
  return;
}

// 监听来自面板的消息 - 简化版本，只保留基本功能
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Received message:', message);
  
  switch (message.action) {
    case 'getRequests':
      // 返回空数组，因为HTTP记录功能已禁用
      console.log('HTTP记录功能已禁用，返回空请求列表');
      sendResponse([]);
      break;
      
    case 'clearRequests':
      // 功能已禁用
      console.log('HTTP记录功能已禁用');
      sendResponse({ success: true, message: 'HTTP记录功能已禁用' });
      break;
      
    case 'toggleRecording':
      // 始终返回禁用状态
      console.log('HTTP记录功能已永久禁用');
      sendResponse({ success: true, isRecording: false, message: 'HTTP记录功能已永久禁用' });
      break;
      
    case 'getRecordingStatus':
      // 始终返回禁用状态
      console.log('HTTP记录功能已禁用');
      sendResponse({ isRecording: false, message: 'HTTP记录功能已禁用' });
      break;
      
    case 'resendModifiedRequest':
      // 保留重发请求功能
      resendRequest(message.request)
        .then(response => {
          console.log('Request resent successfully:', response);
          sendResponse({ success: true, ...response });
        })
        .catch(error => {
          console.error('Error resending request:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 保持消息通道开放，等待异步响应
      
    default:
      console.log('Unknown action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// 重新发送修改后的请求 - 保留此功能
async function resendRequest(request) {
  const { url, method, headers, body } = request;
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
      credentials: 'include'
    });
    
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    const responseBody = await response.text();
    
    return {
      status: response.status,
      headers: responseHeaders,
      body: responseBody
    };
  } catch (error) {
    throw new Error(`Failed to resend request: ${error.message}`);
  }
}