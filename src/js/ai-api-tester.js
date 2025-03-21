/**
 * AI API Tester Tool
 * 用于测试各种AI大模型API的工具
 */

// 请求锁定保护，防止自动请求
window.globalRequestLock = {
  locked: true,
  lastRequest: 0,
  minInterval: 1000, // 最小请求间隔为1秒
  unlock: function(reason) {
    console.log(`解锁API请求: ${reason}`);
    this.locked = false;
    // 5秒后自动重新锁定，防止误操作
    setTimeout(() => {
      if (!this.locked) {
        console.log('API请求锁定自动激活（安全保护）');
        this.locked = true;
      }
    }, 5000);
  },
  lock: function(reason) {
    console.log(`锁定API请求: ${reason}`);
    this.locked = true;
  },
  canRequest: function() {
    const now = Date.now();
    // 检查是否锁定
    if (this.locked) {
      return false;
    }
    // 检查请求间隔
    if (now - this.lastRequest < this.minInterval) {
      return false;
    }
    return true;
  },
  registerRequest: function() {
    this.lastRequest = Date.now();
    // 发送后立即锁定，需要重新点击才能发送
    this.locked = true;
  }
};

// 全局变量
let apiSettings = {
  provider: 'meituan',
  endpoint: '',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7
};

// API提供商预设
const API_PRESETS = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo']
  },
  meituan: {
    endpoint: 'https://aigc.sankuai.com/v1/openai/native/chat/completions',
    models: ['gpt-4o-mini', 'LongCat-8B-128K-Chat','deepseek-chat','deepseek-r1-friday','anthropic.claude-3.7-sonnet']
  },
  azure: {
    endpoint: 'https://{resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2023-05-15',
    models: ['gpt-4', 'gpt-3.5-turbo']
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
  },
  baidu: {
    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/{model}',
    models: ['ernie-bot-4', 'ernie-bot-8k', 'ernie-bot']
  },
  zhipu: {
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: ['glm-4', 'glm-3-turbo']
  }
};

// 历史记录
let apiHistory = [];

// 元素引用
let elements = {};

// 标记工具是否已初始化
let aiTesterInitialized = false;

// 全局事件控制系统 - 用于解决重复触发问题
window.eventControl = {
  // 事件监听器映射表
  listeners: new Map(),
  
  // 唯一ID生成器
  nextId: 1,
  
  // 添加事件监听器并防止重复添加
  addListener: function(element, eventType, handler, options) {
    if (!element) {
      console.error('无法给null或undefined元素添加事件监听器');
      return null;
    }
    
    // 为元素创建唯一标识符
    if (!element._eventId) {
      element._eventId = 'elem_' + this.nextId++;
    }
    
    // 为事件类型创建键
    const key = `${element._eventId}:${eventType}`;
    
    // 检查是否已经存在这个监听器
    if (this.listeners.has(key)) {
      console.log(`跳过重复添加的事件监听器: ${key}`);
      // 返回已有的处理函数
      return this.listeners.get(key);
    }
    
    console.log(`添加新的事件监听器: ${key}`);
    
    // 存储事件处理函数，并与元素关联
    this.listeners.set(key, handler);
    
    // 真正添加事件监听器
    element.addEventListener(eventType, handler, options);
    
    // 返回处理函数，以便后续可能的移除操作
    return handler;
  },
  
  // 移除事件监听器
  removeListener: function(element, eventType) {
    if (!element || !element._eventId) return false;
    
    const key = `${element._eventId}:${eventType}`;
    
    // 获取处理函数
    const handler = this.listeners.get(key);
    if (handler) {
      // 移除事件监听器
      element.removeEventListener(eventType, handler);
      // 从映射表中删除
      this.listeners.delete(key);
      console.log(`已移除事件监听器: ${key}`);
      return true;
    }
    
    console.log(`未找到要移除的事件监听器: ${key}`);
    return false;
  },
  
  // 移除元素的所有事件监听器
  removeAllListeners: function(element) {
    if (!element || !element._eventId) return;
    
    const prefix = element._eventId + ':';
    
    // 找到所有与此元素相关的监听器
    const keysToRemove = [];
    this.listeners.forEach((handler, key) => {
      if (key.startsWith(prefix)) {
        const eventType = key.split(':')[1];
        // 移除事件监听器
        element.removeEventListener(eventType, handler);
        keysToRemove.push(key);
      }
    });
    
    // 从映射表中删除
    keysToRemove.forEach(key => this.listeners.delete(key));
    
    console.log(`已移除元素的所有事件监听器, 总数: ${keysToRemove.length}`);
  },
  
  // 替换或更新元素，同时保留事件处理状态
  updateElement: function(oldElement, newElement) {
    if (!oldElement || !oldElement._eventId) return;
    
    // 将旧元素的ID传递给新元素
    newElement._eventId = oldElement._eventId;
    
    console.log(`更新元素的事件ID: ${newElement._eventId}`);
  },
  
  // 调试用：打印当前所有事件监听器
  printListeners: function() {
    console.log('当前注册的所有事件监听器:');
    this.listeners.forEach((handler, key) => {
      console.log(`- ${key}`);
    });
  }
};

/**
 * 初始化AI API Tester工具
 */
