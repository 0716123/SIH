import './styles/base.css';
import './styles/components.css';
import './styles/layouts.css';
import './styles/print.css';

import { auth } from './services/auth.js';
import { api } from './services/api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderSidebar } from './components/Sidebar.js';

import { renderLoginView } from './views/LoginView.js';
import { renderDashboardView } from './views/DashboardView.js';
import { renderPatientsView } from './views/PatientsView.js';
import { renderCasesView } from './views/CasesView.js';
import { renderCaseDetailView } from './views/CaseDetailView.js';
import { renderAppointmentsView } from './views/AppointmentsView.js';
import { renderFollowUpsView } from './views/FollowUpsView.js';
import { renderDoctorsView } from './views/DoctorsView.js';
import { renderReportsView } from './views/ReportsView.js';

const app = document.getElementById('app');

async function handleRouting() {
  const hash = window.location.hash.slice(1) || '/dashboard';
  const cleanPath = hash.startsWith('/') ? hash.slice(1) : hash;
  const segments = cleanPath.split('/');
  const route = segments[0] || 'dashboard';
  const param = segments[1];

  // If not authenticated and not on login, redirect to login
  if (!auth.isAuthenticated()) {
    app.innerHTML = '';
    app.appendChild(renderLoginView());
    return;
  }

  // Build main App Shell
  app.innerHTML = '';
  const appShell = document.createElement('div');
  appShell.className = 'app-shell';

  const sidebar = renderSidebar(route);
  const navbar = renderNavbar(route);

  const mainWrapper = document.createElement('main');
  mainWrapper.className = 'main-wrapper';

  const contentContainer = document.createElement('div');
  contentContainer.className = 'content-container';

  mainWrapper.appendChild(contentContainer);
  appShell.appendChild(sidebar);
  appShell.appendChild(navbar);
  appShell.appendChild(mainWrapper);
  app.appendChild(appShell);

  // Render matching view
  try {
    let viewElement;
    if (route === 'dashboard') {
      viewElement = await renderDashboardView();
    } else if (route === 'patients') {
      viewElement = await renderPatientsView();
    } else if (route === 'cases') {
      if (param) {
        viewElement = await renderCaseDetailView(param);
      } else {
        viewElement = await renderCasesView();
      }
    } else if (route === 'appointments') {
      viewElement = await renderAppointmentsView();
    } else if (route === 'follow-ups') {
      viewElement = await renderFollowUpsView();
    } else if (route === 'doctors') {
      viewElement = await renderDoctorsView();
    } else if (route === 'reports') {
      viewElement = await renderReportsView();
    } else {
      viewElement = await renderDashboardView();
    }

    contentContainer.appendChild(viewElement);
  } catch (err) {
    contentContainer.innerHTML = `
      <div class="card" style="padding: 2rem; color: var(--severity-critical);">
        <h3>Error rendering view</h3>
        <p style="margin-top: 0.5rem; color: var(--text-secondary);">${err.message}</p>
      </div>
    `;
  }
}

// Global Lifecycle Listeners
window.addEventListener('hashchange', handleRouting);
window.addEventListener('auth-changed', handleRouting);
window.addEventListener('locale-changed', handleRouting);
window.addEventListener('backend-status', () => {
  const pill = document.getElementById('backend-health-pill');
  if (pill) {
    const isOnline = api.isBackendOnline;
    pill.querySelector('.pulse-dot').className = `pulse-dot ${isOnline ? 'online' : 'offline'}`;
    pill.querySelector('span:last-child').textContent = isOnline ? '🟢 Live API (8000)' : '🟠 Demo Mode';
  }
});

// App Startup
(async function init() {
  await api.checkBackendHealth();
  handleRouting();
})();
