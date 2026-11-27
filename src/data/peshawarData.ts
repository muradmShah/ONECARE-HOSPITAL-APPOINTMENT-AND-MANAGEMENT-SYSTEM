export type NavSection = 'home' | 'doctors' | 'medicines' | 'labs' | 'about';

export type SearchScope = 'all' | 'doctors' | 'medicines' | 'labs';

export type PeshawarArea =
  | 'All Peshawar'
  | 'Hayatabad'
  | 'University Town'
  | 'Dabgari Gardens'
  | 'Saddar'
  | 'Cantt'
  | 'Gulbahar'
  | 'Warsak Road';

export const PESHAWAR_AREAS: PeshawarArea[] = [
  'All Peshawar',
  'Hayatabad',
  'University Town',
  'Dabgari Gardens',
  'Saddar',
  'Cantt',
  'Gulbahar',
  'Warsak Road',
];

export interface SpecialtyItem {
  id: string;
  name: string;
  shortDesc: string;
  commonConditions: string[];
  featured: boolean;
  iconKey:
    | 'heart'
    | 'sparkles'
    | 'brain'
    | 'bone'
    | 'baby'
    | 'flower'
    | 'smile'
    | 'stethoscope'
    | 'ear'
    | 'eye'
    | 'wind'
    | 'activity';
}

export interface DoctorProfile {
  id: string;
  name: string;
  specialtyId: string;
  specialtyName: string;
  qualifications: string;
  experienceYears: number;
  feePkr: number;
  area: Exclude<PeshawarArea, 'All Peshawar'>;
  clinicName: string;
  availability: string;
  consultationMode: string;
  languages: string[];
  image: string;
  focusAreas: string[];
  relatedMedicineIds: string[];
  relatedLabIds: string[];
  isSample: true;
  verificationNote: string;
}

export interface MedicineItem {
  id: string;
  genericName: string;
  commonClass: string;
  typicalUseContext: string;
  prescriptionStatus: 'Prescription Required' | 'Pharmacist Consultation Advised';
  relatedSpecialty: string;
  samplePriceRange: string;
  availableAreas: Exclude<PeshawarArea, 'All Peshawar'>[];
  clinicianNote: string;
  isSample: true;
}

export interface LabTestItem {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  preparation: string;
  turnaroundTime: string;
  sampleFeeRange: string;
  homeSamplingAvailable: boolean;
  availableAreas: Exclude<PeshawarArea, 'All Peshawar'>[];
  relatedSpecialty: string;
  isSample: true;
}

export type FacilityCategory = 'hospitals' | 'clinics' | 'pharmacies' | 'labs';

export interface LocalFacility {
  id: string;
  name: string;
  category: FacilityCategory;
  area: Exclude<PeshawarArea, 'All Peshawar'>;
  landmark: string;
  distanceKm: number;
  hours: string;
  services: string[];
  mapCoords: { x: number; y: number };
  isSample: true;
}

export const HERO_IMAGE = '/src/assets/images/hero_peshawar_care_1795508014143.jpg';
export const HERO_HOSPITAL_BACKDROP = '/src/assets/images/hero_hospital_backdrop_1795604190501.jpg';
export const CLINIC_LAB_IMAGE = '/src/assets/images/clinic_diagnostic_lab_1795508027717.jpg';