function initAITester() {
  // 防止重复初始化
  if (aiTesterInitialized) {
    console.log('AI API Tester 已经初始化，跳过重复初始化');
    return;
  }
  
  console.log('开始初始化AI API Tester');
  
  // 获取DOM元素引用
  elements = {
    // API配置元素
    providerSelect: document.getElementById('api-provider'),
    endpointInput: document.getElementById('api-endpoint'),
    apiKeyInput: document.getElementById('api-key'),
    toggleTokenBtn: document.getElementById('toggle-token-visibility'),
    modelSelect: document.getElementById('model-name'),
    customModelInput: document.getElementById('custom-model-name'),
    temperatureSlider: document.getElementById('temperature'),
    temperatureValue: document.getElementById('temperature-value'),
    
    // 消息输入
    systemMessage: document.getElementById('system-message'),
    userMessage: document.getElementById('user-message'),
    
    // 操作按钮
    sendBtn: document.getElementById('send-api-request'),
    clearBtn: document.getElementById('clear-api-form'),
    saveSettingsBtn: document.getElementById('save-api-settings'),
    
    // 响应区域
    responseContent: document.getElementById('ai-response-content'),
    rawResponseContent: document.getElementById('raw-response-content'),
    responseTabs: document.querySelectorAll('.response-tabs .tab-button'),
    responseTokens: document.getElementById('response-tokens'),
    responseTime: document.getElementById('response-time'),
    
    // 历史记录
    historyList: document.getElementById('api-history-list')
  };
  
  // 检查关键DOM元素是否找到
  if (!elements.providerSelect) console.error('无法找到提供商选择元素');
  if (!elements.endpointInput) console.error('无法找到端点输入元素');
  if (!elements.modelSelect) console.error('无法找到模型选择元素');
  if (!elements.sendBtn) console.error('无法找到发送按钮元素');
  
  // 先初始化事件监听器
  initEventListeners();
  
  // 设置默认值
  setDefaultValues();
  
  // 尝试从本地存储加载设置
  loadSavedSettings(false);
  
  // 确保初始提供商正确设置（即使没有保存的设置）
  if (elements.providerSelect && elements.providerSelect.value) {
    try {
      console.log(`初始化后强制更新提供商设置: ${elements.providerSelect.value}`);
      handleProviderChange(false);
    } catch (err) {
      console.error('初始化后更新提供商设置失败:', err);
    }
  }
  
  // 标记为已初始化
  aiTesterInitialized = true;
  
  console.log('AI API Tester 初始化完成');
}

/**
 * 设置输入框默认值
 */
function setDefaultValues() {
  try {
    // 设置系统消息默认值
    if (elements.systemMessage && !elements.systemMessage.value) {
      elements.systemMessage.value = "You are a helpful AI assistant. Answer the user's question thoroughly and accurately.";
    }
    
    // 设置用户消息默认值
    if (elements.userMessage && !elements.userMessage.value) {
      elements.userMessage.value = "Tell me about large language models and their applications.";
    }
    
    // 设置API密钥默认值
    if (elements.apiKeyInput && !elements.apiKeyInput.value) {
      elements.apiKeyInput.value = "21896369292560830480";
      apiSettings.apiKey = "21896369292560830480";
      // 确保密钥显示方式正确初始化
      if (elements.toggleTokenBtn) {
        elements.toggleTokenBtn.textContent = elements.apiKeyInput.type === 'password' ? '显示' : '隐藏';
      }
    }
    
    // 设置温度滑块的默认值
    if (elements.temperatureSlider && elements.temperatureValue) {
      elements.temperatureSlider.value = apiSettings.temperature;
      elements.temperatureValue.textContent = apiSettings.temperature;
    }
    
    // 初始化API提供商相关设置 - 重要：确保API端点和模型正确联动
    if (elements.providerSelect) {
      const provider = elements.providerSelect.value || 'openai';  // 默认使用OpenAI
      
      // 首次加载时进行初始化设置，确保后端地址和模型正确联动
      if (provider && API_PRESETS[provider]) {
        // 触发一次提供商变更，但标记为非用户操作
        updateProviderSettings(provider, false);
      }
    }
    
    console.log('已设置默认值');
  } catch (err) {
    console.error('设置默认值时出错:', err);
  }
}

/**
 * 更新提供商相关设置（端点和模型）
 * @param {string} provider - 提供商名称
 * @param {boolean} isUserAction - 是否为用户操作触发
 * @param {string} preferredModel - 优先选择的模型（可选）
 */
function updateProviderSettings(provider, isUserAction = true, preferredModel = null) {
  if (!provider || !API_PRESETS[provider]) {
    console.warn(`提供商 "${provider}" 不存在或未定义预设`);
    return;
  }
  
  try {
    console.log(`开始更新提供商设置: ${provider}, 首选模型: ${preferredModel || '无'}, 用户操作: ${isUserAction}`);
    
    const preset = API_PRESETS[provider];
    
    // 更新全局设置对象
    apiSettings.provider = provider;
    
    // 更新端点 - 无论如何都确保更新
    if (elements.endpointInput) {
      elements.endpointInput.value = preset.endpoint;
      apiSettings.endpoint = preset.endpoint;
      console.log(`已设置API端点: ${preset.endpoint}`);
    } else {
      console.error('找不到端点输入元素');
    }
    
    // 确保模型下拉列表存在
    if (!elements.modelSelect) {
      console.error('找不到模型选择下拉框');
      return;
    }
    
    // 如果有指定的首选模型，优先使用它
    const modelToUse = preferredModel && preset.models.includes(preferredModel) 
      ? preferredModel 
      : preset.models[0];
    
    console.log(`将使用模型: ${modelToUse}`);
    
    // 清空并重新填充模型选项
    try {
      while (elements.modelSelect.options.length > 0) {
        elements.modelSelect.remove(0);
      }
      
      // 添加该提供商的模型
      preset.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        elements.modelSelect.add(option);
      });
      
      // 添加自定义选项
      const customOption = document.createElement('option');
      customOption.value = 'custom';
      customOption.textContent = '自定义模型名称';
      elements.modelSelect.add(customOption);
      
      // 设置选中的模型
      elements.modelSelect.value = modelToUse;
      apiSettings.model = modelToUse;
      
      console.log(`模型下拉列表已更新，当前选择: ${elements.modelSelect.value}`);
    } catch (err) {
      console.error('更新模型列表时出错:', err);
    }
    
    // 根据是否选择自定义模型来显示/隐藏自定义模型输入框
    if (elements.customModelInput) {
      if (elements.modelSelect.value === 'custom') {
        elements.customModelInput.style.display = 'block';
      } else {
        elements.customModelInput.style.display = 'none';
      }
    }
    
    console.log(`提供商设置更新完成: ${provider}, 端点: ${elements.endpointInput.value}, 模型: ${elements.modelSelect.value}`);
    
  } catch (err) {
    console.error('更新提供商设置时出错:', err);
  }
}

