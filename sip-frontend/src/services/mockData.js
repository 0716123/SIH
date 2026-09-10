// Realistic Demonstration Dataset mirroring Laravel Migrations & Seeders
export const mockUsers = [
  {
    id: 1,
    name: "Dr. Admin System",
    email: "admin@sip.org",
    role: "admin",
    phone: "+91 98765 43210",
    specialization: "Chief Medical Officer",
    license_number: "GMC-ADM-2015",
    is_active: true,
  },
  {
    id: 2,
    name: "Dr. Rajesh Patel",
    email: "dr.rajesh@sip.org",
    role: "doctor",
    phone: "+91 98251 11223",
    specialization: "General Medicine & Infectious Diseases",
    license_number: "GMC-88231",
    is_active: true,
  },
  {
    id: 3,
    name: "Dr. Priya Sharma",
    email: "dr.priya@sip.org",
    role: "doctor",
    phone: "+91 98790 33445",
    specialization: "Pulmonology & Critical Care",
    license_number: "GMC-91402",
    is_active: true,
  },
  {
    id: 4,
    name: "Dr. Anand Mehta",
    email: "dr.anand@sip.org",
    role: "doctor",
    phone: "+91 94260 55667",
    specialization: "Interventional Cardiology",
    license_number: "GMC-76523",
    is_active: true,
  },
  {
    id: 5,
    name: "Staff Desk Reception",
    email: "staff@sip.org",
    role: "staff",
    phone: "+91 79 2658 9900",
    specialization: "Outpatient Desk & Registration",
    license_number: "EMP-STF-09",
    is_active: true,
  },
];

export const mockSymptoms = [
  { id: 1, name: "High Grade Fever", code: "SYM-FEV-01", category: "General", description: "Body temperature exceeding 102°F with chills" },
  { id: 2, name: "Shortness of Breath (Dyspnea)", code: "SYM-RES-02", category: "Respiratory", description: "Difficulty breathing during rest or mild exertion" },
  { id: 3, name: "Persistent Dry Cough", code: "SYM-RES-03", category: "Respiratory", description: "Unproductive cough lasting over 10 days" },
  { id: 4, name: "Substernal Chest Pain", code: "SYM-CRD-04", category: "Cardiology", description: "Oppressive pressure radiating to left arm or jaw" },
  { id: 5, name: "Acute Fatigue & Weakness", code: "SYM-GEN-05", category: "General", description: "Debilitating exhaustion interfering with activities" },
  { id: 6, name: "Severe Wheezing", code: "SYM-RES-06", category: "Respiratory", description: "High-pitched whistling sound during expiration" },
  { id: 7, name: "Polyuria & Polydipsia", code: "SYM-END-07", category: "Endocrine", description: "Excessive urination and unquenchable thirst" },
];