export const SPECIALTIES: SpecialtyItem[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    shortDesc: 'Heart rhythm, blood pressure, and vascular care.',
    commonConditions: ['Hypertension', 'Chest discomfort', 'Palpitations'],
    featured: true,
    iconKey: 'heart',
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    shortDesc: 'Skin, hair, allergy, and chronic rash care.',
    commonConditions: ['Eczema', 'Acne', 'Skin allergies'],
    featured: true,
    iconKey: 'sparkles',
  },
  {
    id: 'neurology',
    name: 'Neurology',
    shortDesc: 'Migraines, nerve conditions, and seizure care.',
    commonConditions: ['Migraine', 'Neuropathy', 'Vertigo'],
    featured: true,
    iconKey: 'brain',
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    shortDesc: 'Joints, spine, fractures, and mobility recovery.',
    commonConditions: ['Back pain', 'Knee arthritis', 'Sports injury'],
    featured: true,
    iconKey: 'bone',
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    shortDesc: 'Child growth, immunizations, and acute fevers.',
    commonConditions: ['Childhood fever', 'Vaccinations', 'Nutrition'],
    featured: true,
    iconKey: 'baby',
  },
  {
    id: 'gynecology',
    name: 'Gynecology',
    shortDesc: 'Maternal care, prenatal visits, and reproductive health.',
    commonConditions: ['Prenatal care', 'PCOS', 'Women wellness'],
    featured: true,
    iconKey: 'flower',
  },
  {
    id: 'dentistry',
    name: 'Dentistry',
    shortDesc: 'Preventive checkups, fillings, and oral health.',
    commonConditions: ['Tooth sensitivity', 'Gum care', 'Orthodontics'],
    featured: true,
    iconKey: 'smile',
  },
  {
    id: 'general-physician',
    name: 'General Physician',
    shortDesc: 'Primary consultations, fevers, and care guidance.',
    commonConditions: ['Fever & flu', 'Diabetes screening', 'General checkup'],
    featured: true,
    iconKey: 'stethoscope',
  },
  {
    id: 'ent',
    name: 'ENT Specialist',
    shortDesc: 'Sinus, throat, ear infections, and hearing care.',
    commonConditions: ['Sinusitis', 'Tonsillitis', 'Hearing check'],
    featured: false,
    iconKey: 'ear',
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    shortDesc: 'Vision exams, dry eye, and cataract consultations.',
    commonConditions: ['Vision screening', 'Eye strain', 'Cataract'],
    featured: false,
    iconKey: 'eye',
  },
  {
    id: 'pulmonology',
    name: 'Pulmonology',
    shortDesc: 'Asthma, chronic cough, and respiratory health.',
    commonConditions: ['Asthma', 'Seasonal allergies', 'Shortness of breath'],
    featured: false,
    iconKey: 'wind',
  },
  {
    id: 'endocrinology',
    name: 'Endocrinology',
    shortDesc: 'Thyroid balance, diabetes, and metabolic care.',
    commonConditions: ['Type 2 diabetes', 'Thyroid disorders', 'Hormonal care'],
    featured: false,
    iconKey: 'activity',
  },
];

