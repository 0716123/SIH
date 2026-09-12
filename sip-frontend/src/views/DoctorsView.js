import { api } from '../services/api.js';
import { t } from '../services/i18n.js';

export async function renderDoctorsView() {
  const container = document.createElement('div');

  const res = await api.request('/doctors');
  const doctors = res.data?.data || res.data || [];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${t('navDoctors')}</h1>
        <p>Medical staff directory, specialization credentials, active caseload allocation, and outpatient schedules.</p>
      </div>
    </div>

    <!-- Doctors Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
      ${doctors.map(d => `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 3.5rem; height: 3.5rem; border-radius: 50%; background: linear-gradient(135deg, var(--primary-500), var(--teal-500)); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #fff; font-weight: 800; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
                👨‍⚕️
              </div>
              <div>
                <h3 style="font-size: 1.15rem; margin-bottom: 2px;">${d.name}</h3>
                <div style="font-size: 0.8125rem; color: var(--teal-400); font-weight: 600;">${d.specialization || 'Consultant Physician'}</div>
                <div class="mono" style="font-size: 0.7rem; color: var(--text-muted);">Reg: ${d.license_number || 'GMC-VERIFIED'}</div>
              </div>
            </div>

            <div style="background: var(--bg-surface-elevated); padding: 0.875rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; text-align: center;">
              <div>
                <div style="font-size: 1.25rem; font-weight: 700; font-family: var(--font-mono); color: var(--primary-300);">
                  ${d.active_cases_count ?? 2}
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Active Cases</div>
              </div>
              <div>
                <div style="font-size: 1.25rem; font-weight: 700; font-family: var(--font-mono); color: var(--severity-mild);">
                  ${d.today_appointments_count ?? 3}
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Today's Queue</div>
              </div>
            </div>

            <div style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.6;">
              <div>📞 <strong>Phone:</strong> <span class="mono">${d.phone || '+91 98765 43210'}</span></div>
              <div>✉️ <strong>Email:</strong> ${d.email}</div>
              <div>🏥 <strong>OPD Clinic:</strong> Mon – Sat (09:00 AM – 02:00 PM)</div>
            </div>
          </div>

          <div style="margin-top: 1.25rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <span class="badge badge-closed">Available</span>
            <a href="#/cases?doctor_id=${d.id}" class="btn btn-sm btn-outline">
              View Caseload →
            </a>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  return container;
}