export const mockPatients = [
  {
    id: 1,
    uhid: "UHID-2026-RMSH01",
    first_name: "Ramesh",
    last_name: "Shah",
    full_name: "Ramesh Shah",
    gender: "male",
    dob: "1968-04-12",
    age: 58,
    blood_group: "O+",
    phone: "+91 98250 44321",
    email: "ramesh.shah@example.com",
    address: "Flat 402, Shivalik Heights, Drive-in Road",
    city: "Ahmedabad",
    emergency_contact_name: "Suresh Shah (Brother)",
    emergency_contact_phone: "+91 98250 99887",
    is_active: true,
    medical_history: {
      allergies: ["Penicillin", "Sulfa drugs"],
      chronic_diseases: ["Type 2 Diabetes Mellitus (12 yrs)", "Mild Hypertension"],
      past_surgeries: "Appendectomy (2014)",
      current_medications: "Metformin 500mg BD, Telmisartan 40mg OD",
      lifestyle_notes: "Non-smoker, vegetarian diet, sedentary desk work"
    },
    cases_count: 2
  },
  {
    id: 2,
    uhid: "UHID-2026-ANJL02",
    first_name: "Anjali",
    last_name: "Trivedi",
    full_name: "Anjali Trivedi",
    gender: "female",
    dob: "1992-09-24",
    age: 34,
    blood_group: "B+",
    phone: "+91 97234 88123",
    email: "anjali.t@example.com",
    address: "B-12, Nilkanth Residency, Gotri",
    city: "Vadodara",
    emergency_contact_name: "Ketan Trivedi (Spouse)",
    emergency_contact_phone: "+91 97234 99001",
    is_active: true,
    medical_history: {
      allergies: ["Dust Mites", "NSAIDs"],
      chronic_diseases: ["Bronchial Asthma (Since childhood)"],
      past_surgeries: "None",
      current_medications: "Budesonide Inhaler 200mcg PRN",
      lifestyle_notes: "Regular yoga practitioner, allergic rhinitis in winters"
    },
    cases_count: 1
  },
  {
    id: 3,
    uhid: "UHID-2026-DEVJ03",
    first_name: "Devendra",
    last_name: "Joshi",
    full_name: "Devendra Joshi",
    gender: "male",
    dob: "1959-11-03",
    age: 67,
    blood_group: "A+",
    phone: "+91 94271 22334",
    email: "devendra.joshi@example.com",
    address: "7, Shantiniketan Society, Race Course",
    city: "Rajkot",
    emergency_contact_name: "Hardik Joshi (Son)",
    emergency_contact_phone: "+91 94271 99112",
    is_active: true,
    medical_history: {
      allergies: ["Aspirin", "Iodine Contrast"],
      chronic_diseases: ["Coronary Artery Disease", "Hyperlipidemia"],
      past_surgeries: "PTCA Stenting LAD (2021)",
      current_medications: "Clopidogrel 75mg, Atorvastatin 40mg, Metoprolol 25mg",
      lifestyle_notes: "Cardiac rehab participant, low sodium diet"
    },
    cases_count: 2
  },
  {
    id: 4,
    uhid: "UHID-2026-MERA04",
    first_name: "Meera",
    last_name: "Desai",
    full_name: "Meera Desai",
    gender: "female",
    dob: "1997-02-18",
    age: 29,
    blood_group: "AB+",
    phone: "+91 98980 12345",
    email: "meera.d@example.com",
    address: "303, Emerald Greens, Vesu",
    city: "Surat",
    emergency_contact_name: "Neelam Desai (Mother)",
    emergency_contact_phone: "+91 98980 98765",
    is_active: true,
    medical_history: {
      allergies: [],
      chronic_diseases: ["None"],
      past_surgeries: "None",
      current_medications: "Multivitamins",
      lifestyle_notes: "Active athlete, marathon runner"
    },
    cases_count: 1
  },
  {
    id: 5,
    uhid: "UHID-2026-BHVK05",
    first_name: "Bhavik",
    last_name: "Solanki",
    full_name: "Bhavik Solanki",
    gender: "male",
    dob: "1984-07-30",
    age: 42,
    blood_group: "B-",
    phone: "+91 98240 77665",
    email: "bhavik.s@example.com",
    address: "Plot 18, GIDC Colony",
    city: "Bhavnagar",
    emergency_contact_name: "Rekha Solanki (Wife)",
    emergency_contact_phone: "+91 98240 11223",
    is_active: true,
    medical_history: {
      allergies: ["Ciprofloxacin"],
      chronic_diseases: ["Chronic Bronchitis"],
      past_surgeries: "None",
      current_medications: "Montelukast 10mg OD",
      lifestyle_notes: "Former smoker (quit 3 years ago)"
    },
    cases_count: 1
  }
];

