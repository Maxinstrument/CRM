/* ============================================================
   RWG CRM — Analytics (funnel, weekly activity, goal, leaderboard)
   ============================================================ */
window.RWG = window.RWG || {};
RWG.analytics = (function () {

  const STAGE_RANK = {
    'New': 0, 'Attempting': 1, 'Reached': 2, 'Appointment Set': 3,
    'Appointment Kept': 4, 'No Opportunity': 4, 'Opportunity Opened': 5
  };

  const APPT_GOAL_MIN = 10, APPT_GOAL_MAX = 15;

  function weekRange() {
    const now = new Date();
    const diffToMon = (now.getDay() + 6) % 7;     // days since Monday
    const start = new Date(now);
    start.setDate(now.getDate() - diffToMon);
    start.setHours(0, 0, 0, 0);
    return { start: start.getTime(), end: Date.now() };
  }

  function allActivities(leads) {
    const out = [];
    leads.forEach(l => (l.activities || []).forEach(a => out.push(Object.assign({ leadId: l.id, lead: l }, a))));
    return out;
  }
  const inRange = (a, r) => a.at >= r.start && a.at <= r.end;

  // Volume metrics over a time range (default: this week)
  function activityStats(leads, range, agentId) {
    const r = range || weekRange();
    let acts = allActivities(leads).filter(a => inRange(a, r));
    if (agentId) acts = acts.filter(a => a.by === agentId);
    const dials = acts.filter(a => a.type === 'Call' || a.type === 'Voicemail').length;
    const reaches = acts.filter(a => a.reached).length;
    const apptSet = acts.filter(a => a.disposition === 'Appointment Set').length;
    return { dials, reaches, apptSet, texts: acts.filter(a => a.type === 'Text').length, emails: acts.filter(a => a.type === 'Email').length, total: acts.length };
  }

  // Cumulative pipeline funnel for a set of leads
  function funnel(leads) {
    const rank = (l) => STAGE_RANK[l.stage] ?? 0;
    const n = leads.length;
    const atLeast = (k) => leads.filter(l => rank(l) >= k).length;
    return [
      { label: 'Assigned leads', count: n, color: '#5C6B7E' },
      { label: 'Contacted', count: atLeast(1), color: '#7C6A9C' },
      { label: 'Reached (pitched)', count: atLeast(2), color: '#B0691F' },
      { label: 'Appointment Set', count: atLeast(3), color: '#2E7D5B' },
      { label: 'Appointment Kept', count: atLeast(4), color: '#0E2440' },
      { label: 'Opportunity Opened', count: leads.filter(l => l.stage === 'Opportunity Opened').length, color: '#C2A14D' }
    ];
  }

  // Per-agent rollup for the leaderboard (this week volume + pipeline)
  function agentRollup(range) {
    const r = range || weekRange();
    return RWG.data.agents().map(a => {
      const leads = RWG.data.leadsFor(a.id);
      const av = activityStats(leads, r, a.id);
      const rank = (l) => STAGE_RANK[l.stage] ?? 0;
      const apptKept = leads.filter(l => rank(l) >= 4).length;
      const apptSetTotal = leads.filter(l => rank(l) >= 3).length;
      const untouched = leads.filter(l => (l.attempts || 0) === 0 && l.stage === 'New').length;
      return {
        agent: a, leadCount: leads.length, untouched,
        dials: av.dials, reaches: av.reaches, apptSetWeek: av.apptSet,
        apptSetTotal, apptKept,
        reachRate: av.dials ? Math.round((av.reaches / av.dials) * 100) : 0
      };
    });
  }

  // Goal: appointments SET this week vs the 10–15 target
  function goal(range) {
    const r = range || weekRange();
    const set = activityStats(RWG.data.leads(), r).apptSet;
    return { set, min: APPT_GOAL_MIN, max: APPT_GOAL_MAX, pct: Math.round((set / APPT_GOAL_MAX) * 100) };
  }

  function tierMix(leads) {
    const m = { GOLD: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    leads.forEach(l => { m[l._score.tier]++; });
    return m;
  }

  return { weekRange, activityStats, funnel, agentRollup, goal, tierMix, STAGE_RANK, APPT_GOAL_MIN, APPT_GOAL_MAX };
})();
