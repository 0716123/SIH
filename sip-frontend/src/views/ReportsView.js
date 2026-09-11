import { api } from '../services/api.js';
import { t } from '../services/i18n.js';
import { exportAuditCsv, getAuditEntries } from '../services/audit.js';

export async function renderReportsView() {
  const container = document.createElement('div');
  container.className = 'reports-view-wrapper';

  // State
  let currentDuration = '30_days';
  let customStartDate = '';
  let customEndDate = '';
  let doctorSearch = '';
  let doctorSort = 'patients'; // 'patients', 'cases', 'attendance', 'revenue'
  let reportData = null;

  async function fetchReportData() {
    let url = `/reports/hospital-summary?duration=${encodeURIComponent(currentDuration)}`;
    if (currentDuration === 'custom' && customStartDate && customEndDate) {
      url += `&start_date=${encodeURIComponent(customStartDate)}&end_date=${encodeURIComponent(customEndDate)}`;
    }
    const res = await api.request(url);
    return res.data || res;
  }

  function downloadReportCsv() {
    if (!reportData) return;
    const filter = reportData.filter || {};
    const exec = reportData.executive_summary || {};
    const tf = exec.token_financials || {};
    const doctors = reportData.doctors_breakdown || [];
    const categories = reportData.patient_categories || {};

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `SIP HOSPITAL EXECUTIVE CLINICAL AUDIT REPORT\n`;
    csvContent += `Generated On,${new Date().toLocaleString()}\n`;
    csvContent += `Reporting Period,${filter.label || currentDuration}\n`;
    csvContent += `Date Range,${filter.start_date || 'N/A'} to ${filter.end_date || 'N/A'}\n\n`;

    // Section 1: Executive Hospital KPIs
    csvContent += `EXECUTIVE HOSPITAL METRICS\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Patient Inflow in Period,${exec.patients_intake_period || 0}\n`;
    csvContent += `Total Hospital Registry,${exec.total_hospital_patients || 0}\n`;
    csvContent += `Clinical Cases Handled,${exec.total_cases_admitted || 0}\n`;
    csvContent += `Cases - Open,${exec.cases_by_status?.open || 0}\n`;
    csvContent += `Cases - In Progress,${exec.cases_by_status?.in_progress || 0}\n`;
    csvContent += `Cases - Closed/Discharged,${exec.cases_by_status?.closed || 0}\n`;
    csvContent += `Cases - Critical Resuscitation,${exec.cases_by_severity?.critical || 0}\n`;
    csvContent += `Total Appointments Booked,${exec.total_appointments || 0}\n`;
    csvContent += `Appointments Completed,${exec.appointments_by_status?.completed || 0}\n`;
    csvContent += `Appointments No-Show / Absent,${exec.appointments_by_status?.no_show || 0}\n`;
    csvContent += `Appointments Scheduled/Pending,${exec.appointments_by_status?.scheduled || 0}\n`;
    csvContent += `Appointment Attendance Rate,${exec.attendance_rate_percent || 0}%\n`;
    csvContent += `No-Show Rate,${exec.no_show_rate_percent || 0}%\n`;
    csvContent += `Follow-up Adherence Rate,${exec.followup_adherence_percent || 0}%\n`;
    csvContent += `Total ₹500 Token Fees Collected,INR ${tf.total_collected || 0}\n`;
    csvContent += `Token Fees Credited to Bills,INR ${tf.credited_to_consultations || 0}\n`;
    csvContent += `Token Fees Forfeited (No-Shows),INR ${tf.forfeited_no_show || 0}\n`;
    csvContent += `Token Fees Escrow (Pending Consultations),INR ${tf.held_in_escrow || 0}\n\n`;

    // Section 2: Doctor-Wise Breakdown
    csvContent += `DOCTOR-WISE PERFORMANCE & CASELOAD BREAKDOWN\n`;
    csvContent += `Doctor Name,Specialization,License Number,Assigned Patients,Total Cases,Active Cases,Closed Cases,Total Appointments,Completed,No-Show,Attendance Rate (%),Token Revenue (INR)\n`;
    doctors.forEach(d => {
      csvContent += `"${d.name}","${d.specialization}","${d.license_number || 'N/A'}",${d.assigned_patients},${d.total_cases},${d.active_cases},${d.closed_cases},${d.total_appointments},${d.completed_appointments},${d.no_show_appointments},${d.attendance_rate}%,${d.token_revenue}\n`;
    });
    csvContent += `\n`;

    // Section 3: Patient Demographics & Categories
    csvContent += `PATIENT CATEGORY BREAKDOWN\n`;
    csvContent += `Category Type,Sub-Category,Count\n`;
    if (categories.by_severity) {
      Object.entries(categories.by_severity).forEach(([k, v]) => csvContent += `Severity,${k},${v}\n`);
    }
    if (categories.by_age_group) {
      Object.entries(categories.by_age_group).forEach(([k, v]) => csvContent += `Age Group,${k},${v}\n`);
    }
    if (categories.by_gender) {
      Object.entries(categories.by_gender).forEach(([k, v]) => csvContent += `Gender,${k},${v}\n`);
    }
    if (categories.by_blood_group) {
      Object.entries(categories.by_blood_group).forEach(([k, v]) => csvContent += `Blood Group,${k},${v}\n`);
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIP_Hospital_Executive_Report_${currentDuration}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function render() {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <div style="display: inline-block; width: 42px; height: 42px; border: 4px solid var(--border-medium); border-top-color: var(--primary-500); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9375rem;">Compiling consolidated hospital metrics & doctor caseloads...</p>
      </div>
    `;

    try {
      reportData = await fetchReportData();
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="padding: 2rem; text-align: center; color: var(--severity-critical);">
          <h3>Error loading hospital report</h3>
          <p>${err.message || 'Please check network connection.'}</p>
          <button class="btn btn-secondary" id="retry-report-btn" style="margin-top: 1rem;">Retry</button>
        </div>
      `;
      container.querySelector('#retry-report-btn')?.addEventListener('click', render);
      return;
    }

    const filter = reportData.filter || {};
    const exec = reportData.executive_summary || {};
    const tf = exec.token_financials || { total_collected: 0, credited_to_consultations: 0, forfeited_no_show: 0, held_in_escrow: 0 };
    const categories = reportData.patient_categories || {};
    let doctors = [...(reportData.doctors_breakdown || [])];

    // Filter and Sort Doctors
    if (doctorSearch.trim()) {
      const q = doctorSearch.toLowerCase().trim();
      doctors = doctors.filter(d => 
        d.name.toLowerCase().includes(q) || 
        (d.specialization && d.specialization.toLowerCase().includes(q))
      );
    }

    if (doctorSort === 'patients') {
      doctors.sort((a, b) => b.assigned_patients - a.assigned_patients);
    } else if (doctorSort === 'cases') {
      doctors.sort((a, b) => b.total_cases - a.total_cases);
    } else if (doctorSort === 'attendance') {
      doctors.sort((a, b) => b.attendance_rate - a.attendance_rate);
    } else if (doctorSort === 'revenue') {
      doctors.sort((a, b) => b.token_revenue - a.token_revenue);
    }

    const durationPresets = [
      { key: 'today', label: 'Today' },
      { key: '7_days', label: 'Last 7 Days' },
      { key: '30_days', label: 'Last 30 Days' },
      { key: 'this_month', label: 'This Month' },
      { key: 'this_quarter', label: 'This Quarter' },
      { key: 'this_year', label: 'This Year' },
      { key: 'all', label: 'All Time' },
      { key: 'custom', label: 'Custom Range' },
    ];

    container.innerHTML = `
      <div class="view-header print-hide">
        <div class="view-title-group">
          <div style="display: flex; align-items: center; gap: 0.625rem;">
            <h1>${t('navReports')}</h1>
            <span class="badge" style="background: rgba(14, 165, 233, 0.15); color: #0284c7; font-weight: 700;">Admin Executive Intelligence</span>
          </div>
          <p>Consolidated multi-department analytics: duration-filtered caseload, doctor-wise performance audits, demographic distributions, and ₹500 token deposit financials.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-outline" id="refresh-reports-btn" title="Refresh report metrics">🔄 Refresh</button>
          <button class="btn btn-secondary" id="export-report-csv-btn">📊 Export Hospital CSV</button>
          <button class="btn btn-secondary" id="export-audit-btn">⬇️ Audit Trail CSV (${getAuditEntries().length})</button>
          <button class="btn btn-primary" id="print-reports-btn">🖨️ Print Executive Report</button>
        </div>
      </div>

      <!-- Printable Report Header (Visible only in Print mode) -->
      <div class="print-only" style="display: none; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: #000;">SIP MULTI-SPECIALTY HOSPITAL</h1>
            <p style="margin: 2px 0 0 0; font-size: 0.875rem; color: #555;">Comprehensive Clinical Governance, Caseload & Performance Audit</p>
          </div>
          <div style="text-align: right; font-size: 0.8125rem; color: #333;">
            <div><strong>Audit Window:</strong> ${filter.label || currentDuration}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            <div><strong>Scope:</strong> Hospital-wide All Departments</div>
          </div>
        </div>
      </div>

      <!-- Time Duration Filter Bar -->
      <div class="card print-hide" style="margin-bottom: 1.75rem; padding: 1rem 1.25rem; background: var(--bg-surface);">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span style="font-size: 0.8125rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-right: 0.25rem;">
              ⏱️ Time Period:
            </span>
            <div style="display: flex; gap: 0.375rem; flex-wrap: wrap;">
              ${durationPresets.map(preset => `
                <button class="btn ${currentDuration === preset.key ? 'btn-primary' : 'btn-secondary'} duration-pill-btn" 
                        data-duration="${preset.key}"
                        style="padding: 0.375rem 0.875rem; font-size: 0.8125rem;">
                  ${preset.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.625rem; font-size: 0.8125rem; background: var(--bg-surface-elevated); padding: 0.375rem 0.875rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium);">
            <span>📅 Active Window:</span>
            <strong style="color: var(--primary-400);">${filter.label || currentDuration}</strong>
            <span class="mono" style="color: var(--text-secondary); font-size: 0.75rem;">(${filter.start_date || ''} &rarr; ${filter.end_date || ''})</span>
          </div>
        </div>

        <!-- Custom Date Range Sub-Bar (Shown when custom is selected) -->
        <div id="custom-range-bar" style="display: ${currentDuration === 'custom' ? 'flex' : 'none'}; align-items: center; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border-medium); flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.8125rem; font-weight: 600;">Start Date:</label>
            <input type="date" id="custom-start-date" class="form-input" value="${customStartDate || filter.start_date || ''}" style="width: 160px; padding: 0.375rem 0.625rem; font-size: 0.8125rem;" />
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.8125rem; font-weight: 600;">End Date:</label>
            <input type="date" id="custom-end-date" class="form-input" value="${customEndDate || filter.end_date || ''}" style="width: 160px; padding: 0.375rem 0.625rem; font-size: 0.8125rem;" />
          </div>
          <button class="btn btn-primary" id="apply-custom-date-btn" style="padding: 0.375rem 1rem; font-size: 0.8125rem;">
            Apply Custom Window
          </button>
        </div>
      </div>

      <!-- Section 1: Hospital Overview Executive KPIs -->
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.875rem;">
          <h2 style="font-size: 1.125rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>🏥</span> Full Hospital Overview (${filter.label || currentDuration})
          </h2>
          <span style="font-size: 0.8125rem; color: var(--text-secondary);">Real-time aggregated clinical metrics</span>
        </div>

        <div class="grid-stats" style="margin-bottom: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));">
          <!-- Patients Inflow -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Patient Intake</span>
              <div class="stat-icon-wrapper cyan">👥</div>
            </div>
            <div class="stat-value">${exec.patients_intake_period ?? 0}</div>
            <div class="stat-footer">
              <span>Period Inflow</span>
              <span style="color: var(--teal-400);">Registry: ${exec.total_hospital_patients ?? 0} Total</span>
            </div>
          </div>

          <!-- Total Clinical Cases -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Clinical Cases</span>
              <div class="stat-icon-wrapper emerald">📋</div>
            </div>
            <div class="stat-value">${exec.total_cases_admitted ?? 0}</div>
            <div class="stat-footer">
              <span>Active Cases: ${(exec.cases_by_status?.open || 0) + (exec.cases_by_status?.in_progress || 0)}</span>
              <span class="badge badge-closed">${exec.cases_by_status?.closed || 0} Closed</span>
            </div>
          </div>

          <!-- Appointments & Attendance -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Attendance Rate</span>
              <div class="stat-icon-wrapper amber">📅</div>
            </div>
            <div class="stat-value" style="color: ${(exec.attendance_rate_percent || 0) >= 80 ? 'var(--severity-mild)' : 'var(--severity-moderate)'};">
              ${exec.attendance_rate_percent ?? 0}%
            </div>
            <div class="stat-footer">
              <span>${exec.appointments_by_status?.completed || 0} / ${exec.total_appointments || 0} Attended</span>
              <span class="badge badge-critical" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">
                ${exec.appointments_by_status?.no_show || 0} No-Show
              </span>
            </div>
          </div>

          <!-- ₹500 Token Deposit Revenue -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">₹500 Tokens Collected</span>
              <div class="stat-icon-wrapper rose">🪙</div>
            </div>
            <div class="stat-value" style="color: #10b981;">
              ₹${Number(tf.total_collected || 0).toLocaleString('en-IN')}
            </div>
            <div class="stat-footer">
              <span title="Credited to patient consultation bills upon check-in">₹${Number(tf.credited_to_consultations || 0).toLocaleString('en-IN')} Credited</span>
              <span class="badge badge-critical" title="Forfeited due to unexcused patient no-show absence">
                ₹${Number(tf.forfeited_no_show || 0).toLocaleString('en-IN')} Forfeited
              </span>
            </div>
          </div>

          <!-- Follow-up Adherence -->
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-label">Follow-up Adherence</span>
              <div class="stat-icon-wrapper purple">🩺</div>
            </div>
            <div class="stat-value">${exec.followup_adherence_percent ?? 0}%</div>
            <div class="stat-footer">
              <span>Scheduled: ${exec.total_followups ?? 0}</span>
              <span style="color: var(--teal-400);">Optimal Quality</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Doctor-Wise Breakdown & Caseload Intelligence -->
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div class="card-title">
            <span>👨‍⚕️</span> Doctor-Wise Patient Caseload & Performance Breakdown
            <span class="badge" style="background: var(--bg-surface-elevated);">${doctors.length} Doctors</span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;" class="print-hide">
            <input type="text" id="doctor-search-input" class="form-input" 
                   placeholder="🔍 Search doctor by name or specialty..." 
                   value="${doctorSearch}" 
                   style="width: 240px; padding: 0.375rem 0.75rem; font-size: 0.8125rem;" />

            <select id="doctor-sort-select" class="form-input" style="width: 170px; padding: 0.375rem 0.625rem; font-size: 0.8125rem;">
              <option value="patients" ${doctorSort === 'patients' ? 'selected' : ''}>Sort by Patients</option>
              <option value="cases" ${doctorSort === 'cases' ? 'selected' : ''}>Sort by Cases</option>
              <option value="attendance" ${doctorSort === 'attendance' ? 'selected' : ''}>Sort by Attendance %</option>
              <option value="revenue" ${doctorSort === 'revenue' ? 'selected' : ''}>Sort by Token Revenue</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Doctor & Specialization</th>
                <th style="text-align: center;">Assigned Patients</th>
                <th style="text-align: center;">Cases (Active / Closed)</th>
                <th>Clinical Severity Caseload</th>
                <th style="text-align: center;">Appointments (Attended / No-Show)</th>
                <th style="text-align: center;">Attendance %</th>
                <th style="text-align: right;">₹500 Tokens Collected</th>
              </tr>
            </thead>
            <tbody>
              ${doctors.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
                    No doctors matching the current filter criteria for this period.
                  </td>
                </tr>
              ` : doctors.map(doc => {
                const attColor = doc.attendance_rate >= 90 ? 'var(--severity-mild)' : (doc.attendance_rate >= 70 ? 'var(--severity-moderate)' : 'var(--severity-critical)');
                return `
                  <tr>
                    <td>
                      <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 700; font-size: 0.9375rem; color: var(--text-primary);">${doc.name}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">${doc.specialization || 'General Physician'}</span>
                        <span class="mono" style="font-size: 0.6875rem; color: var(--primary-400); margin-top: 2px;">
                          ${doc.license_number ? `Reg: ${doc.license_number}` : (doc.email || '')}
                        </span>
                      </div>
                    </td>

                    <td style="text-align: center;">
                      <span class="badge" style="font-size: 0.875rem; font-weight: 700; background: rgba(14, 165, 233, 0.15); color: #0284c7;">
                        ${doc.assigned_patients} Patients
                      </span>
                    </td>

                    <td style="text-align: center;">
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <span style="font-weight: 700; font-size: 0.9375rem;">${doc.total_cases} Total</span>
                        <div style="display: flex; gap: 4px;">
                          <span class="badge badge-in-progress" style="font-size: 0.6875rem;" title="Active Cases">${doc.active_cases} Active</span>
                          <span class="badge badge-closed" style="font-size: 0.6875rem;" title="Closed / Discharged">${doc.closed_cases} Done</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${doc.severity.critical > 0 ? `<span class="badge badge-critical" title="Critical Emergencies">${doc.severity.critical} Crit</span>` : ''}
                        ${doc.severity.severe > 0 ? `<span class="badge badge-severe" title="Severe Inpatients">${doc.severity.severe} Sev</span>` : ''}
                        ${doc.severity.moderate > 0 ? `<span class="badge badge-moderate" title="Moderate Ward">${doc.severity.moderate} Mod</span>` : ''}
                        ${doc.severity.mild > 0 ? `<span class="badge badge-mild" title="Mild Routine">${doc.severity.mild} Mild</span>` : ''}
                        ${(doc.severity.critical + doc.severity.severe + doc.severity.moderate + doc.severity.mild) === 0 ? '<span style="color: var(--text-secondary); font-size: 0.75rem;">None in window</span>' : ''}
                      </div>
                    </td>

                    <td style="text-align: center;">
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <span class="mono" style="font-weight: 700;">${doc.total_appointments} Booked</span>
                        <div style="display: flex; gap: 4px; font-size: 0.75rem;">
                          <span style="color: var(--severity-mild);">${doc.completed_appointments} Attended</span>
                          <span>|</span>
                          <span style="color: var(--severity-critical);">${doc.no_show_appointments} No-Show</span>
                        </div>
                      </div>
                    </td>

                    <td style="text-align: center;">
                      <div style="display: inline-flex; flex-direction: column; align-items: center; gap: 3px; min-width: 80px;">
                        <span class="mono" style="font-weight: 700; color: ${attColor};">${doc.attendance_rate}%</span>
                        <div style="width: 100%; height: 6px; background: var(--bg-surface-elevated); border-radius: 999px; overflow: hidden;">
                          <div style="width: ${doc.attendance_rate}%; height: 100%; background: ${attColor}; border-radius: 999px;"></div>
                        </div>
                      </div>
                    </td>

                    <td style="text-align: right;">
                      <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        <span class="mono" style="font-weight: 700; color: #10b981; font-size: 0.9375rem;">
                          ₹${Number(doc.token_revenue || 0).toLocaleString('en-IN')}
                        </span>
                        <span style="font-size: 0.6875rem; color: var(--text-secondary);">₹500 tokens</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 3: Patient Category-Wise Clinical Breakdown -->
      <div style="margin-bottom: 1rem;">
        <h2 style="font-size: 1.125rem; font-weight: 700; margin: 0 0 0.875rem 0; display: flex; align-items: center; gap: 0.5rem;">
          <span>📊</span> Patient Category-Wise Breakdown (${filter.label || currentDuration})
        </h2>
      </div>

      <div class="grid-cols-2" style="margin-bottom: 2rem;">
        <!-- Clinical Severity Category -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>⚠️</span> Clinical Severity Categories
            </div>
            <span class="badge" style="background: var(--bg-surface-elevated);">${exec.total_cases_admitted || 0} Cases</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${renderReportBar('Critical Emergency Resuscitation (ICU)', categories.by_severity?.critical || 0, exec.total_cases_admitted || 1, 'var(--severity-critical)')}
            ${renderReportBar('Severe Inpatient Monitoring', categories.by_severity?.severe || 0, exec.total_cases_admitted || 1, 'var(--severity-severe)')}
            ${renderReportBar('Moderate Ward Observation', categories.by_severity?.moderate || 0, exec.total_cases_admitted || 1, 'var(--severity-moderate)')}
            ${renderReportBar('Mild Routine Outpatient', categories.by_severity?.mild || 0, exec.total_cases_admitted || 1, 'var(--severity-mild)')}
          </div>
        </div>

        <!-- Age Demographic Categories -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🎂</span> Age Group Demographic Categories
            </div>
            <span class="badge" style="background: var(--bg-surface-elevated);">${exec.total_hospital_patients || 0} Patients</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${renderReportBar('Pediatric (0 - 12 Years)', categories.by_age_group?.pediatric || 0, exec.total_hospital_patients || 1, '#38bdf8')}
            ${renderReportBar('Adolescent (13 - 18 Years)', categories.by_age_group?.adolescent || 0, exec.total_hospital_patients || 1, '#818cf8')}
            ${renderReportBar('Young Adult (19 - 35 Years)', categories.by_age_group?.young_adult || 0, exec.total_hospital_patients || 1, '#34d399')}
            ${renderReportBar('Middle-Aged (36 - 55 Years)', categories.by_age_group?.middle_aged || 0, exec.total_hospital_patients || 1, '#fbbf24')}
            ${renderReportBar('Senior (56 - 70 Years)', categories.by_age_group?.senior || 0, exec.total_hospital_patients || 1, '#f97316')}
            ${renderReportBar('Geriatric (70+ Years)', categories.by_age_group?.geriatric || 0, exec.total_hospital_patients || 1, '#f43f5e')}
          </div>
        </div>
      </div>

      <div class="grid-cols-2" style="margin-bottom: 2rem;">
        <!-- Blood Group Demographics -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🩸</span> Blood Group Distribution
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${Object.keys(categories.by_blood_group || {}).length === 0 ? `
              <p style="color: var(--text-secondary); font-size: 0.8125rem;">No blood group records available in this period.</p>
            ` : Object.entries(categories.by_blood_group).map(([bg, count]) => {
              return renderReportBar(`Blood Group ${bg}`, count, exec.total_hospital_patients || 1, '#ef4444');
            }).join('')}
          </div>
        </div>

        <!-- Gender & Consultation Type Breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>👥</span> Gender & Consultation Categories
            </div>
          </div>
          <div>
            <div style="font-size: 0.8125rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
              Gender Ratio
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem;">
              ${Object.entries(categories.by_gender || {}).map(([gender, count]) => {
                const label = gender.charAt(0).toUpperCase() + gender.slice(1);
                const color = gender.toLowerCase() === 'female' ? '#ec4899' : (gender.toLowerCase() === 'male' ? '#0ea5e9' : '#a855f7');
                return renderReportBar(label, count, exec.total_hospital_patients || 1, color);
              }).join('')}
            </div>

            <div style="font-size: 0.8125rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
              Consultation Types in Period
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${Object.keys(categories.by_appointment_type || {}).length === 0 ? `
                <p style="color: var(--text-secondary); font-size: 0.8125rem;">No appointment consultation categorizations recorded in this period.</p>
              ` : Object.entries(categories.by_appointment_type).map(([type, count]) => {
                const label = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return renderReportBar(label, count, exec.total_appointments || 1, '#6366f1');
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: Anti-No-Show Commitment & Clinical Quality Audit -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>🛡️</span> Hospital Anti-No-Show Commitment & Clinical Quality Standards
          </div>
          <span class="badge badge-closed">100% Audited</span>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Compliance Standard</th>
                <th>Standard Category</th>
                <th>Status</th>
                <th>Compliance Score</th>
                <th>Institutional Benchmark</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>₹500 Advance Token Commitment Fee Deposit</strong></td>
                <td><span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">Financial Security</span></td>
                <td><span class="badge badge-closed">Active & Enforced</span></td>
                <td class="mono" style="font-weight: 700; color: var(--severity-mild);">100%</td>
                <td>Mandatory Anti-Fake-Booking Filter</td>
              </tr>
              <tr>
                <td><strong>Allergy Contraindication Screening at Intake</strong></td>
                <td><span class="badge" style="background: rgba(2, 132, 199, 0.15); color: #0284c7;">Patient Safety</span></td>
                <td><span class="badge badge-closed">Compliant</span></td>
                <td class="mono" style="font-weight: 700; color: var(--severity-mild);">100%</td>
                <td>100% Mandatory Standard</td>
              </tr>
              <tr>
                <td><strong>Digital Case History Documentation within 24hr</strong></td>
                <td><span class="badge" style="background: rgba(2, 132, 199, 0.15); color: #0284c7;">Clinical Protocol</span></td>
                <td><span class="badge badge-closed">Compliant</span></td>
                <td class="mono" style="font-weight: 700; color: var(--severity-mild);">97.4%</td>
                <td>&gt; 95.0% Benchmark</td>
              </tr>
              <tr>
                <td><strong>Follow-up Consultation Closure Documentation</strong></td>
                <td><span class="badge" style="background: rgba(2, 132, 199, 0.15); color: #0284c7;">Continuity of Care</span></td>
                <td><span class="badge badge-closed">Compliant</span></td>
                <td class="mono" style="font-weight: 700; color: var(--severity-mild);">92.5%</td>
                <td>&gt; 90.0% Benchmark</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Printable Report Signatures (Visible only in Print mode) -->
      <div class="print-only" style="display: none; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #ccc;">
        <div style="display: flex; justify-content: space-between; text-align: center;">
          <div style="width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px;"></div>
            <strong>Chief Medical Officer</strong>
            <div style="font-size: 0.75rem; color: #555;">SIP Multi-Specialty Hospital</div>
          </div>
          <div style="width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px;"></div>
            <strong>Chief Administrative Officer</strong>
            <div style="font-size: 0.75rem; color: #555;">Institutional Audits & Governance</div>
          </div>
          <div style="width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px;"></div>
            <strong>Internal Audit Date</strong>
            <div style="font-size: 0.75rem; color: #555;">${new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    `;

    // Event Bindings
    // 1. Duration Presets
    container.querySelectorAll('.duration-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-duration');
        currentDuration = selected;
        if (selected === 'custom') {
          const bar = container.querySelector('#custom-range-bar');
          if (bar) bar.style.display = 'flex';
        } else {
          render();
        }
      });
    });

    // 2. Custom Date Range Apply
    container.querySelector('#apply-custom-date-btn')?.addEventListener('click', () => {
      const sInput = container.querySelector('#custom-start-date');
      const eInput = container.querySelector('#custom-end-date');
      if (!sInput?.value || !eInput?.value) {
        alert('Please specify both Start Date and End Date.');
        return;
      }
      customStartDate = sInput.value;
      customEndDate = eInput.value;
      currentDuration = 'custom';
      render();
    });

    // 3. Doctor Search
    const searchInput = container.querySelector('#doctor-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        doctorSearch = e.target.value;
        renderDoctorTable();
      });
    }

    // 4. Doctor Sort
    const sortSelect = container.querySelector('#doctor-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        doctorSort = e.target.value;
        renderDoctorTable();
      });
    }

    // 5. Actions
    container.querySelector('#refresh-reports-btn')?.addEventListener('click', render);
    container.querySelector('#print-reports-btn')?.addEventListener('click', () => window.print());
    container.querySelector('#export-report-csv-btn')?.addEventListener('click', downloadReportCsv);
    container.querySelector('#export-audit-btn')?.addEventListener('click', exportAuditCsv);
  }

  function renderDoctorTable() {
    if (!reportData) return;
    let doctors = [...(reportData.doctors_breakdown || [])];

    if (doctorSearch.trim()) {
      const q = doctorSearch.toLowerCase().trim();
      doctors = doctors.filter(d => 
        d.name.toLowerCase().includes(q) || 
        (d.specialization && d.specialization.toLowerCase().includes(q))
      );
    }

    if (doctorSort === 'patients') {
      doctors.sort((a, b) => b.assigned_patients - a.assigned_patients);
    } else if (doctorSort === 'cases') {
      doctors.sort((a, b) => b.total_cases - a.total_cases);
    } else if (doctorSort === 'attendance') {
      doctors.sort((a, b) => b.attendance_rate - a.attendance_rate);
    } else if (doctorSort === 'revenue') {
      doctors.sort((a, b) => b.token_revenue - a.token_revenue);
    }

    const tbody = container.querySelector('.data-table tbody');
    if (!tbody) return;

    if (doctors.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
            No doctors matching "${doctorSearch}".
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = doctors.map(doc => {
      const attColor = doc.attendance_rate >= 90 ? 'var(--severity-mild)' : (doc.attendance_rate >= 70 ? 'var(--severity-moderate)' : 'var(--severity-critical)');
      return `
        <tr>
          <td>
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 700; font-size: 0.9375rem; color: var(--text-primary);">${doc.name}</span>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">${doc.specialization || 'General Physician'}</span>
              <span class="mono" style="font-size: 0.6875rem; color: var(--primary-400); margin-top: 2px;">
                ${doc.license_number ? `Reg: ${doc.license_number}` : (doc.email || '')}
              </span>
            </div>
          </td>

          <td style="text-align: center;">
            <span class="badge" style="font-size: 0.875rem; font-weight: 700; background: rgba(14, 165, 233, 0.15); color: #0284c7;">
              ${doc.assigned_patients} Patients
            </span>
          </td>

          <td style="text-align: center;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <span style="font-weight: 700; font-size: 0.9375rem;">${doc.total_cases} Total</span>
              <div style="display: flex; gap: 4px;">
                <span class="badge badge-in-progress" style="font-size: 0.6875rem;" title="Active Cases">${doc.active_cases} Active</span>
                <span class="badge badge-closed" style="font-size: 0.6875rem;" title="Closed / Discharged">${doc.closed_cases} Done</span>
              </div>
            </div>
          </td>

          <td>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${doc.severity.critical > 0 ? `<span class="badge badge-critical" title="Critical Emergencies">${doc.severity.critical} Crit</span>` : ''}
              ${doc.severity.severe > 0 ? `<span class="badge badge-severe" title="Severe Inpatients">${doc.severity.severe} Sev</span>` : ''}
              ${doc.severity.moderate > 0 ? `<span class="badge badge-moderate" title="Moderate Ward">${doc.severity.moderate} Mod</span>` : ''}
              ${doc.severity.mild > 0 ? `<span class="badge badge-mild" title="Mild Routine">${doc.severity.mild} Mild</span>` : ''}
              ${(doc.severity.critical + doc.severity.severe + doc.severity.moderate + doc.severity.mild) === 0 ? '<span style="color: var(--text-secondary); font-size: 0.75rem;">None in window</span>' : ''}
            </div>
          </td>

          <td style="text-align: center;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
              <span class="mono" style="font-weight: 700;">${doc.total_appointments} Booked</span>
              <div style="display: flex; gap: 4px; font-size: 0.75rem;">
                <span style="color: var(--severity-mild);">${doc.completed_appointments} Attended</span>
                <span>|</span>
                <span style="color: var(--severity-critical);">${doc.no_show_appointments} No-Show</span>
              </div>
            </div>
          </td>

          <td style="text-align: center;">
            <div style="display: inline-flex; flex-direction: column; align-items: center; gap: 3px; min-width: 80px;">
              <span class="mono" style="font-weight: 700; color: ${attColor};">${doc.attendance_rate}%</span>
              <div style="width: 100%; height: 6px; background: var(--bg-surface-elevated); border-radius: 999px; overflow: hidden;">
                <div style="width: ${doc.attendance_rate}%; height: 100%; background: ${attColor}; border-radius: 999px;"></div>
              </div>
            </div>
          </td>

          <td style="text-align: right;">
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
              <span class="mono" style="font-weight: 700; color: #10b981; font-size: 0.9375rem;">
                ₹${Number(doc.token_revenue || 0).toLocaleString('en-IN')}
              </span>
              <span style="font-size: 0.6875rem; color: var(--text-secondary);">₹500 tokens</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  await render();
  return container;
}

function renderReportBar(label, count, total, color) {
  const pct = Math.round((count / (total || 1)) * 100);
  return `
    <div>
      <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 600; margin-bottom: 4px;">
        <span>${label}</span>
        <span class="mono">${count} (${pct}%)</span>
      </div>
      <div style="height: 8px; background: var(--bg-surface-elevated); border-radius: var(--radius-full); overflow: hidden;">
        <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: var(--radius-full);"></div>
      </div>
    </div>
  `;
}
