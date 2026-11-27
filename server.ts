import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  clearSessionCookie,
  createSession,
  deleteSessionFromRequest,
  generateOpaqueToken,
  hashPassword,
  hashToken,
  resolveSessionUser,
  setSessionCookie,
  verifyPassword,
  type AuthUser,
  type UserRole,
} from './server/auth.ts';
import { runClinicAutomations } from './server/automations.ts';
import { db, runInTransaction, seedClinicDataIfEmpty } from './server/db.ts';
import { isSmtpConfigured, sendClinicEmail } from './server/mailer.ts';
import {
  DAY_NAMES,
  generateThirtyMinSlots,
  getClinicClock,
  getDayOfWeekFromDateStr,
  isValidDateStr,
  isValidTimeHm,
  minutesToTimeHm,
  parseClinicDateTimeMs,
  timeHmToMinutes,
} from './server/time.ts';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: AuthUser;
  }
}

const SPECIALTY_MAP: Record<string, string> = {
  cardiology: 'Cardiology',
  dermatology: 'Dermatology',
  neurology: 'Neurology',
  orthopedics: 'Orthopedics',
  pediatrics: 'Pediatrics',
  gynecology: 'Gynecology',
  dentistry: 'Dentistry',
  'general-physician': 'General Physician',
  ent: 'ENT Specialist',
  ophthalmology: 'Ophthalmology',
  pulmonology: 'Pulmonology',
  endocrinology: 'Endocrinology',
};

const DOCTOR_AVATAR_BY_INDEX = [
  '/src/assets/images/doctor_portrait_female_1_1795507994196.jpg',
  '/src/assets/images/doctor_portrait_male_1_1795507998535.jpg',
  '/src/assets/images/doctor_portrait_female_2_1795507990522.jpg',
  '/src/assets/images/doctor_portrait_male_2_1795508007269.jpg',
];

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

seedClinicDataIfEmpty();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { user, csrfOk } = resolveSessionUser(req);
  if (!csrfOk) {
    res.status(403).json({ error: 'Cross-site request blocked.' });
    return;
  }
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({
        error: `Access denied. This action requires ${roles.join(' or ')} permissions.`,
      });
      return;
    }
    next();
  };
}

function getAdminSetupState(): {
  hasAdminAccount: boolean;
  envPasscodeConfigured: boolean;
  needsAdminSetup: boolean;
} {
  const envPasscode = String(process.env.ADMIN_PASSCODE || '').trim();
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'")
    .get() as { count: number };
  const hasAdminAccount = row.count > 0;
  const envPasscodeConfigured = envPasscode.length > 0;
  return {
    hasAdminAccount,
    envPasscodeConfigured,
    needsAdminSetup: !hasAdminAccount && !envPasscodeConfigured,
  };
}

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

function mapDoctorRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    email: row.email ? String(row.email) : undefined,
    specialtyId: String(row.specialty_id),
    specialtyName: String(row.specialty_name),
    qualifications: String(row.qualifications),
    experienceYears: Number(row.experience_years),
    feePkr: Number(row.fee_pkr),
    area: String(row.area),
    clinicName: String(row.clinic_name),
    languages: JSON.parse(String(row.languages_json || '[]')) as string[],
    focusAreas: JSON.parse(String(row.focus_areas_json || '[]')) as string[],
    image: String(row.image),
    isActive: Number(row.is_active) === 1,
    hasPassword: row.has_password !== undefined ? Boolean(row.has_password) : undefined,
  };
}