export const SAMPLE_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-1',
    name: 'Dr. Amara Khan',
    specialtyId: 'general-physician',
    specialtyName: 'General Physician',
    qualifications: 'MBBS, FCPS (Medicine) · Sample credential',
    experienceYears: 11,
    feePkr: 2000,
    area: 'University Town',
    clinicName: 'University Road Family Care (Sample Clinic)',
    availability: 'Mon–Sat · 4:00 PM – 8:00 PM (Sample)',
    consultationMode: 'In-Clinic Consultation',
    languages: ['Pashto', 'Urdu', 'English'],
    image: '/src/assets/images/doctor_portrait_female_1_1795507994196.jpg',
    focusAreas: ['Primary Care', 'Fever & Infections', 'Diabetes Follow-up'],
    relatedMedicineIds: ['med-1', 'med-4'],
    relatedLabIds: ['lab-1', 'lab-3'],
    isSample: true,
    verificationNote: 'Prototype sample profile — live credential verification applies upon clinic onboarding.',
  },
  {
    id: 'doc-2',
    name: 'Dr. Salman Afridi',
    specialtyId: 'cardiology',
    specialtyName: 'Cardiology',
    qualifications: 'MBBS, FCPS (Cardiology) · Sample credential',
    experienceYears: 16,
    feePkr: 3000,
    area: 'Hayatabad',
    clinicName: 'Hayatabad Heart & Vascular Center (Sample)',
    availability: 'Mon–Fri · 5:00 PM – 9:00 PM (Sample)',
    consultationMode: 'In-Clinic Consultation',
    languages: ['Pashto', 'Urdu', 'English'],
    image: '/src/assets/images/doctor_portrait_male_2_1795508007269.jpg',
    focusAreas: ['Blood Pressure Management', 'Preventive Cardiology', 'ECG Review'],
    relatedMedicineIds: ['med-2'],
    relatedLabIds: ['lab-2', 'lab-6'],
    isSample: true,
    verificationNote: 'Prototype sample profile — live credential verification applies upon clinic onboarding.',
  },
  {
    id: 'doc-3',
    name: 'Dr. Bilal Khattak',
    specialtyId: 'orthopedics',
    specialtyName: 'Orthopedics',
    qualifications: 'MBBS, MS (Orthopedics) · Sample credential',
    experienceYears: 13,
    feePkr: 2500,
    area: 'Dabgari Gardens',
    clinicName: 'Dabgari Bone & Joint Practice (Sample)',
    availability: 'Tue–Sun · 3:30 PM – 7:30 PM (Sample)',
    consultationMode: 'In-Clinic Consultation',
    languages: ['Pashto', 'Urdu', 'English'],
    image: '/src/assets/images/doctor_portrait_male_1_1795507998535.jpg',
    focusAreas: ['Knee & Joint Pain', 'Spine Assessment', 'Fracture Recovery'],
    relatedMedicineIds: ['med-5'],
    relatedLabIds: ['lab-5'],
    isSample: true,
    verificationNote: 'Prototype sample profile — live credential verification applies upon clinic onboarding.',
  },
  {
    id: 'doc-4',
    name: 'Dr. Zara Durrani',
    specialtyId: 'pediatrics',
    specialtyName: 'Pediatrics',
    qualifications: 'MBBS, DCH, FCPS (Pediatrics) · Sample credential',
    experienceYears: 9,
    feePkr: 1800,
    area: 'Saddar',
    clinicName: 'Saddar Child Wellness Clinic (Sample)',
    availability: 'Mon–Sat · 2:00 PM – 6:30 PM (Sample)',
    consultationMode: 'In-Clinic Consultation',
    languages: ['Pashto', 'Urdu', 'English'],
    image: '/src/assets/images/doctor_portrait_female_2_1795507990522.jpg',
    focusAreas: ['Childhood Fevers', 'Immunization Schedules', 'Growth Checkups'],
    relatedMedicineIds: ['med-1', 'med-6'],
    relatedLabIds: ['lab-1'],
    isSample: true,
    verificationNote: 'Prototype sample profile — live credential verification applies upon clinic onboarding.',
  },
  {
    id: 'doc-5',
    name: 'Dr. Hina Yousafzai',
    specialtyId: 'gynecology',
    specialtyName: 'Gynecology',
    qualifications: 'MBBS, FCPS (Obs & Gynae) · Sample credential',
    experienceYears: 12,
    feePkr: 2500,
    area: 'Hayatabad',
    clinicName: 'Phase 4 Maternal & Women Clinic (Sample)',
    availability: 'Mon–Fri · 3:00 PM – 7:00 PM (Sample)',
    consultationMode: 'In-Clinic Consultation',
    languages: ['Pashto', 'Urdu', 'English'],
    image: '/src/assets/images/doctor_portrait_female_1_1795507994196.jpg',
    focusAreas: ['Antenatal Care', 'Hormonal Balance', 'Preventive Screenings'],
    relatedMedicineIds: ['med-6'],
    relatedLabIds: ['lab-1', 'lab-4', 'lab-5'],
    isSample: true,
    verificationNote: 'Prototype sample profile — live credential verification applies upon clinic onboarding.',
  },
  {
    id: 'doc-6',
    name: 'Dr. Tariq Shinwari',
    specialtyId: 'neurology',
    specialtyName: 'Neurology',
    qualifications: 'MBBS, FCPS (Neurology) · Sample credential',
    experienceYears: 15,
    feePkr: 3000,
    area: 'Dabgari Gardens',
    clinicName: 'Khyber Neuro Consultation Suite (Sample)',
    availability: 'Mon, Wed, Fri · 5:00 PM – 8:30 PM (Sample)',
    consultationMode: 'In-Clinic Consultation',
    languages: ['Pashto', 'Urdu', 'English'],
    image: '/src/assets/images/doctor_portrait_male_2_1795508007269.jpg',
    focusAreas: ['Chronic Migraines', 'Nerve Pain', 'Balance & Vertigo'],
    relatedMedicineIds: ['med-3'],
    relatedLabIds: ['lab-4', 'lab-5'],
    isSample: true,
    verificationNote: 'Prototype sample profile — live credential verification applies upon clinic onboarding.',
  },
  {
    id: 'doc-7',
    name: 'Dr. Nadia Qureshi',
    specialtyId: 'dermatology',
    specialtyName: 'Dermatology',
    qualifications: 'MBBS, FCPS (Dermatology) · Sample credential',
    experienceYears: 8,
    feePkr: 2200,
    area: 'Cantt',
    clinicName: 'Cantt Skin & Allergy Practice (Sample)',
    availability: 'Tue–Sat · 4:00 PM – 8:00 PM (Sample)',
    consultationMode: 'In-Clinic Consultation',
    languages: ['Urdu', 'English', 'Pashto'],
    image: '/src/assets/images/doctor_portrait_female_2_1795507990522.jpg',
    focusAreas: ['Eczema & Dermatitis', 'Acne Care', 'Seasonal Skin Allergies'],
    relatedMedicineIds: ['med-3'],
    relatedLabIds: ['lab-1'],
    isSample: true,
    verificationNote: 'Prototype sample profile — live credential verification applies upon clinic onboarding.',
  },
  {
    id: 'doc-8',
    name: 'Dr. Farhan Orakzai',
    specialtyId: 'dentistry',
    specialtyName: 'Dentistry',
    qualifications: 'BDS, FCPS (Operative Dentistry) · Sample credential',
    experienceYears: 10,
    feePkr: 1500,
    area: 'Gulbahar',
    clinicName: 'Gulbahar Dental Studio (Sample)',
    availability: 'Mon–Sat · 11:00 AM – 6:00 PM (Sample)',
    consultationMode: 'In-Clinic Consultation',
    languages: ['Pashto', 'Urdu', 'English'],
    image: '/src/assets/images/doctor_portrait_male_1_1795507998535.jpg',
    focusAreas: ['Preventive Checkups', 'Restorative Dentistry', 'Gum Treatment'],
    relatedMedicineIds: ['med-1'],
    relatedLabIds: [],
    isSample: true,
    verificationNote: 'Prototype sample profile — live credential verification applies upon clinic onboarding.',
  },
];

