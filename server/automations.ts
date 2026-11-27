import { db, runInTransaction } from './db.ts';
import { sendClinicEmail, type OutgoingEmailInput } from './mailer.ts';
import { getClinicClock } from './time.ts';

export interface AutomationRunSummary {
  autoCancelledCount: number;
  remindersSentCount: number;
  ranAt: string;
}

interface PendingExpiredRow {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  patient_email: string;
  doctor_name: string;
}

interface ReminderTargetRow {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  patient_email: string;
  doctor_name: string;
  clinic_name: string;
}

export async function runClinicAutomations(): Promise<AutomationRunSummary> {
  const clock = getClinicClock();
  const emailsToSend: OutgoingEmailInput[] = [];

  const counts = runInTransaction(() => {
    const expiredPending = db
      .prepare(
        `SELECT a.id, a.appointment_date, a.start_time, a.end_time,
                u.name AS patient_name, u.email AS patient_email,
                du.name AS doctor_name
         FROM appointments a
         JOIN users u ON u.id = a.patient_id
         JOIN doctors d ON d.id = a.doctor_id
         JOIN users du ON du.id = d.user_id
         WHERE a.status = 'Pending' AND a.start_at <= ?`
      )
      .all(clock.nowIso) as unknown as PendingExpiredRow[];

    const updateExpired = db.prepare(
      `UPDATE appointments
       SET status = 'Cancelled',
           cancellation_reason = 'Not confirmed before appointment start time',
           cancelled_by = 'system',
           updated_at = ?
       WHERE id = ? AND status = 'Pending'`
    );

    for (const appt of expiredPending) {
      updateExpired.run(clock.nowIso, appt.id);
      emailsToSend.push({
        recipientEmail: appt.patient_email,
        recipientName: appt.patient_name,
        subject: `Appointment Cancelled — ${appt.doctor_name} (${appt.appointment_date})`,
        body: `Dear ${appt.patient_name},\n\nYour pending appointment request with ${appt.doctor_name} on ${appt.appointment_date} at ${appt.start_time}–${appt.end_time} PKT was automatically cancelled because it was not confirmed before the scheduled start time.\n\nPlease book another open time slot whenever convenient.\n\nRaahHealth Clinic Desk`,
        category: 'cancellation',
        eventKey: `auto-cancel:${appt.id}`,
      });
    }

    const tomorrowConfirmed = db
      .prepare(
        `SELECT a.id, a.appointment_date, a.start_time, a.end_time,
                u.name AS patient_name, u.email AS patient_email,
                du.name AS doctor_name, d.clinic_name
         FROM appointments a
         JOIN users u ON u.id = a.patient_id
         JOIN doctors d ON d.id = a.doctor_id
         JOIN users du ON du.id = d.user_id
         WHERE a.status = 'Confirmed'
           AND a.appointment_date = ?
           AND a.reminder_sent_at IS NULL`
      )
      .all(clock.tomorrowDate) as unknown as ReminderTargetRow[];

    const markReminder = db.prepare(
      `UPDATE appointments
       SET reminder_sent_at = ?, updated_at = ?
       WHERE id = ? AND reminder_sent_at IS NULL`
    );

    for (const appt of tomorrowConfirmed) {
      markReminder.run(clock.nowIso, clock.nowIso, appt.id);
      emailsToSend.push({
        recipientEmail: appt.patient_email,
        recipientName: appt.patient_name,
        subject: `Appointment Reminder for Tomorrow — ${appt.doctor_name}`,
        body: `Dear ${appt.patient_name},\n\nThis is a reminder of your confirmed appointment tomorrow (${appt.appointment_date}) at ${appt.start_time}–${appt.end_time} PKT with ${appt.doctor_name} at ${appt.clinic_name}.\n\nIf you need to cancel or reschedule, please do so at least 2 hours before your appointment time.\n\nRaahHealth Clinic Desk`,
        category: 'reminder',
        eventKey: `reminder:${appt.id}:${appt.appointment_date}`,
      });
    }

    return {
      autoCancelledCount: expiredPending.length,
      remindersSentCount: tomorrowConfirmed.length,
    };
  });

  for (const email of emailsToSend) {
    await sendClinicEmail(email);
  }

  return {
    autoCancelledCount: counts.autoCancelledCount,
    remindersSentCount: counts.remindersSentCount,
    ranAt: clock.nowIso,
  };
}
