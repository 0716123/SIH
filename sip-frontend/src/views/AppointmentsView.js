import { api } from '../services/api.js';
import { t } from '../services/i18n.js';
import { openModal, closeModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';

export async function renderAppointmentsView() {
  const container = document.createElement('div');

  const [aptsRes, patientsRes, doctorsRes] = await Promise.all([
    api.request('/appointments'),
    api.request('/patients'),
    api.request('/doctors')
  ]);

  let appointmentsList = aptsRes.data?.data || aptsRes.data || [];
  const patientsList = patientsRes.data?.data || patientsRes.data || [];
  const doctorsList = doctorsRes.data?.data || doctorsRes.data || [];

  // Compute stats
  const totalApts = appointmentsList.length;
  const totalTokensCollected = appointmentsList.filter(a => a.payment_status === 'paid' || a.token_amount).reduce((acc, a) => acc + (Number(a.token_amount) || 500), 0);
  const completedCount = appointmentsList.filter(a => a.status === 'completed').length;
  const noShowCount = appointmentsList.filter(a => a.status === 'no_show').length;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${t('navAppointments')}</h1>
        <p>Outpatient scheduling queue, advance token payment collection, and attendance anti-no-show verification.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="open-book-appointment-btn">
          + ${t('bookAppointmentBtn')} (₹500 Token)
        </button>
      </div>
    </div>

    <!-- Token & Booking Summary Metrics -->
    <div class="grid-stats" style="margin-bottom: 1.5rem;">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Total Scheduled</span>
          <div class="stat-icon-wrapper cyan">📅</div>
        </div>
        <div class="stat-value" id="stat-total-apts">${totalApts}</div>
        <div class="stat-footer">
          <span>Active Queue</span>
          <span style="color: var(--teal-400);">Verified</span>
        </div>
      </div>

      <div class="stat-card" style="border-color: rgba(16, 185, 129, 0.4);">
        <div class="stat-header">
          <span class="stat-label">Token Fees Collected</span>
          <div class="stat-icon-wrapper emerald">💰</div>
        </div>
        <div class="stat-value" style="color: var(--teal-400);" id="stat-tokens-collected">₹${totalTokensCollected.toLocaleString('en-IN')}</div>
        <div class="stat-footer">
          <span>₹500 Commitment Deposit</span>
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">Anti-No-Show</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Attended / Completed</span>
          <div class="stat-icon-wrapper purple">🩺</div>
        </div>
        <div class="stat-value" id="stat-completed-apts">${completedCount}</div>
        <div class="stat-footer">
          <span>Deposit Credited to Bill</span>
          <span class="badge badge-completed">Attended</span>
        </div>
      </div>

      <div class="stat-card" style="${noShowCount > 0 ? 'border-color: rgba(239, 68, 68, 0.35);' : ''}">
        <div class="stat-header">
          <span class="stat-label">No-Shows (Deposit Forfeited)</span>
          <div class="stat-icon-wrapper rose">⚠️</div>
        </div>
        <div class="stat-value" style="color: ${noShowCount > 0 ? 'var(--severity-critical)' : 'inherit'};" id="stat-noshow-apts">${noShowCount}</div>
        <div class="stat-footer">
          <span>Fake Bookings Deterred</span>
          <span class="badge badge-cancelled">Retained</span>
        </div>
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
          <option value="completed">Completed (Attended)</option>
          <option value="no_show">No-Show (Forfeited)</option>
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
            <th>Commitment Token (₹500)</th>
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

  // Book Appointment Modal with ₹500 Token Deposit
  container.querySelector('#open-book-appointment-btn').addEventListener('click', () => {
    openBookingModal(patientsList, doctorsList, async (bookingData) => {
      try {
        const res = await api.request('/appointments', {
          method: 'POST',
          body: JSON.stringify(bookingData)
        });
        const createdApt = res.data || {};
        showToast(`Appointment booked! ₹${createdApt.token_amount || 500} advance token fee collected.`, 'success', 5000);
        appointmentsList.unshift(createdApt);
        applyAptFilters();
        closeModal();

        // Prompt to view/print token receipt
        setTimeout(() => {
          openTokenReceiptModal(createdApt);
        }, 500);
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

  return list.map(a => {
    const tokenAmount = a.token_amount !== undefined ? Number(a.token_amount) : 500;
    const isPaid = a.payment_status === 'paid' || a.token_amount;
    const method = a.payment_method || 'UPI';
    const txn = a.transaction_id || 'TXN-SIP-ONLINE';

    let tokenBadgeHtml = '';
    if (a.status === 'no_show') {
      tokenBadgeHtml = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--severity-critical); border: 1px solid rgba(239, 68, 68, 0.3);">
            ⚠️ ₹${tokenAmount} Forfeited
          </span>
          <span class="mono" style="font-size: 0.65rem; color: var(--text-muted);">Non-Refundable</span>
        </div>
      `;
    } else if (a.status === 'completed') {
      tokenBadgeHtml = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
            ✓ ₹${tokenAmount} Credited
          </span>
          <span class="mono" style="font-size: 0.65rem; color: var(--text-muted);">Applied to Bill</span>
        </div>
      `;
    } else {
      tokenBadgeHtml = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700;">
            🛡️ ₹${tokenAmount} Paid (${method})
          </span>
          <span class="mono" style="font-size: 0.65rem; color: var(--text-muted);">${txn.slice(0, 16)}</span>
        </div>
      `;
    }

    return `
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
          ${tokenBadgeHtml}
        </td>
        <td>
          <span class="badge badge-${a.status}">${a.status === 'no_show' ? 'No-Show' : a.status}</span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            ${a.status === 'scheduled' ? `
              <button class="btn btn-sm btn-primary complete-apt-btn" data-id="${a.id}" title="Patient Came: Mark as Completed (Deduct ₹500 from Bill)">
                ✓ Attended
              </button>
              <button class="btn btn-sm btn-outline noshow-apt-btn" data-id="${a.id}" title="Patient Did Not Come: Mark as No-Show (Forfeit ₹500 Token)" style="color: var(--severity-critical); border-color: rgba(239, 68, 68, 0.4);">
                ⚠️ No-Show
              </button>
            ` : `
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize;">${a.status.replace('_', ' ')}</span>
            `}
            <button class="btn btn-sm btn-secondary receipt-apt-btn" data-id="${a.id}" title="View ₹500 Token Receipt">
              🧾 Receipt
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function attachAptActionListeners(container, list) {
  // Mark Attended / Completed
  container.querySelectorAll('.complete-apt-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      await api.request(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed', remarks: 'Patient attended consultation on schedule. ₹500 advance deposit credited toward final billing.' })
      });
      showToast('Patient attended! ₹500 token deposit credited toward consultation bill.', 'success', 5000);
      const apt = list.find(a => a.id === id);
      if (apt) apt.status = 'completed';
      btn.closest('tr').querySelector('.badge').className = 'badge badge-completed';
      btn.closest('tr').querySelector('.badge').textContent = 'completed';
      btn.parentElement.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">completed</span><button class="btn btn-sm btn-secondary receipt-apt-btn" data-id="${id}" title="View ₹500 Token Receipt">🧾 Receipt</button>`;
      attachReceiptListener(container, list);
    });
  });

  // Mark No-Show (Forfeit deposit)
  container.querySelectorAll('.noshow-apt-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const confirmed = window.confirm("Patient did not show up?\n\nMarking as No-Show will forfeit the ₹500 commitment token fee to protect against fake reservations.");
      if (!confirmed) return;

      await api.request(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'no_show', remarks: 'Patient failed to appear for scheduled slot. ₹500 advance commitment token forfeited.' })
      });
      showToast('Marked as No-Show. ₹500 commitment token retained by clinic.', 'info', 5000);
      const apt = list.find(a => a.id === id);
      if (apt) apt.status = 'no_show';
      btn.closest('tr').querySelector('.badge').className = 'badge badge-cancelled';
      btn.closest('tr').querySelector('.badge').textContent = 'No-Show';
      btn.parentElement.innerHTML = `<span style="font-size: 0.75rem; color: var(--severity-critical);">No-Show</span><button class="btn btn-sm btn-secondary receipt-apt-btn" data-id="${id}" title="View ₹500 Token Receipt">🧾 Receipt</button>`;
      attachReceiptListener(container, list);
    });
  });

  attachReceiptListener(container, list);
}

