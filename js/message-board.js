// ============================================
// 匿名留言板 - 连接本地后端服务
// 支持匿名留言、弹幕、访问统计
// ============================================

(function() {
  'use strict';

  // 后端 API 地址
  const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'http://localhost:3000/api'; // GitHub Pages 无法直接访问 localhost

  // 缓存
  let messagesCache = [];
  let statsCache = { totalMessages: 0, totalVisits: 0 };
  let danmuTimer = null;

  // ============================================
  // API 请求
  // ============================================

  /**
   * 获取所有留言
   */
  async function fetchMessages() {
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      
      const result = await response.json();
      if (result.success) {
        messagesCache = result.data || [];
        // 备份到 localStorage
        localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
      }
    } catch (err) {
      console.warn('获取留言失败:', err.message);
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

    const trimmed = content.trim();

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '发送失败');
      }

      // 更新缓存
      messagesCache.unshift(result.data);
      localStorage.setItem('wuyi_trip_messages', JSON.stringify(messagesCache));
      
      return result.data;
    } catch (err) {
      console.warn('发送留言到后端失败:', err.message);
      // 降级到 localStorage
      const message = {
        id: Date.now(),
        content: trimmed,
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
   * 获取统计
   */
  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE}/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('HTTP ' + response.status);
      
      const result = await response.json();
      if (result.success && result.data) {
        statsCache = result.data;
      }
    } catch (err) {
      console.warn('获取统计失败:', err.message);
      // 使用本地数据
      statsCache = {
        totalMessages: messagesCache.length,
        totalVisits: 0
      };
    }
    return statsCache;
  }

  // ============================================
  // UI 渲染
  // ============================================

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
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /**
   * 转义 HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 渲染留言列表
   */
  function renderMessageBoard() {
    const container = document.getElementById('message-board-list');
    if (!container) return;

    if (messagesCache.length === 0) {
      container.innerHTML = '<div class="message-empty">暂无留言，快来抢沙发~ 🛋️</div>';
      return;
    }

    container.innerHTML = messagesCache.slice(0, 50).map(msg => `
      <div class="message-item">
        <div class="message-content">${escapeHtml(msg.content)}</div>
        <div class="message-time">${formatTime(msg.createdAt)}</div>
      </div>
    `).join('');
  }

  /**
   * 更新统计显示
   */
  function updateStatsDisplay() {
    const msgEl = document.getElementById('statsMessages');
    const visitEl = document.getElementById('statsVisits');
    const badge = document.getElementById('messageBadge');
    
    if (msgEl) msgEl.textContent = statsCache.totalMessages || messagesCache.length;
    if (visitEl) visitEl.textContent = statsCache.totalVisits || 0;
    
    // 更新角标
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

  /**
   * 显示单条弹幕
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
   * 启动弹幕轮播
   */
  function startDanmuPlayback() {
    // 先停止旧的
    if (danmuTimer) {
      clearInterval(danmuTimer);
      danmuTimer = null;
    }

    // 合并默认弹幕和留言
    const defaultDanmus = [
      '小庆开车稳！🚗',
      '都老师今天吃什么？🍜',
      '香香拍照好看！📸',
      '程老师注意休息⛽',
      '海边风好大💨',
      '咸鸭蛋真香🥚',
      '小庆开车辛苦了💪',
      '香香替换让小庆歇会儿👍',
      '安全第一！🛡️',
      '五一快乐！🎉'
    ];

    const messageTexts = messagesCache.map(m => m.content).filter(t => t.length <= 30);
    const allDanmus = [...messageTexts, ...defaultDanmus];
    
    if (allDanmus.length === 0) return;

    let index = 0;
    const shuffled = [...allDanmus].sort(() => Math.random() - 0.5);
    
    const playNext = () => {
      if (index < shuffled.length) {
        showDanmu(shuffled[index]);
        index++;
      } else {
        index = 0;
      }
    };

    playNext();
    danmuTimer = setInterval(playNext, 3000);
    return danmuTimer;
  }

  /**
   * 停止弹幕
   */
  function stopDanmu() {
    if (danmuTimer) {
      clearInterval(danmuTimer);
      danmuTimer = null;
    }
  }

  // ============================================
  // 初始化
  // ============================================

  async function init() {
    try {
      // 获取留言
      await fetchMessages();
      
      // 获取统计
      await fetchStats();
      
      // 渲染
      renderMessageBoard();
      updateStatsDisplay();
      
      // 记录访问
      recordVisit();
      
      // 启动弹幕
      startDanmuPlayback();
      
      console.log('✅ 留言板初始化完成，留言数:', messagesCache.length);
    } catch (err) {
      console.warn('留言板初始化失败:', err);
    }
  }

  // ============================================
  // 公开 API
  // ============================================
  window.MessageBoard = {
    init: init,
    send: sendMessage,
    fetch: fetchMessages,
    render: renderMessageBoard,
    updateStats: updateStatsDisplay,
    showDanmu: showDanmu,
    startDanmu: startDanmuPlayback,
    stopDanmu: stopDanmu,
    getMessages: () => messagesCache,
    getStats: () => statsCache
  };

})();