/**
 * 处理API提供商变更
 * @param {boolean} isUserAction - 表示是否由用户操作触发，用于区分自动加载和用户操作
 */
function handleProviderChange(isUserAction = true) {
  try {
    if (!elements.providerSelect) {
      console.error('提供商选择元素不存在');
      return;
    }
    
    const provider = elements.providerSelect.value;
    console.log(`处理提供商变更: ${provider}, 是否用户触发: ${isUserAction}`);
    
    if (!provider || !API_PRESETS[provider]) {
      console.error(`无效的提供商: ${provider}`);
      return;
    }
    
    // 立即更新UI上的API端点值
    const preset = API_PRESETS[provider];
    if (elements.endpointInput && preset.endpoint) {
      elements.endpointInput.value = preset.endpoint;
      apiSettings.endpoint = preset.endpoint;
      console.log(`直接设置API端点为: ${preset.endpoint}`);
    }
    
    // 调用更新提供商设置函数
    updateProviderSettings(provider, isUserAction);
    
    if (isUserAction) {
      console.log(`用户手动切换到提供商: ${provider}, 端点: ${elements.endpointInput.value}, 模型: ${apiSettings.model}`);
    }
  } catch (err) {
    console.error('处理提供商变更时出错:', err);
  }
}

/**
 * 处理模型选择变更
 */
function handleModelChange() {
  const selectedModel = elements.modelSelect.value;
  
  if (selectedModel === 'custom') {
    // 显示自定义模型输入框
    elements.customModelInput.style.display = 'block';
    elements.customModelInput.focus();
  } else {
    // 隐藏自定义模型输入框并设置选定的模型
    elements.customModelInput.style.display = 'none';
    apiSettings.model = selectedModel;
  }
}

/**
 * 处理温度滑块变更
 */
function handleTemperatureChange() {
  const value = elements.temperatureSlider.value;
  elements.temperatureValue.textContent = value;
  apiSettings.temperature = parseFloat(value);
}

/**
 * 切换API密钥可见性
 */
function toggleApiKeyVisibility() {
  const input = elements.apiKeyInput;
  const button = elements.toggleTokenBtn;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '隐藏';
  } else {
    input.type = 'password';
    button.textContent = '显示';
  }
}

/**
 * 保存API设置
 */
function saveSettings() {
  // 更新当前设置
  apiSettings.endpoint = elements.endpointInput.value;
  apiSettings.apiKey = elements.apiKeyInput.value;
  
  // 检查是否使用自定义模型
  if (elements.modelSelect.value === 'custom') {
    apiSettings.model = elements.customModelInput.value;
  } else {
    apiSettings.model = elements.modelSelect.value;
  }
  
  // 保存到本地存储
  try {
    localStorage.setItem('aiApiSettings', JSON.stringify({
      provider: apiSettings.provider,
      endpoint: apiSettings.endpoint,
      model: apiSettings.model,
      temperature: apiSettings.temperature
      // 注意：出于安全考虑，不存储API密钥
    }));
    
    showNotification('设置已保存', 'success');
  } catch (error) {
    console.error('保存设置失败:', error);
    showNotification('保存设置失败', 'error');
  }
}

/**
 * 加载保存的设置
 * @param {boolean} triggerAction - 是否触发加载后的操作（如自动发送请求）
 */