export const mockCases = [
  {
    id: 1,
    case_number: "CASE-202609-8812",
    patient_id: 2,
    patient: {
      id: 2,
      uhid: "UHID-2026-ANJL02",
      first_name: "Anjali",
      last_name: "Trivedi",
      phone: "+91 97234 88123",
      gender: "female",
      age: 34
    },
    doctor_id: 3,
    doctor: {
      id: 3,
      name: "Dr. Priya Sharma",
      specialization: "Pulmonology & Critical Care"
    },
    title: "Acute Severe Asthma Exacerbation with Wheezing",
    diagnosis: "Status Asthmaticus secondary to acute viral upper respiratory infection",
    severity: "critical",
    status: "in_progress",
    admission_date: "2026-09-08T10:30:00",
    description: "Patient presented with severe dyspnea, bilateral expiratory wheezing, tachypnea (RR 28/min), and SpO2 89% on room air. Prompt nebulization initiated.",
    symptoms: [
      { id: 2, name: "Shortness of Breath (Dyspnea)", severity: "critical", duration_days: 2, notes: "Marked accessory muscle usage" },
      { id: 6, name: "Severe Wheezing", severity: "severe", duration_days: 3, notes: "Audible throughout both lung fields" },
      { id: 3, name: "Persistent Dry Cough", severity: "moderate", duration_days: 5, notes: "Paroxysmal nocturnal bouts" }
    ],
    prescriptions: [
      { id: 1, medicine_name: "Levosalbutamol + Ipratropium Respules", dosage: "1.25mg / 500mcg", frequency: "Q4H Nebulization", duration: "3 days", instructions: "Via compressor nebulizer with 6L O2" },
      { id: 2, medicine_name: "Hydrocortisone IV", dosage: "100mg", frequency: "TID IV bolus", duration: "48 hours", instructions: "Slow IV push" },
      { id: 3, medicine_name: "Azithromycin", dosage: "500mg", frequency: "OD Oral", duration: "5 days", instructions: "1 hour before meals" }
    ],
    treatments: [
      { id: 1, title: "Supplemental High-Flow Oxygen Therapy", notes: "Target SpO2 maintained between 94% - 96%." }
    ]
  },
  {
    id: 2,
    case_number: "CASE-202609-7734",
    patient_id: 3,
    patient: {
      id: 3,
      uhid: "UHID-2026-DEVJ03",
      first_name: "Devendra",
      last_name: "Joshi",
      phone: "+91 94271 22334",
      gender: "male",
      age: 67
    },
    doctor_id: 4,
    doctor: {
      id: 4,
      name: "Dr. Anand Mehta",
      specialization: "Interventional Cardiology"
    },
    title: "Unstable Angina Pectoris - Ischemia Surveillance",
    diagnosis: "Acute Coronary Syndrome - NSTEMI Rule-out in Known Post-PTCA Patient",
    severity: "severe",
    status: "open",
    admission_date: "2026-09-09T14:15:00",
    description: "Intermittent retrosternal squeezing pain occurring on minimal walking. Serial Troponin-I sent and continuous ECG telemetry active.",
    symptoms: [
      { id: 4, name: "Substernal Chest Pain", severity: "severe", duration_days: 1, notes: "Radiating to inner left forearm, 7/10 severity" },
      { id: 2, name: "Shortness of Breath (Dyspnea)", severity: "moderate", duration_days: 2, notes: "New onset on exertion" }
    ],
    prescriptions: [
      { id: 4, medicine_name: "Sorbitrate (Isosorbide Dinitrate)", dosage: "5mg", frequency: "Sublingual PRN", duration: "SOS", instructions: "Keep under tongue if chest pain repeats" },
      { id: 5, medicine_name: "Enoxaparin Injection", dosage: "60mg", frequency: "Subcutaneous BD", duration: "3 days", instructions: "Alternate abdominal sites" }
    ],
    treatments: [
      { id: 2, title: "Continuous Cardiac Telemetry & Serial Biomarkers", notes: "Troponin I at 0hr, 3hr, 6hr." }
    ]
  },
  {
    id: 3,
    case_number: "CASE-202609-6521",
    patient_id: 1,
    patient: {
      id: 1,
      uhid: "UHID-2026-RMSH01",
      first_name: "Ramesh",
      last_name: "Shah",
      phone: "+91 98250 44321",
      gender: "male",
      age: 58
    },
    doctor_id: 2,
    doctor: {
      id: 2,
      name: "Dr. Rajesh Patel",
      specialization: "General Medicine & Infectious Diseases"
    },
    title: "Uncontrolled Hyperglycemia with Peripheral Neuropathy",
    diagnosis: "Type 2 Diabetes Mellitus with Poor Glycemic Control (HbA1c 10.4%)",
    severity: "moderate",
    status: "in_progress",
    admission_date: "2026-09-05T09:45:00",
    description: "Fasting blood sugar 246 mg/dL, PPBS 340 mg/dL. Tingling sensation in bilateral soles. Transitioning to basal-bolus insulin protocol.",
    symptoms: [
      { id: 7, name: "Polyuria & Polydipsia", severity: "moderate", duration_days: 14, notes: "Nocturia 4-5 times" },
      { id: 5, name: "Acute Fatigue & Weakness", severity: "moderate", duration_days: 21, notes: "Lethargy after meals" }
    ],
    prescriptions: [
      { id: 6, medicine_name: "Insulin Glargine (Lantus)", dosage: "14 Units", frequency: "At Bedtime SubQ", duration: "Ongoing", instructions: "Store in refrigerator door" },
      { id: 7, medicine_name: "Pregabalin + Methylcobalamin", dosage: "75mg / 1500mcg", frequency: "OD at night", duration: "30 days", instructions: "After food" }
    ],
    treatments: [
      { id: 3, title: "Diabetic Foot Care & Nutritionist Counseling", notes: "1500 kcal diabetic meal plan issued." }
    ]
  },
  {
    id: 4,
    case_number: "CASE-202608-5409",
    patient_id: 4,
    patient: {
      id: 4,
      uhid: "UHID-2026-MERA04",
      first_name: "Meera",
      last_name: "Desai",
      phone: "+91 98980 12345",
      gender: "female",
      age: 29
    },
    doctor_id: 2,
    doctor: {
      id: 2,
      name: "Dr. Rajesh Patel",
      specialization: "General Medicine & Infectious Diseases"
    },
    title: "Acute Viral Pyrexia with Myalgia",
    diagnosis: "Self-limiting Viral syndrome (Dengue NS1 Negative)",
    severity: "mild",
    status: "closed",
    admission_date: "2026-08-20T11:00:00",
    discharge_date: "2026-08-24T16:00:00",
    description: "Fully recovered after oral hydration and antipyretics. Platelet count stable at 2.4 Lakhs.",
    symptoms: [
      { id: 1, name: "High Grade Fever", severity: "mild", duration_days: 3, notes: "Responded to Paracetamol" }
    ],
    prescriptions: [
      { id: 8, medicine_name: "Paracetamol 650mg", dosage: "1 Tab", frequency: "TID", duration: "3 days", instructions: "After food" }
    ],
    treatments: [
      { id: 4, title: "Oral Rehydration Therapy", notes: "Adequate fluid intake > 3 liters per day." }
    ]
  }
];