export const SAMPLE_MEDICINES: MedicineItem[] = [
  {
    id: 'med-1',
    genericName: 'Paracetamol (Acetaminophen) Oral Formulations',
    commonClass: 'Analgesic & Antipyretic',
    typicalUseContext: 'Commonly used for fever reduction and mild pain relief under clinician or pharmacist guidance.',
    prescriptionStatus: 'Pharmacist Consultation Advised',
    relatedSpecialty: 'General Physician',
    samplePriceRange: 'PKR 40 – 180 (Sample estimate)',
    availableAreas: ['Hayatabad', 'University Town', 'Dabgari Gardens', 'Saddar', 'Gulbahar'],
    clinicianNote: 'Always confirm dosage by weight and age with a qualified doctor or licensed pharmacist.',
    isSample: true,
  },
  {
    id: 'med-2',
    genericName: 'Amlodipine / Antihypertensive Therapy Class',
    commonClass: 'Cardiovascular · Calcium Channel Blocker',
    typicalUseContext: 'Prescribed by cardiologists and physicians for ongoing blood pressure management.',
    prescriptionStatus: 'Prescription Required',
    relatedSpecialty: 'Cardiology',
    samplePriceRange: 'PKR 150 – 450 (Sample estimate)',
    availableAreas: ['Hayatabad', 'Dabgari Gardens', 'Saddar', 'Cantt'],
    clinicianNote: 'Requires a valid physician prescription and periodic blood pressure monitoring.',
    isSample: true,
  },
  {
    id: 'med-3',
    genericName: 'Cetirizine / Non-Sedating Antihistamine Class',
    commonClass: 'Allergy & Dermatology Support',
    typicalUseContext: 'Often recommended during Peshawar pollen seasons for allergic rhinitis or skin itch.',
    prescriptionStatus: 'Pharmacist Consultation Advised',
    relatedSpecialty: 'Dermatology',
    samplePriceRange: 'PKR 80 – 260 (Sample estimate)',
    availableAreas: ['University Town', 'Cantt', 'Hayatabad', 'Warsak Road'],
    clinicianNote: 'Discuss pregnancy, drowsiness, or drug interactions with a pharmacist before use.',
    isSample: true,
  },
  {
    id: 'med-4',
    genericName: 'Metformin Extended-Release Formulations',
    commonClass: 'Endocrine & Glycemic Management',
    typicalUseContext: 'Prescribed by physicians to support blood sugar control alongside lifestyle care.',
    prescriptionStatus: 'Prescription Required',
    relatedSpecialty: 'General Physician',
    samplePriceRange: 'PKR 180 – 520 (Sample estimate)',
    availableAreas: ['Hayatabad', 'University Town', 'Dabgari Gardens', 'Gulbahar'],
    clinicianNote: 'Dispensed only with a physician prescription and routine HbA1c lab follow-up.',
    isSample: true,
  },
  {
    id: 'med-5',
    genericName: 'Topical Anti-Inflammatory Gel Formulations',
    commonClass: 'Musculoskeletal Relief',
    typicalUseContext: 'Used alongside physiotherapy or orthopedic care for localized joint or muscle strain.',
    prescriptionStatus: 'Pharmacist Consultation Advised',
    relatedSpecialty: 'Orthopedics',
    samplePriceRange: 'PKR 220 – 650 (Sample estimate)',
    availableAreas: ['Dabgari Gardens', 'Saddar', 'Hayatabad', 'Gulbahar'],
    clinicianNote: 'Consult an orthopedic specialist if swelling, numbness, or severe joint pain persists.',
    isSample: true,
  },
  {
    id: 'med-6',
    genericName: 'Vitamin D3 & Iron Supplementation',
    commonClass: 'Nutritional Support',
    typicalUseContext: 'Recommended following blood test confirmation of deficiency by a physician.',
    prescriptionStatus: 'Pharmacist Consultation Advised',
    relatedSpecialty: 'Gynecology',
    samplePriceRange: 'PKR 300 – 950 (Sample estimate)',
    availableAreas: ['Hayatabad', 'University Town', 'Saddar', 'Cantt', 'Warsak Road'],
    clinicianNote: 'Lab testing (Vitamin D / CBC) helps your doctor choose the right strength and duration.',
    isSample: true,
  },
];

