// ============================================
// 智能行程进度 - 基于时间自动定位当前行程
// ============================================

(function() {
  'use strict';

  // 行程日期配置（2026年五一）
  const TRIP_YEAR = 2026;
  const TRIP_DATES = [
    { month: 5, day: 1 },   // Day1
    { month: 5, day: 2 },   // Day2
    { month: 5, day: 3 },   // Day3
    { month: 5, day: 4 },   // Day4
    { month: 5, day: 5 },   // Day5
  ];

  // 调试模式：允许通过 URL 参数 ?mockDate=5-1&mockTime=08:30 模拟时间
  function getMockDate() {
    const params = new URLSearchParams(window.location.search);
    const mockDate = params.get('mockDate');
    const mockTime = params.get('mockTime');
    if (mockDate) {
      const [m, d] = mockDate.split('-').map(Number);
      const [h = 12, min = 0] = (mockTime || '12:00').split(':').map(Number);
      return new Date(TRIP_YEAR, m - 1, d, h, min);
    }
    return null;
  }

  // 解析时间字符串为分钟数（从0点开始）
  function parseTimeToMinutes(timeStr) {
    // 处理 "08:00"、"08:00-09:30"、"10:00" 等格式
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }

  // 获取当前行程状态
  function getCurrentTripStatus() {
    const now = getMockDate() || new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 旅行前
    const tripStart = new Date(TRIP_YEAR, 4, 1, 6, 0); // 5月1日 6:00
    if (now < tripStart) {
      return { phase: 'before', daysUntil: Math.ceil((tripStart - now) / (86400000)) };
    }

    // 旅行后
    const tripEnd = new Date(TRIP_YEAR, 4, 5, 14, 30); // 5月5日 14:30
    if (now > tripEnd) {
      return { phase: 'after', daysSince: Math.floor((now - tripEnd) / 86400000) };
    }

    // 旅行中 - 找到当前是第几天（支持跨年的演示模式）
    let dayIndex = -1;
    for (let i = 0; i < TRIP_DATES.length; i++) {
      if (currentMonth === TRIP_DATES[i].month && currentDay === TRIP_DATES[i].day) {
        dayIndex = i;
        break;
      }
    }
    // 如果日期不匹配任何行程日，但时间在行程期间，默认显示Day1（用于演示）
    if (dayIndex === -1 && now >= tripStart && now <= tripEnd) {
      dayIndex = 0;
    }

    if (dayIndex === -1) {
      // 在旅行期间但不在任何行程日（理论上不会发生）
      return { phase: 'during', dayIndex: -1 };
    }

    // 找到当前进行中的行程节点
    const dayData = TRIP_DATA.days[dayIndex];
    let currentNodeIndex = -1;
    let nextNodeIndex = -1;
    let progressInDay = 0;

    for (let i = 0; i < dayData.schedule.length; i++) {
      const node = dayData.schedule[i];
      const nodeStart = parseTimeToMinutes(node.time);
      if (nodeStart === null) continue;

      // 获取下一个节点的时间作为结束
      let nodeEnd = null;
      for (let j = i + 1; j < dayData.schedule.length; j++) {
        nodeEnd = parseTimeToMinutes(dayData.schedule[j].time);
        if (nodeEnd !== null) break;
      }
      if (nodeEnd === null) nodeEnd = nodeStart + 120; // 默认2小时

      if (currentMinutes >= nodeStart && currentMinutes < nodeEnd) {
        currentNodeIndex = i;
        progressInDay = (i / dayData.schedule.length) * 100;
        break;
      } else if (currentMinutes < nodeStart && nextNodeIndex === -1) {
        nextNodeIndex = i;
      }
    }

    // 如果当前时间超过了当天所有节点
    if (currentNodeIndex === -1 && dayData.schedule.length > 0) {
      const lastNode = dayData.schedule[dayData.schedule.length - 1];
      const lastTime = parseTimeToMinutes(lastNode.time);
      if (lastTime !== null && currentMinutes >= lastTime) {
        currentNodeIndex = dayData.schedule.length - 1;
        progressInDay = 100;
      }
    }

    return {
      phase: 'during',
      dayIndex,
      currentNodeIndex,
      nextNodeIndex,
      progressInDay,
      dayData
    };
  }

  // 更新进度条（基于时间而非滚动）
  function updateTimeProgress() {
    const status = getCurrentTripStatus();
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    if (!fill || !text) return;

    let progress = 0;
    let label = '';

    if (status.phase === 'before') {
      progress = 0;
      label = `还有 ${status.daysUntil} 天出发`;
      fill.style.background = 'linear-gradient(90deg, #74b9ff, #0984e3)';
    } else if (status.phase === 'after') {
      progress = 100;
      label = '旅行已结束 💝';
      fill.style.background = 'linear-gradient(90deg, #fd79a8, #e84393)';
    } else {
      // 旅行中
      const totalDays = 5;
      const dayProgress = (status.dayIndex / totalDays) * 100;
      const nodeProgress = status.progressInDay / totalDays;
      progress = Math.round(dayProgress + nodeProgress);
      if (progress > 100) progress = 100;

      if (status.currentNodeIndex >= 0) {
        const node = status.dayData.schedule[status.currentNodeIndex];
        label = `Day${status.dayIndex + 1} · ${node.title}`;
      } else if (status.nextNodeIndex >= 0) {
        const node = status.dayData.schedule[status.nextNodeIndex];
        label = `即将开始 · ${node.title}`;
      } else {
        label = `Day${status.dayIndex + 1} 进行中`;
      }
      fill.style.background = 'linear-gradient(90deg, #e74c3c, #f39c12, #27ae60)';
    }

    fill.style.width = progress + '%';
    text.textContent = label;

    return status;
  }

  // 高亮当前行程节点
  function highlightCurrentNode() {
    const status = getCurrentTripStatus();

    // 清除所有高亮
    document.querySelectorAll('.timeline-item').forEach(item => {
      item.classList.remove('current-node', 'past-node');
    });
    document.querySelectorAll('.day-card').forEach(card => {
      card.classList.remove('current-day', 'past-day');
    });

    if (status.phase !== 'during') return;

    // 标记已完成的日期
    for (let i = 0; i < status.dayIndex; i++) {
      const card = document.getElementById(`day-${i}`);
      if (card) card.classList.add('past-day');
    }

    // 标记当前日期
    const currentCard = document.getElementById(`day-${status.dayIndex}`);
    if (currentCard) currentCard.classList.add('current-day');

    // 标记当前节点和已完成节点
    const timelineItems = currentCard?.querySelectorAll('.timeline-item');
    if (!timelineItems) return;

    timelineItems.forEach((item, idx) => {
      if (idx < status.currentNodeIndex) {
        item.classList.add('past-node');
      } else if (idx === status.currentNodeIndex) {
        item.classList.add('current-node');
        // 滚动到当前节点（只在首次加载时）
        if (!window._hasAutoScrolled) {
          window._hasAutoScrolled = true;
          setTimeout(() => {
            const navHeight = document.querySelector('.quick-nav-sticky')?.offsetHeight || 60;
            const top = item.getBoundingClientRect().top + window.pageYOffset - navHeight - 100;
            window.scrollTo({ top, behavior: 'smooth' });
          }, 800);
        }
      }
    });
  }

  // 添加当前节点指示器
  function addLiveIndicator() {
    const status = getCurrentTripStatus();
    if (status.phase !== 'during' || status.currentNodeIndex < 0) return;

    const currentCard = document.getElementById(`day-${status.dayIndex}`);
    if (!currentCard) return;

    // 检查是否已存在指示器
    if (currentCard.querySelector('.live-indicator')) return;

    const indicator = document.createElement('div');
    indicator.className = 'live-indicator';
    indicator.innerHTML = `
      <span class="live-dot"></span>
      <span class="live-text">正在进行</span>
    `;

    const header = currentCard.querySelector('.day-header');
    if (header) header.appendChild(indicator);
  }

  // 初始化
  function init() {
    updateTimeProgress();
    highlightCurrentNode();
    addLiveIndicator();

    // 每分钟更新一次
    setInterval(() => {
      updateTimeProgress();
      highlightCurrentNode();
      addLiveIndicator();
    }, 60000);
  }

  // 暴露全局方法
  window.TripProgress = {
    getStatus: getCurrentTripStatus,
    refresh() {
      updateTimeProgress();
      highlightCurrentNode();
      addLiveIndicator();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  } else {
    setTimeout(init, 500);
  }
})();
