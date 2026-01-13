// ========== 1. 统计网页文字并计算阅读时间 ==========
function calculateReadingTime() {
  // 排除不需要统计的标签
  const excludeTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'HEAD'];
  // 遍历所有文本节点
  let totalText = '';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => excludeTags.includes(node.parentElement.tagName) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT
  });
  let node;
  while (node = walker.nextNode()) {
    totalText += node.textContent.trim() + ' ';
  }
  // 统计有效字数（去空格、换行）
  const charCount = totalText.replace(/\s+/g, '').length;
  // 中文平均阅读速度：300字/分钟
  const readingMinutes = charCount > 0 ? Math.ceil(charCount / 300) : 0;
  return { charCount, readingMinutes };
}

// ========== 2. 创建悬浮窗 ==========
function createFloatingWindow() {
  const { charCount, readingMinutes } = calculateReadingTime();
  
  // 创建悬浮窗容器
  const floatWindow = document.createElement('div');
  floatWindow.id = 'media-screenshot-float';
  floatWindow.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 180px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 999999;
    cursor: move;
    font-size: 12px;
  `;

  // 悬浮窗内容
  floatWindow.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: bold;">工具面板</span>
      <button id="float-close" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 2px 6px; cursor: pointer;">×</button>
    </div>
    <div style="margin-bottom: 8px;">
      <span>文字数：${charCount}</span><br>
      <span>预估阅读：${readingMinutes}分钟</span>
    </div>
    <button id="capture-btn" style="width: 100%; background: #2196F3; color: white; border: none; border-radius: 4px; padding: 6px; cursor: pointer; margin-top: 4px;">
      截图并编辑
    </button>
  `;

  // 添加到页面
  document.body.appendChild(floatWindow);

  // ========== 3. 悬浮窗拖动功能 ==========
  let isDragging = false;
  let dragStartX, dragStartY;

  floatWindow.addEventListener('mousedown', (e) => {
    if (e.target.id !== 'float-close' && e.target.id !== 'capture-btn') {
      isDragging = true;
      dragStartX = e.clientX - floatWindow.offsetLeft;
      dragStartY = e.clientY - floatWindow.offsetTop;
      floatWindow.style.opacity = '0.8';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      floatWindow.style.left = `${e.clientX - dragStartX}px`;
      floatWindow.style.top = `${e.clientY - dragStartY}px`;
      floatWindow.style.right = 'auto'; // 取消right定位，避免冲突
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    floatWindow.style.opacity = '1';
  });

  // ========== 4. 关闭悬浮窗 ==========
  floatWindow.querySelector('#float-close').addEventListener('click', () => {
    floatWindow.remove();
  });

  // ========== 5. 截图功能 ==========
  floatWindow.querySelector('#capture-btn').addEventListener('click', () => {
    // 向后台发送截图请求
    chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
      if (response.success) {
        // 打开截图编辑窗口
        const editorWindow = window.open(
          chrome.runtime.getURL('screenshot-editor.html'),
          'screenshot-editor',
          'width=800,height=600,top=100,left=100'
        );
        // 传递截图数据给编辑窗口
        setTimeout(() => {
          editorWindow.postMessage({ type: 'screenshotData', dataUrl: response.dataUrl }, '*');
        }, 500);
      } else {
        alert('截图失败：' + response.error);
      }
    });
  });
}

// 页面加载完成后创建悬浮窗
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  createFloatingWindow();
} else {
  document.addEventListener('DOMContentLoaded', createFloatingWindow);
}