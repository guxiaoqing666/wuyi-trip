// ============================================
// 旅行日记 / 即时心情
// 支持每个行程节点添加文字/心情记录，本地存储
// ============================================

(function() {
  'use strict';

  const STORAGE_KEY = 'wuyi_diary_v1';

  // 读取日记数据
  function loadDiary() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  // 保存日记数据
  function saveDiary(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // 生成唯一节点ID
  function getNodeId(dayIndex, scheduleIndex) {
    return `d${dayIndex}_s${scheduleIndex}`;
  }

  // 渲染日记区域
  function renderDiaryArea(nodeId, existing) {
    const entries = existing || [];
    let entriesHtml = '';
    if (entries.length > 0) {
      entriesHtml = entries.map((e, i) => `
        <div class="diary-entry" data-index="${i}">
          <div class="diary-entry-header">
            <span class="diary-entry-mood">${e.mood || '📝'}</span>
            <span class="diary-entry-time">${e.time}</span>
            <button class="diary-entry-delete" onclick="Diary.deleteEntry('${nodeId}', ${i})" title="删除">×</button>
          </div>
          <div class="diary-entry-text">${escapeHtml(e.text)}</div>
        </div>
      `).join('');
    }

    return `
      <div class="diary-area" id="diary-${nodeId}">
        <div class="diary-entries">${entriesHtml}</div>
        <button class="diary-add-btn" onclick="Diary.openEditor('${nodeId}')">
          <span>📝</span> 记一笔
        </button>
        <div class="diary-editor" id="diary-editor-${nodeId}" style="display:none;">
          <div class="diary-mood-picker">
            ${['😊','😋','😍','😂','😴','😤','❤️','📸','🌟'].map(m => `
              <span class="diary-mood-option" data-mood="${m}" onclick="Diary.pickMood('${nodeId}', '${m}', this)">${m}</span>
            `).join('')}
          </div>
          <textarea class="diary-textarea" id="diary-text-${nodeId}" placeholder="记录此刻的心情、美食评价、注意事项..." maxlength="200"></textarea>
          <div class="diary-editor-actions">
            <button class="diary-btn diary-btn-cancel" onclick="Diary.closeEditor('${nodeId}')">取消</button>
            <button class="diary-btn diary-btn-save" onclick="Diary.saveEntry('${nodeId}')">保存</button>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 插入日记区域到每个 timeline-item
  function initDiary() {
    const diaryData = loadDiary();

    TRIP_DATA.days.forEach((day, dayIndex) => {
      day.schedule.forEach((item, scheduleIndex) => {
        const nodeId = getNodeId(dayIndex, scheduleIndex);
        const timelineItems = document.querySelectorAll(`#day-${dayIndex} .timeline-item`);
        const targetItem = timelineItems[scheduleIndex];
        if (!targetItem) return;

        const contentEl = targetItem.querySelector('.timeline-content');
        if (!contentEl) return;

        const existing = diaryData[nodeId];
        const diaryHtml = renderDiaryArea(nodeId, existing);
        const diaryWrapper = document.createElement('div');
        diaryWrapper.innerHTML = diaryHtml;
        contentEl.appendChild(diaryWrapper.firstElementChild);
      });
    });
  }

  // 公开API
  window.Diary = {
    openEditor(nodeId) {
      const editor = document.getElementById(`diary-editor-${nodeId}`);
      if (editor) {
        editor.style.display = 'block';
        const textarea = editor.querySelector('.diary-textarea');
        if (textarea) textarea.focus();
      }
    },

    closeEditor(nodeId) {
      const editor = document.getElementById(`diary-editor-${nodeId}`);
      if (editor) {
        editor.style.display = 'none';
        const textarea = editor.querySelector('.diary-textarea');
        if (textarea) textarea.value = '';
        // 清除心情选中
        editor.querySelectorAll('.diary-mood-option').forEach(el => el.classList.remove('picked'));
      }
    },

    pickMood(nodeId, mood, el) {
      const editor = document.getElementById(`diary-editor-${nodeId}`);
      if (!editor) return;
      editor.querySelectorAll('.diary-mood-option').forEach(opt => opt.classList.remove('picked'));
      el.classList.add('picked');
      editor.dataset.selectedMood = mood;
    },

    saveEntry(nodeId) {
      const editor = document.getElementById(`diary-editor-${nodeId}`);
      const textarea = document.getElementById(`diary-text-${nodeId}`);
      if (!textarea) return;

      const text = textarea.value.trim();
      if (!text) {
        textarea.style.borderColor = '#e74c3c';
        setTimeout(() => textarea.style.borderColor = '', 1000);
        return;
      }

      const mood = editor?.dataset.selectedMood || '📝';
      const now = new Date();
      const timeStr = `${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const diaryData = loadDiary();
      if (!diaryData[nodeId]) diaryData[nodeId] = [];
      diaryData[nodeId].push({ text, mood, time: timeStr });
      saveDiary(diaryData);

      // 重新渲染该区域
      const area = document.getElementById(`diary-${nodeId}`);
      if (area) {
        const newHtml = renderDiaryArea(nodeId, diaryData[nodeId]);
        area.outerHTML = newHtml;
      }

      // 触发一个小动画
      showDiaryToast('✅ 已记录');
    },

    deleteEntry(nodeId, index) {
      if (!confirm('确定删除这条记录吗？')) return;
      const diaryData = loadDiary();
      if (diaryData[nodeId]) {
        diaryData[nodeId].splice(index, 1);
        if (diaryData[nodeId].length === 0) delete diaryData[nodeId];
        saveDiary(diaryData);
      }
      const area = document.getElementById(`diary-${nodeId}`);
      if (area) {
        const newHtml = renderDiaryArea(nodeId, diaryData[nodeId]);
        area.outerHTML = newHtml;
      }
    },

    // 导出所有日记为文本
    exportAll() {
      const diaryData = loadDiary();
      let output = '📖 五一旅行日记\n================\n\n';
      TRIP_DATA.days.forEach((day, dayIndex) => {
        output += `📅 Day ${day.day} · ${day.date} · ${day.theme}\n`;
        day.schedule.forEach((item, scheduleIndex) => {
          const nodeId = getNodeId(dayIndex, scheduleIndex);
          const entries = diaryData[nodeId];
          if (entries && entries.length > 0) {
            output += `  ${item.time} ${item.title}\n`;
            entries.forEach(e => {
              output += `    ${e.mood} ${e.time}\n    ${e.text}\n\n`;
            });
          }
        });
        output += '\n';
      });
      return output;
    }
  };

  function showDiaryToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'diary-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initDiary, 200));
  } else {
    setTimeout(initDiary, 200);
  }
})();
