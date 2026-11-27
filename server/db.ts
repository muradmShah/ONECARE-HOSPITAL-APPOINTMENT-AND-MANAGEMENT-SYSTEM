import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'clinic.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    password_hash TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL CHECK (purpose IN ('invite', 'reset')),
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialty_id TEXT NOT NULL,
    specialty_name TEXT NOT NULL,
    qualifications TEXT NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 5,
    fee_pkr INTEGER NOT NULL DEFAULT 2000,
    area TEXT NOT NULL,
    clinic_name TEXT NOT NULL,
    languages_json TEXT NOT NULL,
    focus_areas_json TEXT NOT NULL,
    image TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS doctor_schedules (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS doctor_leaves (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    leave_date TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    UNIQUE(doctor_id, leave_date)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'No-show', 'Cancelled')),
    reason TEXT NOT NULL DEFAULT '',
    visit_note TEXT NOT NULL DEFAULT '',
    cancellation_reason TEXT NOT NULL DEFAULT '',
    cancelled_by TEXT NOT NULL DEFAULT '',
    reminder_sent_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doctor_slot
    ON appointments(doctor_id, appointment_date, start_time)
    WHERE status IN ('Pending', 'Confirmed');

  CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_patient_slot
    ON appointments(patient_id, appointment_date, start_time)
    WHERE status IN ('Pending', 'Confirmed');

  CREATE TABLE IF NOT EXISTS email_outbox (
    id TEXT PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    event_key TEXT UNIQUE,
    delivery_status TEXT NOT NULL,
    action_path TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
`);

export function runInTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback error if already rolled back
    }
    throw err;
  }
}

interface SeedDoctorSpec {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialtyId: string;
  specialtyName: string;
  qualifications: string;
  experienceYears: number;
  feePkr: number;
  area: string;
  clinicName: string;
  languages: string[];
  focusAreas: string[];
  image: string;
  schedules: { day: number; start: string; end: string }[];
}

const SEED_DOCTORS: SeedDoctorSpec[] = [
  {
    id: 'doc-1',
    userId: 'usr-doc-1',
    name: 'Dr. Amara Khan',
    email: 'amara.khan@clinic.local',
    specialtyId: 'general-physician',
    specialtyName: 'General Physician',
    qualifications: 'MBBS, FCPS (Medicine)',
    experienceYears: 11,
    feePkr: 2000,
    area: 'University Town',
    clinicName: 'Nowshera & Peshawar Family Care Clinic',
    languages: ['Pashto', 'Urdu', 'English'],
    focusAreas: ['Primary Care', 'Fever & Infections', 'Diabetes Follow-up'],
    image: '/src/assets/images/doctor_portrait_female_1_1795507994196.jpg',
    schedules: [
      { day: 1, start: '09:00', end: '13:00' },
      { day: 2, start: '09:00', end: '13:00' },
      { day: 3, start: '14:00', end: '18:00' },
      { day: 4, start: '09:00', end: '13:00' },
      { day: 5, start: '15:00', end: '19:00' },
      { day: 6, start: '10:00', end: '14:00' },
    ],
  },
  {
    id: 'doc-2',
    userId: 'usr-doc-2',
    name: 'Dr. Salman Afridi',
    email: 'salman.afridi@clinic.local',
    specialtyId: 'cardiology',
    specialtyName: 'Cardiology',
    qualifications: 'MBBS, FCPS (Cardiology)',
    experienceYears: 16,
    feePkr: 3000,
    area: 'Hayatabad',
    clinicName: 'Nowshera & Peshawar Family Care Clinic',
    languages: ['Pashto', 'Urdu', 'English'],
    focusAreas: ['Blood Pressure Management', 'Preventive Cardiology', 'ECG Review'],
    image: '/src/assets/images/doctor_portrait_male_2_1795508007269.jpg',
    schedules: [
      { day: 1, start: '16:00', end: '20:00' },
      { day: 2, start: '16:00', end: '20:00' },
      { day: 3, start: '16:00', end: '20:00' },
      { day: 4, start: '16:00', end: '20:00' },
      { day: 5, start: '16:00', end: '19:30' },
    ],
  },
  {
    id: 'doc-3',
    userId: 'usr-doc-3',
    name: 'Dr. Bilal Khattak',
    email: 'bilal.khattak@clinic.local',
    specialtyId: 'orthopedics',
    specialtyName: 'Orthopedics',
    qualifications: 'MBBS, MS (Orthopedics)',
    experienceYears: 13,
    feePkr: 2500,
    area: 'Dabgari Gardens',
    clinicName: 'Nowshera & Peshawar Family Care Clinic',
    languages: ['Pashto', 'Urdu', 'English'],
    focusAreas: ['Knee & Joint Pain', 'Spine Assessment', 'Fracture Recovery'],
    image: '/src/assets/images/doctor_portrait_male_1_1795507998535.jpg',
    schedules: [
      { day: 0, start: '10:00', end: '13:00' },
      { day: 2, start: '15:00', end: '19:00' },
      { day: 4, start: '15:00', end: '19:00' },
      { day: 6, start: '11:00', end: '15:00' },
    ],
  },
  {
    id: 'doc-4',
    userId: 'usr-doc-4',
    name: 'Dr. Zara Durrani',
    email: 'zara.durrani@clinic.local',
    specialtyId: 'pediatrics',
    specialtyName: 'Pediatrics',
    qualifications: 'MBBS, DCH, FCPS (Pediatrics)',
    experienceYears: 9,
    feePkr: 1800,
    area: 'Saddar',
    clinicName: 'Nowshera & Peshawar Family Care Clinic',
    languages: ['Pashto', 'Urdu', 'English'],
    focusAreas: ['Childhood Fevers', 'Immunization Schedules', 'Growth Checkups'],
    image: '/src/assets/images/doctor_portrait_female_2_1795507990522.jpg',
    schedules: [
      { day: 1, start: '10:00', end: '14:00' },
      { day: 2, start: '10:00', end: '14:00' },
      { day: 3, start: '10:00', end: '14:00' },
      { day: 5, start: '10:00', end: '13:00' },
      { day: 6, start: '10:00', end: '14:00' },
    ],
  },
  {
    id: 'doc-5',
    userId: 'usr-doc-5',
    name: 'Dr. Hina Yousafzai',
    email: 'hina.yousafzai@clinic.local',
    specialtyId: 'gynecology',
    specialtyName: 'Gynecology',
    qualifications: 'MBBS, FCPS (Obs & Gynae)',
    experienceYears: 12,
    feePkr: 2500,
    area: 'Hayatabad',
    clinicName: 'Nowshera & Peshawar Family Care Clinic',
    languages: ['Pashto', 'Urdu', 'English'],
    focusAreas: ['Antenatal Care', 'Hormonal Balance', 'Preventive Screenings'],
    image: '/src/assets/images/doctor_portrait_female_1_1795507994196.jpg',
    schedules: [
      { day: 1, start: '14:00', end: '18:00' },
      { day: 3, start: '14:00', end: '18:00' },
      { day: 4, start: '14:00', end: '18:00' },
      { day: 6, start: '12:00', end: '16:00' },
    ],
  },
  {
    id: 'doc-6',
    userId: 'usr-doc-6',
    name: 'Dr. Tariq Shinwari',
    email: 'tariq.shinwari@clinic.local',
    specialtyId: 'neurology',
    specialtyName: 'Neurology',
    qualifications: 'MBBS, FCPS (Neurology)',
    experienceYears: 15,
    feePkr: 3000,
    area: 'Dabgari Gardens',
    clinicName: 'Nowshera & Peshawar Family Care Clinic',
    languages: ['Pashto', 'Urdu', 'English'],
    focusAreas: ['Chronic Migraines', 'Nerve Pain', 'Balance & Vertigo'],
    image: '/src/assets/images/doctor_portrait_male_2_1795508007269.jpg',
    schedules: [
      { day: 1, start: '17:00', end: '20:30' },
      { day: 3, start: '17:00', end: '20:30' },
      { day: 5, start: '17:00', end: '20:30' },
    ],
  },
];

export function seedClinicDataIfEmpty(): void {
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM doctors').get() as {
    count: number;
  };
  if (countRow.count > 0) return;

  const nowIso = new Date().toISOString();
  runInTransaction(() => {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, phone, role, password_hash, created_at)
      VALUES (?, ?, ?, '', 'doctor', NULL, ?)
    `);
    const insertDoctor = db.prepare(`
      INSERT INTO doctors (
        id, user_id, specialty_id, specialty_name, qualifications,
        experience_years, fee_pkr, area, clinic_name, languages_json,
        focus_areas_json, image, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const insertSchedule = db.prepare(`
      INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const doc of SEED_DOCTORS) {
      insertUser.run(doc.userId, doc.name, doc.email, nowIso);
      insertDoctor.run(
        doc.id,
        doc.userId,
        doc.specialtyId,
        doc.specialtyName,
        doc.qualifications,
        doc.experienceYears,
        doc.feePkr,
        doc.area,
        doc.clinicName,
        JSON.stringify(doc.languages),
        JSON.stringify(doc.focusAreas),
        doc.image,
        nowIso
      );
      doc.schedules.forEach((sched, idx) => {
        insertSchedule.run(
          `sched-${doc.id}-${idx}`,
          doc.id,
          sched.day,
          sched.start,
          sched.end
        );
      });
    }
  });
}
