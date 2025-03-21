/**
 * JSON 格式化工具
 * 功能：格式化 JSON、压缩 JSON、去除转义符、添加转义符
 */

// 使用全局变量命名空间防止变量重复声明
// 只有当全局变量未定义时才进行定义
if (typeof window.jsonFormatterInitialized === 'undefined') {
  // 标记为已初始化，防止重复执行
  window.jsonFormatterInitialized = false;
  
  // 全局 DOM 元素引用
  window.jsonInput = null;
  window.jsonOutput = null;
  window.formatButton = null;
  window.minifyButton = null;
  window.removeEscapesButton = null;
  window.addEscapesButton = null;
  window.clearButton = null;
  window.copyButton = null;
}

// 直接绑定事件处理程序（替代函数方式）
function setupEventHandlers() {
  console.log('Direct setup of event handlers');
  
  // 格式化 JSON
  document.getElementById('format-json')?.addEventListener('click', function() {
    console.log('Format button clicked (inline)');
    const jsonText = document.getElementById('json-input').value.trim();
    if (!jsonText) {
      showJsonNotification('warning', '请输入 JSON 文本');
      return;
    }
    
    try {
      const result = formatJson(jsonText);
      updateJsonOutput(result, true);
      showJsonNotification('success', 'JSON 格式化成功');
    } catch (error) {
      updateJsonOutput(`错误: ${error.message}`, false);
      showJsonNotification('error', '无效的 JSON 格式');
    }
  });
  
  // 压缩 JSON
  document.getElementById('minify-json')?.addEventListener('click', function() {
    console.log('Minify button clicked (inline)');
    const jsonText = document.getElementById('json-input').value.trim();
    if (!jsonText) {
      showJsonNotification('warning', '请输入 JSON 文本');
      return;
    }
    
    try {
      const result = minifyJson(jsonText);
      updateJsonOutput(result, true);
      showJsonNotification('success', 'JSON 压缩成功');
    } catch (error) {
      updateJsonOutput(`错误: ${error.message}`, false);
      showJsonNotification('error', '无效的 JSON 格式');
    }
  });
  
  // 去除转义符
  document.getElementById('remove-escapes')?.addEventListener('click', function() {
    console.log('Remove escapes button clicked (inline)');
    const text = document.getElementById('json-input').value;
    if (!text) {
      showJsonNotification('warning', '请输入需要处理的文本');
      return;
    }
    
    const result = removeEscapes(text);
    
    // 尝试格式化结果（如果结果是有效的 JSON）
    try {
      const formatted = formatJson(result);
      updateJsonOutput(formatted, true);
    } catch (e) {
      // 如果不是有效的 JSON，保持原样显示
      updateJsonOutput(result, false);
    }
    
    showJsonNotification('success', '转义符号已去除');
  });
  
  // 添加转义符
  document.getElementById('add-escapes')?.addEventListener('click', function() {
    console.log('Add escapes button clicked (inline)');
    const text = document.getElementById('json-input').value;
    if (!text) {
      showJsonNotification('warning', '请输入需要处理的文本');
      return;
    }
    
    const result = addEscapes(text);
    updateJsonOutput(result, true);
    showJsonNotification('success', '已添加转义符号');
  });
  
  // 清空
  document.getElementById('clear-json')?.addEventListener('click', function() {
    console.log('Clear button clicked (inline)');
    document.getElementById('json-input').value = '';
    updateJsonOutput('', false);
    document.getElementById('json-input').focus();
    showJsonNotification('info', '已清空');
  });
  
  // 复制结果
  document.getElementById('copy-json')?.addEventListener('click', function() {
    console.log('Copy button clicked (inline)');
    const text = document.getElementById('json-output').textContent;
    if (!text) {
      showJsonNotification('warning', '没有可复制的内容');
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        showJsonNotification('success', '已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        showJsonNotification('error', '复制失败');
      });
  });
  
  // 自动处理粘贴事件
  document.getElementById('json-input')?.addEventListener('paste', function() {
    // 延迟执行，确保粘贴的内容已经在输入框中
    setTimeout(() => {
      const text = document.getElementById('json-input').value.trim();
      if (text && (text.startsWith('{') || text.startsWith('['))) {
        try {
          const result = formatJson(text);
          updateJsonOutput(result, true);
        } catch (e) {
          // 如果不是有效的 JSON，不进行处理
        }
      }
    }, 100);
  });
  
  console.log('All event handlers set up directly');
}

