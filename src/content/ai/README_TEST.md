# AI脚本测试与调试指南

本指南将帮助您测试和调试通义和DeepSeek的内容脚本，以解决"不会键入数据和按确定键"的问题。

## 一、重新加载扩展

在修改了脚本文件后，您需要重新加载扩展才能使更改生效：

1. 打开Chrome浏览器，输入`chrome://extensions/`进入扩展管理页面
2. 打开右上角的"开发者模式"开关
3. 在您的扩展"MultiAI Answer"下方，点击"重新加载"按钮
4. 等待扩展重新加载完成

## 二、使用测试工具

我们为您创建了一个专用的测试工具，它会在通义和DeepSeek的页面上自动加载一个测试面板：

### 测试面板功能

1. **测试问题输入框**：输入您想要测试的问题
2. **AI类型选择**：选择要测试的AI类型（通义千问或DeepSeek）
3. **开始测试按钮**：点击后会模拟发送问题给AI
4. **重置面板按钮**：清空输入和日志
5. **测试日志区域**：显示测试过程中的详细日志信息

### 测试步骤

1. 打开通义千问或DeepSeek的页面
2. 等待页面加载完成，测试面板会自动显示在页面右上角
3. 在测试问题输入框中输入一个测试问题
4. 选择要测试的AI类型
5. 点击"开始测试"按钮
6. 观察测试日志，查看输入框和发送按钮的查找情况，以及消息发送是否成功

## 三、查看调试日志

我们增强了调试面板功能，您可以通过以下方式查看详细的调试日志：

### 方法1：使用调试面板

1. 在通义或DeepSeek页面上，按`Alt+D`快捷键可以显示/隐藏调试面板
2. 调试面板会显示所有脚本执行的详细日志，包括元素查找、内容设置、消息发送等过程
3. 日志会根据类型（成功/失败/警告）以不同颜色显示，方便您快速识别问题

### 方法2：使用浏览器控制台

1. 按`F12`打开浏览器开发者工具
2. 切换到"控制台"(Console)选项卡
3. 查看脚本执行的日志信息，包括我们添加的详细调试信息

### 方法3：使用全局调试函数

我们添加了一个全局调试函数`window.aiDebug`，您可以在控制台中直接调用：

```javascript
// 显示调试面板
window.aiDebug.show();

// 隐藏调试面板
window.aiDebug.hide();

// 输出调试日志
window.aiDebug.log('这是一条测试日志');

// 输出错误日志
window.aiDebug.error('这是一条错误日志');

// 输出成功日志
window.aiDebug.success('这是一条成功日志');
```

## 四、常见问题及解决方案

### 问题1：测试面板不显示

**解决方案**：
- 刷新页面，确保测试脚本正确加载
- 在控制台中手动执行以下代码来创建测试面板：
  ```javascript
  if (window.aiTest && window.aiTest.startTest) {
    console.log('测试工具已加载');
  } else {
    console.log('测试工具未加载，尝试手动创建测试面板...');
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/content/ai/test-script.js');
    document.body.appendChild(script);
  }
  ```

### 问题2：无法找到输入框或发送按钮

**解决方案**：
- 检查页面是否已完全加载
- 查看调试日志，了解脚本尝试了哪些选择器
- 如果网站结构有变化，可能需要更新`findInputElement`和`findSendButton`方法中的选择器

### 问题3：消息可以设置但无法发送

**解决方案**：
- 检查发送按钮是否被禁用
- 尝试使用不同的发送方法（点击按钮、按Enter键、按Ctrl+Enter组合键）
- 查看调试日志，了解发送过程中遇到了什么错误

### 问题4：调试日志不显示

**解决方案**：
- 按`Alt+D`快捷键切换调试面板的显示状态
- 检查控制台是否有JavaScript错误
- 尝试在控制台中执行`window.aiDebug.show()`来强制显示调试面板

## 五、测试完成后的清理

测试完成后，如果您不想再看到测试面板，可以：

1. 点击测试面板中的"重置面板"按钮清空内容
2. 或者在manifest.json文件中移除测试脚本的引用
3. 或者在控制台中执行`document.getElementById('ai-test-panel').remove()`来移除测试面板

## 六、高级调试技巧

1. **元素检查**：使用浏览器开发者工具的"检查"功能，查看输入框和发送按钮的实际HTML结构和属性

2. **手动测试**：在控制台中手动调用AI助手的方法进行测试：
   ```javascript
   // 获取AI助手实例
   const assistant = window.deepseekChatAssistant || window.tongyiChatAssistant;
   
   // 查找输入框
   const input = assistant.findInputElement();
   console.log('输入框:', input);
   
   // 查找发送按钮
   const button = assistant.findSendButton();
   console.log('发送按钮:', button);
   
   // 尝试设置内容
   if (input) {
     assistant.updateEditorContent('这是一条测试消息');
   }
   
   // 尝试发送消息
   assistant.sendMessage('这是一条完整的测试消息').then(() => {
     console.log('发送成功');
   }).catch(err => {
     console.error('发送失败:', err);
   });
   ```

3. **消息监听**：监听页面上的消息通信：
   ```javascript
   window.addEventListener('message', function(event) {
     if (event.data && event.data.type) {
       console.log('收到消息:', event.data);
     }
   });
   ```

希望本指南能帮助您成功测试和调试AI脚本！如果您有任何问题，请随时联系我们。