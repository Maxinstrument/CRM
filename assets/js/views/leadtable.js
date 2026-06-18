/* ============================================================
   RWG CRM — Shared leads filter + sort toolbar + table
   Used by BOTH the agent cockpit (My Leads / My Board) and the
   admin "All Leads" view. `showOwner` adds the Owner column +
   the per-agent owner filter for admins.
   ============================================================ */
window.RWG = window.RWG || {};
RWG.leadtable = (function () {
  const U = RWG.ui, D = RWG.data, A = RWG.analytics;

  const lastTouch = (l) => (l.activities && l.activities.length) ? l.activities[l.activities.length - 1].at : (l.createdAt || 0);
  const tierRank = (l) => ({ GOLD: 4, HIGH: 3, MEDIUM: 2, LOW: 1 })[l._score.tier] || 0;
  const dispoIdx = (l) => { const i = D.DISPOSITIONS.indexOf(l.disposition || ''); return i < 0 ? 999 : i; };
  const ownerName = (l) => l.assignedTo ? ((D.user(l.assignedTo) || {}).name || '') : '~~~';   // unassigned sorts last

  function defaultFilter() {
    return { tiers: [], owner: '', stages: [], dispositions: [], lists: [], sortKey: 'score', sortDir: 'desc' };
  }

  // Each column drives header, comparator (ascending), and the body cell.
  function columnDefs() {
    return {
      name:  { label: 'Lead', dir: 'asc', cmp: (a, b) => D.fullName(a).localeCompare(D.fullName(b)),
               cell: (l) => `<div class="cell-name">${U.esc(D.fullName(l))}</div><div class="cell-sub">${U.esc(l.employer || '')}</div>` },
      tier:  { label: 'Tier', dir: 'desc', cmp: (a, b) => tierRank(a) - tierRank(b), cell: (l) => U.tierChip(l._score) },
      score: { label: 'Score', dir: 'desc', cmp: (a, b) => a._score.score - b._score.score, cell: (l) => U.scoreBar(l._score) },
      owner: { label: 'Owner', dir: 'asc', cmp: (a, b) => ownerName(a).localeCompare(ownerName(b)),
               cell: (l) => { const o = D.user(l.assignedTo); return o ? `<span class="flex" style="gap:7px">${U.avatar(o, 24)}<span class="cell-sub" style="color:var(--ink)">${U.esc(o.name.split(' ')[0])}</span></span>` : '<span class="pill-soft">Unassigned</span>'; } },
      stage: { label: 'Stage', dir: 'asc', cmp: (a, b) => (A.STAGE_RANK[a.stage] || 0) - (A.STAGE_RANK[b.stage] || 0), cell: (l) => U.stageChip(l.stage) },
      disposition: { label: 'Disposition', dir: 'asc', cmp: (a, b) => dispoIdx(a) - dispoIdx(b),
               cell: (l) => l.disposition ? `<span class="pill-soft">${U.esc(l.disposition)}</span>` : '<span class="cell-sub">—</span>' },
      plan:  { label: 'Plan', dir: 'asc', cmp: (a, b) => RWG.scoring.normPlan(a.planType).localeCompare(RWG.scoring.normPlan(b.planType)), cell: (l) => U.esc(RWG.scoring.normPlan(l.planType)) },
      yos:   { label: 'YOS / Age', dir: 'desc', cmp: (a, b) => (a.yos || 0) - (b.yos || 0), tdClass: 'num', cell: (l) => `${l.yos ?? '—'} / ${l.age ?? '—'}` },
      afc:   { label: 'AFC', dir: 'desc', cmp: (a, b) => (a.afc || 0) - (b.afc || 0), cell: (l) => U.moneyK(l.afc) },
      attempts: { label: 'Att.', dir: 'asc', cmp: (a, b) => (a.attempts || 0) - (b.attempts || 0), tdClass: 'num', cell: (l) => (l.attempts || 0) },
      touch: { label: 'Last touch', dir: 'desc', cmp: (a, b) => lastTouch(a) - lastTouch(b),
               cell: (l) => `<span class="cell-sub">${l.activities && l.activities.length ? U.fmtRelative(l.activities[l.activities.length - 1].at) : '—'}</span>` }
    };
  }

  function columnOrder(showOwner) {
    const base = ['name', 'tier', 'score', 'stage', 'disposition', 'plan', 'yos', 'afc', 'attempts', 'touch'];
    if (showOwner) base.splice(3, 0, 'owner');   // Owner right after Score
    return base;
  }
  const defaultVisible = (showOwner) => columnOrder(showOwner).slice();
  const allColumns = (showOwner) => { const defs = columnDefs(); return columnOrder(showOwner).map(k => ({ key: k, label: defs[k].label })); };

  const CMP = (() => { const defs = columnDefs(), m = {}; Object.keys(defs).forEach(k => m[k] = defs[k].cmp); m.appt = (a, b) => (a.apptDate || Infinity) - (b.apptDate || Infinity); return m; })();

  function applyFilter(leads, f) {
    let out = leads.slice();
    if (f.tiers && f.tiers.length) out = out.filter(l => f.tiers.includes(l._score.tier));
    if (f.owner === 'unassigned') out = out.filter(l => !l.assignedTo);
    else if (f.owner) out = out.filter(l => l.assignedTo === f.owner);
    if (f.stages && f.stages.length) out = out.filter(l => f.stages.includes(l.stage));
    if (f.dispositions && f.dispositions.length) out = out.filter(l => f.dispositions.includes(l.disposition));
    if (f.lists && f.lists.length) out = out.filter(l => f.lists.includes(l.listName));
    if (f.search) {
      const q = f.search.toLowerCase();
      out = out.filter(l => (D.fullName(l) + ' ' + (l.employer || '') + ' ' + (l.phone || '')).toLowerCase().includes(q));
    }
    const base = CMP[f.sortKey] || CMP.score;
    out.sort((a, b) => { let r = base(a, b); if (f.sortDir === 'desc') r = -r; return r || (b._score.score - a._score.score); });
    return out;
  }

  const distinctLists = (leads) => Array.from(new Set(leads.map(l => l.listName).filter(Boolean)));

  function filterBar(allLeads, f, count, opts) {
    opts = opts || {};
    const tierBtn = (t) => {
      const m = RWG.scoring.tierMeta[t], on = f.tiers.includes(t);
      return `<button class="fbar-tier ${on ? 'on' : ''}" data-action="flt-tier" data-tier="${t}"><span class="tier-dot ${m.dot}"></span>${m.label}</button>`;
    };
    const lists = distinctLists(allLeads);
    const active = f.tiers.length || f.owner || (f.stages && f.stages.length) || (f.dispositions && f.dispositions.length) || (f.lists && f.lists.length) || f.sortKey !== 'score' || f.sortDir !== 'desc' || f.search;

    // multi-select checklist dropdown (Stage / Disposition / List)
    const msDropdown = (label, field, options, selected) => {
      const n = selected.length;
      const summary = n === 0 ? 'All' : (n === 1 ? selected[0] : n + ' selected');
      return `<div class="pop-wrap">
        <button class="fbar-select ms-btn ${n ? 'ms-on' : ''}" data-action="popmenu" data-field="${field}" type="button">${label}: <b class="ms-sum">${U.esc(summary)}</b></button>
        <div class="pop-panel" hidden>
          <div class="pop-h">${label}</div>
          ${options.map(o => `<label class="pop-row"><input type="checkbox" data-msfilter="${field}" data-val="${U.esc(o)}" ${selected.includes(o) ? 'checked' : ''}> ${U.esc(o)}</label>`).join('')}
          <div class="pop-f"><button class="btn btn-quiet btn-sm" data-action="ms-clear" data-field="${field}">Clear</button></div>
        </div>
      </div>`;
    };

    const ownerSel = opts.showOwner ? `<select class="fbar-select" data-filter="owner">
        <option value="">All owners</option><option value="unassigned" ${f.owner === 'unassigned' ? 'selected' : ''}>Unassigned</option>
        ${D.agents().map(a => `<option value="${a.id}" ${f.owner === a.id ? 'selected' : ''}>${U.esc(a.name)}</option>`).join('')}</select>` : '';
    const stageDd = opts.onBoard ? '' : msDropdown('Stage', 'stages', D.STAGES, f.stages || []);
    const dispoDd = msDropdown('Disposition', 'dispositions', D.DISPOSITIONS, f.dispositions || []);
    const listDd = lists.length ? msDropdown('List', 'lists', lists, f.lists || []) : '';

    const presets = [
      ['score:desc', 'Quality (high→low)'], ['attempts:asc', 'Fewest attempts'], ['attempts:desc', 'Most attempts'],
      ['touch:asc', 'Not touched longest'], ['touch:desc', 'Recently touched'], ['appt:asc', 'Appointment soonest'],
      ['afc:desc', 'AFC (high→low)'], ['name:asc', 'Name (A–Z)']
    ];
    const cur = `${f.sortKey}:${f.sortDir}`;
    const isPreset = presets.some(p => p[0] === cur);
    let sortOpts = presets.map(p => `<option value="${p[0]}" ${cur === p[0] ? 'selected' : ''}>${p[1]}</option>`).join('');
    if (!isPreset) {
      const defs = columnDefs(), col = defs[f.sortKey];
      sortOpts = `<option value="${cur}" selected>Sorted: ${U.esc(col ? col.label : f.sortKey)} ${f.sortDir === 'asc' ? '↑' : '↓'}</option>` + sortOpts;
    }
    const sortSel = `<label class="fbar-sortlbl">Sort</label><select class="fbar-select" data-filter="sortpreset">${sortOpts}</select>`;

    // column chooser (table views only)
    const visible = opts.columns;
    const colBtn = opts.onBoard ? '' : (() => {
      const defs = columnDefs();
      const items = columnOrder(opts.showOwner).map(k => {
        const on = !visible || visible.includes(k), locked = k === 'name';
        return `<label class="pop-row"><input type="checkbox" data-col="${k}" ${on ? 'checked' : ''} ${locked ? 'disabled' : ''}> ${defs[k].label}</label>`;
      }).join('');
      return `<div class="pop-wrap">
        <button class="btn btn-ghost btn-sm" data-action="popmenu" type="button">▦ Columns</button>
        <div class="pop-panel" hidden><div class="pop-h">Show columns</div>${items}
          <div class="pop-f"><button class="btn btn-quiet btn-sm" data-action="cols-reset">Reset all</button></div></div>
      </div>`;
    })();

    return `<div class="filterbar">
      <div class="fbar-top">
        <span class="fbar-label">Quality</span>
        <div class="fbar-tiers">${['GOLD', 'HIGH', 'MEDIUM', 'LOW'].map(tierBtn).join('')}</div>
        <span class="fbar-sep"></span>
        ${ownerSel}${stageDd}${dispoDd}${listDd}
        ${sortSel}
        <span class="fbar-spacer"></span>
        <button class="btn btn-quiet btn-sm fbar-clear" data-action="flt-clear" ${active ? '' : 'style="display:none"'}>✕ Clear</button>
      </div>
      <div class="fbar-bottom">
        <span class="fbar-count">${count} of ${allLeads.length} lead${allLeads.length === 1 ? '' : 's'}</span>
        <span class="fbar-spacer"></span>
        ${colBtn}
        ${opts.canExport ? `<button class="btn btn-ghost btn-sm" data-action="export-leads" title="Export this view to CSV (opens in Excel)">⬇ Export</button>` : ''}
      </div>
    </div>`;
  }

  function table(leads, f, opts) {
    opts = opts || {};
    const vis = opts.columns;
    const defs = columnDefs();
    const order = columnOrder(opts.showOwner).filter(k => k === 'name' || !vis || vis.includes(k));
    const sel = !!opts.selectable;
    const selected = opts.selected || new Set();
    const allOn = sel && leads.length && leads.every(l => selected.has(l.id));
    const selTh = sel ? `<th class="sel-th"><input type="checkbox" data-selall ${allOn ? 'checked' : ''}></th>` : '';

    const head = `<thead><tr>${selTh}${order.map(key => {
      const c = defs[key], activeCol = key === f.sortKey;
      const arr = activeCol ? (f.sortDir === 'asc' ? ' <span class="arrow">▲</span>' : ' <span class="arrow">▼</span>') : '';
      return `<th data-sort="${key}" data-dir="${c.dir}" class="${activeCol ? 'sorted' : ''}">${c.label}${arr}</th>`;
    }).join('')}</tr></thead>`;

    if (!leads.length) return `<div class="table-wrap"><table class="data">${head}</table></div>
      <div class="empty"><div class="ec">🔍</div><h3>No leads match</h3><p>${U.esc(opts.empty || '')}</p></div>`;

    const rows = leads.map(l => {
      const isSel = sel && selected.has(l.id);
      const selTd = sel ? `<td class="sel-cell"><input type="checkbox" data-sel="${l.id}" ${isSel ? 'checked' : ''}></td>` : '';
      return `<tr class="${isSel ? 'row-sel' : ''}" data-action="open-lead" data-id="${l.id}">${selTd}${order.map(key => {
        const c = defs[key];
        return `<td class="${c.tdClass || ''}">${c.cell(l)}</td>`;
      }).join('')}</tr>`;
    }).join('');
    return `<div class="table-wrap"><table class="data">${head}<tbody>${rows}</tbody></table></div>`;
  }

  // ── CSV export (rich, action-ready columns — independent of which table columns are shown) ──
  const EXPORT_COLS = [
    ['First Name', l => l.firstName], ['Last Name', l => l.lastName],
    ['Email', l => l.email], ['Phone', l => l.phone],
    ['Tier', l => l._score.tier], ['Score', l => l._score.score],
    ['Stage', l => l.stage], ['Disposition', l => l.disposition],
    ['Owner', l => { const o = D.user(l.assignedTo); return o ? o.name : 'Unassigned'; }],
    ['Plan Type', l => l.planType], ['Member Class', l => l.memberClass],
    ['Age', l => l.age], ['Years of Service', l => l.yos], ['AFC/Salary', l => l.afc],
    ['Employer', l => l.employer], ['Attended', l => l.attended], ['Attempts', l => l.attempts || 0],
    ['Last Activity', l => { const a = (l.activities || [])[(l.activities || []).length - 1]; return a ? new Date(a.at).toLocaleString('en-US') : ''; }],
    ['Appointment', l => l.apptDate ? new Date(l.apptDate).toLocaleString('en-US') : ''],
    ['Lead List', l => l.listName], ['Top Reason', l => l._score.headline]
  ];
  function csvCell(v) {
    if (v == null) v = '';
    v = String(v);
    return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function toCSV(leads) {
    const header = EXPORT_COLS.map(c => csvCell(c[0])).join(',');
    const rows = leads.map(l => EXPORT_COLS.map(c => csvCell(c[1](l))).join(','));
    return [header].concat(rows).join('\r\n');
  }

  return { defaultFilter, applyFilter, filterBar, table, defaultVisible, allColumns, toCSV };
})();