export const mockAppointments = [
  {
    id: 1,
    appointment_number: "APT-20260910-1001",
    patient_id: 1,
    patient: { id: 1, uhid: "UHID-2026-RMSH01", first_name: "Ramesh", last_name: "Shah", phone: "+91 98250 44321", gender: "male", age: 58 },
    doctor_id: 2,
    doctor: { id: 2, name: "Dr. Rajesh Patel", specialization: "General Medicine" },
    scheduled_at: "2026-09-10T11:00:00",
    reason: "Review Fasting & PP Blood Sugar Log",
    type: "follow_up",
    status: "scheduled"
  },
  {
    id: 2,
    appointment_number: "APT-20260910-1002",
    patient_id: 2,
    patient: { id: 2, uhid: "UHID-2026-ANJL02", first_name: "Anjali", last_name: "Trivedi", phone: "+91 97234 88123", gender: "female", age: 34 },
    doctor_id: 3,
    doctor: { id: 3, name: "Dr. Priya Sharma", specialization: "Pulmonology" },
    scheduled_at: "2026-09-10T12:30:00",
    reason: "Post-nebulization Spirometry & Peak Flow Check",
    type: "consultation",
    status: "scheduled"
  },
  {
    id: 3,
    appointment_number: "APT-20260910-1003",
    patient_id: 5,
    patient: { id: 5, uhid: "UHID-2026-BHVK05", first_name: "Bhavik", last_name: "Solanki", phone: "+91 98240 77665", gender: "male", age: 42 },
    doctor_id: 3,
    doctor: { id: 3, name: "Dr. Priya Sharma", specialization: "Pulmonology" },
    scheduled_at: "2026-09-10T15:00:00",
    reason: "Chronic cough evaluation and chest radiograph review",
    type: "consultation",
    status: "scheduled"
  }
];

export const mockFollowUps = [
  {
    id: 1,
    case_record_id: 1,
    patient_id: 2,
    patient: { id: 2, uhid: "UHID-2026-ANJL02", first_name: "Anjali", last_name: "Trivedi", phone: "+91 97234 88123" },
    doctor_id: 3,
    doctor: { id: 3, name: "Dr. Priya Sharma" },
    case_record: { id: 1, case_number: "CASE-202609-8812", title: "Acute Severe Asthma Exacerbation" },
    scheduled_date: "2026-09-12",
    purpose: "Evaluate oral steroid step-down and assess inhaler technique",
    status: "pending"
  },
  {
    id: 2,
    case_record_id: 2,
    patient_id: 3,
    patient: { id: 3, uhid: "UHID-2026-DEVJ03", first_name: "Devendra", last_name: "Joshi", phone: "+91 94271 22334" },
    doctor_id: 4,
    doctor: { id: 4, name: "Dr. Anand Mehta" },
    case_record: { id: 2, case_number: "CASE-202609-7734", title: "Unstable Angina Pectoris" },
    scheduled_date: "2026-09-14",
    purpose: "Review elective coronary angiography readiness and 2D Echo report",
    status: "pending"
  },
  {
    id: 3,
    case_record_id: 3,
    patient_id: 1,
    patient: { id: 1, uhid: "UHID-2026-RMSH01", first_name: "Ramesh", last_name: "Shah", phone: "+91 98250 44321" },
    doctor_id: 2,
    doctor: { id: 2, name: "Dr. Rajesh Patel" },
    case_record: { id: 3, case_number: "CASE-202609-6521", title: "Uncontrolled Hyperglycemia" },
    scheduled_date: "2026-09-17",
    purpose: "Review 7-day SMBG blood sugar chart and adjust insulin glargine unit",
    status: "pending"
  }
];

export const mockDashboardMetrics = {
  admin: {
    metrics: {
      total_patients: 5,
      total_doctors: 3,
      total_cases: 4,
      active_cases: 3,
      critical_cases: 1,
      today_appointments: 3,
      pending_follow_ups: 3,
    },
    cases_by_status: {
      open: 1,
      in_progress: 2,
      closed: 1,
      referred: 0
    },
    cases_by_severity: {
      mild: 1,
      moderate: 1,
      severe: 1,
      critical: 1
    }
  }
};
