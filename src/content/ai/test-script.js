// AI测试脚本 - 用于测试通义和DeepSeek的内容脚本功能
(function() {
  console.log('AI测试脚本已加载');
  
  // 创建测试面板
  function createTestPanel() {
    // 检查是否已经存在测试面板
    if (document.getElementById('ai-test-panel')) {
      return;
    }
    
    // 创建测试面板元素
    const panel = document.createElement('div');
    panel.id = 'ai-test-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // 创建标题
    const title = document.createElement('h3');
    title.textContent = 'AI脚本测试工具';
    title.style.cssText = 'margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;';
    panel.appendChild(title);
    
    // 创建测试问题输入框
    const questionLabel = document.createElement('label');
    questionLabel.textContent = '测试问题:';
    questionLabel.style.cssText = 'display: block; margin-top: 10px; margin-bottom: 5px; font-weight: 500;';
    panel.appendChild(questionLabel);
    
    const questionInput = document.createElement('textarea');
    questionInput.id = 'test-question';
    questionInput.style.cssText = 'width: 100%; height: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;';
    questionInput.placeholder = '输入要测试的问题...';
    panel.appendChild(questionInput);
    
    // 创建AI类型选择
    const aiTypeLabel = document.createElement('label');
    aiTypeLabel.textContent = 'AI类型:';
    aiTypeLabel.style.cssText = 'display: block; margin-top: 10px; margin-bottom: 5px; font-weight: 500;';
    panel.appendChild(aiTypeLabel);
    
    const aiTypeSelect = document.createElement('select');
    aiTypeSelect.id = 'test-ai-type';
    aiTypeSelect.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;';
    
    const aiTypes = ['deepseek', 'tongyi'];
    aiTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type === 'deepseek' ? 'DeepSeek' : '通义千问';
      aiTypeSelect.appendChild(option);
    });
    panel.appendChild(aiTypeSelect);
    
    // 创建测试按钮
    const testButton = document.createElement('button');
    testButton.id = 'test-button';
    testButton.textContent = '开始测试';
    testButton.style.cssText = 'width: 100%; margin-top: 15px; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;';
    panel.appendChild(testButton);
    
    // 创建重置按钮
    const resetButton = document.createElement('button');
    resetButton.id = 'reset-button';
    resetButton.textContent = '重置面板';
    resetButton.style.cssText = 'width: 100%; margin-top: 8px; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;';
    panel.appendChild(resetButton);
    
    // 创建结果日志区域
    const logLabel = document.createElement('label');
    logLabel.textContent = '测试日志:';
    logLabel.style.cssText = 'display: block; margin-top: 15px; margin-bottom: 5px; font-weight: 500;';
    panel.appendChild(logLabel);
    
    const logArea = document.createElement('div');
    logArea.id = 'test-log';
    logArea.style.cssText = 'width: 100%; height: 200px; padding: 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; overflow-y: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;';
    panel.appendChild(logArea);
    
    // 添加到页面
    document.body.appendChild(panel);
    
    // 添加事件监听器
    testButton.addEventListener('click', startTest);
    resetButton.addEventListener('click', resetPanel);
    
    // 添加全局方法以便通过控制台访问
    window.aiTest = {
      log: addLog,
      startTest: startTest,
      reset: resetPanel
    };
    
    addLog('测试面板已创建，您可以通过 window.aiTest 访问测试功能');
  }
  
  // 添加日志
  function addLog(message, type = 'info') {
    const logArea = document.getElementById('test-log');
    if (!logArea) return;
    
    const timestamp = new Date().toLocaleTimeString();
    let color = '#333';
    let prefix = 'INFO';
    
    if (type === 'error') {
      color = '#e53935';
      prefix = 'ERROR';
    } else if (type === 'success') {
      color = '#2e7d32';
      prefix = 'SUCCESS';
    } else if (type === 'warning') {
      color = '#f57c00';
      prefix = 'WARNING';
    }
    
    const logEntry = document.createElement('div');
    logEntry.style.color = color;
    logEntry.textContent = `[${timestamp}] [${prefix}] ${message}`;
    
    logArea.appendChild(logEntry);
    logArea.scrollTop = logArea.scrollHeight;
    
    // 同时输出到控制台
    if (type === 'error') {
      console.error(`[AI测试] ${message}`);
    } else if (type === 'warning') {
      console.warn(`[AI测试] ${message}`);
    } else {
      console.log(`[AI测试] ${message}`);
    }
  }
  
  // 重置面板
  function resetPanel() {
    document.getElementById('test-question').value = '';
    document.getElementById('test-log').innerHTML = '';
    addLog('面板已重置');
  }
  
  // 开始测试
  function startTest() {
    const question = document.getElementById('test-question').value;
    const aiType = document.getElementById('test-ai-type').value;
    
    if (!question.trim()) {
      addLog('请输入测试问题', 'error');
      return;
    }
    
    addLog(`开始测试 ${aiType} AI...`);
    addLog(`测试问题: ${question}`);
    
    // 模拟background.js发送的消息
    try {
      addLog('模拟发送ASK_QUESTION消息...');
      
      // 使用setTimeout模拟异步操作
      setTimeout(() => {
        try {
          // 检查是否有相应的AI助手实例
          if (window[`${aiType}ChatAssistant`]) {
            addLog(`找到${aiType}ChatAssistant实例，开始发送问题`);
            
            // 调用AI助手的方法
            const assistant = window[`${aiType}ChatAssistant`];
            
            // 检查输入框是否可用
            const inputElement = assistant.findInputElement();
            if (inputElement) {
              addLog('成功找到输入框元素', 'success');
              addLog(`输入框信息: ${inputElement.tagName}${inputElement.id ? '#' + inputElement.id : ''}`);
            } else {
              addLog('无法找到输入框元素', 'error');
            }
            
            // 检查发送按钮是否可用
            const sendButton = assistant.findSendButton();
            if (sendButton) {
              addLog('成功找到发送按钮', 'success');
              addLog(`发送按钮信息: ${sendButton.tagName}${sendButton.id ? '#' + sendButton.id : ''}`);
              addLog(`发送按钮是否可用: ${!sendButton.disabled}`);
            } else {
              addLog('无法找到发送按钮', 'error');
            }
            
            // 尝试模拟发送消息
            addLog('尝试调用sendMessage方法...');
            assistant.sendMessage(question).then(() => {
              addLog('消息发送成功', 'success');
            }).catch(error => {
              addLog(`消息发送失败: ${error.message}`, 'error');
            });
          } else {
            addLog(`未找到${aiType}ChatAssistant实例，可能脚本尚未加载或初始化`, 'warning');
            
            // 尝试直接使用postMessage发送消息
            addLog('尝试使用window.postMessage发送消息...');
            window.postMessage({
              type: 'ASK_QUESTION',
              question: question
            }, '*');
            
            addLog('消息已发送，请查看控制台日志确认是否成功', 'info');
          }
        } catch (error) {
          addLog(`测试过程中发生错误: ${error.message}`, 'error');
          console.error('AI测试错误:', error);
        }
      }, 500);
    } catch (error) {
      addLog(`发送测试消息失败: ${error.message}`, 'error');
    }
  }
  
  // 监听页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTestPanel);
  } else {
    createTestPanel();
  }
  
  // 监听消息，用于调试
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type && event.data.type.startsWith('AI_')) {
      addLog(`收到消息: ${JSON.stringify(event.data)}`, 'info');
    }
  });
})();