// 存储检测到的流媒体资源
let mediaResources = [];

// 监听网络请求，筛选流媒体资源
chrome.webRequest.onCompleted.addListener(
  (details) => {
    // 筛选媒体类型（视频/音频）
    const mediaTypes = [
      'video/mp4', 'video/webm', 'video/avi',
      'audio/mpeg', 'audio/mp3', 'audio/wav'
    ];
    if (details.responseHeaders) {
      const contentTypeHeader = details.responseHeaders.find(
        header => header.name.toLowerCase() === 'content-type'
      );
      if (contentTypeHeader && mediaTypes.some(type => contentTypeHeader.value.includes(type))) {
        // 去重存储
        if (!mediaResources.some(item => item.url === details.url)) {
          mediaResources.push({
            url: details.url,
            type: contentTypeHeader.value,
            size: details.responseHeaders.find(h => h.name === 'Content-Length')?.value || '未知'
          });
        }
        // 存储到本地供弹窗读取
        chrome.storage.local.set({ mediaResources });
      }
    }
  },
  { urls: ["<all_urls>"], types: ["media", "xmlhttprequest", "other"] }
);

// 处理截图请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreenshot') {
    // 捕获当前标签页可见区域
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ success: true, dataUrl });
    });
    // 保持通信通道开放
    return true;
  }
});