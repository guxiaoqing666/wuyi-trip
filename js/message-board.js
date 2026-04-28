// ============================================
// 匿名留言板 - 纯 localStorage 实现
// 无需后端，数据存在浏览器本地
// ============================================

(function() {
  'use strict';

  const STORAGE_KEY = 'wuyi_trip_messages_v2';
  const MAX_MESSAGES = 100;

  // 缓存
  let messagesCache = [];

  /**
   * 从localStorage读取
   */
  function loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        messagesCache = JSON.parse(data);
      }
    } catch (err) {
      console.warn('读取留言失败:', err);
      messagesCache = [];
    }
  }

  /**
   * 保存到localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesCache));
    } catch (err) {
      console.warn('保存留言失败:', err);
    }
  }

  /**
   * 获取所有留言
   */
  async function fetchMessages() {
    loadFromStorage();
    return messagesCache;
  }

  /**
   * 发送留言
   */
  async function sendMessage(content) {
    if (!content || content.trim().length === 0) {
      throw new Error('留言内容不能为空');
    }

    if (content.length > 100) {
      throw new Error('留言内容不能超过100字');
    }

    const message = {
      id: Date.now(),
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    messagesCache.unshift(message);
    
    // 限制数量
    if (messagesCache.length > MAX_MESSAGES) {
      messagesCache = messagesCache.slice(0, MAX_MESSAGES);
    }
    
    saveToStorage();
    return message;
  }

  /**
   * 格式化时间
   */
  function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /**
   * 显示弹幕
   */
  function showDanmu(text, isNew = false) {
    const container = document.getElementById('danmuContainer');
    if (!container) return;

    const danmu = document.createElement('div');
    danmu.className = 'danmu-item';
    danmu.textContent = text;
    danmu.style.top = Math.random() * 80 + 'px';
    
    if (isNew) {
      danmu.style.color = '#e74c3c';
      danmu.style.background = 'rgba(255, 235, 238, 0.9)';
      danmu.style.border = '1px solid #ffcdd2';
    }

    container.appendChild(danmu);
    setTimeout(() => danmu.remove(), 8000);
  }

  /**
   * 随机播放历史留言为弹幕
   */
  function startDanmuPlayback() {
    if (messagesCache.length === 0) return;

    let index = 0;
    const shuffled = [...messagesCache].sort(() => Math.random() - 0.5);
    
    const playNext = () => {
      if (index < shuffled.length) {
        showDanmu(shuffled[index].content);
        index++;
      } else {
        index = 0;
      }
    };

    playNext();
    return setInterval(playNext, 3000);
  }

  /**
   * 渲染留言板
   */
  function renderMessageBoard() {
    const container = document.getElementById('message-board-list');
    if (!container) return;

    if (messagesCache.length === 0) {
      container.innerHTML = '<div class="message-empty">暂无留言，快来抢沙发~<br><small>（留言只保存在当前设备）</small></div>';
      return;
    }

    container.innerHTML = messagesCache.map(msg => `
      <div class="message-item">
        <div class="message-content">${escapeHtml(msg.content)}</div>
        <div class="message-time">${formatTime(msg.createdAt)}</div>
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 初始化留言板
   */
  async function init() {
    try {
      loadFromStorage();
      renderMessageBoard();
      
      // 启动弹幕播放
      const danmuTimer = startDanmuPlayback();
      
      return { danmuTimer };
    } catch (err) {
      console.warn('留言板初始化失败:', err);
    }
  }

  // 公开API
  window.MessageBoard = {
    init: init,
    send: sendMessage,
    fetch: fetchMessages,
    render: renderMessageBoard,
    showDanmu: showDanmu,
    getMessages: () => messagesCache
  };

})();
