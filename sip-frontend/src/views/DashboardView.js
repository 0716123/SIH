import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { t } from '../services/i18n.js';
import { showToast } from '../components/Toast.js';

export async function renderDashboardView() {
  const container = document.createElement('div');
  const user = auth.getUser();
  const isAdmin = auth.isAdmin();

  container.innerHTML = `
    <div style="text-align: center; padding: 3rem 0;">
      <div style="font-size: 1.5rem; font-weight: 600;">Loading Clinical Analytics...</div>
    </div>
  `;

  try {
    const res = await api.request('/dashboard');
    const data = res.data || {};
    const metrics = data.metrics || {};
    const casesByStatus = data.cases_by_status || { open: 0, in_progress: 0, closed: 0, referred: 0 };
    const casesBySeverity = data.cases_by_severity || { mild: 0, moderate: 0, severe: 0, critical: 0 };
    const recentCases = data.recent_cases || [];
    const todayAppointments = data.today_appointments || data.upcoming_appointments || [];

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>${isAdmin ? 'Hospital Operations & Clinical Overview' : `Dr. ${user?.name?.split(' ')[1] || user?.name}'s Caseload`}</h1>
          <p>Real-time digital case history metrics, patient intake queue, and clinical severity alerts.</p>
        </div>
        <div class="view-actions">
          <a href="#/patients" class="btn btn-secondary" id="dash-new-patient-btn">
            + ${t('newPatientBtn')}
          </a>
          <a href="#/cases" class="btn btn-primary" id="dash-new-case-btn">
            + ${t('newCaseBtn')}
          </a>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid-stats">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">${isAdmin ? t('totalPatients') : 'Assigned Cases'}</span>
            <div class="stat-icon-wrapper cyan">👥</div>
          </div>
          <div class="stat-value">${metrics.total_patients ?? metrics.total_assigned_cases ?? 0}</div>
          <div class="stat-footer">
            <span>Hospital Intake Pool</span>
            <span style="color: var(--teal-400);">Active</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">${t('activeCases')}</span>
            <div class="stat-icon-wrapper amber">📁</div>
          </div>
          <div class="stat-value">${metrics.active_cases ?? 0}</div>
          <div class="stat-footer">
            <span>Under Active Treatment</span>
            <span class="badge badge-open">Open</span>
          </div>
        </div>

        <div class="stat-card" style="${metrics.critical_cases > 0 ? 'border-color: rgba(239, 68, 68, 0.4);' : ''}">
          <div class="stat-header">
            <span class="stat-label">${t('criticalCases')}</span>
            <div class="stat-icon-wrapper rose">🚨</div>
          </div>
          <div class="stat-value" style="color: var(--severity-critical);">${metrics.critical_cases ?? 0}</div>
          <div class="stat-footer">
            <span>High Risk Protocols</span>
            <span class="badge badge-critical">Immediate</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">${t('todayAppointments')}</span>
            <div class="stat-icon-wrapper emerald">📅</div>
          </div>
          <div class="stat-value">${metrics.today_appointments ?? 0}</div>
          <div class="stat-footer">
            <span>Scheduled Consultations</span>
            <span style="color: var(--severity-mild);">On Track</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">${t('pendingFollowUps')}</span>
            <div class="stat-icon-wrapper purple">🩺</div>
          </div>
          <div class="stat-value">${metrics.pending_follow_ups ?? 0}</div>
          <div class="stat-footer">
            <span>Within 7 Days</span>
            <span class="badge badge-in_progress">Pending</span>
          </div>
        </div>
      </div>

      <!-- Mid Section: Severity Breakdown & Status -->
      <div class="grid-cols-2" style="margin-bottom: 2rem;">
        <!-- Severity Distribution Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🩺</span> Case Severity Distribution
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${renderSeverityBar('Critical', casesBySeverity.critical || 0, 'var(--severity-critical)')}
            ${renderSeverityBar('Severe', casesBySeverity.severe || 0, 'var(--severity-severe)')}
            ${renderSeverityBar('Moderate', casesBySeverity.moderate || 0, 'var(--severity-moderate)')}
            ${renderSeverityBar('Mild', casesBySeverity.mild || 0, 'var(--severity-mild)')}
          </div>
        </div>

        <!-- Case Status Breakdown Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📊</span> Workflow Progression Status
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <span class="badge badge-open">Open</span>
              <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; font-family: var(--font-mono);">
                ${casesByStatus.open || 0}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Initial triage</div>
            </div>
            <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <span class="badge badge-in_progress">In Progress</span>
              <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; font-family: var(--font-mono);">
                ${casesByStatus.in_progress || 0}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Active therapy</div>
            </div>
            <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <span class="badge badge-closed">Closed</span>
              <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; font-family: var(--font-mono);">
                ${casesByStatus.closed || 0}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Discharged & resolved</div>
            </div>
            <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <span class="badge badge-referred">Referred</span>
              <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; font-family: var(--font-mono);">
                ${casesByStatus.referred || 0}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Specialist hospital</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Case Escalation Queue -->
      ${renderCriticalQueue(recentCases)}

      <!-- Bottom Tables: Today's Appointments & Recent Cases -->
      <div class="grid-cols-2">
        <!-- Today's Appointments -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📅</span> Today's Consultations Queue
            </div>
            <a href="#/appointments" class="btn btn-sm btn-outline">View All</a>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Scheduled</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${todayAppointments.length === 0 ? `
                  <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No appointments scheduled for today.</td></tr>
                ` : todayAppointments.map(apt => `
                  <tr>
                    <td>
                      <div style="font-weight: 700;">${apt.patient?.first_name} ${apt.patient?.last_name}</div>
                      <div class="mono" style="font-size: 0.7rem; color: var(--text-muted);">${apt.patient?.uhid}</div>
                    </td>
                    <td class="mono">${new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${apt.reason}</td>
                    <td>
                      <span class="badge badge-${apt.status}">${apt.status}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Clinical Cases -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📁</span> Recent Case Records
            </div>
            <a href="#/cases" class="btn btn-sm btn-outline">View All</a>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Patient</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${recentCases.length === 0 ? `
                  <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No case records found.</td></tr>
                ` : recentCases.map(c => `
                  <tr>
                    <td>
                      <a href="#/cases/${c.id}" style="font-weight: 700; color: var(--primary-300);" class="mono">
                        ${c.case_number}
                      </a>
                    </td>
                    <td>${c.patient?.first_name} ${c.patient?.last_name}</td>
                    <td>
                      <span class="badge badge-${c.severity}">${c.severity}</span>
                    </td>
                    <td>
                      <span class="badge badge-${c.status}">${c.status.replace('_', ' ')}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color: var(--severity-critical); padding: 2rem;">Error loading dashboard: ${err.message}</div>`;
  }

  return container;
}

function renderSeverityBar(label, count, color) {
  const percentage = Math.min(Math.max((count / 5) * 100, 15), 100);
  return `
    <div>
      <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 600; margin-bottom: 4px;">
        <span>${label}</span>
        <span class="mono">${count} Cases</span>
      </div>
      <div style="height: 8px; background: var(--bg-surface-elevated); border-radius: var(--radius-full); overflow: hidden;">
        <div style="height: 100%; width: ${count > 0 ? percentage : 0}%; background: ${color}; border-radius: var(--radius-full); transition: width 0.5s ease;"></div>
      </div>
    </div>
  `;
}

function renderCriticalQueue(cases) {
  const criticalCases = cases.filter(c => c.severity === 'critical' && c.status !== 'closed');
  return `
    <div class="card" style="margin-bottom: 2rem; border-color: ${criticalCases.length ? 'rgba(239, 68, 68, 0.45)' : 'var(--border-subtle)'};">
      <div class="card-header">
        <div class="card-title"><span>🚨</span> Critical Escalation Queue</div>
        <span class="badge badge-critical">${criticalCases.length} active</span>
      </div>
      ${criticalCases.length === 0 ? `
        <div style="padding: 0.75rem 0; color: var(--severity-mild);">No active critical cases require escalation.</div>
      ` : `
        <div style="display: grid; gap: 0.75rem;">
          ${criticalCases.map(c => `
            <a href="#/cases/${c.id}" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.85rem 1rem; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.08); color: inherit; text-decoration: none;">
              <span><strong>${c.patient?.first_name || 'Unknown'} ${c.patient?.last_name || 'Patient'}</strong><br><small style="color: var(--text-secondary);">${c.diagnosis || c.title || 'Critical case'} · ${c.case_number}</small></span>
              <span class="badge badge-${c.status}">${c.status.replace('_', ' ')}</span>
            </a>
          `).join('')}
        </div>
      `}
    </div>
  `;
}
