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

// Base API URL (proxied via Vite to http://127.0.0.1:8000/api)
const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.isBackendOnline = false;
    this.checkHealthPromise = null;
    
    // In-memory state for Demo/Fallback Mode
    this.localPatients = [...mockPatients];
    this.localCases = [...mockCases];
    this.localAppointments = [...mockAppointments];
    this.localFollowUps = [...mockFollowUps];
    this.localSymptoms = [...mockSymptoms];
  }

  getToken() {
    return localStorage.getItem('sip_auth_token') || '';
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('sip_auth_token', token);
    } else {
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
      
      const response = await fetch(`${API_BASE_URL}/../health`, {
        signal: controller.signal,
      }).catch(() => null);
      
      clearTimeout(timeoutId);

      this.isBackendOnline = !!(response && (response.status === 200 || response.status === 404));
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
          headers: {
            ...this.getHeaders(options.body instanceof FormData),
            ...(options.headers || {}),
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Request failed with status ${res.status}`);
        }
        return data;
      } catch (err) {
        console.warn(`[Live API Error on ${endpoint}] Falling back to local data. Reason:`, err.message);
      }
    }

    // Local fallback handler
    return this.mockHandler(endpoint, options);
  }

  // Graceful Offline / Demo simulation
  async mockHandler(endpoint, options) {
    const method = options.method || 'GET';
    const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null;

    // Simulate subtle realistic network latency (150ms)
    await new Promise(r => setTimeout(r, 120));

    // Auth Login
    if (endpoint === '/auth/login' && method === 'POST') {
      const user = mockUsers.find(u => u.email === body.email);
      if (user) {
        const fakeToken = `demo_sanctum_token_${user.id}_${Date.now()}`;
        return {
          success: true,
          message: 'Logged in successfully (Demo Simulation).',
          data: { user, token: fakeToken, token_type: 'Bearer' }
        };
      }
      throw new Error('Invalid email or password. Please use one of the quick test accounts.');
    }

    // Dashboard
    if (endpoint.startsWith('/dashboard')) {
      return {
        success: true,
        data: {
          metrics: {
            total_patients: this.localPatients.length,
            total_doctors: mockUsers.filter(u => u.role === 'doctor').length,
            total_cases: this.localCases.length,
            active_cases: this.localCases.filter(c => c.status !== 'closed').length,
            critical_cases: this.localCases.filter(c => c.severity === 'critical' && c.status !== 'closed').length,
            today_appointments: this.localAppointments.length,
            pending_follow_ups: this.localFollowUps.filter(f => f.status === 'pending').length,
          },
          cases_by_status: {
            open: this.localCases.filter(c => c.status === 'open').length,
            in_progress: this.localCases.filter(c => c.status === 'in_progress').length,
            closed: this.localCases.filter(c => c.status === 'closed').length,
            referred: this.localCases.filter(c => c.status === 'referred').length,
          },
          cases_by_severity: {
            mild: this.localCases.filter(c => c.severity === 'mild').length,
            moderate: this.localCases.filter(c => c.severity === 'moderate').length,
            severe: this.localCases.filter(c => c.severity === 'severe').length,
            critical: this.localCases.filter(c => c.severity === 'critical').length,
          },
          recent_cases: this.localCases.slice(0, 5),
          upcoming_appointments: this.localAppointments.slice(0, 5),
          today_appointments: this.localAppointments.slice(0, 5),
        }
      };
    }

    // Patients
    if (endpoint.startsWith('/patients')) {
      if (endpoint === '/patients' && method === 'GET') {
        return { success: true, data: { data: this.localPatients, total: this.localPatients.length } };
      }
      if (endpoint === '/patients' && method === 'POST') {
        const newPatient = {
          id: this.localPatients.length + 1,
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
          medical_history: {
            allergies: body.allergies ? body.allergies.split(',').map(s => s.trim()) : [],
            chronic_diseases: body.chronic_diseases ? body.chronic_diseases.split(',').map(s => s.trim()) : [],
            past_surgeries: body.past_surgeries || 'None reported',
            current_medications: body.current_medications || 'None',
          },
          cases_count: 0
        };
        this.localPatients.unshift(newPatient);
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
      if (endpoint === '/cases' && method === 'GET') {
        return { success: true, data: { data: this.localCases, total: this.localCases.length } };
      }
      if (endpoint === '/cases' && method === 'POST') {
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

    // Symptoms
    if (endpoint === '/symptoms') {
      return { success: true, data: this.localSymptoms };
    }

    // Appointments
    if (endpoint.startsWith('/appointments')) {
      if (method === 'GET') {
        return { success: true, data: { data: this.localAppointments } };
      }
      if (method === 'POST') {
        const patient = this.localPatients.find(p => p.id === parseInt(body.patient_id)) || this.localPatients[0];
        const doctor = mockUsers.find(u => u.id === parseInt(body.doctor_id)) || mockUsers[1];
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
          status: 'scheduled'
        };
        this.localAppointments.unshift(newApt);
        return { success: true, data: newApt, message: 'Appointment booked successfully.' };
      }
      const aptMatch = endpoint.match(/\/appointments\/(\d+)\/status/);
      if (aptMatch && method === 'PATCH') {
        const apt = this.localAppointments.find(a => a.id === parseInt(aptMatch[1]));
        if (apt) {
          apt.status = body.status;
          return { success: true, data: apt, message: 'Appointment status updated.' };
        }
      }
    }

    // Follow-ups
    if (endpoint.startsWith('/follow-ups')) {
      if (endpoint === '/follow-ups' || endpoint === '/follow-ups/pending') {
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

    // Generic response fallback
    return { success: true, message: 'Action simulated successfully.', data: {} };
  }
}

export const api = new ApiService();