// 初始化函数，将在脚本加载和DOM事件时都尝试执行
function initJsonFormatter() {
  // 如果已经初始化过，则跳过
  if (window.jsonFormatterInitialized) {
    console.log('JSON formatter already initialized, skipping');
    return true;
  }
  
  console.log('Initializing JSON formatter...');
  console.log('Document readyState:', document.readyState);
  
  // 检查页面是否完全加载
  if (document.readyState === 'loading') {
    console.log('Document still loading, will wait for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded fired, initializing formatter');
      initJsonFormatter();
    });
    return false;
  }
  
  // 检查是否在JSON格式化工具面板
  const jsonFormatterPanel = document.getElementById('json-formatter-tool');
  if (!jsonFormatterPanel) {
    console.log('JSON formatter panel not found');
    return false;
  }
  
  // 检查格式化工具面板是否激活
  const isPanelActive = jsonFormatterPanel.classList.contains('active');
  console.log('JSON formatter panel active:', isPanelActive);
  
  // 即使面板不活跃，我们也初始化以确保事件处理程序被设置
  
  // 初始化 DOM 元素引用
  window.jsonInput = document.getElementById('json-input');
  window.jsonOutput = document.getElementById('json-output');
  window.formatButton = document.getElementById('format-json');
  window.minifyButton = document.getElementById('minify-json');
  window.removeEscapesButton = document.getElementById('remove-escapes');
  window.addEscapesButton = document.getElementById('add-escapes');
  window.clearButton = document.getElementById('clear-json');
  window.copyButton = document.getElementById('copy-json');
  
  // 日志所有元素的状态
  console.log('DOM Elements status:');
  console.log('- jsonInput:', window.jsonInput ? 'Found' : 'Missing');
  console.log('- jsonOutput:', window.jsonOutput ? 'Found' : 'Missing');
  console.log('- formatButton:', window.formatButton ? 'Found' : 'Missing');
  console.log('- minifyButton:', window.minifyButton ? 'Found' : 'Missing');
  console.log('- removeEscapesButton:', window.removeEscapesButton ? 'Found' : 'Missing');
  console.log('- addEscapesButton:', window.addEscapesButton ? 'Found' : 'Missing');
  console.log('- clearButton:', window.clearButton ? 'Found' : 'Missing');
  console.log('- copyButton:', window.copyButton ? 'Found' : 'Missing');
  
  // 检查元素是否存在
  if (!window.jsonInput || !window.jsonOutput) {
    console.log('JSON formatter elements not found, will try again later.');
    return false;
  }
  
  console.log('JSON formatter elements found, setting up event listeners.');
  
  // 设置左右布局结构
  setupJsonContentLayout();
  
  // 改为直接设置事件处理程序
  setupEventHandlers();
  
  // 标记为已初始化
  window.jsonFormatterInitialized = true;
  
  console.log('JSON formatter initialized successfully.');
  return true;
}

/**
 * 设置JSON格式化工具的左右布局结构
 */
function setupJsonContentLayout() {
  console.log('Setting up JSON content layout');
  
  try {
    const container = document.querySelector('.json-formatter-container');
    if (!container) {
      console.log('Container not found for JSON layout');
      return;
    }
    
    // 查找或创建content-area容器
    let contentArea = document.querySelector('.json-content-area');
    if (contentArea) {
      console.log('Content area already exists');
      return;
    }
    
    // 查找编辑器和输出区域
    const editor = document.querySelector('.json-editor');
    const output = document.querySelector('.json-output-container');
    
    if (!editor || !output) {
      console.log('Editor or output not found');
      return;
    }
    
    // 创建内容区容器
    contentArea = document.createElement('div');
    contentArea.className = 'json-content-area';
    
    // 临时存储toolbar元素，稍后重新附加
    const toolbar = document.querySelector('.json-toolbar');
    
    // 清空容器
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // 重新构建布局
    if (toolbar) {
      container.appendChild(toolbar);
    }
    
    container.appendChild(contentArea);
    contentArea.appendChild(editor);
    contentArea.appendChild(output);
    
    console.log('JSON content layout successfully set up');
  } catch (error) {
    console.error('Error setting up JSON content layout:', error);
  }
}

