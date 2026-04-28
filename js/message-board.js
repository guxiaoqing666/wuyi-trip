// ============================================
// 匿名留言板 - JSONBin.io API
// 无需注册，免费使用，简单REST API
// ============================================

(function() {
  'use strict';

  // JSONBin.io 配置
  // 使用公共的 bin（任何人可读写）
  const JSONBIN_API_KEY = '$2a$10$YourApiKeyHere'; // 免费版可以留空或填任意值
  const JSONBIN_BIN_ID = 'wuyi_trip_messages_v1'; // 自定义bin ID
  const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';
  
  // 备用：使用 jsonblob.com（更简单，无需key）
  const JSONBLOB_BASE = 'https://jsonblob.com/api/jsonBlob';
  
  // 缓存
  let messagesCache = [];
  let blobId = null; // jsonblob的ID

  /**
   * 初始化：创建或获取存储blob
   */
  async function initStorage() {
    try {
      // 尝试从localStorage读取已有的blobId
      blobId = localStorage.getItem('wuyi_trip_blob_id');
      
      if (blobId) {
        // 尝试读取已有数据
        const response = await fetch(`${JSONBLOB_BASE}/${blobId}`);
        if (response.ok) {
          const data = await response.json();
          messagesCache = data.messages || [];
          return;
        }
      }
      
      // 创建新的blob
      const response = await fetch(JSONBLOB_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] })
      });
      
      if (response.ok) {
        // 从Location头获取blobId
        const location = response.headers.get('Location');
        if (location) {
          blobId = location.split('/').pop();
          localStorage.setItem('wuyi_trip_blob_id', blobId);
        }
        messagesCache = [];
      }
    } catch (err) {
      console.warn('初始化存储失败:', err);
      // 降级到纯localStorage
      messagesCache = JSON.parse(localStorage.getItem('wuyi_trip_messages') || '[]');
    }
  }

  /**
   * 保存数据到blob
   */
  async function saveStorage() {
    if (!blobId) return;
    
    try {
      await fetch(`${JSONBLOB_BASE}/${blobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesCache })
      });
    } catch (err) {
      console.warn('保存到云端失败:', err);
    }
    
    // 同时保存到localStorage作为备份
    localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
  }

  /**
   * 获取所有留言
   */
  async function fetchMessages() {
    // 优先从缓存返回
    if (messagesCache.length > 0) {
      return messagesCache;
    }
    
    // 尝试从localStorage恢复
    const local = localStorage.getItem('wuyi_trip_messages');
    if (local) {
      messagesCache = JSON.parse(local);
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

    if (content.length > 100) {
      throw new Error('留言内容不能超过100字');
    }

    const message = {
      id: Date.now(),
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    messagesCache.unshift(message);
    
    // 限制存储数量（保留最近100条）
    if (messagesCache.length > 100) {
      messagesCache = messagesCache.slice(0, 100);
    }
    
    await saveStorage();
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
      await initStorage();
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
