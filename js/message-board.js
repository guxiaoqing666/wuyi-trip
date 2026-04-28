// ============================================
// 匿名留言板 - 连接本地后端服务
// 支持匿名留言，数据存在你的电脑上
// ============================================

(function() {
  'use strict';

  // 后端 API 地址
  // 本地开发用 localhost，部署后需要改为你的内网IP或公网地址
  const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'http://localhost:3000/api'; // 部署后需要修改

  // 缓存
  let messagesCache = [];

  /**
   * 获取所有留言
   */
  async function fetchMessages() {
    try {
      const response = await fetch(`${API_BASE}/messages`);
      const result = await response.json();
      if (result.success) {
        messagesCache = result.data;
      }
    } catch (err) {
      console.warn('获取留言失败:', err);
      // 降级到 localStorage
      messagesCache = JSON.parse(localStorage.getItem('wuyi_trip_messages') || '[]');
    }
    return messagesCache;
  }

  /**
   * 发送留言
   */
  async function sendMessage(content) {
    if (!content || content.trim().length === 0) {
      throw new Error('留言内容不能为空');
    }

    if (content.length > 200) {
      throw new Error('留言内容不能超过200字');
    }

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '发送失败');
      }

      // 更新缓存
      messagesCache.unshift(result.data);
      
      // 同时备份到 localStorage
      localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
      
      return result.data;
    } catch (err) {
      console.warn('发送留言失败:', err);
      // 降级到 localStorage
      const message = {
        id: Date.now(),
        content: content.trim(),
        createdAt: new Date().toISOString()
      };
      messagesCache.unshift(message);
      localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
      return message;
    }
  }

  /**
   * 记录访问
   */
  async function recordVisit() {
    try {
      await fetch(`${API_BASE}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: window.location.href })
      });
    } catch (err) {
      // 静默失败
    }
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
      container.innerHTML = '<div class="message-empty">暂无留言，快来抢沙发~</div>';
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
      await fetchMessages();
      renderMessageBoard();
      
      // 记录访问
      recordVisit();
      
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
