import { t, getLocale, setLocale } from '../services/i18n.js';
import { auth } from '../services/auth.js';
import { api } from '../services/api.js';
import { mockUsers } from '../services/mockData.js';
import { showToast } from './Toast.js';

export function renderNavbar(currentPath = 'dashboard') {
  const user = auth.getUser();
  const locale = getLocale();
  const isOnline = api.isBackendOnline;

  const topbar = document.createElement('header');
  topbar.className = 'topbar';

  topbar.innerHTML = `
    <div class="topbar-left">
      <div class="page-breadcrumb">
        <span>SIP Health</span>
        <span>/</span>
        <span class="page-breadcrumb-current" style="text-transform: capitalize;">${currentPath.replace('-', ' ')}</span>
      </div>
    </div>

    <div class="topbar-right">
      <!-- Backend Health Pill -->
      <div class="status-pill" id="backend-health-pill" title="Click to test live backend connection" style="cursor: pointer;">
        <span class="pulse-dot ${isOnline ? 'online' : 'offline'}"></span>
        <span style="font-size: 0.75rem; font-weight: 600;">
          ${isOnline ? '🟢 Live API (8000)' : '🟠 Demo Mode'}
        </span>
      </div>

      <!-- Language Selector -->
      <div style="display: flex; gap: 4px; background: var(--bg-surface-elevated); padding: 4px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <button class="btn btn-sm ${locale === 'en' ? 'btn-primary' : 'btn-outline'}" id="lang-en" style="padding: 2px 8px; font-size: 0.7rem;">EN</button>
        <button class="btn btn-sm ${locale === 'gu' ? 'btn-primary' : 'btn-outline'}" id="lang-gu" style="padding: 2px 8px; font-size: 0.7rem;">ગુજરાતી</button>
      </div>

      <!-- Quick Role Switcher -->
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Role:</label>
        <select class="form-select" id="role-quick-switcher" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; width: auto; border-radius: var(--radius-full);">
          ${mockUsers.map(u => `
            <option value="${u.id}" ${user?.id === u.id ? 'selected' : ''}>
              ${u.role === 'admin' ? '🛡️' : u.role === 'doctor' ? '🩺' : '📋'} ${u.name.split(' ')[1] || u.name} (${u.role})
            </option>
          `).join('')}
        </select>
      </div>

      <!-- Theme Switcher -->
      <button class="btn btn-icon-sm btn-outline" id="theme-toggle-btn" title="Toggle Light/Dark Theme">
        🌓
      </button>

      <!-- Logout -->
      <button class="btn btn-sm btn-outline" id="nav-logout-btn" title="Sign out" style="color: var(--severity-critical); border-color: rgba(239, 68, 68, 0.3);">
        🚪
      </button>
    </div>
  `;

  // Attach Event Listeners
  topbar.querySelector('#backend-health-pill').addEventListener('click', async () => {
    showToast('Testing connection to http://127.0.0.1:8000/api...', 'info', 2000);
    const online = await api.checkBackendHealth();
    if (online) {
      showToast('Successfully connected to Laravel Backend!', 'success');
    } else {
      showToast('Laravel server offline. Operating in interactive Demo Mode.', 'info');
    }
  });

  topbar.querySelector('#lang-en').addEventListener('click', () => {
    setLocale('en');
  });

  topbar.querySelector('#lang-gu').addEventListener('click', () => {
    setLocale('gu');
  });

  topbar.querySelector('#role-quick-switcher').addEventListener('change', (e) => {
    const selectedId = parseInt(e.target.value);
    const targetUser = mockUsers.find(u => u.id === selectedId);
    if (targetUser) {
      auth.switchUser(targetUser);
      showToast(`Switched view to ${targetUser.name} (${targetUser.role.toUpperCase()})`, 'info');
    }
  });

  topbar.querySelector('#theme-toggle-btn').addEventListener('click', () => {
    const isDark = document.body.classList.contains('theme-dark');
    if (isDark) {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    }
  });

  topbar.querySelector('#nav-logout-btn').addEventListener('click', () => {
    auth.logout();
    showToast('Signed out successfully.', 'info');
  });

  return topbar;
}
