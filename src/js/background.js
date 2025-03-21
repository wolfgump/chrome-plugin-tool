 // 存储捕获的请求，限制最多500个
let capturedRequests = [];
const MAX_REQUESTS = 500;

// 用于存储已处理的请求ID，避免重复
const processedRequestIds = new Set();

// 用于存储最近的URL和时间戳，用于限制请求频率
const recentUrls = new Map();
const URL_COOLDOWN = 1000; // 1秒内同一URL只记录一次

// 初始化变量
let isRecording = true;

// 监听请求
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (!isRecording) return;
    
    const now = Date.now();
    
    // 检查是否是最近处理过的URL
    if (recentUrls.has(details.url)) {
      const lastTime = recentUrls.get(details.url);
      if (now - lastTime < URL_COOLDOWN) {
        return;
      }
    }
    
    // 更新URL最后处理时间
    recentUrls.set(details.url, now);
    
    // 如果已经处理过这个请求，直接返回
    if (processedRequestIds.has(details.requestId)) {
      return;
    }
    
    // 记录这个请求ID为已处理
    processedRequestIds.add(details.requestId);
    
    // 获取请求体
    let requestBody = '';
    if (details.requestBody) {
      if (details.requestBody.raw) {
        const raw = details.requestBody.raw[0];
        if (raw.bytes) {
          requestBody = new TextDecoder().decode(raw.bytes);
        }
      } else if (details.requestBody.formData) {
        requestBody = JSON.stringify(details.requestBody.formData);
      }
    }
    
    // 创建新的请求记录
    const request = {
      id: details.requestId,
      url: details.url,
      method: details.method,
      type: details.type,
      timeStamp: details.timeStamp,
      requestBody: requestBody,
      requestHeaders: {},
      responseHeaders: {},
      responseBody: ''
    };
    
    // 添加到捕获列表
    addRequest(request);
    
    // 通知面板有新请求
    notifyPanels('newRequest', request);
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// 监听请求头
// chrome.webRequest.onBeforeSendHeaders.addListener(
//   function(details) {
//     if (!isRecording) return;
    
//     const request = findRequest(details.requestId);
//     if (request) {
//       // 将请求头转换为对象格式
//       const headers = {};
//       details.requestHeaders.forEach(header => {
//         headers[header.name] = header.value;
//       });
      
//       request.requestHeaders = headers;
//       updateRequest(request);
//     }
//   },
//   { urls: ["<all_urls>"] },
//   ["requestHeaders"]
// );

// 监听响应头
// chrome.webRequest.onHeadersReceived.addListener(
//   function(details) {
//     if (!isRecording) return;
    
//     const request = findRequest(details.requestId);
//     if (request) {
//       // 更新状态码
//       request.status = details.statusCode;
      
//       // 将响应头转换为对象格式
//       const headers = {};
//       details.responseHeaders.forEach(header => {
//         headers[header.name] = header.value;
//       });
      
//       request.responseHeaders = headers;
//       updateRequest(request);
//     }
//   },
//   { urls: ["<all_urls>"] },
//   ["responseHeaders"]
// );

// 监听响应体
// chrome.webRequest.onCompleted.addListener(
//   function(details) {
//     if (!isRecording) return;
    
//     const request = findRequest(details.requestId);
//     if (request) {
//       // 更新状态码
//       request.status = details.statusCode;
//       updateRequest(request);
//     }
//   },
//   { urls: ["<all_urls>"] }
// );

// 添加请求到列表
function addRequest(request) {
  capturedRequests.unshift(request);
  if (capturedRequests.length > MAX_REQUESTS) {
    capturedRequests.pop();
  }
}

// 更新请求
function updateRequest(request) {
  const index = capturedRequests.findIndex(r => r.id === request.id);
  if (index !== -1) {
    capturedRequests[index] = request;
    notifyPanels('requestUpdated', request);
  }
}

// 查找请求
function findRequest(requestId) {
  return capturedRequests.find(request => request.id === requestId);
}

// 通知所有面板
function notifyPanels(action, data) {
  chrome.runtime.sendMessage({ action, request: data });
}

// 监听来自面板的消息
// chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//   console.log('Received message:', message);
  
//   switch (message.action) {
//     case 'getRequests':
//       console.log('Sending requests:', capturedRequests);
//       sendResponse(capturedRequests);
//       break;
      
//     case 'clearRequests':
//       capturedRequests = [];
//       processedRequestIds.clear();
//       recentUrls.clear();
//       console.log('Requests cleared');
//       sendResponse({ success: true });
//       break;
      
//     case 'toggleRecording':
//       isRecording = !isRecording;
//       console.log('Recording toggled:', isRecording);
//       // 通知所有面板记录状态已更改
//       notifyPanels('recordingStatusChanged', { isRecording });
//       sendResponse({ success: true, isRecording });
//       break;
      
//     case 'getRecordingStatus':
//       console.log('Sending recording status:', isRecording);
//       sendResponse({ isRecording });
//       break;
      
//     case 'resendModifiedRequest':
//       resendRequest(message.request)
//         .then(response => {
//           console.log('Request resent successfully:', response);
//           sendResponse({ success: true, ...response });
//         })
//         .catch(error => {
//           console.error('Error resending request:', error);
//           sendResponse({ success: false, error: error.message });
//         });
//       return true; // 保持消息通道开放，等待异步响应
      
//     default:
//       console.log('Unknown action:', message.action);
//       sendResponse({ success: false, error: 'Unknown action' });
//   }
// });

// 重新发送修改后的请求
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