function attachReceiptListener(container, list) {
  container.querySelectorAll('.receipt-apt-btn').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id);
      const apt = list.find(a => a.id === id);
      if (apt) openTokenReceiptModal(apt);
    };
  });
}

function openBookingModal(patients, doctors, onSave) {
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
        <input type="text" name="reason" class="form-input" placeholder="e.g. Chronic cough & hypertension review" required />
      </div>

      <!-- Anti-No-Show Token Commitment Deposit Box -->
      <div style="margin-top: 1.25rem; padding: 1.25rem; border-radius: var(--radius-lg); background: rgba(16, 185, 129, 0.08); border: 1.5px solid rgba(16, 185, 129, 0.35);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: #10b981; font-size: 0.95rem;">
            <span>🛡️ Anti-No-Show Commitment Deposit</span>
          </div>
          <span class="badge" style="background: var(--teal-500); color: #fff; font-size: 0.8rem; font-weight: 800; padding: 4px 10px;">
            ₹500.00 Token
          </span>
        </div>

        <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 1rem;">
          Collecting a <strong>₹500 advance commitment token</strong> guarantees patient attendance and blocks fraudulent reservations.
          When the patient comes to the clinic, this ₹500 is <strong>automatically deducted from their final bill</strong>. If they fail to arrive, the token is forfeited.
        </p>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.8rem;">Token Deposit Amount (INR) *</label>
            <input type="number" name="token_amount" class="form-input" value="500" min="100" step="50" required readonly style="font-weight: 700; color: var(--teal-300);" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.8rem;">Payment Mode *</label>
            <select name="payment_method" class="form-select" required>
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Cash">Cash at Desk</option>
              <option value="NetBanking">Net Banking</option>
            </select>
          </div>
        </div>

        <div style="margin-top: 0.75rem; padding: 0.6rem 0.75rem; border-radius: var(--radius-md); background: var(--bg-surface-elevated); font-size: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
          <span style="color: var(--text-muted);">Simulated Instant Gateway:</span>
          <span style="color: #34d399; font-weight: 700;">🟢 Fast Verification Ready</span>
        </div>
      </div>
    </form>
  `;

  const modal = openModal({
    title: '📅 Book Appointment & Collect ₹500 Token Fee',
    content: formHtml,
    footer: `
      <button type="button" class="btn btn-secondary cancel-modal-btn">Cancel</button>
      <button type="submit" form="book-apt-form" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); border: none;">
        💳 Receive ₹500 Token & Confirm Slot
      </button>
    `
  });

  modal.backdrop.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);
  modal.backdrop.querySelector('#book-apt-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.payment_status = 'paid';
    data.transaction_id = 'TXN-SIP-' + Date.now().toString(36).toUpperCase();
    onSave(data);
  });
}

function openTokenReceiptModal(apt) {
  const tokenAmount = apt.token_amount !== undefined ? Number(apt.token_amount) : 500;
  const pName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Registered Patient';
  const uhid = apt.patient?.uhid || 'UHID-2026';
  const docName = apt.doctor?.name || 'Assigned Physician';
  const txnId = apt.transaction_id || `TXN-SIP-${apt.id || Date.now().toString(36).toUpperCase()}`;
  const method = apt.payment_method || 'UPI / QR';
  const aptNum = apt.appointment_number || `APT-${apt.id}`;

  const receiptHtml = `
    <div id="print-token-receipt" style="padding: 1.5rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); font-family: inherit;">
      <!-- Hospital Receipt Header -->
      <div style="text-align: center; border-bottom: 2px dashed var(--border-subtle); padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
        <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary-300);">SIP HEALTH CLINICAL NETWORK</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Official Outpatient Appointment Booking & Token Receipt</div>
        <div class="mono" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Receipt Ref: ${txnId}</div>
      </div>

      <!-- Details Table -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem; margin-bottom: 1.25rem;">
        <div>
          <span style="color: var(--text-muted);">Patient Name:</span>
          <div style="font-weight: 700;">${pName}</div>
        </div>
        <div>
          <span style="color: var(--text-muted);">UHID Number:</span>
          <div class="mono" style="font-weight: 700;">${uhid}</div>
        </div>
        <div>
          <span style="color: var(--text-muted);">Attending Doctor:</span>
          <div style="font-weight: 600;">${docName}</div>
        </div>
        <div>
          <span style="color: var(--text-muted);">Scheduled Date & Time:</span>
          <div style="font-weight: 600;">${new Date(apt.scheduled_at).toLocaleString()}</div>
        </div>
        <div>
          <span style="color: var(--text-muted);">Appointment Code:</span>
          <div class="mono" style="font-weight: 700; color: var(--teal-300);">${aptNum}</div>
        </div>
        <div>
          <span style="color: var(--text-muted);">Payment Method:</span>
          <div style="font-weight: 600;">${method}</div>
        </div>
      </div>

      <!-- Payment Summary Box -->
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #10b981; font-size: 0.95rem;">Commitment Token Deposit Paid</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Deductible from Final Outpatient Bill</div>
          </div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #34d399;">
            ₹${tokenAmount.toFixed(2)}
          </div>
        </div>
      </div>

      <!-- Policy Note -->
      <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px dashed var(--border-subtle); padding-top: 0.75rem; line-height: 1.4;">
        ℹ️ <strong>Patient Notice:</strong> Please arrive 15 minutes before your scheduled slot. Present this receipt at reception. The ₹${tokenAmount} token fee will be credited directly against your consultation and laboratory charges.
      </div>
    </div>
  `;

  const modal = openModal({
    title: '🧾 Official Token Fee Receipt',
    content: receiptHtml,
    footer: `
      <button type="button" class="btn btn-secondary cancel-modal-btn">Close</button>
      <button type="button" class="btn btn-primary" id="print-receipt-btn">🖨️ Print Receipt</button>
    `
  });

  modal.backdrop.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);
  modal.backdrop.querySelector('#print-receipt-btn').addEventListener('click', () => {
    window.print();
  });
}
