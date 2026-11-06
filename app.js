(() => {
  'use strict';

  /* =====================================================================
   *  CONFIGURATION: edit these to personalise the invitation
   * ===================================================================== */
  const CONFIG = {
    recipientName: 'Amai',
    senderName: 'Debs',                 // e.g. 'Your favorite person' (shown on the invitation)
    // Proposed dates in order, as YYYY-MM-DD. Only Mon–Thu dates are used
    // (those are the days we have itineraries for). Past dates are skipped.
    proposedDates: ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'],
    location: {
      name: 'SM City Angono',
      short: 'SM Angono',
      area: 'Angono, Rizal',
      photo: 'assets/sm-angono.jpg',  // put a real photo here; an illustration is shown otherwise
    },
    hometown: 'Tanay',
    latestHomeArrival: '20:00',     // later than this asks her if that's okay
    freeTimeThreshold: 30,          // gaps (min) before a fixed showtime that become "free time"
  };

  /* Itineraries. `duration` is in minutes; `fixedStart` pins an item to a time
   * (movie showtimes). `label` is the original wording shown on the plan. */
  const ITINERARIES = {
    monTue: {
      key: 'monTue', title: 'Monday & Tuesday Plan', start: '09:00',
      items: [
        { id: 'depart', icon: '🚌', title: 'Meet-up & Departure', label: '9:00 AM', duration: 120, locked: true,
          details: ['Meet at the Palengke terminal', 'Travel to SM Angono together', 'Estimated travel: about 2 hours'] },
        { id: 'milktea', icon: '🧋', title: 'Arrival & Coco Milk Tea', label: '11:00 AM', duration: 15,
          details: ['Arrive at the mall', 'Head to Coco Milk Tea', 'Buy milk tea together'] },
        { id: 'tickets', icon: '🎟️', title: 'Movie Tickets', label: 'Before 11:30 AM', duration: 10, dependsOn: 'movie',
          details: ['Buy our movie tickets', 'Movie: Remember', 'Starring Dingdong Dantes & Marian Rivera', 'Showtime: 11:30 AM'] },
        { id: 'movie', icon: '🎬', title: 'Movie Date: Remember', label: '11:30 AM – 1:21 PM', duration: 111, fixedStart: '11:30',
          movie: { title: 'Remember', cast: 'Dingdong Dantes & Marian Rivera', runtime: '1 hr 51 min' },
          details: ['Watch “Remember” together', 'Estimated runtime: 1 hour and 51 minutes'] },
        { id: 'lunch', icon: '🥓', title: 'Lunch Date at Romantic Baboy', label: 'After the movie', duration: 90,
          details: ['Head to Romantic Baboy', 'Enjoy a samgyupsal meal together'] },
        { id: 'home', icon: '🏡', title: 'Going Home', label: 'After eating', duration: 120, locked: true, last: true,
          details: ['Head back home to Tanay'] },
      ],
    },
    wedThu: {
      key: 'wedThu', title: 'Wednesday & Thursday Plan', start: '08:00',
      items: [
        { id: 'depart', icon: '🚌', title: 'Meet-up & Departure', label: 'Before 8:00 AM', duration: 120, locked: true,
          details: ['Meet at the Palengke terminal', 'Depart for SM Angono', 'Estimated travel: about 2 hours'] },
        { id: 'tickets', icon: '🎟️', title: 'Arrival & Movie Tickets', label: '10:00 AM', duration: 15, dependsOn: 'movie',
          details: ['Arrive at the mall', 'Buy movie tickets for the 12:30 PM showing'] },
        { id: 'milktea', icon: '🧋', title: 'Coco Milk Tea', label: 'After buying tickets', duration: 20,
          details: ['Head to Coco Milk Tea', 'Buy milk tea together'] },
        { id: 'lunch', icon: '🥓', title: 'Lunch Date at Romantic Baboy', label: 'Before 12:30 PM', duration: 90,
          details: ['Eat at Romantic Baboy', 'Enjoy samgyupsal together', 'Then head to the cinema'] },
        { id: 'movie', icon: '🎬', title: 'Movie Date: The Hunger Games', label: '12:30 PM', duration: 150, fixedStart: '12:30',
          movie: { title: 'The Hunger Games: Sunrise on the Reaping', cast: '', runtime: 'until about 3:00 PM' },
          details: ['Watch The Hunger Games: Sunrise on the Reaping', 'Showtime: 12:30 PM', 'Proceed to the cinema after eating'] },
        { id: 'home', icon: '🏡', title: 'Going Home', label: '3:00 PM', duration: 120, locked: true, last: true,
          details: ['Start traveling back to Tanay', 'Estimated arrival: before 5:00 PM'] },
      ],
    },
  };

  /* Activity knowledge used to guess icons and durations for her ideas. */
  const ACTIVITY_CATALOG = [
    { re: /arcade|timezone|tom'?s world|claw|games?\b|play/i, icon: '🕹️', duration: 60 },
    { re: /photo ?booth|photobooth|picture|photos?|selfie|picha/i, icon: '📸', duration: 20 },
    { re: /ice ?cream|dessert|cake|halo|donut|sweets?|waffle|crepe|churro/i, icon: '🍦', duration: 30 },
    { re: /coffee|caf[eé]|starbucks|latte/i, icon: '☕', duration: 30 },
    { re: /shop|stroll|walk|window|lakad|ikot|mall tour/i, icon: '🛍️', duration: 60 },
    { re: /book|national|fully booked/i, icon: '📚', duration: 30 },
    { re: /karaoke|sing|kanta/i, icon: '🎤', duration: 60 },
    { re: /bowling/i, icon: '🎳', duration: 60 },
    { re: /skat/i, icon: '⛸️', duration: 60 },
    { re: /dinner|hapunan/i, icon: '🍽️', duration: 60 },
    { re: /snack|fries|jollibee|mcdo|food|eat|kain|merienda|chicken|pizza|ramen/i, icon: '🍟', duration: 45 },
    { re: /church|pray|mass|simbahan/i, icon: '⛪', duration: 60 },
    { re: /park|sunset|view|art|museum|gallery/i, icon: '🌅', duration: 45 },
    { re: /flower|gift|souvenir|buy|bili|regalo/i, icon: '🎁', duration: 30 },
    { re: /nail|salon|spa|massage/i, icon: '💅', duration: 60 },
    { re: /grocer|supermarket/i, icon: '🛒', duration: 30 },
  ];

  /* Which itinerary activity a removal phrase refers to (first match wins). */
  const REMOVE_TARGETS = [
    { id: 'tickets', re: /ticket/i },
    { id: 'milktea', re: /milk ?tea|coco|\btea\b|drink|inumin/i },
    { id: 'movie', re: /movie|film|cinema|sine|remember|hunger|watch|nood/i },
    { id: 'lunch', re: /lunch|baboy|samg|sam?gyup|kbbq|korean|\beat|meal|unli|kain/i },
    { id: 'depart', re: /meet|terminal|palengke|depart|byahe|travel there/i },
    { id: 'home', re: /go(ing)? home|uwi|travel back/i },
  ];

  const NOTHING_RE = /^(none|nothing|nothin|n\/?a|no|nope|nah|wala|wala na|wala naman|okay na|ok na|ayos na|goods na|all good|i'?m good|im good|perfect|nothing to (add|remove|change)|-+|\.+)[.!~ 😊💗❤️]*$/i;
  const VAGUE_RE = /^(idk|i don'?t know|ewan|bahala ka|bahala na|kahit ano|anything|surprise me|something|basta|ikaw bahala|ikaw na bahala|\?+)[.!? ]*$/i;

  /* =====================================================================
   *  Utilities
   * ===================================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const toHHMM = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
  function fmtTime(min) {
    let h = Math.floor(min / 60) % 24; const m = min % 60;
    const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${h}:${pad(m)} ${ap}`;
  }
  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  const fmtDateLong = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const fmtDateShort = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function itineraryFor(d) {
    const w = d.getDay();
    if (w === 1 || w === 2) return ITINERARIES.monTue;
    if (w === 3 || w === 4) return ITINERARIES.wedThu;
    return null;
  }
  /* Parses "10", "10am", "10:30 pm", "14:00" → minutes, or null. */
  function parseClock(str, defaultPm) {
    const m = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|n\.?n\.?)?/i.exec(str);
    if (!m) return null;
    let h = +m[1]; const min = m[2] ? +m[2] : 0; const ap = (m[3] || '').toLowerCase().replace(/\./g, '');
    if (h > 23 || min > 59) return null;
    if (ap === 'pm' && h < 12) h += 12;
    else if (ap === 'am' && h === 12) h = 0;
    else if (!ap && h >= 1 && h <= 6 && defaultPm !== false) h += 12; // "at 3" → 3 PM
    return h * 60 + min;
  }
  const TIME_RE = /\b(?:at|by|around|mga|bandang|before|after)?\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)|\d{1,2}:\d{2})\b/i;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  /* =====================================================================
   *  Proposed dates (validated)
   * ===================================================================== */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const PROPOSED = [];
  CONFIG.proposedDates.forEach((iso) => {
    const d = parseISO(iso);
    if (!d) return console.warn('[invite] Invalid date ignored:', iso);
    if (!itineraryFor(d)) return console.warn('[invite] Not a Mon–Thu date, ignored:', iso, d.toDateString());
    if (d < today) return console.warn('[invite] Past date ignored:', iso);
    if (PROPOSED.some((p) => sameDay(p, d))) return;
    PROPOSED.push(d);
  });

  /* =====================================================================
   *  State
   * ===================================================================== */
  const state = {
    page: 1,
    dateIndex: 0,
    dateConfirmed: false,
    revealed: false,
    feedback: Object.assign({ add: '', remove: '', other: '' }, store.get('invite.feedback') || {}),
    review: [],          // interpreted suggestions (see buildReview)
    resolutions: {},     // conflict decisions
    schedule: null,      // final computed schedule
    inviteBlob: null,
    inviteUrl: null,
  };
  const confirmedDate = () => PROPOSED[state.dateIndex];
  const plan = () => itineraryFor(confirmedDate());

  /* =====================================================================
   *  Decorations
   * ===================================================================== */
  function spawnBgHearts() {
    const box = $('#bgHearts');
    const glyphs = ['♥', '♡', '❀', '✿', '♥', '✧'];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('span');
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = `${Math.random() * 100}%`;
      s.style.fontSize = `${12 + Math.random() * 20}px`;
      s.style.animationDuration = `${12 + Math.random() * 14}s`;
      s.style.animationDelay = `${-Math.random() * 20}s`;
      box.appendChild(s);
    }
  }
  function burst(x, y, count = 16) {
    const layer = $('#burstLayer');
    const glyphs = ['💗', '💕', '💖', '✨', '🌸', '❤️'];
    if (x == null) { x = window.innerWidth / 2; y = window.innerHeight / 2; }
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.textContent = glyphs[i % glyphs.length];
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const r = 80 + Math.random() * 120;
      s.style.left = `${x}px`; s.style.top = `${y}px`;
      s.style.setProperty('--dx', `${Math.cos(a) * r}px`);
      s.style.setProperty('--dy', `${Math.sin(a) * r - 40}px`);
      s.style.setProperty('--rot', `${Math.random() * 90 - 45}deg`);
      layer.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
  }
  const burstAt = (el) => { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); };
  const HEART_SVG = '<svg viewBox="0 0 100 90" aria-hidden="true"><path d="M50 88C18 66 2 46 2 27 2 12 14 2 28 2c10 0 18 6 22 14C54 8 62 2 72 2c14 0 26 10 26 25 0 19-16 39-48 61z" fill="#ff85aa" stroke="#fff" stroke-width="6"/></svg>';

  /* =====================================================================
   *  Navigation
   * ===================================================================== */
  const TOTAL = 7;
  function renderProgress() {
    $('#progress').innerHTML = Array.from({ length: TOTAL }, (_, i) => {
      const n = i + 1;
      const cls = n < state.page ? 'done' : n === state.page ? 'current' : '';
      return `<li class="${cls}" aria-label="Step ${n}${n === state.page ? ' (current)' : ''}">♥</li>`;
    }).join('');
    $('#backBtn').hidden = state.page === 1;
  }
  function canEnter(n) {
    if (n >= 4 && !state.dateConfirmed) return 3;
    if (n >= 5 && !state.revealed) return 4;
    if (n >= 7 && !state.schedule) return 6;
    return n;
  }
  function go(n) {
    n = canEnter(n);
    const cur = $(`.page[data-page="${state.page}"]`);
    const next = $(`.page[data-page="${n}"]`);
    if (!next) return;
    if (cur && cur !== next) {
      cur.classList.remove('active');
      cur.classList.add('leaving');
      setTimeout(() => cur.classList.remove('leaving'), 250);
    }
    state.page = n;
    setTimeout(() => {
      next.classList.add('active');
      onEnter(n);
      fitPage();
      window.scrollTo(0, 0);
    }, cur && cur !== next ? 260 : 0);
    renderProgress();
  }
  /* ---------- fit-to-screen ----------
   * Every page uses the same phone-style column on every screen. If a page is
   * only a bit taller than the screen it's zoomed down to fit with no scrolling;
   * if it's much taller (long itinerary) it scrolls at normal size so text stays readable. */
  const FIT_MIN_SCALE = 0.68;
  let fitTimer = 0;
  const fitCache = new WeakMap();
  function wrapPages() {
    $$('.page').forEach((page) => {
      const inner = document.createElement('div');
      inner.className = 'fit-inner';
      while (page.firstChild) inner.appendChild(page.firstChild);
      page.appendChild(inner);
    });
  }
  function fitPage() {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(() => {
      const main = $('#app');
      const cs = getComputedStyle(main);
      const avail = Math.floor(window.innerHeight - $('.topbar').offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom));
      main.style.setProperty('--avail', `${avail}px`);
      const page = $('.page.active'); if (!page) return;
      const inner = page.querySelector('.fit-inner');
      const prevZoom = inner.style.zoom;
      inner.style.zoom = '';
      const natural = inner.offsetHeight;
      const c = fitCache.get(inner);
      if (c && c.natural === natural && c.avail === avail) { inner.style.zoom = prevZoom; return; }
      // Pages she types into only shrink a little: inputs use 19px text, so at ≥0.85
      // they stay ≥16px and phones don't auto-zoom when she taps them.
      const typing = !!inner.querySelector('textarea:not([hidden] *), input[type=text]:not([hidden] *), input[type=time]:not([hidden] *)');
      const minScale = typing ? 0.85 : FIT_MIN_SCALE;
      let s = 1;
      if (natural > avail) {
        s = (avail - 8) / natural;
        if (s < minScale) s = 1;
      }
      // Zoom reflows content (square calendar cells, photos), so height doesn't
      // shrink exactly by `s`. Re-measure and correct until it truly fits.
      for (let k = 0; s < 1 && k < 6; k++) {
        inner.style.zoom = String(Math.floor(s * 1000) / 1000);
        // layout height of the (unzoomed) page box: ignores running entrance animations
        const h = page.offsetHeight;
        if (h <= avail) break;
        s *= (avail - 8) / h;
        if (s < minScale) { s = 1; inner.style.zoom = ''; }
      }
      fitCache.set(inner, { natural, avail });
    }, 16);
  }
  function watchFit() {
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver((entries) => {
        if (entries.some((e) => e.target.parentElement.classList.contains('active'))) fitPage();
      });
      $$('.fit-inner').forEach((el) => ro.observe(el));
    }
    // content changes (new questions, reveal, review cards…) also refit
    new MutationObserver(fitPage).observe($('#app'), { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'src'] });
    $$('#app img').forEach((img) => img.addEventListener('load', fitPage));
    window.addEventListener('resize', fitPage);
    window.addEventListener('orientationchange', fitPage);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPage);
  }

  function onEnter(n) {
    if (n === 3) renderCalendarPage();
    if (n === 4) initLocation();
    if (n === 5) renderOriginalItinerary();
    if (n === 6) showSub('form');
    if (n === 7) buildInvitation();
  }
  function back() {
    if (state.page === 6) {
      const sub = $$('#fbForm, #fbReview, #fbRevised').find((e) => !e.hidden);
      if (sub && sub.id !== 'fbForm') return showSub('form');
    }
    if (state.page > 1) go(state.page - 1);
  }

  /* =====================================================================
   *  Page 3 · Calendar
   * ===================================================================== */
  const rejected = new Set();
  function renderCalendar() {
    const cal = $('#calendar');
    if (!PROPOSED.length) {
      cal.innerHTML = '<div class="cal-error">Oops! There are no available proposed dates right now. 🥺<br><small>(Update <code>CONFIG.proposedDates</code> with upcoming Monday–Thursday dates.)</small></div>';
      $('#calOptions').hidden = true;
      return;
    }
    const d = confirmedDate();
    const y = d.getFullYear(); const m = d.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    let cells = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => `<div class="cal-dow">${w}</div>`).join('');
    for (let i = 0; i < first; i++) cells += '<div class="cal-day empty"></div>';
    for (let day = 1; day <= days; day++) {
      const cd = new Date(y, m, day);
      const cls = ['cal-day'];
      if (cd < today) cls.push('past');
      if (sameDay(cd, today)) cls.push('today');
      const pi = PROPOSED.findIndex((p) => sameDay(p, cd));
      if (pi >= 0) cls.push('proposed');
      if (pi >= 0 && rejected.has(pi)) cls.push('rejected');
      if (sameDay(cd, d)) { cls.push('picked'); if (state.dateConfirmed) cls.push('confirmed'); }
      const label = sameDay(cd, d) ? ` aria-label="${esc(fmtDateLong(cd))}, proposed date"` : '';
      cells += `<div class="${cls.join(' ')}"${label}>${day}</div>`;
    }
    cal.innerHTML = `
      <div class="cal-head"><span class="cal-month">${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span></div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-legend"><span><i></i>proposed dates</span><span>💗 our date</span></div>`;
    const pd = $('#pickedDate');
    pd.innerHTML = `<div class="lbl">${state.dateConfirmed ? 'our date ✓' : 'proposed date'}</div><div class="val">${esc(fmtDateLong(d))}</div>`;
    pd.classList.remove('swap'); void pd.offsetWidth; pd.classList.add('swap');
  }
  function renderCalendarPage() {
    renderCalendar();
  }
  function confirmDate() {
    state.dateConfirmed = true;
    // answered questions are tucked away so the page stays compact
    $('#agreeGroup').hidden = true;
    $('#askGroup').hidden = true;
    $('#pickedDate').hidden = true; // the confirmation message already shows the date
    $('#kissMsg').hidden = true;
    const d = confirmedDate();
    $('#dateConfirmText').innerHTML = `Yay! It's a date on <span class="accent">${esc(fmtDateShort(d))}</span>! 🥰<br>I'm already counting down the days.`;
    $('#dateConfirm').hidden = false;
    renderCalendar();
    burstAt($('#calendar .picked') || $('#calendar'));
    // Date changed → any itinerary review must start over for the new weekday.
    state.schedule = null;
  }
  function updateAskText() {
    const last = state.dateIndex >= PROPOSED.length - 1;
    const ask = $('#askText');
    if (last) ask.textContent = 'This is the last date I can offer, accept it or I will kiss you! 💗';
    else if (rejected.size <= 1) ask.textContent = 'Is this good?';
    else ask.textContent = 'How about this day?';
    $$('input[name="ask"]').forEach((r) => { r.checked = false; });
    $('#askGroup').hidden = false;
    // re-trigger entrance animation so she notices the new question
    const g = $('#askGroup'); g.style.animation = 'none'; void g.offsetWidth; g.style.animation = '';
  }
  function rejectCurrent() {
    rejected.add(state.dateIndex);
    if (state.dateIndex < PROPOSED.length - 1) state.dateIndex += 1;
    renderCalendar();
    updateAskText();
  }
  function initCalendarEvents() {
    $('#agreeGroup').addEventListener('change', (e) => {
      if (e.target.value === 'agree') confirmDate();
      else { $('#agreeGroup').hidden = true; rejectCurrent(); }
    });
    $('#askGroup').addEventListener('change', (e) => {
      if (e.target.value === 'yes') return confirmDate();
      const last = state.dateIndex >= PROPOSED.length - 1;
      if (!last) return rejectCurrent();
      // Final date: no more options. "No" just earns a playful threat. 😘
      const kiss = $('#kissMsg');
      const lines = [
        'Hmm, so you choose the kiss? 😘 Okay… but you still have to accept the date hehe 💗',
        'Nope! That button is just for show. 🙈 Tap “Yes!” na please 💕',
        'Kiss incoming… 💋 (the date is still this day though!)',
      ];
      kiss.textContent = lines[(+kiss.dataset.n || 0) % lines.length];
      kiss.dataset.n = (+kiss.dataset.n || 0) + 1;
      kiss.hidden = false;
      const nc = $('#noChoice'); nc.classList.remove('dodge'); void nc.offsetWidth; nc.classList.add('dodge');
      setTimeout(() => { e.target.checked = false; }, 450);
      burstAt(kiss);
    });
    $('#dateContinue').addEventListener('click', () => go(4));
  }

  /* =====================================================================
   *  Page 4 · Location
   * ===================================================================== */
  let photoSetUp = false;
  function initLocation() {
    if (photoSetUp) return;
    photoSetUp = true;
    const img = $('#placePhoto');
    img.onerror = () => {
      img.hidden = true;
      $('#placeFallback').removeAttribute('hidden');
      console.info(`[invite] No photo at ${CONFIG.location.photo}; showing the illustration instead.`);
    };
    img.src = CONFIG.location.photo;
  }
  function reveal() {
    if (state.revealed) return;
    state.revealed = true;
    $('#photoStage').classList.add('revealed');
    $('#mapCard').classList.add('revealed');
    $('.map-pin.to .to-label').textContent = CONFIG.location.short;
    setTimeout(() => {
      $('#revealText').hidden = false;
      burstAt($('#photoFrame'));
    }, 700);
  }

  /* =====================================================================
   *  Schedule engine
   * ===================================================================== */
  function emptyMods() {
    return { removed: new Set(), additions: [], startTime: null, movieTitle: null, movieStart: null, location: null, notes: [], lateOk: false };
  }

  /** Builds an ordered, timed schedule for a template + modifications.
   *  Returns { items, conflicts, removedTitles, homeArrival }. */
  function computeSchedule(tpl, mods) {
    const removed = new Set(mods.removed);
    tpl.items.forEach((it) => { if (it.dependsOn && removed.has(it.dependsOn)) removed.add(it.id); });

    let list = tpl.items.filter((it) => !removed.has(it.id)).map((it) => ({ ...it, details: it.details.slice(), original: true }));

    // personalise movie / location
    if (mods.movieTitle) {
      list = list.map((it) => {
        if (it.id === 'movie') {
          return { ...it, title: `Movie Date: ${mods.movieTitle}`, movie: { title: mods.movieTitle, cast: '', runtime: 'about ' + Math.round(it.duration / 6) / 10 + ' hrs (estimated)' },
            details: [`Watch “${mods.movieTitle}” together`, 'Showtime to double-check at the cinema', `Planned for about ${Math.round(it.duration / 6) / 10} hours`], changed: true };
        }
        if (it.id === 'tickets') {
          return { ...it, details: it.details.map((d) => d.replace(/^Movie: .*/, `Movie: ${mods.movieTitle}`)).filter((d) => !/^Starring/.test(d)), changed: true };
        }
        return it;
      });
    }
    if (mods.movieStart != null) {
      list = list.map((it) => {
        if (it.id === 'movie') return { ...it, fixedStart: toHHMM(mods.movieStart), movedShowtime: true, details: it.details.map((d) => d.replace(/Showtime: .*/, `Showtime: a later screening around ${fmtTime(mods.movieStart)} (to check)`)) };
        if (it.id === 'tickets') return { ...it, details: it.details.map((d) => d.replace(/Showtime: .*|for the .* showing/, (x) => x.startsWith('for') ? `for the ~${fmtTime(mods.movieStart)} showing` : `Showtime: ~${fmtTime(mods.movieStart)}`)) };
        return it;
      });
    }
    if (mods.location) {
      list = list.map((it) => ({ ...it, details: it.details.map((d) => d.replace(/SM Angono|the mall/g, mods.location)) }));
    }

    // insert additions next to their anchors (keeping her order)
    mods.additions.forEach((a) => {
      if (!a.title) return;
      const item = { id: a.uid, icon: a.icon, title: a.title, duration: a.duration, details: a.details && a.details.length ? a.details : [`Planned for about ${durLabel(a.duration)}`], added: true };
      let idx = list.findIndex((it) => it.id === a.anchor);
      const homeIdx = list.findIndex((it) => it.id === 'home');
      let pos;
      if (idx < 0 && a.anchor !== 'home') {
        // anchor was removed: slot it where that activity would have been
        const ti = tpl.items.findIndex((x) => x.id === a.anchor);
        pos = homeIdx >= 0 ? homeIdx : list.length;
        for (let k = ti + 1; ti >= 0 && k < tpl.items.length; k++) {
          const j = list.findIndex((x) => x.id === tpl.items[k].id);
          if (j >= 0) { pos = Math.max(1, j); break; }
        }
      } else if (a.anchor === 'home') pos = homeIdx >= 0 ? homeIdx : list.length;
      else if (a.rel === 'before') pos = Math.max(1, idx);
      else {
        const key = a.anchor;
        pos = idx + 1;
        // skip past previously-inserted additions on the same anchor
        while (pos < list.length && list[pos].added && list[pos]._anchor === key) pos++;
        if (homeIdx >= 0 && pos > list.findIndex((it) => it.id === 'home')) pos = list.findIndex((it) => it.id === 'home');
      }
      item._anchor = a.anchor;
      list.splice(pos, 0, item);
    });

    // timing pass
    const startMin = mods.startTime != null ? mods.startTime : toMin(tpl.start);
    const baseStart = toMin(tpl.start);
    let t = startMin;
    const out = []; const conflicts = [];
    let lastFixedIdx = -1;
    list.forEach((it, i) => {
      if (it.fixedStart) {
        const f = toMin(it.fixedStart);
        if (t > f) {
          const culprits = list.slice(lastFixedIdx + 1, i).filter((x) => x.added).map((x) => x.id);
          conflicts.push({ type: 'late', itemId: it.id, title: it.title, lateBy: t - f, fixed: f, arrival: t, culprits, startChanged: startMin !== baseStart });
        } else if (f - t >= CONFIG.freeTimeThreshold && i > 0) {
          out.push({ id: `free-${i}`, icon: '🌷', title: 'Free Time Together', details: ['Stroll around, hold hands, and take cute photos while we wait'], start: t, end: f, free: true });
        }
        t = Math.max(t, f);
        lastFixedIdx = i;
      }
      const entry = { ...it, start: t, end: t + it.duration };
      if (it.id === 'home') {
        // keep the arrival estimate truthful when the schedule moves
        const arr = `Estimated arrival: around ${fmtTime(entry.end)}`;
        const k = entry.details.findIndex((d) => /^Estimated arrival/.test(d));
        if (k < 0) entry.details = [...entry.details, arr];
        else {
          const m = /before (\d{1,2}:\d{2} [AP]M)/.exec(entry.details[k]);
          const limit = m ? parseClock(m[1]) : null;
          if (limit == null || entry.end > limit) entry.details = entry.details.map((d, j) => (j === k ? arr : d));
        }
      }
      out.push(entry);
      t += it.duration;
    });
    const homeArrival = t;
    if (homeArrival > toMin(CONFIG.latestHomeArrival) && !mods.lateOk) {
      conflicts.push({ type: 'lateHome', arrival: homeArrival });
    }
    const removedTitles = tpl.items.filter((it) => removed.has(it.id)).map((it) => ({ id: it.id, title: it.title, auto: !mods.removed.has(it.id) }));
    return { items: out, conflicts, removedTitles, homeArrival, startMin };
  }

  /** Display label: original wording if the item didn't move, otherwise computed time. */
  function timeLabel(it, baseline) {
    if (it.free) return `${fmtTime(it.start)} – ${fmtTime(it.end)}`;
    const b = baseline && baseline.items.find((x) => x.id === it.id);
    if (it.original && b && b.start === it.start && !it.movedShowtime && it.label) return it.label;
    if (it.id === 'movie' || it.added || it.free) return `${fmtTime(it.start)} – ${fmtTime(it.end)}`;
    return fmtTime(it.start);
  }

  function renderTimeline(ol, sched, baseline, { badges = false } = {}) {
    ol.innerHTML = sched.items.map((it, i) => {
      const b = baseline && baseline.items.find((x) => x.id === it.id);
      const moved = badges && it.original && b && b.start !== it.start;
      const tags = [];
      if (badges && it.added) tags.push('<span class="badge new">✨ your idea</span>');
      if (badges && it.changed) tags.push('<span class="badge new">💗 changed for you</span>');
      if (moved) tags.push(`<span class="badge moved">⏰ moved from ${fmtTime(b.start)}</span>`);
      if (it.id === 'home') tags.push(`<span class="badge">🏡 home by about ${fmtTime(it.end)}</span>`);
      return `<li class="tl-item${it.free ? ' free' : ''}${it.added ? ' added' : ''}" style="animation-delay:${i * 70}ms">
        <span class="tl-heart">${HEART_SVG}</span>
        <div class="tl-card">
          <span class="tl-time">${esc(timeLabel(it, baseline))}</span>
          <div class="tl-title"><span class="tl-icon">${it.icon}</span><span>${esc(it.title)}</span></div>
          <ul>${it.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
          ${tags.length ? `<div class="tl-badges">${tags.join('')}</div>` : ''}
        </div></li>`;
    }).join('');
  }

  function planChipHTML(sched, mods) {
    const d = confirmedDate();
    const loc = (mods && mods.location) || CONFIG.location.name;
    return `<b>${esc(plan().title)}</b><span>📅 ${esc(fmtDateLong(d))}</span><span>📍 ${esc(loc)}</span>`;
  }

  /* =====================================================================
   *  Page 5 · Original itinerary
   * ===================================================================== */
  let baseline = null;
  function renderOriginalItinerary() {
    baseline = computeSchedule(plan(), emptyMods());
    $('#planChip').innerHTML = planChipHTML(baseline);
    renderTimeline($('#timelineOriginal'), baseline, baseline);
  }

  /* =====================================================================
   *  Page 6 · Feedback interpretation
   * ===================================================================== */
  function splitItems(text) {
    return text
      .split(/\n|;|,|\band then\b|\bthen\b|\band\b|&|\+|\bat saka\b|\btsaka\b|\bsaka\b|\bpati\b/i)
      .map((s) => s.replace(/^[\s\-•*·\d.)]+/, '').trim())
      .filter((s) => s && !NOTHING_RE.test(s));
  }
  function splitSentences(text) {
    return text.replace(/([.!?])\s+/g, '$1\n').split(/\n|;/).map((s) => s.trim()).filter((s) => s && !NOTHING_RE.test(s));
  }
  const ANCHOR_WORDS = [
    ['movie', /movie|film|cinema|sine|nood/i],
    ['lunch', /lunch|eat|eating|baboy|samg|kain|meal/i],
    ['milktea', /milk ?tea|coco|tea/i],
    ['tickets', /ticket/i],
    ['depart', /arriv|get there|dating|reach/i],
    ['home', /go(ing)? home|leav|uwi/i],
  ];
  /** Reads phrases like "after the movie", "before lunch", "first", "at 2pm". */
  function parsePlacement(text) {
    const t = text.toLowerCase();
    const tm = TIME_RE.exec(t);
    if (tm && !/\b(before|after|bago|pagkatapos)\s+(?:the\s+)?(movie|lunch|eat|milk|ticket|going home|uwi)/i.test(t)) {
      const at = parseClock(tm[1]);
      if (at != null) return { atTime: at };
    }
    const m = /\b(after|pagkatapos(?: ng| mag)?|before|bago(?: mag| ang)?)\b\s+(?:the\s+|we\s+|our\s+|ng\s+)?(.{0,30})/i.exec(t);
    if (m) {
      const rel = /^(after|pagkatapos)/i.test(m[1]) ? 'after' : 'before';
      for (const [id, re] of ANCHOR_WORDS) {
        if (re.test(m[2])) {
          if (id === 'depart') return { rel: 'after', anchor: 'depart' };
          if (id === 'home') return { rel: 'before', anchor: 'home' };
          return { rel, anchor: id };
        }
      }
    }
    if (/\b(first|right when|as soon as|pagdating|start with)\b/i.test(t)) return { rel: 'after', anchor: 'depart' };
    if (/\b(last|at the end|end of|before (we )?(go|head) home|bago umuwi)\b/i.test(t)) return { rel: 'before', anchor: 'home' };
    return null;
  }
  function cleanTitle(text) {
    let s = text
      .replace(TIME_RE, ' ')
      .replace(/\b(after|before|bago|pagkatapos)\b.*$/i, '')
      .replace(/\b(first|last|at the end|right when we arrive)\b/gi, '')
      .replace(/^(please\s+)?(i want to|i wanna|i'?d like to|i would like to|we should|let'?s|lets|can we|could we|maybe|also|add|gusto ko(ng)?|tara|pwede( ba)?( tayo)?( mag)?)\s+/i, '')
      .replace(/^(go to|go|try|have|get|do|visit|eat at|eat)\s+/i, (m) => (/^(eat|try|have|get)/i.test(m) ? m : ''))
      .replace(/\s+/g, ' ')
      .replace(/[.!?~]+$/, '')
      .trim();
    if (!s) s = text.trim();
    return cap(s.length > 60 ? s.slice(0, 57) + '…' : s);
  }
  function guessActivity(text) {
    const hit = ACTIVITY_CATALOG.find((c) => c.re.test(text));
    return hit ? { icon: hit.icon, duration: hit.duration, guessed: false } : { icon: '✨', duration: 30, guessed: true };
  }
  /** Converts an "at 2 PM" hint into an anchor using the current schedule. */
  function anchorForTime(at, sched) {
    const items = sched.items.filter((x) => !x.free && x.id !== 'home');
    let anchor = 'depart';
    items.forEach((x) => { if (x.end <= at + 10) anchor = x.added ? x._anchor || anchor : x.id; });
    return anchor;
  }

  let uidSeq = 0;
  const newUid = () => `add-${++uidSeq}`;

  function makeAddition(src, text) {
    const vague = VAGUE_RE.test(text) || text.replace(/[^a-z]/gi, '').length < 3;
    const place = parsePlacement(text) || { rel: 'before', anchor: 'home' };
    let rel = place.rel || 'after'; let anchor = place.anchor;
    if (place.atTime != null) { anchor = anchorForTime(place.atTime, baseline); rel = 'after'; }
    const guess = guessActivity(text);
    return {
      kind: 'add', src, quote: text, uid: newUid(),
      title: vague ? '' : cleanTitle(text), icon: guess.icon, duration: guess.duration,
      rel, anchor, atTime: place.atTime ?? null, guessedDuration: guess.guessed,
      needs: vague ? 'I want to get this right! What would you like us to do? 🥺' : null,
      enabled: true,
    };
  }
  function makeRemoval(src, text) {
    const target = REMOVE_TARGETS.find((r) => r.re.test(text));
    if (target && (target.id === 'depart' || target.id === 'home')) {
      return { kind: 'removeLocked', src, quote: text, target: target.id, keepAsNote: true };
    }
    return {
      kind: 'remove', src, quote: text,
      target: target ? target.id : '',
      needs: target ? null : 'Which part of our plan did you mean? 🤔',
    };
  }

  /** Turns the three text boxes into a list of review items. */
  function interpret(fb) {
    const items = [];
    splitItems(fb.add).forEach((t) => items.push(makeAddition('add', t)));
    splitItems(fb.remove).forEach((t) => {
      // "no milk tea" or "milk tea" both mean remove
      items.push(makeRemoval('remove', t.replace(/^(no|remove|skip|without|tanggal(in)?|wag na|huwag na)\s+(the\s+|ang\s+)?/i, '')));
    });
    splitSentences(fb.other).forEach((s) => {
      const low = s.toLowerCase();
      // location change
      if (/instead of sm|not (at )?sm|different (mall|place|venue|location)|other (mall|place)|ibang (lugar|mall)|change (the )?(location|place|venue|mall)/i.test(low)) {
        const m = /(?:go(?: to)?|punta(?: tayo)?(?: sa)?|at|in|to)\s+([A-Z][\w' .-]{2,40}?)\s+instead/i.exec(s) || /instead.*?(?:go(?: to)?|at|to)\s+([A-Z][\w' .-]{2,40})/i.exec(s);
        items.push({ kind: 'location', src: 'other', quote: s, value: m ? m[1].trim() : '', keep: false, needs: m ? null : 'Where would you like to go instead? 📍' });
        return;
      }
      // movie change
      if (/different movie|other movie|another movie|ibang movie|change (the )?movie|watch .+ instead|instead of (remember|hunger)/i.test(low)) {
        const m = /watch\s+["“]?(.+?)["”]?\s+instead/i.exec(s);
        items.push({ kind: 'movie', src: 'other', quote: s, value: m ? cap(m[1].trim()) : '', needs: m ? null : 'Which movie would you like to watch? 🎬' });
        return;
      }
      // meet-up / start time
      if (/\b(meet|start|leave|depart|alis|kita|pick (me )?up|sundo)\b/i.test(low)) {
        const tm = TIME_RE.exec(s) || /\b(\d{1,2})\s*(?:o'?clock)\b/i.exec(s);
        if (tm) {
          const v = parseClock(tm[1] || tm[0], false);
          if (v != null) { items.push({ kind: 'start', src: 'other', quote: s, value: v }); return; }
        }
        if (/later|earlier|mas maaga|mas late|mamaya/i.test(low)) {
          items.push({ kind: 'start', src: 'other', quote: s, value: null, needs: 'What time should we meet? ⏰' });
          return;
        }
      }
      // explicit removal
      const rm = /\b(remove|skip|no more|no need for|don'?t want|do not want|ayoko(ng)?|ayaw ko|tanggal(in)?|cancel|wag na|huwag na)\b\s*(?:the\s+|ang\s+|ng\s+|na\s+)?(.+)/i.exec(s)
        || /^\s*no\s+(movie|milk ?tea|lunch|samg\w*|tickets?|baboy)/i.exec(s);
      if (rm) {
        const rest = rm[rm.length - 1];
        splitItems(rest).forEach((t) => items.push(makeRemoval('other', t)));
        return;
      }
      // explicit addition
      const ad = /\b(add|include|also|isama|dagdag(an)?|i want to|i wanna|i'?d like to|can we|could we|let'?s|lets|gusto ko(ng)?|tara|pwede (ba )?(tayo )?mag)\b\s*(.+)/i.exec(s);
      if (ad && ACTIVITY_CATALOG.some((c) => c.re.test(ad[ad.length - 1]))) {
        items.push(makeAddition('other', ad[ad.length - 1]));
        return;
      }
      // anything else is kept as a note (and can be turned into an activity)
      items.push({ kind: 'note', src: 'other', quote: s, looksLikeActivity: ACTIVITY_CATALOG.some((c) => c.re.test(s)) });
    });
    return items;
  }

  /** Keeps her earlier tweaks if she comes back and edits the same text. */
  function mergeWithPrevious(next, prev) {
    const used = new Set();
    return next.map((it) => {
      const i = prev.findIndex((p, k) => !used.has(k) && p.kind === it.kind && p.quote === it.quote && p.src === it.src);
      if (i >= 0) { used.add(i); return prev[i]; }
      return it;
    });
  }

  function modsFromReview(review) {
    const mods = emptyMods();
    review.forEach((r) => {
      if (r.kind === 'add' && r.enabled && r.title) mods.additions.push(r);
      if (r.kind === 'remove' && r.target && r.target !== 'note') mods.removed.add(r.target);
      if (r.kind === 'remove' && r.target === 'note') mods.notes.push(r.quote);
      if (r.kind === 'removeLocked') mods.notes.push(r.quote);
      if (r.kind === 'start' && r.value != null) mods.startTime = r.value;
      if (r.kind === 'movie' && r.value) mods.movieTitle = r.value;
      if (r.kind === 'location' && !r.keep && r.value) mods.location = r.value;
      if (r.kind === 'note') mods.notes.push(r.quote);
    });
    Object.assign(mods, state.resolutions);
    if (mods.removed.has('movie')) mods.movieStart = null;
    return mods;
  }

  function unresolvedItems() {
    return state.review.filter((r) => (
      (r.kind === 'add' && r.enabled && !r.title) ||
      (r.kind === 'remove' && !r.target) ||
      (r.kind === 'start' && r.value == null) ||
      (r.kind === 'movie' && !r.value) ||
      (r.kind === 'location' && !r.keep && !r.value)
    ));
  }

  /* ---------- review UI ---------- */
  function anchorOptions(selectedRel, selectedAnchor) {
    const tpl = plan();
    const opts = [];
    tpl.items.forEach((it) => {
      if (it.id === 'home') return;
      if (it.id === 'depart') opts.push(['after|depart', 'Right when we arrive']);
      else opts.push([`after|${it.id}`, `After ${shortName(it)}`]);
      if (it.id === 'movie') opts.splice(opts.length - 1, 0, ['before|movie', 'Before the movie']);
    });
    opts.push(['before|home', 'Before we go home']);
    const sel = `${selectedRel}|${selectedAnchor}`;
    return opts.map(([v, l]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${esc(l)}</option>`).join('');
  }
  function shortName(it) {
    return { milktea: 'milk tea', tickets: 'buying tickets', movie: 'the movie', lunch: 'lunch', depart: 'we arrive', home: 'going home' }[it.id] || it.title;
  }
  const DURATIONS = [10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180];
  const durLabel = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m >= 120 ? 's' : ''}${m % 60 ? ` ${m % 60} min` : ''}`);
  function durationOptions(sel) {
    const list = DURATIONS.includes(sel) ? DURATIONS : [...DURATIONS, sel].sort((a, b) => a - b);
    return list.map((m) => `<option value="${m}"${m === sel ? ' selected' : ''}>${durLabel(m)}</option>`).join('');
  }
  function removalOptions(sel) {
    const opts = plan().items.filter((it) => !it.locked).map((it) => [it.id, it.title]);
    return `<option value=""${!sel ? ' selected' : ''}>Choose one…</option>` +
      opts.map(([v, l]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${esc(l)}</option>`).join('') +
      `<option value="note"${sel === 'note' ? ' selected' : ''}>Nothing to remove, just keep it as a note</option>`;
  }
  const SRC_LABEL = { add: 'from “add”', remove: 'from “remove”', other: 'from “other suggestions”' };

  function renderReview() {
    const list = $('#reviewList');
    list.innerHTML = state.review.map((r, i) => {
      const quote = `<p class="rc-quote">You wrote: “${esc(r.quote)}” <small>(${SRC_LABEL[r.src]})</small></p>`;
      const unresolved = unresolvedItems().includes(r);
      const needs = unresolved && r.needs ? `<p class="rc-ask">${esc(r.needs)}</p>` : '';
      const cls = `review-card${unresolved ? ' needs' : ''}`;
      if (r.kind === 'add') {
        if (!r.enabled) {
          return `<div class="${cls} info" data-i="${i}"><div class="rc-head"><span class="rc-type">idea</span> Not adding this one</div>${quote}
            <div class="rc-actions"><button class="btn-mini" data-act="enable">Add it back 💗</button></div></div>`;
        }
        return `<div class="${cls}" data-i="${i}">
          <div class="rc-head"><span class="rc-type">add</span> ${r.icon} I'll add this to our plan</div>${quote}${needs}
          <div class="rc-grid cols">
            <label>Activity<input type="text" data-f="title" value="${esc(r.title)}" placeholder="e.g. Photobooth"></label>
            <label>When<select data-f="place">${anchorOptions(r.rel, r.anchor)}</select></label>
            <label>How long${r.guessedDuration ? ' (my guess)' : ''}<select data-f="duration">${durationOptions(r.duration)}</select></label>
          </div>
          ${r.atTime != null ? `<p class="fine" style="margin:6px 0 0;text-align:left">You mentioned ${fmtTime(r.atTime)}, so I placed it where it fits closest. 💕</p>` : ''}
          <div class="rc-actions"><button class="btn-mini danger" data-act="disable">Actually, don't add this</button></div>
        </div>`;
      }
      if (r.kind === 'remove') {
        const t = plan().items.find((x) => x.id === r.target);
        return `<div class="${cls}" data-i="${i}">
          <div class="rc-head"><span class="rc-type">remove</span> ${t ? `🗑️ I'll take out “${esc(t.title)}”` : r.target === 'note' ? '💌 Keeping this as a note' : '🤔 Help me understand'}</div>${quote}${needs}
          <div class="rc-grid"><label>Remove which part?<select data-f="target">${removalOptions(r.target)}</select></label></div>
          ${r.target === 'movie' && plan().items.some((x) => x.dependsOn === 'movie') ? '<p class="fine" style="margin:6px 0 0;text-align:left">Since we\'d skip the movie, I\'ll also skip buying tickets.</p>' : ''}
        </div>`;
      }
      if (r.kind === 'removeLocked') {
        return `<div class="review-card info" data-i="${i}"><div class="rc-head"><span class="rc-type">remove</span> 🚌 We still need this one</div>${quote}
          <p style="margin:0">We have to get to ${esc(CONFIG.location.short)} and back home to ${esc(CONFIG.hometown)} somehow 😅, so I can't remove the trip itself. I'll keep your message as a note so we can talk about it! 💌</p></div>`;
      }
      if (r.kind === 'start') {
        return `<div class="${cls}" data-i="${i}"><div class="rc-head"><span class="rc-type">schedule</span> ⏰ Changing our meet-up time</div>${quote}${needs}
          <div class="rc-grid"><label>Meet-up time<input type="time" data-f="start" value="${r.value != null ? toHHMM(r.value) : ''}"></label></div>
          <p class="fine" style="margin:6px 0 0;text-align:left">Everything after it shifts automatically.</p></div>`;
      }
      if (r.kind === 'movie') {
        return `<div class="${cls}" data-i="${i}"><div class="rc-head"><span class="rc-type">movie</span> 🎬 Watching a different movie</div>${quote}${needs}
          <div class="rc-grid"><label>Movie title<input type="text" data-f="movie" value="${esc(r.value)}" placeholder="Movie title"></label></div>
          <p class="fine" style="margin:6px 0 0;text-align:left">I'll keep the same time slot. We'll check the real showtime at the cinema.</p></div>`;
      }
      if (r.kind === 'location') {
        return `<div class="${cls}" data-i="${i}"><div class="rc-head"><span class="rc-type">place</span> 📍 Changing where we go</div>${quote}${needs}
          ${r.keep ? `<p style="margin:0 0 8px">Okay! We'll stay with <b>${esc(CONFIG.location.name)}</b>. 💗</p>` : `<div class="rc-grid"><label>New place<input type="text" data-f="location" value="${esc(r.value)}" placeholder="Where to?"></label></div>
          <p class="fine" style="margin:6px 0 0;text-align:left">Heads up: the travel time and the places inside the plan (Coco, Romantic Baboy, the cinema) are based on SM Angono, so I'll treat them as “to check”.</p>`}
          <div class="rc-actions"><button class="btn-mini" data-act="toggleKeep">${r.keep ? 'No, I do want to change it' : `Actually, keep ${esc(CONFIG.location.short)}`}</button></div></div>`;
      }
      // note
      return `<div class="review-card info" data-i="${i}"><div class="rc-head"><span class="rc-type">note</span> 💌 I'll keep this in mind</div>${quote}
        <p style="margin:0">I'll write this on our invitation so I won't forget.</p>
        <div class="rc-actions"><button class="btn-mini" data-act="toActivity">${r.looksLikeActivity ? 'This sounds like an activity, add it to the plan?' : 'Make this an activity instead'}</button></div></div>`;
    }).join('');
    renderScheduleCheck();
  }

  function renderScheduleCheck() {
    const box = $('#scheduleCheck');
    const mods = modsFromReview(state.review);
    const sched = computeSchedule(plan(), mods);
    const unresolved = unresolvedItems();
    let html = '';
    sched.conflicts.forEach((c, ci) => {
      if (c.type === 'late') {
        const culprits = state.review.filter((r) => c.culprits.includes(r.uid));
        const names = culprits.map((r) => `“${esc(r.title)}”`).join(' and ');
        const why = culprits.length
          ? `${c.startChanged ? `The new meet-up time plus ${names}` : names} would make us <b>${durLabel(c.lateBy)} late</b> for ${esc(c.title)} at ${fmtTime(c.fixed)}.`
          : `With the new meet-up time we'd only be ready at ${fmtTime(c.arrival)}, <b>${durLabel(c.lateBy)} after</b> ${esc(c.title)} starts (${fmtTime(c.fixed)}).`;
        const lastCulprit = culprits[culprits.length - 1];
        const canShorten = lastCulprit && lastCulprit.duration - c.lateBy >= 10;
        html += `<div class="conflict" data-c="${ci}"><p>⚠️ Schedule clash! ${why} How should we fix it?</p><div class="rc-actions">
          ${culprits.length ? '<button class="btn-mini" data-fix="moveAfter">Move it after the movie</button>' : ''}
          ${canShorten ? `<button class="btn-mini" data-fix="shorten">Shorten “${esc(lastCulprit.title)}” to ${durLabel(lastCulprit.duration - c.lateBy)}</button>` : ''}
          ${c.itemId === 'movie' ? `<button class="btn-mini" data-fix="laterShow">Catch a later screening (~${fmtTime(Math.ceil(c.arrival / 30) * 30)})</button>` : ''}
          ${c.startChanged ? '<button class="btn-mini" data-fix="revertStart">Keep the original meet-up time</button>' : ''}
          ${c.itemId === 'movie' ? '<button class="btn-mini danger" data-fix="skipMovie">Skip the movie</button>' : ''}
        </div></div>`;
      } else if (c.type === 'lateHome') {
        html += `<div class="conflict" data-c="${ci}"><p>🌙 With everything added, we'd get home around <b>${fmtTime(c.arrival)}</b>. Is that okay with you?</p><div class="rc-actions">
          <button class="btn-mini" data-fix="lateOk">That's okay 💗</button>
          <span class="fine" style="margin:0">…or shorten/remove something above.</span></div></div>`;
      }
    });
    if (!sched.conflicts.length && !unresolved.length) {
      html += `<div class="ok-check">✅ Everything fits! We'd head home around ${fmtTime(sched.items[sched.items.length - 1].start)} and arrive by about ${fmtTime(sched.homeArrival)}.</div>`;
    }
    box.innerHTML = html;
    const blocked = sched.conflicts.length || unresolved.length;
    $('#reviewBuild').disabled = !!blocked;
    const reason = $('#blockReason');
    reason.hidden = !blocked;
    reason.textContent = unresolved.length ? `Please help me with the highlighted ${unresolved.length === 1 ? 'card' : 'cards'} first 🥺` : sched.conflicts.length ? 'Let\'s fix the schedule clash first 💕' : '';
  }

  function applyFix(fix, conflict) {
    const review = state.review;
    const culprits = review.filter((r) => conflict.culprits && conflict.culprits.includes(r.uid));
    if (fix === 'moveAfter') culprits.forEach((r) => { r.rel = 'after'; r.anchor = conflict.itemId; r.atTime = null; });
    if (fix === 'shorten') { const r = culprits[culprits.length - 1]; r.duration -= conflict.lateBy; r.guessedDuration = false; }
    if (fix === 'laterShow') state.resolutions.movieStart = Math.ceil(conflict.arrival / 30) * 30;
    if (fix === 'revertStart') review.forEach((r) => { if (r.kind === 'start') { r.kind = 'note'; r.quote = `${r.quote} (we'll keep the original meet-up time so we make the movie 💗)`; } });
    if (fix === 'skipMovie') review.push({ kind: 'remove', src: 'other', quote: 'Skip the movie (to fix the schedule)', target: 'movie' });
    if (fix === 'lateOk') state.resolutions.lateOk = true;
    renderReview();
  }

  function initReviewEvents() {
    const list = $('#reviewList');
    list.addEventListener('input', (e) => {
      const card = e.target.closest('[data-i]'); if (!card) return;
      const r = state.review[+card.dataset.i]; const f = e.target.dataset.f;
      if (f === 'title') r.title = e.target.value.trim() ? e.target.value : '';
      if (f === 'movie') r.value = e.target.value.trim();
      if (f === 'location') r.value = e.target.value.trim();
      if (f === 'title' && r.title) { const g = guessActivity(r.title); r.icon = g.icon; }
      renderScheduleCheck();
      // update highlight without stealing focus
      card.classList.toggle('needs', unresolvedItems().includes(r));
    });
    list.addEventListener('change', (e) => {
      const card = e.target.closest('[data-i]'); if (!card) return;
      const r = state.review[+card.dataset.i]; const f = e.target.dataset.f;
      if (f === 'place') { const [rel, anchor] = e.target.value.split('|'); r.rel = rel; r.anchor = anchor; r.atTime = null; }
      if (f === 'duration') { r.duration = +e.target.value; r.guessedDuration = false; }
      if (f === 'target') r.target = e.target.value;
      if (f === 'start') r.value = e.target.value ? toMin(e.target.value) : null;
      if (f === 'title' || f === 'movie' || f === 'location') return renderScheduleCheck();
      renderReview();
    });
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]'); if (!btn) return;
      const i = +btn.closest('[data-i]').dataset.i; const r = state.review[i];
      const act = btn.dataset.act;
      if (act === 'disable') r.enabled = false;
      if (act === 'enable') r.enabled = true;
      if (act === 'toggleKeep') r.keep = !r.keep;
      if (act === 'toActivity') state.review[i] = makeAddition(r.src, r.quote);
      renderReview();
    });
    $('#scheduleCheck').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fix]'); if (!btn) return;
      const ci = +btn.closest('[data-c]').dataset.c;
      const sched = computeSchedule(plan(), modsFromReview(state.review));
      applyFix(btn.dataset.fix, sched.conflicts[ci]);
    });
    $('#reviewBack').addEventListener('click', () => showSub('form'));
    $('#reviewBuild').addEventListener('click', () => buildRevised());
  }

  /* ---------- sub-views of page 6 ---------- */
  function showSub(name) {
    ['form', 'review', 'revised'].forEach((s) => {
      const el = { form: $('#fbForm'), review: $('#fbReview'), revised: $('#fbRevised') }[s];
      el.hidden = s !== name;
    });
    if (name === 'form') {
      $('#fbAdd').value = state.feedback.add;
      $('#fbRemove').value = state.feedback.remove;
      $('#fbOther').value = state.feedback.other;
    }
    window.scrollTo({ top: 0 });
    fitPage();
  }

  function onFeedbackSubmit(e) {
    e.preventDefault();
    state.feedback = { add: $('#fbAdd').value, remove: $('#fbRemove').value, other: $('#fbOther').value };
    store.set('invite.feedback', state.feedback);
    if (!baseline) baseline = computeSchedule(plan(), emptyMods());
    const fresh = interpret(state.feedback);
    state.review = mergeWithPrevious(fresh, state.review);
    // keep earlier clash decisions, but drop a "later screening" that's no longer needed
    if (state.resolutions.movieStart != null) {
      const saved = state.resolutions.movieStart;
      delete state.resolutions.movieStart;
      const test = computeSchedule(plan(), modsFromReview(state.review));
      if (test.conflicts.some((c) => c.type === 'late' && c.itemId === 'movie')) state.resolutions.movieStart = saved;
    }
    if (!state.review.length) return buildRevised();
    showSub('review');
    renderReview();
  }

  function buildRevised() {
    const mods = modsFromReview(state.review);
    const sched = computeSchedule(plan(), mods);
    if (sched.conflicts.length || unresolvedItems().length) { showSub('review'); renderReview(); return; }
    sched.mods = mods;
    state.schedule = sched;
    $('#planChipRevised').innerHTML = planChipHTML(sched, mods);
    renderTimeline($('#timelineRevised'), sched, baseline, { badges: true });
    $('#noChangeNote').hidden = state.review.length > 0;
    // extras: what was removed, notes
    const extras = [];
    if (sched.removedTitles.length) {
      extras.push(`<div class="extra-box"><h4>🗑️ Skipped, just like you asked</h4><ul>${sched.removedTitles.map((r) => `<li><s>${esc(r.title)}</s>${r.auto ? ' <small>(not needed without the movie)</small>' : ''}</li>`).join('')}</ul></div>`);
    }
    const changes = [];
    if (mods.startTime != null) changes.push(`Meet-up moved to ${fmtTime(mods.startTime)}`);
    if (mods.movieTitle) changes.push(`Movie changed to “${mods.movieTitle}”`);
    if (mods.movieStart != null) changes.push(`Catching a later screening (~${fmtTime(mods.movieStart)})`);
    if (mods.location) changes.push(`Destination changed to ${mods.location}`);
    if (mods.lateOk) changes.push(`Getting home a bit later (~${fmtTime(sched.homeArrival)}) is okay`);
    if (changes.length) extras.push(`<div class="extra-box"><h4>💗 Changes you asked for</h4><ul>${changes.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>`);
    if (mods.notes.length) extras.push(`<div class="extra-box"><h4>💌 Little notes I'll remember</h4><ul>${mods.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>`);
    $('#revisedExtras').innerHTML = extras.join('');
    showSub('revised');
    // invalidate any previously generated invitation
    state.inviteBlob = null;
  }

  /* =====================================================================
   *  Page 7 · Invitation
   * ===================================================================== */
  function invitationData() {
    const s = state.schedule; const mods = s.mods;
    const movieItem = s.items.find((x) => x.id === 'movie');
    const changes = [];
    s.removedTitles.forEach((r) => changes.push(`Skipping: ${r.title}`));
    if (mods.startTime != null) changes.push(`Meet-up moved to ${fmtTime(mods.startTime)}`);
    if (mods.movieTitle) changes.push(`Movie changed to “${mods.movieTitle}”`);
    if (mods.movieStart != null) changes.push(`Later screening, around ${fmtTime(mods.movieStart)}`);
    if (mods.location) changes.push(`New destination: ${mods.location}`);
    return {
      recipient: CONFIG.recipientName,
      from: CONFIG.senderName,
      dateText: fmtDateLong(confirmedDate()),
      planTitle: plan().title,
      location: mods.location || CONFIG.location.name,
      area: mods.location ? '' : CONFIG.location.area,
      items: s.items.map((it) => ({ time: timeLabel(it, baseline), icon: it.icon, title: it.title, details: it.details, added: !!it.added, free: !!it.free })),
      movie: movieItem ? { title: movieItem.movie.title, cast: movieItem.movie.cast, showtime: fmtTime(movieItem.start), runtime: movieItem.movie.runtime } : null,
      additions: s.items.filter((x) => x.added).map((x) => `${x.title} (${fmtTime(x.start)})`),
      changes,
      notes: mods.notes,
      homeBy: fmtTime(s.homeArrival),
    };
  }

  async function buildInvitation() {
    const loader = $('#inviteLoader'); const thumb = $('#inviteThumb'); const err = $('#inviteError');
    if (!state.schedule) return go(6);
    if (state.inviteBlob && state.inviteUrl) { thumb.src = state.inviteUrl; thumb.hidden = false; loader.hidden = true; enableInviteButtons(true); return; }
    loader.hidden = false; thumb.hidden = true; err.hidden = true; enableInviteButtons(false);
    try {
      const canvas = await window.InvitationRenderer.render(invitationData());
      const blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'));
      if (state.inviteUrl) URL.revokeObjectURL(state.inviteUrl);
      state.inviteBlob = blob;
      state.inviteUrl = URL.createObjectURL(blob);
      thumb.src = state.inviteUrl; thumb.hidden = false; loader.hidden = true;
      enableInviteButtons(true);
      burstAt(thumb.parentElement);
    } catch (e) {
      console.error(e);
      loader.hidden = true;
      err.hidden = false;
      err.innerHTML = 'Oh no, the invitation didn\'t come out right. 🥺 <button class="btn-mini" id="retryInvite">Try again</button>';
      $('#retryInvite').onclick = () => { state.inviteBlob = null; buildInvitation(); };
    }
  }
  function enableInviteButtons(on) { $('#downloadInvite').disabled = !on; $('#viewInvite').disabled = !on; }
  function downloadInvite() {
    if (!state.inviteUrl) return;
    const a = document.createElement('a');
    const d = confirmedDate();
    a.href = state.inviteUrl;
    a.download = `our-date-invitation-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    burstAt($('#downloadInvite'));
  }
  function viewInvite() {
    if (!state.inviteUrl) return;
    $('#viewerImg').src = state.inviteUrl;
    $('#viewer').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeViewer() { $('#viewer').hidden = true; document.body.style.overflow = ''; }

  /* =====================================================================
   *  Wire up
   * ===================================================================== */
  function init() {
    wrapPages();
    watchFit();
    $$('[data-name]').forEach((e) => { e.textContent = CONFIG.recipientName; });
    $$('[data-loc-short]').forEach((e) => { e.textContent = CONFIG.location.short; });
    $$('[data-hometown]').forEach((e) => { e.textContent = CONFIG.hometown; });
    spawnBgHearts();
    $$('[data-go]').forEach((b) => b.addEventListener('click', (e) => { burstAt(e.currentTarget); go(+b.dataset.go); }));
    $('#backBtn').addEventListener('click', back);
    initCalendarEvents();
    $('#photoFrame').addEventListener('click', reveal);
    $('#feedbackForm').addEventListener('submit', onFeedbackSubmit);
    ['fbAdd', 'fbRemove', 'fbOther'].forEach((id) => $(`#${id}`).addEventListener('input', () => {
      store.set('invite.feedback', { add: $('#fbAdd').value, remove: $('#fbRemove').value, other: $('#fbOther').value });
    }));
    initReviewEvents();
    $('#approvePlan').addEventListener('click', (e) => { burstAt(e.currentTarget); go(7); });
    $('#changeMore').addEventListener('click', () => showSub('form'));
    $('#downloadInvite').addEventListener('click', downloadInvite);
    $('#viewInvite').addEventListener('click', viewInvite);
    $('#inviteThumb').addEventListener('click', viewInvite);
    $('#viewerClose').addEventListener('click', closeViewer);
    $('#viewer').addEventListener('click', (e) => { if (e.target.id === 'viewer' || e.target.classList.contains('viewer-scroll')) closeViewer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#viewer').hidden) closeViewer(); });
    go(1);
  }

  // exposed for testing / tweaking from the console
  window.__invite = { state, CONFIG, PROPOSED, interpret, computeSchedule, ITINERARIES, go };
  document.addEventListener('DOMContentLoaded', init);
})();
