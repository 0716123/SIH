import { auth } from '../services/auth.js';
import { showToast } from '../components/Toast.js';
import { mockUsers } from '../services/mockData.js';

export function renderLoginView() {
  const container = document.createElement('div');
  container.style.cssText = `
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    background: radial-gradient(circle at top, rgba(2, 132, 199, 0.15), transparent 60%), var(--bg-app);
  `;

  container.innerHTML = `
    <div style="max-width: 480px; width: 100%;">
      <!-- Brand Header -->
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="display: inline-flex; width: 3.5rem; height: 3.5rem; border-radius: var(--radius-lg); background: linear-gradient(135deg, #0284c7, #0369a1); align-items: center; justify-content: center; color: #fff; box-shadow: 0 8px 24px var(--primary-glow); margin-bottom: 1rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
            <path d="M12 5v14"></path>
            <path d="M5 12h14"></path>
          </svg>
        </div>
        <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em;">SIP Case Tracking</h1>
        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
          Digital Case History & Patient Tracking System
        </p>
      </div>

      <!-- Main Login Card -->
      <div class="card glass-panel" style="padding: 2rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);">
        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Address</label>
            <input type="email" id="login-email" class="form-input" placeholder="e.g. admin@sip.org" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required />
          </div>

          <div style="margin: 1.25rem 0;">
            <button type="submit" class="btn btn-primary" id="login-submit-btn" style="width: 100%; padding: 0.875rem;">
              Secure Hospital Sign In
            </button>
          </div>
        </form>

        <!-- Quick 1-Click Role Fill Buttons -->
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.75rem; text-align: center;">
            Demo Quick-Fill Accounts
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
            <button type="button" class="btn btn-sm btn-secondary quick-user-btn" data-email="admin@sip.org" data-pass="Admin@12345">
              🛡️ Admin
            </button>
            <button type="button" class="btn btn-sm btn-secondary quick-user-btn" data-email="dr.rajesh@sip.org" data-pass="Doctor@12345">
              🩺 Dr. Rajesh
            </button>
            <button type="button" class="btn btn-sm btn-secondary quick-user-btn" data-email="dr.priya@sip.org" data-pass="Doctor@12345">
              🫁 Dr. Priya
            </button>
            <button type="button" class="btn btn-sm btn-secondary quick-user-btn" data-email="staff@sip.org" data-pass="Staff@12345">
              📋 Staff Desk
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Handlers
  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#login-email');
  const passInput = container.querySelector('#login-password');
  const submitBtn = container.querySelector('#login-submit-btn');

  container.querySelectorAll('.quick-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      emailInput.value = btn.dataset.email;
      passInput.value = btn.dataset.pass;
      emailInput.focus();
      showToast('Demo credentials filled. Press Secure Hospital Sign In to continue.', 'info');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying Credentials...';

    try {
      const user = await auth.login(emailInput.value, passInput.value);
      showToast(`Welcome back, ${user.name}!`, 'success');
      window.location.hash = '#/dashboard';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Secure Hospital Sign In';
    }
  });

  return container;
}
