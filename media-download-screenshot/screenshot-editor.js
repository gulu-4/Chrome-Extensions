let canvas = null;
let currentTool = 'pen'; // 默认工具：画笔

// 接收截图数据
window.addEventListener('message', (e) => {
  if (e.data.type === 'screenshotData') {
    initCanvas(e.data.dataUrl);
  }
});

// 初始化画布
function initCanvas(dataUrl) {
  // const container = document.getElementById('canvas-container');
  // // 创建fabric画布（绑定到canvas元素，适配容器大小）
  // canvas = new fabric.Canvas('canvas', {
  //   width: container.clientWidth,
  //   height: container.clientHeight
  // });
  
  // 创建fabric画布
  canvas = new fabric.Canvas('canvas', {
    width: document.getElementById('canvas-container').clientWidth,
    height: document.getElementById('canvas-container').clientHeight
  });

  // 加载截图到画布
  fabric.Image.fromURL(dataUrl, (img) => {
    // 适配画布大小
    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小
    img.scale(scale).set({ left: 0, top: 0 });
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    canvas.renderAll();
  });

  // 绑定工具事件
  bindToolEvents();
}

// 绑定工具切换事件
function bindToolEvents() {
  const toolButtons = ['pen-btn', 'rect-btn', 'text-btn', 'eraser-btn', 'clear-btn'];
  
  toolButtons.forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => {
      // 重置所有按钮样式
      toolButtons.forEach(btnId => {
        document.getElementById(btnId).classList.remove('active');
      });
      // 激活当前按钮
      e.target.classList.add('active');
      // 设置当前工具
      currentTool = id.replace('-btn', '');
      // 重置画布交互
      canvas.isDrawingMode = false;
      canvas.off('mouse:down');
      
      // 根据工具类型初始化
      switch (currentTool) {
        case 'pen':
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush.width = 3;
          canvas.freeDrawingBrush.color = '#ff0000';
          break;
        case 'rect':
          canvas.on('mouse:down', (e) => {
            const pointer = canvas.getPointer(e.e);
            const rect = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              fill: 'transparent',
              stroke: '#ff0000',
              strokeWidth: 3
            });
            canvas.add(rect);
            canvas.on('mouse:move', (e) => {
              const pointer = canvas.getPointer(e.e);
              rect.set({
                width: pointer.x - rect.left,
                height: pointer.y - rect.top
              });
              canvas.renderAll();
            });
            canvas.on('mouse:up', () => {
              canvas.off('mouse:move');
            });
          });
          break;
        case 'text':
          canvas.on('mouse:down', (e) => {
            const pointer = canvas.getPointer(e.e);
            const text = new fabric.Textbox('请输入文字', {
              left: pointer.x,
              top: pointer.y,
              width: 200,
              fontSize: 16,
              fill: '#ff0000'
            });
            canvas.add(text);
            text.enterEditing(); // 直接进入编辑状态
          });
          break;
        case 'eraser':
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush.width = 10;
          canvas.freeDrawingBrush.color = 'white';
          canvas.freeDrawingBrush.globalCompositeOperation = 'destination-out';
          break;
        case 'clear':
          canvas.remove(...canvas.getObjects().filter(obj => obj.type !== 'background-image'));
          break;
      }
    });
  });

  // 保存按钮事件
  document.getElementById('save-btn').addEventListener('click', () => {
    // 将画布转为图片
    const dataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });
    // 创建下载链接
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `screenshot_${new Date().getTime()}.png`;
    link.click();
  });
}