/* ============================================================
   RWG CRM — App controller (boot, routing, interactions)
   ============================================================ */
window.RWG = window.RWG || {};
RWG.app = (function () {
  const U = RWG.ui, D = RWG.data;

  const ICONS = {
    dashboard: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    leads: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="12" r="1.2"/><circle cx="3.5" cy="18" r="1.2"/></svg>',
    team: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.2 3.2 0 0 1 0 7"/><path d="M18 20c0-2.5-1-4.5-2.5-5.6"/></svg>',
    upload: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V5"/><path d="M8 9l4-4 4 4"/><path d="M5 19h14"/></svg>',
    settings: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
    board: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="5" height="16" rx="1.3"/><rect x="9.5" y="4" width="5" height="11" rx="1.3"/><rect x="16" y="4" width="5" height="14" rx="1.3"/></svg>',
    today: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>',
    stats: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
    logout: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>'
  };

  const NAV = {
    admin: [
      { view: 'dashboard', label: 'Command Center', icon: 'dashboard' },
      { view: 'leads', label: 'All Leads', icon: 'leads' },
      { view: 'agents', label: 'Team', icon: 'team', badge: () => D.pendingUsers().length },
      { view: 'upload', label: 'Upload & Assign', icon: 'upload' },
      { view: 'settings', label: 'Scoring & Settings', icon: 'settings' }
    ],
    agent: [
      { view: 'board', label: 'My Board', icon: 'board' },
      { view: 'mylist', label: 'My Leads', icon: 'leads' },
      { view: 'today', label: "Today's Queue", icon: 'today' },
      { view: 'stats', label: 'My Stats', icon: 'stats' }
    ]
  };

  const META = {
    dashboard: { t: 'Command Center', s: 'Team performance, live' },
    leads: { t: 'All Leads', s: 'Every lead across the team' },
    agents: { t: 'Team', s: 'Agents & approvals' },
    upload: { t: 'Upload & Assign', s: 'Import and distribute lead lists' },
    settings: { t: 'Scoring & Settings', s: 'Tune the lead-quality engine' },
    board: { t: 'My Board', s: 'Work your pipeline' },
    mylist: { t: 'My Leads', s: 'Your assigned leads, best first' },
    today: { t: "Today's Queue", s: 'What to do right now' },
    stats: { t: 'My Stats', s: 'Your week so far' }
  };

  const newFilter = () => RWG.leadtable.defaultFilter();
  const loadCols = (k, def) => { try { const r = localStorage.getItem(k); if (r) return JSON.parse(r); } catch (e) {} return def.slice(); };
  const saveCols = (k, arr) => { try { localStorage.setItem(k, JSON.stringify(arr)); } catch (e) {} };

  const state = {
    view: null, search: '', leadId: null, editing: false, importRows: null, importName: '', dragId: null,
    agentFilter: newFilter(), adminFilter: newFilter(), selected: new Set(),
    adminCols: loadCols('rwg_cols_admin', RWG.leadtable.defaultVisible(true)),
    agentCols: loadCols('rwg_cols_agent', RWG.leadtable.defaultVisible(false))
  };

  // Which filter / column set is active depends on context: admin "All Leads" vs the agent's views.
  const isAdminLeads = () => { const u = RWG.auth.currentUser(); return !!u && u.role === 'admin' && state.view === 'leads'; };
  const currentFilter = () => isAdminLeads() ? state.adminFilter : state.agentFilter;
  const currentCols = () => isAdminLeads() ? state.adminCols : state.agentCols;
  const currentColsKey = () => isAdminLeads() ? 'rwg_cols_admin' : 'rwg_cols_agent';

  // Leads + filter for whatever lead table is currently on screen
  function currentTableLeads() {
    const u = RWG.auth.currentUser();
    const adminLeads = isAdminLeads();
    const base = adminLeads ? D.leads() : D.leadsFor(u.id);
    const f = Object.assign(newFilter(), currentFilter(), { search: state.search });
    return { adminLeads, f, total: base.length, filtered: RWG.leadtable.applyFilter(base, f) };
  }

  // Position a fixed popover panel just under its trigger button, clamped to the viewport
  function positionPanel(btn, panel) {
    panel.hidden = false;
    const r = btn.getBoundingClientRect();
    const pw = panel.offsetWidth || 210;
    let left = Math.min(r.right - pw, window.innerWidth - pw - 8);
    if (left < 8) left = 8;
    panel.style.top = (r.bottom + 8) + 'px';
    panel.style.left = left + 'px';
  }

  // Update count + multi-select button summaries + Clear visibility without re-rendering (keeps popovers open)
  function updateFilterChrome() {
    const c = currentTableLeads(), f = currentFilter();
    const cnt = document.querySelector('.fbar-count');
    if (cnt) cnt.textContent = `${c.filtered.length} of ${c.total} lead${c.total === 1 ? '' : 's'}`;
    document.querySelectorAll('.ms-btn[data-field]').forEach(btn => {
      const arr = f[btn.dataset.field] || [], sum = btn.querySelector('.ms-sum');
      if (sum) sum.textContent = arr.length === 0 ? 'All' : (arr.length === 1 ? arr[0] : arr.length + ' selected');
      btn.classList.toggle('ms-on', arr.length > 0);
    });
    const active = f.tiers.length || f.owner || (f.stages && f.stages.length) || (f.dispositions && f.dispositions.length) || (f.lists && f.lists.length) || f.sortKey !== 'score' || f.sortDir !== 'desc' || f.search;
    const clr = document.querySelector('.fbar-clear');
    if (clr) clr.style.display = active ? '' : 'none';
  }

  // Re-render only the table body (keeps the column-chooser popover open while toggling)
  function refreshLeadsBody() {
    const body = $('#leads-body'); if (!body) return;
    const c = currentTableLeads();
    body.innerHTML = RWG.leadtable.table(c.filtered, c.f, { showOwner: c.adminLeads, columns: currentCols(), selectable: c.adminLeads, selected: state.selected, empty: 'Try a different filter, or hit Clear.' });
  }

  // Lightweight update of bulk-selection UI (avoids a full re-render so the agent dropdown keeps its value)
  function updateBulkUI() {
    const n = state.selected.size, bar = $('#bulkbar');
    if ((n > 0 && !bar) || (n === 0 && bar)) { renderMain(); return; }   // insert/remove the bulk bar
    if (bar) { const c = bar.querySelector('.bulk-count'); if (c) c.textContent = n + ' selected'; }
    const sa = document.querySelector('input[data-selall]');
    if (sa) {
      const ids = currentTableLeads().filtered.map(l => l.id);
      const onCount = ids.filter(id => state.selected.has(id)).length;
      sa.checked = ids.length > 0 && onCount === ids.length;
      sa.indeterminate = onCount > 0 && onCount < ids.length;
    }
  }
  const clearSelection = () => { if (state.selected.size) state.selected.clear(); };
  const $ = (s, r) => (r || document).querySelector(s);
  const root = () => document.getElementById('root');

  // ────────────────────────── boot / routing
  function boot() {
    D.init();
    render();
  }

  function render() {
    const user = RWG.auth.currentUser();
    closeDrawer();
    if (!user) { root().innerHTML = RWG.views.login(); document.body.classList.remove('in-app'); return; }
    if (!state.view) state.view = (user.role === 'admin') ? 'dashboard' : 'board';
    renderShell(user);
  }

  function renderShell(user) {
    const nav = NAV[user.role] || NAV.agent;
    const navHtml = nav.map(n => {
      const badge = n.badge ? n.badge() : 0;
      return `<button class="nav-item ${state.view === n.view ? 'active' : ''}" data-action="nav" data-view="${n.view}">
        ${ICONS[n.icon] || ''}<span>${n.label}</span>${badge ? `<span class="badge">${badge}</span>` : ''}</button>`;
    }).join('');

    root().innerHTML = `
      <div id="app" class="show">
        <aside class="sidebar" id="sidebar">
          <div class="side-brand"><img src="assets/img/logo.png" alt="RWG"><div class="t">Resilient Wealth<small>Wealth, Conducted with Purpose</small></div></div>
          <div class="nav-label">${user.role === 'admin' ? 'Owner' : 'Agent'}</div>
          ${navHtml}
          <div class="spacer"></div>
          <button class="nav-item" data-action="logout">${ICONS.logout}<span>Sign out</span></button>
          <div class="side-foot">RWG CRM · Prototype</div>
        </aside>
        <header class="topbar">
          <button class="icon-btn menu-toggle" data-action="toggle-menu">☰</button>
          <div><div class="page-title" id="page-title"></div><div class="page-sub" id="page-sub"></div></div>
          <div class="topbar-spacer"></div>
          <div class="topbar-search">${ICONS.search}<input id="global-search" type="search" placeholder="Search leads…" value="${U.esc(state.search)}"></div>
          <button class="btn btn-gold btn-sm" data-action="add-lead" style="white-space:nowrap">＋ New Lead</button>
          <div class="user-chip">${U.avatar(user, 32)}<div class="meta"><div class="nm">${U.esc(user.name)}</div><div class="rl">${user.role === 'admin' ? 'Owner' : 'Agent'}</div></div></div>
        </header>
        <main class="main"><div id="main-content"></div></main>
      </div>
      <div id="drawer-mount"></div>
      <div id="modal-mount"></div>`;
    document.body.classList.add('in-app');
    renderMain();
  }

  function setMeta() {
    const m = META[state.view] || { t: '', s: '' };
    if ($('#page-title')) { $('#page-title').textContent = m.t; $('#page-sub').textContent = m.s; }
  }

  function renderMain() {
    const user = RWG.auth.currentUser();
    if (!user) return render();
    setMeta();
    const ctx = { search: state.search, isAdmin: user.role === 'admin', filter: currentFilter(), columns: currentCols(), selected: state.selected };
    const html = (user.role === 'admin')
      ? RWG.views.admin.render(state.view, user, ctx)
      : RWG.views.agent.render(state.view, user, ctx);
    const c = $('#main-content');
    if (c) { c.innerHTML = html; c.scrollTop = 0; }
    // re-wire dynamic bits for the upload view
    if (state.view === 'upload') wireUpload();
  }

  function setActiveNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach(b =>
      b.classList.toggle('active', b.dataset.view === state.view));
  }

  function nav(view) {
    state.view = view;
    clearSelection();
    setActiveNav();
    renderMain();
    const sb = $('#sidebar'); if (sb) sb.classList.remove('open');
  }

  // clickable table-header sorting: same col toggles direction, new col uses its default
  function sortByHeader(key, defDir) {
    const f = currentFilter();
    if (f.sortKey === key) f.sortDir = (f.sortDir === 'asc') ? 'desc' : 'asc';
    else { f.sortKey = key; f.sortDir = defDir || 'desc'; }
    renderMain();
  }

  // ────────────────────────── drawer
  function openLead(id, editing) {
    state.leadId = id;
    state.editing = !!editing;
    const user = RWG.auth.currentUser();
    $('#drawer-mount').innerHTML = RWG.views.drawer(id, { isAdmin: user.role === 'admin', editing: state.editing });
  }
  function closeDrawer() {
    const m = $('#drawer-mount'); if (m) m.innerHTML = '';
    state.leadId = null; state.editing = false;
  }
  function refreshDrawer() { if (state.leadId) openLead(state.leadId, state.editing); }

  // ────────────────────────── modal (Add lead)
  function openModal(html) { const m = $('#modal-mount'); if (m) m.innerHTML = html; }
  function closeModal() { const m = $('#modal-mount'); if (m) m.innerHTML = ''; }

  function buildAddLeadModal() {
    const u = RWG.auth.currentUser();
    const sel = (id, opts, val) => `<select id="${id}">${opts.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    const fg = (label, inner) => `<div class="field-group"><label class="lbl">${label}</label>${inner}</div>`;
    const assignRow = u.role === 'admin'
      ? fg('Assign to', `<select id="nl-assign"><option value="">— Unassigned (pool) —</option>${D.agents().map(a => `<option value="${a.id}">${U.esc(a.name)}</option>`).join('')}</select>`)
      : `<p class="muted" style="font-size:13px;margin:2px 0 10px">This lead will be added to <b>your</b> leads.</p>`;
    return `
    <div class="scrim" data-action="close-modal"></div>
    <div class="modal-card" role="dialog" aria-label="Add lead">
      <div class="modal-head"><h2>Add a lead</h2><p>For a prospect from a call, email or referral — not a seminar list.</p></div>
      <div class="modal-body">
        <div class="field-row">${fg('First name', `<input id="nl-firstName" type="text">`)}${fg('Last name', `<input id="nl-lastName" type="text">`)}</div>
        <div class="field-row">${fg('Phone', `<input id="nl-phone" type="tel">`)}${fg('Email', `<input id="nl-email" type="email">`)}</div>
        <div class="field-row">${fg('Source', sel('nl-source', ['Inbound Call', 'Email', 'Referral', 'Walk-in', 'Other']))}${fg('Attended seminar', sel('nl-attended', D.ATTENDED_OPTS, 'No'))}</div>
        <div class="field-row">${fg('Age', `<input id="nl-age" type="number">`)}${fg('Years of Service', `<input id="nl-yos" type="number">`)}</div>
        <div class="field-row">${fg('Plan Type', sel('nl-planType', D.PLAN_TYPES, "Don't Know"))}${fg('Member Class', sel('nl-memberClass', D.MEMBER_CLASSES, 'Regular'))}</div>
        <div class="field-row">${fg('AFC / Salary', `<input id="nl-afc" type="number">`)}${fg('Employer', `<input id="nl-employer" type="text">`)}</div>
        ${assignRow}
        ${fg('Notes', `<textarea id="nl-notes" placeholder="Context — where this lead came from, etc."></textarea>`)}
        <p class="gate-error" id="nl-err"></p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-quiet" data-action="close-modal">Cancel</button>
        <button class="btn btn-gold" data-action="save-new-lead">Add lead</button>
      </div>
    </div>`;
  }

  function saveNewLead() {
    const v = (id) => { const el = $('#' + id); return el ? el.value.trim() : ''; };
    const first = v('nl-firstName'), last = v('nl-lastName'), phone = v('nl-phone'), email = v('nl-email');
    if (!first && !last) { $('#nl-err').textContent = 'Please enter at least a first or last name.'; return; }
    if (!phone && !email) { $('#nl-err').textContent = 'Add a phone or email so the lead is contactable.'; return; }
    const u = RWG.auth.currentUser();
    const fields = {
      firstName: first, lastName: last, phone, email,
      source: v('nl-source'), attended: v('nl-attended'),
      age: v('nl-age'), yos: v('nl-yos'), afc: v('nl-afc'),
      planType: v('nl-planType'), memberClass: v('nl-memberClass'),
      employer: v('nl-employer'), notes: v('nl-notes'),
      assignedTo: (u.role === 'admin') ? (v('nl-assign') || null) : u.id
    };
    const lead = D.addLead(fields, u.id);
    closeModal();
    renderMain();
    openLead(lead.id);
    U.toast('Lead added', true);
  }

  function saveLeadEdits(id) {
    const updates = {};
    D.EDITABLE_FIELDS.forEach(f => { const el = $('#edit-' + f.key); if (el) updates[f.key] = el.value; });
    const res = D.updateLeadFields(id, updates, RWG.auth.currentUser().id);
    openLead(id, false);
    renderMain();
    if (res.changes.length) U.toast(`Saved — ${res.changes.length} field${res.changes.length > 1 ? 's' : ''} updated`, true);
    else U.toast('No changes to save');
  }

  // ────────────────────────── actions: lead workflow
  function saveActivity(id) {
    const typeBtn = $('#act-type .active');
    const type = typeBtn ? typeBtn.dataset.type : 'Call';
    const dispo = $('#act-dispo') ? $('#act-dispo').value : '';
    let reached = $('#act-reached') ? $('#act-reached').checked : false;
    if (dispo === 'Reached (pitched)') reached = true;
    const note = $('#act-note') ? $('#act-note').value.trim() : '';
    D.addActivity(id, { type, disposition: dispo, note, reached, by: RWG.auth.currentUser().id });
    U.toast('Activity logged', true);
    refreshDrawer(); renderMain();
  }
  function confirmAppt(id) {
    const v = $('#appt-dt') ? $('#appt-dt').value : '';
    if (!v) { U.toast('Pick a date & time first'); return; }
    const ts = new Date(v).getTime();
    const me = RWG.auth.currentUser().id;
    D.setStage(id, 'Appointment Set', { apptDate: ts }, me);
    D.addActivity(id, { type: 'Other', disposition: 'Appointment Set', note: 'Appointment scheduled for ' + U.fmtDateTime(ts), reached: false, by: me });
    U.toast('Appointment set 🎉', true);
    refreshDrawer(); renderMain();
  }
  function graduate(id, stage) {
    const extra = (stage === 'No Opportunity' || stage === 'Opportunity Opened') ? { outcome: stage } : {};
    D.setStage(id, stage, extra, RWG.auth.currentUser().id);
    U.toast(stage === 'Opportunity Opened' ? 'Opportunity opened ✦ handed off' : stage, true);
    refreshDrawer(); renderMain();
  }
  // Drag a card to another pipeline column
  function moveStage(id, stage) {
    const lead = D.lead(id);
    if (!lead || !stage || lead.stage === stage) { renderMain(); return; }
    D.setStage(id, stage, {}, RWG.auth.currentUser().id);
    renderMain();
    if (stage === 'Appointment Set' && !D.lead(id).apptDate) {
      openLead(id);
      const r = $('#appt-row'); if (r) r.hidden = false;
      U.toast('Moved to Appointment Set — add the date & time', true);
    } else {
      if (state.leadId === id) refreshDrawer();
      U.toast('Moved to ' + stage, true);
    }
  }

  // ────────────────────────── auth forms
  function doLogin(form) {
    const r = RWG.auth.login($('#login-email').value, $('#login-pass').value);
    if (!r.ok) { $('#login-error').textContent = r.error; return; }
    state.view = null; render();
  }
  function doSignup(form) {
    const r = RWG.auth.signup({ name: $('#su-name').value, email: $('#su-email').value, password: $('#su-pass').value });
    if (!r.ok) { $('#su-error').textContent = r.error; return; }
    $('#su-error').textContent = '';
    form.querySelectorAll('input').forEach(i => i.value = '');
    $('#su-success').hidden = false;
  }
  function gateTab(tab) {
    document.querySelectorAll('.gate-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('[data-panel]').forEach(p => p.hidden = (p.dataset.panel !== tab));
  }

  // ────────────────────────── upload pipeline
  function wireUpload() {
    const input = $('#file-input'), dz = $('#dropzone');
    if (input) input.addEventListener('change', e => { if (e.target.files[0]) readFile(e.target.files[0]); });
    if (dz) {
      ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
      dz.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) readFile(f); });
    }
  }
  function readFile(file) {
    state.importName = file.name.replace(/\.csv$/i, '');
    const r = new FileReader();
    r.onload = () => { const rows = mapRows(parseCSV(r.result)); state.importRows = rows; renderPreview(rows); };
    r.readAsText(file);
  }
  function parseCSV(text) {
    const rows = []; let row = [], cur = '', q = false;
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else {
        if (ch === '"') q = true;
        else if (ch === ',') { row.push(cur); cur = ''; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else cur += ch;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows.shift().map(h => h.trim());
    return rows.filter(r => r.some(c => c.trim() !== '')).map(r => {
      const o = {}; headers.forEach((h, i) => o[h] = (r[i] || '').trim()); return o;
    });
  }
  function mapRows(records) {
    // priority order matters (afc before age to avoid "average" collision)
    const FIELDS = [
      ['email', /e-?mail/i], ['phone', /phone|mobile|cell/i],
      ['afc', /afc|salary|compensation/i], ['age', /\bage\b|dob|birth/i],
      ['yos', /yos|years/i], ['planType', /plan/i], ['memberClass', /member|class|risk/i],
      ['employer', /employer|agency|department/i], ['attended', /attend/i],
      ['disposition', /disposition|status/i], ['attempts', /attempt/i],
      ['firstName', /first/i], ['lastName', /last|surname/i], ['notes', /note|comment/i]
    ];
    return records.map(rec => {
      const out = {}; const used = {};
      Object.keys(rec).forEach(h => {
        for (const [field, rx] of FIELDS) {
          if (used[field]) continue;
          if (rx.test(h)) { out[field] = rec[h]; used[field] = 1; break; }
        }
      });
      if (!out.firstName && !out.lastName) {
        const nameKey = Object.keys(rec).find(h => /name/i.test(h));
        if (nameKey) { const p = rec[nameKey].split(' '); out.firstName = p.shift() || ''; out.lastName = p.join(' '); }
      }
      ['age', 'yos', 'attempts'].forEach(k => { if (out[k] != null) out[k] = parseFloat(String(out[k]).replace(/[^\d.]/g, '')) || null; });
      if (out.afc != null) out.afc = parseFloat(String(out.afc).replace(/[^\d.]/g, '')) || null;
      return out;
    });
  }
  function renderPreview(rows) {
    const el = $('#upload-preview'); if (!el) return;
    if (!rows.length) { el.innerHTML = `<div class="card"><p class="muted mb-0">Couldn't read any rows from that file. Make sure it's a CSV with a header row.</p></div>`; return; }
    const tierCount = { GOLD: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const scored = rows.map(r => { const s = RWG.scoring.scoreLead(r); tierCount[s.tier]++; return { r, s }; });
    const body = scored.slice(0, 40).map(({ r, s }) => `<tr>
      <td><div class="cell-name">${U.esc((r.firstName || '') + ' ' + (r.lastName || ''))}</div><div class="cell-sub">${U.esc(r.employer || '')}</div></td>
      <td>${U.tierChip(s)}</td><td>${U.scoreBar(s)}</td>
      <td>${U.esc(RWG.scoring.normPlan(r.planType))}</td><td class="num">${r.yos ?? '—'}/${r.age ?? '—'}</td><td>${U.moneyK(r.afc)}</td></tr>`).join('');
    el.innerHTML = `
      <div class="card">
        <div class="card-head"><h3>Preview · ${rows.length} leads</h3>
          <div class="tag-row" style="margin-left:auto">
            <span class="chip tier-gold">★ ${tierCount.GOLD}</span><span class="chip tier-high">${tierCount.HIGH}</span>
            <span class="chip tier-medium">${tierCount.MEDIUM}</span><span class="chip tier-low">${tierCount.LOW}</span></div></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Lead</th><th>Tier</th><th>Score</th><th>Plan</th><th>YOS/Age</th><th>AFC</th></tr></thead><tbody>${body}</tbody></table></div>
        ${rows.length > 40 ? `<p class="muted center mt-8" style="font-size:12.5px">…and ${rows.length - 40} more</p>` : ''}
        <div class="mt-16" style="display:flex;justify-content:flex-end;gap:10px">
          <button class="btn btn-quiet btn-sm" data-action="cancel-import">Cancel</button>
          <button class="btn btn-gold" data-action="confirm-import">Import ${rows.length} leads</button>
        </div>
      </div>`;
  }
  function confirmImport() {
    const target = $('#assign-target') ? $('#assign-target').value : '';
    D.addLeads(state.importRows, state.importName || 'Imported list', target || null);
    U.toast(`Imported ${state.importRows.length} leads${target ? ' to ' + D.user(target).name.split(' ')[0] : ''}`, true);
    state.importRows = null; state.tierFilter = 'ALL';
    nav('leads');
  }
  function loadSampleList() {
    const samples = [
      { firstName: 'Nina', lastName: 'Alvarez', email: 'nalvarez@email.com', phone: '(305) 555-0301', age: 60, yos: 29, planType: 'Investment Plan', afc: 108000, employer: 'Miami-Dade County', attended: 'Yes' },
      { firstName: 'Oscar', lastName: 'Diaz', email: 'odiaz@email.com', phone: '(407) 555-0302', age: 57, yos: 27, planType: 'Pension Plan', memberClass: 'Special Risk', afc: 99000, employer: 'Orlando Fire Dept', attended: 'Yes' },
      { firstName: 'Rita', lastName: 'Sims', email: 'rsims@email.com', phone: '(813) 555-0303', age: 41, yos: 11, planType: "Don't Know", afc: 63000, employer: 'Tampa Schools', attended: 'No' },
      { firstName: 'Leo', lastName: 'Park', email: 'lpark@email.com', phone: '(561) 555-0304', age: 34, yos: 7, planType: 'Pension Plan', afc: 51000, employer: 'Boca Raton', attended: 'Unknown' },
      { firstName: 'Gina', lastName: 'Ross', email: 'gross@email.com', phone: '(904) 555-0305', age: 62, yos: 31, planType: 'DROP', afc: 117000, employer: 'Jacksonville Port', attended: 'Yes' }
    ];
    D.addLeads(samples, 'Sample FRS list', null);
    U.toast('Added 5 sample leads', true);
    renderMain();
  }
  function downloadCSV(filename, csv) {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });   // BOM = Excel reads UTF-8 cleanly
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  function downloadTemplate() {
    const headers = ['Attended', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Age', 'YOS', 'Plan Type', 'Member Class', 'AFC/Salary', 'Employer Name', 'Disposition', 'Number of Attempts', 'Notes'];
    downloadCSV('RWG_lead_list_template.csv', headers.join(','));
  }
  // Export the current view (filters + sort, in display order) to CSV
  function exportLeads() {
    if (!RWG.auth.isAdmin()) return;   // owner-only
    const { filtered } = currentTableLeads();
    if (!filtered.length) { U.toast('No leads to export in this view'); return; }
    const stamp = new Date().toISOString().slice(0, 10);
    const scope = isAdminLeads() ? 'all' : 'my';
    downloadCSV(`RWG_leads_${scope}_${filtered.length}_${stamp}.csv`, RWG.leadtable.toCSV(filtered));
    U.toast(`Exported ${filtered.length} lead${filtered.length > 1 ? 's' : ''} to CSV`, true);
  }

  // ────────────────────────── settings
  function saveScoring() {
    const n = id => parseFloat($('#' + id).value);
    const cfg = {
      drop: { regular: { yos: n('cfg-reg-yos'), age: n('cfg-reg-age') }, specialRisk: { yos: n('cfg-sr-yos'), age: n('cfg-sr-age') } },
      inServiceAge: n('cfg-inservice'), investmentHighYos: n('cfg-invhi'),
      afc: { high: n('cfg-afc-hi'), mid: n('cfg-afc-mid'), low: RWG.scoring.defaultConfig.afc.low },
      tierCutoffs: { gold: n('cfg-cut-gold'), high: n('cfg-cut-high'), medium: n('cfg-cut-med') }
    };
    D.setScoringConfig(cfg);
    U.toast('Scoring rules saved — leads re-scored', true);
    renderMain();
  }

  // ────────────────────────── event wiring
  function handleAction(a, el, e) {
    switch (a) {
      case 'gate-tab': gateTab(el.dataset.tab); break;
      case 'demo-login': RWG.auth.loginAs(el.dataset.id); state.view = null; render(); break;
      case 'logout': RWG.auth.logout(); state.view = null; render(); break;
      case 'nav': nav(el.dataset.view); break;
      case 'toggle-menu': { const sb = $('#sidebar'); if (sb) sb.classList.toggle('open'); break; }
      case 'open-lead': openLead(el.dataset.id); break;
      case 'close-drawer': closeDrawer(); break;
      case 'edit-lead': openLead(el.dataset.id, true); break;
      case 'cancel-edit': openLead(state.leadId, false); break;
      case 'save-lead': saveLeadEdits(el.dataset.id); break;
      case 'add-lead': openModal(buildAddLeadModal()); break;
      case 'close-modal': closeModal(); break;
      case 'save-new-lead': saveNewLead(); break;
      case 'save-activity': saveActivity(el.dataset.id); break;
      case 'toggle-appt': { const r = $('#appt-row'); if (r) r.hidden = !r.hidden; break; }
      case 'confirm-appt': confirmAppt(el.dataset.id); break;
      case 'graduate': graduate(el.dataset.id, el.dataset.stage); break;
      case 'flt-tier': {
        const t = el.dataset.tier, arr = currentFilter().tiers, i = arr.indexOf(t);
        if (i >= 0) arr.splice(i, 1); else arr.push(t);
        clearSelection(); renderMain(); break;
      }
      case 'flt-clear': {
        if (isAdminLeads()) state.adminFilter = newFilter(); else state.agentFilter = newFilter();
        state.search = ''; const s = $('#global-search'); if (s) s.value = ''; clearSelection(); renderMain(); break;
      }
      case 'popmenu': {
        const p = el.parentElement.querySelector('.pop-panel'); if (!p) break;
        const willOpen = p.hidden;
        document.querySelectorAll('.pop-panel:not([hidden])').forEach(x => x.hidden = true);
        if (willOpen) positionPanel(el, p);
        break;
      }
      case 'cols-reset': {
        const def = RWG.leadtable.defaultVisible(isAdminLeads());
        if (isAdminLeads()) state.adminCols = def; else state.agentCols = def;
        saveCols(currentColsKey(), def);
        document.querySelectorAll('input[data-col]').forEach(cb => { cb.checked = cb.dataset.col === 'name' || def.includes(cb.dataset.col); });
        refreshLeadsBody();   // keep the chooser open
        break;
      }
      case 'ms-clear': {
        const field = el.dataset.field;
        currentFilter()[field] = [];
        document.querySelectorAll(`input[data-msfilter="${field}"]`).forEach(cb => cb.checked = false);
        clearSelection(); refreshLeadsBody(); updateFilterChrome(); updateBulkUI();
        break;
      }
      case 'bulk-assign': {
        const sel = $('#bulk-agent'), v = sel ? sel.value : '';
        if (!v) { U.toast('Pick an agent to reassign to'); break; }
        const ids = Array.from(state.selected), me = RWG.auth.currentUser().id;
        ids.forEach(id => D.assignLead(id, v === 'unassigned' ? null : v, me));
        const who = v === 'unassigned' ? 'the unassigned pool' : D.user(v).name.split(' ')[0];
        U.toast(`Reassigned ${ids.length} lead${ids.length > 1 ? 's' : ''} → ${who}`, true);
        state.selected.clear(); renderMain(); break;
      }
      case 'bulk-clear': state.selected.clear(); renderMain(); break;
      case 'export-leads': exportLeads(); break;
      case 'approve-user': D.approveUser(el.dataset.id); U.toast('Agent approved', true); renderShell(RWG.auth.currentUser()); break;
      case 'deny-user': D.denyUser(el.dataset.id); U.toast('Request removed'); renderShell(RWG.auth.currentUser()); break;
      case 'load-sample-list': loadSampleList(); break;
      case 'download-template': downloadTemplate(); break;
      case 'confirm-import': confirmImport(); break;
      case 'cancel-import': state.importRows = null; $('#upload-preview').innerHTML = ''; break;
      case 'save-scoring': saveScoring(); break;
      case 'reset-scoring': D.setScoringConfig({}); U.toast('Scoring reset to defaults'); renderMain(); break;
      case 'reset-demo': if (confirm('Reset all demo data back to the original sample set?')) { D.reset(); state.view = null; render(); } break;
    }
  }

  function bind() {
    document.addEventListener('click', e => {
      // close any open popover (column chooser / multi-select filter) when clicking outside it
      if (!e.target.closest('.pop-wrap')) {
        document.querySelectorAll('.pop-panel:not([hidden])').forEach(p => p.hidden = true);
      }
      // selection checkboxes must not open the lead drawer
      if (e.target.closest('.sel-cell') || e.target.closest('.sel-th')) return;
      const typeBtn = e.target.closest('#act-type button');
      if (typeBtn) { typeBtn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active')); typeBtn.classList.add('active'); return; }
      const th = e.target.closest('th[data-sort]');
      if (th) { sortByHeader(th.dataset.sort, th.dataset.dir); return; }
      const el = e.target.closest('[data-action]');
      if (el) { handleAction(el.dataset.action, el, e); }
    });
    document.addEventListener('submit', e => {
      const f = e.target.closest('form[data-action]');
      if (!f) return;
      e.preventDefault();
      if (f.dataset.action === 'do-login') doLogin(f);
      else if (f.dataset.action === 'do-signup') doSignup(f);
    });
    document.addEventListener('input', e => {
      if (e.target.id === 'global-search') {
        state.search = e.target.value;
        clearSelection();
        const user = RWG.auth.currentUser();
        const want = user.role === 'admin' ? 'leads' : 'mylist';
        if (state.view !== want) { state.view = want; setActiveNav(); setMeta(); }
        renderMain();
        const s = $('#global-search'); if (s) { s.focus(); }
      }
    });
    document.addEventListener('change', e => {
      if (e.target.classList.contains('assign-select')) {
        D.assignLead(e.target.dataset.id, e.target.value || null, RWG.auth.currentUser().id);
        U.toast('Lead reassigned', true); refreshDrawer(); renderMain();
        return;
      }
      if (e.target.matches('select[data-filter]')) {
        const k = e.target.dataset.filter, f = currentFilter();
        if (k === 'sortpreset') {
          const [sk, sd] = e.target.value.split(':');
          f.sortKey = sk; f.sortDir = sd;
        } else {
          f[k] = e.target.value; clearSelection();   // changing the visible set drops the selection
        }
        renderMain();
        return;
      }
      if (e.target.matches('input[data-col]')) {
        const key = e.target.dataset.col, arr = currentCols(), i = arr.indexOf(key);
        if (e.target.checked) { if (i < 0) arr.push(key); } else if (i >= 0) arr.splice(i, 1);
        saveCols(currentColsKey(), arr);
        refreshLeadsBody();   // update table only — keeps the chooser open
        return;
      }
      if (e.target.matches('input[data-msfilter]')) {
        const field = e.target.dataset.msfilter, val = e.target.dataset.val, arr = currentFilter()[field], i = arr.indexOf(val);
        if (e.target.checked) { if (i < 0) arr.push(val); } else if (i >= 0) arr.splice(i, 1);
        clearSelection();
        refreshLeadsBody(); updateFilterChrome(); updateBulkUI();   // keeps the checklist open
        return;
      }
      if (e.target.matches('input[data-sel]')) {
        const id = e.target.dataset.sel;
        if (e.target.checked) state.selected.add(id); else state.selected.delete(id);
        const tr = e.target.closest('tr'); if (tr) tr.classList.toggle('row-sel', e.target.checked);
        updateBulkUI();
        return;
      }
      if (e.target.matches('input[data-selall]')) {
        const ids = currentTableLeads().filtered.map(l => l.id);
        if (e.target.checked) ids.forEach(id => state.selected.add(id)); else ids.forEach(id => state.selected.delete(id));
        document.querySelectorAll('#leads-body input[data-sel]').forEach(cb => {
          const on = state.selected.has(cb.dataset.sel); cb.checked = on;
          const tr = cb.closest('tr'); if (tr) tr.classList.toggle('row-sel', on);
        });
        updateBulkUI();
        return;
      }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeModal(); document.querySelectorAll('.pop-panel:not([hidden])').forEach(p => p.hidden = true); } });
    // a fixed popover can't follow a scroll, so close it instead
    window.addEventListener('scroll', () => document.querySelectorAll('.pop-panel:not([hidden])').forEach(p => p.hidden = true), true);

    // ── drag & drop: move lead cards between pipeline columns (My Board) ──
    document.addEventListener('dragstart', e => {
      const card = e.target.closest('.lead-card.draggable');
      if (!card) return;
      state.dragId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', state.dragId); } catch (_) {}
    });
    document.addEventListener('dragend', () => {
      document.querySelectorAll('.lead-card.dragging').forEach(c => c.classList.remove('dragging'));
      document.querySelectorAll('.board-col.drop-target').forEach(c => c.classList.remove('drop-target'));
      state.dragId = null;
    });
    const elFrom = (e) => { const t = e.target; return (t && t.nodeType === 1) ? t : (t && t.parentElement); };
    document.addEventListener('dragover', e => {
      if (!state.dragId) return;
      e.preventDefault();                          // accept the drop anywhere while dragging a card
      try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
      const t = elFrom(e);
      const col = t && t.closest('.board-col');
      document.querySelectorAll('.board-col.drop-target').forEach(c => { if (c !== col) c.classList.remove('drop-target'); });
      if (col) col.classList.add('drop-target');
    });
    document.addEventListener('drop', e => {
      if (!state.dragId) return;
      e.preventDefault();
      const t = elFrom(e);
      const col = t && t.closest('.board-col');
      const id = state.dragId; state.dragId = null;
      document.querySelectorAll('.board-col.drop-target').forEach(c => c.classList.remove('drop-target'));
      if (col) moveStage(id, col.dataset.stage); else renderMain();
    });
  }

  return { boot, bind, state };
})();

document.addEventListener('DOMContentLoaded', () => { RWG.app.bind(); RWG.app.boot(); });
