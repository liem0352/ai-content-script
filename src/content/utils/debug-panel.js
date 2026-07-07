// DebugPanel类 - 用于调试日志管理
class DebugPanel {
  constructor(aiName) {
    this.aiName = aiName;
    this.isActive = false;
    this.logs = [];
    this.panelElement = null;
    this.maxLogs = 100; // 最大保存的日志数量
  }

  // 记录日志
  log(...args) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${this.aiName}] ${args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ')}`;
    
    // 添加到日志数组
    this.logs.push(logMessage);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // 控制台输出
    console.log(`%c${logMessage}`, 'color: #4a9eff; font-weight: 500;');
    
    // 如果面板已激活，更新显示
    if (this.isActive && this.panelElement) {
      this.updatePanel();
    }
  }

  // 激活调试面板
  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.createPanel();
    this.updatePanel();
    
    // 添加全局样式
    this.addGlobalStyles();
  }

  // 创建调试面板DOM元素
  createPanel() {
    // 检查是否已存在
    if (this.panelElement) return;
    
    // 创建容器
    this.panelElement = document.createElement('div');
    this.panelElement.id = `debug-panel-${this.aiName.toLowerCase()}`;
    this.panelElement.className = 'debug-panel';
    this.panelElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      height: 300px;
      background: rgba(30, 30, 30, 0.95);
      border: 1px solid #333;
      border-radius: 8px;
      padding: 12px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      color: #f0f0f0;
      z-index: 99999;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
    `;
    
    // 创建标题栏
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #444;
    `;
    
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #4a9eff;
    `;
    title.textContent = `Debug: ${this.aiName}`;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #999;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      closeButton.style.color = '#fff';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'none';
      closeButton.style.color = '#999';
    });
    
    closeButton.addEventListener('click', () => {
      this.panelElement.remove();
      this.panelElement = null;
      this.isActive = false;
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // 创建日志容器
    const logContainer = document.createElement('div');
    logContainer.id = `debug-logs-${this.aiName.toLowerCase()}`;
    logContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    `;
    
    this.panelElement.appendChild(header);
    this.panelElement.appendChild(logContainer);
    
    // 添加到文档
    document.body.appendChild(this.panelElement);
  }

  // 更新面板内容
  updatePanel() {
    if (!this.panelElement) return;
    
    const logContainer = this.panelElement.querySelector(`#debug-logs-${this.aiName.toLowerCase()}`);
    if (!logContainer) return;
    
    // 清空并重新填充
    logContainer.innerHTML = '';
    
    this.logs.forEach((log, index) => {
      const logLine = document.createElement('div');
      
      // 为不同类型的日志设置不同的颜色
      let logColor = '#f0f0f0';
      if (log.includes('✅')) {
        logColor = '#4caf50';
      } else if (log.includes('❌')) {
        logColor = '#f44336';
      } else if (log.includes('⚠️')) {
        logColor = '#ff9800';
      } else if (log.includes('找到') || log.includes('成功')) {
        logColor = '#8bc34a';
      }
      
      logLine.style.cssText = `
        padding: 2px 0;
        color: ${logColor};
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      `;
      
      // 突出显示时间戳
      const parts = log.split('] ');
      if (parts.length >= 3) {
        const timestamp = parts[0] + ']';
        const aiName = parts[1] + ']';
        const message = parts.slice(2).join('] ');
        
        logLine.innerHTML = `
          <span style="color: #999;">${timestamp}</span>
          <span style="color: #4a9eff;">${aiName}</span>
          ${message}
        `;
      } else {
        logLine.textContent = log;
      }
      
      logContainer.appendChild(logLine);
    });
    
    // 滚动到底部
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // 添加全局样式
  addGlobalStyles() {
    // 检查是否已存在样式
    if (document.getElementById('debug-panel-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'debug-panel-styles';
    style.textContent = `
      .debug-panel::-webkit-scrollbar {
        width: 8px;
      }
      
      .debug-panel::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      
      .debug-panel::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      
      .debug-panel::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `;
    
    document.head.appendChild(style);
  }

  // 清除所有日志
  clear() {
    this.logs = [];
    if (this.panelElement) {
      this.updatePanel();
    }
  }

  // 获取所有日志（用于导出）
  getAllLogs() {
    return this.logs.join('\n');
  }
}

// 导出类
window.DebugPanel = DebugPanel;