// 格式化 JSON 按钮事件处理函数
function formatJsonHandler() {
  console.log('Format button clicked');
  const jsonText = window.jsonInput.value.trim();
  if (!jsonText) {
    showJsonNotification('warning', '请输入 JSON 文本');
    return;
  }
  
  try {
    const result = formatJson(jsonText);
    updateJsonOutput(result, true);
    showJsonNotification('success', 'JSON 格式化成功');
  } catch (error) {
    updateJsonOutput(`错误: ${error.message}`, false);
    showJsonNotification('error', '无效的 JSON 格式');
  }
}

// 压缩 JSON 按钮事件处理函数
function minifyJsonHandler() {
  console.log('Minify button clicked');
  const jsonText = window.jsonInput.value.trim();
  if (!jsonText) {
    showJsonNotification('warning', '请输入 JSON 文本');
    return;
  }
  
  try {
    const result = minifyJson(jsonText);
    updateJsonOutput(result, true);
    showJsonNotification('success', 'JSON 压缩成功');
  } catch (error) {
    updateJsonOutput(`错误: ${error.message}`, false);
    showJsonNotification('error', '无效的 JSON 格式');
  }
}

// 去除转义符按钮事件处理函数
function removeEscapesHandler() {
  console.log('Remove escapes button clicked');
  const text = window.jsonInput.value;
  if (!text) {
    showJsonNotification('warning', '请输入需要处理的文本');
    return;
  }
  
  const result = removeEscapes(text);
  
  // 尝试格式化结果（如果结果是有效的 JSON）
  try {
    const formatted = formatJson(result);
    updateJsonOutput(formatted, true);
  } catch (e) {
    // 如果不是有效的 JSON，保持原样显示
    updateJsonOutput(result, false);
  }
  
  showJsonNotification('success', '转义符号已去除');
}

// 添加转义符按钮事件处理函数
function addEscapesHandler() {
  console.log('Add escapes button clicked');
  const text = window.jsonInput.value;
  if (!text) {
    showJsonNotification('warning', '请输入需要处理的文本');
    return;
  }
  
  const result = addEscapes(text);
  updateJsonOutput(result, true);
  showJsonNotification('success', '已添加转义符号');
}

// 清空按钮事件处理函数
function clearJsonHandler() {
  console.log('Clear button clicked');
  window.jsonInput.value = '';
  updateJsonOutput('', false);
  window.jsonInput.focus();
  showJsonNotification('info', '已清空');
}

// 复制按钮事件处理函数
function copyJsonHandler() {
  console.log('Copy button clicked');
  const text = window.jsonOutput.textContent;
  if (!text) {
    showJsonNotification('warning', '没有可复制的内容');
    return;
  }
  
  navigator.clipboard.writeText(text)
    .then(() => {
      showJsonNotification('success', '已复制到剪贴板');
    })
    .catch(err => {
      console.error('复制失败:', err);
      showJsonNotification('error', '复制失败');
    });
}

// 输入框粘贴事件处理函数
function jsonInputPasteHandler() {
  // 延迟执行，确保粘贴的内容已经在输入框中
  setTimeout(() => {
    const text = window.jsonInput.value.trim();
    if (text && (text.startsWith('{') || text.startsWith('['))) {
      try {
        const result = formatJson(text);
        updateJsonOutput(result, true);
      } catch (e) {
        // 如果不是有效的 JSON，不进行处理
      }
    }
  }, 100);
}

/**
 * 更新JSON输出内容，并在需要时滚动到顶部
 * @param {string} content - 要显示的内容
 * @param {boolean} highlight - 是否应用语法高亮
 */
function updateJsonOutput(content, highlight = false) {
  // 总是尝试通过ID获取元素，以防引用已经失效
  const outputElement = document.getElementById('json-output');
  if (!outputElement) {
    console.error('JSON output element not found by ID');
    return;
  }
  
  // 设置内容
  outputElement.textContent = content;
  
  // 应用语法高亮（如果需要）
  if (highlight && content) {
    try {
      highlightJson(outputElement);
    } catch (error) {
      console.error('Error applying syntax highlighting:', error);
    }
  }
  
  // 滚动到顶部
  try {
    outputElement.scrollTop = 0;
  } catch (error) {
    console.error('Error scrolling to top:', error);
  }
}

/**
 * 格式化 JSON 字符串
 * @param {string} jsonStr - JSON 字符串
 * @returns {string} 格式化后的 JSON 字符串
 */
