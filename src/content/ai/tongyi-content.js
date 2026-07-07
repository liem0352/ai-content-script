// 通义千问聊天助手 - 强化版
class TongyiChatAssistant {
  constructor() {
    // 立即创建并激活调试面板
    this.debugPanel = new DebugPanel('通义千问');
    this.debugPanel.activate();
    this.mutationObserver = null;
    this.inputElement = null;
    this.sendButton = null;
    this.lastMessageTime = 0;
    this.isSending = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.log('初始化通义千问聊天助手');
    this.init();
  }

  // 增强的日志方法，确保同时输出到调试面板和控制台
  log(...args) {
    try {
      if (this.debugPanel) {
        this.debugPanel.log('[通义千问]', ...args);
      }
      console.log('[通义千问]', ...args);
    } catch (error) {
      // 防止日志系统本身出错
      console.error('[通义千问日志错误]', error);
    }
  }

  // 增强的错误日志方法
  error(...args) {
    try {
      if (this.debugPanel) {
        this.debugPanel.log('❌ [通义千问错误]', ...args);
      }
      console.error('[通义千问错误]', ...args);
    } catch (error) {
      console.error('[通义千问日志错误]', error);
    }
  }

  // 增强的元素查找策略 - 输入框
  findInputElement() {
    try {
      // 策略1: 使用原始选择器
      const selectors = [
        '[placeholder="请输入您的问题"]',
        '.textarea-wrapper textarea',
        '[aria-label="提问"]',
        'textarea:enabled',
        '[role="textbox"]',
        '[contenteditable="true"]'
      ];

      for (const selector of selectors) {
        this.log(`尝试使用选择器查找输入框: ${selector}`);
        const element = document.querySelector(selector);
        if (element && element.offsetParent !== null) {
          this.log(`✅ 找到输入框: ${selector}`);
          return element;
        }
      }

      // 策略2: 搜索页面中所有可能的输入区域容器
      const containers = document.querySelectorAll('.input-area, .chat-input-container, .message-input-wrapper');
      for (const container of containers) {
        this.log(`尝试从容器中查找输入框: ${container.className}`);
        const textarea = container.querySelector('textarea');
        const contenteditable = container.querySelector('[contenteditable="true"]');
        if (textarea && textarea.offsetParent !== null) {
          this.log(`✅ 从容器找到textarea输入框`);
          return textarea;
        }
        if (contenteditable && contenteditable.offsetParent !== null) {
          this.log(`✅ 从容器找到contenteditable输入框`);
          return contenteditable;
        }
      }

      // 策略3: 寻找所有输入框附近的元素
      const allTextareas = document.querySelectorAll('textarea');
      for (const textarea of allTextareas) {
        if (textarea.offsetParent !== null && textarea.style.display !== 'none' && textarea.style.visibility !== 'hidden') {
          const rect = textarea.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 20) {
            this.log(`✅ 找到可能的输入框: ${textarea.className || '未知类名'}`);
            return textarea;
          }
        }
      }

      // 策略4: 通过aria-label属性查找
      const ariaLabelInputs = document.querySelectorAll('[aria-label]');
      for (const input of ariaLabelInputs) {
        const label = input.getAttribute('aria-label').toLowerCase();
        if (label.includes('提问') || label.includes('问题') || label.includes('输入')) {
          this.log(`✅ 通过aria-label找到输入框: ${label}`);
          return input;
        }
      }

      // 策略5: 通过发送按钮反向查找输入框
      const sendButtons = document.querySelectorAll('button');
      for (const button of sendButtons) {
        if (button.textContent.includes('发送') || button.innerHTML.includes('发送')) {
          const parent = button.closest('.input-container, .message-input-wrapper');
          if (parent) {
            const input = parent.querySelector('textarea, [contenteditable="true"]');
            if (input) {
              this.log(`✅ 通过发送按钮找到输入框`);
              return input;
            }
          }
        }
      }

      this.error('❌ 未能找到输入框元素');
      return null;
    } catch (error) {
      this.error('查找输入框时发生错误:', error);
      return null;
    }
  }

  // 增强的元素查找策略 - 发送按钮
  findSendButton() {
    try {
      const selectors = [
        '.send-button',
        'button.send',
        '[aria-label="发送"]',
        'button:has(.icon-send)',
        'button:contains("发送")'
      ];

      for (const selector of selectors) {
        this.log(`尝试使用选择器查找发送按钮: ${selector}`);
        let elements = [];
        
        if (selector.includes(':contains')) {
          const text = selector.match(/:contains\("(.*)"\)/)?.[1];
          if (text) {
            elements = Array.from(document.querySelectorAll('button')).filter(btn => 
              btn.textContent.includes(text) || btn.innerHTML.includes(text)
            );
          }
        } else {
          elements = Array.from(document.querySelectorAll(selector));
        }

        for (const element of elements) {
          if (element && element.offsetParent !== null) {
            this.log(`✅ 找到发送按钮: ${selector}`);
            return element;
          }
        }
      }

      // 寻找输入框附近的按钮
      if (this.inputElement) {
        const parent = this.inputElement.closest('.input-container, .message-input-wrapper');
        if (parent) {
          const buttons = parent.querySelectorAll('button');
          for (const button of buttons) {
            if (button.textContent.includes('发送') || button.innerHTML.includes('发送')) {
              this.log(`✅ 通过输入框找到发送按钮`);
              return button;
            }
          }
        }
      }

      this.error('❌ 未能找到发送按钮');
      return null;
    } catch (error) {
      this.error('查找发送按钮时发生错误:', error);
      return null;
    }
  }

  // 增强的元素查找策略 - 答案元素
  findAnswerElement() {
    try {
      const selectors = [
        '.markdown-content',
        '.answer-content',
        '.message-content',
        '.assistant-message'
      ];

      const recentAnswers = [];
      for (const selector of selectors) {
        this.log(`尝试使用选择器查找答案元素: ${selector}`);
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          for (const element of elements) {
            if (element && element.offsetParent !== null) {
              recentAnswers.push(element);
            }
          }
        }
      }

      // 按最近更新时间排序
      if (recentAnswers.length > 0) {
        recentAnswers.sort((a, b) => {
          const timeA = a.dataset.timestamp || 0;
          const timeB = b.dataset.timestamp || 0;
          return timeB - timeA;
        });
        this.log(`✅ 找到答案元素`);
        return recentAnswers[0];
      }

      this.log('未找到明确的答案元素');
      return null;
    } catch (error) {
      this.error('查找答案元素时发生错误:', error);
      return null;
    }
  }

  // 检查页面是否准备就绪
  checkReady() {
    try {
      this.log('检查页面就绪状态...');
      this.inputElement = this.findInputElement();
      this.sendButton = this.findSendButton();

      if (this.inputElement && this.sendButton) {
        // 确保输入框可以聚焦
        try {
          this.inputElement.focus();
          this.log('✅ 输入框已聚焦');
        } catch (error) {
          this.log('⚠️ 输入框聚焦失败，但元素已找到');
        }
        this.log('✅ 页面准备就绪');
        return true;
      } else {
        this.log(`❌ 页面未就绪 - 输入框: ${!!this.inputElement}, 发送按钮: ${!!this.sendButton}`);
        return false;
      }
    } catch (error) {
      this.error('检查页面就绪状态时发生错误:', error);
      return false;
    }
  }

  // 增强的DOM变化监听
  setupMutationObserver() {
    try {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }

      this.log('设置DOM变化监听器...');
      const observerConfig = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'placeholder']
      };

      this.mutationObserver = new MutationObserver((mutations) => {
        try {
          // 使用防抖动处理，避免频繁检查
          if (Date.now() - this.lastMessageTime > 500) {
            this.lastMessageTime = Date.now();
            this.log('检测到DOM变化，检查输入框和发送按钮状态...');
            
            // 当页面结构变化时，重新查找元素
            const newInputElement = this.findInputElement();
            const newSendButton = this.findSendButton();
            
            if (newInputElement !== this.inputElement) {
              this.log('⚠️ 输入框已更新');
              this.inputElement = newInputElement;
            }
            if (newSendButton !== this.sendButton) {
              this.log('⚠️ 发送按钮已更新');
              this.sendButton = newSendButton;
            }
          }
        } catch (error) {
          this.error('DOM变化监听处理错误:', error);
        }
      });

      this.mutationObserver.observe(document.body, observerConfig);
      this.log('✅ DOM变化监听器已设置');
    } catch (error) {
      this.error('设置DOM变化监听器时发生错误:', error);
    }
  }

  // 增强的输入框内容设置和事件触发
  updateEditorContent(content) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.inputElement) {
          this.inputElement = this.findInputElement();
          if (!this.inputElement) {
            this.error('❌ 找不到输入框，无法更新内容');
            reject(new Error('找不到输入框'));
            return;
          }
        }

        this.log(`设置输入内容: ${content.substring(0, 50)}...`);

        // 确保输入框可见且可编辑
        if (this.inputElement.offsetParent === null || 
            this.inputElement.disabled || 
            this.inputElement.style.display === 'none' || 
            this.inputElement.style.visibility === 'hidden') {
          this.error('❌ 输入框不可见或不可编辑');
          reject(new Error('输入框不可见或不可编辑'));
          return;
        }

        // 聚焦输入框
        try {
          this.inputElement.focus();
          this.log('✅ 输入框已聚焦');
        } catch (err) {
          this.log('⚠️ 输入框聚焦失败，但继续尝试设置内容');
        }

        // 清空现有内容
        this.inputElement.value = '';
        if (this.inputElement.contentEditable === 'true') {
          this.inputElement.textContent = '';
        }

        // 设置新内容
        if (this.inputElement.contentEditable === 'true') {
          this.inputElement.textContent = content;
          // 触发input事件
          this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          // 触发textInput事件
          this.inputElement.dispatchEvent(new Event('textInput', { bubbles: true }));
          // 触发change事件
          this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          this.inputElement.value = content;
          // 触发input事件
          this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          // 触发change事件
          this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
          // 触发keyup事件
          this.inputElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
        }

        // 触发自定义事件
        this.inputElement.dispatchEvent(new CustomEvent('message-input', { 
          bubbles: true, 
          detail: { content } 
        }));

        // 验证内容是否设置成功
        setTimeout(() => {
          let currentContent = '';
          if (this.inputElement.contentEditable === 'true') {
            currentContent = this.inputElement.textContent || '';
          } else {
            currentContent = this.inputElement.value || '';
          }

          if (currentContent.trim().includes(content.trim().substring(0, 20))) {
            this.log('✅ 输入内容设置成功');
            resolve(true);
          } else {
            this.error(`❌ 输入内容设置失败，当前内容: ${currentContent.substring(0, 50)}`);
            reject(new Error('输入内容设置失败'));
          }
        }, 300);
      } catch (error) {
        this.error('更新编辑器内容时发生错误:', error);
        reject(error);
      }
    });
  }

  // 增强的消息发送机制
  sendMessage(content) {
    return new Promise((resolve, reject) => {
      try {
        if (this.isSending) {
          this.log('⚠️ 正在发送消息，请勿重复发送');
          reject(new Error('正在发送消息'));
          return;
        }

        this.isSending = true;
        this.log(`开始发送消息: ${content.substring(0, 50)}...`);

        // 分步骤执行消息发送
        const sendSteps = async () => {
          try {
            // 步骤1: 确保页面就绪
            const isReady = this.checkReady();
            if (!isReady) {
              throw new Error('页面未就绪');
            }

            // 步骤2: 更新输入框内容
            await this.updateEditorContent(content);
            this.log('✅ 输入框内容已更新');

            // 步骤3: 尝试多种方式发送消息
            const sendSuccess = await this.tryMultipleSendMethods();
            if (sendSuccess) {
              this.log('✅ 消息发送成功');
              this.isSending = false;
              resolve(true);
              return;
            } else {
              throw new Error('所有发送方式均失败');
            }
          } catch (error) {
            this.error(`❌ 发送消息失败: ${error.message}`);
            this.isSending = false;
            reject(error);
          }
        };

        sendSteps();
      } catch (error) {
        this.error('发送消息时发生错误:', error);
        this.isSending = false;
        reject(error);
      }
    });
  }

  // 尝试多种发送方式
  tryMultipleSendMethods() {
    return new Promise((resolve) => {
      try {
        let hasTriedSendButton = false;
        let hasTriedEnterKey = false;
        let hasTriedCtrlEnter = false;
        let attempts = 0;
        const maxAttempts = 5;

        const trySend = async () => {
          attempts++;
          this.log(`尝试发送消息 (${attempts}/${maxAttempts})...`);

          // 尝试1: 点击发送按钮
          if (!hasTriedSendButton && this.sendButton) {
            try {
              hasTriedSendButton = true;
              this.log('尝试点击发送按钮...');
              
              // 检查按钮是否可点击
              if (this.sendButton.disabled || 
                  this.sendButton.offsetParent === null || 
                  this.sendButton.style.display === 'none' || 
                  this.sendButton.style.visibility === 'hidden') {
                this.log('⚠️ 发送按钮不可点击');
              } else {
                // 触发点击事件
                this.sendButton.click();
                this.log('已触发发送按钮点击事件');
                
                // 等待短暂时间检查是否有加载状态
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 检查是否有加载状态，表示正在处理
                if (this.isTypingInProgress()) {
                  this.log('✅ 检测到加载状态，发送成功');
                  resolve(true);
                  return;
                }
              }
            } catch (error) {
              this.log(`点击发送按钮失败: ${error.message}`);
            }
          }

          // 尝试2: 模拟Enter键
          if (!hasTriedEnterKey && this.inputElement) {
            try {
              hasTriedEnterKey = true;
              this.log('尝试模拟Enter键...');
              
              // 确保输入框处于聚焦状态
              this.inputElement.focus();
              
              // 触发keydown事件
              this.inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                bubbles: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13
              }));
              
              // 触发keypress事件
              this.inputElement.dispatchEvent(new KeyboardEvent('keypress', {
                bubbles: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13
              }));
              
              // 触发keyup事件
              this.inputElement.dispatchEvent(new KeyboardEvent('keyup', {
                bubbles: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13
              }));
              
              this.log('已触发Enter键事件');
              
              // 等待短暂时间检查是否有加载状态
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 检查是否有加载状态，表示正在处理
              if (this.isTypingInProgress()) {
                this.log('✅ 检测到加载状态，发送成功');
                resolve(true);
                return;
              }
            } catch (error) {
              this.log(`模拟Enter键失败: ${error.message}`);
            }
          }

          // 尝试3: 模拟Ctrl+Enter组合键
          if (!hasTriedCtrlEnter && this.inputElement) {
            try {
              hasTriedCtrlEnter = true;
              this.log('尝试模拟Ctrl+Enter组合键...');
              
              // 确保输入框处于聚焦状态
              this.inputElement.focus();
              
              // 触发keydown事件
              this.inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                bubbles: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                ctrlKey: true
              }));
              
              // 触发keypress事件
              this.inputElement.dispatchEvent(new KeyboardEvent('keypress', {
                bubbles: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                ctrlKey: true
              }));
              
              // 触发keyup事件
              this.inputElement.dispatchEvent(new KeyboardEvent('keyup', {
                bubbles: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                ctrlKey: true
              }));
              
              this.log('已触发Ctrl+Enter组合键事件');
              
              // 等待短暂时间检查是否有加载状态
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 检查是否有加载状态，表示正在处理
              if (this.isTypingInProgress()) {
                this.log('✅ 检测到加载状态，发送成功');
                resolve(true);
                return;
              }
            } catch (error) {
              this.log(`模拟Ctrl+Enter组合键失败: ${error.message}`);
            }
          }

          // 如果所有尝试都失败，再次尝试
          if (attempts < maxAttempts) {
            this.log(`尝试失败，${attempts}秒后重试...`);
            setTimeout(trySend, attempts * 1000);
          } else {
            this.error('❌ 所有发送方式均失败');
            resolve(false);
          }
        };

        trySend();
      } catch (error) {
        this.error('尝试发送消息时发生错误:', error);
        resolve(false);
      }
    });
  }

  // 检查是否正在打字（加载状态）
  isTypingInProgress() {
    try {
      // 检查常见的加载指示器
      const loadingIndicators = [
        '.typing-indicator',
        '.loading-spinner',
        '[aria-label*="正在"]',
        '.assistant-typing',
        '.message-loading',
        '.thinking-indicator',
        '.answer-loading',
        'span:contains("正在输入")',
        'span:contains("思考中")'
      ];

      for (const selector of loadingIndicators) {
        let elements = [];
        
        if (selector.includes(':contains')) {
          const text = selector.match(/:contains\("(.*)"\)/)?.[1];
          if (text) {
            elements = Array.from(document.querySelectorAll('span')).filter(span => 
              span.textContent.includes(text) || span.innerHTML.includes(text)
            );
          }
        } else {
          elements = document.querySelectorAll(selector);
        }

        if (elements.length > 0) {
          for (const element of elements) {
            if (element && element.offsetParent !== null && element.style.display !== 'none') {
              this.log(`✅ 检测到加载状态: ${selector}`);
              return true;
            }
          }
        }
      }

      // 检查发送按钮状态变化
      if (this.sendButton && this.sendButton.disabled) {
        this.log('✅ 发送按钮已禁用，表示正在处理');
        return true;
      }

      // 检查输入框状态变化
      if (this.inputElement && this.inputElement.disabled) {
        this.log('✅ 输入框已禁用，表示正在处理');
        return true;
      }

      this.log('未检测到加载状态');
      return false;
    } catch (error) {
      this.error('检查加载状态时发生错误:', error);
      return false;
    }
  }

  // 等待回复
  waitForResponse() {
    return new Promise((resolve) => {
      try {
        let previousContent = '';
        let contentStableCount = 0;
        let checkCount = 0;
        const maxChecks = 60; // 最多检查60次，约1分钟
        const stableThreshold = 3; // 内容稳定3次视为完成

        this.log('开始等待回复...');

        const checkResponse = () => {
          checkCount++;
          
          try {
            // 检查是否还在打字
            const typingInProgress = this.isTypingInProgress();
            
            // 查找答案元素
            const answerElement = this.findAnswerElement();
            let currentContent = '';
            
            if (answerElement) {
              currentContent = answerElement.textContent || answerElement.innerText || '';
              answerElement.dataset.timestamp = Date.now().toString();
            }

            this.log(`检查回复 (${checkCount}/${maxChecks}) - 打字中: ${typingInProgress}, 内容长度: ${currentContent.length}`);

            // 判断条件
            if (checkCount >= maxChecks) {
              this.log('⚠️ 等待超时，返回当前内容');
              resolve(currentContent.trim());
              return;
            }

            // 检查内容是否稳定
            if (currentContent === previousContent && currentContent.length > 0) {
              contentStableCount++;
            } else {
              contentStableCount = 0;
              previousContent = currentContent;
            }

            // 满足条件时返回结果
            if (!typingInProgress && contentStableCount >= stableThreshold && currentContent.length > 0) {
              this.log('✅ 检测到回复已完成');
              resolve(currentContent.trim());
              return;
            }

            // 继续检查
            setTimeout(checkResponse, 1000);
          } catch (error) {
            this.error('检查回复时发生错误:', error);
            // 出错时继续检查
            setTimeout(checkResponse, 1000);
          }
        };

        // 开始检查
        setTimeout(checkResponse, 1000);
      } catch (error) {
        this.error('等待回复时发生错误:', error);
        resolve('');
      }
    });
  }

  // 监听问题消息
  listenForQuestions() {
    try {
      this.log('设置问题监听...');
      // 这里可以根据实际需求实现消息监听逻辑
      // 例如监听特定DOM元素的变化，或者通过WebSocket接收消息
    } catch (error) {
      this.error('设置问题监听时发生错误:', error);
    }
  }

  // 初始化助手
  init() {
    try {
      this.log('初始化助手...');
      this.setupMutationObserver();

      // 定期检查页面状态，确保元素可以被找到
      const checkInterval = setInterval(() => {
        try {
          this.log('定期检查页面状态...');
          const isReady = this.checkReady();
          
          if (isReady) {
            this.log('✅ 页面已准备就绪，停止定期检查');
            clearInterval(checkInterval);
            this.listenForQuestions();
          } else {
            this.retryCount++;
            if (this.retryCount >= this.maxRetries) {
              this.log(`⚠️ 已尝试${this.maxRetries}次，仍未找到页面元素，继续监听DOM变化`);
              this.retryCount = 0;
            }
          }
        } catch (error) {
          this.error('定期检查页面状态时发生错误:', error);
        }
      }, 2000);

      // 向background.js发送消息，告知内容脚本已加载
      window.postMessage({ type: 'AI_ASSISTANT_READY', aiName: '通义千问' }, '*');
      this.log('✅ 已通知background.js脚本已加载');
    } catch (error) {
      this.error('初始化助手时发生错误:', error);
    }
  }
}

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('[通义千问全局错误]', event.error);
});

// 页面加载完成后初始化助手
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    window.tongyiChatAssistant = new TongyiChatAssistant();
  }, 1000);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.tongyiChatAssistant = new TongyiChatAssistant();
    }, 1000);
  });
}