function validateBookingSlot(
  doctorId: string,
  dateStr: string,
  startTime: string,
  patientId: string,
  excludeAppointmentId?: string
): {
  ok: true;
  endTime: string;
  startAtIso: string;
  endAtIso: string;
  doctorName: string;
  clinicName: string;
} | { ok: false; status: number; error: string } {
  if (!isValidDateStr(dateStr)) {
    return { ok: false, status: 400, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  if (!isValidTimeHm(startTime)) {
    return { ok: false, status: 400, error: 'Invalid time format. Use HH:MM.' };
  }

  const startMin = timeHmToMinutes(startTime);
  if (startMin % 30 !== 0) {
    return {
      ok: false,
      status: 400,
      error: 'Appointments must start on a 30-minute slot (:00 or :30).',
    };
  }
  const endTime = minutesToTimeHm(startMin + 30);

  const doctorRow = db
    .prepare(
      `SELECT d.id, d.is_active, d.clinic_name, u.name AS doctor_name
       FROM doctors d
       JOIN users u ON u.id = d.user_id
       WHERE d.id = ?`
    )
    .get(doctorId) as
    | { id: string; is_active: number; clinic_name: string; doctor_name: string }
    | undefined;

  if (!doctorRow) {
    return { ok: false, status: 404, error: 'Selected doctor was not found.' };
  }
  if (doctorRow.is_active !== 1) {
    return {
      ok: false,
      status: 400,
      error: 'This doctor is currently deactivated and not accepting bookings.',
    };
  }

  const startAtMs = parseClinicDateTimeMs(dateStr, startTime);
  const endAtMs = parseClinicDateTimeMs(dateStr, endTime);
  if (startAtMs === null || endAtMs === null) {
    return { ok: false, status: 400, error: 'Invalid appointment date or time.' };
  }

  const nowMs = Date.now();
  if (startAtMs <= nowMs) {
    return {
      ok: false,
      status: 400,
      error: 'Cannot book a time slot that has already passed.',
    };
  }

  const leaveRow = db
    .prepare('SELECT id FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?')
    .get(doctorId, dateStr) as { id: string } | undefined;
  if (leaveRow) {
    return {
      ok: false,
      status: 400,
      error: 'This doctor is on leave on the selected date.',
    };
  }

  const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
  const schedules = db
    .prepare(
      `SELECT start_time, end_time
       FROM doctor_schedules
       WHERE doctor_id = ? AND day_of_week = ?`
    )
    .all(doctorId, dayOfWeek) as { start_time: string; end_time: string }[];

  const insideHours = schedules.some((s) => {
    const wStart = timeHmToMinutes(s.start_time);
    const wEnd = timeHmToMinutes(s.end_time);
    return startMin >= wStart && startMin + 30 <= wEnd;
  });

  if (!insideHours) {
    return {
      ok: false,
      status: 400,
      error: 'Selected time slot is outside the doctor’s working hours.',
    };
  }

  const doctorConflict = excludeAppointmentId
    ? (db
        .prepare(
          `SELECT id FROM appointments
           WHERE doctor_id = ? AND appointment_date = ? AND start_time = ?
             AND status IN ('Pending', 'Confirmed') AND id != ?`
        )
        .get(doctorId, dateStr, startTime, excludeAppointmentId) as { id: string } | undefined)
    : (db
        .prepare(
          `SELECT id FROM appointments
           WHERE doctor_id = ? AND appointment_date = ? AND start_time = ?
             AND status IN ('Pending', 'Confirmed')`
        )
        .get(doctorId, dateStr, startTime) as { id: string } | undefined);

  if (doctorConflict) {
    return {
      ok: false,
      status: 409,
      error: 'This time slot is already taken for this doctor. Please select another free slot.',
    };
  }

  const patientConflict = excludeAppointmentId
    ? (db
        .prepare(
          `SELECT id FROM appointments
           WHERE patient_id = ? AND appointment_date = ? AND start_time = ?
             AND status IN ('Pending', 'Confirmed') AND id != ?`
        )
        .get(patientId, dateStr, startTime, excludeAppointmentId) as { id: string } | undefined)
    : (db
        .prepare(
          `SELECT id FROM appointments
           WHERE patient_id = ? AND appointment_date = ? AND start_time = ?
             AND status IN ('Pending', 'Confirmed')`
        )
        .get(patientId, dateStr, startTime) as { id: string } | undefined);

  if (patientConflict) {
    return {
      ok: false,
      status: 409,
      error: 'You already have another appointment booked at this exact date and time.',
    };
  }

  return {
    ok: true,
    endTime,
    startAtIso: new Date(startAtMs).toISOString(),
    endAtIso: new Date(endAtMs).toISOString(),
    doctorName: doctorRow.doctor_name,
    clinicName: doctorRow.clinic_name,
  };
}

async function startServer(): Promise<void> {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '256kb' }));

  // Health & clinic clock
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      clock: getClinicClock(),
      smtpConfigured: isSmtpConfigured(),
      ...getAdminSetupState(),
    });
  });

  // Auth status & session restoration
  app.get('/api/auth/me', (req, res) => {
    const { user } = resolveSessionUser(req);
    res.json({
      user,
      clock: getClinicClock(),
      smtpConfigured: isSmtpConfigured(),
      ...getAdminSetupState(),
    });
  });

  // First-run Admin Setup (only active if ADMIN_PASSCODE unset and no admin exists)
  app.post('/api/auth/claim-admin', (req, res) => {
    const state = getAdminSetupState();
    if (!state.needsAdminSetup) {
      res.status(403).json({
        error: 'Clinic admin account is already configured. Please sign in normally.',
      });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2) {
      res.status(400).json({ error: 'Please enter the clinic manager name.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please enter a valid admin email address.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const result = runInTransaction(() => {
      const recheck = getAdminSetupState();
      if (!recheck.needsAdminSetup) {
        return { conflict: true as const };
      }
      const existingEmail = db
        .prepare('SELECT id FROM users WHERE email = ?')
        .get(email) as { id: string } | undefined;
      if (existingEmail) {
        return { emailTaken: true as const };
      }

      const userId = `usr-adm-${crypto.randomUUID()}`;
      db.prepare(
        `INSERT INTO users (id, name, email, phone, role, password_hash, created_at)
         VALUES (?, ?, ?, '', 'admin', ?, ?)`
      ).run(userId, name, email, hashPassword(password), new Date().toISOString());

      return { userId, conflict: false as const, emailTaken: false as const };
    });

    if (result.conflict) {
      res.status(403).json({ error: 'Admin account has already been claimed.' });
      return;
    }
    if (result.emailTaken) {
      res.status(409).json({ error: 'That email address is already registered.' });
      return;
    }

    const session = createSession(result.userId);
    setSessionCookie(req, res, session.rawToken);
    res.status(201).json({
      token: session.rawToken,
      user: {
        id: result.userId,
        name,
        email,
        phone: '',
        role: 'admin' as UserRole,
        doctorId: null,
      },
    });
  });

  // Patient self-registration (strictly forces role = 'patient')
  app.post('/api/auth/register', (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email) as { id: string } | undefined;
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const userId = `usr-pat-${crypto.randomUUID()}`;
    db.prepare(
      `INSERT INTO users (id, name, email, phone, role, password_hash, created_at)
       VALUES (?, ?, ?, ?, 'patient', ?, ?)`
    ).run(userId, name, email, phone, hashPassword(password), new Date().toISOString());

    const session = createSession(userId);
    setSessionCookie(req, res, session.rawToken);
    res.status(201).json({
      token: session.rawToken,
      user: {
        id: userId,
        name,
        email,
        phone,
        role: 'patient' as UserRole,
        doctorId: null,
      },
    });
  });

  // Unified Sign In (Patient, Doctor, or Admin — plus optional env ADMIN_PASSCODE override)
  app.post('/api/auth/login', (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const envPasscode = String(process.env.ADMIN_PASSCODE || '').trim();
    const userRow = db
      .prepare(
        `SELECT u.id, u.name, u.email, u.phone, u.role, u.password_hash, d.id AS doctor_id
         FROM users u
         LEFT JOIN doctors d ON d.user_id = u.id
         WHERE u.email = ?`
      )
      .get(email) as
      | {
          id: string;
          name: string;
          email: string;
          phone: string;
          role: UserRole;
          password_hash: string | null;
          doctor_id: string | null;
        }
      | undefined;

    // If ADMIN_PASSCODE env var is configured, allow admin sign-in against env passcode
    if (envPasscode && (!userRow || userRow.role === 'admin')) {
      const aBuf = Buffer.from(password);
      const bBuf = Buffer.from(envPasscode);
      const matchesEnv =
        aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
      if (matchesEnv) {
        let adminId = userRow?.id;
        let adminName = userRow?.name || 'Clinic Manager';
        if (!adminId) {
          adminId = `usr-adm-${crypto.randomUUID()}`;
          db.prepare(
            `INSERT INTO users (id, name, email, phone, role, password_hash, created_at)
             VALUES (?, ?, ?, '', 'admin', NULL, ?)`
          ).run(adminId, adminName, email, new Date().toISOString());
        }
        const session = createSession(adminId);
        setSessionCookie(req, res, session.rawToken);
        res.json({
          token: session.rawToken,
          user: {
            id: adminId,
            name: adminName,
            email,
            phone: '',
            role: 'admin' as UserRole,
            doctorId: null,
          },
        });
        return;
      }
    }

    if (!userRow || !userRow.password_hash) {
      res.status(401).json({
        error: userRow && !userRow.password_hash
          ? 'Your account password has not been set yet. Please use the Set Password link from your invite email.'
          : 'Invalid email or password.',
      });
      return;
    }

    if (!verifyPassword(password, userRow.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const session = createSession(userRow.id);
    setSessionCookie(req, res, session.rawToken);
    res.json({
      token: session.rawToken,
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        phone: userRow.phone,
        role: userRow.role,
        doctorId: userRow.doctor_id ?? null,
      },
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    deleteSessionFromRequest(req);
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  // Set password using single-use email token (Test Case 2)
  app.post('/api/auth/set-password', (req, res) => {
    const rawToken = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!rawToken) {
      res.status(400).json({ error: 'Password setup token is required.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const tokenHash = hashToken(rawToken);
    const nowIso = new Date().toISOString();

    const outcome = runInTransaction(() => {
      const tokenRow = db
        .prepare(
          `SELECT pt.user_id, pt.expires_at, pt.used_at, u.id, u.name, u.email, u.phone, u.role, d.id AS doctor_id
           FROM password_tokens pt
           JOIN users u ON u.id = pt.user_id
           LEFT JOIN doctors d ON d.user_id = u.id
           WHERE pt.token_hash = ?`
        )
        .get(tokenHash) as
        | {
            user_id: string;
            expires_at: string;
            used_at: string | null;
            id: string;
            name: string;
            email: string;
            phone: string;
            role: UserRole;
            doctor_id: string | null;
          }
        | undefined;

      if (!tokenRow) {
        return {
          ok: false as const,
          error: 'Invalid or unrecognized password setup link.',
          status: 400,
        };
      }
      if (tokenRow.used_at) {
        return {
          ok: false as const,
          error: 'This password setup link has already been used.',
          status: 400,
        };
      }
      if (Date.parse(tokenRow.expires_at) <= Date.now()) {
        return {
          ok: false as const,
          error: 'This password setup link has expired.',
          status: 400,
        };
      }

      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        hashPassword(password),
        tokenRow.user_id
      );
      db.prepare('UPDATE password_tokens SET used_at = ? WHERE token_hash = ?').run(
        nowIso,
        tokenHash
      );

      return { ok: true as const, user: tokenRow };
    });

    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error });
      return;
    }

    const session = createSession(outcome.user.id);
    setSessionCookie(req, res, session.rawToken);
    res.json({
      token: session.rawToken,
      user: {
        id: outcome.user.id,
        name: outcome.user.name,
        email: outcome.user.email,
        phone: outcome.user.phone,
        role: outcome.user.role,
        doctorId: outcome.user.doctor_id ?? null,
      },
    });
  });

  // Public doctor listing (active doctors only by default, no private emails exposed)
  app.get('/api/doctors', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT d.id, d.user_id, u.name, d.specialty_id, d.specialty_name, d.qualifications,
                d.experience_years, d.fee_pkr, d.area, d.clinic_name,
                d.languages_json, d.focus_areas_json, d.image, d.is_active
         FROM doctors d
         JOIN users u ON u.id = d.user_id
         WHERE d.is_active = 1
         ORDER BY d.experience_years DESC, u.name ASC`
      )
      .all() as Record<string, unknown>[];

    const schedules = db
      .prepare('SELECT id, doctor_id, day_of_week, start_time, end_time FROM doctor_schedules')
      .all() as {
      id: string;
      doctor_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
    }[];

    const doctors = rows.map((row) => {
      const mapped = mapDoctorRow(row);
      const docSchedules = schedules
        .filter((s) => s.doctor_id === mapped.id)
        .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
      return {
        ...mapped,
        schedules: docSchedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.day_of_week,
          dayName: DAY_NAMES[s.day_of_week],
          startTime: s.start_time,
          endTime: s.end_time,
        })),
      };
    });

    res.json({ doctors, clock: getClinicClock() });
  });

  // Public 30-min free slots for a doctor on a given date
  app.get('/api/doctors/:id/slots', (req, res) => {
    const doctorId = req.params.id;
    const dateStr = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    if (!isValidDateStr(dateStr)) {
      res.status(400).json({ error: 'Valid date query parameter (YYYY-MM-DD) is required.' });
      return;
    }

    const doctor = db
      .prepare(
        `SELECT d.id, d.is_active, u.name
         FROM doctors d
         JOIN users u ON u.id = d.user_id
         WHERE d.id = ?`
      )
      .get(doctorId) as { id: string; is_active: number; name: string } | undefined;

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found.' });
      return;
    }

    if (doctor.is_active !== 1) {
      res.json({
        doctorId,
        date: dateStr,
        isActive: false,
        onLeave: false,
        slots: [],
        message: 'This doctor is currently inactive and not accepting bookings.',
      });
      return;
    }

    const leaveRow = db
      .prepare('SELECT reason FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?')
      .get(doctorId, dateStr) as { reason: string } | undefined;

    if (leaveRow) {
      res.json({
        doctorId,
        date: dateStr,
        isActive: true,
        onLeave: true,
        slots: [],
        message: leaveRow.reason
          ? `Doctor is on leave (${leaveRow.reason}).`
          : 'Doctor is on leave on this date.',
      });
      return;
    }

    const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
    const schedules = db
      .prepare(
        `SELECT start_time, end_time
         FROM doctor_schedules
         WHERE doctor_id = ? AND day_of_week = ?
         ORDER BY start_time ASC`
      )
      .all(doctorId, dayOfWeek) as { start_time: string; end_time: string }[];

    if (schedules.length === 0) {
      res.json({
        doctorId,
        date: dateStr,
        isActive: true,
        onLeave: false,
        slots: [],
        message: `No clinic hours scheduled on ${DAY_NAMES[dayOfWeek]}.`,
      });
      return;
    }

    const bookedRows = db
      .prepare(
        `SELECT start_time FROM appointments
         WHERE doctor_id = ? AND appointment_date = ? AND status IN ('Pending', 'Confirmed')`
      )
      .all(doctorId, dateStr) as { start_time: string }[];
    const bookedSet = new Set(bookedRows.map((r) => r.start_time));

    const nowMs = Date.now();
    const freeSlots: { startTime: string; endTime: string; label: string }[] = [];

    for (const sched of schedules) {
      const intervals = generateThirtyMinSlots(sched.start_time, sched.end_time);
      for (const slot of intervals) {
        const slotStartMs = parseClinicDateTimeMs(dateStr, slot.startTime);
        if (slotStartMs === null || slotStartMs <= nowMs) continue;
        if (bookedSet.has(slot.startTime)) continue;
        freeSlots.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          label: `${slot.startTime} – ${slot.endTime}`,
        });
      }
    }

    res.json({
      doctorId,
      date: dateStr,
      isActive: true,
      onLeave: false,
      slots: freeSlots,
      message:
        freeSlots.length === 0
          ? 'All slots for this date are either booked or have already passed.'
          : undefined,
    });
  });

  // PATIENT: Book an appointment (Test Cases 1, 2, 3, 4, 5)
  app.post('/api/appointments', requireAuth, requireRole(['patient']), (req, res) => {
    const patient = req.authUser!;
    const doctorId = typeof req.body?.doctorId === 'string' ? req.body.doctorId.trim() : '';
    const dateStr = typeof req.body?.date === 'string' ? req.body.date.trim() : '';
    const startTime = typeof req.body?.startTime === 'string' ? req.body.startTime.trim() : '';
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';

    if (!doctorId || !dateStr || !startTime) {
      res.status(400).json({ error: 'doctorId, date, and startTime are required.' });
      return;
    }

    try {
      const created = runInTransaction(() => {
        const check = validateBookingSlot(doctorId, dateStr, startTime, patient.id);
        if (!check.ok) {
          return check;
        }

        const apptId = `appt-${crypto.randomUUID()}`;
        const nowIso = new Date().toISOString();

        db.prepare(
          `INSERT INTO appointments (
            id, doctor_id, patient_id, appointment_date, start_time, end_time,
            start_at, end_at, status, reason, visit_note,
            cancellation_reason, cancelled_by, reminder_sent_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, '', '', '', NULL, ?, ?)`
        ).run(
          apptId,
          doctorId,
          patient.id,
          dateStr,
          startTime,
          check.endTime,
          check.startAtIso,
          check.endAtIso,
          reason,
          nowIso,
          nowIso
        );

        return {
          ok: true as const,
          appointment: {
            id: apptId,
            doctorId,
            doctorName: check.doctorName,
            clinicName: check.clinicName,
            appointmentDate: dateStr,
            startTime,
            endTime: check.endTime,
            startAt: check.startAtIso,
            endAt: check.endAtIso,
            status: 'Pending',
            reason,
            visitNote: '',
            createdAt: nowIso,
          },
        };
      });

      if (!created.ok) {
        res.status(created.status).json({ error: created.error });
        return;
      }

      res.status(201).json({ appointment: created.appointment });
    } catch (err) {
      if (String(err).includes('UNIQUE constraint failed')) {
        res.status(409).json({
          error: 'Slot conflict detected. Please choose another available time slot.',
        });
        return;
      }
      throw err;
    }
  });

  // PATIENT / DOCTOR: List own appointments (Admin MUST use /api/admin/dashboard which omits visit_note)
  app.get('/api/appointments', requireAuth, (req, res) => {
    const user = req.authUser!;
    if (user.role === 'admin') {
      res.status(403).json({
        error: 'Admins use the clinic dashboard and cannot read individual patient appointment notes.',
      });
      return;
    }

    if (user.role === 'patient') {
      const rows = db
        .prepare(
          `SELECT a.id, a.doctor_id, a.patient_id, a.appointment_date, a.start_time, a.end_time,
                  a.start_at, a.end_at, a.status, a.reason, a.visit_note,
                  a.cancellation_reason, a.cancelled_by, a.created_at, a.updated_at,
                  du.name AS doctor_name, d.specialty_name, d.clinic_name, d.area, d.fee_pkr
           FROM appointments a
           JOIN doctors d ON d.id = a.doctor_id
           JOIN users du ON du.id = d.user_id
           WHERE a.patient_id = ?
           ORDER BY a.appointment_date DESC, a.start_time DESC`
        )
        .all(user.id);
      res.json({ appointments: rows, clock: getClinicClock() });
      return;
    }

    // Doctor sees only their own appointments
    if (!user.doctorId) {
      res.status(403).json({ error: 'Doctor profile not found.' });
      return;
    }

    const rows = db
      .prepare(
        `SELECT a.id, a.doctor_id, a.patient_id, a.appointment_date, a.start_time, a.end_time,
                a.start_at, a.end_at, a.status, a.reason, a.visit_note,
                a.cancellation_reason, a.cancelled_by, a.created_at, a.updated_at,
                pu.name AS patient_name, pu.email AS patient_email, pu.phone AS patient_phone
         FROM appointments a
         JOIN users pu ON pu.id = a.patient_id
         WHERE a.doctor_id = ?
         ORDER BY a.appointment_date ASC, a.start_time ASC`
      )
      .all(user.doctorId);

    res.json({ appointments: rows, clock: getClinicClock() });
  });

  // Private single appointment endpoint (Test Case 9: blocks cross-patient, cross-doctor, and admin)
  app.get('/api/appointments/:id', requireAuth, (req, res) => {
    const user = req.authUser!;
    if (user.role === 'admin') {
      res.status(403).json({
        error: 'Access denied. Visit records and notes are private between patient and doctor.',
      });
      return;
    }

    const row = db
      .prepare(
        `SELECT a.*, du.name AS doctor_name, d.specialty_name, d.clinic_name,
                pu.name AS patient_name, pu.email AS patient_email
         FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         JOIN users du ON du.id = d.user_id
         JOIN users pu ON pu.id = a.patient_id
         WHERE a.id = ?`
      )
      .get(req.params.id) as Record<string, unknown> | undefined;

    if (!row) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    if (user.role === 'patient' && row.patient_id !== user.id) {
      res.status(403).json({ error: 'Access denied. You can only view your own appointments.' });
      return;
    }

    if (user.role === 'doctor' && row.doctor_id !== user.doctorId) {
      res.status(403).json({ error: 'Access denied. You can only view your own appointments.' });
      return;
    }

    res.json({ appointment: row });
  });

  // Explicit visit note endpoint (Test Case 9: Admin explicitly denied)
  app.get('/api/appointments/:id/note', requireAuth, (req, res) => {
    const user = req.authUser!;
    if (user.role === 'admin') {
      res.status(403).json({
        error: 'Access denied. Clinic admins cannot read private visit notes.',
      });
      return;
    }

    const row = db
      .prepare('SELECT id, patient_id, doctor_id, visit_note FROM appointments WHERE id = ?')
      .get(req.params.id) as
      | { id: string; patient_id: string; doctor_id: string; visit_note: string }
      | undefined;

    if (!row) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    if (user.role === 'patient' && row.patient_id !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    if (user.role === 'doctor' && row.doctor_id !== user.doctorId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    res.json({ id: row.id, visitNote: row.visit_note });
  });

  // PATIENT: Cancel appointment (>= 2 hours before start) (Test Case 6)
  app.post(
    '/api/appointments/:id/cancel',
    requireAuth,
    requireRole(['patient']),
    async (req, res) => {
      const patient = req.authUser!;
      const apptId = req.params.id;

      const outcome = runInTransaction(() => {
        const appt = db
          .prepare(
            `SELECT a.*, du.name AS doctor_name
             FROM appointments a
             JOIN doctors d ON d.id = a.doctor_id
             JOIN users du ON du.id = d.user_id
             WHERE a.id = ?`
          )
          .get(apptId) as
          | {
              id: string;
              patient_id: string;
              appointment_date: string;
              start_time: string;
              end_time: string;
              start_at: string;
              status: string;
              doctor_name: string;
            }
          | undefined;

        if (!appt) {
          return { ok: false as const, status: 404, error: 'Appointment not found.' };
        }
        if (appt.patient_id !== patient.id) {
          return {
            ok: false as const,
            status: 403,
            error: 'Access denied. You can only cancel your own appointments.',
          };
        }
        if (!['Pending', 'Confirmed'].includes(appt.status)) {
          return {
            ok: false as const,
            status: 400,
            error: `Cannot cancel an appointment with status "${appt.status}".`,
          };
        }

        const msUntilStart = Date.parse(appt.start_at) - Date.now();
        if (msUntilStart < TWO_HOURS_MS) {
          return {
            ok: false as const,
            status: 400,
            error:
              'Appointments can only be cancelled at least 2 hours before the scheduled start time.',
          };
        }

        const nowIso = new Date().toISOString();
        db.prepare(
          `UPDATE appointments
           SET status = 'Cancelled',
               cancellation_reason = 'Cancelled by patient',
               cancelled_by = 'patient',
               updated_at = ?
           WHERE id = ?`
        ).run(nowIso, apptId);

        return { ok: true as const, appt };
      });

      if (!outcome.ok) {
        res.status(outcome.status).json({ error: outcome.error });
        return;
      }

      await sendClinicEmail({
        recipientEmail: patient.email,
        recipientName: patient.name,
        subject: `Appointment Cancelled — ${outcome.appt.doctor_name} (${outcome.appt.appointment_date})`,
        body: `Dear ${patient.name},\n\nYour appointment with ${outcome.appt.doctor_name} on ${outcome.appt.appointment_date} at ${outcome.appt.start_time}–${outcome.appt.end_time} PKT has been cancelled as requested. That slot is now open for other patients.\n\nRaahHealth Clinic Desk`,
        category: 'cancellation',
      });

      res.json({ ok: true, status: 'Cancelled' });
    }
  );

  // PATIENT: Reschedule appointment (>= 2 hours before current start) (Test Case 6)
  app.post(
    '/api/appointments/:id/reschedule',
    requireAuth,
    requireRole(['patient']),
    async (req, res) => {
      const patient = req.authUser!;
      const apptId = req.params.id;
      const newDate = typeof req.body?.date === 'string' ? req.body.date.trim() : '';
      const newStartTime =
        typeof req.body?.startTime === 'string' ? req.body.startTime.trim() : '';

      if (!newDate || !newStartTime) {
        res.status(400).json({ error: 'New date and startTime are required.' });
        return;
      }

      try {
        const outcome = runInTransaction(() => {
          const appt = db
            .prepare(
              `SELECT a.*, du.name AS doctor_name
               FROM appointments a
               JOIN doctors d ON d.id = a.doctor_id
               JOIN users du ON du.id = d.user_id
               WHERE a.id = ?`
            )
            .get(apptId) as
            | {
                id: string;
                doctor_id: string;
                patient_id: string;
                appointment_date: string;
                start_time: string;
                start_at: string;
                status: string;
                doctor_name: string;
              }
            | undefined;

          if (!appt) {
            return { ok: false as const, status: 404, error: 'Appointment not found.' };
          }
          if (appt.patient_id !== patient.id) {
            return {
              ok: false as const,
              status: 403,
              error: 'Access denied. You can only reschedule your own appointments.',
            };
          }
          if (!['Pending', 'Confirmed'].includes(appt.status)) {
            return {
              ok: false as const,
              status: 400,
              error: `Cannot reschedule an appointment with status "${appt.status}".`,
            };
          }

          const msUntilStart = Date.parse(appt.start_at) - Date.now();
          if (msUntilStart < TWO_HOURS_MS) {
            return {
              ok: false as const,
              status: 400,
              error:
                'Appointments can only be rescheduled at least 2 hours before the current start time.',
            };
          }

          if (appt.appointment_date === newDate && appt.start_time === newStartTime) {
            return {
              ok: false as const,
              status: 400,
              error: 'Please select a different date or time slot to reschedule.',
            };
          }

          const check = validateBookingSlot(
            appt.doctor_id,
            newDate,
            newStartTime,
            patient.id,
            appt.id
          );
          if (!check.ok) {
            return check;
          }

          const nowIso = new Date().toISOString();
          db.prepare(
            `UPDATE appointments
             SET appointment_date = ?,
                 start_time = ?,
                 end_time = ?,
                 start_at = ?,
                 end_at = ?,
                 status = 'Pending',
                 reminder_sent_at = NULL,
                 updated_at = ?
             WHERE id = ?`
          ).run(
            newDate,
            newStartTime,
            check.endTime,
            check.startAtIso,
            check.endAtIso,
            nowIso,
            apptId
          );

          return {
            ok: true as const,
            oldDate: appt.appointment_date,
            oldStartTime: appt.start_time,
            doctorName: check.doctorName,
            newEndTime: check.endTime,
          };
        });

        if (!outcome.ok) {
          res.status(outcome.status).json({ error: outcome.error });
          return;
        }

        await sendClinicEmail({
          recipientEmail: patient.email,
          recipientName: patient.name,
          subject: `Appointment Rescheduled (Pending) — ${outcome.doctorName}`,
          body: `Dear ${patient.name},\n\nYour appointment with ${outcome.doctorName} has been moved from ${outcome.oldDate} at ${outcome.oldStartTime} to ${newDate} at ${newStartTime}–${outcome.newEndTime} PKT. Its status is now Pending confirmation from the doctor.\n\nRaahHealth Clinic Desk`,
          category: 'reschedule',
        });

        res.json({ ok: true, status: 'Pending' });
      } catch (err) {
        if (String(err).includes('UNIQUE constraint failed')) {
          res.status(409).json({ error: 'Selected new slot is no longer available.' });
          return;
        }
        throw err;
      }
    }
  );

  // DOCTOR: Confirm appointment (Test Cases 1, 8)
  app.post(
    '/api/doctor/appointments/:id/confirm',
    requireAuth,
    requireRole(['doctor']),
    async (req, res) => {
      const doctorUser = req.authUser!;
      const apptId = req.params.id;

      const outcome = runInTransaction(() => {
        const appt = db
          .prepare(
            `SELECT a.*, pu.name AS patient_name, pu.email AS patient_email, d.clinic_name
             FROM appointments a
             JOIN users pu ON pu.id = a.patient_id
             JOIN doctors d ON d.id = a.doctor_id
             WHERE a.id = ?`
          )
          .get(apptId) as
          | {
              id: string;
              doctor_id: string;
              appointment_date: string;
              start_time: string;
              end_time: string;
              start_at: string;
              status: string;
              patient_name: string;
              patient_email: string;
              clinic_name: string;
            }
          | undefined;

        if (!appt) {
          return { ok: false as const, status: 404, error: 'Appointment not found.' };
        }
        if (appt.doctor_id !== doctorUser.doctorId) {
          return {
            ok: false as const,
            status: 403,
            error: 'Access denied. You can only confirm your own appointments.',
          };
        }
        if (appt.status !== 'Pending') {
          return {
            ok: false as const,
            status: 400,
            error: `Only Pending appointments can be confirmed (current: ${appt.status}).`,
          };
        }
        if (Date.parse(appt.start_at) <= Date.now()) {
          return {
            ok: false as const,
            status: 400,
            error: 'Cannot confirm an appointment whose start time has already passed.',
          };
        }

        db.prepare(
          `UPDATE appointments SET status = 'Confirmed', updated_at = ? WHERE id = ?`
        ).run(new Date().toISOString(), apptId);

        return { ok: true as const, appt };
      });

      if (!outcome.ok) {
        res.status(outcome.status).json({ error: outcome.error });
        return;
      }

      await sendClinicEmail({
        recipientEmail: outcome.appt.patient_email,
        recipientName: outcome.appt.patient_name,
        subject: `Appointment Confirmed — ${doctorUser.name} (${outcome.appt.appointment_date})`,
        body: `Dear ${outcome.appt.patient_name},\n\nYour appointment with ${doctorUser.name} on ${outcome.appt.appointment_date} at ${outcome.appt.start_time}–${outcome.appt.end_time} PKT at ${outcome.appt.clinic_name} is now Confirmed.\n\nIf your plans change, please cancel or reschedule at least 2 hours before the visit.\n\nRaahHealth Clinic Desk`,
        category: 'confirmation',
      });

      res.json({ ok: true, status: 'Confirmed' });
    }
  );

  // DOCTOR: Reject pending appointment
  app.post(
    '/api/doctor/appointments/:id/reject',
    requireAuth,
    requireRole(['doctor']),
    async (req, res) => {
      const doctorUser = req.authUser!;
      const apptId = req.params.id;
      const reason =
        typeof req.body?.reason === 'string' && req.body.reason.trim()
          ? req.body.reason.trim().slice(0, 240)
          : 'Declined by doctor';

      const outcome = runInTransaction(() => {
        const appt = db
          .prepare(
            `SELECT a.*, pu.name AS patient_name, pu.email AS patient_email
             FROM appointments a
             JOIN users pu ON pu.id = a.patient_id
             WHERE a.id = ?`
          )
          .get(apptId) as
          | {
              id: string;
              doctor_id: string;
              appointment_date: string;
              start_time: string;
              end_time: string;
              status: string;
              patient_name: string;
              patient_email: string;
            }
          | undefined;

        if (!appt) {
          return { ok: false as const, status: 404, error: 'Appointment not found.' };
        }
        if (appt.doctor_id !== doctorUser.doctorId) {
          return {
            ok: false as const,
            status: 403,
            error: 'Access denied. You can only manage your own appointments.',
          };
        }
        if (appt.status !== 'Pending') {
          return {
            ok: false as const,
            status: 400,
            error: `Only Pending appointments can be rejected (current: ${appt.status}).`,
          };
        }

        db.prepare(
          `UPDATE appointments
           SET status = 'Cancelled',
               cancellation_reason = ?,
               cancelled_by = 'doctor',
               updated_at = ?
           WHERE id = ?`
        ).run(reason, new Date().toISOString(), apptId);

        return { ok: true as const, appt };
      });

      if (!outcome.ok) {
        res.status(outcome.status).json({ error: outcome.error });
        return;
      }

      await sendClinicEmail({
        recipientEmail: outcome.appt.patient_email,
        recipientName: outcome.appt.patient_name,
        subject: `Appointment Request Declined — ${doctorUser.name}`,
        body: `Dear ${outcome.appt.patient_name},\n\nYour appointment request with ${doctorUser.name} on ${outcome.appt.appointment_date} at ${outcome.appt.start_time}–${outcome.appt.end_time} PKT could not be accommodated (${reason}).\n\nPlease choose another available time slot or specialist.\n\nRaahHealth Clinic Desk`,
        category: 'rejection',
      });

      res.json({ ok: true, status: 'Cancelled' });
    }
  );

  // DOCTOR: Complete or mark No-show (ONLY once visit start time has passed! Test Case 5)
  app.post(
    '/api/doctor/appointments/:id/complete',
    requireAuth,
    requireRole(['doctor']),
    (req, res) => {
      const doctorUser = req.authUser!;
      const apptId = req.params.id;
      const outcomeStatus = req.body?.outcome === 'No-show' ? 'No-show' : 'Completed';
      const visitNote =
        typeof req.body?.visitNote === 'string'
          ? req.body.visitNote.trim().slice(0, 1000)
          : '';

      const appt = db
        .prepare('SELECT id, doctor_id, status, start_at FROM appointments WHERE id = ?')
        .get(apptId) as
        | { id: string; doctor_id: string; status: string; start_at: string }
        | undefined;

      if (!appt) {
        res.status(404).json({ error: 'Appointment not found.' });
        return;
      }
      if (appt.doctor_id !== doctorUser.doctorId) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }
      if (appt.status !== 'Confirmed') {
        res.status(400).json({
          error: `Only Confirmed appointments can be marked ${outcomeStatus}.`,
        });
        return;
      }
      if (Date.parse(appt.start_at) > Date.now()) {
        res.status(400).json({
          error:
            'You cannot mark an appointment Completed or No-show before its scheduled start time.',
        });
        return;
      }

      db.prepare(
        `UPDATE appointments
         SET status = ?, visit_note = ?, updated_at = ?
         WHERE id = ?`
      ).run(outcomeStatus, visitNote, new Date().toISOString(), apptId);

      res.json({ ok: true, status: outcomeStatus, visitNote });
    }
  );

  // DOCTOR: List my schedules & leaves
  app.get('/api/doctor/schedules', requireAuth, requireRole(['doctor']), (req, res) => {
    const doctorId = req.authUser!.doctorId!;
    const schedules = db
      .prepare(
        `SELECT id, day_of_week, start_time, end_time
         FROM doctor_schedules
         WHERE doctor_id = ?
         ORDER BY day_of_week ASC, start_time ASC`
      )
      .all(doctorId) as {
      id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
    }[];

    const leaves = db
      .prepare(
        `SELECT id, leave_date, reason, created_at
         FROM doctor_leaves
         WHERE doctor_id = ?
         ORDER BY leave_date ASC`
      )
      .all(doctorId) as {
      id: string;
      leave_date: string;
      reason: string;
      created_at: string;
    }[];

    res.json({
      schedules: schedules.map((s) => ({
        id: s.id,
        dayOfWeek: s.day_of_week,
        dayName: DAY_NAMES[s.day_of_week],
        startTime: s.start_time,
        endTime: s.end_time,
      })),
      leaves: leaves.map((l) => ({
        id: l.id,
        leaveDate: l.leave_date,
        reason: l.reason,
        createdAt: l.created_at,
      })),
    });
  });

  // DOCTOR: Add weekly schedule block (validates end > start, 30-min grid, no overlaps - Test Case 7)
  app.post('/api/doctor/schedules', requireAuth, requireRole(['doctor']), (req, res) => {
    const doctorId = req.authUser!.doctorId!;
    const dayOfWeek = Number(req.body?.dayOfWeek);
    const startTime = typeof req.body?.startTime === 'string' ? req.body.startTime.trim() : '';
    const endTime = typeof req.body?.endTime === 'string' ? req.body.endTime.trim() : '';

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({ error: 'Invalid dayOfWeek (must be 0 for Sunday through 6 for Saturday).' });
      return;
    }
    if (!isValidTimeHm(startTime) || !isValidTimeHm(endTime)) {
      res.status(400).json({ error: 'Valid HH:MM start and end times are required.' });
      return;
    }

    const startMin = timeHmToMinutes(startTime);
    const endMin = timeHmToMinutes(endTime);

    if (endMin <= startMin) {
      res.status(400).json({
        error: 'End time must be after start time.',
      });
      return;
    }
    if (startMin % 30 !== 0 || endMin % 30 !== 0) {
      res.status(400).json({
        error: 'Schedule hours must align to 30-minute intervals (:00 or :30).',
      });
      return;
    }

    const existing = db
      .prepare(
        `SELECT id, start_time, end_time
         FROM doctor_schedules
         WHERE doctor_id = ? AND day_of_week = ?`
      )
      .all(doctorId, dayOfWeek) as { id: string; start_time: string; end_time: string }[];

    const overlaps = existing.some((row) => {
      const eStart = timeHmToMinutes(row.start_time);
      const eEnd = timeHmToMinutes(row.end_time);
      return startMin < eEnd && endMin > eStart;
    });

    if (overlaps) {
      res.status(400).json({
        error: `These hours overlap an existing schedule block on ${DAY_NAMES[dayOfWeek]}.`,
      });
      return;
    }

    const id = `sched-${crypto.randomUUID()}`;
    db.prepare(
      `INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, doctorId, dayOfWeek, startTime, endTime);

    res.status(201).json({
      schedule: {
        id,
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        startTime,
        endTime,
      },
    });
  });

  app.delete('/api/doctor/schedules/:id', requireAuth, requireRole(['doctor']), (req, res) => {
    const doctorId = req.authUser!.doctorId!;
    const result = db
      .prepare('DELETE FROM doctor_schedules WHERE id = ? AND doctor_id = ?')
      .run(req.params.id, doctorId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Schedule block not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // DOCTOR: Add leave day (blocks past dates - Test Case 7; auto-cancels & emails affected patients - Test Case 5)
  app.post('/api/doctor/leaves', requireAuth, requireRole(['doctor']), async (req, res) => {
    const doctorUser = req.authUser!;
    const doctorId = doctorUser.doctorId!;
    const leaveDate = typeof req.body?.leaveDate === 'string' ? req.body.leaveDate.trim() : '';
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 200) : '';

    if (!isValidDateStr(leaveDate)) {
      res.status(400).json({ error: 'Valid leave date (YYYY-MM-DD) is required.' });
      return;
    }

    const clock = getClinicClock();
    if (leaveDate < clock.todayDate) {
      res.status(400).json({
        error: 'Cannot add a leave day in the past.',
      });
      return;
    }

    const outcome = runInTransaction(() => {
      const existingLeave = db
        .prepare('SELECT id FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?')
        .get(doctorId, leaveDate) as { id: string } | undefined;

      if (existingLeave) {
        return { ok: false as const, status: 409, error: 'Leave is already marked for that date.' };
      }

      const leaveId = `leave-${crypto.randomUUID()}`;
      db.prepare(
        `INSERT INTO doctor_leaves (id, doctor_id, leave_date, reason, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(leaveId, doctorId, leaveDate, reason, clock.nowIso);

      const affected = db
        .prepare(
          `SELECT a.id, a.start_time, a.end_time, u.name AS patient_name, u.email AS patient_email
           FROM appointments a
           JOIN users u ON u.id = a.patient_id
           WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.status IN ('Pending', 'Confirmed')`
        )
        .all(doctorId, leaveDate) as {
        id: string;
        start_time: string;
        end_time: string;
        patient_name: string;
        patient_email: string;
      }[];

      const cancelStmt = db.prepare(
        `UPDATE appointments
         SET status = 'Cancelled',
             cancellation_reason = ?,
             cancelled_by = 'doctor',
             updated_at = ?
         WHERE id = ?`
      );

      const cancelMsg = reason
        ? `Doctor on leave (${reason})`
        : 'Doctor marked a leave day';

      for (const appt of affected) {
        cancelStmt.run(cancelMsg, clock.nowIso, appt.id);
      }

      return { ok: true as const, leaveId, affected };
    });

    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error });
      return;
    }

    for (const appt of outcome.affected) {
      await sendClinicEmail({
        recipientEmail: appt.patient_email,
        recipientName: appt.patient_name,
        subject: `Appointment Cancelled (Doctor Leave) — ${doctorUser.name} (${leaveDate})`,
        body: `Dear ${appt.patient_name},\n\n${doctorUser.name} is unavailable on ${leaveDate}, so your appointment at ${appt.start_time}–${appt.end_time} PKT has been automatically cancelled.\n\nPlease select another available date or doctor on the website.\n\nRaahHealth Clinic Desk`,
        category: 'cancellation',
      });
    }

    res.status(201).json({
      leave: {
        id: outcome.leaveId,
        leaveDate,
        reason,
        createdAt: clock.nowIso,
      },
      cancelledAppointmentsCount: outcome.affected.length,
    });
  });

  app.delete('/api/doctor/leaves/:id', requireAuth, requireRole(['doctor']), (req, res) => {
    const doctorId = req.authUser!.doctorId!;
    const result = db
      .prepare('DELETE FROM doctor_leaves WHERE id = ? AND doctor_id = ?')
      .run(req.params.id, doctorId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Leave entry not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // DOCTOR: List only patients who have appointments with THIS doctor
  app.get('/api/doctor/patients', requireAuth, requireRole(['doctor']), (req, res) => {
    const doctorId = req.authUser!.doctorId!;
    const rows = db
      .prepare(
        `SELECT pu.id, pu.name, pu.email, pu.phone,
                COUNT(a.id) AS total_visits,
                MAX(a.appointment_date) AS last_visit_date
         FROM appointments a
         JOIN users pu ON pu.id = a.patient_id
         WHERE a.doctor_id = ?
         GROUP BY pu.id
         ORDER BY last_visit_date DESC, pu.name ASC`
      )
      .all(doctorId);
    res.json({ patients: rows });
  });

  // DOCTOR: Patient visit history ONLY with THIS doctor (Test Case 9 blocks Doctor A seeing Doctor B's patient)
  app.get(
    '/api/doctor/patients/:patientId/history',
    requireAuth,
    requireRole(['doctor']),
    (req, res) => {
      const doctorId = req.authUser!.doctorId!;
      const patientId = req.params.patientId;

      const visits = db
        .prepare(
          `SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status,
                  a.reason, a.visit_note, a.cancellation_reason, a.created_at
           FROM appointments a
           WHERE a.doctor_id = ? AND a.patient_id = ?
           ORDER BY a.appointment_date DESC, a.start_time DESC`
        )
        .all(doctorId, patientId);

      if (visits.length === 0) {
        res.status(403).json({
          error: 'Access denied. You can only view visit history for patients who have booked with you.',
        });
        return;
      }

      const patient = db
        .prepare('SELECT id, name, email, phone FROM users WHERE id = ?')
        .get(patientId);

      res.json({ patient, visits });
    }
  );

  // ADMIN: Dashboard (Today's appointments + per-doctor status totals, strictly NO visit_note!)
  app.get('/api/admin/dashboard', requireAuth, requireRole(['admin']), (_req, res) => {
    const clock = getClinicClock();

    const doctorRows = db
      .prepare(
        `SELECT d.id, d.user_id, u.name, u.email, d.specialty_id, d.specialty_name, d.qualifications,
                d.experience_years, d.fee_pkr, d.area, d.clinic_name,
                d.languages_json, d.focus_areas_json, d.image, d.is_active,
                (u.password_hash IS NOT NULL) AS has_password
         FROM doctors d
         JOIN users u ON u.id = d.user_id
         ORDER BY u.name ASC`
      )
      .all() as Record<string, unknown>[];

    const summaryRows = db
      .prepare(
        `SELECT doctor_id,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'No-show' THEN 1 ELSE 0 END) AS no_show,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
                COUNT(*) AS total
         FROM appointments
         GROUP BY doctor_id`
      )
      .all() as {
      doctor_id: string;
      pending: number;
      confirmed: number;
      completed: number;
      no_show: number;
      cancelled: number;
      total: number;
    }[];

    const summaryByDoctor = new Map(summaryRows.map((s) => [s.doctor_id, s]));

    const doctors = doctorRows.map((row) => {
      const doc = mapDoctorRow(row);
      const counts = summaryByDoctor.get(doc.id) || {
        pending: 0,
        confirmed: 0,
        completed: 0,
        no_show: 0,
        cancelled: 0,
        total: 0,
      };
      return {
        ...doc,
        counts: {
          pending: Number(counts.pending),
          confirmed: Number(counts.confirmed),
          completed: Number(counts.completed),
          noShow: Number(counts.no_show),
          cancelled: Number(counts.cancelled),
          total: Number(counts.total),
        },
      };
    });

    // Explicitly omit a.visit_note and a.reason from admin view
    const todaysAppointments = db
      .prepare(
        `SELECT a.id, a.doctor_id, a.appointment_date, a.start_time, a.end_time,
                a.status, a.created_at,
                du.name AS doctor_name, d.specialty_name,
                pu.name AS patient_name
         FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         JOIN users du ON du.id = d.user_id
         JOIN users pu ON pu.id = a.patient_id
         WHERE a.appointment_date = ?
         ORDER BY a.start_time ASC`
      )
      .all(clock.todayDate);

    res.json({
      clock,
      doctors,
      todaysAppointments,
      smtpConfigured: isSmtpConfigured(),
    });
  });

  // ADMIN: Add a new doctor and send set-password invite email (Test Case 2)
  app.post('/api/admin/doctors', requireAuth, requireRole(['admin']), async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const specialtyId =
      typeof req.body?.specialtyId === 'string' && SPECIALTY_MAP[req.body.specialtyId]
        ? req.body.specialtyId
        : 'general-physician';
    const qualifications =
      typeof req.body?.qualifications === 'string' && req.body.qualifications.trim()
        ? req.body.qualifications.trim()
        : 'MBBS, FCPS';
    const experienceYears = Math.max(
      1,
      Math.min(60, Number(req.body?.experienceYears || 6))
    );
    const feePkr = Math.max(500, Math.min(20000, Number(req.body?.feePkr || 2000)));
    const area =
      typeof req.body?.area === 'string' && req.body.area.trim()
        ? req.body.area.trim()
        : 'University Town';

    if (name.length < 2) {
      res.status(400).json({ error: 'Doctor full name is required.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'A valid doctor email address is required.' });
      return;
    }

    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email) as { id: string } | undefined;
    if (existingUser) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }

    const doctorCount = (
      db.prepare('SELECT COUNT(*) AS count FROM doctors').get() as { count: number }
    ).count;
    const avatar = DOCTOR_AVATAR_BY_INDEX[doctorCount % DOCTOR_AVATAR_BY_INDEX.length];

    const userId = `usr-doc-${crypto.randomUUID()}`;
    const doctorId = `doc-${crypto.randomUUID()}`;
    const rawInviteToken = generateOpaqueToken();
    const tokenHash = hashToken(rawInviteToken);
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const specialtyName = SPECIALTY_MAP[specialtyId];

    runInTransaction(() => {
      db.prepare(
        `INSERT INTO users (id, name, email, phone, role, password_hash, created_at)
         VALUES (?, ?, ?, '', 'doctor', NULL, ?)`
      ).run(userId, name, email, nowIso);

      db.prepare(
        `INSERT INTO doctors (
          id, user_id, specialty_id, specialty_name, qualifications,
          experience_years, fee_pkr, area, clinic_name, languages_json,
          focus_areas_json, image, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      ).run(
        doctorId,
        userId,
        specialtyId,
        specialtyName,
        qualifications,
        experienceYears,
        feePkr,
        area,
        'Nowshera & Peshawar Family Care Clinic',
        JSON.stringify(['Pashto', 'Urdu', 'English']),
        JSON.stringify([specialtyName, 'In-Clinic Consultation']),
        avatar,
        nowIso
      );

      db.prepare(
        `INSERT INTO password_tokens (token_hash, user_id, purpose, expires_at, used_at, created_at)
         VALUES (?, ?, 'invite', ?, NULL, ?)`
      ).run(tokenHash, userId, expiresAt, nowIso);
    });

    const actionPath = `/?inviteToken=${rawInviteToken}`;
    await sendClinicEmail({
      recipientEmail: email,
      recipientName: name,
      subject: `Welcome to RaahHealth Clinic — Set Your Doctor Password`,
      body: `Dear ${name},\n\nThe clinic administrator has added your ${specialtyName} profile to RaahHealth Clinic.\n\nUse this single-use link to set your password and sign in to manage your schedule and appointments:\n${actionPath}\n\nSetup Token: ${rawInviteToken}\n\nRaahHealth Clinic Desk`,
      category: 'invite',
      actionPath,
    });

    res.status(201).json({
      doctor: {
        id: doctorId,
        userId,
        name,
        email,
        specialtyId,
        specialtyName,
        qualifications,
        experienceYears,
        feePkr,
        area,
        clinicName: 'Nowshera & Peshawar Family Care Clinic',
        isActive: true,
        hasPassword: false,
      },
    });
  });

  // ADMIN: Re-send / issue set-password invite for an existing doctor
  app.post(
    '/api/admin/doctors/:id/invite',
    requireAuth,
    requireRole(['admin']),
    async (req, res) => {
      const doctor = db
        .prepare(
          `SELECT d.id, d.user_id, d.specialty_name, u.name, u.email
           FROM doctors d
           JOIN users u ON u.id = d.user_id
           WHERE d.id = ?`
        )
        .get(req.params.id) as
        | {
            id: string;
            user_id: string;
            specialty_name: string;
            name: string;
            email: string;
          }
        | undefined;

      if (!doctor) {
        res.status(404).json({ error: 'Doctor not found.' });
        return;
      }

      const rawInviteToken = generateOpaqueToken();
      const tokenHash = hashToken(rawInviteToken);
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      db.prepare(
        `INSERT INTO password_tokens (token_hash, user_id, purpose, expires_at, used_at, created_at)
         VALUES (?, ?, 'invite', ?, NULL, ?)`
      ).run(tokenHash, doctor.user_id, expiresAt, nowIso);

      const actionPath = `/?inviteToken=${rawInviteToken}`;
      await sendClinicEmail({
        recipientEmail: doctor.email,
        recipientName: doctor.name,
        subject: `Set Your RaahHealth Doctor Password — ${doctor.name}`,
        body: `Dear ${doctor.name},\n\nUse this single-use setup link to set or reset your doctor portal password:\n${actionPath}\n\nSetup Token: ${rawInviteToken}\n\nRaahHealth Clinic Desk`,
        category: 'invite',
        actionPath,
      });

      res.json({ ok: true, recipientEmail: doctor.email });
    }
  );

  // ADMIN: Activate or deactivate a doctor (Test Case 5)
  app.patch(
    '/api/admin/doctors/:id/status',
    requireAuth,
    requireRole(['admin']),
    (req, res) => {
      const isActive = Boolean(req.body?.isActive);
      const result = db
        .prepare('UPDATE doctors SET is_active = ? WHERE id = ?')
        .run(isActive ? 1 : 0, req.params.id);

      if (result.changes === 0) {
        res.status(404).json({ error: 'Doctor not found.' });
        return;
      }

      res.json({ ok: true, isActive });
    }
  );

  // ADMIN: Trigger scheduled automations on demand (Test Case 10)
  app.post(
    '/api/admin/automations/run',
    requireAuth,
    requireRole(['admin']),
    async (_req, res) => {
      const summary = await runClinicAutomations();
      res.json({ summary });
    }
  );

  // Signed-in user's own email inbox (Patient / Doctor)
  app.get('/api/emails', requireAuth, (req, res) => {
    const user = req.authUser!;
    const rows = db
      .prepare(
        `SELECT id, recipient_email, recipient_name, subject, body, category,
                delivery_status, action_path, created_at
         FROM email_outbox
         WHERE LOWER(recipient_email) = LOWER(?)
         ORDER BY created_at DESC
         LIMIT 50`
      )
      .all(user.email);
    res.json({ emails: rows });
  });

  // Admin operational email outbox (never includes private visit notes)
  app.get('/api/admin/outbox', requireAuth, requireRole(['admin']), (_req, res) => {
    const rows = db
      .prepare(
        `SELECT id, recipient_email, recipient_name, subject, body, category,
                delivery_status, action_path, created_at
         FROM email_outbox
         ORDER BY created_at DESC
         LIMIT 100`
      )
      .all();
    res.json({ emails: rows, smtpConfigured: isSmtpConfigured() });
  });

  // Periodic background automation sweep (every 60s + initial startup run)
  await runClinicAutomations();
  setInterval(() => {
    void runClinicAutomations();
  }, 60_000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  const port =
    process.env.NODE_ENV === 'production'
      ? Number(process.env.PORT || 3000)
      : 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`RaahHealth full-stack clinic server listening on port ${port}`);
  });
}

void startServer();