function formatJson(jsonStr) {
  // 先尝试去除转义符
  let processedStr = jsonStr;
  
  // 如果字符串被引号包围且包含转义的引号，尝试处理它
  if ((jsonStr.startsWith('"') && jsonStr.endsWith('"')) || 
      (jsonStr.startsWith("'") && jsonStr.endsWith("'"))) {
    try {
      // 尝试解析为 JavaScript 字符串
      const evalResult = eval(jsonStr);
      if (typeof evalResult === 'string') {
        processedStr = evalResult;
      }
    } catch (e) {
      // 如果解析失败，继续使用原始字符串
    }
  }
  
  // 尝试解析 JSON
  let parsed;
  try {
    parsed = JSON.parse(processedStr);
  } catch (e) {
    // 如果解析失败，尝试将字符串包装在引号中再解析
    try {
      parsed = JSON.parse(`"${processedStr.replace(/"/g, '\\"')}"`);
      return parsed; // 如果成功，返回解析后的字符串
    } catch (e2) {
      // 如果还是失败，抛出原始错误
      throw e;
    }
  }
  
  // 格式化并返回
  return JSON.stringify(parsed, null, 2);
}

/**
 * 压缩 JSON 字符串
 * @param {string} jsonStr - JSON 字符串
 * @returns {string} 压缩后的 JSON 字符串
 */
function minifyJson(jsonStr) {
  // 尝试解析为 JSON 对象，然后不带格式化地重新序列化
  const obj = JSON.parse(jsonStr);
  return JSON.stringify(obj);
}

/**
 * 去除字符串中的转义符
 * @param {string} str - 包含转义符的字符串
 * @returns {string} 去除转义符后的字符串
 */
function removeEscapes(str) {
  // 处理常见的 JSON 转义场景
  if (str.includes('\\')) {
    // 如果字符串是被引号包围的，先去掉外层引号
    let processed = str;
    if ((str.startsWith('"') && str.endsWith('"')) || 
        (str.startsWith("'") && str.endsWith("'"))) {
      processed = str.substring(1, str.length - 1);
    }
    
    // 处理常见的转义字符
    return processed
      .replace(/\\"/g, '"')     // 双引号
      .replace(/\\'/g, "'")     // 单引号
      .replace(/\\\\/g, '\\')   // 反斜杠
      .replace(/\\n/g, '\n')    // 换行
      .replace(/\\r/g, '\r')    // 回车
      .replace(/\\t/g, '\t')    // 制表符
      .replace(/\\b/g, '\b')    // 退格
      .replace(/\\f/g, '\f');   // 换页
  }
  
  return str;
}

/**
 * 为字符串添加转义符
 * @param {string} str - 原始字符串
 * @returns {string} 添加转义符后的字符串
 */
function addEscapes(str) {
  return JSON.stringify(str).slice(1, -1);
}

/**
 * 对 JSON 文本进行语法高亮
 * @param {HTMLElement} element - 包含 JSON 文本的元素
 */
function highlightJson(element) {
  const text = element.textContent;
  
  if (!text) return;
  
  // 先预处理文本，以便于后续正则匹配
  let processedText = text
    // 为每行添加行首标记用于后续处理
    .split('\n')
    .map(line => `LINE_START${line}`)
    .join('\n');
  
  // 高亮键名（更精确的匹配）
  let highlighted = processedText.replace(
    /LINE_START(\s*)("(?:\\.|[^"\\])*")(\s*):/g, 
    'LINE_START$1<span class="json-key">$2</span>$3:'
  );
  
  // 高亮字符串值（处理多行字符串）
  highlighted = highlighted.replace(
    /: (\s*)("(?:\\.|[^"\\])*")/g, 
    ': $1<span class="json-value-string">$2</span>'
  );
  
  // 高亮数字
  highlighted = highlighted.replace(
    /: (\s*)([-]?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    ': $1<span class="json-value-number">$2</span>'
  );
  
  // 高亮布尔值和null
  highlighted = highlighted.replace(
    /: (\s*)(true|false|null)(?=[\s,\n\r}]|$)/g,
    function(match, space, value) {
      return `: ${space}<span class="json-value-${value.toLowerCase()}">${value}</span>`;
    }
  );
  
  // 高亮括号和逗号
  highlighted = highlighted.replace(
    /(LINE_START\s*)([{}\[\]])/g, 
    '$1<span class="json-bracket">$2</span>'
  );
  
  highlighted = highlighted.replace(
    /([{}\[\]])([\s\n\r]*$)/g, 
    '<span class="json-bracket">$1</span>$2'
  );
  
  highlighted = highlighted.replace(
    /,/g, 
    '<span class="json-punctuation">,</span>'
  );
  
  // 删除行首标记
  highlighted = highlighted.replace(/LINE_START/g, '');
  
  // 添加缩进可视化指示
  highlighted = addIndentGuides(highlighted);
  
  // 添加行号
  highlighted = addLineNumbers(highlighted);
  
  element.innerHTML = highlighted;
  element.classList.add('with-line-numbers');
}

