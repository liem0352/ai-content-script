// AI调试面板 - 强化版
class DebugPanel {
  constructor(aiName) {
    this.aiName = aiName;
    this.isActive = false;
    this.isExpanded = false;
    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalInfo = console.info;
    this.dragData = null;
    this.logQueue = []; // 日志队列，确保即使面板未创建也能记录日志
    this.createPanel();
    this.activate(); // 立即激活，确保日志可见
  }

  createPanel() {
    // 检查是否已存在调试面板，避免重复创建
    if (document.getElementById('ai-debug-panel')) {
      console.log(`[${this.aiName}] 调试面板已存在，复用现有面板`);
      this.updatePanelTitle();
      return;
    }

    const debugPanel = document.createElement('div');
    debugPanel.id = 'ai-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 320px;
      height: 480px;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 15px;
      font-size: 13px;
      font-family: 'Monaco', 'Consolas', monospace;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      display: none;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
      transition: width 0.3s, height 0.3s, padding 0.3s;
    `;
    document.body.appendChild(debugPanel);

    // 添加标题栏
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: move;
    `;
    debugPanel.appendChild(titleBar);

    // 添加拖动功能
    titleBar.addEventListener('mousedown', (e) => {
      if (e.target === titleBar) {
        const panel = document.getElementById('ai-debug-panel');
        const rect = panel.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const isNearRight = rect.left > screenWidth / 2;

        this.dragData = {
          startX: e.clientX,
          startY: e.clientY,
          startLeft: rect.left,
          startTop: rect.top,
          isNearRight: isNearRight,
          startRight: screenWidth - rect.right
        };

        const mouseMoveHandler = (e) => {
          if (this.dragData) {
            const dx = e.clientX - this.dragData.startX;
            const dy = e.clientY - this.dragData.startY;

            if (this.dragData.isNearRight) {
              const newRight = Math.max(10, this.dragData.startRight - dx);
              panel.style.right = `${newRight}px`;
              panel.style.left = 'auto';
            } else {
              panel.style.left = `${Math.max(10, this.dragData.startLeft + dx)}px`;
              panel.style.right = 'auto';
            }
            panel.style.top = `${Math.max(10, this.dragData.startTop + dy)}px`;
          }
        };

        const mouseUpHandler = () => {
          this.dragData = null;
          document.removeEventListener('mousemove', mouseMoveHandler);
          document.removeEventListener('mouseup', mouseUpHandler);
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
      }
    });

    const title = document.createElement('div');
    title.id = 'ai-debug-title';
    title.textContent = `${this.aiName} 调试日志`;
    title.style.cssText = `
      font-weight: bold;
      font-size: 14px;
      color: #fff;
      pointer-events: none;
    `;
    titleBar.appendChild(title);

    // 添加按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
    `;
    titleBar.appendChild(buttonContainer);

    // 添加清理按钮
    const clearButton = document.createElement('button');
    clearButton.textContent = '清理';
    clearButton.style.cssText = `
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    `;
    clearButton.onmouseover = () => {
      clearButton.style.background = 'rgba(255, 255, 255, 0.2)';
    };
    clearButton.onmouseout = () => {
      clearButton.style.background = 'rgba(255, 255, 255, 0.1)';
    };
    clearButton.onclick = () => {
      const logContainer = document.getElementById('ai-debug-log');
      if (logContainer) {
        logContainer.innerHTML = '';
        this.logQueue = [];
        this.log('调试日志已清空');
      }
    };
    buttonContainer.appendChild(clearButton);

    // 添加展开/收起按钮
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '收起';
    toggleButton.style.cssText = `
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    `;
    toggleButton.onmouseover = () => {
      toggleButton.style.background = 'rgba(255, 255, 255, 0.2)';
    };
    toggleButton.onmouseout = () => {
      toggleButton.style.background = 'rgba(255, 255, 255, 0.1)';
    };
    toggleButton.onclick = () => {
      this.toggleExpand();
    };
    buttonContainer.appendChild(toggleButton);

    // 添加日志容器
    const logContainer = document.createElement('div');
    logContainer.id = 'ai-debug-log';
    logContainer.style.cssText = `
      height: calc(100% - 40px);
      overflow-y: auto;
      padding-right: 8px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
      text-align: left;
    `;

    // 自定义滚动条样式
    const scrollbarStyles = document.createElement('style');
    scrollbarStyles.textContent = `
      #ai-debug-log::-webkit-scrollbar {
        width: 6px;
      }
      #ai-debug-log::-webkit-scrollbar-track {
        background: transparent;
      }
      #ai-debug-log::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }
      #ai-debug-log::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.4);
      }
    `;
    document.head.appendChild(scrollbarStyles);

    debugPanel.appendChild(logContainer);

    // 处理之前的日志队列
    this.flushLogQueue();
  }

  updatePanelTitle() {
    const title = document.getElementById('ai-debug-title');
    if (title) {
      title.textContent = `${this.aiName} 调试日志`;
    }
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const panel = document.getElementById('ai-debug-panel');
    const logContainer = document.getElementById('ai-debug-log');
    const title = document.getElementById('ai-debug-title');
    const clearButton = panel ? panel.querySelector('button:first-child') : null;
    const toggleButton = panel ? panel.querySelector('button:last-child') : null;
    
    if (!panel || !logContainer || !title || !clearButton || !toggleButton) {
      return;
    }
    
    const rect = panel.getBoundingClientRect();
    const screenWidth = window.innerWidth;

    // 判断面板是靠近屏幕左边还是右边
    const isNearRight = rect.left > screenWidth / 2;

    if (this.isExpanded) {
      panel.style.width = '320px';
      panel.style.height = '480px';
      panel.style.padding = '15px';
      if (isNearRight) {
        panel.style.right = `${screenWidth - rect.right}px`;
        panel.style.left = 'auto';
      } else {
        panel.style.left = `${rect.left}px`;
        panel.style.right = 'auto';
      }
      logContainer.style.display = 'block';
      title.style.display = 'block';
      clearButton.style.display = 'block';
      toggleButton.textContent = '收起';
    } else {
      const currentLeft = rect.left;
      const currentRight = screenWidth - rect.right;
      panel.style.width = '80px';
      panel.style.height = '32px';
      panel.style.padding = '4px 8px';
      if (isNearRight) {
        panel.style.right = `${currentRight}px`;
        panel.style.left = 'auto';
      } else {
        panel.style.left = `${currentLeft}px`;
        panel.style.right = 'auto';
      }
      logContainer.style.display = 'none';
      title.style.display = 'none';
      clearButton.style.display = 'none';
      toggleButton.textContent = '展开';
    }
  }

  activate() {
    if (this.isActive) return;
    this.isActive = true;

    const panel = document.getElementById('ai-debug-panel');
    if (panel) {
      panel.style.display = 'block';
    }

    // 重写console方法，确保所有日志都能被捕获
    console.log = (...args) => {
      this.originalLog.apply(console, args);
      this.log('日志:', ...args);
    };

    console.error = (...args) => {
      this.originalError.apply(console, args);
      this.log('错误:', ...args);
    };

    console.info = (...args) => {
      this.originalInfo.apply(console, args);
      this.log('信息:', ...args);
    };

    this.log(`${this.aiName} 调试面板已激活`);
  }

  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;

    const panel = document.getElementById('ai-debug-panel');
    if (panel) {
      panel.style.display = 'none';
    }

    // 恢复原始console方法
    console.log = this.originalLog;
    console.error = this.originalError;
    console.info = this.originalInfo;
  }

  // 核心日志方法，支持各种类型的数据展示
  log(...args) {
    // 先将日志加入队列，确保不会丢失
    this.logQueue.push(args);

    const logContainer = document.getElementById('ai-debug-log');
    if (logContainer) {
      const logEntry = document.createElement('div');
      logEntry.style.cssText = `
        padding: 6px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        line-height: 1.4;
        word-break: break-word;
        text-align: left;
      `;

      // 添加时间戳
      const timestamp = new Date().toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const content = args.map(arg => {
        if (arg instanceof Error) {
          return `<span style="color: #ff6b6b;">${arg.name}: ${arg.message}</span><br>${arg.stack || ''}`;
        } else if (typeof arg === 'object') {
          try {
            return `<span style="color: #4ecdc4;">${JSON.stringify(arg, null, 2).replace(/\n/g, '<br>')}</span>`;
          } catch (e) {
            return String(arg);
          }
        } else if (typeof arg === 'string' && (arg.includes('✅') || arg.includes('成功'))) {
          return `<span style="color: #4caf50;">${arg}</span>`;
        } else if (typeof arg === 'string' && (arg.includes('❌') || arg.includes('失败'))) {
          return `<span style="color: #f44336;">${arg}</span>`;
        } else if (typeof arg === 'string' && (arg.includes('⚠️') || arg.includes('警告'))) {
          return `<span style="color: #ff9800;">${arg}</span>`;
        } else {
          return String(arg);
        }
      }).join(' ');

      logEntry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${content.replace(/\n/g, '<br>')}`;
      logContainer.appendChild(logEntry);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  // 刷新日志队列，确保所有日志都能显示
  flushLogQueue() {
    while (this.logQueue.length > 0) {
      const args = this.logQueue.shift();
      this.log.apply(this, args);
    }
  }
}

// 导出到window对象，确保在任何地方都能访问
if (typeof window !== 'undefined') {
  window.DebugPanel = DebugPanel;
  // 添加全局调试函数，方便在控制台直接使用
  window.aiDebug = (aiName, ...args) => {
    if (!window._globalDebugPanel) {
      window._globalDebugPanel = new DebugPanel(aiName || '全局');
    }
    window._globalDebugPanel.log(...args);
  };
}