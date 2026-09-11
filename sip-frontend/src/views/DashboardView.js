import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { realtime } from '../services/realtime.js';
import { t } from '../services/i18n.js';
import { showToast } from '../components/Toast.js';
import drRajeshPhoto from '../assets/dr-rajesh-patel.jpg';

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
    const [dashRes, doctorsRes] = await Promise.all([
      api.request('/dashboard'),
      api.request('/doctors').catch(() => ({ data: [] }))
    ]);
    const data = dashRes.data || {};
    const doctors = doctorsRes.data?.data || doctorsRes.data || [];
    const metrics = data.metrics || {};
    const casesByStatus = data.cases_by_status || { open: 0, in_progress: 0, closed: 0, referred: 0 };
    const casesBySeverity = data.cases_by_severity || { mild: 0, moderate: 0, severe: 0, critical: 0 };
    const recentCases = data.recent_cases || [];
    const todayAppointments = data.today_appointments || data.upcoming_appointments || [];

    const defaultDoctor = doctors.find(d => d.name.toLowerCase().includes('rajesh')) || {
      id: 2,
      name: 'Dr. Rajesh Patel',
      specialization: 'General Medicine & Infectious Diseases',
      license_number: 'GMC-GUJ-48291',
      phone: '+91 98251 11223',
      email: 'dr.rajesh@sip.org',
      active_cases_count: 4,
      today_appointments_count: 5,
      avatar: '/images/doctors/dr-rajesh-patel.jpg'
    };

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

      <!-- Attending Consultant Spotlight Row: Dr. Rajesh Patel -->
      <div class="card" style="margin-bottom: 2rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.92)); border: 1px solid rgba(14, 165, 233, 0.35); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(14, 165, 233, 0.15);">
        
        <!-- Header with Doctor Selector -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.625rem;">
            <span style="font-size: 1.25rem;">👨‍⚕️</span>
            <span style="font-size: 0.8125rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--teal-400);">
              Attending Consultant In-Clinic • Physician Profile
            </span>
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 8px #10b981;"></span>
              Active In OPD Room 104
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">Doctor Focus:</label>
            <select id="dash-doctor-select" class="form-input" style="padding: 0.35rem 0.75rem; font-size: 0.8125rem; width: 230px; background: var(--bg-surface-elevated); border: 1px solid var(--border-medium);">
              ${doctors.length === 0 ? `
                <option value="2" selected>Dr. Rajesh Patel (General Medicine)</option>
              ` : doctors.map(d => `
                <option value="${d.id}" ${d.name.toLowerCase().includes('rajesh') ? 'selected' : ''}>
                  ${d.name} (${d.specialization?.split('&')[0]?.trim() || 'Consultant'})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- FULL DETAIL IN ROW: Rounded Image on Left + Complete Details Aligned Horizontally in Row -->
        <div id="doctor-spotlight-row" style="display: flex; align-items: center; justify-content: space-between; gap: 2rem; flex-wrap: wrap;">
          
          <!-- Left: Rounded circular doctor portrait -->
          <div style="position: relative; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            <img id="doctor-spotlight-img"
                 src="${drRajeshPhoto}" 
                 alt="${defaultDoctor.name}" 
                 onerror="this.src='/images/doctors/dr-rajesh-patel.jpg'"
                 style="width: 110px; height: 110px; min-width: 110px; min-height: 110px; border-radius: 50%; object-fit: cover; object-position: center top; border: 3.5px solid #0284c7; box-shadow: 0 0 25px rgba(2, 132, 199, 0.45); display: block;" />
            <span style="position: absolute; bottom: 2px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: #10b981; border: 3px solid #0f172a; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; font-weight: bold;" title="Online / Verified On Duty">
              ✓
            </span>
          </div>

          <!-- Middle: Doctor Full Details (Name, Qualifications, Specialization, Registration, Contacts) in Row -->
          <div style="flex: 1 1 360px; display: flex; flex-direction: column; gap: 0.375rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <h2 id="doctor-spotlight-name" style="margin: 0; font-size: 1.45rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                ${defaultDoctor.name}
              </h2>
              <span class="badge" style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.3);">
                MD (Internal Medicine)
              </span>
              <span class="badge badge-closed">Senior Consultant</span>
            </div>

            <div id="doctor-spotlight-spec" style="font-size: 0.9375rem; font-weight: 600; color: #2dd4bf; display: flex; align-items: center; gap: 6px;">
              <span>🩺</span> ${defaultDoctor.specialization || 'General Medicine & Infectious Diseases'}
            </div>

            <!-- Credentials, Registration & Chamber in row -->
            <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.8125rem; color: var(--text-secondary); flex-wrap: wrap; margin-top: 2px;">
              <div>
                <strong>Medical Reg:</strong> <span class="mono" id="doctor-spotlight-lic" style="color: #93c5fd;">${defaultDoctor.license_number || 'GMC-GUJ-48291'}</span>
              </div>
              <div style="color: var(--border-glow);">•</div>
              <div>
                <strong>Experience:</strong> 12+ Years Clinical Practice
              </div>
              <div style="color: var(--border-glow);">•</div>
              <div>
                <strong>OPD Chamber:</strong> Room 104, Block-A
              </div>
            </div>

            <!-- Contacts & Schedule in row -->
            <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.8125rem; color: var(--text-secondary); flex-wrap: wrap; margin-top: 2px;">
              <div>
                📞 <strong>Phone:</strong> <span class="mono" id="doctor-spotlight-phone" style="color: #e2e8f0;">${defaultDoctor.phone || '+91 98251 11223'}</span>
              </div>
              <div style="color: var(--border-glow);">•</div>
              <div>
                ✉️ <strong>Email:</strong> <span id="doctor-spotlight-email" style="color: #e2e8f0;">${defaultDoctor.email || 'dr.rajesh@sip.org'}</span>
              </div>
              <div style="color: var(--border-glow);">•</div>
              <div>
                ⏱️ <strong>Timings:</strong> Mon – Sat (09:00 AM – 02:00 PM)
              </div>
            </div>
          </div>

          <!-- Right: Live Caseload Metric Badges & Action Buttons in Row -->
          <div style="display: flex; flex-direction: column; gap: 0.875rem; align-items: flex-end; flex: 0 0 auto;">
            <!-- Metric chips in row -->
            <div style="display: flex; gap: 0.625rem; flex-wrap: wrap;">
              <div style="background: rgba(14, 165, 233, 0.12); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: var(--radius-md); padding: 0.5rem 0.875rem; text-align: center;">
                <div class="mono" id="doctor-spotlight-cases" style="font-size: 1.15rem; font-weight: 800; color: #38bdf8;">
                  ${defaultDoctor.active_cases_count ?? 4}
                </div>
                <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Active Cases</div>
              </div>

              <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 0.5rem 0.875rem; text-align: center;">
                <div class="mono" id="doctor-spotlight-queue" style="font-size: 1.15rem; font-weight: 800; color: #34d399;">
                  ${defaultDoctor.today_appointments_count ?? 5}
                </div>
                <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Today's Queue</div>
              </div>

              <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 0.5rem 0.875rem; text-align: center;">
                <div class="mono" style="font-size: 1.15rem; font-weight: 800; color: #fbbf24;">₹500</div>
                <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Token Verified</div>
              </div>
            </div>

            <!-- Action buttons in row -->
            <div style="display: flex; gap: 0.5rem;">
              <a id="doctor-spotlight-cases-link" href="#/cases?doctor_id=${defaultDoctor.id}" class="btn btn-secondary btn-sm" style="padding: 0.4rem 0.875rem; font-size: 0.8125rem;">
                📁 View Caseload
              </a>
              <a href="#/appointments" class="btn btn-primary btn-sm" style="padding: 0.4rem 0.875rem; font-size: 0.8125rem;">
                📅 Book Appointment
              </a>
            </div>
          </div>

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

    // Doctor Spotlight Selector Listener
    const docSelect = container.querySelector('#dash-doctor-select');
    if (docSelect) {
      docSelect.addEventListener('change', (e) => {
        const selectedId = parseInt(e.target.value);
        const doc = doctors.find(d => d.id === selectedId) || defaultDoctor;
        const isRajesh = doc.name.toLowerCase().includes('rajesh');

        const imgEl = container.querySelector('#doctor-spotlight-img');
        const nameEl = container.querySelector('#doctor-spotlight-name');
        const specEl = container.querySelector('#doctor-spotlight-spec');
        const licEl = container.querySelector('#doctor-spotlight-lic');
        const phoneEl = container.querySelector('#doctor-spotlight-phone');
        const emailEl = container.querySelector('#doctor-spotlight-email');
        const casesEl = container.querySelector('#doctor-spotlight-cases');
        const queueEl = container.querySelector('#doctor-spotlight-queue');
        const casesLinkEl = container.querySelector('#doctor-spotlight-cases-link');

        if (imgEl) {
          imgEl.src = isRajesh ? drRajeshPhoto : (doc.avatar || '/images/doctors/dr-rajesh-patel.jpg');
          imgEl.alt = doc.name;
        }
        if (nameEl) nameEl.textContent = doc.name;
        if (specEl) specEl.innerHTML = `<span>🩺</span> ${doc.specialization || 'Consultant Physician'}`;
        if (licEl) licEl.textContent = doc.license_number || 'GMC-VERIFIED';
        if (phoneEl) phoneEl.textContent = doc.phone || '+91 98000 00000';
        if (emailEl) emailEl.textContent = doc.email || 'doctor@sip.org';
        if (casesEl) casesEl.textContent = doc.active_cases_count ?? 3;
        if (queueEl) queueEl.textContent = doc.today_appointments_count ?? 4;
        if (casesLinkEl) casesLinkEl.href = `#/cases?doctor_id=${doc.id}`;
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="card" style="color: var(--severity-critical); padding: 2rem;">Error loading dashboard: ${err.message}</div>`;
  }

  // Real-time dynamic dashboard refresh when other devices add patients/cases
  const unsubscribeDashboardSync = realtime.onPatientUpdate(async () => {
    try {
      const refreshedRes = await api.request('/dashboard');
      const refreshedData = refreshedRes.data || {};
      const newMetrics = refreshedData.metrics || {};
      const statCards = container.querySelectorAll('.stat-card .stat-value');
      if (statCards.length > 0 && newMetrics.total_patients !== undefined) {
        statCards[0].textContent = newMetrics.total_patients ?? statCards[0].textContent;
        statCards[0].style.transition = 'color 0.4s ease';
        statCards[0].style.color = 'var(--teal-400)';
        setTimeout(() => { statCards[0].style.color = ''; }, 3000);
      }
    } catch {
      // ignore
    }
  });

  window.addEventListener('hashchange', () => {
    unsubscribeDashboardSync();
  }, { once: true });

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
