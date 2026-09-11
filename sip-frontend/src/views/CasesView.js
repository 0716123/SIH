import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { t } from '../services/i18n.js';
import { openModal, closeModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { recordAudit } from '../services/audit.js';

export async function renderCasesView() {
  const container = document.createElement('div');

  const [casesRes, patientsRes, symptomsRes, doctorsRes] = await Promise.all([
    api.request('/cases'),
    api.request('/patients'),
    api.request('/symptoms'),
    api.request('/doctors')
  ]);

  let casesList = casesRes.data?.data || casesRes.data || [];
  const patientsList = patientsRes.data?.data || patientsRes.data || [];
  const symptomsCatalog = symptomsRes.data || [];
  const doctorsList = doctorsRes.data?.data || doctorsRes.data || [];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${t('navCases')}</h1>
        <p>Digital medical case files, clinical diagnostic tracking, symptom catalogs, and hospital discharge progression.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="open-new-case-modal">
          + ${t('newCaseBtn')}
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="card" style="padding: 1rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;">
      <div class="input-icon-wrapper" style="flex: 1; min-width: 260px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="case-search-input" class="form-input" placeholder="Search by Case No, Diagnosis, or Patient..." />
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <select class="form-select" id="filter-severity" style="width: auto;">
          <option value="">All Severities</option>
          <option value="critical">🚨 Critical</option>
          <option value="severe">Severe</option>
          <option value="moderate">Moderate</option>
          <option value="mild">Mild</option>
        </select>

        <select class="form-select" id="filter-status" style="width: auto;">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
          <option value="referred">Referred</option>
        </select>
      </div>
    </div>

    <!-- Cases Data Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>${t('caseNumber')}</th>
            <th>${t('patientName')}</th>
            <th>${t('diagnosis')}</th>
            <th>${t('doctor')}</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="cases-tbody">
          ${renderCaseRows(casesList)}
        </tbody>
      </table>
    </div>
  `;

  // Search & Filter listeners
  const searchInput = container.querySelector('#case-search-input');
  const sevFilter = container.querySelector('#filter-severity');
  const statFilter = container.querySelector('#filter-status');
  const tbody = container.querySelector('#cases-tbody');

  function applyCaseFilters() {
    const q = searchInput.value.toLowerCase();
    const s = sevFilter.value;
    const st = statFilter.value;

    const filtered = casesList.filter(c => {
      const matchSearch = !q ||
        c.case_number.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.diagnosis?.toLowerCase().includes(q) ||
        `${c.patient?.first_name} ${c.patient?.last_name}`.toLowerCase().includes(q) ||
        c.patient?.uhid?.toLowerCase().includes(q);

      const matchSev = !s || c.severity === s;
      const matchStat = !st || c.status === st;

      return matchSearch && matchSev && matchStat;
    });

    tbody.innerHTML = renderCaseRows(filtered);
  }

  searchInput.addEventListener('input', applyCaseFilters);
  sevFilter.addEventListener('change', applyCaseFilters);
  statFilter.addEventListener('change', applyCaseFilters);

  // New Case Modal
  container.querySelector('#open-new-case-modal').addEventListener('click', () => {
    openNewCaseModal(patientsList, symptomsCatalog, doctorsList, async (caseData) => {
      try {
        const res = await api.request('/cases', {
          method: 'POST',
          body: JSON.stringify(caseData)
        });
          recordAudit('Case created', `Case ${res.data?.case_number || res.data?.id || 'record'}`, res.data?.diagnosis || 'New clinical case');
        showToast('Clinical case record initialized successfully!', 'success');
        casesList.unshift(res.data);
        applyCaseFilters();
        closeModal();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  return container;
}

function renderCaseRows(list) {
  if (list.length === 0) {
    return `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">No medical case files found.</td></tr>`;
  }

  return list.map(c => `
    <tr>
      <td>
        <a href="#/cases/${c.id}" class="mono" style="font-weight: 700; color: var(--primary-300);">
          ${c.case_number}
        </a>
      </td>
      <td>
        <div style="font-weight: 700;">${c.patient?.first_name} ${c.patient?.last_name}</div>
        <div class="mono" style="font-size: 0.7rem; color: var(--text-muted);">${c.patient?.uhid}</div>
      </td>
      <td style="max-width: 220px; font-weight: 600;">
        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.diagnosis}">
          ${c.diagnosis}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${c.title}
        </div>
      </td>
      <td>
        <div style="font-size: 0.8125rem; font-weight: 600;">${c.doctor?.name}</div>
        <div style="font-size: 0.7rem; color: var(--text-muted);">${c.doctor?.specialization?.split('&')[0] || ''}</div>
      </td>
      <td>
        <span class="badge badge-${c.severity}">${c.severity}</span>
      </td>
      <td>
        <span class="badge badge-${c.status}">${c.status.replace('_', ' ')}</span>
      </td>
      <td class="mono" style="font-size: 0.75rem;">
        ${new Date(c.admission_date).toLocaleDateString()}
      </td>
      <td>
        <a href="#/cases/${c.id}" class="btn btn-sm btn-secondary">
          Open Dossier
        </a>
      </td>
    </tr>
  `).join('');
}

