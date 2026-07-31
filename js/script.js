document.addEventListener('DOMContentLoaded', () => {
  // モバイルナビの開閉
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('is-open');
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => nav.classList.remove('is-open'));
    });
  }

  // FAQアコーディオン
  document.querySelectorAll('.faq__item').forEach((item) => {
    const question = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.faq__item.is-open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.faq__answer').style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('is-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // 予約カレンダー
  initBooking();
});

function initBooking() {
  const datesEl = document.getElementById('bookingDates');
  const slotsEl = document.getElementById('bookingSlots');
  const formEl = document.getElementById('bookingForm');
  if (!datesEl || !slotsEl || !formEl) return;

  const STORAGE_KEY = 'aircon_reservations';
  const DAYS_AHEAD = 14;
  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
  const SLOTS = [
    { id: '08-11', label: '8:00〜11:00' },
    { id: '11-14', label: '11:00〜14:00' },
    { id: '14-17', label: '14:00〜17:00' },
    { id: '17-20', label: '17:00〜20:00' },
  ];

  const selectedLabelEl = document.getElementById('bookingSelectedLabel');
  const successEl = document.getElementById('bookingSuccess');
  const nameInput = document.getElementById('bookingName');
  const telInput = document.getElementById('bookingTel');
  const planInput = document.getElementById('bookingPlan');
  const cancelBtn = document.getElementById('bookingCancel');

  const dateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  let selectedDate = dateKey(dates[0]);
  let selectedSlot = null;

  const loadReservations = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  };
  const saveReservations = (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };
  const isBooked = (date, slotId) =>
    loadReservations().some((r) => r.date === date && r.slot === slotId);

  function renderDates() {
    datesEl.innerHTML = '';
    dates.forEach((d) => {
      const key = dateKey(d);
      const day = d.getDay();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking__date-btn';
      if (day === 0) btn.classList.add('is-sun');
      if (day === 6) btn.classList.add('is-sat');
      if (key === selectedDate) btn.classList.add('is-active');
      btn.innerHTML = `
        <span class="booking__date-weekday">${WEEKDAYS[day]}</span>
        <span class="booking__date-day">${d.getMonth() + 1}/${d.getDate()}</span>
      `;
      btn.addEventListener('click', () => {
        selectedDate = key;
        selectedSlot = null;
        formEl.hidden = true;
        successEl.hidden = true;
        renderDates();
        renderSlots();
      });
      datesEl.appendChild(btn);
    });
  }

  function renderSlots() {
    slotsEl.innerHTML = '';
    SLOTS.forEach((slot) => {
      const booked = isBooked(selectedDate, slot.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking__slot-btn';
      if (slot.id === selectedSlot) btn.classList.add('is-selected');
      btn.disabled = booked;
      btn.innerHTML = `
        <span class="booking__slot-time">${slot.label}</span>
        <span class="booking__slot-status">${booked ? '予約済み' : '予約可'}</span>
      `;
      btn.addEventListener('click', () => {
        selectedSlot = slot.id;
        successEl.hidden = true;
        const d = dates.find((x) => dateKey(x) === selectedDate);
        selectedLabelEl.textContent = `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]}) ${slot.label} のご予約`;
        formEl.hidden = false;
        renderSlots();
      });
      slotsEl.appendChild(btn);
    });
  }

  cancelBtn.addEventListener('click', () => {
    selectedSlot = null;
    formEl.hidden = true;
    formEl.reset();
    renderSlots();
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (isBooked(selectedDate, selectedSlot)) {
      alert('大変申し訳ございません、この枠はちょうど埋まってしまいました。別の枠をお選びください。');
      selectedSlot = null;
      formEl.hidden = true;
      renderSlots();
      return;
    }

    const reservations = loadReservations();
    reservations.push({
      date: selectedDate,
      slot: selectedSlot,
      name: nameInput.value.trim(),
      tel: telInput.value.trim(),
      plan: planInput.value,
      createdAt: new Date().toISOString(),
    });
    saveReservations(reservations);

    const d = dates.find((x) => dateKey(x) === selectedDate);
    const slotLabel = SLOTS.find((s) => s.id === selectedSlot).label;
    successEl.textContent = `ご予約ありがとうございます。${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]}) ${slotLabel} で承りました。`;
    successEl.hidden = false;

    formEl.reset();
    formEl.hidden = true;
    selectedSlot = null;
    renderSlots();
  });

  renderDates();
  renderSlots();
}