function loadSavedSettings(triggerAction = true) {
  try {
    const savedSettings = localStorage.getItem('aiApiSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      console.log('加载保存的设置:', settings);
      
      // 更新设置对象
      Object.assign(apiSettings, settings);
      
      // 更新UI
      if (elements.providerSelect) {
        elements.providerSelect.value = settings.provider;
        console.log(`设置提供商选择: ${settings.provider}`);
      }
      
      // 更新提供商相关设置，包括端点和模型列表，但不触发自动请求
      // 注意传入settings.model作为首选模型，确保选择保存的模型
      updateProviderSettings(settings.provider, false, settings.model);
      
      // 确保模型正确设置
      if (elements.modelSelect && settings.model) {
        if (elements.modelSelect.querySelector(`option[value="${settings.model}"]`)) {
          elements.modelSelect.value = settings.model;
        } else if (settings.model) {
          // 如果是自定义模型
          elements.modelSelect.value = 'custom';
          if (elements.customModelInput) {
            elements.customModelInput.value = settings.model;
            elements.customModelInput.style.display = 'block';
          }
        }
        console.log(`设置模型选择: ${settings.model}`);
      }
      
      // 更新温度滑块
      if (elements.temperatureSlider && elements.temperatureValue) {
        elements.temperatureSlider.value = settings.temperature;
        elements.temperatureValue.textContent = settings.temperature;
      }
      
      console.log('已加载保存的设置');
    } else {
      console.log('没有找到保存的设置，使用默认值');
      
      // 如果没有保存的设置，则使用默认的提供商设置
      if (elements.providerSelect) {
        const defaultProvider = elements.providerSelect.value;
        updateProviderSettings(defaultProvider, false);
      }
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

/**
 * 更新模型列表（不触发其他事件）
 */
function updateModelList(provider) {
  if (provider !== 'custom' && API_PRESETS[provider]) {
    const preset = API_PRESETS[provider];
    
    // 清空并重新填充模型选项
    while (elements.modelSelect.options.length > 0) {
      elements.modelSelect.remove(0);
    }
    
    // 添加该提供商的模型
    preset.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      elements.modelSelect.add(option);
    });
    
    // 添加自定义选项
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = '自定义模型名称';
    elements.modelSelect.add(customOption);
  }
}

/**
 * 清空表单
 */
function clearForm() {
  elements.systemMessage.value = '';
  elements.userMessage.value = '';
  elements.responseContent.innerHTML = '';
  elements.rawResponseContent.textContent = '';
  elements.responseTokens.innerHTML = '<span>输入: 0 tokens</span><span>输出: 0 tokens</span><span>总计: 0 tokens</span>';
  elements.responseTime.innerHTML = '<span>响应时间: 0ms</span>';
}

/**
 * 发送API请求 - 增强版防重复请求
 */
async function sendApiRequest() {
  // 请求ID和锁定机制
  const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // 创建调用堆栈，用于追踪请求来源
  const stack = new Error().stack;
  const caller = stack.split('\n').slice(2, 3).join(' ').trim();
  
  console.log(`----------- 开始处理API请求 (${requestId}) -----------`);
  console.log(`请求来源: ${caller}`);
  console.log(`调用时间: ${new Date().toISOString()}`);
  
  // 严格检查全局发送标志
  if (window.currentlySendingRequest === true) {
    console.error(`[${requestId}] 严重错误: 检测到重复请求尝试`);
    showNotification('请求已被阻止: 检测到重复尝试', 'error');
    throw new Error('DUPLICATE_REQUEST_ATTEMPT');
  }
  
  // 设置全局发送标志
  window.currentlySendingRequest = true;
  
  try {
    // 检查全局锁
    if (window.globalRequestLock.locked !== false) {
      console.error(`[${requestId}] 拒绝请求: 全局锁定状态`);
      throw new Error('REQUEST_LOCKED');
    }
    
    // 检查用户授权
    if (!window.allowApiRequestWithoutClick) {
      console.error(`[${requestId}] 拒绝请求: 缺少用户授权`);
      throw new Error('USER_AUTHORIZATION_REQUIRED');
    }
    
    // 获取输入数据
    const systemMsg = elements.systemMessage ? elements.systemMessage.value.trim() : '';
    const userMsg = elements.userMessage ? elements.userMessage.value.trim() : '';
    
    // 验证必要输入
    if (!userMsg) {
      throw new Error('请输入用户消息');
    }
    
    if (!elements.endpointInput?.value) {
      throw new Error('请输入API端点');
    }
    
    if (!elements.apiKeyInput?.value) {
      throw new Error('请输入API密钥');
    }
    
    // 更新设置
    apiSettings.endpoint = elements.endpointInput.value;
    apiSettings.apiKey = elements.apiKeyInput.value;
    
    // 设置模型
    if (elements.modelSelect.value === 'custom') {
      apiSettings.model = elements.customModelInput?.value || 'custom-model';
    } else {
      apiSettings.model = elements.modelSelect.value;
    }
    
    console.log(`[${requestId}] 准备发送请求到 ${apiSettings.endpoint}, 模型: ${apiSettings.model}`);
    
    // 记录开始时间
    const startTime = Date.now();
    let response = null;
    
    try {
      // 发送请求
      switch (apiSettings.provider) {
        case 'openai':
        case 'meituan':
        case 'azure':
          response = await callChatCompletionAPI(systemMsg, userMsg, requestId);
          break;
        case 'anthropic':
          response = await callAnthropicAPI(systemMsg, userMsg, requestId);
          break;
        case 'baidu':
          response = await callBaiduAPI(systemMsg, userMsg, requestId);
          break;
        case 'zhipu':
          response = await callZhipuAPI(systemMsg, userMsg, requestId);
          break;
        default:
          response = await callChatCompletionAPI(systemMsg, userMsg, requestId);
      }
      
      // 验证响应
      if (!response) {
        throw new Error('收到空响应');
      }
      
      // 计算响应时间
      const responseTime = Date.now() - startTime;
      
      // 显示响应
      displayResponse(response, responseTime);
      
      // 添加到历史记录
      addToHistory(userMsg, response);
      
      console.log(`[${requestId}] 请求完成，耗时: ${responseTime}ms`);
      
      // 返回响应，以便调用者可以进一步处理
      return response;
      
    } catch (error) {
      console.error(`[${requestId}] 请求失败:`, error);
      
      // 处理错误显示，但不尝试重新发送请求
      if (elements.responseContent) {
        elements.responseContent.innerHTML = `<div class="error">请求失败: ${error.message}</div>`;
      }
      
      if (elements.rawResponseContent) {
        elements.rawResponseContent.textContent = JSON.stringify({ 
          error: error.message,
          requestId: requestId,
          timestamp: new Date().toISOString()
        }, null, 2);
      }
      
      if (elements.responseTime) {
        elements.responseTime.innerHTML = `<span>响应时间: ${Date.now() - startTime}ms</span>`;
      }
      
      // 重新抛出错误，确保调用者知道请求失败
      throw error;
    }
  } finally {
    // 无论如何都清除全局发送标志
    console.log(`[${requestId}] 释放全局发送标志`);
    window.currentlySendingRequest = false;
    window.globalRequestLock.locked = true; // 重新锁定
    
    console.log(`----------- 请求处理结束 (${requestId}) -----------`);
  }
}

/**
 * 调用标准的Chat Completion API (OpenAI兼容格式) - 使用XMLHttpRequest代替fetch，防止浏览器自动重试
 */
async function callChatCompletionAPI(systemMsg, userMsg, requestId) {
  return new Promise((resolve, reject) => {
    const endpoint = apiSettings.endpoint;
    const messages = [];
    
    // 添加系统消息(如果有)
    if (systemMsg) {
      messages.push({ role: "system", content: systemMsg });
    }
    
    // 添加用户消息
    messages.push({ role: "user", content: userMsg });
    
    // 准备请求体
    const requestBody = {
      model: apiSettings.model,
      messages: messages,
      temperature: apiSettings.temperature,
      max_tokens: 2000,
    };
    
    // 创建XHR对象
    const xhr = new XMLHttpRequest();
    
    // 超时处理
    xhr.timeout = 60000; // 60秒超时
    
    // 防止浏览器缓存
    const cacheBuster = `nocache=${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const url = endpoint.includes('?') ? `${endpoint}&${cacheBuster}` : `${endpoint}?${cacheBuster}`;
    
    // 打开连接 - 强制使用POST
    xhr.open('POST', url, true);
    
    // 设置请求头
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Request-ID', requestId);
    xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('Expires', '0');
    
    // 设置不同提供商的认证头
    if (apiSettings.provider === 'openai') {
      xhr.setRequestHeader('Authorization', `Bearer ${apiSettings.apiKey}`);
    } else if (apiSettings.provider === 'azure') {
      xhr.setRequestHeader('api-key', apiSettings.apiKey);
    } else if (apiSettings.provider === 'meituan') {
      xhr.setRequestHeader('Authorization', `Bearer ${apiSettings.apiKey}`);
    } else {
      // 自定义提供商，使用标准Bearer认证
      xhr.setRequestHeader('Authorization', `Bearer ${apiSettings.apiKey}`);
    }
    
    console.log(`[${requestId}] 发送POST请求到 ${endpoint}`);
    
    // 响应事件处理
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          console.error(`[${requestId}] 解析响应失败:`, error);
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      } else {
        const error = new Error(`API返回错误 (${xhr.status}): ${xhr.responseText}`);
        error.status = xhr.status;
        error.responseText = xhr.responseText;
        console.error(`[${requestId}] 请求失败:`, error);
        reject(error);
      }
    };
    
    // 错误处理
    xhr.onerror = function() {
      console.error(`[${requestId}] 网络错误`);
      reject(new Error('网络错误，请检查连接并稍后重试'));
    };
    
    // 超时处理
    xhr.ontimeout = function() {
      console.error(`[${requestId}] 请求超时`);
      reject(new Error('请求超时，请稍后重试'));
    };
    
    // 中止处理
    xhr.onabort = function() {
      console.error(`[${requestId}] 请求被中止`);
      reject(new Error('请求被中止'));
    };
    
    // 发送请求
    try {
      xhr.send(JSON.stringify(requestBody));
    } catch (error) {
      console.error(`[${requestId}] 发送请求失败:`, error);
      reject(new Error(`发送请求失败: ${error.message}`));
    }
    
    // 返回一个清理函数，可用于中止请求
    return () => {
      if (xhr.readyState !== 4) {
        xhr.abort();
        console.log(`[${requestId}] 请求已中止`);
      }
    };
  });
}

/**
 * 调用Anthropic Claude API
 */
async function callAnthropicAPI(systemMsg, userMsg, requestId) {
  const requestBody = {
    model: apiSettings.model,
    messages: [
      systemMsg ? { role: "system", content: systemMsg } : null,
      { role: "user", content: userMsg }
    ].filter(Boolean),
    max_tokens: 2000,
    temperature: apiSettings.temperature
  };
  
  console.log(`[${requestId}] 发送POST请求到 ${apiSettings.endpoint}`);
  
  const response = await fetch(apiSettings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiSettings.apiKey,
      'anthropic-version': '2023-06-01',
      'X-Request-ID': requestId,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: JSON.stringify(requestBody),
    cache: 'no-store',
    redirect: 'error'
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Anthropic API返回错误 (${response.status}): ${errorText}`);
    error.status = response.status;
    throw error;
  }
  
  return await response.json();
}

/**
 * 调用百度文心一言API
 */
async function callBaiduAPI(systemMsg, userMsg, requestId) {
  // 首先获取访问令牌
  let accessToken;
  try {
    // 假设apiKey格式为: "API_KEY:SECRET_KEY"
    const [apiKey, secretKey] = apiSettings.apiKey.split(':');
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    
    console.log(`[${requestId}] 获取百度访问令牌`);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store',
      redirect: 'error'
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`获取百度访问令牌失败: ${await tokenResponse.text()}`);
    }
    
    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;
  } catch (error) {
    throw new Error(`百度API认证失败: ${error.message}`);
  }
  
  // 准备消息
  const messages = [];
  if (systemMsg) {
    messages.push({ role: "system", content: systemMsg });
  }
  messages.push({ role: "user", content: userMsg });
  
  // 构建完整的API URL，替换模型名称
  const apiUrl = apiSettings.endpoint.replace('{model}', apiSettings.model) + '?access_token=' + accessToken;
  
  console.log(`[${requestId}] 发送POST请求到 ${apiUrl}`);
  
  // 发送请求
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({
      messages: messages,
      temperature: apiSettings.temperature
    }),
    cache: 'no-store',
    redirect: 'error'
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`百度API返回错误 (${response.status}): ${errorText}`);
    error.status = response.status;
    throw error;
  }
  
  return await response.json();
}

