import { getLocale } from './i18n.js';
import { 
  mockUsers, 
  mockPatients, 
  mockCases, 
  mockAppointments, 
  mockFollowUps, 
  mockSymptoms,
  mockDashboardMetrics 
} from './mockData.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const HEALTH_URL = API_BASE_URL.endsWith('/api')
  ? `${API_BASE_URL.slice(0, -4)}/health`
  : `${API_BASE_URL}/health`;

class ApiService {
  constructor() {
    this.isBackendOnline = false;
    this.checkHealthPromise = null;
    
    // In-memory / Persisted state for Demo/Fallback Mode
    let savedPatients = null;
    try {
      const raw = localStorage.getItem('sip_demo_patients');
      if (raw) savedPatients = JSON.parse(raw);
    } catch {
      savedPatients = null;
    }
    this.localPatients = Array.isArray(savedPatients) && savedPatients.length > 0
      ? savedPatients
      : [...mockPatients];

    this.localCases = [...mockCases];
    this.localAppointments = [...mockAppointments];
    this.localFollowUps = [...mockFollowUps];
    this.localSymptoms = [...mockSymptoms];
    this.localCharges = [];
  }

  getLocalPatients() {
    try {
      const raw = localStorage.getItem('sip_demo_patients');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.localPatients = parsed;
        }
      }
    } catch {
      // ignore
    }
    return this.localPatients;
  }

  getToken() {
    return sessionStorage.getItem('sip_auth_token')
      || localStorage.getItem('sip_auth_token')
      || '';
  }

  setToken(token) {
    if (token) {
      sessionStorage.setItem('sip_auth_token', token);
      localStorage.setItem('sip_auth_token', token);
    } else {
      sessionStorage.removeItem('sip_auth_token');
      localStorage.removeItem('sip_auth_token');
    }
  }

  getHeaders(isFormData = false) {
    const headers = {
      'Accept': 'application/json',
      'Accept-Language': getLocale(),
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      let response = await fetch(HEALTH_URL, {
        signal: controller.signal,
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch(`${API_BASE_URL}/health`, {
          signal: controller.signal,
        }).catch(() => null);
      }
      
      clearTimeout(timeoutId);

      const contentType = response?.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null;
      this.isBackendOnline = !!(
        response?.ok &&
        payload?.status === 'healthy'
      );
    } catch {
      this.isBackendOnline = false;
    }

    window.dispatchEvent(new CustomEvent('backend-status', { 
      detail: { online: this.isBackendOnline } 
    }));
    return this.isBackendOnline;
  }

  async request(endpoint, options = {}) {
    await this.checkBackendHealth();

    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          cache: 'no-store',
          headers: {
            ...this.getHeaders(options.body instanceof FormData),
            ...(options.headers || {}),
          },
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
          ? await res.json().catch(() => ({}))
          : {};
        if (!contentType.includes('application/json')) {
          throw new Error('The API returned an invalid response. Check VITE_API_URL and the Laravel deployment.');
        }
        if (!res.ok) {
          throw new Error(data.message || `Request failed with status ${res.status}`);
        }
        return data;
      } catch (err) {
        console.warn(`[Live API Error on ${endpoint}] Falling back to local data. Reason:`, err.message);
      }
    }

    // Local / Demo fallback handler
    return this.mockHandler(endpoint, options);
  }

  async stream(endpoint, onEvent) {
    if (!this.isBackendOnline || !this.getToken() || this.getToken().startsWith('demo_sanctum_token_')) {
      return () => {};
    }

    const controller = new AbortController();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getHeaders(),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Live update stream failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    (async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';
          messages.forEach(message => {
            const data = message.match(/^data:\s*(.+)$/m)?.[1];
            if (data) onEvent(JSON.parse(data));
          });
        }
      } catch (error) {
        if (error.name !== 'AbortError') console.warn('[Live update stream]', error.message);
      }
    })();

    return () => controller.abort();
  }

  // Graceful Offline / Demo simulation
  async mockHandler(endpoint, options) {
    const method = options.method || 'GET';
    const [path] = endpoint.split('?');
    const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null;
    const demoUserId = Number(this.getToken().match(/demo_sanctum_token_(\d+)/)?.[1] || 0);
    const demoUser = mockUsers.find(user => user.id === demoUserId);
    const doctorCases = demoUser?.role === 'doctor'
      ? this.localCases.filter(item => item.doctor_id === demoUser.id)
      : this.localCases;
    const doctorAppointments = demoUser?.role === 'doctor'
      ? this.localAppointments.filter(item => item.doctor_id === demoUser.id)
      : this.localAppointments;

    // Simulate subtle realistic network latency (150ms)
    await new Promise(r => setTimeout(r, 120));

    // Auth Login
    if (path === '/auth/login' && method === 'POST') {
      const user = mockUsers.find(u => u.email === body.email);
      const demoPasswords = {
        'admin@sip.org': 'Admin@12345',
        'dr.rajesh@sip.org': 'Doctor@12345',
        'dr.priya@sip.org': 'Doctor@12345',
        'dr.anand@sip.org': 'Doctor@12345',
        'staff@sip.org': 'Staff@12345',
      };

      if (user && body.password === demoPasswords[user.email]) {
        const fakeToken = `demo_sanctum_token_${user.id}_${Date.now()}`;
        return {
          success: true,
          message: 'Logged in successfully (Demo Simulation).',
          data: { user, token: fakeToken, token_type: 'Bearer' }
        };
      }
      throw new Error('Invalid email or password. Use the credentials shown in the demo login panel.');
    }

    // Presence
    if (endpoint.startsWith('/presence')) {
      const now = Date.now();
      let presences = [];
      try {
        presences = JSON.parse(localStorage.getItem('sip_active_presences') || '[]');
      } catch {
        presences = [];
      }
      if (path === '/presence/heartbeat' && method === 'POST') {
        const clientId = body?.client_id || 'demo_client';
        const device = body?.device || 'Web Browser';
        presences = presences.filter(p => (now - p.last_seen) < 30000 && p.client_id !== clientId);
        presences.push({
          client_id: clientId,
          user_id: demoUser?.id || 1,
          name: demoUser?.name || 'Demo User',
          role: demoUser?.role || 'staff',
          device: device,
          last_seen: now,
        });
        try { localStorage.setItem('sip_active_presences', JSON.stringify(presences)); } catch {}
        return { success: true, data: presences, message: 'Heartbeat acknowledged' };
      }
      if (path === '/presence/active-users') {
        const active = presences.filter(p => (now - p.last_seen) < 30000);
        return { success: true, data: active };
      }
    }

    // Dashboard
    if (endpoint.startsWith('/dashboard')) {
      const currentPatients = this.getLocalPatients();
      return {
        success: true,
        data: {
          metrics: {
            total_patients: demoUser?.role === 'doctor'
              ? currentPatients.filter(patient => patient.primary_doctor_id === demoUser.id || doctorCases.some(item => item.patient_id === patient.id)).length
              : currentPatients.length,
            total_doctors: mockUsers.filter(u => u.role === 'doctor').length,
            total_cases: doctorCases.length,
            active_cases: doctorCases.filter(c => c.status !== 'closed').length,
            critical_cases: doctorCases.filter(c => c.severity === 'critical' && c.status !== 'closed').length,
            today_appointments: doctorAppointments.length,
            pending_follow_ups: demoUser?.role === 'doctor'
              ? this.localFollowUps.filter(f => f.status === 'pending' && f.doctor_id === demoUser.id).length
              : this.localFollowUps.filter(f => f.status === 'pending').length,
          },
          cases_by_status: {
            open: doctorCases.filter(c => c.status === 'open').length,
            in_progress: doctorCases.filter(c => c.status === 'in_progress').length,
            closed: doctorCases.filter(c => c.status === 'closed').length,
            referred: doctorCases.filter(c => c.status === 'referred').length,
          },
          cases_by_severity: {
            mild: doctorCases.filter(c => c.severity === 'mild').length,
            moderate: doctorCases.filter(c => c.severity === 'moderate').length,
            severe: doctorCases.filter(c => c.severity === 'severe').length,
            critical: doctorCases.filter(c => c.severity === 'critical').length,
          },
          recent_cases: doctorCases.slice(0, 5),
          upcoming_appointments: doctorAppointments.slice(0, 5),
          today_appointments: doctorAppointments.slice(0, 5),
        }
      };
    }

    // Patients
    if (endpoint.startsWith('/patients')) {
      const allPatients = this.getLocalPatients();
      if (path === '/patients/sync') {
        return {
          success: true,
          data: {
            count: allPatients.length,
            last_updated: allPatients[0]?.updated_at || new Date().toISOString(),
            latest_patient: allPatients[0] || null,
          }
        };
      }
      if (path === '/patients' && method === 'GET') {
        const patients = demoUser?.role === 'doctor'
          ? allPatients.filter(patient => patient.primary_doctor_id === demoUser.id || doctorCases.some(item => item.patient_id === patient.id))
          : allPatients;
        return { success: true, data: { data: patients, total: patients.length } };
      }
      if (path === '/patients' && method === 'POST') {
        const newPatient = {
          id: allPatients.length + 1,
          uhid: body.uhid || `UHID-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          first_name: body.first_name,
          last_name: body.last_name,
          full_name: `${body.first_name} ${body.last_name}`,
          gender: body.gender,
          age: parseInt(body.age) || 30,
          dob: body.dob || '1995-01-01',
          blood_group: body.blood_group || 'O+',
          phone: body.phone,
          email: body.email,
          address: body.address || 'Local Clinic',
          city: body.city || 'Ahmedabad',
          emergency_contact_name: body.emergency_contact_name || 'Relative',
          emergency_contact_phone: body.emergency_contact_phone || body.phone,
          is_active: true,
          primary_doctor_id: body.primary_doctor_id ? parseInt(body.primary_doctor_id) : null,
          primary_doctor: body.primary_doctor_id ? mockUsers.find(user => user.id === parseInt(body.primary_doctor_id)) : null,
          medical_history: {
            allergies: body.allergies ? body.allergies.split(',').map(s => s.trim()) : [],
            chronic_diseases: body.chronic_diseases ? body.chronic_diseases.split(',').map(s => s.trim()) : [],
            past_surgeries: body.past_surgeries || 'None reported',
            current_medications: body.current_medications || 'None',
          },
          cases_count: 0
        };
        this.localPatients.unshift(newPatient);
        try {
          localStorage.setItem('sip_demo_patients', JSON.stringify(this.localPatients));
        } catch { /* ignore */ }
        return { success: true, data: newPatient, message: 'Patient registered successfully.' };
      }
      // Specific patient by ID
      const match = endpoint.match(/\/patients\/(\d+)/);
      if (match) {
        const patient = this.localPatients.find(p => p.id === parseInt(match[1]));
        if (patient) {
          const patientCases = this.localCases.filter(c => c.patient_id === patient.id);
          const patientApts = this.localAppointments.filter(a => a.patient_id === patient.id);
          return {
            success: true,
            data: {
              ...patient,
              cases: patientCases,
              appointments: patientApts,
              medicalHistory: patient.medical_history
            }
          };
        }
      }
    }

    // Cases
    if (endpoint.startsWith('/cases')) {
      if (path === '/cases' && method === 'GET') {
        return { success: true, data: { data: doctorCases, total: doctorCases.length } };
      }
      if (path === '/cases' && method === 'POST') {
        const patient = this.localPatients.find(p => p.id === parseInt(body.patient_id)) || this.localPatients[0];
        const doctor = mockUsers.find(u => u.id === parseInt(body.doctor_id)) || mockUsers[1];
        const newCase = {
          id: this.localCases.length + 1,
          case_number: `CASE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
          patient_id: patient.id,
          patient: {
            id: patient.id,
            uhid: patient.uhid,
            first_name: patient.first_name,
            last_name: patient.last_name,
            phone: patient.phone,
            gender: patient.gender,
            age: patient.age
          },
          doctor_id: doctor.id,
          doctor: {
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization
          },
          title: body.title || 'Digital Clinical Consultation',
          diagnosis: body.diagnosis,
          severity: body.severity || 'moderate',
          status: 'open',
          admission_date: new Date().toISOString(),
          description: body.description || '',
          symptoms: body.symptoms || [],
          prescriptions: [],
          treatments: []
        };
        this.localCases.unshift(newCase);
        return { success: true, data: newCase, message: 'Case record created successfully.' };
      }
      
      const caseMatch = endpoint.match(/\/cases\/(\d+)/);
      if (caseMatch) {
        const caseRecord = this.localCases.find(c => c.id === parseInt(caseMatch[1]));
        if (caseRecord) {
          if (endpoint.includes('/status') && method === 'PATCH') {
            caseRecord.status = body.status;
            return { success: true, data: caseRecord, message: `Status updated to ${body.status}` };
          }
          return { success: true, data: caseRecord };
        }
      }
    }

    // Charges
    if (endpoint.startsWith('/charges') && method === 'GET') {
      let charges = this.localCharges;
      const patientId = new URLSearchParams(endpoint.split('?')[1] || '').get('patient_id');
      const caseId = new URLSearchParams(endpoint.split('?')[1] || '').get('case_record_id');
      if (patientId) charges = charges.filter(charge => charge.patient_id === Number(patientId));
      if (caseId) charges = charges.filter(charge => charge.case_record_id === Number(caseId));
      return { success: true, data: charges };
    }
    if (path === '/charges' && method === 'POST') {
      const charge = {
        id: this.localCharges.length + 1,
        case_record_id: Number(body.case_record_id),
        patient_id: Number(body.patient_id || 0),
        description: body.description,
        amount: Number(body.amount),
        status: body.status || 'pending',
        receipt_number: body.status === 'paid' ? `RCT-${Date.now()}` : null,
        created_at: new Date().toISOString(),
      };
      this.localCharges.unshift(charge);
      return { success: true, data: charge, message: 'Charge added successfully.' };
    }

    // Symptoms
    if (path === '/symptoms') {
      return { success: true, data: this.localSymptoms };
    }

    // Appointments
    if (endpoint.startsWith('/appointments')) {
      if (method === 'GET') {
        return { success: true, data: { data: doctorAppointments } };
      }
      if (method === 'POST') {
        const patient = this.localPatients.find(p => p.id === parseInt(body.patient_id)) || this.localPatients[0];
        const doctor = mockUsers.find(u => u.id === parseInt(body.doctor_id)) || mockUsers[1];
        const tokenAmount = body.token_amount !== undefined ? Number(body.token_amount) : 500;
        const paymentStatus = body.payment_status || 'paid';
        const paymentMethod = body.payment_method || 'UPI';
        const txnId = body.transaction_id || `TXN-SIP-${Date.now().toString(36).toUpperCase()}`;

        const newApt = {
          id: this.localAppointments.length + 1,
          appointment_number: `APT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
          patient_id: patient.id,
          patient: { id: patient.id, uhid: patient.uhid, first_name: patient.first_name, last_name: patient.last_name, phone: patient.phone, gender: patient.gender, age: patient.age },
          doctor_id: doctor.id,
          doctor: { id: doctor.id, name: doctor.name, specialization: doctor.specialization },
          scheduled_at: body.scheduled_at || new Date().toISOString(),
          reason: body.reason || 'General Follow-up Consultation',
          type: body.type || 'consultation',
          status: 'scheduled',
          token_amount: tokenAmount,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          transaction_id: txnId,
          paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
          remarks: body.remarks || `Advance token deposit of ₹${tokenAmount} received via ${paymentMethod}.`,
        };
        this.localAppointments.unshift(newApt);

        // Record charge in billing
        if (paymentStatus === 'paid' && tokenAmount > 0) {
          this.localCharges.unshift({
            id: this.localCharges.length + 1,
            patient_id: patient.id,
            description: `Consultation Advance Token Deposit (${newApt.appointment_number})`,
            amount: tokenAmount,
            status: 'paid',
            receipt_number: `RCT-${Date.now().toString(36).toUpperCase()}`,
            created_at: new Date().toISOString(),
          });
        }

        return { success: true, data: newApt, message: `Appointment booked with ₹${tokenAmount} commitment token confirmed.` };
      }
      const aptMatch = endpoint.match(/\/appointments\/(\d+)\/status/);
      if (aptMatch && method === 'PATCH') {
        const apt = this.localAppointments.find(a => a.id === parseInt(aptMatch[1]));
        if (apt) {
          apt.status = body.status;
          if (body.status === 'no_show') {
            apt.remarks = `Patient did not attend scheduled consultation. ₹${apt.token_amount || 500} token deposit forfeited.`;
          }
          return { success: true, data: apt, message: 'Appointment status updated.' };
        }
      }
    }

    // Follow-ups
    if (endpoint.startsWith('/follow-ups')) {
      if (path === '/follow-ups' || path === '/follow-ups/pending') {
        return { success: true, data: { data: this.localFollowUps } };
      }
      const followUpMatch = endpoint.match(/\/follow-ups\/(\d+)\/complete/);
      if (followUpMatch && method === 'POST') {
        const f = this.localFollowUps.find(item => item.id === parseInt(followUpMatch[1]));
        if (f) {
          f.status = 'completed';
          f.findings = body.findings || 'Patient reviewed and clinically stabilized.';
          f.recommendations = body.recommendations || 'Continue prescribed medicine and lifestyle adjustments.';
          return { success: true, data: f, message: 'Follow-up marked as completed.' };
        }
      }
    }

    // Doctors
    if (endpoint.startsWith('/doctors')) {
      return { 
        success: true, 
        data: { 
          data: mockUsers.filter(u => u.role === 'doctor').map(d => ({
            ...d,
            active_cases_count: this.localCases.filter(c => c.doctor_id === d.id && c.status !== 'closed').length,
            today_appointments_count: this.localAppointments.filter(a => a.doctor_id === d.id).length
          })) 
        } 
      };
    }

    // Reports: Comprehensive Hospital Summary & Doctor/Patient Breakdown
    if (endpoint.startsWith('/reports/hospital-summary')) {
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const duration = urlParams.get('duration') || '30_days';
      const customStart = urlParams.get('start_date');
      const customEnd = urlParams.get('end_date');

      const now = new Date();
      let start = new Date();
      let end = new Date();
      let label = 'Last 30 Days';

      if (duration === 'today') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        label = `Today (${now.toLocaleDateString()})`;
      } else if (duration === '7_days') {
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        label = `Last 7 Days (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
      } else if (duration === '30_days') {
        start.setDate(now.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        label = `Last 30 Days (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
      } else if (duration === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        label = `This Month (${now.toLocaleString('default', { month: 'long', year: 'numeric' })})`;
      } else if (duration === 'this_quarter') {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterMonth, 1);
        end = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59);
        label = `This Quarter (Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()})`;
      } else if (duration === 'this_year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        label = `This Year (${now.getFullYear()})`;
      } else if (duration === 'all') {
        start = new Date(2020, 0, 1);
        end = new Date();
        label = 'All Time Record';
      } else if (customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd + 'T23:59:59');
        label = `Custom (${customStart} - ${customEnd})`;
      }

      const patients = this.getLocalPatients();
      const cases = this.localCases;
      const appointments = this.localAppointments;
      const followUps = this.localFollowUps;

      const inPeriodCases = cases.filter(c => {
        const d = new Date(c.admission_date || c.created_at || now);
        return d >= start && d <= end;
      });

      const inPeriodApts = appointments.filter(a => {
        const d = new Date(a.scheduled_at || now);
        return d >= start && d <= end;
      });

      const inPeriodPatients = patients.filter(p => {
        const d = new Date(p.created_at || now);
        return d >= start && d <= end;
      });

      const casesByStatus = {
        open: inPeriodCases.filter(c => c.status === 'open').length,
        in_progress: inPeriodCases.filter(c => c.status === 'in_progress').length,
        closed: inPeriodCases.filter(c => c.status === 'closed').length,
        referred: inPeriodCases.filter(c => c.status === 'referred').length,
      };

      const casesBySeverity = {
        critical: inPeriodCases.filter(c => c.severity === 'critical').length,
        severe: inPeriodCases.filter(c => c.severity === 'severe').length,
        moderate: inPeriodCases.filter(c => c.severity === 'moderate').length,
        mild: inPeriodCases.filter(c => c.severity === 'mild').length,
      };

      const aptsByStatus = {
        scheduled: inPeriodApts.filter(a => a.status === 'scheduled').length,
        completed: inPeriodApts.filter(a => a.status === 'completed').length,
        no_show: inPeriodApts.filter(a => a.status === 'no_show').length,
        cancelled: inPeriodApts.filter(a => a.status === 'cancelled').length,
      };

      const concluded = aptsByStatus.completed + aptsByStatus.no_show;
      const attendanceRate = concluded > 0 ? Math.round((aptsByStatus.completed / concluded) * 1000) / 10 : (inPeriodApts.length > 0 ? 100 : 0);
      const noShowRate = concluded > 0 ? Math.round((aptsByStatus.no_show / concluded) * 1000) / 10 : 0;

      const tokenCollected = inPeriodApts.reduce((acc, a) => (a.payment_status === 'paid' ? acc + (Number(a.token_amount) || 500) : acc), 0);
      const tokenCredited = inPeriodApts.reduce((acc, a) => (a.payment_status === 'paid' && a.status === 'completed' ? acc + (Number(a.token_amount) || 500) : acc), 0);
      const tokenForfeited = inPeriodApts.reduce((acc, a) => (a.status === 'no_show' ? acc + (Number(a.token_amount) || 500) : acc), 0);
      const tokenEscrow = inPeriodApts.reduce((acc, a) => (a.payment_status === 'paid' && a.status === 'scheduled' ? acc + (Number(a.token_amount) || 500) : acc), 0);

      const ageCategories = {
        pediatric: patients.filter(p => Number(p.age) <= 12).length,
        adolescent: patients.filter(p => Number(p.age) >= 13 && Number(p.age) <= 18).length,
        young_adult: patients.filter(p => Number(p.age) >= 19 && Number(p.age) <= 35).length,
        middle_aged: patients.filter(p => Number(p.age) >= 36 && Number(p.age) <= 55).length,
        senior: patients.filter(p => Number(p.age) >= 56 && Number(p.age) <= 70).length,
        geriatric: patients.filter(p => Number(p.age) > 70).length,
      };

      const genderDistribution = {};
      patients.forEach(p => {
        const g = (p.gender || 'other').toLowerCase();
        genderDistribution[g] = (genderDistribution[g] || 0) + 1;
      });

      const bloodGroupDistribution = {};
      patients.forEach(p => {
        const bg = p.blood_group || 'Unknown';
        bloodGroupDistribution[bg] = (bloodGroupDistribution[bg] || 0) + 1;
      });

      const appointmentTypes = {};
      inPeriodApts.forEach(a => {
        const t = a.type || 'consultation';
        appointmentTypes[t] = (appointmentTypes[t] || 0) + 1;
      });

      const doctorsList = mockUsers.filter(u => u.role === 'doctor').map(doc => {
        const docCases = inPeriodCases.filter(c => c.doctor_id === doc.id);
        const docApts = inPeriodApts.filter(a => a.doctor_id === doc.id);
        const docCompleted = docApts.filter(a => a.status === 'completed').length;
        const docNoShow = docApts.filter(a => a.status === 'no_show').length;
        const docConcluded = docCompleted + docNoShow;
        const docAttRate = docConcluded > 0 ? Math.round((docCompleted / docConcluded) * 1000) / 10 : (docApts.length > 0 ? 100 : 0);
        const docRev = docApts.reduce((acc, a) => (a.payment_status === 'paid' ? acc + (Number(a.token_amount) || 500) : acc), 0);

        const assignedPatients = new Set([
          ...docCases.map(c => c.patient_id),
          ...docApts.map(a => a.patient_id)
        ]).size;

        return {
          id: doc.id,
          name: doc.name,
          email: doc.email,
          specialization: doc.specialization || 'General Physician',
          phone: doc.phone || '+91 9800000000',
          license_number: doc.license_number || 'GMC-VERIFIED',
          assigned_patients: assignedPatients,
          total_cases: docCases.length,
          active_cases: docCases.filter(c => c.status !== 'closed').length,
          closed_cases: docCases.filter(c => c.status === 'closed').length,
          severity: {
            critical: docCases.filter(c => c.severity === 'critical').length,
            severe: docCases.filter(c => c.severity === 'severe').length,
            moderate: docCases.filter(c => c.severity === 'moderate').length,
            mild: docCases.filter(c => c.severity === 'mild').length,
          },
          total_appointments: docApts.length,
          completed_appointments: docCompleted,
          no_show_appointments: docNoShow,
          scheduled_appointments: docApts.filter(a => a.status === 'scheduled').length,
          cancelled_appointments: docApts.filter(a => a.status === 'cancelled').length,
          attendance_rate: docAttRate,
          token_revenue: docRev,
        };
      });

      return {
        success: true,
        data: {
          filter: {
            duration,
            label,
            start_date: start.toISOString().slice(0, 10),
            end_date: end.toISOString().slice(0, 10),
          },
          executive_summary: {
            patients_intake_period: inPeriodPatients.length || patients.length,
            total_hospital_patients: patients.length,
            total_cases_admitted: inPeriodCases.length || cases.length,
            cases_by_status: casesByStatus,
            cases_by_severity: casesBySeverity,
            total_appointments: inPeriodApts.length,
            appointments_by_status: aptsByStatus,
            attendance_rate_percent: attendanceRate,
            no_show_rate_percent: noShowRate,
            total_followups: followUps.length,
            followup_adherence_percent: 91.2,
            token_financials: {
              currency: 'INR',
              token_unit_fee: 500,
              total_collected: tokenCollected,
              credited_to_consultations: tokenCredited,
              forfeited_no_show: tokenForfeited,
              held_in_escrow: tokenEscrow,
            }
          },
          patient_categories: {
            by_severity: casesBySeverity,
            by_age_group: ageCategories,
            by_gender: genderDistribution,
            by_blood_group: bloodGroupDistribution,
            by_appointment_type: appointmentTypes,
          },
          doctors_breakdown: doctorsList,
        },
        message: 'Comprehensive hospital summary report generated successfully.'
      };
    }

    // Generic response fallback
    return { success: true, message: 'Action simulated successfully.', data: {} };
  }
}

export const api = new ApiService();
