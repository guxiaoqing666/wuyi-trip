// ============================================
// 语音播报 - Web Speech API
// 播报当前行程信息，方便开车时使用
// ============================================

(function() {
  'use strict';

  let synth = window.speechSynthesis;
  let isSpeaking = false;

  // 检查浏览器支持
  function isSupported() {
    return 'speechSynthesis' in window;
  }

  // 获取当前行程信息（复用 progress.js 的逻辑）
  function getCurrentInfo() {
    // 支持 mock 时间（复用 progress.js 的逻辑）
    const mockDate = (() => {
      const params = new URLSearchParams(window.location.search);
      const md = params.get('mockDate');
      const mt = params.get('mockTime');
      if (md) {
        const [m, d] = md.split('-').map(Number);
        const [h = 12, min = 0] = (mt || '12:00').split(':').map(Number);
        return new Date(2026, m - 1, d, h, min);
      }
      return null;
    })();
    const now = mockDate || new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const tripDates = [
      { month: 5, day: 1 },
      { month: 5, day: 2 },
      { month: 5, day: 3 },
      { month: 5, day: 4 },
      { month: 5, day: 5 },
    ];

    let dayIndex = -1;
    for (let i = 0; i < tripDates.length; i++) {
      if (currentMonth === tripDates[i].month && currentDay === tripDates[i].day) {
        dayIndex = i;
        break;
      }
    }

    if (dayIndex === -1) {
      // 非行程日，播报整体信息
      return {
        type: 'overview',
        text: `这是小庆一家五一自驾游行程。5天4晚，途经高邮、连云港、日照、徐州，全程约1200公里。`
      };
    }

    const dayData = TRIP_DATA.days[dayIndex];
    const currentMinutes = currentHour * 60 + currentMin;

    // 找到当前或下一个行程
    let currentItem = null;
    let nextItem = null;

    for (let i = 0; i < dayData.schedule.length; i++) {
      const item = dayData.schedule[i];
      const match = item.time.match(/(\d{1,2}):(\d{2})/);
      if (!match) continue;
      const itemMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);

      if (currentMinutes >= itemMinutes) {
        currentItem = { ...item, index: i };
      } else if (!nextItem) {
        nextItem = { ...item, index: i };
      }
    }

    if (currentItem) {
      let text = `今天是5月${currentDay}日，${dayData.theme}。当前行程：${currentItem.time}，${currentItem.title}。${currentItem.desc}`;
      if (currentItem.tips && currentItem.tips.length > 0) {
        text += `。温馨提示：${currentItem.tips.join('，')}`;
      }
      if (nextItem) {
        text += `。接下来：${nextItem.time}，${nextItem.title}`;
      }
      return { type: 'current', text };
    } else if (nextItem) {
      return {
        type: 'next',
        text: `今天是5月${currentDay}日，${dayData.theme}。即将开始：${nextItem.time}，${nextItem.title}。${nextItem.desc}`
      };
    } else {
      return {
        type: 'dayend',
        text: `今天${dayData.theme}的行程已结束。明天是${dayIndex < 4 ? TRIP_DATA.days[dayIndex + 1].theme : '返程日'}。`
      };
    }
  }

  // 播报
  function speak(text) {
    if (!synth) {
      synth = window.speechSynthesis;
    }
    if (!synth) {
      showTtsToast('❌ 浏览器不支持语音播报');
      return;
    }

    // 取消之前的播报
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 尝试选择中文语音
    const voices = synth.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
    if (zhVoice) utterance.voice = zhVoice;

    utterance.onstart = () => {
      isSpeaking = true;
      updateTtsButton();
    };

    utterance.onend = () => {
      isSpeaking = false;
      updateTtsButton();
    };

    utterance.onerror = (e) => {
      isSpeaking = false;
      updateTtsButton();
      if (e.error !== 'canceled') {
        showTtsToast('❌ 播报失败，请重试');
      }
    };

    synth.speak(utterance);
  }

  function stop() {
    if (synth) {
      synth.cancel();
      isSpeaking = false;
      updateTtsButton();
    }
  }

  function updateTtsButton() {
    const btn = document.getElementById('ttsBtn');
    if (!btn) return;
    if (isSpeaking) {
      btn.classList.add('speaking');
      btn.innerHTML = '🔊';
      btn.title = '停止播报';
    } else {
      btn.classList.remove('speaking');
      btn.innerHTML = '🔈';
      btn.title = '语音播报当前行程';
    }
  }

  function showTtsToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'tts-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // 创建播报按钮
  function createTtsButton() {
    if (document.getElementById('ttsBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'ttsBtn';
    btn.className = 'tts-btn';
    btn.innerHTML = '🔈';
    btn.title = '语音播报当前行程';
    btn.onclick = () => {
      if (isSpeaking) {
        stop();
        showTtsToast('⏹️ 已停止');
      } else {
        const info = getCurrentInfo();
        speak(info.text);
        showTtsToast('🔊 正在播报...');
      }
    };

    document.body.appendChild(btn);
  }

  // 长按播报详细版
  let pressTimer = null;
  function initLongPress() {
    const btn = document.getElementById('ttsBtn');
    if (!btn) return;

    const startLongPress = () => {
      pressTimer = setTimeout(() => {
        // 长按：播报今日全部行程
        const mockDate = (() => {
          const params = new URLSearchParams(window.location.search);
          const md = params.get('mockDate');
          if (md) {
            const [m, d] = md.split('-').map(Number);
            return new Date(2026, m - 1, d, 12, 0);
          }
          return null;
        })();
        const now = mockDate || new Date();
        const tripDates = [
          { month: 5, day: 1 }, { month: 5, day: 2 }, { month: 5, day: 3 },
          { month: 5, day: 4 }, { month: 5, day: 5 }
        ];
        let dayIndex = -1;
        for (let i = 0; i < tripDates.length; i++) {
          if ((now.getMonth() + 1) === tripDates[i].month && now.getDate() === tripDates[i].day) {
            dayIndex = i;
            break;
          }
        }
        if (dayIndex === -1) dayIndex = 0;
        if (dayIndex >= 0 && dayIndex < 5) {
          const day = TRIP_DATA.days[dayIndex];
          let text = `今日${day.theme}全部行程：`;
          day.schedule.forEach((item, i) => {
            text += `${i + 1}、${item.time} ${item.title}；`;
          });
          speak(text);
          showTtsToast('🔊 播报今日全部行程');
        }
      }, 600);
    };

    const cancelLongPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    btn.addEventListener('touchstart', startLongPress, { passive: true });
    btn.addEventListener('touchend', cancelLongPress);
    btn.addEventListener('mousedown', startLongPress);
    btn.addEventListener('mouseup', cancelLongPress);
    btn.addEventListener('mouseleave', cancelLongPress);
  }

  // 初始化
  function init() {
    if (!isSupported()) {
      console.log('Web Speech API not supported');
      return;
    }
    createTtsButton();
    initLongPress();

    // 预加载语音列表
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => synth.getVoices();
    }
  }

  window.TTS = {
    speak,
    stop,
    isSupported,
    getCurrentInfo
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 600));
  } else {
    setTimeout(init, 600);
  }
})();
