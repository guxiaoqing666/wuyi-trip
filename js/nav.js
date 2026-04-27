// ============================================
// 导航跳转逻辑
// ============================================

/**
 * 打开高德导航
 * @param {string} name - 目的地名称
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {string} address - 地址（可选）
 */
function openNavigation(name, lng, lat, address = '') {
  // 判断设备类型
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  let url;
  
  if (isMobile) {
    // 手机端：尝试唤起高德App
    if (isIOS) {
      url = `iosamap://path?sourceApplication=wuyi-trip&dlat=${lat}&dlon=${lng}&dname=${encodeURIComponent(name)}&dev=0&t=0`;
    } else {
      url = `amapuri://route/plan/?dlat=${lat}&dlon=${lng}&dname=${encodeURIComponent(name)}&dev=0&t=0`;
    }
    
    // 尝试唤起App，如果失败则跳转到网页版
    const startTime = Date.now();
    window.location.href = url;
    
    // 2秒后检查是否唤起成功
    setTimeout(() => {
      if (Date.now() - startTime < 2500) {
        // 可能未唤起成功，跳转到网页版
        const webUrl = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&policy=1`;
        window.location.href = webUrl;
      }
    }, 2000);
  } else {
    // 电脑端：打开高德网页版
    url = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&policy=1`;
    window.open(url, '_blank');
  }
}

/**
 * 显示导航确认弹窗
 * @param {Object} navInfo - 导航信息对象 {name, lnglat, address}
 */
function showNavModal(navInfo) {
  const modal = document.createElement('div');
  modal.className = 'nav-modal';
  modal.innerHTML = `
    <div class="nav-modal-content">
      <div class="nav-modal-header">
        <span class="nav-icon">📍</span>
        <h3>导航到</h3>
      </div>
      <div class="nav-modal-body">
        <p class="nav-dest-name">${navInfo.name}</p>
        ${navInfo.address ? `<p class="nav-dest-addr">${navInfo.address}</p>` : ''}
      </div>
      <div class="nav-modal-actions">
        <button class="nav-btn nav-btn-cancel" onclick="closeNavModal()">取消</button>
        <button class="nav-btn nav-btn-confirm" onclick="confirmNav('${navInfo.name}', ${navInfo.lnglat[0]}, ${navInfo.lnglat[1]}, '${navInfo.address || ''}')">
          <span>🚀</span> 打开导航
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeNavModal();
  });
  
  // 动画
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });
}

function closeNavModal() {
  const modal = document.querySelector('.nav-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

function confirmNav(name, lng, lat, address) {
  closeNavModal();
  openNavigation(name, lng, lat, address);
}

// ============================================
// 地图相关
// ============================================

let map = null;
let markers = [];

/**
 * 初始化总览地图
 */
function initOverviewMap() {
  if (typeof AMap === 'undefined') {
    console.warn('高德地图API未加载');
    return;
  }
  
  map = new AMap.Map('overview-map', {
    zoom: 7,
    center: [118.5, 33.5],
    mapStyle: 'amap://styles/whitesmoke'
  });
  
  // 添加标记点
  const dayColors = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#27ae60'];
  
  ALL_NAV_POINTS.forEach((point, index) => {
    const color = dayColors[point.day] || '#666';
    const marker = new AMap.Marker({
      position: point.lnglat,
      title: point.name,
      label: {
        content: `<div style="background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:12px;white-space:nowrap;">${point.name}</div>`,
        offset: new AMap.Pixel(0, -35),
        direction: 'top'
      },
      icon: new AMap.Icon({
        size: new AMap.Size(24, 34),
        imageSize: new AMap.Size(24, 34),
        image: `https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png`
      })
    });
    
    marker.on('click', () => {
      showNavModal({
        name: point.name,
        lnglat: point.lnglat,
        address: ''
      });
    });
    
    marker.setMap(map);
    markers.push(marker);
  });
  
  // 绘制路线
  const path = ALL_NAV_POINTS.map(p => p.lnglat);
  const polyline = new AMap.Polyline({
    path: path,
    strokeColor: '#3498db',
    strokeWeight: 4,
    strokeOpacity: 0.8,
    strokeStyle: 'solid',
    showDir: true
  });
  polyline.setMap(map);
  
  // 自适应视野
  map.setFitView();
}

/**
 * 初始化单日地图
 */
function initDayMap(dayIndex, containerId) {
  if (typeof AMap === 'undefined') {
    document.getElementById(containerId).innerHTML = `
      <div class="map-fallback">
        <p>🗺️ 地图加载中...</p>
        <p>如无法显示，请检查网络连接</p>
      </div>
    `;
    return;
  }
  
  const dayData = TRIP_DATA.days[dayIndex];
  const dayPoints = ALL_NAV_POINTS.filter(p => p.day === dayIndex + 1 || (dayIndex === 0 && p.day === 0));
  
  if (dayPoints.length === 0) return;
  
  const dayMap = new AMap.Map(containerId, {
    zoom: 10,
    center: dayPoints[0].lnglat,
    mapStyle: 'amap://styles/whitesmoke'
  });
  
  const dayColors = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#27ae60'];
  const color = dayColors[dayIndex];
  
  dayPoints.forEach((point, idx) => {
    const marker = new AMap.Marker({
      position: point.lnglat,
      title: point.name,
      label: {
        content: `<div style="background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:11px;white-space:nowrap;">${point.name}</div>`,
        offset: new AMap.Pixel(0, -30),
        direction: 'top'
      }
    });
    
    marker.on('click', () => {
      showNavModal({
        name: point.name,
        lnglat: point.lnglat,
        address: ''
      });
    });
    
    marker.setMap(dayMap);
  });
  
  // 如果有多个点，绘制路线
  if (dayPoints.length > 1) {
    const path = dayPoints.map(p => p.lnglat);
    const polyline = new AMap.Polyline({
      path: path,
      strokeColor: color,
      strokeWeight: 3,
      strokeOpacity: 0.7,
      strokeStyle: 'solid'
    });
    polyline.setMap(dayMap);
  }
  
  dayMap.setFitView();
}

// ============================================
// 页面交互
// ============================================

function toggleDayMap(dayIndex) {
  const mapContainer = document.getElementById(`day-map-${dayIndex}`);
  const btn = document.getElementById(`day-map-btn-${dayIndex}`);
  
  if (!mapContainer) return;
  
  if (mapContainer.style.display === 'none' || !mapContainer.style.display) {
    mapContainer.style.display = 'block';
    btn.innerHTML = '🔼 收起地图';
    
    // 延迟初始化地图，确保容器可见
    setTimeout(() => {
      initDayMap(dayIndex, `day-map-${dayIndex}`);
    }, 100);
  } else {
    mapContainer.style.display = 'none';
    btn.innerHTML = '🗺️ 查看当日地图';
  }
}

function toggleTips() {
  const tipsPanel = document.getElementById('tips-panel');
  if (tipsPanel) {
    tipsPanel.classList.toggle('active');
  }
}

function scrollToDay(dayIndex) {
  const element = document.getElementById(`day-${dayIndex}`);
  if (element) {
    // 考虑吸顶导航栏高度，偏移滚动位置
    const navHeight = document.querySelector('.quick-nav-sticky')?.offsetHeight || 60;
    const top = element.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 返回顶部按钮显示/隐藏
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });
}

// 送爱心效果
function sendLove() {
  const hearts = ['❤️', '💖', '💕', '💗', '💝', '💘', '💓', '💞'];
  const button = document.getElementById('loveButton');
  if (!button) return;
  const rect = button.getBoundingClientRect();
  
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const heart = document.createElement('div');
      heart.className = 'click-heart';
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 60) + 'px';
      heart.style.top = (rect.top + (Math.random() - 0.5) * 40) + 'px';
      document.body.appendChild(heart);
      
      setTimeout(() => heart.remove(), 1000);
    }, i * 100);
  }
}

// 行程进度更新
function updateProgress() {
  const scrollTop = window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = Math.min(100, Math.round((scrollTop / docHeight) * 100));
  
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  if (fill) fill.style.width = progress + '%';
  if (text) text.textContent = progress + '%';
}

// 页面点击爱心效果
function initClickHearts() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.love-button') || e.target.closest('.nav-btn')) return;
    
    const heart = document.createElement('div');
    heart.className = 'click-heart';
    heart.textContent = ['❤️', '✨', '💕', '🌸'][Math.floor(Math.random() * 4)];
    heart.style.left = e.clientX + 'px';
    heart.style.top = e.clientY + 'px';
    document.body.appendChild(heart);
    
    setTimeout(() => heart.remove(), 1000);
  });
}

// 背景音乐
let musicAudio = null;
let musicPlaying = false;

// 旅游欢快音乐列表（使用免费音乐URL）
const MUSIC_PLAYLIST = [
  { name: '旅行', url: 'https://music.163.com/song/media/outer/url?id=25706282.mp3' },
  { name: '晴天', url: 'https://music.163.com/song/media/outer/url?id=186016.mp3' },
  { name: '小幸运', url: 'https://music.163.com/song/media/outer/url?id=409650842.mp3' }
];
let currentMusicIndex = 0;

function toggleMusic() {
  const btn = document.getElementById('musicBtn');
  if (!btn) return;
  
  if (!musicAudio) {
    musicAudio = new Audio();
    musicAudio.loop = true;
    musicAudio.volume = 0.5;
  }
  
  musicPlaying = !musicPlaying;
  
  if (musicPlaying) {
    btn.classList.add('playing');
    btn.innerHTML = '🎶';
    btn.title = '点击暂停音乐';
    
    // 播放当前音乐
    const song = MUSIC_PLAYLIST[currentMusicIndex];
    musicAudio.src = song.url;
    musicAudio.play().catch(e => {
      console.log('音乐播放失败，可能需要用户交互后才能播放:', e);
      // 显示提示
      showMusicTip('点击页面任意位置后，再点音乐按钮即可播放');
    });
    
    console.log('🎵 正在播放: ' + song.name);
  } else {
    btn.classList.remove('playing');
    btn.innerHTML = '🎵';
    btn.title = '点击播放音乐';
    musicAudio.pause();
    console.log('🎵 音乐已暂停');
  }
}

function showMusicTip(text) {
  const tip = document.createElement('div');
  tip.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 14px;
    z-index: 10000;
    animation: fadeInUp 0.3s ease;
  `;
  tip.textContent = text;
  document.body.appendChild(tip);
  
  setTimeout(() => {
    tip.style.opacity = '0';
    tip.style.transition = 'opacity 0.5s';
    setTimeout(() => tip.remove(), 500);
  }, 3000);
}

// 切换下一首
function nextMusic() {
  if (!musicAudio) return;
  currentMusicIndex = (currentMusicIndex + 1) % MUSIC_PLAYLIST.length;
  if (musicPlaying) {
    const song = MUSIC_PLAYLIST[currentMusicIndex];
    musicAudio.src = song.url;
    musicAudio.play();
    console.log('🎵 切换到: ' + song.name);
  }
}

// 触发到达动画
function triggerArrival(dayNumber) {
  const container = document.getElementById('arrivalCelebration');
  if (!container) return;
  
  container.innerHTML = '';
  container.classList.add('active');
  
  // 彩纸
  const emojis = ['🎉', '✨', '🎊', '💐', '🌟', '🎈', '💖', '🎁'];
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 2 + 's';
    confetti.style.fontSize = (14 + Math.random() * 20) + 'px';
    container.appendChild(confetti);
  }
  
  // 横幅
  const banner = document.createElement('div');
  banner.className = 'arrival-banner';
  banner.textContent = `🎉 Day ${dayNumber} 到达！`;
  container.appendChild(banner);
  
  // 3秒后移除
  setTimeout(() => {
    container.classList.remove('active');
    container.innerHTML = '';
  }, 3500);
}

// 家庭投票
function vote(option, btnElement) {
  // 移除其他选中状态
  const parent = btnElement.parentElement;
  parent.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('voted'));
  
  // 添加选中状态
  btnElement.classList.add('voted');
  
  // 显示投票结果
  const result = document.createElement('div');
  result.style.cssText = 'margin-top:8px;font-size:12px;color:#27ae60;';
  result.textContent = `✓ 已选择: ${option}`;
  
  const existing = parent.nextElementSibling;
  if (existing && existing.classList.contains('vote-result')) {
    existing.remove();
  }
  result.className = 'vote-result';
  parent.parentElement.appendChild(result);
}

// 页面加载完成后初始化
window.addEventListener('load', () => {
  // 尝试初始化总览地图
  if (typeof AMap !== 'undefined') {
    initOverviewMap();
  }
  
  // 初始化进度条
  updateProgress();
  window.addEventListener('scroll', updateProgress);
  
  // 初始化点击爱心
  initClickHearts();
});
