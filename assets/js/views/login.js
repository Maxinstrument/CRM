/* ============================================================
   RWG CRM — Login / request-access gate
   ============================================================ */
window.RWG = window.RWG || {};
RWG.views = RWG.views || {};
RWG.views.login = function () {
  const U = RWG.ui;
  return `
  <div id="gate">
    <div class="gate-card">
      <img class="gate-logo" src="assets/img/logo.png" alt="Resilient Wealth Group">
      <p class="gate-brand">Resilient Wealth Group</p>
      <p class="gate-motto">Wealth, Conducted with Purpose</p>

      <div class="gate-tabs">
        <button class="gate-tab active" data-action="gate-tab" data-tab="signin">Sign in</button>
        <button class="gate-tab" data-action="gate-tab" data-tab="signup">Request access</button>
      </div>

      <!-- Sign in -->
      <form data-action="do-login" data-panel="signin">
        <p class="gate-title">Welcome back</p>
        <p class="gate-sub">Sign in to your CRM workspace</p>
        <div class="field-group"><input type="email" id="login-email" placeholder="Email address" autocomplete="username"></div>
        <div class="field-group"><input type="password" id="login-pass" placeholder="Password" autocomplete="current-password"></div>
        <button class="btn btn-gold btn-block" type="submit">Sign in</button>
        <p class="gate-error" id="login-error"></p>
      </form>

      <!-- Request access -->
      <form data-action="do-signup" data-panel="signup" hidden>
        <p class="gate-title">Request an account</p>
        <p class="gate-sub">Your manager approves new agents before access is granted.</p>
        <div class="field-group"><input type="text" id="su-name" placeholder="Full name"></div>
        <div class="field-group"><input type="email" id="su-email" placeholder="Email address"></div>
        <div class="field-group"><input type="password" id="su-pass" placeholder="Create a password"></div>
        <button class="btn btn-navy btn-block" type="submit">Request access</button>
        <p class="gate-error" id="su-error"></p>
        <div id="su-success" hidden class="gate-success">✓ Request sent! You'll be able to sign in once the owner approves your account.</div>
      </form>

      <div class="demo-pills">
        <div class="lbl">Demo quick-login</div>
        <div class="row">
          <button class="demo-pill" data-action="demo-login" data-id="u_admin">Owner / Admin<small>Carlos (full access)</small></button>
          <button class="demo-pill" data-action="demo-login" data-id="u_maria">Agent<small>Maria Santos</small></button>
        </div>
      </div>
      <p class="gate-note">Prototype preview · sample data only. Real Firebase login &amp; password security are wired up in Phase 5.</p>
    </div>
  </div>`;
};
