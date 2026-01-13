// 读取存储的媒体资源并显示
chrome.storage.local.get('mediaResources', (result) => {
  const resourcesList = document.getElementById('resources-list');
  const mediaResources = result.mediaResources || [];

  if (mediaResources.length === 0) {
    resourcesList.innerHTML = '<div class="empty">未检测到流媒体资源</div>';
    return;
  }

  // 渲染资源列表
  mediaResources.forEach((resource, index) => {
    const item = document.createElement('div');
    item.className = 'resource-item';
    item.innerHTML = `
      <div>类型：${resource.type}</div>
      <div>大小：${resource.size === '未知' ? '未知' : (resource.size / 1024 / 1024).toFixed(2) + 'MB'}</div>
      <button class="download-btn" data-url="${resource.url}">下载</button>
    `;
    resourcesList.appendChild(item);

    // 绑定下载事件
    item.querySelector('.download-btn').addEventListener('click', (e) => {
      const url = e.target.dataset.url;
      // 调用Chrome下载API
      chrome.downloads.download({
        url: url,
        filename: `media_${index + 1}.${resource.type.split('/')[1]}`,
        conflictAction: 'uniquify'
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          alert('下载失败：' + chrome.runtime.lastError.message);
        } else {
          alert('开始下载！');
        }
      });
    });
  });
});