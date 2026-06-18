/* ============================================================
   RWG CRM — Auth layer (PROTOTYPE / mock)
   Session is kept in localStorage. In Phase 5 this is replaced by
   Firebase Authentication (Email/Password) + owner approval, with
   the same public surface (currentUser / login / signup / logout).
   NOTE: for the demo, the password is not verified — any password
   logs in an *approved* account. Real password security comes with
   Firebase. Pending (unapproved) accounts cannot sign in.
   ============================================================ */
window.RWG = window.RWG || {};
RWG.auth = (function () {
  const SK = 'rwg_crm_session';

  function setSession(id) { try { localStorage.setItem(SK, id); } catch (e) {} }
  function clearSession() { try { localStorage.removeItem(SK); } catch (e) {} }

  function currentUser() {
    let id;
    try { id = localStorage.getItem(SK); } catch (e) {}
    if (!id) return null;
    const u = RWG.data.user(id);
    return (u && u.status === 'active') ? u : null;
  }

  function login(email, password) {
    const u = RWG.data.userByEmail((email || '').trim());
    if (!u) return { ok: false, error: 'No account found for that email.' };
    if (u.status === 'pending') return { ok: false, error: 'Your account is awaiting owner approval.' };
    // (demo) password not checked — Firebase handles this in Phase 5
    setSession(u.id);
    return { ok: true, user: u };
  }

  function loginAs(id) { setSession(id); return RWG.data.user(id); }

  function signup({ name, email, password }) {
    name = (name || '').trim(); email = (email || '').trim();
    if (!name || !email) return { ok: false, error: 'Name and email are required.' };
    if (RWG.data.userByEmail(email)) return { ok: false, error: 'An account with that email already exists.' };
    const u = RWG.data.addUser({ name, email, role: 'agent', status: 'pending' });
    return { ok: true, user: u };
  }

  function logout() { clearSession(); }
  const isAdmin = () => { const u = currentUser(); return !!u && u.role === 'admin'; };

  return { currentUser, login, loginAs, signup, logout, isAdmin };
})();
