/* Patient Visit Logbook (Demo)
 * Plain JavaScript, no backend, no login. All sample data is fictional.
 * Entries you add are kept in this browser's localStorage only.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'demo-visit-logbook-v1';
  const NOTES_MAX = 300;

  const DEPARTMENTS = [
    'Cardiology', 'Emergency', 'General Medicine', 'Maternity',
    'Orthopedics', 'Outpatient Clinic', 'Pediatrics', 'Radiology'
  ];
  const VISIT_TYPES = [
    'Walk-in', 'Scheduled appointment', 'Follow-up', 'Referral',
    'Emergency', 'Admission', 'Discharge'
  ];
  const STAFF = [
    'Dr. Grace Mbeki', 'Dr. Imani Hart', 'Dr. Priya Raman',
    'Nurse Ana Ruiz', 'Nurse Leo Park', 'Nurse Tomas Vega', 'Tech Sam Whitfield'
  ];

  // ---------- Small helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Build DOM safely (text is always set with textContent, never innerHTML).
  function h(tag, props, ...kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'role' || k.startsWith('aria-') || k.startsWith('data-')) node.setAttribute(k, v);
        else node[k] = v;
      }
    }
    kids.forEach(kid => {
      if (kid !== null && kid !== undefined && kid !== false) node.append(kid);
    });
    return node;
  }

  const pad = n => String(n).padStart(2, '0');
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isoTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const parseWhen = (date, time) => new Date(`${date}T${time || '00:00'}:00`);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  function fmtDate(date) {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  function fmtTime(time) {
    const [hh, mm] = time.split(':').map(Number);
    return new Date(2000, 0, 1, hh, mm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  function whenLabel(entry) {
    const today = isoDate(new Date());
    const day = entry.date === today ? 'Today' : fmtDate(entry.date);
    return `${day}, ${fmtTime(entry.time)}`;
  }

  // ---------- Fictional sample data (always generated relative to "now") ----------
  function buildSamples() {
    const now = new Date();
    const today = isoDate(now);

    // [minutes ago, patient ID, department, staff, visit type, notes]
    const todayRows = [
      [10, 'DEMO-1052', 'Outpatient Clinic', 'Nurse Ana Ruiz', 'Scheduled appointment', 'Checked in at the front desk. Appointment started on time.'],
      [32, 'DEMO-1051', 'Emergency', 'Dr. Imani Hart', 'Emergency', 'Registered at the triage desk. Family contact recorded.'],
      [65, 'DEMO-1050', 'Pediatrics', 'Dr. Grace Mbeki', 'Follow-up', 'Next appointment booked at reception.'],
      [105, 'DEMO-1049', 'Radiology', 'Tech Sam Whitfield', 'Referral', 'Referred visit. Scheduling paperwork completed.'],
      [150, 'DEMO-1048', 'Cardiology', 'Dr. Priya Raman', 'Scheduled appointment', 'Arrived early. Interpreter requested and arranged.'],
      [210, 'DEMO-1047', 'General Medicine', 'Nurse Tomas Vega', 'Walk-in', 'Walk-in registration completed. Waited in the main lobby.'],
      [280, 'DEMO-1046', 'Maternity', 'Nurse Leo Park', 'Admission', 'Admission paperwork completed with a family member present.']
    ];

    // [day offset, time, patient ID, department, staff, visit type, notes]
    const pastRows = [
      [-1, '16:20', 'DEMO-1045', 'Orthopedics', 'Dr. Imani Hart', 'Follow-up', 'Follow-up booked for next month. Parking validation given.'],
      [-1, '14:05', 'DEMO-1044', 'Outpatient Clinic', 'Nurse Ana Ruiz', 'Walk-in', 'Registered, then directed to the correct clinic desk.'],
      [-1, '11:30', 'DEMO-1043', 'Emergency', 'Dr. Priya Raman', 'Emergency', 'Registered at the triage desk. Moved to the waiting area.'],
      [-1, '09:15', 'DEMO-1042', 'Pediatrics', 'Dr. Grace Mbeki', 'Scheduled appointment', 'Guardian present. Consent forms filed.'],
      [-2, '15:45', 'DEMO-1041', 'Cardiology', 'Dr. Priya Raman', 'Discharge', 'Discharge paperwork completed and filed.'],
      [-2, '10:10', 'DEMO-1040', 'Radiology', 'Tech Sam Whitfield', 'Scheduled appointment', 'Arrived with referral form. Check-in completed.'],
      [-2, '08:40', 'DEMO-1039', 'General Medicine', 'Nurse Tomas Vega', 'Walk-in', 'Walk-in visit registered. No wait recorded.'],
      [-3, '13:25', 'DEMO-1038', 'Maternity', 'Nurse Leo Park', 'Follow-up', 'Follow-up scheduled. Contact preferences updated.'],
      [-3, '09:50', 'DEMO-1037', 'Outpatient Clinic', 'Nurse Ana Ruiz', 'Referral', 'Referral letter received and filed at reception.'],
      [-4, '17:05', 'DEMO-1036', 'Emergency', 'Dr. Imani Hart', 'Emergency', 'Registered at the triage desk. Insurance details pending.'],
      [-4, '12:00', 'DEMO-1035', 'Orthopedics', 'Dr. Imani Hart', 'Scheduled appointment', 'Arrived with a companion. Wheelchair offered at the entrance.'],
      [-5, '15:30', 'DEMO-1034', 'Pediatrics', 'Dr. Grace Mbeki', 'Walk-in', 'Guardian completed registration forms.'],
      [-5, '10:20', 'DEMO-1033', 'Cardiology', 'Dr. Priya Raman', 'Follow-up', 'Appointment reminder preference updated.'],
      [-6, '14:40', 'DEMO-1032', 'General Medicine', 'Nurse Tomas Vega', 'Admission', 'Admission registered. Room assignment recorded by the ward clerk.'],
      [-6, '09:05', 'DEMO-1031', 'Radiology', 'Tech Sam Whitfield', 'Scheduled appointment', 'Check-in completed. Waited in the imaging waiting area.'],
      [-8, '11:15', 'DEMO-1030', 'Outpatient Clinic', 'Nurse Ana Ruiz', 'Follow-up', 'Follow-up booked for six weeks out.'],
      [-9, '16:00', 'DEMO-1029', 'Emergency', 'Dr. Priya Raman', 'Emergency', 'Registered at the triage desk. Contact person recorded.'],
      [-10, '13:10', 'DEMO-1028', 'Maternity', 'Nurse Leo Park', 'Scheduled appointment', 'Arrived on schedule. Forms updated.'],
      [-12, '10:30', 'DEMO-1027', 'Pediatrics', 'Dr. Grace Mbeki', 'Discharge', 'Discharge paperwork filed. Guardian received copies.']
    ];

    const out = [];

    todayRows.forEach((r, i) => {
      let t = new Date(now.getTime() - r[0] * 60000);
      // If "minutes ago" crosses midnight, keep the entry on today's date.
      if (isoDate(t) !== today) t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, i + 1);
      out.push({
        id: `s-t${i}`, patientId: r[1], date: today, time: isoTime(t),
        department: r[2], staff: r[3], type: r[4], notes: r[5], sample: true
      });
    });

    pastRows.forEach((r, i) => {
      out.push({
        id: `s-p${i}`, patientId: r[2], date: isoDate(addDays(now, r[0])), time: r[1],
        department: r[3], staff: r[4], type: r[5], notes: r[6], sample: true
      });
    });

    return out;
  }

  // ---------- State and storage ----------
  const defaultFilters = () => ({ q: '', dept: '', type: '', from: '', to: '', sort: 'newest' });

  const state = {
    samples: buildSamples(),
    user: loadUser(),
    storageOk: true,
    filters: defaultFilters(),
    highlightId: null
  };

  function loadUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      const needed = ['id', 'patientId', 'date', 'time', 'department', 'staff', 'type'];
      return arr
        .filter(e => e && typeof e === 'object' && needed.every(k => typeof e[k] === 'string'))
        .map(e => ({ ...e, notes: typeof e.notes === 'string' ? e.notes : '', sample: false }));
    } catch (err) {
      return [];
    }
  }

  function saveUser() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
      state.storageOk = true;
    } catch (err) {
      state.storageOk = false;
    }
  }

  const allEntries = () => state.samples.concat(state.user);
  const sortKey = e => `${e.date}T${e.time}`;
  const byNewest = (a, b) => sortKey(b).localeCompare(sortKey(a));

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.textContent = ''; }, 6000);
  }

  // ---------- Shared UI pieces ----------
  function badge(type) {
    let cls = 'badge badge--calm';
    if (type === 'Emergency') cls = 'badge badge--emergency';
    else if (type === 'Admission' || type === 'Discharge') cls = 'badge badge--info';
    return h('span', { class: cls, text: type });
  }

  function fillSelect(select, options, placeholder) {
    select.replaceChildren(h('option', { value: '', text: placeholder }));
    options.forEach(o => select.append(h('option', { value: o, text: o })));
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const now = new Date();
    const today = isoDate(now);
    const entries = allEntries();
    const todays = entries.filter(e => e.date === today);
    const weekStart = isoDate(addDays(now, -6));

    $('#today-label').textContent = now.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    $('#stat-today').textContent = todays.length;
    $('#stat-week').textContent = entries.filter(e => e.date >= weekStart && e.date <= today).length;
    $('#stat-emergency').textContent = todays.filter(e => e.type === 'Emergency').length;
    $('#stat-depts').textContent = new Set(todays.map(e => e.department)).size;

    // Recent entries
    const recent = entries.slice().sort(byNewest).slice(0, 6);
    $('#recent-list').replaceChildren(...recent.map(e =>
      h('li', { class: 'recent-item' },
        h('div', { class: 'recent-top' },
          h('strong', { class: 'pid', text: e.patientId }),
          badge(e.type)
        ),
        h('p', { class: 'recent-meta', text: `${e.department} \u00b7 ${e.staff}` }),
        h('p', { class: 'recent-time', text: whenLabel(e) }),
        e.notes ? h('p', { class: 'recent-notes', text: e.notes }) : null
      )
    ));

    // Today by department
    const counts = {};
    todays.forEach(e => { counts[e.department] = (counts[e.department] || 0) + 1; });
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const max = rows.length ? rows[0][1] : 1;
    $('#dept-empty').hidden = rows.length > 0;
    $('#dept-list').replaceChildren(...rows.map(([dept, n]) =>
      h('li', { class: 'dept-row' },
        h('span', { text: dept }),
        h('span', { class: 'dept-count', text: `${n} ${n === 1 ? 'visit' : 'visits'}` }),
        h('div', { class: 'bar', 'aria-hidden': 'true' },
          h('span', { style: `width:${Math.round((n / max) * 100)}%` }))
      )
    ));
  }

  // ---------- Logbook ----------
  function readFiltersFromUI() {
    state.filters = {
      q: $('#f-search').value,
      dept: $('#f-dept').value,
      type: $('#f-type').value,
      from: $('#f-from').value,
      to: $('#f-to').value,
      sort: $('#f-sort').value
    };
  }

  function writeFiltersToUI() {
    const f = state.filters;
    $('#f-search').value = f.q;
    $('#f-dept').value = f.dept;
    $('#f-type').value = f.type;
    $('#f-from').value = f.from;
    $('#f-to').value = f.to;
    $('#f-sort').value = f.sort;
  }

  function applyFilters() {
    const f = state.filters;
    const q = f.q.trim().toLowerCase();
    const list = allEntries().filter(e => {
      if (f.dept && e.department !== f.dept) return false;
      if (f.type && e.type !== f.type) return false;
      if (f.from && e.date < f.from) return false;
      if (f.to && e.date > f.to) return false;
      if (q) {
        const hay = [e.patientId, e.department, e.staff, e.type, e.notes, e.date, fmtDate(e.date)]
          .join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort(f.sort === 'oldest' ? (a, b) => byNewest(b, a) : byNewest);
    return list;
  }

  function cell(label, extraClass, ...kids) {
    return h('td', { role: 'cell', 'data-label': label, class: extraClass || '' }, ...kids);
  }

  function renderLogbook() {
    const f = state.filters;
    const total = allEntries().length;
    const list = applyFilters();
    const badRange = f.from && f.to && f.from > f.to;

    let msg = `Showing ${list.length} of ${total} entries`;
    if (badRange) msg = 'The start date is after the end date, so no entries can match.';
    $('#result-count').textContent = msg;

    $('#table-wrap').hidden = list.length === 0;
    $('#empty-state').hidden = list.length > 0;

    $('#log-body').replaceChildren(...list.map(e => {
      const tr = h('tr', { role: 'row', class: e.id === state.highlightId ? 'row-new' : '' },
        cell('Patient ID', '',
          h('strong', { class: 'pid', text: e.patientId }),
          e.sample ? null : h('span', { class: 'chip chip--added', text: 'Added by you' })
        ),
        cell('Date and time', 'cell-when', `${fmtDate(e.date)}, ${fmtTime(e.time)}`),
        cell('Department', '', e.department),
        cell('Staff member', '', e.staff),
        cell('Visit type', '', badge(e.type)),
        cell('Notes', 'cell-notes', e.notes || '\u2014')
      );
      return tr;
    }));
  }

  function clearFilters() {
    state.filters = defaultFilters();
    writeFiltersToUI();
    renderLogbook();
  }

  // ---------- Add entry form ----------
  const form = $('#entry-form');
  const summary = $('#form-summary');
  const val = id => $('#' + id).value;

  const FIELDS = [
    {
      id: 'e-patient', label: 'Patient ID',
      check() {
        const v = val('e-patient').trim();
        if (!v) return 'Enter a patient ID.';
        if (!/^DEMO-\d{4,6}$/i.test(v)) {
          return 'Use a demo ID such as DEMO-1234 (DEMO- followed by 4 to 6 digits). Real patient IDs are not allowed in this demo.';
        }
        return '';
      }
    },
    {
      id: 'e-staff', label: 'Staff member',
      check() {
        const v = val('e-staff').trim();
        if (!v) return 'Enter the staff member\u2019s name.';
        if (v.length < 2) return 'The staff name must be at least 2 characters.';
        if (v.length > 60) return 'The staff name must be 60 characters or fewer.';
        return '';
      }
    },
    {
      id: 'e-date', label: 'Date',
      check() {
        const v = val('e-date');
        if (!v) return 'Choose the visit date.';
        if (Number.isNaN(parseWhen(v, '00:00').getTime())) return 'Enter a valid date.';
        if (v > isoDate(new Date())) return 'The visit date cannot be in the future.';
        return '';
      }
    },
    {
      id: 'e-time', label: 'Time',
      check() {
        const v = val('e-time');
        if (!v) return 'Enter the visit time.';
        const d = val('e-date');
        if (d && d === isoDate(new Date()) && parseWhen(d, v) > new Date()) {
          return 'The visit time cannot be in the future.';
        }
        return '';
      }
    },
    {
      id: 'e-dept', label: 'Department',
      check() { return val('e-dept') ? '' : 'Select a department.'; }
    },
    {
      id: 'e-type', label: 'Visit type',
      check() { return val('e-type') ? '' : 'Select a visit type.'; }
    },
    {
      id: 'e-notes', label: 'Brief notes',
      check() {
        return val('e-notes').length > NOTES_MAX ? `Notes must be ${NOTES_MAX} characters or fewer.` : '';
      }
    }
  ];

  function showFieldError(id, message) {
    const input = $('#' + id);
    const err = $(`#${id}-error`);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    err.textContent = message;
    err.hidden = !message;
  }

  function validateField(field) {
    const message = field.check();
    showFieldError(field.id, message);
    return message;
  }

  function clearErrors() {
    FIELDS.forEach(f => showFieldError(f.id, ''));
    FIELDS.forEach(f => $('#' + f.id).removeAttribute('aria-invalid'));
    hideSummary();
  }

  function hideSummary() {
    summary.hidden = true;
    summary.replaceChildren();
  }

  function showSummary(errors) {
    const n = errors.length;
    summary.replaceChildren(
      h('h2', { text: `Please fix ${n} ${n === 1 ? 'problem' : 'problems'} before saving` }),
      h('ul', null, ...errors.map(er =>
        h('li', null, h('a', { href: `#${er.id}`, 'data-field': er.id, text: `${er.label}: ${er.message}` })))
      )
    );
    summary.hidden = false;
    summary.focus();
  }

  function setDefaults() {
    const now = new Date();
    const dateEl = $('#e-date');
    dateEl.max = isoDate(now);
    if (!dateEl.value) dateEl.value = isoDate(now);
    if (!$('#e-time').value) $('#e-time').value = isoTime(now);
  }

  function updateNotesCount() {
    const n = val('e-notes').length;
    $('#notes-count').textContent = `${n} / ${NOTES_MAX}`;
  }

  FIELDS.forEach(field => {
    const el = $('#' + field.id);
    // Re-check on leaving a field; once a field shows an error, re-check as the user fixes it.
    el.addEventListener('blur', () => {
      if (el.value !== '' || el.getAttribute('aria-invalid') === 'true') validateField(field);
    });
    const live = () => {
      if (el.getAttribute('aria-invalid') === 'true') validateField(field);
      if (field.id === 'e-date' && $('#e-time').getAttribute('aria-invalid') === 'true') {
        validateField(FIELDS.find(f => f.id === 'e-time'));
      }
    };
    el.addEventListener('input', live);
    el.addEventListener('change', live);
  });

  $('#e-notes').addEventListener('input', updateNotesCount);

  summary.addEventListener('click', ev => {
    const link = ev.target.closest('a[data-field]');
    if (!link) return;
    ev.preventDefault();
    $('#' + link.dataset.field).focus();
  });

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const errors = [];
    FIELDS.forEach(field => {
      const message = validateField(field);
      if (message) errors.push({ id: field.id, label: field.label, message });
    });
    if (errors.length) {
      showSummary(errors);
      return;
    }

    const entry = {
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId: val('e-patient').trim().toUpperCase(),
      date: val('e-date'),
      time: val('e-time'),
      department: val('e-dept'),
      staff: val('e-staff').trim(),
      type: val('e-type'),
      notes: val('e-notes').trim(),
      sample: false
    };
    state.user.push(entry);
    saveUser();

    state.filters = defaultFilters();
    state.highlightId = entry.id;
    form.reset();
    clearErrors();
    setDefaults();
    updateNotesCount();

    let message = `Entry saved for ${entry.patientId}.`;
    if (!state.storageOk) message += ' Your browser blocked storage, so it will be lost when you refresh.';
    toast(message);
    location.hash = '#logbook';
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      clearErrors();
      setDefaults();
      updateNotesCount();
    }, 0);
  });

  // ---------- Routing ----------
  const VIEWS = ['dashboard', 'logbook', 'add'];
  const TITLES = { dashboard: 'Dashboard', logbook: 'Logbook', add: 'Add entry' };
  let current = null;

  function go(name, moveFocus) {
    current = name;
    VIEWS.forEach(v => { $('#view-' + v).hidden = v !== name; });
    $$('.main-nav a').forEach(a => {
      if (a.dataset.view === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = `${TITLES[name]} \u2013 Visit Logbook (Demo)`;

    if (name !== 'logbook') state.highlightId = null;
    if (name === 'dashboard') renderDashboard();
    if (name === 'logbook') { writeFiltersToUI(); renderLogbook(); }
    if (name === 'add') { setDefaults(); updateNotesCount(); }

    window.scrollTo(0, 0);
    if (moveFocus) $('#h-' + name).focus();
  }

  function route(initial) {
    const name = location.hash.slice(1);
    if (!VIEWS.includes(name)) {
      if (!current) go('dashboard', false); // e.g. the skip link's #main
      return;
    }
    go(name, !initial);
  }

  // ---------- Wire up ----------
  fillSelect($('#f-dept'), DEPARTMENTS, 'All departments');
  fillSelect($('#f-type'), VISIT_TYPES, 'All visit types');
  fillSelect($('#e-dept'), DEPARTMENTS, 'Select a department');
  fillSelect($('#e-type'), VISIT_TYPES, 'Select a visit type');
  $('#staff-list').replaceChildren(...STAFF.map(s => h('option', { value: s })));

  let searchTimer = null;
  $('#f-search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { readFiltersFromUI(); renderLogbook(); }, 200);
  });
  ['f-dept', 'f-type', 'f-from', 'f-to', 'f-sort'].forEach(id => {
    $('#' + id).addEventListener('change', () => { readFiltersFromUI(); renderLogbook(); });
  });
  $('#filters').addEventListener('submit', ev => ev.preventDefault());
  $('#clear-filters').addEventListener('click', clearFilters);
  $('#empty-clear').addEventListener('click', clearFilters);

  $('#reset-demo').addEventListener('click', () => {
    if (!window.confirm('Remove all entries you added and restore the original sample data?')) return;
    state.user = [];
    state.highlightId = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
    if (current === 'dashboard') renderDashboard();
    if (current === 'logbook') renderLogbook();
    toast('Demo data reset.');
  });

  window.addEventListener('hashchange', () => route(false));
  route(true);
})();