function openNewCaseModal(patients, symptomsCatalog, doctors, onSave) {

  const formHtml = `
    <form id="new-case-form">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Select Patient *</label>
          <select name="patient_id" class="form-select" required>
            ${patients.map(p => `
              <option value="${p.id}">
                ${p.first_name} ${p.last_name} (${p.uhid}) - ${p.gender}, ${p.age}y
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Attending Physician *</label>
          <select name="doctor_id" class="form-select" required>
            ${doctors.map(d => `
              <option value="${d.id}">${d.name} (${d.specialization})</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Case Title / Primary Complaint *</label>
        <input type="text" name="title" class="form-input" placeholder="e.g. Acute Severe Asthma Exacerbation with Wheezing" required />
      </div>

      <div class="form-group">
        <label class="form-label">Clinical Working Diagnosis *</label>
        <input type="text" name="diagnosis" class="form-input" placeholder="e.g. Status Asthmaticus secondary to acute upper respiratory infection" required />
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Triage Severity Level *</label>
          <select name="severity" class="form-select" required>
            <option value="mild">Mild (Outpatient routine)</option>
            <option value="moderate" selected>Moderate (Needs monitoring)</option>
            <option value="severe">Severe (Urgent inpatient care)</option>
            <option value="critical">Critical (ICU / Emergency Resuscitation)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Admission / Consultation Date</label>
          <input type="datetime-local" name="admission_date" class="form-input" value="${new Date().toISOString().slice(0, 16)}" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Initial Clinical Examination & History Notes</label>
        <textarea name="description" class="form-textarea" placeholder="Record physical exam findings, vitals (BP, SpO2, PR, Temp), and history of present illness..."></textarea>
      </div>

      <!-- Clinical Symptoms Selector -->
      <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 1rem;">
        <label class="form-label" style="color: var(--teal-400); margin-bottom: 0.5rem;">
          Attach Presenting Symptoms (Clinical Catalog)
        </label>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem; max-height: 160px; overflow-y: auto; padding: 0.5rem; background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          ${symptomsCatalog.map(s => `
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; cursor: pointer;">
              <input type="checkbox" name="symptom_ids" value="${s.id}" data-name="${s.name}" />
              <span>${s.name}</span>
            </label>
          `).join('')}
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-secondary cancel-case-btn">Cancel</button>
    <button type="submit" form="new-case-form" class="btn btn-primary">Create Medical Case Record</button>
  `;

  const modal = openModal({
    title: '📁 Open Digital Medical Case Dossier',
    content: formHtml,
    footer: footerHtml,
    size: 'lg'
  });

  modal.backdrop.querySelector('.cancel-case-btn').addEventListener('click', closeModal);
  modal.backdrop.querySelector('#new-case-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const checkedSymptoms = Array.from(e.target.querySelectorAll('input[name="symptom_ids"]:checked')).map(cb => ({
      symptom_id: parseInt(cb.value),
      name: cb.dataset.name,
      severity: formData.get('severity') || 'moderate',
      duration_days: 2
    }));

    const data = {
      patient_id: formData.get('patient_id'),
      doctor_id: formData.get('doctor_id'),
      title: formData.get('title'),
      diagnosis: formData.get('diagnosis'),
      severity: formData.get('severity'),
      admission_date: formData.get('admission_date'),
      description: formData.get('description'),
      symptoms: checkedSymptoms
    };

    onSave(data);
  });
}