export const SAMPLE_LAB_TESTS: LabTestItem[] = [
  {
    id: 'lab-1',
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    shortDescription: 'Evaluates red cells, white cells, and platelets during fever, fatigue, or routine checkups.',
    preparation: 'No fasting required',
    turnaroundTime: '4 – 6 hours (Sample)',
    sampleFeeRange: 'PKR 750 – 1,100 (Sample)',
    homeSamplingAvailable: true,
    availableAreas: ['Hayatabad', 'University Town', 'Dabgari Gardens', 'Saddar', 'Gulbahar'],
    relatedSpecialty: 'General Physician',
    isSample: true,
  },
  {
    id: 'lab-2',
    name: 'Lipid Profile (Cholesterol Panel)',
    category: 'Cardiology & Metabolic',
    shortDescription: 'Measures HDL, LDL, total cholesterol, and triglycerides to support heart health assessment.',
    preparation: '9 – 12 hours overnight fasting',
    turnaroundTime: 'Same day (Sample)',
    sampleFeeRange: 'PKR 1,600 – 2,200 (Sample)',
    homeSamplingAvailable: true,
    availableAreas: ['Hayatabad', 'Dabgari Gardens', 'Cantt', 'University Town'],
    relatedSpecialty: 'Cardiology',
    isSample: true,
  },
  {
    id: 'lab-3',
    name: 'HbA1c (3-Month Blood Sugar Average)',
    category: 'Diabetes Monitoring',
    shortDescription: 'Tracks average blood glucose over 8–12 weeks for diabetes screening and follow-up.',
    preparation: 'No fasting required',
    turnaroundTime: 'Same day (Sample)',
    sampleFeeRange: 'PKR 1,500 – 2,100 (Sample)',
    homeSamplingAvailable: true,
    availableAreas: ['Hayatabad', 'University Town', 'Dabgari Gardens', 'Saddar'],
    relatedSpecialty: 'General Physician',
    isSample: true,
  },
  {
    id: 'lab-4',
    name: 'Thyroid Function Panel (TSH, Free T3, Free T4)',
    category: 'Endocrinology',
    shortDescription: 'Assesses thyroid hormone levels when investigating fatigue, weight changes, or prenatal care.',
    preparation: 'Morning sample preferred',
    turnaroundTime: '12 – 24 hours (Sample)',
    sampleFeeRange: 'PKR 2,400 – 3,400 (Sample)',
    homeSamplingAvailable: true,
    availableAreas: ['Hayatabad', 'Dabgari Gardens', 'Cantt', 'University Town'],
    relatedSpecialty: 'Gynecology',
    isSample: true,
  },
  {
    id: 'lab-5',
    name: '25-Hydroxy Vitamin D Test',
    category: 'Bone & Nutritional Health',
    shortDescription: 'Measures vitamin D status often requested alongside orthopedic or general wellness reviews.',
    preparation: 'No fasting required',
    turnaroundTime: '24 hours (Sample)',
    sampleFeeRange: 'PKR 2,600 – 3,600 (Sample)',
    homeSamplingAvailable: true,
    availableAreas: ['Hayatabad', 'University Town', 'Dabgari Gardens', 'Warsak Road'],
    relatedSpecialty: 'Orthopedics',
    isSample: true,
  },
  {
    id: 'lab-6',
    name: 'Resting 12-Lead ECG',
    category: 'Cardiac Diagnostics',
    shortDescription: 'Quick, painless electrical heart rhythm recording performed at a diagnostic clinic.',
    preparation: 'In-clinic visit required',
    turnaroundTime: 'Immediate report (Sample)',
    sampleFeeRange: 'PKR 800 – 1,400 (Sample)',
    homeSamplingAvailable: false,
    availableAreas: ['Hayatabad', 'Dabgari Gardens', 'Saddar', 'Cantt'],
    relatedSpecialty: 'Cardiology',
    isSample: true,
  },
];

