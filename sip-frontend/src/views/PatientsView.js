import { api } from '../services/api.js';
import { t } from '../services/i18n.js';
import { openModal, closeModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { recordAudit } from '../services/audit.js';

export async function renderPatientsView() {
  const container = document.createElement('div');

  const [patientsRes, doctorsRes] = await Promise.all([
    api.request('/patients?per_page=100'),
    api.request('/doctors')
  ]);
  let patients = patientsRes.data?.data || patientsRes.data || [];
  const doctors = doctorsRes.data?.data || doctorsRes.data || [];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${t('navPatients')}</h1>
        <p>Comprehensive patient intake repository, allergy safety records, and longitudinal case profiles.</p>
      </div>
      <div class="view-actions">
        <span id="patients-sync-status" style="font-size: 0.75rem; color: var(--text-muted);">Syncing...</span>
        <button class="btn btn-primary" id="open-new-patient-modal">
          + ${t('newPatientBtn')}
        </button>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="card" style="padding: 1rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;">
      <div class="input-icon-wrapper" style="flex: 1; min-width: 260px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="patient-search-input" class="form-input" placeholder="Search by UHID, Name, or Phone..." />
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <select class="form-select" id="filter-gender" style="width: auto;">
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select class="form-select" id="filter-blood" style="width: auto;">
          <option value="">All Blood Groups</option>
          <option value="A+">A+</option>
          <option value="B+">B+</option>
          <option value="O+">O+</option>
          <option value="AB+">AB+</option>
          <option value="B-">B-</option>
        </select>
      </div>
    </div>

    <!-- Patients Data Table -->
    <div class="table-container">
      <table class="data-table" id="patients-table">
        <thead>
          <tr>
            <th>${t('uhid')}</th>
            <th>${t('patientName')}</th>
            <th>${t('age')} / ${t('gender')}</th>
            <th>${t('bloodGroup')}</th>
            <th>${t('phone')}</th>
            <th>Active Allergies</th>
            <th>${t('actions')}</th>
          </tr>
        </thead>
        <tbody id="patients-tbody">
          ${renderPatientRows(patients)}
        </tbody>
      </table>
    </div>
  `;

  // Filter & Search Logic
  const searchInput = container.querySelector('#patient-search-input');
  const genderFilter = container.querySelector('#filter-gender');
  const bloodFilter = container.querySelector('#filter-blood');
  const tbody = container.querySelector('#patients-tbody');
  const syncStatus = container.querySelector('#patients-sync-status');

  function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const g = genderFilter.value;
    const b = bloodFilter.value;

    const filtered = patients.filter(p => {
      const matchSearch = !query || 
        p.uhid.toLowerCase().includes(query) || 
        p.full_name?.toLowerCase().includes(query) || 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(query) || 
        p.phone.includes(query);
      
      const matchGender = !g || p.gender === g;
      const matchBlood = !b || p.blood_group === b;

      return matchSearch && matchGender && matchBlood;
    });

    tbody.innerHTML = renderPatientRows(filtered);
    attachRowListeners(container, patients);
  }

  searchInput.addEventListener('input', applyFilters);
  genderFilter.addEventListener('change', applyFilters);
  bloodFilter.addEventListener('change', applyFilters);

  async function refreshPatients({ showLoading = false } = {}) {
    if (showLoading) syncStatus.textContent = 'Syncing...';
    try {
      const refreshedRes = await api.request('/patients?per_page=100');
      patients = refreshedRes.data?.data || refreshedRes.data || [];
      applyFilters();
      syncStatus.textContent = `Live sync: ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      syncStatus.textContent = 'Sync unavailable';
      console.warn('[Patients live sync]', err.message);
    }
  }

  let stopStream = () => {};
  const stopRefresh = () => stopStream();
  window.addEventListener('hashchange', stopRefresh, { once: true });
  refreshPatients({ showLoading: true });
  api.stream('/patients/stream', async () => {
    await refreshPatients();
    showToast('Patient list updated from the live database.', 'info');
  }).then(stop => { stopStream = stop; }).catch(error => {
    syncStatus.textContent = 'Live updates unavailable';
    console.warn('[Patients live updates]', error.message);
  });

  // Open New Patient Modal
  container.querySelector('#open-new-patient-modal').addEventListener('click', () => {
    openPatientModal(doctors, async (newPatientData) => {
      try {
        const res = await api.request('/patients', {
          method: 'POST',
          body: JSON.stringify(newPatientData)
        });
          recordAudit('Patient registered', `Patient ${res.data?.uhid || res.data?.id || 'record'}`, `${res.data?.first_name || ''} ${res.data?.last_name || ''}`.trim());
        showToast('Patient registered successfully!', 'success');
        await refreshPatients({ showLoading: true });
        closeModal();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  attachRowListeners(container, patients);
  return container;
}

function renderPatientRows(patientsList) {
  if (patientsList.length === 0) {
    return `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No patients found matching the criteria.</td></tr>`;
  }

  return patientsList.map(p => {
    const allergies = p.medical_history?.allergies || [];
    return `
      <tr>
        <td class="mono" style="font-weight: 700; color: var(--primary-300);">
          ${p.uhid}
        </td>
        <td>
          <div style="font-weight: 700;">${p.first_name} ${p.last_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${p.city || 'Gujarat'}</div>
        </td>
        <td>
          <span>${p.age || '—'} yrs</span> / 
          <span style="text-transform: capitalize; color: var(--text-secondary);">${p.gender}</span>
        </td>
        <td>
          <span class="badge" style="background: rgba(244, 63, 94, 0.12); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3);">
            ${p.blood_group || 'O+'}
          </span>
        </td>
        <td class="mono">${p.phone}</td>
        <td>
          ${allergies.length > 0 ? `
            <span class="badge" style="background: rgba(239, 68, 68, 0.14); color: var(--severity-critical); border: 1px solid rgba(239, 68, 68, 0.3);">
              ⚠️ ${allergies.join(', ')}
            </span>
          ` : `<span style="color: var(--text-muted); font-size: 0.75rem;">None reported</span>`}
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-secondary view-patient-btn" data-id="${p.id}">
              360° Profile
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function attachRowListeners(container, patientsList) {
  container.querySelectorAll('.view-patient-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const patientId = parseInt(btn.dataset.id);
      const res = await api.request(`/patients/${patientId}`);
      const patient = res.data || patientsList.find(p => p.id === patientId);
      if (patient) {
        openPatientDetailModal(patient);
      }
    });
  });
}

function openPatientModal(doctors, onSave) {
  const formHtml = `
    <form id="new-patient-form">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">First Name *</label>
          <input type="text" name="first_name" class="form-input" placeholder="e.g. Ramesh" required />
        </div>
        <div class="form-group">
          <label class="form-label">Last Name *</label>
          <input type="text" name="last_name" class="form-input" placeholder="e.g. Shah" required />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Gender *</label>
          <select name="gender" class="form-select" required>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date of Birth</label>
          <input type="date" name="dob" id="patient-dob" class="form-input" value="1990-01-01" />
        </div>
        <div class="form-group">
          <label class="form-label">Age *</label>
          <input type="number" name="age" id="patient-age" class="form-input" placeholder="35" required min="1" max="120" value="35" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Blood Group</label>
          <select name="blood_group" class="form-select">
            <option value="O+">O+</option>
            <option value="A+">A+</option>
            <option value="B+">B+</option>
            <option value="AB+">AB+</option>
            <option value="O-">O-</option>
            <option value="A-">A-</option>
            <option value="B-">B-</option>
            <option value="AB-">AB-</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number *</label>
          <input type="tel" name="phone" class="form-input" placeholder="+91 98765 00000" required />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" name="email" class="form-input" placeholder="patient@example.com" />
      </div>

      <div class="form-group">
        <label class="form-label">Primary Doctor / Care Owner</label>
        <select name="primary_doctor_id" class="form-select">
          <option value="">Assign later during case creation</option>
          ${doctors.filter(d => d.role === 'doctor' || !d.role).map(d => `
            <option value="${d.id}">${d.name} (${d.specialization || 'General Medicine'})</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Residential Address</label>
        <input type="text" name="address" class="form-input" placeholder="Street, Flat number, Locality" />
      </div>

      <div style="border-top: 1px solid var(--border-subtle); margin: 1rem 0; padding-top: 1rem;">
        <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem; color: var(--teal-400);">Clinical Safety & Medical History</h4>
        
        <div class="form-group">
          <label class="form-label" style="color: var(--severity-critical);">Known Drug Allergies (Comma separated)</label>
          <input type="text" name="allergies" class="form-input" placeholder="e.g. Penicillin, Sulfa, Aspirin" />
        </div>

        <div class="form-group">
          <label class="form-label">Pre-existing Chronic Conditions (Comma separated)</label>
          <input type="text" name="chronic_diseases" class="form-input" placeholder="e.g. Diabetes, Hypertension, Asthma" />
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-secondary cancel-modal-btn">Cancel</button>
    <button type="submit" form="new-patient-form" class="btn btn-primary">Save & Register Patient</button>
  `;

  const modal = openModal({
    title: '🏥 Register New Hospital Patient',
    content: formHtml,
    footer: footerHtml,
    size: 'lg'
  });

  const dobInput = modal.backdrop.querySelector('#patient-dob');
  const ageInput = modal.backdrop.querySelector('#patient-age');
  dobInput.addEventListener('change', () => {
    if (dobInput.value) {
      const birth = new Date(dobInput.value);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      ageInput.value = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
  });

  modal.backdrop.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);
  modal.backdrop.querySelector('#new-patient-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    onSave(data);
  });
}

function openPatientDetailModal(p) {
  const allergies = p.medical_history?.allergies || p.medicalHistory?.allergies || [];
  const chronic = p.medical_history?.chronic_diseases || p.medicalHistory?.chronic_diseases || [];
  const cases = p.cases || [];

  const detailHtml = `
    <div>
      <!-- Header Banner -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); margin-bottom: 1.25rem;">
        <div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${p.first_name} ${p.last_name}</h2>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <span class="mono" style="font-weight: 700; color: var(--primary-300);">${p.uhid}</span>
            <span>•</span>
            <span>${p.age} Yrs (${p.gender})</span>
            <span>•</span>
            <span class="badge" style="background: rgba(244, 63, 94, 0.12); color: #fb7185;">Blood: ${p.blood_group}</span>
          </div>
        </div>
        <a href="#/cases?patient_id=${p.id}" class="btn btn-sm btn-primary" onclick="window.closeModalRoot?.()">
          + Create Case Record
        </a>
      </div>

      <!-- Critical Allergy Warning -->
      ${allergies.length > 0 ? `
        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: var(--radius-md); padding: 0.875rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">⚠️</span>
          <div>
            <div style="font-weight: 700; color: var(--severity-critical); font-size: 0.875rem;">CONTRAINDICATION / ALLERGY ALERT</div>
            <div style="font-size: 0.8125rem; color: #fca5a5;">
              Patient is allergic to: <strong>${allergies.join(', ')}</strong>. Do not administer these medications or compounds.
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Demographics & History Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="card" style="padding: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">
            Contact & Location
          </div>
          <div style="font-size: 0.875rem; line-height: 1.6;">
            <div><strong>Phone:</strong> <span class="mono">${p.phone}</span></div>
            <div><strong>Email:</strong> ${p.email || 'None on file'}</div>
            <div><strong>Address:</strong> ${p.address || 'Ahmedabad, Gujarat'}</div>
            <div><strong>Emergency:</strong> ${p.emergency_contact_name || 'Relative'} (${p.emergency_contact_phone || p.phone})</div>
          </div>
        </div>

        <div class="card" style="padding: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">
            Medical Profile
          </div>
          <div style="font-size: 0.875rem; line-height: 1.6;">
            <div><strong>Chronic:</strong> ${chronic.length > 0 ? chronic.join(', ') : 'None'}</div>
            <div><strong>Surgeries:</strong> ${p.medical_history?.past_surgeries || 'None'}</div>
            <div><strong>Medications:</strong> ${p.medical_history?.current_medications || 'None'}</div>
          </div>
        </div>
      </div>

      <!-- Cases History Timeline -->
      <div class="card" style="padding: 1.25rem;">
        <h4 style="margin-bottom: 0.75rem;">Clinical Case History (${cases.length})</h4>
        ${cases.length === 0 ? `
          <div style="color: var(--text-muted); font-size: 0.875rem;">No prior clinical cases registered for this patient.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${cases.map(c => `
              <div style="background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <a href="#/cases/${c.id}" class="mono" style="font-weight: 700; color: var(--primary-300);" onclick="window.closeModalRoot?.()">
                    ${c.case_number}
                  </a>
                  <div style="font-size: 0.8125rem; font-weight: 600; margin-top: 2px;">${c.title || c.diagnosis}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">
                    Dr. ${c.doctor?.name || 'Assigned'} • ${new Date(c.admission_date).toLocaleDateString()}
                  </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <span class="badge badge-${c.severity}">${c.severity}</span>
                  <span class="badge badge-${c.status}">${c.status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  window.closeModalRoot = closeModal;
  openModal({
    title: 'Patient 360° Comprehensive Record',
    content: detailHtml,
    size: 'xl',
    footer: `<button class="btn btn-secondary" onclick="window.closeModalRoot()">Close</button>`
  });
}
