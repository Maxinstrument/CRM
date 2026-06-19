/* ============================================================
   RWG CRM — Admin command center views
   dashboard / leads / agents / upload / settings
   ============================================================ */
window.RWG = window.RWG || {};
RWG.views = RWG.views || {};
RWG.views.admin = (function () {
  const U = RWG.ui, D = RWG.data, A = RWG.analytics;

  const statCard = (label, val, ic, delta) => `<div class="stat">
    <div class="ic-wrap">${ic}</div><div class="label">${label}</div>
    <div class="value num">${val}</div>${delta ? `<div class="delta up">${delta}</div>` : ''}</div>`;

  function funnelBlock(title, sub, leads) {
    const f = A.funnel(leads), max = f[0].count || 1;
    const rows = f.map(r => {
      const pct = Math.round((r.count / max) * 100);
      return `<div class="funnel-row"><div class="fl">${r.label}</div>
        <div class="ftrack"><div class="ffill" style="width:${Math.max(pct, 5)}%;background:${r.color}">${r.count}</div></div>
        <div class="fv num">${pct}%</div></div>`;
    }).join('');
    return `<div class="card"><div class="card-head"><h3>${title}</h3><span class="sub">${sub}</span></div><div class="funnel">${rows}</div></div>`;
  }

  function tierMixBlock(leads) {
    const mix = A.tierMix(leads), total = leads.length || 1;
    const rows = ['GOLD', 'HIGH', 'MEDIUM', 'LOW'].map(k => {
      const m = RWG.scoring.tierMeta[k];
      return `<div class="funnel-row"><div class="fl"><span class="tier-dot ${m.dot}"></span>${m.label}</div>
        <div class="ftrack"><div class="ffill" style="width:${Math.max((mix[k] / total) * 100, 4)}%;background:${U.tierFill[k]}">${mix[k]}</div></div>
        <div class="fv num">${mix[k]}</div></div>`;
    }).join('');
    return `<div class="card"><div class="card-head"><h3>Lead quality mix</h3><span class="sub">${leads.length} total</span></div><div class="funnel">${rows}</div></div>`;
  }

  function dashboard(user) {
    const allLeads = D.leads();
    const g = A.goal();
    const w = A.activityStats(allLeads);
    const apptKept = allLeads.filter(l => A.STAGE_RANK[l.stage] >= 4).length;
    const pending = D.pendingUsers();
    const board = A.agentRollup();

    const goalCard = `<div class="card goal-card">
      ${U.ring(g.pct, g.set, 'appts set')}
      <div>
        <div class="eyebrow"><span class="dot"></span><span>Weekly goal</span></div>
        <h2 style="font-size:24px;margin-bottom:4px">${g.set} of ${g.min}–${g.max} appointments</h2>
        <p class="muted mb-8" style="font-size:13.5px">New appointments scheduled this week by the team.</p>
        <div class="tag-row">
          ${g.set >= g.min ? '<span class="chip tier-high">On target ✓</span>' : `<span class="chip tier-medium">${g.min - g.set} to reach goal</span>`}
          <span class="pill-soft">${w.reaches} reaches</span>
          <span class="pill-soft">${w.dials} dials</span>
        </div>
      </div></div>`;

    const lb = `<div class="card"><div class="card-head"><h3>Agent leaderboard</h3><span class="sub">this week</span></div>
      <div class="lb-row head"><div></div><div>Agent</div><div class="mn">Dials</div><div class="mn">Reaches</div><div class="mn">Appts set</div><div class="mn">Untouched</div></div>
      ${board.sort((a, b) => b.apptSetWeek - a.apptSetWeek || b.reaches - a.reaches).map((r, i) => `
        <div class="lb-row">
          <div class="rank">${i + 1}</div>
          <div class="who">${U.avatar(r.agent, 30)} ${U.esc(r.agent.name)}</div>
          <div class="mn num">${r.dials}</div>
          <div class="mn num">${r.reaches}</div>
          <div class="mn num"><b>${r.apptSetWeek}</b></div>
          <div class="mn num" style="color:${r.untouched ? 'var(--warn)' : 'var(--muted)'}">${r.untouched}</div>
        </div>`).join('')}</div>`;

    const pendingBanner = pending.length ? `<div class="card mb-16" style="border-color:var(--gold);background:rgba(194,161,77,.07)">
        <div class="row-between"><div class="flex">⏳ <b>${pending.length} agent account${pending.length > 1 ? 's' : ''} awaiting your approval</b></div>
        <button class="btn btn-gold btn-sm" data-action="nav" data-view="agents">Review</button></div></div>` : '';

    return `
      <p class="muted" style="margin:-6px 0 18px;font-size:14px">Welcome back, <b style="color:var(--navy)">${U.esc(user.name.split(' ')[0])}</b>. Here's where the team stands this week.</p>
      ${pendingBanner}
      <div class="grid grid-4 mb-16">
        ${statCard('Dials this week', w.dials, '📞')}
        ${statCard('Reaches', w.reaches, '🎯')}
        ${statCard('Appts set', w.apptSet, '📅')}
        ${statCard('Appts kept', apptKept, '🤝')}
      </div>
      <div class="grid grid-2 mb-16">${goalCard}${tierMixBlock(allLeads)}</div>
      <div class="grid grid-2 mb-16">${funnelBlock('Team funnel', 'all leads', allLeads)}${lb}</div>`;
  }

  function bulkBar(count) {
    return `<div class="bulkbar" id="bulkbar">
      <span class="bulk-count">${count} selected</span>
      <span class="fbar-sep"></span>
      <label class="fbar-sortlbl">Reassign to</label>
      <select id="bulk-agent" class="fbar-select">
        <option value="">Choose agent…</option>
        <option value="unassigned">Unassigned (pool)</option>
        ${D.agents().map(a => `<option value="${a.id}">${U.esc(a.name)}</option>`).join('')}
      </select>
      <button class="btn btn-gold btn-sm" data-action="bulk-assign">Apply</button>
      <span class="fbar-spacer"></span>
      <button class="btn btn-danger btn-sm bulk-del" data-action="bulk-delete">🗑 Delete</button>
      <button class="btn btn-quiet btn-sm" data-action="bulk-clear">Clear selection</button>
    </div>`;
  }

  function leadsTable(ctx) {
    const LT = RWG.leadtable;
    const f = Object.assign(LT.defaultFilter(), (ctx && ctx.filter) || {}, { search: (ctx && ctx.search) || '' });
    const cols = ctx && ctx.columns;
    const selected = (ctx && ctx.selected) || new Set();
    const all = D.leads();
    const filtered = LT.applyFilter(all, f);
    return LT.filterBar(all, f, filtered.length, { showOwner: true, columns: cols, canExport: true })
      + (selected.size ? bulkBar(selected.size) : '')
      + `<div id="leads-body">${LT.table(filtered, f, { showOwner: true, columns: cols, selectable: true, selected: selected, allLeads: all, empty: 'Try a different filter, or Clear all.' })}</div>`;
  }

  function agents() {
    const pending = D.pendingUsers();
    const board = A.agentRollup();

    const pendingCard = pending.length ? `<div class="card mb-16">
      <div class="card-head"><h3>Pending approvals</h3><span class="pill-soft">${pending.length}</span></div>
      ${pending.map(u => `<div class="row-between" style="padding:10px 0;border-bottom:1px solid var(--line)">
        <div class="flex">${U.avatar(u, 36)}<div><div style="font-weight:600">${U.esc(u.name)}</div><div class="cell-sub">${U.esc(u.email)} · requested ${U.fmtRelative(u.createdAt)}</div></div></div>
        <div class="flex"><button class="btn btn-gold btn-sm" data-action="approve-user" data-id="${u.id}">Approve</button>
          <button class="btn btn-danger btn-sm" data-action="deny-user" data-id="${u.id}">Deny</button></div>
      </div>`).join('')}</div>` : '';

    // Team & roles — promote teammates to admin / demote back to agent
    const meId = (RWG.auth.currentUser() || {}).id;
    const activeUsers = D.users().filter(u => u.status === 'active')
      .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : (a.role === 'admin' ? -1 : 1)));
    const rosterCard = `<div class="card mb-16">
      <div class="card-head"><h3>Team &amp; roles</h3><span class="sub">promote a teammate to admin (full access + can delete leads)</span>
        <span class="topbar-spacer"></span><button class="btn btn-gold btn-sm" data-action="invite">✉ Invite teammate</button></div>
      ${activeUsers.map(u => {
        const isMe = u.id === meId;
        const roleChip = u.role === 'admin' ? '<span class="chip tier-gold">Admin</span>' : '<span class="chip tier-low">Agent</span>';
        const editBtn = `<button class="btn btn-quiet btn-sm" data-action="edit-user" data-id="${u.id}">Edit</button>`;
        let extra = '<span class="cell-sub" style="align-self:center">You</span>';
        if (!isMe) {
          const isOwner = (u.email || '').toLowerCase() === (RWG.OWNER_EMAIL || '').toLowerCase();
          const viewBtn = u.role === 'agent' ? `<button class="btn btn-quiet btn-sm" data-action="view-as" data-id="${u.id}">👁 View as</button>` : '';
          const roleBtn = u.role === 'admin'
            ? `<button class="btn btn-ghost btn-sm" data-action="set-role" data-id="${u.id}" data-role="agent">Make agent</button>`
            : `<button class="btn btn-ghost btn-sm" data-action="set-role" data-id="${u.id}" data-role="admin">Make admin</button>`;
          const removeBtn = isOwner ? '' : `<button class="btn btn-danger btn-sm" data-action="remove-user" data-id="${u.id}">Remove</button>`;
          extra = `${viewBtn}${roleBtn}${removeBtn}`;
        }
        const action = `<div class="flex wrap-gap" style="gap:8px">${editBtn}${extra}</div>`;
        return `<div class="row-between" style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div class="flex">${U.avatar(u, 34)}<div><div style="font-weight:600">${U.esc(u.name)} ${roleChip}</div><div class="cell-sub">${U.esc(u.email)}</div></div></div>
          <div>${action}</div></div>`;
      }).join('')}
    </div>`;

    const cards = board.map(r => `<div class="card">
      <div class="row-between mb-16"><div class="flex">${U.avatar(r.agent, 42)}<div>
        <div style="font-weight:700;font-size:15px">${U.esc(r.agent.name)}</div><div class="cell-sub">${U.esc(r.agent.email)}</div></div></div>
        <span class="chip tier-high">Active</span></div>
      <div class="grid grid-4" style="gap:10px;text-align:center">
        <div><div class="value num" style="font-size:22px;font-family:Fraunces,serif;color:var(--navy)">${r.dials}</div><div class="cell-sub">Dials</div></div>
        <div><div class="value num" style="font-size:22px;font-family:Fraunces,serif;color:var(--navy)">${r.reaches}</div><div class="cell-sub">Reaches</div></div>
        <div><div class="value num" style="font-size:22px;font-family:Fraunces,serif;color:var(--navy)">${r.apptSetWeek}</div><div class="cell-sub">Appts</div></div>
        <div><div class="value num" style="font-size:22px;font-family:Fraunces,serif;color:${r.untouched ? 'var(--warn)' : 'var(--navy)'}">${r.untouched}</div><div class="cell-sub">Untouched</div></div>
      </div>
      <div class="mt-16"><span class="pill-soft">${r.leadCount} leads</span> <span class="pill-soft">${r.reachRate}% reach rate</span></div>
    </div>`).join('');

    return pendingCard + rosterCard + (cards ? `<div class="grid grid-2">${cards}</div>` : '');
  }

  function upload() {
    return `
      <div class="grid grid-2" style="align-items:start">
        <div class="card">
          <div class="card-head"><h3>Upload a lead list</h3></div>
          <p class="muted mb-16" style="font-size:13.5px">Drop your FRS seminar export (CSV). Columns are auto-matched to the CRM fields, and every lead is scored on import.</p>
          <label class="dropzone" id="dropzone" for="file-input">
            <div class="dz-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16"/></svg></div>
            <h3>Drag &amp; drop CSV here</h3>
            <p>or click to browse · .csv</p>
          </label>
          <input id="file-input" type="file" accept=".csv,text/csv" hidden>
          <div class="mt-16 flex" style="justify-content:space-between">
            <button class="btn btn-ghost btn-sm" data-action="load-sample-list">＋ Load a sample list (demo)</button>
            <a class="btn btn-quiet btn-sm" data-action="download-template">⬇ Download CSV template</a>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>How assignment works</h3></div>
          <ol class="muted" style="font-size:13.5px;line-height:1.8;padding-left:18px;margin:0">
            <li>Upload the list — leads land here, auto-scored.</li>
            <li>Pick an agent (or leave unassigned for a shared pool).</li>
            <li>Review the preview, then <b>Import</b>.</li>
            <li>Assigned leads instantly appear in that agent's board.</li>
          </ol>
          <div class="section-title">Assign imported leads to</div>
          <select id="assign-target"><option value="">— Leave unassigned —</option>
            ${D.agents().map(a => `<option value="${a.id}">${U.esc(a.name)}</option>`).join('')}</select>
          <p class="muted mt-8" style="font-size:12.5px">You can reassign any individual lead later from the lead's detail panel.</p>
        </div>
      </div>
      <div id="upload-preview" class="mt-24"></div>`;
  }

  function settings() {
    const c = D.scoringConfig();
    const f = (label, id, val, hint) => `<div class="field-group"><label class="lbl">${label}</label>
      <input type="number" step="any" id="${id}" value="${val}">${hint ? `<div class="cell-sub mt-8">${hint}</div>` : ''}</div>`;
    return `
      <div class="grid grid-2" style="align-items:start">
        <div class="card">
          <div class="card-head"><h3>Lead scoring rules</h3><span class="sub">tune what makes a lead "Gold"</span></div>
          <div class="field-row">${f('DROP — Regular: Years of Service', 'cfg-reg-yos', c.drop.regular.yos)}${f('DROP — Regular: Age', 'cfg-reg-age', c.drop.regular.age)}</div>
          <div class="field-row">${f('DROP — Special Risk: YOS', 'cfg-sr-yos', c.drop.specialRisk.yos)}${f('DROP — Special Risk: Age', 'cfg-sr-age', c.drop.specialRisk.age)}</div>
          ${f('In-service rollover age', 'cfg-inservice', c.inServiceAge, 'Age that unlocks in-service rollover → annuity.')}
          ${f('High-tenure Investment Plan (YOS)', 'cfg-invhi', c.investmentHighYos, 'YOS that implies a large Investment Plan account.')}
          <div class="field-row">${f('AFC: High ($)', 'cfg-afc-hi', c.afc.high)}${f('AFC: Mid ($)', 'cfg-afc-mid', c.afc.mid)}</div>
          <div class="section-title">Tier cutoffs (0–100 score)</div>
          <div class="field-row">${f('Gold ≥', 'cfg-cut-gold', c.tierCutoffs.gold)}${f('High ≥', 'cfg-cut-high', c.tierCutoffs.high)}</div>
          ${f('Medium ≥', 'cfg-cut-med', c.tierCutoffs.medium, 'Below this = Low.')}
          <div class="mt-8" style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" data-action="reset-scoring">Reset to defaults</button>
            <button class="btn btn-gold btn-sm" data-action="save-scoring">Save scoring rules</button>
          </div>
        </div>
        <div>
          <div class="card mb-16">
            <div class="card-head"><h3>Branding</h3></div>
            <p class="muted" style="font-size:13.5px">Matches the RWG Scorecard: Fraunces + Hanken Grotesk, navy &amp; gold, with the logo and <i>"Wealth, Conducted with Purpose."</i></p>
            <div class="flex wrap-gap mt-8">
              <span class="pill-soft" style="background:#0E2440;color:#fff">Navy #0E2440</span>
              <span class="pill-soft" style="background:#C2A14D;color:#0A1A30">Gold #C2A14D</span>
              <span class="pill-soft" style="background:#F4F1E9">Paper #F4F1E9</span>
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3>Data &amp; storage</h3></div>
            <p class="muted" style="font-size:13.5px">Live data is stored securely in your Firebase project (Firestore). Leads, activity, and the change history sync in real time across your team.</p>
          </div>
        </div>
      </div>`;
  }

  function archive() {
    return `
      <div class="card">
        <div class="card-head">
          <h3>Deleted leads — archive</h3>
          <span class="sub">Every deleted lead is preserved here for your records. Hidden from the CRM; visible to admins only.</span>
          <span class="topbar-spacer"></span>
          <button class="btn btn-quiet btn-sm" data-action="archive-refresh">↻ Refresh</button>
        </div>
        <div id="archive-body"><div class="muted" style="padding:28px;text-align:center">Loading the archive…</div></div>
      </div>`;
  }

  // Rendered by the controller after the archive is fetched (it lives outside the live cache).
  function archiveTable(rows) {
    if (!rows.length) {
      return `<div class="empty" style="padding:34px 10px"><div class="ec">🗄️</div>
        <h3>The archive is empty</h3><p>Deleted leads are preserved here automatically — nothing has been deleted yet.</p></div>`;
    }
    const head = `<thead><tr>
      <th class="th-cell"><span class="th-label">Lead</span></th>
      <th class="th-cell"><span class="th-label">Contact</span></th>
      <th class="th-cell"><span class="th-label">Last stage</span></th>
      <th class="th-cell"><span class="th-label">Owner at deletion</span></th>
      <th class="th-cell"><span class="th-label">Deleted by</span></th>
      <th class="th-cell"><span class="th-label">Deleted</span></th>
      <th class="th-cell"></th></tr></thead>`;
    const body = rows.map(r => {
      const ld = r.lead || {};
      const contact = [ld.phone, ld.email].filter(Boolean).join(' · ') || '—';
      return `<tr>
        <td><div style="font-weight:600">${U.esc(r.name || '(no name)')}</div><div class="cell-sub">${U.esc(ld.listName || '')}</div></td>
        <td class="cell-sub">${U.esc(contact)}</td>
        <td>${r.stageAtDeletion ? `<span class="pill-soft">${U.esc(r.stageAtDeletion)}</span>` : '<span class="cell-sub">—</span>'}</td>
        <td class="cell-sub">${U.esc(r.ownerAtDeletion || 'Unassigned')}</td>
        <td class="cell-sub">${U.esc(r.deletedByName || '—')}</td>
        <td class="cell-sub">${r.deletedAt ? U.fmtRelative(r.deletedAt) : '—'}</td>
        <td><div class="flex" style="gap:8px;justify-content:flex-end">
          <button class="btn btn-gold btn-sm" data-action="restore-lead" data-id="${r.id}">↩ Restore</button>
          <button class="btn btn-danger btn-sm" data-action="purge-lead" data-id="${r.id}">Erase</button>
        </div></td></tr>`;
    }).join('');
    return `<div class="row-between mb-8"><span class="cell-sub">${rows.length} archived lead${rows.length === 1 ? '' : 's'} · newest first</span></div>
      <div class="table-wrap"><table class="data">${head}<tbody>${body}</tbody></table></div>`;
  }

  function render(view, user, ctx) {
    if (view === 'leads') return leadsTable(ctx);
    if (view === 'agents') return agents();
    if (view === 'upload') return upload();
    if (view === 'archive') return archive();
    if (view === 'settings') return settings();
    return dashboard(user);
  }

  return { render, archiveTable };
})();
