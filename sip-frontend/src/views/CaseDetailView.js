import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { t } from '../services/i18n.js';
import { openModal, closeModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';

export async function renderCaseDetailView(caseId) {
  const container = document.createElement('div');

  const res = await api.request(`/cases/${caseId}`);
  const caseRecord = res.data;

  if (!caseRecord) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <h2>Case Record Not Found</h2>
        <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem 0;">The requested case dossier could not be retrieved.</p>
        <a href="#/cases" class="btn btn-primary">← Return to Cases List</a>
      </div>
    `;
    return container;
  }

  const p = caseRecord.patient || {};
  const doc = caseRecord.doctor || {};
  const symptoms = caseRecord.symptoms || [];
  const prescriptions = caseRecord.prescriptions || [];
  const treatments = caseRecord.treatments || [];
  const allergies = p.medical_history?.allergies || [];

  container.innerHTML = `
    <!-- Case Header & Action Toolbar -->
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <a href="#/cases" class="btn btn-sm btn-outline">← Back</a>
          <span class="mono" style="font-size: 1.5rem; font-weight: 800; color: var(--primary-300);">${caseRecord.case_number}</span>
          <span class="badge badge-${caseRecord.severity}">${caseRecord.severity}</span>
          <span class="badge badge-${caseRecord.status}">${caseRecord.status.replace('_', ' ')}</span>
        </div>
        <p style="margin-top: 0.5rem; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">
          ${caseRecord.diagnosis}
        </p>
      </div>

      <div class="view-actions">
        <!-- Status Switcher -->
        <select class="form-select" id="case-status-select" style="width: auto; font-weight: 600;">
          <option value="open" ${caseRecord.status === 'open' ? 'selected' : ''}>Status: Open</option>
          <option value="in_progress" ${caseRecord.status === 'in_progress' ? 'selected' : ''}>Status: In Progress</option>
          <option value="closed" ${caseRecord.status === 'closed' ? 'selected' : ''}>Status: Closed (Discharged)</option>
          <option value="referred" ${caseRecord.status === 'referred' ? 'selected' : ''}>Status: Referred</option>
        </select>

        <button class="btn btn-primary" id="print-case-btn">
          🖨️ ${t('printSummaryBtn')}
        </button>
      </div>
    </div>

    <!-- Patient Banner with Allergy Warning -->
    <div class="card glass-panel" style="margin-bottom: 1.5rem; padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 3rem; height: 3rem; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            👤
          </div>
          <div>
            <div style="font-size: 1.25rem; font-weight: 800;">
              ${p.first_name} ${p.last_name}
            </div>
            <div style="font-size: 0.8125rem; color: var(--text-secondary); display: flex; gap: 0.75rem;">
              <span class="mono">UHID: ${p.uhid}</span>
              <span>•</span>
              <span>${p.age} Yrs (${p.gender})</span>
              <span>•</span>
              <span>Blood: <strong>${p.blood_group || 'O+'}</strong></span>
              <span>•</span>
              <span class="mono">${p.phone}</span>
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Attending Doctor</div>
          <div style="font-weight: 700; color: var(--primary-300);">${doc.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${doc.specialization || ''}</div>
        </div>
      </div>

      ${allergies.length > 0 ? `
        <div style="margin-top: 1rem; padding: 0.65rem 1rem; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); font-size: 0.8125rem; color: #fca5a5; display: flex; align-items: center; gap: 0.5rem;">
          <span>⚠️</span>
          <span><strong>Known Allergies:</strong> ${allergies.join(', ')} (Contraindicated)</span>
        </div>
      ` : ''}
    </div>

    <!-- Grid: Clinical Progression & Symptoms -->
    <div class="grid-cols-2" style="margin-bottom: 1.5rem;">
      <!-- Clinical Case Dossier -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>📝</span> Clinical Examination & Notes
          </div>
        </div>
        <div style="font-size: 0.9375rem; line-height: 1.6; color: var(--text-primary);">
          <p style="margin-bottom: 1rem;">${caseRecord.description || 'Routine inpatient and outpatient monitoring file.'}</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; font-size: 0.8125rem; background: var(--bg-surface-elevated); padding: 0.875rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div><strong>Admission:</strong> <span class="mono">${new Date(caseRecord.admission_date).toLocaleString()}</span></div>
            <div><strong>Discharge:</strong> <span class="mono">${caseRecord.discharge_date ? new Date(caseRecord.discharge_date).toLocaleDateString() : 'Active Inpatient'}</span></div>
          </div>
        </div>
      </div>

      <!-- Attached Symptoms -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>🩺</span> Presenting Symptoms Catalog
          </div>
        </div>
        ${symptoms.length === 0 ? `
          <div style="color: var(--text-muted); font-size: 0.875rem; padding: 1rem 0;">No symptoms recorded.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${symptoms.map(s => `
              <div style="background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; font-size: 0.875rem;">${s.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${s.notes || `Duration: ${s.duration_days || 1} days`}</div>
                </div>
                <span class="badge badge-${s.severity || 'moderate'}">${s.severity || 'moderate'}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- Prescriptions Section -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div class="card-title">
          <span>💊</span> Prescribed Medications & Dosages
        </div>
        <button class="btn btn-sm btn-secondary" id="add-prescription-btn">
          + Add Medication
        </button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Medicine Name</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody id="prescriptions-tbody">
            ${prescriptions.length === 0 ? `
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No medications currently prescribed.</td></tr>
            ` : prescriptions.map(rx => `
              <tr>
                <td style="font-weight: 700; color: var(--primary-300);">${rx.medicine_name}</td>
                <td class="mono">${rx.dosage}</td>
                <td><span class="badge" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">${rx.frequency}</span></td>
                <td>${rx.duration}</td>
                <td style="color: var(--text-secondary); font-size: 0.8125rem;">${rx.instructions || 'As directed'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Print Only Medical Summary Template (Visible during Print) -->
    <div class="print-only">
      <div class="print-header">
        <div>
          <h1>SIP MEDICAL HOSPITAL & RESEARCH INSTITUTE</h1>
          <p>Government Recognised Tertiary Care Hospital • UHID Record System</p>
          <p>Ahmedabad, Gujarat • Tel: +91 79 2658 9900 • Emergency: 108</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14pt; font-weight: bold;">DISCHARGE & CASE SUMMARY</div>
          <div>Case #: ${caseRecord.case_number}</div>
          <div>Date: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <table class="print-table">
        <tr>
          <td><strong>Patient Name:</strong> ${p.first_name} ${p.last_name}</td>
          <td><strong>UHID:</strong> ${p.uhid}</td>
          <td><strong>Age/Gender:</strong> ${p.age} Yrs / ${p.gender}</td>
          <td><strong>Blood Group:</strong> ${p.blood_group}</td>
        </tr>
        <tr>
          <td><strong>Attending Doctor:</strong> ${doc.name}</td>
          <td colspan="2"><strong>Department:</strong> ${doc.specialization}</td>
          <td><strong>Admission:</strong> ${new Date(caseRecord.admission_date).toLocaleDateString()}</td>
        </tr>
      </table>

      <h3>Clinical Diagnosis & Severity</h3>
      <p><strong>Primary Diagnosis:</strong> ${caseRecord.diagnosis}</p>
      <p><strong>Clinical Severity:</strong> ${caseRecord.severity.toUpperCase()} • <strong>Status:</strong> ${caseRecord.status.toUpperCase()}</p>
      <p><strong>Summary of Findings:</strong> ${caseRecord.description}</p>

      <h3>Medications Prescribed</h3>
      <table class="print-table">
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Special Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${prescriptions.map(rx => `
            <tr>
              <td><strong>${rx.medicine_name}</strong></td>
              <td>${rx.dosage}</td>
              <td>${rx.frequency}</td>
              <td>${rx.duration}</td>
              <td>${rx.instructions || 'As directed'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="print-signature-area">
        <div class="print-signature-box">
          Patient / Relative Signature
        </div>
        <div class="print-signature-box">
          ${doc.name}<br>
          <span style="font-size: 8pt;">Authorized Medical Officer</span>
        </div>
      </div>
    </div>
  `;

  // Status Change Listener
  const statusSelect = container.querySelector('#case-status-select');
  statusSelect.addEventListener('change', async (e) => {
    const newStatus = e.target.value;
    try {
      await api.request(`/cases/${caseRecord.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Case status updated to ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Print Case Summary Trigger
  container.querySelector('#print-case-btn').addEventListener('click', () => {
    window.print();
  });

  // Add Prescription Dialog
  container.querySelector('#add-prescription-btn').addEventListener('click', () => {
    openPrescriptionModal((rxData) => {
      prescriptions.push({ id: prescriptions.length + 1, ...rxData });
      showToast('Medication added to prescription chart!', 'success');
      const tbody = container.querySelector('#prescriptions-tbody');
      tbody.innerHTML = prescriptions.map(rx => `
        <tr>
          <td style="font-weight: 700; color: var(--primary-300);">${rx.medicine_name}</td>
          <td class="mono">${rx.dosage}</td>
          <td><span class="badge" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">${rx.frequency}</span></td>
          <td>${rx.duration}</td>
          <td style="color: var(--text-secondary); font-size: 0.8125rem;">${rx.instructions || 'As directed'}</td>
        </tr>
      `).join('');
      closeModal();
    });
  });

  return container;
}

function openPrescriptionModal(onSave) {
  const formHtml = `
    <form id="new-rx-form">
      <div class="form-group">
        <label class="form-label">Medication / Generic Name *</label>
        <input type="text" name="medicine_name" class="form-input" placeholder="e.g. Levosalbutamol + Ipratropium" required />
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Dosage *</label>
          <input type="text" name="dosage" class="form-input" placeholder="e.g. 500mg or 1.25mg" required />
        </div>
        <div class="form-group">
          <label class="form-label">Frequency *</label>
          <select name="frequency" class="form-select" required>
            <option value="OD (Once daily)">OD (Once daily)</option>
            <option value="BD (Twice daily)" selected>BD (Twice daily)</option>
            <option value="TID (Thrice daily)">TID (Thrice daily)</option>
            <option value="QID (4 times daily)">QID (4 times daily)</option>
            <option value="PRN (As needed)">PRN (As needed / SOS)</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Route of Administration</label>
          <select name="route" class="form-select">
            <option value="oral">Oral</option>
            <option value="iv">Intravenous (IV)</option>
            <option value="im">Intramuscular (IM)</option>
            <option value="inhalation">Inhalation / Nebulizer</option>
            <option value="topical">Topical</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Duration *</label>
          <input type="text" name="duration" class="form-input" placeholder="e.g. 5 days or 1 month" required />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Instructions & Timings</label>
        <input type="text" name="instructions" class="form-input" placeholder="e.g. After food, avoid dairy, with full glass of water" />
      </div>
    </form>
  `;

  const modal = openModal({
    title: '💊 Add Prescription Medication',
    content: formHtml,
    footer: `
      <button type="button" class="btn btn-secondary cancel-modal-btn">Cancel</button>
      <button type="submit" form="new-rx-form" class="btn btn-primary">Add to Prescription</button>
    `
  });

  modal.backdrop.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);
  modal.backdrop.querySelector('#new-rx-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSave(Object.fromEntries(fd.entries()));
  });
}
