import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Mail,
  FileText,
  X,
  RefreshCw,
  Plus,
} from 'lucide-react';
import {
  appointmentsApi,
  doctorsApi,
  emailsApi,
  type AppointmentRecord,
  type ClinicClock,
  type EmailRecord,
  type SlotItem,
} from '../lib/api';

interface PatientDashboardProps {
  onBrowseDoctors: () => void;
}

const STATUS_STYLE: Record<AppointmentRecord['status'], string> = {
  Pending: 'text-[#9A6700] bg-[#FFF8E6]',
  Confirmed: 'text-[#0D6E6E] bg-[#EDF6F6]',
  Completed: 'text-[#1E7A62] bg-[#ECF6F1]',
  'No-show': 'text-[#6D828A] bg-[#F2F6F8]',
  Cancelled: 'text-[#9E2A2B] bg-[#FDF2F2]',
};

export function PatientDashboard({ onBrowseDoctors }: PatientDashboardProps) {
  const [tab, setTab] = useState<'appointments' | 'emails'>('appointments');
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [clock, setClock] = useState<ClinicClock | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentRecord | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newSlots, setNewSlots] = useState<SlotItem[]>([]);
  const [slotNotice, setSlotNotice] = useState('');
  const [selectedNewSlot, setSelectedNewSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, mailRes] = await Promise.all([
        appointmentsApi.listMine(),
        emailsApi.listMine(),
      ]);
      setAppointments(apptRes.appointments);
      setClock(apptRes.clock);
      setEmails(mailRes.emails);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to load your appointments.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadSlotsForReschedule = useCallback(async (doctorId: string, dateStr: string) => {
    if (!dateStr) return;
    setSlotsLoading(true);
    setSelectedNewSlot('');
    try {
      const res = await doctorsApi.getSlots(doctorId, dateStr);
      setNewSlots(res.slots);
      setSlotNotice(res.message || '');
    } catch (err) {
      setNewSlots([]);
      setSlotNotice(err instanceof Error ? err.message : 'Could not load slots.');
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const openReschedule = (appt: AppointmentRecord) => {
    setFeedback(null);
    setRescheduleTarget(appt);
    const startDate = appt.appointment_date;
    setNewDate(startDate);
    void loadSlotsForReschedule(appt.doctor_id, startDate);
  };

  const handleCancel = async (apptId: string) => {
    setFeedback(null);
    try {
      await appointmentsApi.cancel(apptId);
      setFeedback({
        type: 'ok',
        text: 'Appointment cancelled. Its time slot is now open and a confirmation email was sent.',
      });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not cancel appointment.',
      });
    }
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !newDate || !selectedNewSlot) return;
    setSubmittingReschedule(true);
    setFeedback(null);
    try {
      await appointmentsApi.reschedule(rescheduleTarget.id, {
        date: newDate,
        startTime: selectedNewSlot,
      });
      setRescheduleTarget(null);
      setFeedback({
        type: 'ok',
        text: 'Appointment rescheduled. Your previous slot is now free and the new request is Pending.',
      });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Reschedule failed.',
      });
    } finally {
      setSubmittingReschedule(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Patient portal sections"
          className="inline-flex items-center gap-1 p-1 bg-[#EEF4F6] rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'appointments'}
            onClick={() => setTab('appointments')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
              tab === 'appointments'
                ? 'bg-[#0D6E6E] text-white shadow-xs hover:bg-[#0A5858] active:bg-[#073E3E]'
                : 'text-[#4A6068] hover:bg-white hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
            }`}
          >
            My Appointments ({appointments.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'emails'}
            onClick={() => setTab('emails')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
              tab === 'emails'
                ? 'bg-[#0D6E6E] text-white shadow-xs hover:bg-[#0A5858] active:bg-[#073E3E]'
                : 'text-[#4A6068] hover:bg-white hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
            }`}
          >
            Email Notifications ({emails.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A6068] bg-white border border-[#D4E1E7] rounded-lg hover:bg-[#EDF6F6] hover:text-[#0D6E6E] hover:border-[#0D6E6E] active:bg-[#0D6E6E] active:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onBrowseDoctors}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-lg border text-sm ${
            feedback.type === 'ok'
              ? 'bg-[#EDF6F6] border-[#BBDCDC] text-[#0F2429]'
              : 'bg-[#FDF2F2] border-[#F5C6C6] text-[#9E2A2B]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#E2EAEF] rounded-xl p-8 text-sm text-[#6D828A]">
          Loading your appointments...
        </div>
      ) : tab === 'appointments' ? (
        appointments.length === 0 ? (
          <div className="bg-white border border-[#E2EAEF] rounded-xl p-10 text-center">
            <h2 className="text-lg font-display font-semibold text-[#0F2429]">
              No appointments booked yet
            </h2>
            <p className="mt-2 text-sm text-[#4A6068] max-w-md mx-auto">
              Choose a doctor from the directory and pick an open 30-minute time slot to request your visit.
            </p>
            <button
              type="button"
              onClick={onBrowseDoctors}
              className="mt-5 px-5 py-2.5 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Browse Doctors &amp; Free Slots
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => {
              const canModify = ['Pending', 'Confirmed'].includes(appt.status);
              return (
                <article
                  key={appt.id}
                  className="bg-white border border-[#E2EAEF] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${STATUS_STYLE[appt.status]}`}
                      >
                        {appt.status}
                      </span>
                      <span className="text-[#6D828A]">{appt.specialty_name}</span>
                      {appt.fee_pkr && (
                        <>
                          <span aria-hidden="true" className="text-[#CBD8E0]">
                            ·
                          </span>
                          <span className="text-[#4A6068] tabular-nums">
                            PKR {appt.fee_pkr.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-display font-semibold text-[#0F2429]">
                      {appt.doctor_name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-[#4A6068]">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Calendar className="w-4 h-4 text-[#0D6E6E]" aria-hidden="true" />
                        <span>{appt.appointment_date}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Clock className="w-4 h-4 text-[#0D6E6E]" aria-hidden="true" />
                        <span>
                          {appt.start_time} – {appt.end_time} PKT
                        </span>
                      </span>
                      {appt.clinic_name && (
                        <span className="text-xs text-[#6D828A]">{appt.clinic_name}</span>
                      )}
                    </div>

                    {appt.reason && (
                      <p className="text-xs text-[#6D828A]">
                        Reason noted: {appt.reason}
                      </p>
                    )}

                    {appt.cancellation_reason && (
                      <p className="text-xs text-[#9E2A2B]">
                        Cancellation note: {appt.cancellation_reason}
                      </p>
                    )}

                    {appt.visit_note && (
                      <div className="mt-2 p-3 bg-[#F8FAFB] border border-[#E2EAEF] rounded-lg">
                        <p className="text-xs font-semibold text-[#0F2429] flex items-center gap-1.5 mb-1">
                          <FileText className="w-3.5 h-3.5 text-[#0D6E6E]" aria-hidden="true" />
                          <span>Doctor Visit Note (Private to you and your doctor)</span>
                        </p>
                        <p className="text-xs sm:text-sm text-[#4A6068] leading-relaxed">
                          {appt.visit_note}
                        </p>
                      </div>
                    )}
                  </div>

                  {canModify && (
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openReschedule(appt)}
                        className="px-3.5 py-2 text-xs sm:text-sm font-medium text-[#0D6E6E] bg-[#EDF6F6] border border-[#CBE2E2] hover:bg-[#0D6E6E] hover:text-white hover:border-[#0D6E6E] active:bg-[#073E3E] rounded-lg transition-colors cursor-pointer"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCancel(appt.id)}
                        className="px-3.5 py-2 text-xs sm:text-sm font-medium text-[#9E2A2B] bg-white border border-[#F0D3D3] hover:bg-[#9E2A2B] hover:text-white hover:border-[#9E2A2B] active:bg-[#7A1E1F] rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )
      ) : emails.length === 0 ? (
        <div className="bg-white border border-[#E2EAEF] rounded-xl p-10 text-center text-sm text-[#6D828A]">
          No emails have been sent to your address yet. Confirmations, cancellations, and reminders will appear here automatically.
        </div>
      ) : (
        <div className="space-y-3">
          {emails.map((mail) => (
            <div
              key={mail.id}
              className="bg-white border border-[#E2EAEF] rounded-xl p-5 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6D828A]">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#0D6E6E]">
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{mail.category}</span>
                </span>
                <span className="tabular-nums">
                  {new Date(mail.created_at).toLocaleString()}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-display font-semibold text-[#0F2429]">
                {mail.subject}
              </h3>
              <pre className="text-xs sm:text-sm text-[#4A6068] whitespace-pre-wrap font-sans leading-relaxed">
                {mail.body}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2429]/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-title"
          onClick={() => setRescheduleTarget(null)}
        >
          <div
            className="bg-white border border-[#D8E5EC] rounded-xl w-full max-w-lg p-6 space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="reschedule-title" className="text-lg font-display font-semibold text-[#0F2429]">
                  Reschedule Appointment
                </h2>
                <p className="text-xs text-[#6D828A]">
                  {rescheduleTarget.doctor_name} · Currently {rescheduleTarget.appointment_date}{' '}
                  {rescheduleTarget.start_time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                aria-label="Close reschedule dialog"
                className="p-2 text-[#4A6068] hover:bg-[#EDF6F6] hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label
                  htmlFor="reschedule-date"
                  className="block text-xs font-medium text-[#0F2429] mb-1"
                >
                  Choose New Date (PKT)
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  min={clock?.todayDate}
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    void loadSlotsForReschedule(rescheduleTarget.doctor_id, e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#0F2429] mb-2">
                  Available 30-Minute Slots
                </span>
                {slotsLoading ? (
                  <p className="text-xs text-[#6D828A]">Checking availability...</p>
                ) : newSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {newSlots.map((slot) => {
                      const active = selectedNewSlot === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => setSelectedNewSlot(slot.startTime)}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border tabular-nums transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#0D6E6E] border-[#0D6E6E] text-white hover:bg-[#0A5858] active:bg-[#073E3E]'
                              : 'bg-white border-[#D4E1E7] text-[#0F2429] hover:bg-[#EDF6F6] hover:border-[#0D6E6E] hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white active:border-[#0D6E6E]'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#6D828A] bg-[#F8FAFB] border border-[#E2EAEF] rounded-lg p-3">
                    {slotNotice || 'No open slots on this date.'}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 text-sm text-[#4A6068] bg-white border border-[#E2EAEF] rounded-lg hover:bg-[#F2F6F8] hover:text-[#0F2429] active:bg-[#DCE7ED] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedNewSlot || submittingReschedule}
                  className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {submittingReschedule ? 'Moving...' : 'Confirm New Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
