// Multilingual Localization (English & Gujarati)
export const translations = {
  en: {
    // Brand & Header
    systemName: "SIP Case Tracking",
    systemSubtitle: "Digital Clinical History System",
    searchPlaceholder: "Search patient, UHID, case...",
    onlineStatus: "Backend Connected",
    offlineStatus: "Demo Mode (Server Offline)",
    
    // Navigation
    navDashboard: "Dashboard",
    navPatients: "Patients",
    navCases: "Case Records",
    navAppointments: "Appointments",
    navFollowUps: "Follow-ups",
    navDoctors: "Doctors",
    navReports: "Analytics & Reports",
    navLogout: "Sign Out",
    
    // Dashboard Stats
    totalPatients: "Total Patients",
    totalDoctors: "Active Doctors",
    totalCases: "Total Cases",
    activeCases: "Active Cases",
    criticalCases: "Critical Alerts",
    todayAppointments: "Today's Appointments",
    pendingFollowUps: "Pending Follow-ups",

    // Status & Severity
    statusOpen: "Open",
    statusInProgress: "In Progress",
    statusClosed: "Closed",
    statusReferred: "Referred",

    severityMild: "Mild",
    severityModerate: "Moderate",
    severitySevere: "Severe",
    severityCritical: "Critical",

    // Action Buttons
    newPatientBtn: "New Patient",
    newCaseBtn: "New Case Record",
    bookAppointmentBtn: "Book Appointment",
    printSummaryBtn: "Print Summary",
    saveBtn: "Save Changes",
    cancelBtn: "Cancel",
    closeBtn: "Close",
    completeBtn: "Mark Completed",

    // Patient Fields
    uhid: "UHID",
    patientName: "Patient Name",
    age: "Age",
    gender: "Gender",
    bloodGroup: "Blood Group",
    phone: "Phone Number",
    emergencyContact: "Emergency Contact",
    medicalHistory: "Medical History",
    allergies: "Allergies",
    chronicDiseases: "Chronic Diseases",
    actions: "Actions",

    // Case Fields
    caseNumber: "Case No",
    diagnosis: "Diagnosis",
    doctor: "Assigned Doctor",
    admissionDate: "Admission Date",
    symptoms: "Symptoms",
    prescriptions: "Prescriptions",
    treatments: "Treatments",
  },
  
  gu: {
    // Brand & Header
    systemName: "SIP કેસ ટ્રેકિંગ",
    systemSubtitle: "ડિજિટલ ક્લિનિકલ કેસ હિસ્ટ્રી સિસ્ટમ",
    searchPlaceholder: "દર્દી, UHID, કેસ શોધો...",
    onlineStatus: "બેકેન્ડ જોડાયેલ છે",
    offlineStatus: "ડેમો મોડ (સર્વર ઑફલાઇન)",
    
    // Navigation
    navDashboard: "ડેશબોર્ડ",
    navPatients: "દર્દીઓ",
    navCases: "કેસ રેકોર્ડ્સ",
    navAppointments: "એપોઇન્ટમેન્ટ્સ",
    navFollowUps: "ફોલો-અપ્સ",
    navDoctors: "તબીબો",
    navReports: "રિપોર્ટ્સ અને એનાલિટિક્સ",
    navLogout: "લૉગ આઉટ",

    // Dashboard Stats
    totalPatients: "કુલ દર્દીઓ",
    totalDoctors: "સક્રિય તબીબો",
    totalCases: "કુલ કેસો",
    activeCases: "સક્રિય કેસો",
    criticalCases: "ગંભીર ચેતવણીઓ",
    todayAppointments: "આજની એપોઇન્ટમેન્ટ્સ",
    pendingFollowUps: "બાકી ફોલો-અપ્સ",

    // Status & Severity
    statusOpen: "ખુલ્લું",
    statusInProgress: "ચાલુ",
    statusClosed: "પૂર્ણ",
    statusReferred: "રીફર કરેલ",

    severityMild: "સામાન્ય",
    severityModerate: "મધ્યમ",
    severitySevere: "તીવ્ર",
    severityCritical: "અતિ ગંભીર",

    // Action Buttons
    newPatientBtn: "નવો દર્દી",
    newCaseBtn: "નવો કેસ નોંધો",
    bookAppointmentBtn: "એપોઇન્ટમેન્ટ બુક કરો",
    printSummaryBtn: "કેસ સમરી પ્રિન્ટ કરો",
    saveBtn: "સાચવો",
    cancelBtn: "રદ કરો",
    closeBtn: "બંધ કરો",
    completeBtn: "સંપૂર્ણ જાહેર કરો",

    // Patient Fields
    uhid: "UHID",
    patientName: "દર્દીનું નામ",
    age: "ઉંમર",
    gender: "જાતિ",
    bloodGroup: "બ્લડ ગ્રૂપ",
    phone: "ફોન નંબર",
    emergencyContact: "ઇમરજન્સી સંપર્ક",
    medicalHistory: "તબીબી ઇતિહાસ",
    allergies: "એલર્જી",
    chronicDiseases: "લાંબા ગાળાના રોગો",
    actions: "ક્રિયાઓ",

    // Case Fields
    caseNumber: "કેસ નંબર",
    diagnosis: "નિદાન",
    doctor: "તબીબ",
    admissionDate: "દાખલ તારીખ",
    symptoms: "લક્ષણો",
    prescriptions: "દવાઓ",
    treatments: "સારવાર",
  }
};

let currentLocale = localStorage.getItem('sip_locale') || 'en';

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale;
    localStorage.setItem('sip_locale', locale);
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: locale }));
  }
}

export function t(key) {
  const dict = translations[currentLocale] || translations.en;
  return dict[key] || translations.en[key] || key;
}