/**
 * 调用智谱AI API
 */
async function callZhipuAPI(systemMsg, userMsg, requestId) {
  const requestBody = {
    model: apiSettings.model,
    messages: [
      systemMsg ? { role: "system", content: systemMsg } : null,
      { role: "user", content: userMsg }
    ].filter(Boolean),
    temperature: apiSettings.temperature
  };
  
  console.log(`[${requestId}] 发送POST请求到 ${apiSettings.endpoint}`);
  
  const response = await fetch(apiSettings.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiSettings.apiKey}`,
      'X-Request-ID': requestId,
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(requestBody),
    cache: 'no-store',
    redirect: 'error'
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`智谱API返回错误 (${response.status}): ${errorText}`);
    error.status = response.status;
    throw error;
  }
  
  return await response.json();
}

/**
 * 显示API响应
 */
function displayResponse(response, responseTime) {
  // 显示原始JSON
  elements.rawResponseContent.textContent = JSON.stringify(response, null, 2);
  
  // 提取并显示格式化的响应内容
  let content = '';
  let inputTokens = 0;
  let outputTokens = 0;
  
  try {
    // 根据不同提供商解析响应
    switch (apiSettings.provider) {
      case 'openai':
      case 'meituan':
      case 'azure':
        content = response.choices[0].message.content;
        inputTokens = response.usage?.prompt_tokens || 0;
        outputTokens = response.usage?.completion_tokens || 0;
        break;
        
      case 'anthropic':
        content = response.content[0].text;
        // Anthropic目前不提供token计数
        break;
        
      case 'baidu':
        content = response.result;
        inputTokens = response.usage?.prompt_tokens || 0;
        outputTokens = response.usage?.completion_tokens || 0;
        break;
        
      case 'zhipu':
        content = response.choices[0].message.content;
        inputTokens = response.usage?.prompt_tokens || 0;
        outputTokens = response.usage?.completion_tokens || 0;
        break;
        
      default:
        // 尝试通用提取方法
        if (response.choices && response.choices[0]?.message?.content) {
          content = response.choices[0].message.content;
        } else if (response.content) {
          content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        } else if (response.result) {
          content = response.result;
        } else {
          content = '无法解析响应内容，请查看原始JSON。';
        }
    }
    
    // 应用基本的Markdown格式
    content = formatMarkdown(content);
    
    // 更新响应内容
    elements.responseContent.innerHTML = content;
    
    // 更新token信息
    const totalTokens = inputTokens + outputTokens;
    elements.responseTokens.innerHTML = `
      <span>输入: ${inputTokens} tokens</span>
      <span>输出: ${outputTokens} tokens</span>
      <span>总计: ${totalTokens} tokens</span>
    `;
    
    // 更新响应时间
    elements.responseTime.innerHTML = `<span>响应时间: ${responseTime}ms</span>`;
    
  } catch (error) {
    console.error('解析响应失败:', error);
    elements.responseContent.innerHTML = `<div class="error">解析响应失败: ${error.message}</div>`;
  }
}

/**
 * 简单的Markdown格式化
 */
function formatMarkdown(text) {
  if (!text) return '';
  
  // 转义HTML
  text = text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
  
  // 代码块 (```)
  text = text.replace(/```(\w*)([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>');
  
  // 行内代码 (`)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 粗体 (**)
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 斜体 (*)
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // 标题
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // 链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // 换行
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

