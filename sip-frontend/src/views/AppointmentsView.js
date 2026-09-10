import { api } from '../services/api.js';
import { t } from '../services/i18n.js';
import { openModal, closeModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { mockUsers } from '../services/mockData.js';

export async function renderAppointmentsView() {
  const container = document.createElement('div');

  const [aptsRes, patientsRes] = await Promise.all([
    api.request('/appointments'),
    api.request('/patients')
  ]);

  let appointmentsList = aptsRes.data?.data || aptsRes.data || [];
  const patientsList = patientsRes.data?.data || patientsRes.data || [];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${t('navAppointments')}</h1>
        <p>Outpatient scheduling queue, time slot allocation, and consultation attendance management.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="open-book-appointment-btn">
          + ${t('bookAppointmentBtn')}
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card" style="padding: 1rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;">
      <div class="input-icon-wrapper" style="flex: 1; min-width: 260px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="appointment-search" class="form-input" placeholder="Search patient, UHID, or appointment code..." />
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <select class="form-select" id="appointment-status-filter" style="width: auto;">
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Appointment #</th>
            <th>Patient Details</th>
            <th>Attending Doctor</th>
            <th>Date & Time</th>
            <th>Reason & Type</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="appointments-tbody">
          ${renderAppointmentRows(appointmentsList)}
        </tbody>
      </table>
    </div>
  `;

  // Attach search & filter
  const searchInput = container.querySelector('#appointment-search');
  const statusFilter = container.querySelector('#appointment-status-filter');
  const tbody = container.querySelector('#appointments-tbody');

  function applyAptFilters() {
    const q = searchInput.value.toLowerCase();
    const st = statusFilter.value;

    const filtered = appointmentsList.filter(a => {
      const matchSearch = !q ||
        a.appointment_number?.toLowerCase().includes(q) ||
        `${a.patient?.first_name} ${a.patient?.last_name}`.toLowerCase().includes(q) ||
        a.patient?.uhid?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q);

      const matchStatus = !st || a.status === st;
      return matchSearch && matchStatus;
    });

    tbody.innerHTML = renderAppointmentRows(filtered);
    attachAptActionListeners(container, appointmentsList);
  }

  searchInput.addEventListener('input', applyAptFilters);
  statusFilter.addEventListener('change', applyAptFilters);

  // Book Appointment Modal
  container.querySelector('#open-book-appointment-btn').addEventListener('click', () => {
    openBookingModal(patientsList, async (bookingData) => {
      try {
        const res = await api.request('/appointments', {
          method: 'POST',
          body: JSON.stringify(bookingData)
        });
        showToast('Appointment successfully scheduled!', 'success');
        appointmentsList.unshift(res.data);
        applyAptFilters();
        closeModal();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  attachAptActionListeners(container, appointmentsList);
  return container;
}

function renderAppointmentRows(list) {
  if (list.length === 0) {
    return `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No scheduled consultations found.</td></tr>`;
  }

  return list.map(a => `
    <tr>
      <td class="mono" style="font-weight: 700; color: var(--primary-300);">${a.appointment_number}</td>
      <td>
        <div style="font-weight: 700;">${a.patient?.first_name} ${a.patient?.last_name}</div>
        <div class="mono" style="font-size: 0.7rem; color: var(--text-muted);">${a.patient?.uhid} • ${a.patient?.phone}</div>
      </td>
      <td>
        <div style="font-weight: 600;">${a.doctor?.name}</div>
        <div style="font-size: 0.7rem; color: var(--text-muted);">${a.doctor?.specialization}</div>
      </td>
      <td>
        <div class="mono" style="font-weight: 600;">${new Date(a.scheduled_at).toLocaleDateString()}</div>
        <div class="mono" style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </td>
      <td>
        <div style="font-weight: 600;">${a.reason}</div>
        <span class="badge" style="text-transform: uppercase; font-size: 0.65rem; background: var(--bg-surface-elevated); margin-top: 2px;">
          ${a.type}
        </span>
      </td>
      <td>
        <span class="badge badge-${a.status}">${a.status}</span>
      </td>
      <td>
        ${a.status === 'scheduled' ? `
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-sm btn-primary complete-apt-btn" data-id="${a.id}" title="Mark as Completed">
              ✓ Done
            </button>
            <button class="btn btn-sm btn-outline cancel-apt-btn" data-id="${a.id}" title="Cancel Consultation" style="color: var(--severity-critical);">
              ✕
            </button>
          </div>
        ` : `
          <span style="font-size: 0.75rem; color: var(--text-muted);">${a.status}</span>
        `}
      </td>
    </tr>
  `).join('');
}

function attachAptActionListeners(container, list) {
  container.querySelectorAll('.complete-apt-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      await api.request(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' })
      });
      showToast('Consultation marked as completed!', 'success');
      const apt = list.find(a => a.id === id);
      if (apt) apt.status = 'completed';
      btn.closest('tr').querySelector('.badge').className = 'badge badge-completed';
      btn.closest('tr').querySelector('.badge').textContent = 'completed';
      btn.parentElement.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">completed</span>`;
    });
  });

  container.querySelectorAll('.cancel-apt-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      await api.request(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' })
      });
      showToast('Appointment cancelled.', 'info');
      const apt = list.find(a => a.id === id);
      if (apt) apt.status = 'cancelled';
      btn.closest('tr').querySelector('.badge').className = 'badge badge-cancelled';
      btn.closest('tr').querySelector('.badge').textContent = 'cancelled';
      btn.parentElement.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">cancelled</span>`;
    });
  });
}

function openBookingModal(patients, onSave) {
  const doctors = mockUsers.filter(u => u.role === 'doctor' || u.role === 'admin');

  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() + 2);
  defaultDate.setMinutes(0);

  const formHtml = `
    <form id="book-apt-form">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Patient *</label>
          <select name="patient_id" class="form-select" required>
            ${patients.map(p => `
              <option value="${p.id}">${p.first_name} ${p.last_name} (${p.uhid})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Doctor *</label>
          <select name="doctor_id" class="form-select" required>
            ${doctors.map(d => `
              <option value="${d.id}">${d.name} (${d.specialization})</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Scheduled Date & Time *</label>
          <input type="datetime-local" name="scheduled_at" class="form-input" required value="${defaultDate.toISOString().slice(0, 16)}" />
        </div>

        <div class="form-group">
          <label class="form-label">Consultation Type</label>
          <select name="type" class="form-select">
            <option value="consultation">General Consultation</option>
            <option value="follow_up">Case Follow-up</option>
            <option value="emergency">Emergency Evaluation</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Reason for Visit *</label>
        <input type="text" name="reason" class="form-input" placeholder="e.g. Blood pressure review & routine checkup" required />
      </div>
    </form>
  `;

  const modal = openModal({
    title: '📅 Schedule Outpatient Appointment',
    content: formHtml,
    footer: `
      <button type="button" class="btn btn-secondary cancel-modal-btn">Cancel</button>
      <button type="submit" form="book-apt-form" class="btn btn-primary">Confirm & Book Slot</button>
    `
  });

  modal.backdrop.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);
  modal.backdrop.querySelector('#book-apt-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSave(Object.fromEntries(fd.entries()));
  });
}
