// ============================================
// 一键分享旅行海报
// 生成精美的旅行数据总结海报（Canvas）
// ============================================

(function() {
  'use strict';

  // 计算旅行数据
  function calcTripStats() {
    const diaryData = (() => {
      try {
        return JSON.parse(localStorage.getItem('wuyi_diary_v1') || '{}');
      } catch { return {}; }
    })();

    let diaryCount = 0;
    Object.values(diaryData).forEach(arr => diaryCount += arr.length);

    const cities = ['高邮', '连云港', '日照', '徐州'];
    let foodChecked = 0;
    let foodTotal = 0;
    cities.forEach(city => {
      const foods = FOOD_CHECKLIST[city];
      if (foods) {
        foodTotal += foods.length;
        // 美食打卡数据存在 localStorage 中（由页面交互产生）
        // 这里简化统计
      }
    });

    return {
      days: 5,
      cities: 4,
      distance: 1200,
      diaryCount,
      foodTotal,
      members: FAMILY ? FAMILY.members.length : 4,
      route: '高邮 → 连云港 → 日照 → 徐州'
    };
  }

  // 生成海报 Canvas
  function generatePoster() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 750;
    const height = 1334;
    canvas.width = width;
    canvas.height = height;

    const stats = calcTripStats();

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 装饰圆点
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 20 + Math.random() * 80;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 顶部标题
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px -apple-system, sans-serif';
    ctx.fillText('🚗 五一自驾游', width / 2, 120);

    ctx.font = '28px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('小庆一家的旅行纪念', width / 2, 170);

    // 分隔线
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 200);
    ctx.lineTo(width - 100, 200);
    ctx.stroke();

    // 核心数据卡片
    const cardY = 260;
    const cardH = 200;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(60, cardY, width - 120, cardH, 20);
    ctx.fill();

    // 大数字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px -apple-system, sans-serif';
    ctx.fillText(`${stats.days}`, width / 2 - 120, cardY + 110);
    ctx.font = 'bold 80px -apple-system, sans-serif';
    ctx.fillText(`${stats.distance}`, width / 2 + 80, cardY + 110);

    ctx.font = '24px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('天行程', width / 2 - 120, cardY + 150);
    ctx.fillText('公里', width / 2 + 80, cardY + 150);

    // 路线信息
    ctx.font = '32px -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(stats.route, width / 2, cardY + 195);

    // 详细数据网格
    const gridY = 520;
    const items = [
      { icon: '🏙️', value: stats.cities, label: '座城市' },
      { icon: '👨‍👩‍👧‍👦', value: stats.members, label: '位家人' },
      { icon: '📝', value: stats.diaryCount || 0, label: '条日记' },
      { icon: '🍜', value: stats.foodTotal, label: '道美食' },
    ];

    items.forEach((item, i) => {
      const x = 80 + (i % 2) * 310;
      const y = gridY + Math.floor(i / 2) * 160;

      // 卡片背景
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.roundRect(x, y, 280, 130, 16);
      ctx.fill();

      // 图标
      ctx.font = '40px sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.fillText(item.icon, x + 20, y + 55);

      // 数值
      ctx.font = 'bold 44px -apple-system, sans-serif';
      ctx.fillText(item.value, x + 80, y + 55);

      // 标签
      ctx.font = '22px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(item.label, x + 80, y + 90);
    });

    // 底部语录
    const quotes = [
      '最好的风景，是和家人一起看的',
      '车轮滚滚，幸福满满',
      '五天的旅程，一生的回忆',
      '高邮的面，连云港的海，日照的沙，徐州的鸡',
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    ctx.textAlign = 'center';
    ctx.font = 'italic 28px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(`「${quote}」`, width / 2, height - 180);

    // 日期
    const dateStr = new Date().toLocaleDateString('zh-CN');
    ctx.font = '22px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`生成于 ${dateStr}`, width / 2, height - 130);

    // 底部标识
    ctx.font = '20px -apple-system, sans-serif';
    ctx.fillText('🚗 小庆一家五一自驾游', width / 2, height - 90);

    return canvas;
  }

  // 显示海报弹窗
  function showPosterModal() {
    // 移除已存在的弹窗
    const existing = document.getElementById('poster-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'poster-modal';
    modal.className = 'poster-modal';
    modal.innerHTML = `
      <div class="poster-modal-content">
        <div class="poster-modal-header">
          <h3>📸 旅行海报</h3>
          <button class="poster-close" onclick="Poster.close()">×</button>
        </div>
        <div class="poster-canvas-wrap">
          <canvas id="poster-canvas" style="max-width:100%;height:auto;border-radius:12px;"></canvas>
        </div>
        <div class="poster-actions">
          <button class="poster-btn poster-btn-share" onclick="Poster.download()">
            <span>💾</span> 保存图片
          </button>
          <button class="poster-btn poster-btn-copy" onclick="Poster.copyData()">
            <span>📋</span> 复制文字版
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // 生成海报
    requestAnimationFrame(() => {
      const canvas = generatePoster();
      const target = document.getElementById('poster-canvas');
      if (target) {
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext('2d').drawImage(canvas, 0, 0);
      }
      modal.classList.add('active');
    });
  }

  function closeModal() {
    const modal = document.getElementById('poster-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }

  function downloadPoster() {
    const canvas = document.getElementById('poster-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `五一自驾游海报_${new Date().toLocaleDateString('zh-CN')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showPosterToast('✅ 海报已保存');
  }

  function copyTextVersion() {
    const stats = calcTripStats();
    const quotes = [
      '最好的风景，是和家人一起看的',
      '车轮滚滚，幸福满满',
      '五天的旅程，一生的回忆',
    ];
    const text = `🚗 小庆一家五一自驾游\n` +
      `${stats.route}\n` +
      `📅 ${stats.days}天4晚 · ${stats.cities}座城市 · ${stats.distance}公里\n` +
      `👨‍👩‍👧‍👦 ${stats.members}位家人同行\n` +
      `📝 记录了${stats.diaryCount}条旅行日记\n` +
      `🍜 打卡了${stats.foodTotal}道当地美食\n\n` +
      `「${quotes[Math.floor(Math.random() * quotes.length)]}」\n` +
      `生成于 ${new Date().toLocaleDateString('zh-CN')}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showPosterToast('✅ 已复制到剪贴板');
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showPosterToast('✅ 已复制到剪贴板');
    }
  }

  function showPosterToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'poster-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  // 创建入口按钮
  function createPosterButton() {
    if (document.getElementById('posterBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'posterBtn';
    btn.className = 'poster-btn-float';
    btn.innerHTML = '📸';
    btn.title = '生成旅行海报';
    btn.onclick = showPosterModal;
    document.body.appendChild(btn);
  }

  window.Poster = {
    show: showPosterModal,
    close: closeModal,
    download: downloadPoster,
    copyData: copyTextVersion,
    generate: generatePoster
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(createPosterButton, 700));
  } else {
    setTimeout(createPosterButton, 700);
  }
})();