/**
 * 添加到历史记录
 */
function addToHistory(prompt, response) {
  // 限制历史记录长度（保留最新的10条）
  if (apiHistory.length >= 10) {
    apiHistory.shift();
  }
  
  // 创建历史记录项
  const historyItem = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    prompt: prompt,
    response: response,
    settings: { ...apiSettings }
  };
  
  // 添加到历史记录数组
  apiHistory.push(historyItem);
  
  // 更新历史记录UI
  updateHistoryUI();
}

/**
 * 更新历史记录UI
 */
function updateHistoryUI() {
  // 清空当前历史记录列表
  elements.historyList.innerHTML = '';
  
  if (apiHistory.length === 0) {
    elements.historyList.innerHTML = '<div class="no-history">暂无历史记录</div>';
    return;
  }
  
  // 倒序显示历史记录（最新的在前面）
  apiHistory.slice().reverse().forEach(item => {
    const historyElement = document.createElement('div');
    historyElement.className = 'history-item';
    historyElement.dataset.id = item.id;
    
    // 截取提示词作为显示文本
    const promptPreview = item.prompt.length > 30 
      ? item.prompt.substring(0, 30) + '...' 
      : item.prompt;
    
    // 格式化时间
    const date = new Date(item.timestamp);
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    historyElement.textContent = `${timeStr} - ${promptPreview}`;
    
    // 点击加载历史记录
    historyElement.addEventListener('click', () => loadHistoryItem(item.id));
    
    elements.historyList.appendChild(historyElement);
  });
}

/**
 * 加载历史记录项
 */
function loadHistoryItem(id) {
  console.log(`尝试加载历史记录项 (ID: ${id})`);
  
  // 防止重复加载的保护
  if (window.loadingHistoryItem) {
    console.warn('历史记录正在加载中，忽略当前请求');
    return;
  }
  window.loadingHistoryItem = true;
  
  try {
    const item = apiHistory.find(h => h.id === id);
    if (!item) {
      console.error(`未找到ID为${id}的历史记录项`);
      window.loadingHistoryItem = false;
      return;
    }
    
    console.log('加载历史记录项:', item);
    
    // 在进行任何更新之前，确保全局请求锁定是激活的
    window.globalRequestLock.locked = true;
    // 确保不允许非用户点击请求
    window.allowApiRequestWithoutClick = false;
    
    // 加载设置
    elements.providerSelect.value = item.settings.provider;
    elements.endpointInput.value = item.settings.endpoint;
    
    // 暂时禁用所有按钮，防止用户操作干扰加载过程
    const sendBtnState = elements.sendBtn.disabled;
    elements.sendBtn.disabled = true;
    
    // 加载提供商设置，但不触发其他事件
    try {
      console.log(`从历史记录加载提供商设置: ${item.settings.provider}`);
      
      // 直接更新模型列表，而不是通过handleProviderChange
      if (item.settings.provider && API_PRESETS[item.settings.provider]) {
        const preset = API_PRESETS[item.settings.provider];
        
        // 清空并重新填充模型选项
        while (elements.modelSelect.options.length > 0) {
          elements.modelSelect.remove(0);
        }
        
        // 添加该提供商的模型
        preset.models.forEach(model => {
          const option = document.createElement('option');
          option.value = model;
          option.textContent = model;
          elements.modelSelect.add(option);
        });
        
        // 添加自定义选项
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '自定义模型名称';
        elements.modelSelect.add(customOption);
      }
    } catch (err) {
      console.error('加载提供商设置时出错:', err);
    }
    
    // 设置模型
    console.log(`设置模型选择: ${item.settings.model}`);
    if (API_PRESETS[item.settings.provider] && 
        API_PRESETS[item.settings.provider].models.includes(item.settings.model)) {
      elements.modelSelect.value = item.settings.model;
    } else {
      elements.modelSelect.value = 'custom';
      elements.customModelInput.value = item.settings.model;
      elements.customModelInput.style.display = 'block';
    }
    
    // 更新apiSettings对象
    apiSettings.provider = item.settings.provider;
    apiSettings.endpoint = item.settings.endpoint;
    apiSettings.model = item.settings.model;
    apiSettings.temperature = item.settings.temperature;
    
    // 设置温度
    elements.temperatureSlider.value = item.settings.temperature;
    elements.temperatureValue.textContent = item.settings.temperature;
    
    // 加载消息内容
    const systemMsg = item.prompt.startsWith("System: ") 
      ? item.prompt.substring(8, item.prompt.indexOf("\nUser: "))
      : "";
    
    const userMsg = systemMsg 
      ? item.prompt.substring(item.prompt.indexOf("\nUser: ") + 7)
      : item.prompt;
    
    elements.systemMessage.value = systemMsg;
    elements.userMessage.value = userMsg;
    
    // 直接显示保存的响应，而不是请求新响应
    console.log('直接显示历史记录中的响应，而不发送新请求');
    displayResponse(item.response, 0);
    
    // 恢复按钮状态
    setTimeout(() => {
      elements.sendBtn.disabled = sendBtnState;
    }, 200);
    
    showNotification('已加载历史记录', 'info');
  } catch (error) {
    console.error('加载历史记录时出错:', error);
    showNotification('加载历史记录失败', 'error');
  } finally {
    // 解除加载中状态
    window.loadingHistoryItem = false;
  }
}

