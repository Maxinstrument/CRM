/* ============================================================
   RWG CRM — Data layer (PROTOTYPE / mock)
   Seeds realistic FRS sample data and persists to localStorage so
   your changes survive a refresh. This is the ONLY file that knows
   where data lives — in Phase 5 we swap the internals for Firebase
   and the rest of the app keeps working unchanged.
   ============================================================ */
window.RWG = window.RWG || {};
RWG.data = (function () {
  const LS_KEY = 'rwg_crm_data_v3';

  const STAGES = [
    'New', 'Attempting', 'Reached', 'Appointment Set',
    'Appointment Kept', 'Opportunity Opened', 'No Opportunity'
  ];
  // Stages shown as Kanban columns in the agent board (graduated stages collapse into the last column)
  const BOARD_STAGES = ['New', 'Attempting', 'Reached', 'Appointment Set', 'Appointment Kept'];

  const DISPOSITIONS = [
    'Left Voicemail', 'No Answer', 'Bad Number', 'Not Interested',
    'Call Back', 'Reached (pitched)', 'Appointment Set', 'Unable to Reach'
  ];
  const ACTIVITY_TYPES = ['Call', 'Text', 'Email', 'Voicemail', 'Other'];
  const PLAN_TYPES = ['Pension Plan', 'Investment Plan', 'DROP', "Don't Know"];
  const ATTENDED_OPTS = ['Yes', 'No', 'Unknown'];
  const MEMBER_CLASSES = ['Regular', 'Special Risk'];

  // The ONLY fields an agent may hand-edit (Attempts / Stage / Score are system-owned and excluded)
  const EDITABLE_FIELDS = [
    { key: 'phone', label: 'Phone Number', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'attended', label: 'Attended seminar', type: 'select', options: ATTENDED_OPTS },
    { key: 'age', label: 'Age', type: 'number' },
    { key: 'yos', label: 'Years of Service', type: 'number' },
    { key: 'planType', label: 'Plan Type', type: 'select', options: PLAN_TYPES },
    { key: 'memberClass', label: 'Member Class', type: 'select', options: MEMBER_CLASSES },
    { key: 'afc', label: 'AFC / Salary', type: 'number' },
    { key: 'employer', label: 'Employer', type: 'text' }
  ];

  const stageClass = {
    'New': 'stage-new', 'Attempting': 'stage-attempting', 'Reached': 'stage-reached',
    'Appointment Set': 'stage-appt-set', 'Appointment Kept': 'stage-appt-kept',
    'Opportunity Opened': 'stage-opportunity', 'No Opportunity': 'stage-no-opp'
  };
  const stageDotColor = {
    'New': '#5C6B7E', 'Attempting': '#B0691F', 'Reached': '#2E7D5B',
    'Appointment Set': '#C2A14D', 'Appointment Kept': '#0E2440'
  };

  // ── date helpers (build a believable "this week" of activity) ──
  const DAY = 86400000;
  const now = () => Date.now();
  const daysAgo = (d, h = 10) => {
    const t = new Date();
    t.setDate(t.getDate() - d);
    t.setHours(h, Math.floor(Math.random() * 50), 0, 0);
    return t.getTime();
  };
  const daysAhead = (d, h = 14) => {
    const t = new Date();
    t.setDate(t.getDate() + d);
    t.setHours(h, 0, 0, 0);
    return t.getTime();
  };

  let _id = 100;
  const uid = (p) => p + '_' + (++_id);

  function seed() {
    const users = [
      { id: 'u_admin', name: 'Carlos Temperan', email: 'temperan.carlos@gmail.com', role: 'admin',   color: '#0E2440', status: 'active', createdAt: daysAgo(60) },
      { id: 'u_maria', name: 'Maria Santos',    email: 'maria@resilientwg.com',     role: 'agent',   color: '#2E7D5B', status: 'active', createdAt: daysAgo(40) },
      { id: 'u_james', name: 'James Carter',    email: 'james@resilientwg.com',     role: 'agent',   color: '#B0691F', status: 'active', createdAt: daysAgo(35) },
      { id: 'u_priya', name: 'Priya Patel',     email: 'priya@resilientwg.com',     role: 'agent',   color: '#7A4FB5', status: 'active', createdAt: daysAgo(20) },
      { id: 'u_david', name: 'David Nguyen',    email: 'david@resilientwg.com',     role: 'agent',   color: '#B23A48', status: 'pending', createdAt: daysAgo(1) }
    ];

    // helper to build a lead (note: id default must come first so a passed-in id could override)
    const L = (o) => Object.assign({
      id: uid('l'),
      attended: 'Yes', memberClass: 'Regular', attempts: 0, notes: '',
      stage: 'New', disposition: '', apptDate: null, outcome: null,
      activities: [], assignedTo: null, listName: 'FRS Seminar — Jun 2026',
      createdAt: daysAgo(7)
    }, o);

    const leads = [
      // ── GOLD: DROP-eligible, not in DROP ──
      L({ firstName: 'Robert', lastName: 'Hilliard', email: 'rhilliard@email.com', phone: '(305) 555-0142', age: 61, yos: 31, planType: 'Pension Plan', memberClass: 'Regular', afc: 118000, employer: 'Miami-Dade County Public Schools',
          stage: 'Reached', disposition: 'Reached (pitched)', attempts: 3, assignedTo: 'u_maria', attended: 'Yes',
          activities: [
            { id: uid('a'), type: 'Call', disposition: 'No Answer', note: '', by: 'u_maria', at: daysAgo(4, 9), reached: false },
            { id: uid('a'), type: 'Call', disposition: 'Left Voicemail', note: 'Left VM referencing the FRS seminar.', by: 'u_maria', at: daysAgo(2, 11), reached: false },
            { id: uid('a'), type: 'Call', disposition: 'Reached (pitched)', note: 'Great convo — 31 YOS, eligible for DROP. Very interested in PEN Max. Sending times.', by: 'u_maria', at: daysAgo(1, 14), reached: true }
          ] }),
      L({ firstName: 'Sandra', lastName: 'Whitfield', email: 'swhitfield@email.com', phone: '(407) 555-0188', age: 63, yos: 28, planType: 'Investment Plan', afc: 96000, employer: 'City of Orlando',
          stage: 'Appointment Set', disposition: 'Appointment Set', attempts: 2, assignedTo: 'u_maria', apptDate: daysAhead(2),
          activities: [
            { id: uid('a'), type: 'Call', disposition: 'Reached (pitched)', note: 'Age 63, Investment Plan ~$540k. In-service rollover candidate.', by: 'u_maria', at: daysAgo(3, 10), reached: true },
            { id: uid('a'), type: 'Email', disposition: 'Appointment Set', note: 'Booked for Thursday 2pm.', by: 'u_maria', at: daysAgo(1, 16), reached: false }
          ] }),
      L({ firstName: 'Daniel', lastName: 'Okafor', email: 'dokafor@email.com', phone: '(813) 555-0119', age: 56, yos: 26, planType: 'Pension Plan', memberClass: 'Special Risk', afc: 104000, employer: "Broward Sheriff's Office",
          stage: 'Attempting', disposition: 'Call Back', attempts: 1, assignedTo: 'u_james',
          activities: [{ id: uid('a'), type: 'Call', disposition: 'Call Back', note: 'Special risk, 26 YOS — DROP eligible. Asked to call back Friday.', by: 'u_james', at: daysAgo(1, 13), reached: false }] }),
      L({ firstName: 'Patricia', lastName: 'Lindgren', email: 'plindgren@email.com', phone: '(352) 555-0167', age: 64, yos: 33, planType: 'Investment Plan', afc: 88000, employer: 'University of Florida',
          stage: 'New', assignedTo: 'u_priya' }),

      // ── In DROP ──
      L({ firstName: 'Marcus', lastName: 'Bell', email: 'mbell@email.com', phone: '(904) 555-0133', age: 60, yos: 32, planType: 'DROP', afc: 112000, employer: 'Florida Dept. of Transportation',
          stage: 'Appointment Set', disposition: 'Appointment Set', attempts: 2, assignedTo: 'u_james', apptDate: daysAhead(1),
          activities: [
            { id: uid('a'), type: 'Call', disposition: 'Reached (pitched)', note: 'In DROP, 3 yrs left. Lump sum planning. Wants to meet.', by: 'u_james', at: daysAgo(2, 15), reached: true },
            { id: uid('a'), type: 'Text', disposition: 'Appointment Set', note: 'Confirmed tomorrow 2pm.', by: 'u_james', at: daysAgo(0, 9), reached: false }
          ] }),
      L({ firstName: 'Yolanda', lastName: 'Reyes', email: 'yreyes@email.com', phone: '(786) 555-0150', age: 62, yos: 30, planType: 'DROP', afc: 99000, employer: 'Miami-Dade Transit',
          stage: 'Attempting', disposition: 'Left Voicemail', attempts: 2, assignedTo: 'u_priya',
          activities: [
            { id: uid('a'), type: 'Call', disposition: 'No Answer', note: '', by: 'u_priya', at: daysAgo(3, 10), reached: false },
            { id: uid('a'), type: 'Call', disposition: 'Left Voicemail', note: '', by: 'u_priya', at: daysAgo(1, 12), reached: false }
          ] }),

      // ── Age 59.5+ in-service ──
      L({ firstName: 'Gregory', lastName: 'Salas', email: 'gsalas@email.com', phone: '(561) 555-0177', age: 60, yos: 18, planType: 'Investment Plan', afc: 84000, employer: 'Palm Beach County',
          stage: 'New', assignedTo: 'u_maria' }),
      L({ firstName: 'Denise', lastName: 'Holloway', email: 'dholloway@email.com', phone: '(727) 555-0102', age: 59.5, yos: 22, planType: "Don't Know", afc: 102000, employer: 'Pinellas County Schools',
          stage: 'New', assignedTo: null }),

      // ── HIGH: strong income / tenure ──
      L({ firstName: 'Anthony', lastName: 'Russo', email: 'arusso@email.com', phone: '(305) 555-0190', age: 54, yos: 24, planType: 'Investment Plan', afc: 121000, employer: 'City of Miami',
          stage: 'Attempting', disposition: 'No Answer', attempts: 1, assignedTo: 'u_james',
          activities: [{ id: uid('a'), type: 'Call', disposition: 'No Answer', note: '', by: 'u_james', at: daysAgo(2, 11), reached: false }] }),
      L({ firstName: 'Karen', lastName: 'Underwood', email: 'kunderwood@email.com', phone: '(850) 555-0144', age: 52, yos: 21, planType: "Don't Know", afc: 98000, employer: 'Florida State University',
          stage: 'Reached', disposition: 'Reached (pitched)', attempts: 2, assignedTo: 'u_priya',
          activities: [{ id: uid('a'), type: 'Call', disposition: 'Reached (pitched)', note: 'Not sure of plan. High income, 21 YOS. Running discovery.', by: 'u_priya', at: daysAgo(1, 15), reached: true }] }),
      L({ firstName: 'Stephen', lastName: 'Najera', email: 'snajera@email.com', phone: '(407) 555-0121', age: 49, yos: 20, planType: 'Investment Plan', afc: 92000, employer: 'Orange County',
          stage: 'New', assignedTo: 'u_maria' }),

      // ── MEDIUM ──
      L({ firstName: 'Linda', lastName: 'Pham', email: 'lpham@email.com', phone: '(813) 555-0166', age: 47, yos: 14, planType: 'Investment Plan', afc: 71000, employer: 'Hillsborough County',
          stage: 'Attempting', disposition: 'Call Back', attempts: 2, assignedTo: 'u_james',
          activities: [{ id: uid('a'), type: 'Call', disposition: 'Call Back', note: 'Busy, call back next week.', by: 'u_james', at: daysAgo(2, 9), reached: false }] }),
      L({ firstName: 'Carlos', lastName: 'Mendez', email: 'cmendez@email.com', phone: '(305) 555-0155', age: 44, yos: 16, planType: 'Pension Plan', afc: 78000, employer: 'Miami-Dade Fire Rescue', memberClass: 'Special Risk',
          stage: 'New', assignedTo: 'u_priya' }),
      L({ firstName: 'Teresa', lastName: 'Boyd', email: 'tboyd@email.com', phone: '(904) 555-0188', age: 50, yos: 12, planType: "Don't Know", afc: 66000, employer: 'Duval County Schools',
          stage: 'Attempting', disposition: 'No Answer', attempts: 3, assignedTo: 'u_maria',
          activities: [
            { id: uid('a'), type: 'Call', disposition: 'No Answer', note: '', by: 'u_maria', at: daysAgo(5, 10), reached: false },
            { id: uid('a'), type: 'Call', disposition: 'No Answer', note: '', by: 'u_maria', at: daysAgo(3, 14), reached: false },
            { id: uid('a'), type: 'Call', disposition: 'Left Voicemail', note: 'Third try, left VM.', by: 'u_maria', at: daysAgo(1, 11), reached: false }
          ] }),
      L({ firstName: 'Walter', lastName: 'Ng', email: 'wng@email.com', phone: '(727) 555-0109', age: 45, yos: 13, planType: 'Investment Plan', afc: 69000, employer: 'City of St. Petersburg',
          stage: 'New', assignedTo: null }),

      // ── LOW: early-career pension ──
      L({ firstName: 'Brittany', lastName: 'Cole', email: 'bcole@email.com', phone: '(352) 555-0123', age: 33, yos: 6, planType: 'Pension Plan', afc: 52000, employer: 'Marion County Schools',
          stage: 'Attempting', disposition: 'Bad Number', attempts: 1, assignedTo: 'u_james',
          activities: [{ id: uid('a'), type: 'Call', disposition: 'Bad Number', note: 'Number disconnected.', by: 'u_james', at: daysAgo(2, 10), reached: false }] }),
      L({ firstName: 'Kevin', lastName: 'Adeyemi', email: 'kadeyemi@email.com', phone: '(813) 555-0134', age: 29, yos: 4, planType: 'Pension Plan', afc: 47000, employer: 'Hillsborough County Schools',
          stage: 'New', assignedTo: 'u_priya' }),
      L({ firstName: 'Megan', lastName: 'Foster', email: 'mfoster@email.com', phone: '(561) 555-0145', age: 36, yos: 8, planType: 'Investment Plan', afc: 58000, employer: 'School District of Palm Beach',
          stage: 'New', assignedTo: null }),
      L({ firstName: 'Jamal', lastName: 'Wright', email: 'jwright@email.com', phone: '(904) 555-0156', age: 31, yos: 5, planType: "Don't Know", afc: 49000, employer: 'City of Jacksonville',
          stage: 'Attempting', disposition: 'Not Interested', attempts: 1, assignedTo: 'u_maria',
          activities: [{ id: uid('a'), type: 'Call', disposition: 'Not Interested', note: 'Not interested right now.', by: 'u_maria', at: daysAgo(1, 13), reached: false }] }),

      // ── Graduated examples (outcomes) ──
      L({ firstName: 'Eleanor', lastName: 'Vance', email: 'evance@email.com', phone: '(305) 555-0199', age: 62, yos: 30, planType: 'Investment Plan', afc: 115000, employer: 'Miami-Dade County',
          stage: 'Appointment Kept', disposition: 'Appointment Set', attempts: 3, assignedTo: 'u_james', apptDate: daysAgo(1, 14), outcome: null,
          activities: [
            { id: uid('a'), type: 'Call', disposition: 'Reached (pitched)', note: 'Eligible, big Investment account.', by: 'u_james', at: daysAgo(5, 10), reached: true },
            { id: uid('a'), type: 'Email', disposition: 'Appointment Set', note: 'Set for yesterday.', by: 'u_james', at: daysAgo(3, 12), reached: false },
            { id: uid('a'), type: 'Other', disposition: '', note: 'Appointment kept ✔ — moving to opportunity.', by: 'u_james', at: daysAgo(1, 15), reached: false }
          ] }),
      L({ firstName: 'Harold', lastName: 'Becker', email: 'hbecker@email.com', phone: '(407) 555-0210', age: 58, yos: 19, planType: 'Pension Plan', afc: 64000, employer: 'Seminole County',
          stage: 'No Opportunity', disposition: 'Appointment Set', attempts: 4, assignedTo: 'u_priya', apptDate: daysAgo(2, 11), outcome: 'No Opportunity',
          activities: [{ id: uid('a'), type: 'Other', disposition: '', note: 'Met — not a fit at this time. Closed.', by: 'u_priya', at: daysAgo(2, 12), reached: false }] })
    ];

    return { users, leads, scoringConfig: {} };
  }

  // ── persistence ──
  let state = null;
  function load() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { state = JSON.parse(raw); return state; }
    } catch (e) {}
    state = seed();
    save();
    return state;
  }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }
  function reset() { localStorage.removeItem(LS_KEY); state = null; return load(); }

  // ── derived: attach score to a lead object ──
  function withScore(lead) {
    const s = RWG.scoring.scoreLead(lead, load().scoringConfig);
    return Object.assign({}, lead, { _score: s });
  }
  const fullName = (l) => `${l.firstName} ${l.lastName}`.trim();

  // Append an audit entry to a lead's change history (who / when / what).
  function logChange(lead, by, changes, note) {
    if ((!changes || !changes.length) && !note) return;
    lead.history = lead.history || [];
    lead.history.push({ id: uid('h'), by: by || null, at: now(), changes: changes || [], note: note || null });
  }

  // ── public API ──
  return {
    STAGES, BOARD_STAGES, DISPOSITIONS, ACTIVITY_TYPES, PLAN_TYPES,
    ATTENDED_OPTS, MEMBER_CLASSES, EDITABLE_FIELDS,
    stageClass, stageDotColor, fullName, withScore,

    init: load,
    reset,

    users: () => load().users.slice(),
    agents: () => load().users.filter(u => u.role === 'agent' && u.status === 'active'),
    pendingUsers: () => load().users.filter(u => u.status === 'pending'),
    user: (id) => load().users.find(u => u.id === id),
    approveUser(id) { const u = this.user(id); if (u) { u.status = 'active'; save(); } },
    denyUser(id) { state.users = load().users.filter(u => u.id !== id); save(); },
    addUser(u) {
      const st = load();
      const user = Object.assign({ id: uid('u'), role: 'agent', status: 'pending', color: '#7A4FB5', createdAt: now() }, u);
      st.users.push(user); save(); return user;
    },
    userByEmail: (email) => load().users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase()),

    leads: () => load().leads.map(withScore),
    leadsRaw: () => load().leads,
    leadsFor: (agentId) => load().leads.filter(l => l.assignedTo === agentId).map(withScore),
    unassigned: () => load().leads.filter(l => !l.assignedTo).map(withScore),
    lead: (id) => { const l = load().leads.find(x => x.id === id); return l ? withScore(l) : null; },

    scoringConfig: () => Object.assign({}, RWG.scoring.defaultConfig, load().scoringConfig),
    setScoringConfig(cfg) { load().scoringConfig = cfg; save(); },

    addActivity(leadId, act) {
      const l = load().leads.find(x => x.id === leadId);
      if (!l) return;
      act.id = uid('a'); act.at = act.at || now();
      l.activities = l.activities || [];
      l.activities.push(act);
      if (act.type === 'Call' || act.type === 'Voicemail') l.attempts = (l.attempts || 0) + 1;
      if (act.disposition) l.disposition = act.disposition;
      // auto-advance stage based on disposition
      if (act.reached && (l.stage === 'New' || l.stage === 'Attempting')) l.stage = 'Reached';
      else if (l.stage === 'New' && act.type === 'Call') l.stage = 'Attempting';
      save();
      return withScore(l);
    },

    setStage(leadId, stage, extra, by) {
      const l = load().leads.find(x => x.id === leadId);
      if (!l) return;
      const old = l.stage;
      l.stage = stage;
      const changes = (old !== stage) ? [{ label: 'Stage', from: old, to: stage }] : [];
      let note = null;
      if (extra && extra.apptDate) { l.apptDate = extra.apptDate; note = 'Appointment ' + (old === 'Appointment Set' ? 'rescheduled' : 'set') + ' for ' + new Date(extra.apptDate).toLocaleString('en-US'); }
      if (extra && extra.outcome) l.outcome = extra.outcome;
      if (stage === 'Appointment Set') l.disposition = 'Appointment Set';
      logChange(l, by, changes, note);
      save();
      return withScore(l);
    },

    assignLead(leadId, agentId, by) {
      const l = load().leads.find(x => x.id === leadId);
      if (!l) return;
      const newId = agentId || null;
      if ((l.assignedTo || null) === newId) return;   // no change → nothing to log
      const nameOf = (id) => id ? ((load().users.find(u => u.id === id) || {}).name || '—') : 'Unassigned';
      const fromName = nameOf(l.assignedTo), toName = nameOf(newId);
      l.assignedTo = newId;
      logChange(l, by, [{ label: 'Owner', from: fromName, to: toName }]);
      save();
    },

    // Edit allowed fields; records a behind-the-scenes audit entry of what changed.
    updateLeadFields(leadId, updates, by) {
      const l = load().leads.find(x => x.id === leadId);
      if (!l) return { changes: [] };
      const norm = (v) => (v == null ? '' : String(v).trim());
      const changes = [];
      EDITABLE_FIELDS.forEach(f => {
        if (!(f.key in updates)) return;
        let nv = updates[f.key];
        if (f.type === 'number') { nv = (nv === '' || nv == null) ? null : Number(nv); if (Number.isNaN(nv)) nv = null; }
        else nv = (nv == null) ? '' : String(nv).trim();
        if (norm(l[f.key]) !== norm(nv)) {
          changes.push({ field: f.key, label: f.label, from: (l[f.key] === '' || l[f.key] == null) ? null : l[f.key], to: (nv === '' || nv == null) ? null : nv });
          l[f.key] = nv;
        }
      });
      if (changes.length) { logChange(l, by, changes); save(); }
      return { lead: withScore(l), changes };
    },

    addLeads(rows, listName, assignTo) {
      const st = load();
      rows.forEach(r => {
        st.leads.push(Object.assign({
          id: uid('l'), attempts: 0, notes: '', stage: 'New', disposition: '',
          apptDate: null, outcome: null, activities: [], createdAt: now(),
          listName: listName || 'Imported list', assignedTo: assignTo || null,
          attended: 'Unknown', memberClass: 'Regular'
        }, r));
      });
      save();
    },

    // Manually add a single off-list lead (referral / call / email). Logs the creation.
    addLead(fields, by) {
      const st = load();
      const lead = Object.assign({
        id: uid('l'), firstName: '', lastName: '', email: '', phone: '',
        attempts: 0, notes: '', stage: 'New', disposition: '', apptDate: null, outcome: null,
        activities: [], history: [], createdAt: now(),
        listName: 'Manual entry', source: 'Manual', attended: 'No', memberClass: 'Regular', assignedTo: null
      }, fields);
      ['age', 'yos', 'afc'].forEach(k => { lead[k] = (lead[k] === '' || lead[k] == null) ? null : Number(lead[k]); });
      st.leads.push(lead);
      logChange(lead, by, [], 'Lead added manually' + (lead.source ? ' · source: ' + lead.source : ''));
      save();
      return withScore(lead);
    }
  };
})();