/**
 * 添加行号
 * @param {string} html - 已经高亮处理的HTML文本
 * @returns {string} 添加行号的HTML
 */
function addLineNumbers(html) {
  const lines = html.split('\n');
  const lineNumbersHtml = lines.map((line, index) => {
    const lineNumber = index + 1;
    return `<div class="json-line"><span class="line-number">${lineNumber}</span><span class="line-content">${line}</span></div>`;
  }).join('');
  
  return `<div class="json-with-line-numbers">${lineNumbersHtml}</div>`;
}

/**
 * 添加缩进可视化指示
 * @param {string} html - 已经高亮处理的HTML文本
 * @returns {string} 添加缩进指示的HTML
 */
function addIndentGuides(html) {
  const lines = html.split('\n');
  return lines.map(line => {
    // 计算缩进级别（每两个空格算一级）
    const indent = line.match(/^\s*/)[0];
    const indentLevel = Math.floor(indent.length / 2);
    
    if (indentLevel > 0) {
      // 替换空格为特殊的缩进指示符
      const visibleIndent = '<span class="indent-guide"></span>'.repeat(indentLevel);
      return line.replace(/^\s+/, () => visibleIndent);
    }
    
    return line;
  }).join('\n');
}

// 显示通知
function showNotification(type, message) {
  // 移除所有现有的通知
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // 2秒后自动消失
  setTimeout(() => {
    notification.classList.add('fadeout');
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 2000);
}

// 显示JSON格式化工具的通知
function showJsonNotification(type, message) {
  // 移除所有现有的通知
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // 2秒后自动消失
  setTimeout(() => {
    notification.classList.add('fadeout');
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 2000);
}

// 在窗口加载完成后尝试初始化
window.addEventListener('load', function() {
  console.log('Window load event fired');
  // 延迟确保DOM完全加载
  setTimeout(function() {
    console.log('Attempting initialization after window load');
    if (!window.jsonFormatterInitialized) {
      initJsonFormatter();
      handleResize();
    }
  }, 200);
});

// 尝试立即初始化
console.log('Attempting immediate initialization');
let initialized = initJsonFormatter();

// 添加窗口调整大小的处理函数
function handleResize() {
  // 如果未初始化，则跳过
  if (!window.jsonFormatterInitialized) {
    console.log('Skipping resize, formatter not initialized');
    return;
  }
  
  // 获取工具容器
  const container = document.querySelector('.json-formatter-container');
  if (!container) {
    console.log('Container not found during resize');
    return;
  }
  
  // 获取工具面板的可见高度
  const toolPanel = document.getElementById('json-formatter-tool');
  if (!toolPanel) {
    console.log('Tool panel not found during resize');
    return;
  }
  
  if (!toolPanel.classList.contains('active')) {
    console.log('Tool panel not active during resize');
    return;
  }
  
  // 获取输入和输出区域
  const editor = document.querySelector('.json-editor');
  const output = document.querySelector('.json-output-container');
  if (!editor || !output) {
    console.log('Editor or output not found during resize');
    return;
  }
  
  // 获取容器高度以确保整体布局合理
  const containerHeight = container.clientHeight;
  const toolbarHeight = document.querySelector('.json-toolbar')?.clientHeight || 0;
  // 增加顶部边距，为标题留出空间
  const availableHeight = containerHeight - toolbarHeight - 60;
  
  // 确保内容区域高度合理，考虑标题位置
  const jsonContentArea = document.querySelector('.json-content-area');
  if (jsonContentArea) {
    jsonContentArea.style.height = `${availableHeight}px`;
  }
  
  // 确保输入框和输出区域的大小合适
  const jsonInput = document.getElementById('json-input');
  const jsonOutput = document.getElementById('json-output');
  
  if (jsonInput) {
    jsonInput.style.height = '100%';
  }
  
  if (jsonOutput) {
    jsonOutput.style.height = '100%';
  }
  
  console.log('Resized JSON formatter layout for side-by-side view');
}

// 添加窗口大小改变事件监听
window.addEventListener('resize', handleResize);

// 如果直接初始化失败，等待 DOMContentLoaded 事件
if (!initialized && !window.jsonFormatterInitialized) {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    setTimeout(function() {
      console.log('Attempting initialization after DOMContentLoaded');
      if (!window.jsonFormatterInitialized) {
        initJsonFormatter();
        handleResize();
      }
    }, 200);
  });
}