/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
  // 检查是否已有通知
  let notification = document.querySelector('.notification');
  
  if (notification) {
    // 移除之前的通知
    notification.remove();
  }
  
  // 创建新通知
  notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // 3秒后自动关闭
  setTimeout(() => {
    notification.classList.add('fadeout');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * 初始化事件监听器 - 全新重写的版本
 */
function initEventListeners() {
  console.log('全新方式初始化事件监听器...');
  
  // 重置全局状态标志
  window.currentlySendingRequest = false;
  window.requestInProgress = false;
  window.sendButtonClicked = false;
  window.allowApiRequestWithoutClick = false;
  window.globalRequestLock.locked = true;
  window.lastEventTimestamp = 0;
  window.activeRequests = new Set();
  
  // 先移除所有现有的事件监听器
  console.log('清理旧的事件监听器');
  const sendBtn = elements.sendBtn;
  if (sendBtn) {
    // 先移除所有已存在的事件监听器
    if (sendBtn._clickHandlers) {
      sendBtn._clickHandlers.forEach(handler => {
        sendBtn.removeEventListener('click', handler, true);
      });
    }
    
    // 创建全新的按钮元素替换旧的，彻底断开所有事件
    const newSendBtn = document.createElement('button');
    
    // 复制原按钮的所有属性
    Array.from(sendBtn.attributes).forEach(attr => {
      newSendBtn.setAttribute(attr.name, attr.value);
    });
    
    // 设置内容和样式
    newSendBtn.innerHTML = sendBtn.innerHTML;
    newSendBtn.textContent = '发送请求';
    newSendBtn.disabled = false;
    newSendBtn.className = sendBtn.className;
    newSendBtn._clickHandlers = [];
    
    // 使用父节点替换按钮
    if (sendBtn.parentNode) {
      sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    }
    
    // 更新引用
    elements.sendBtn = newSendBtn;
    console.log('发送按钮已完全重新创建');
  } else {
    console.error('无法找到发送按钮元素');
  }
  
  // 重新注册事件，使用新的事件控制系统
  // 1. API提供商选择变更
  if (elements.providerSelect) {
    window.eventControl.addListener(elements.providerSelect, 'change', function(e) {
      console.log('提供商选择变更事件触发');
      handleProviderChange(true);
    });
  }
  
  // 2. 模型选择变更
  if (elements.modelSelect) {
    window.eventControl.addListener(elements.modelSelect, 'change', handleModelChange);
  }
  
  // 3. 温度滑块变更
  if (elements.temperatureSlider) {
    window.eventControl.addListener(elements.temperatureSlider, 'input', handleTemperatureChange);
  }
  
  // 4. 切换API密钥可见性
  if (elements.toggleTokenBtn) {
    window.eventControl.addListener(elements.toggleTokenBtn, 'click', toggleApiKeyVisibility);
  }
  
  // 5. 发送请求按钮 - 完全重写以解决重复发送问题
  if (elements.sendBtn) {
    // 定义一个独立的处理函数
    const handleButtonClick = async function(event) {
      // 记录事件源详细信息
      const eventSource = {
        type: event.type,
        target: event.target.id || event.target.tagName,
        timestamp: Date.now(),
        eventId: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      };
      
      console.log('事件源信息:', eventSource);
      
      // 阻止事件冒泡和默认行为
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // 检查事件时间戳，防止短时间内重复点击
      if (window.lastEventTimestamp && eventSource.timestamp - window.lastEventTimestamp < 2000) {
        console.warn(`已阻止快速重复点击 (间隔: ${eventSource.timestamp - window.lastEventTimestamp}ms)`);
        showNotification('点击过于频繁，请稍后再试', 'warning');
        return false;
      }
      window.lastEventTimestamp = eventSource.timestamp;
      
      console.log(`==== 发送按钮被点击 (${eventSource.eventId}) ====`, new Date().toISOString());
      
      // 防止重入，如果已经处理中，直接忽略
      if (window.sendButtonClicked === true) {
        console.warn('按钮点击处理已经在进行中，忽略重复点击');
        showNotification('请等待当前请求完成', 'warning');
        return false;
      }
      
      // 如果按钮被禁用，不处理点击
      if (elements.sendBtn.disabled) {
        console.warn('按钮已禁用，忽略点击');
        return false;
      }
      
      // 设置标志，防止重入
      window.sendButtonClicked = true;
      
      // 禁用按钮，防止重复点击
      elements.sendBtn.disabled = true;
      elements.sendBtn.textContent = '请求中...';
      
      // 显示加载状态
      if (elements.responseContent) {
        elements.responseContent.innerHTML = '<div class="loading">正在请求API，请稍候...</div>';
      }
      
      if (elements.rawResponseContent) {
        elements.rawResponseContent.textContent = '';
      }
      
      const requestStartTime = Date.now();
      const requestId = `req_${requestStartTime}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 追踪请求，并关联触发事件
      window.activeRequests.add({
        id: requestId,
        startTime: requestStartTime,
        eventSource: eventSource
      });
      
      try {
        // 检查是否已有请求在处理中
        if (window.requestInProgress === true || window.currentlySendingRequest === true) {
          throw new Error('已有另一个请求正在处理中');
        }
        
        // 标记请求开始
        window.requestInProgress = true;
        
        // 解锁请求
        window.globalRequestLock.locked = false;
        window.allowApiRequestWithoutClick = true;
        
        // 发送API请求（使用await，但添加超时保护）
        console.log(`[${requestId}] 开始发送请求...`);
        
        // 添加请求超时控制
        let abortController = new AbortController();
        let timeoutId = setTimeout(() => {
          abortController.abort();
          console.error(`[${requestId}] 请求超时，已中止`);
        }, 60000);
        
        try {
          const response = await sendApiRequest();
          console.log(`[${requestId}] 请求成功完成`);
        } catch (error) {
          console.error(`[${requestId}] 请求执行失败:`, error);
          // 显示错误但不重试
          if (elements.responseContent && error.message !== 'DUPLICATE_REQUEST_ATTEMPT') {
            elements.responseContent.innerHTML = `<div class="error">请求失败: ${error.message}</div>`;
          }
        } finally {
          clearTimeout(timeoutId);
        }
        
      } catch (error) {
        // 处理所有错误但不重试
        console.error(`[${requestId}] 处理过程出错:`, error);
        
        if (error.message !== 'DUPLICATE_REQUEST_ATTEMPT' && 
            error.message !== 'REQUEST_LOCKED' && 
            error.message !== 'USER_AUTHORIZATION_REQUIRED') {
          
          showNotification(`请求失败: ${error.message}`, 'error');
        }
      } finally {
        // 清理请求追踪
        window.activeRequests.forEach(req => {
          if (req.id === requestId) {
            window.activeRequests.delete(req);
          }
        });
        
        // 无论如何，确保所有标志都被重置
        window.sendButtonClicked = false;
        window.requestInProgress = false;
        window.allowApiRequestWithoutClick = false;
        window.globalRequestLock.locked = true;
        
        // 延迟恢复按钮状态，防止快速重复点击
        setTimeout(() => {
          if (elements.sendBtn) {
            elements.sendBtn.disabled = false;
            elements.sendBtn.textContent = '发送请求';
          }
        }, 2000); // 延长到2秒，增强防误触能力
        
        console.log(`[${requestId}] 所有状态标志已重置，总耗时: ${Date.now() - requestStartTime}ms`);
      }
      
      return false;
    };
    
    // 保存处理函数引用
    if (!elements.sendBtn._clickHandlers) {
      elements.sendBtn._clickHandlers = [];
    }
    elements.sendBtn._clickHandlers.push(handleButtonClick);
    
    // 使用原生DOM API添加事件监听器，捕获阶段处理
    elements.sendBtn.addEventListener('click', handleButtonClick, {
      capture: true,  // 在捕获阶段处理
      passive: false, // 允许preventDefault
      once: false     // 不是一次性监听器
    });
    
    console.log('发送按钮事件使用纯DOM API绑定完成');
  }
  
  // 添加全局错误处理，防止错误导致的重试循环
  window.addEventListener('error', function(event) {
    console.error('全局错误捕获:', event.error || event.message);
    // 确保错误不会导致自动重试请求
    window.sendButtonClicked = false;
    window.requestInProgress = false;
    window.allowApiRequestWithoutClick = false;
    window.globalRequestLock.locked = true;
    
    // 如果按钮被锁定，延迟恢复
    if (elements.sendBtn && elements.sendBtn.disabled) {
      setTimeout(() => {
        elements.sendBtn.disabled = false;
        elements.sendBtn.textContent = '发送请求';
      }, 1000);
    }
  });
  
  // 添加全局未处理的Promise拒绝处理
  window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
    // 确保Promise错误不会导致自动重试请求
    window.sendButtonClicked = false;
    window.requestInProgress = false;
    window.allowApiRequestWithoutClick = false;
    window.globalRequestLock.locked = true;
    
    // 如果按钮被锁定，延迟恢复
    if (elements.sendBtn && elements.sendBtn.disabled) {
      setTimeout(() => {
        elements.sendBtn.disabled = false;
        elements.sendBtn.textContent = '发送请求';
      }, 1000);
    }
  });
  
  // 6. 清空表单
  if (elements.clearBtn) {
    window.eventControl.addListener(elements.clearBtn, 'click', clearForm);
  }
  
  // 7. 保存设置
  if (elements.saveSettingsBtn) {
    window.eventControl.addListener(elements.saveSettingsBtn, 'click', saveSettings);
  }
  
  // 8. 响应标签切换
  if (elements.responseTabs) {
    elements.responseTabs.forEach(tab => {
      window.eventControl.addListener(tab, 'click', handleTabClick);
    });
  }
  
  // 输出调试信息
  window.eventControl.printListeners();
  console.log('事件监听器初始化完成（新版本）');
}

/**
 * 处理标签点击事件
 */
function handleTabClick(e) {
  // 移除所有标签的active类
  elements.responseTabs.forEach(t => t.classList.remove('active'));
  
  // 添加当前标签的active类
  e.target.classList.add('active');
  
  // 显示相应的内容
  const tabId = e.target.getAttribute('data-tab');
  document.querySelectorAll('.ai-tester-output .tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabId}-tab`).classList.add('active');
}

// 当面板DOM加载完成时初始化工具
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM已加载，准备初始化AI API测试工具');
  
  // 重置初始化标志，确保在页面刷新后能重新初始化
  aiTesterInitialized = false;
  
  // 防止重复初始化的保护措施
  if (window.aiTesterInitialized) {
    console.log('AI API测试工具已经在其他地方初始化，跳过');
    return;
  }
  window.aiTesterInitialized = true;
  
  // 初始化AI API测试工具
  setTimeout(() => {
    // 再次检查，防止延迟期间被其他地方初始化
    if (!aiTesterInitialized) {
      console.log('延迟初始化AI API测试工具');
      initAITester();
    } else {
      console.log('延迟期间AI API测试工具已被初始化，不再重复初始化');
    }
  }, 100); // 短暂延迟初始化，避免可能的竞态条件
}); 