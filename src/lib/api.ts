export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  doctorId: string | null;
}

export interface ClinicClock {
  nowMs: number;
  nowIso: string;
  todayDate: string;
  tomorrowDate: string;
  currentTimeHm: string;
}

export interface DoctorScheduleItem {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
}

export interface LiveDoctorProfile {
  id: string;
  userId: string;
  name: string;
  email?: string;
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
  isActive: boolean;
  hasPassword?: boolean;
  schedules?: DoctorScheduleItem[];
}

export interface SlotItem {
  startTime: string;
  endTime: string;
  label: string;
}

export interface AppointmentRecord {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  start_at: string;
  end_at: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'No-show' | 'Cancelled';
  reason: string;
  visit_note: string;
  cancellation_reason: string;
  cancelled_by: string;
  created_at: string;
  updated_at: string;
  doctor_name?: string;
  specialty_name?: string;
  clinic_name?: string;
  area?: string;
  fee_pkr?: number;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
}

export interface EmailRecord {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  category: string;
  delivery_status: string;
  action_path: string;
  created_at: string;
}

export interface AdminDoctorSummary extends LiveDoctorProfile {
  counts: {
    pending: number;
    confirmed: number;
    completed: number;
    noShow: number;
    cancelled: number;
    total: number;
  };
}

let inMemoryBearerToken: string | null = null;

export function setInMemoryToken(token: string | null): void {
  inMemoryBearerToken = token;
}

export function getInMemoryToken(): string | null {
  return inMemoryBearerToken;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Requested-With', 'RaahHealth');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryBearerToken) {
    headers.set('Authorization', `Bearer ${inMemoryBearerToken}`);
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof data.error === 'string'
        ? data.error
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const authApi = {
  me: () =>
    request<{
      user: AuthUser | null;
      clock: ClinicClock;
      smtpConfigured: boolean;
      hasAdminAccount: boolean;
      envPasscodeConfigured: boolean;
      needsAdminSetup: boolean;
    }>('/api/auth/me'),

  claimAdmin: (payload: { name: string; email: string; password: string }) =>
    request<{ token: string; user: AuthUser }>('/api/auth/claim-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) =>
    request<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  setPassword: (payload: { token: string; password: string }) =>
    request<{ token: string; user: AuthUser }>('/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const doctorsApi = {
  list: () =>
    request<{ doctors: LiveDoctorProfile[]; clock: ClinicClock }>('/api/doctors'),

  getSlots: (doctorId: string, date: string) =>
    request<{
      doctorId: string;
      date: string;
      isActive: boolean;
      onLeave: boolean;
      slots: SlotItem[];
      message?: string;
    }>(`/api/doctors/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`),
};

export const appointmentsApi = {
  book: (payload: {
    doctorId: string;
    date: string;
    startTime: string;
    reason?: string;
  }) =>
    request<{ appointment: Record<string, unknown> }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listMine: () =>
    request<{ appointments: AppointmentRecord[]; clock: ClinicClock }>(
      '/api/appointments'
    ),

  cancel: (id: string) =>
    request<{ ok: boolean; status: string }>(
      `/api/appointments/${encodeURIComponent(id)}/cancel`,
      { method: 'POST' }
    ),

  reschedule: (id: string, payload: { date: string; startTime: string }) =>
    request<{ ok: boolean; status: string }>(
      `/api/appointments/${encodeURIComponent(id)}/reschedule`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),
};

export const doctorPortalApi = {
  confirm: (id: string) =>
    request<{ ok: boolean; status: string }>(
      `/api/doctor/appointments/${encodeURIComponent(id)}/confirm`,
      { method: 'POST' }
    ),

  reject: (id: string, reason?: string) =>
    request<{ ok: boolean; status: string }>(
      `/api/doctor/appointments/${encodeURIComponent(id)}/reject`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    ),

  complete: (id: string, payload: { outcome: 'Completed' | 'No-show'; visitNote: string }) =>
    request<{ ok: boolean; status: string; visitNote: string }>(
      `/api/doctor/appointments/${encodeURIComponent(id)}/complete`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  getSchedules: () =>
    request<{
      schedules: DoctorScheduleItem[];
      leaves: { id: string; leaveDate: string; reason: string; createdAt: string }[];
    }>('/api/doctor/schedules'),

  addSchedule: (payload: { dayOfWeek: number; startTime: string; endTime: string }) =>
    request<{ schedule: DoctorScheduleItem }>('/api/doctor/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteSchedule: (id: string) =>
    request<{ ok: boolean }>(`/api/doctor/schedules/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  addLeave: (payload: { leaveDate: string; reason?: string }) =>
    request<{
      leave: { id: string; leaveDate: string; reason: string; createdAt: string };
      cancelledAppointmentsCount: number;
    }>('/api/doctor/leaves', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteLeave: (id: string) =>
    request<{ ok: boolean }>(`/api/doctor/leaves/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getPatients: () =>
    request<{
      patients: {
        id: string;
        name: string;
        email: string;
        phone: string;
        total_visits: number;
        last_visit_date: string;
      }[];
    }>('/api/doctor/patients'),

  getPatientHistory: (patientId: string) =>
    request<{
      patient: { id: string; name: string; email: string; phone: string };
      visits: AppointmentRecord[];
    }>(`/api/doctor/patients/${encodeURIComponent(patientId)}/history`),
};

export const adminApi = {
  getDashboard: () =>
    request<{
      clock: ClinicClock;
      doctors: AdminDoctorSummary[];
      todaysAppointments: {
        id: string;
        doctor_id: string;
        appointment_date: string;
        start_time: string;
        end_time: string;
        status: string;
        doctor_name: string;
        specialty_name: string;
        patient_name: string;
      }[];
      smtpConfigured: boolean;
    }>('/api/admin/dashboard'),

  addDoctor: (payload: {
    name: string;
    email: string;
    specialtyId: string;
    qualifications: string;
    experienceYears: number;
    feePkr: number;
    area: string;
  }) =>
    request<{ doctor: LiveDoctorProfile }>('/api/admin/doctors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  sendInvite: (doctorId: string) =>
    request<{ ok: boolean; recipientEmail: string }>(
      `/api/admin/doctors/${encodeURIComponent(doctorId)}/invite`,
      { method: 'POST' }
    ),

  setDoctorStatus: (doctorId: string, isActive: boolean) =>
    request<{ ok: boolean; isActive: boolean }>(
      `/api/admin/doctors/${encodeURIComponent(doctorId)}/status`,
      { method: 'PATCH', body: JSON.stringify({ isActive }) }
    ),

  runAutomations: () =>
    request<{
      summary: {
        autoCancelledCount: number;
        remindersSentCount: number;
        ranAt: string;
      };
    }>('/api/admin/automations/run', { method: 'POST' }),

  getOutbox: () =>
    request<{ emails: EmailRecord[]; smtpConfigured: boolean }>('/api/admin/outbox'),
};

export const emailsApi = {
  listMine: () => request<{ emails: EmailRecord[] }>('/api/emails'),
};