// 为工具切换提供支持，当工具面板显示时重新初始化
window.addEventListener('hashchange', () => {
  console.log('Hash changed to:', window.location.hash);
  if (window.location.hash === '#json-formatter') {
    // 如果切换到 JSON 格式化工具，稍微延迟以确保 DOM 已更新
    setTimeout(() => {
      console.log('Initializing after hash change to json-formatter');
      // 每次工具切换都重新初始化
      window.jsonFormatterInitialized = false;
      initJsonFormatter();
      handleResize();
    }, 200);
  }
});

// 如果在panel.js中有setupToolNavigation函数，监听工具切换事件
document.addEventListener('toolChanged', (e) => {
  console.log('toolChanged event received:', e.detail);
  if (e.detail && e.detail.tool === 'json-formatter') {
    setTimeout(() => {
      console.log('Initializing after tool changed to json-formatter');
      // 每次工具切换都重新初始化
      window.jsonFormatterInitialized = false;
      initJsonFormatter();
      handleResize();
      
      // 使用setupJsonContentLayout函数确保布局正确
      setupJsonContentLayout();
    }, 200);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const jsonInput = document.getElementById('json-input');
  const jsonOutput = document.getElementById('json-output');
  const formatButton = document.getElementById('format-json');
  const removeEscapesButton = document.getElementById('remove-escapes');
  const urlDecodeButton = document.getElementById('url-decode');
  const clearButton = document.getElementById('clear-json');
  const copyButton = document.getElementById('copy-json');

  // 格式化JSON
  formatButton.addEventListener('click', () => {
    try {
      const input = jsonInput.value.trim();
      if (!input) {
        showNotification('warning', '请输入JSON文本');
        return;
      }
      
      const parsed = JSON.parse(input);
      jsonOutput.textContent = JSON.stringify(parsed, null, 2);
      showNotification('success', 'JSON格式化成功');
    } catch (error) {
      jsonOutput.textContent = `错误: ${error.message}`;
      showNotification('error', 'JSON格式错误');
    }
  });

  // 去除转义
  removeEscapesButton.addEventListener('click', () => {
    try {
      const input = jsonInput.value.trim();
      if (!input) {
        showNotification('warning', '请输入JSON文本');
        return;
      }
      
      // 去除转义字符
      const unescaped = input.replace(/\\/g, '');
      jsonOutput.textContent = unescaped;
      showNotification('success', '去除转义成功');
    } catch (error) {
      jsonOutput.textContent = `错误: ${error.message}`;
      showNotification('error', '处理失败');
    }
  });

  // URL解码
  if (urlDecodeButton) {
    urlDecodeButton.addEventListener('click', () => {
      try {
        const input = jsonInput.value.trim();
        if (!input) {
          showNotification('warning', '请输入需要解码的文本');
          return;
        }
        
        // URL解码
        const decoded = decodeURIComponent(input);
        jsonOutput.textContent = decoded;
        showNotification('success', 'URL解码成功');
      } catch (error) {
        jsonOutput.textContent = `错误: ${error.message}`;
        showNotification('error', 'URL解码失败');
      }
    });
  }

  // 清空
  clearButton.addEventListener('click', () => {
    jsonInput.value = '';
    jsonOutput.textContent = '';
    showNotification('success', '已清空');
  });

  // 复制
  copyButton.addEventListener('click', () => {
    const output = jsonOutput.textContent;
    if (!output) {
      showNotification('warning', '没有可复制的内容');
      return;
    }
    
    navigator.clipboard.writeText(output)
      .then(() => {
        showNotification('success', '已复制到剪贴板');
      })
      .catch(() => {
        showNotification('error', '复制失败');
      });
  });
}); 