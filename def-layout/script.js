// ========================================
// 設定
// ========================================
const LIFF_ID = "2009181333-kAltbUfR";  // ★ 変更必要
const GAS_URL = "https://script.google.com/macros/s/AKfycbxnqPx5wP3kdddUhWItMc0NEodD6tWwIhGOYyr5X_dBrb_zzetAb3Sk0a0ZF5psZ_ksCA/exec";   // ★ 変更必要

// ========================================
// グローバル変数
// ========================================
let currentDate = new Date();
let selectedDates = [];

// ========================================
// LIFF初期化
// ========================================
liff.init({ liffId: LIFF_ID })
  .then(() => {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
    renderCalendar();
  })
  .catch(err => {
    console.error("LIFF init error:", err);
    showToast('❌ 初期化エラーが発生しました');
  });

// ========================================
// 時間プリセット
// ========================================
function setPreset(start, end) {
  document.getElementById('startTime').value = start;
  document.getElementById('endTime').value = end;
}

// ========================================
// カレンダー描画
// ========================================
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  document.getElementById('calendarTitle').textContent = 
    `${year}年 ${month + 1}月`;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  // 曜日ヘッダー
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  days.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    calendar.appendChild(header);
  });

  // 空白セル
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    calendar.appendChild(empty);
  }

  // 日付セル
  for (let date = 1; date <= lastDate; date++) {
    const day = document.createElement('div');
    day.className = 'calendar-day';
    day.textContent = date;

    const fullDate = new Date(year, month, date);
    const dateStr = formatDate(fullDate);

    // 今日の日付にクラス追加
    if (fullDate.toDateString() === today.toDateString()) {
      day.classList.add('today');
    }

    // 選択済みの日付にクラス追加
    if (selectedDates.some(d => d.date === dateStr)) {
      day.classList.add('selected');
    }

    day.onclick = () => toggleDate(fullDate);
    calendar.appendChild(day);
  }
}

// ========================================
// 日付選択トグル
// ========================================
function toggleDate(date) {
  const dateStr = formatDate(date);
  const index = selectedDates.findIndex(d => d.date === dateStr);

  if (index > -1) {
    // 既に選択済み → 削除
    selectedDates.splice(index, 1);
  } else {
    // 未選択 → 追加
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    selectedDates.push({
      date: dateStr,
      dayOfWeek: getDayOfWeek(date),
      startTime: startTime,
      endTime: endTime
    });
  }

  // 日付順にソート
  selectedDates.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  renderCalendar();
  renderSelectedDates();
  updatePreview();
}

// ========================================
// 選択日程リスト描画
// ========================================
function renderSelectedDates() {
  const container = document.getElementById('selectedDates');
  
  if (selectedDates.length === 0) {
    container.innerHTML = '<div class="empty-state">カレンダーから日付を選択してください</div>';
    return;
  }

  container.innerHTML = selectedDates.map((item, index) => `
    <div class="date-item">
      <div class="date-info">
        <div class="date-label">${item.date} (${item.dayOfWeek})</div>
        <div class="date-time-edit">
          <input type="time" value="${item.startTime}" 
                 onchange="updateTime(${index}, 'startTime', this.value)">
          <span>～</span>
          <input type="time" value="${item.endTime}" 
                 onchange="updateTime(${index}, 'endTime', this.value)">
        </div>
      </div>
      <button class="delete-btn" onclick="deleteDate(${index})">削除</button>
    </div>
  `).join('');
}

// ========================================
// 時間更新
// ========================================
function updateTime(index, field, value) {
  selectedDates[index][field] = value;
  updatePreview();
}

// ========================================
// 日付削除
// ========================================
function deleteDate(index) {
  selectedDates.splice(index, 1);
  renderCalendar();
  renderSelectedDates();
  updatePreview();
}

// ========================================
// プレビュー更新
// ========================================
function updatePreview() {
  const preview = document.getElementById('preview');

  if (selectedDates.length === 0) {
    preview.textContent = 'カレンダーから日付を選択してください';
    return;
  }

  const lines = selectedDates.map(item => {
    const start = item.startTime.replace(':', '時') + '分';
    const end = item.endTime.replace(':', '時') + '分';
    return `${item.date}(${item.dayOfWeek}) ${start}〜${end}`;
  });

  preview.textContent = lines.join('\n');
}

// ========================================
// 送信処理
// ========================================
async function submitShift() {
  if (selectedDates.length === 0) {
    showToast('❌ 日付を選択してください');
    return;
  }

  const text = document.getElementById('preview').textContent;

  try {
    showToast('送信中...');
    
    const profile = await liff.getProfile();

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        userId: profile.userId,
        displayName: profile.displayName,
        message: text,
        dates: selectedDates
      })
    });

    const result = await response.json();

    if (result.status === 'ok') {
      showToast('✅ 送信完了しました！');
      
      // 送信後に自動クリア（必要に応じてコメント解除）
      // selectedDates = [];
      // renderCalendar();
      // renderSelectedDates();
      // updatePreview();
    } else {
      showToast('❌ 送信に失敗しました');
    }

  } catch (err) {
    console.error('送信エラー:', err);
    showToast('❌ 通信エラーが発生しました');
  }
}

// ========================================
// 全削除
// ========================================
function clearAll() {
  if (confirm('全ての選択をクリアしますか?')) {
    selectedDates = [];
    renderCalendar();
    renderSelectedDates();
    updatePreview();
    showToast('全削除しました');
  }
}

// ========================================
// 月変更
// ========================================
function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderCalendar();
}

// ========================================
// 今日に移動
// ========================================
function goToToday() {
  currentDate = new Date();
  renderCalendar();
}

// ========================================
// トースト表示
// ========================================
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ========================================
// ユーティリティ関数
// ========================================
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function getDayOfWeek(date) {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}