export const SAMPLE_FACILITIES: LocalFacility[] = [
  {
    id: 'fac-1',
    name: 'Hayatabad Medical Corridor Center (Sample)',
    category: 'hospitals',
    area: 'Hayatabad',
    landmark: 'Near Phase 4 Medical Complex Road',
    distanceKm: 2.1,
    hours: 'Open 24 Hours (Sample)',
    services: ['Emergency Care', 'Cardiology OPD', 'Inpatient Wards'],
    mapCoords: { x: 18, y: 66 },
    isSample: true,
  },
  {
    id: 'fac-2',
    name: 'Dabgari Specialist Medical Plaza (Sample)',
    category: 'hospitals',
    area: 'Dabgari Gardens',
    landmark: 'Main Dabgari Medical Enclave',
    distanceKm: 4.6,
    hours: 'Open 24 Hours (Sample)',
    services: ['Multi-Specialty OPD', 'Orthopedics', 'Diagnostic Wing'],
    mapCoords: { x: 64, y: 44 },
    isSample: true,
  },
  {
    id: 'fac-3',
    name: 'University Road Family Clinic (Sample)',
    category: 'clinics',
    area: 'University Town',
    landmark: 'Off Main University Road, near Town Chowk',
    distanceKm: 1.4,
    hours: '9:00 AM – 9:00 PM (Sample)',
    services: ['General Physician', 'Pediatrics', 'Routine Consultations'],
    mapCoords: { x: 37, y: 50 },
    isSample: true,
  },
  {
    id: 'fac-4',
    name: 'Cantt Dermatology & Care Suite (Sample)',
    category: 'clinics',
    area: 'Cantt',
    landmark: 'Mall Road Medical Chambers',
    distanceKm: 3.3,
    hours: '2:00 PM – 8:30 PM (Sample)',
    services: ['Dermatology', 'ENT Consultations', 'Minor Procedures'],
    mapCoords: { x: 54, y: 57 },
    isSample: true,
  },
  {
    id: 'fac-5',
    name: 'Saddar Care Prescription Pharmacy (Sample)',
    category: 'pharmacies',
    area: 'Saddar',
    landmark: 'Fakhr-e-Alam Road, Saddar Bazaar',
    distanceKm: 3.8,
    hours: '8:00 AM – 11:30 PM (Sample)',
    services: ['Prescription Dispensing', 'Cold-Chain Storage', 'Licensed Pharmacist'],
    mapCoords: { x: 58, y: 49 },
    isSample: true,
  },
  {
    id: 'fac-6',
    name: 'Phase 3 Community Pharmacy (Sample)',
    category: 'pharmacies',
    area: 'Hayatabad',
    landmark: 'Hayatabad Phase 3 Chowk',
    distanceKm: 1.9,
    hours: 'Open 24 Hours (Sample)',
    services: ['Prescription Medicines', 'Chronic Care Refills', 'Pediatric Formulations'],
    mapCoords: { x: 24, y: 58 },
    isSample: true,
  },
  {
    id: 'fac-7',
    name: 'Khyber Diagnostics & Pathology Lab (Sample)',
    category: 'labs',
    area: 'Dabgari Gardens',
    landmark: 'Opposite Dabgari Gardens Main Gate',
    distanceKm: 4.5,
    hours: '7:00 AM – 10:00 PM (Sample)',
    services: ['Blood Panels', 'Hormone Assays', 'Home Sample Collection'],
    mapCoords: { x: 67, y: 40 },
    isSample: true,
  },
  {
    id: 'fac-8',
    name: 'University Town Diagnostic Point (Sample)',
    category: 'labs',
    area: 'University Town',
    landmark: 'Old Jamrud Road, University Town',
    distanceKm: 1.6,
    hours: '7:30 AM – 9:30 PM (Sample)',
    services: ['CBC & Lipid Panels', 'ECG', 'Digital Report Access'],
    mapCoords: { x: 34, y: 44 },
    isSample: true,
  },
  {
    id: 'fac-9',
    name: 'Gulbahar Dental & Outpatient Hub (Sample)',
    category: 'clinics',
    area: 'Gulbahar',
    landmark: 'Gulbahar No. 2 Main Road',
    distanceKm: 6.2,
    hours: '10:00 AM – 8:00 PM (Sample)',
    services: ['Dentistry', 'General Physician', 'Primary Care'],
    mapCoords: { x: 80, y: 47 },
    isSample: true,
  },
  {
    id: 'fac-10',
    name: 'Warsak Road Neighborhood Lab & Pharmacy (Sample)',
    category: 'labs',
    area: 'Warsak Road',
    landmark: 'Near Warsak Road Commercial Strip',
    distanceKm: 5.1,
    hours: '8:00 AM – 9:00 PM (Sample)',
    services: ['Routine Blood Tests', 'Home Phlebotomy', 'Same-Day Results'],
    mapCoords: { x: 46, y: 24 },
    isSample: true,
  },
];
