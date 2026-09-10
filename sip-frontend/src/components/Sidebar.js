import { t } from '../services/i18n.js';
import { auth } from '../services/auth.js';

export function renderSidebar(activeRoute = 'dashboard') {
  const user = auth.getUser();
  const isAdmin = auth.isAdmin();
  const isDoctor = auth.isDoctor();

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: '📊', visible: true },
    { id: 'patients', label: t('navPatients'), icon: '👥', visible: true },
    { id: 'cases', label: t('navCases'), icon: '📁', visible: true },
    { id: 'appointments', label: t('navAppointments'), icon: '📅', visible: true },
    { id: 'follow-ups', label: t('navFollowUps'), icon: '🩺', visible: true },
    { id: 'doctors', label: t('navDoctors'), icon: '👨‍⚕️', visible: isAdmin || isDoctor },
    { id: 'reports', label: t('navReports'), icon: '📈', visible: isAdmin || isDoctor },
  ];

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <div class="brand-icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>
      </div>
      <div class="brand-title-group">
        <span class="brand-title">SIP Medical</span>
        <span class="brand-subtitle">Case Tracking</span>
      </div>
    </div>

    <div class="sidebar-nav">
      <div class="nav-section-title">Clinical Workspace</div>
      ${navItems.filter(i => i.visible).map(item => `
        <a href="#/${item.id}" class="nav-item ${activeRoute === item.id ? 'active' : ''}" data-route="${item.id}">
          <span style="font-size: 1.15rem;">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </div>

    <div class="sidebar-footer">
      <div class="user-snippet">
        <div class="user-avatar">
          ${user?.name?.charAt(0) || 'U'}
        </div>
        <div class="user-info">
          <div class="user-name">${user?.name || 'Guest'}</div>
          <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 2px;">
            <span class="badge badge-role-${user?.role || 'staff'}" style="font-size: 0.65rem; padding: 1px 6px;">
              ${user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;

  return sidebar;
}
