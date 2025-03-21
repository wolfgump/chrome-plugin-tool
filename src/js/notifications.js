/**
 * 通知系统 - 用于显示统一样式的通知
 */

// 显示通知
function showNotification(type, message) {
  console.log(`显示通知: ${type} - ${message}`);
  
  // 移除所有现有的通知
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });

  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // 添加到文档
  document.body.appendChild(notification);
  
  // 强制重绘以应用样式
  notification.offsetHeight;
  
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

// 导出通知函数
window.showNotification = showNotification;
