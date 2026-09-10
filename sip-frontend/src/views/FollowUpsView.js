import { api } from '../services/api.js';
import { t } from '../services/i18n.js';
import { openModal, closeModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';

export async function renderFollowUpsView() {
  const container = document.createElement('div');

  const res = await api.request('/follow-ups');
  let followUps = res.data?.data || res.data || [];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${t('navFollowUps')}</h1>
        <p>Post-intervention clinical surveillance, medication adherence checks, and patient recovery monitoring.</p>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="grid-stats" style="margin-bottom: 2rem;">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Pending Reviews</span>
          <div class="stat-icon-wrapper amber">⏳</div>
        </div>
        <div class="stat-value">${followUps.filter(f => f.status === 'pending').length}</div>
        <div class="stat-footer">
          <span>Within Next 7 Days</span>
          <span class="badge badge-in_progress">Pending</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Completed Consultations</span>
          <div class="stat-icon-wrapper emerald">✅</div>
        </div>
        <div class="stat-value">${followUps.filter(f => f.status === 'completed').length}</div>
        <div class="stat-footer">
          <span>Treatment Goals Met</span>
          <span class="badge badge-closed">Completed</span>
        </div>
      </div>
    </div>

    <!-- Follow-ups Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Case Reference</th>
            <th>Attending Doctor</th>
            <th>Scheduled Date</th>
            <th>Clinical Purpose</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="follow-ups-tbody">
          ${renderFollowUpRows(followUps)}
        </tbody>
      </table>
    </div>
  `;

  attachFollowUpListeners(container, followUps);
  return container;
}

function renderFollowUpRows(list) {
  if (list.length === 0) {
    return `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No follow-up consultations found.</td></tr>`;
  }

  return list.map(f => `
    <tr>
      <td>
        <div style="font-weight: 700;">${f.patient?.first_name} ${f.patient?.last_name}</div>
        <div class="mono" style="font-size: 0.7rem; color: var(--text-muted);">${f.patient?.uhid || ''} • ${f.patient?.phone || ''}</div>
      </td>
      <td>
        <a href="#/cases/${f.case_record_id || 1}" class="mono" style="font-weight: 700; color: var(--primary-300);">
          ${f.case_record?.case_number || 'CASE-LINK'}
        </a>
        <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${f.case_record?.title || ''}
        </div>
      </td>
      <td>
        <div style="font-weight: 600;">${f.doctor?.name || 'Assigned'}</div>
      </td>
      <td class="mono">
        ${new Date(f.scheduled_date).toLocaleDateString()}
      </td>
      <td style="max-width: 240px; font-size: 0.8125rem;">
        ${f.purpose}
        ${f.findings ? `<div style="color: var(--teal-400); font-size: 0.75rem; margin-top: 4px;"><strong>Findings:</strong> ${f.findings}</div>` : ''}
      </td>
      <td>
        <span class="badge badge-${f.status === 'completed' ? 'closed' : 'in_progress'}">${f.status}</span>
      </td>
      <td>
        ${f.status === 'pending' ? `
          <button class="btn btn-sm btn-primary complete-followup-btn" data-id="${f.id}">
            Record Findings
          </button>
        ` : `
          <span style="font-size: 0.75rem; color: var(--severity-mild); font-weight: 600;">✓ Reviewed</span>
        `}
      </td>
    </tr>
  `).join('');
}

function attachFollowUpListeners(container, list) {
  container.querySelectorAll('.complete-followup-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const followUp = list.find(item => item.id === id);
      if (followUp) {
        openCompleteFollowUpModal(followUp, async (data) => {
          try {
            await api.request(`/follow-ups/${id}/complete`, {
              method: 'POST',
              body: JSON.stringify(data)
            });
            showToast('Follow-up consultation successfully completed & recorded!', 'success');
            followUp.status = 'completed';
            followUp.findings = data.findings;
            followUp.recommendations = data.recommendations;
            container.querySelector('#follow-ups-tbody').innerHTML = renderFollowUpRows(list);
            attachFollowUpListeners(container, list);
            closeModal();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }
    });
  });
}

function openCompleteFollowUpModal(f, onSave) {
  const formHtml = `
    <form id="complete-followup-form">
      <div style="background: var(--bg-surface-elevated); padding: 0.875rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1rem;">
        <div style="font-weight: 700;">Patient: ${f.patient?.first_name} ${f.patient?.last_name}</div>
        <div style="font-size: 0.8125rem; color: var(--text-muted);">Purpose: ${f.purpose}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Clinical Examination Findings *</label>
        <textarea name="findings" class="form-textarea" placeholder="Record recovery status, vitals, symptom resolution, or recurrence..." required></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Recommendations & Post-Care *</label>
        <textarea name="recommendations" class="form-textarea" placeholder="Medication adjustments, diet/lifestyle instructions, or discharge clearance..." required></textarea>
      </div>
    </form>
  `;

  const modal = openModal({
    title: '🩺 Record Follow-up Consultation Findings',
    content: formHtml,
    footer: `
      <button type="button" class="btn btn-secondary cancel-modal-btn">Cancel</button>
      <button type="submit" form="complete-followup-form" class="btn btn-primary">Complete Consultation</button>
    `
  });

  modal.backdrop.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);
  modal.backdrop.querySelector('#complete-followup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSave(Object.fromEntries(fd.entries()));
  });
}
