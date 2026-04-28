// ============================================
// 匿名留言板 - 使用后端 API
// 支持：留言、点赞、删除、实时同步、在线人数
// ============================================

(function() {
  'use strict';

  const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'http://localhost:3000/api';
  const POLL_INTERVAL = 10000; // 10秒轮询
  
  let messagesCache = [];
  let statsCache = {};
  let danmuTimer = null;
  let pollTimer = null;
  let myIP = null;

  // ============================================
  // 工具函数
  // ============================================
  
  function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'danmu-toast';
    toast.textContent = msg;
    if (type === 'error') toast.style.background = '#e74c3c';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // ============================================
  // API 请求
  // ============================================

  async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // ============================================
  // 数据操作
  // ============================================

  async function fetchMessages() {
    try {
      const result = await apiGet('/messages');
      if (result.success) {
        messagesCache = result.data;
        localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
      }
    } catch (err) {
      console.warn('获取留言失败:', err.message);
      messagesCache = JSON.parse(localStorage.getItem('wuyi_trip_messages') || '[]');
    }
    return messagesCache;
  }

  async function sendMessage(content, nickname) {
    if (!content || content.trim().length === 0) {
      throw new Error('留言内容不能为空');
    }
    if (content.length > 200) {
      throw new Error('留言内容不能超过200字');
    }

    try {
      const result = await apiPost('/messages', { 
        content: content.trim(),
        nickname: nickname || '匿名游客'
      });
      if (!result.success) throw new Error(result.error);
      
      messagesCache.unshift(result.data);
      localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
      return result.data;
    } catch (err) {
      // 降级到 localStorage
      const message = {
        id: Date.now(),
        content: content.trim(),
        nickname: nickname || '匿名游客',
        createdAt: new Date().toISOString()
      };
      messagesCache.unshift(message);
      localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
      return message;
    }
  }

  async function deleteMessage(id) {
    try {
      await apiDelete(`/messages/${id}`);
      messagesCache = messagesCache.filter(m => m.id !== id);
      localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
      return true;
    } catch (err) {
      showToast('删除失败: ' + err.message, 'error');
      return false;
    }
  }

  async function likeMessage(id) {
    try {
      const result = await apiPost(`/messages/${id}/like`);
      if (result.success) {
        // 更新本地缓存
        const msg = messagesCache.find(m => m.id === id);
        if (msg) {
          msg.likes = result.data.likes;
          msg.likedByMe = result.data.liked;
        }
        return result.data;
      }
    } catch (err) {
      console.warn('点赞失败:', err.message);
    }
    return null;
  }

  async function fetchStats() {
    try {
      const result = await apiGet('/stats');
      if (result.success) {
        statsCache = result.data;
      }
    } catch (err) {
      console.warn('获取统计失败:', err.message);
    }
    return statsCache;
  }

  async function recordVisit() {
    try {
      await apiPost('/visit', { url: window.location.href });
    } catch (err) {
      // 静默失败
    }
  }

  // ============================================
  // UI 渲染
  // ============================================

  function renderMessageBoard() {
    const container = document.getElementById('message-board-list');
    if (!container) return;

    if (messagesCache.length === 0) {
      container.innerHTML = '<div class="message-empty">暂无留言，快来抢沙发~ 🛋️</div>';
      return;
    }

    container.innerHTML = messagesCache.slice(0, 50).map(msg => {
      const canDelete = msg.ip === myIP || !msg.ip; // 自己的或本地存储的
      const likeClass = msg.likedByMe ? 'liked' : '';
      
      return `
        <div class="message-item" data-id="${msg.id}">
          <div class="message-header">
            <span class="message-nickname">${escapeHtml(msg.nickname || '匿名')}</span>
            <span class="message-time">${formatTime(msg.createdAt)}</span>
          </div>
          <div class="message-content">${escapeHtml(msg.content)}</div>
          <div class="message-actions">
            <button class="like-btn ${likeClass}" onclick="MessageBoard.like(${msg.id})">
              ❤️ <span>${msg.likes || 0}</span>
            </button>
            ${canDelete ? `<button class="delete-btn" onclick="MessageBoard.delete(${msg.id})">🗑️</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function updateStatsDisplay() {
    const msgEl = document.getElementById('statsMessages');
    const visitEl = document.getElementById('statsVisits');
    const onlineEl = document.getElementById('statsOnline');
    const badge = document.getElementById('messageBadge');
    
    if (msgEl) msgEl.textContent = statsCache.totalMessages || messagesCache.length;
    if (visitEl) visitEl.textContent = statsCache.totalVisits || 0;
    if (onlineEl) onlineEl.textContent = statsCache.onlineNow || 0;
    
    if (badge) {
      const count = messagesCache.length;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.add('show');
      }
    }
  }

  // ============================================
  // 弹幕
  // ============================================

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

  function startDanmuPlayback() {
    if (danmuTimer) clearInterval(danmuTimer);

    const defaultDanmus = [
      '小庆开车稳！🚗', '都老师今天吃什么？🍜', '香香拍照好看！📸',
      '程老师注意休息⛽', '海边风好大💨', '咸鸭蛋真香🥚',
      '小庆开车辛苦了💪', '安全第一！🛡️', '五一快乐！🎉'
    ];

    const messageTexts = messagesCache
      .filter(m => m.content.length <= 30)
      .map(m => m.content);
    
    const allDanmus = [...messageTexts, ...defaultDanmus];
    if (allDanmus.length === 0) return;

    let index = 0;
    const shuffled = [...allDanmus].sort(() => Math.random() - 0.5);
    
    const playNext = () => {
      showDanmu(shuffled[index % shuffled.length]);
      index++;
    };

    playNext();
    danmuTimer = setInterval(playNext, 3000);
  }

  // ============================================
  // 实时同步
  // ============================================

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    
    pollTimer = setInterval(async () => {
      // 只在留言板打开时刷新
      const panel = document.getElementById('messageBoardPanel');
      if (panel && panel.classList.contains('active')) {
        await fetchMessages();
        renderMessageBoard();
        await fetchStats();
        updateStatsDisplay();
      }
    }, POLL_INTERVAL);
  }

  // ============================================
  // 初始化
  // ============================================

  async function init() {
    try {
      // 获取本机 IP（用于判断能否删除）
      try {
        const health = await apiGet('/health');
        myIP = health.data?.myIP || 'local';
      } catch {}
      
      await fetchMessages();
      await fetchStats();
      renderMessageBoard();
      updateStatsDisplay();
      recordVisit();
      startDanmuPlayback();
      startPolling();
      
      console.log('✅ 留言板初始化完成');
    } catch (err) {
      console.warn('留言板初始化失败:', err);
    }
  }

  // ============================================
  // 公开 API
  // ============================================
  window.MessageBoard = {
    init,
    send: sendMessage,
    delete: deleteMessage,
    like: likeMessage,
    fetch: fetchMessages,
    render: renderMessageBoard,
    updateStats: updateStatsDisplay,
    showDanmu,
    startDanmu: startDanmuPlayback,
    getMessages: () => messagesCache,
    getStats: () => statsCache
  };

})();
