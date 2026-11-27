import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  Calendar,
  Clock,
  Trash2,
  UserCheck,
  FileText,
  Mail,
  RefreshCw,
} from 'lucide-react';
import {
  appointmentsApi,
  doctorPortalApi,
  emailsApi,
  type AppointmentRecord,
  type ClinicClock,
  type DoctorScheduleItem,
  type EmailRecord,
} from '../lib/api';

const DAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const STATUS_STYLE: Record<AppointmentRecord['status'], string> = {
  Pending: 'text-[#9A6700] bg-[#FFF8E6]',
  Confirmed: 'text-[#0D6E6E] bg-[#EDF6F6]',
  Completed: 'text-[#1E7A62] bg-[#ECF6F1]',
  'No-show': 'text-[#6D828A] bg-[#F2F6F8]',
  Cancelled: 'text-[#9E2A2B] bg-[#FDF2F2]',
};

export function DoctorDashboard() {
  const [subTab, setSubTab] = useState<'appointments' | 'patients' | 'schedule' | 'emails'>(
    'appointments'
  );
  const [apptFilter, setApptFilter] = useState<'all' | 'Pending' | 'Confirmed' | 'today'>(
    'all'
  );
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [clock, setClock] = useState<ClinicClock | null>(null);
  const [schedules, setSchedules] = useState<DoctorScheduleItem[]>([]);
  const [leaves, setLeaves] = useState<
    { id: string; leaveDate: string; reason: string; createdAt: string }[]
  >([]);
  const [patients, setPatients] = useState<
    {
      id: string;
      name: string;
      email: string;
      phone: string;
      total_visits: number;
      last_visit_date: string;
    }[]
  >([]);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<{
    patient: { id: string; name: string; email: string; phone: string };
    visits: AppointmentRecord[];
  } | null>(null);
  const [emails, setEmails] = useState<EmailRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Schedule form state
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  // Leave form state
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Complete / Visit Note modal state
  const [completeTarget, setCompleteTarget] = useState<AppointmentRecord | null>(null);
  const [completeOutcome, setCompleteOutcome] = useState<'Completed' | 'No-show'>('Completed');
  const [visitNote, setVisitNote] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, schedRes, patRes, mailRes] = await Promise.all([
        appointmentsApi.listMine(),
        doctorPortalApi.getSchedules(),
        doctorPortalApi.getPatients(),
        emailsApi.listMine(),
      ]);
      setAppointments(apptRes.appointments);
      setClock(apptRes.clock);
      setSchedules(schedRes.schedules);
      setLeaves(schedRes.leaves);
      setPatients(patRes.patients);
      setEmails(mailRes.emails);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to load doctor dashboard.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleConfirm = async (apptId: string) => {
    setFeedback(null);
    try {
      await doctorPortalApi.confirm(apptId);
      setFeedback({
        type: 'ok',
        text: 'Appointment confirmed and confirmation email sent to the patient.',
      });
      await loadAll();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not confirm appointment.',
      });
    }
  };

  const handleReject = async (apptId: string) => {
    setFeedback(null);
    try {
      await doctorPortalApi.reject(apptId, 'Slot unavailable');
      setFeedback({
        type: 'ok',
        text: 'Appointment request declined, slot freed, and patient notified.',
      });
      await loadAll();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not reject appointment.',
      });
    }
  };

  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTarget) return;
    setFeedback(null);
    try {
      await doctorPortalApi.complete(completeTarget.id, {
        outcome: completeOutcome,
        visitNote,
      });
      setCompleteTarget(null);
      setVisitNote('');
      setFeedback({
        type: 'ok',
        text: `Visit marked ${completeOutcome}. Note saved privately for you and the patient.`,
      });
      await loadAll();
    } catch (err) {
      setCompleteTarget(null);
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not update visit status.',
      });
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await doctorPortalApi.addSchedule({ dayOfWeek, startTime, endTime });
      setFeedback({ type: 'ok', text: 'Working hours added and split into 30-minute slots.' });
      await loadAll();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not save working hours.',
      });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    setFeedback(null);
    try {
      await doctorPortalApi.deleteSchedule(id);
      await loadAll();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not remove schedule block.',
      });
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await doctorPortalApi.addLeave({
        leaveDate,
        reason: leaveReason,
      });
      setLeaveDate('');
      setLeaveReason('');
      setFeedback({
        type: 'ok',
        text:
          res.cancelledAppointmentsCount > 0
            ? `Leave day marked. ${res.cancelledAppointmentsCount} existing appointment(s) cancelled and patients emailed.`
            : 'Leave day marked. No slots will be shown on that date.',
      });
      await loadAll();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not add leave day.',
      });
    }
  };

  const handleDeleteLeave = async (id: string) => {
    setFeedback(null);
    try {
      await doctorPortalApi.deleteLeave(id);
      await loadAll();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not remove leave date.',
      });
    }
  };

  const handleSelectPatient = async (patientId: string) => {
    setFeedback(null);
    try {
      const res = await doctorPortalApi.getPatientHistory(patientId);
      setSelectedPatientHistory(res);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not load patient visit history.',
      });
    }
  };

  const visibleAppointments = appointments.filter((appt) => {
    if (apptFilter === 'Pending') return appt.status === 'Pending';
    if (apptFilter === 'Confirmed') return appt.status === 'Confirmed';
    if (apptFilter === 'today') return appt.appointment_date === clock?.todayDate;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Doctor portal sections"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EEF4F6] rounded-lg"
        >
          {[
            { id: 'appointments', label: `Appointments (${appointments.length})` },
            { id: 'patients', label: `My Patients (${patients.length})` },
            { id: 'schedule', label: 'Hours & Leave Days' },
            { id: 'emails', label: `Emails (${emails.length})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={subTab === item.id}
              onClick={() => setSubTab(item.id as typeof subTab)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                subTab === item.id
                  ? 'bg-[#0D6E6E] text-white shadow-xs hover:bg-[#0A5858] active:bg-[#073E3E]'
                  : 'text-[#4A6068] hover:bg-white hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void loadAll()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A6068] bg-white border border-[#D4E1E7] rounded-lg hover:bg-[#EDF6F6] hover:text-[#0D6E6E] hover:border-[#0D6E6E] active:bg-[#0D6E6E] active:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
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
          Loading doctor workspace...
        </div>
      ) : subTab === 'appointments' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'Pending', label: 'Pending Requests' },
              { id: 'Confirmed', label: 'Confirmed' },
              { id: 'today', label: 'Today' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setApptFilter(f.id as typeof apptFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  apptFilter === f.id
                    ? 'bg-[#0D6E6E] border-[#0D6E6E] text-white hover:bg-[#0A5858] active:bg-[#073E3E]'
                    : 'bg-white border-[#D4E1E7] text-[#4A6068] hover:bg-[#EDF6F6] hover:border-[#0D6E6E] hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visibleAppointments.length === 0 ? (
            <div className="bg-white border border-[#E2EAEF] rounded-xl p-10 text-center text-sm text-[#6D828A]">
              No appointments match this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAppointments.map((appt) => (
                <article
                  key={appt.id}
                  className="bg-white border border-[#E2EAEF] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${STATUS_STYLE[appt.status]}`}
                      >
                        {appt.status}
                      </span>
                      <span className="text-[#4A6068] tabular-nums">
                        {appt.appointment_date} · {appt.start_time} – {appt.end_time} PKT
                      </span>
                    </div>
                    <h3 className="text-base font-display font-semibold text-[#0F2429]">
                      {appt.patient_name}
                    </h3>
                    <p className="text-xs text-[#6D828A]">
                      {appt.patient_email}
                      {appt.patient_phone ? ` · ${appt.patient_phone}` : ''}
                    </p>
                    {appt.reason && (
                      <p className="text-xs text-[#4A6068]">Reason: {appt.reason}</p>
                    )}
                    {appt.visit_note && (
                      <p className="text-xs text-[#1E7A62] pt-1">
                        Visit note: {appt.visit_note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {appt.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleConfirm(appt.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReject(appt.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#F0D3D3] text-[#9E2A2B] hover:bg-[#9E2A2B] hover:text-white hover:border-[#9E2A2B] active:bg-[#7A1E1F] text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {appt.status === 'Confirmed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCompleteTarget(appt);
                            setCompleteOutcome('Completed');
                            setVisitNote('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E7A62] hover:bg-[#17624E] active:bg-[#104738] text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Mark Completed</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompleteTarget(appt);
                            setCompleteOutcome('No-show');
                            setVisitNote('');
                          }}
                          className="px-3.5 py-2 bg-white border border-[#D4E1E7] text-[#4A6068] hover:bg-[#EEF4F6] hover:text-[#0F2429] hover:border-[#A7C0CA] active:bg-[#0F2429] active:text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Mark No-show
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSubTab('patients');
                        void handleSelectPatient(appt.patient_id);
                      }}
                      className="px-3 py-2 rounded-lg bg-[#F8FAFB] border border-[#E2EAEF] text-xs font-medium text-[#0D6E6E] hover:bg-[#0D6E6E] hover:text-white hover:border-[#0D6E6E] active:bg-[#073E3E] transition-colors cursor-pointer"
                    >
                      Patient History
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : subTab === 'patients' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-[#E2EAEF] rounded-xl p-5">
            <h2 className="text-base font-display font-semibold text-[#0F2429] mb-3">
              Patients Seen by You
            </h2>
            {patients.length === 0 ? (
              <p className="text-xs text-[#6D828A]">
                No patient appointments yet.
              </p>
            ) : (
              <div className="space-y-2">
                {patients.map((pat) => {
                  const active = selectedPatientHistory?.patient.id === pat.id;
                  return (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => void handleSelectPatient(pat.id)}
                      className={`group w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#0D6E6E] border-[#0D6E6E] text-white hover:bg-[#0A5858]'
                          : 'bg-[#F8FAFB] border-[#E2EAEF] hover:bg-[#EDF6F6] hover:border-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          active ? 'text-white' : 'text-[#0F2429] group-hover:text-[#0D6E6E] group-active:text-white'
                        }`}
                      >
                        {pat.name}
                      </p>
                      <p
                        className={`text-xs mt-0.5 tabular-nums ${
                          active ? 'text-white/85' : 'text-[#6D828A] group-active:text-white/85'
                        }`}
                      >
                        {pat.total_visits} {pat.total_visits === 1 ? 'visit' : 'visits'} · Last:{' '}
                        {pat.last_visit_date}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E2EAEF] rounded-xl p-6">
            {selectedPatientHistory ? (
              <div className="space-y-4">
                <div className="border-b border-[#EEF3F6] pb-3">
                  <h2 className="text-lg font-display font-semibold text-[#0F2429]">
                    {selectedPatientHistory.patient.name}
                  </h2>
                  <p className="text-xs text-[#6D828A] mt-0.5">
                    {selectedPatientHistory.patient.email}
                    {selectedPatientHistory.patient.phone
                      ? ` · ${selectedPatientHistory.patient.phone}`
                      : ''}
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedPatientHistory.visits.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-lg bg-[#F8FAFB] border border-[#E2EAEF] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-[#0F2429] tabular-nums">
                          {v.appointment_date} · {v.start_time} – {v.end_time}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${STATUS_STYLE[v.status]}`}
                        >
                          {v.status}
                        </span>
                      </div>
                      {v.reason && (
                        <p className="text-xs text-[#4A6068]">Reason: {v.reason}</p>
                      )}
                      {v.visit_note ? (
                        <p className="text-xs text-[#0F2429] pt-1 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#0D6E6E] mt-0.5 shrink-0" />
                          <span>{v.visit_note}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-[#6D828A]">No visit note recorded.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#6D828A]">
                Select a patient on the left to inspect their visit history and private notes with you.
              </p>
            )}
          </div>
        </div>
      ) : subTab === 'schedule' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Weekly Working Hours */}
          <div className="bg-white border border-[#E2EAEF] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#0F2429]">
                Weekly Working Hours
              </h2>
              <p className="text-xs text-[#6D828A] mt-1">
                Hours split automatically into 30-minute bookable slots. Overlaps and end times before start times are blocked.
              </p>
            </div>

            <form onSubmit={handleAddSchedule} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="sched-day" className="block text-xs font-medium text-[#0F2429] mb-1">
                  Day
                </label>
                <select
                  id="sched-day"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                >
                  {DAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="sched-start"
                  className="block text-xs font-medium text-[#0F2429] mb-1"
                >
                  Start (HH:MM)
                </label>
                <input
                  id="sched-start"
                  type="time"
                  step={1800}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="sched-end" className="block text-xs font-medium text-[#0F2429] mb-1">
                  End (HH:MM)
                </label>
                <input
                  id="sched-end"
                  type="time"
                  step={1800}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Add Hours
                </button>
              </div>
            </form>

            <div className="border-t border-[#EEF3F6] pt-4 space-y-2">
              {schedules.length === 0 ? (
                <p className="text-xs text-[#6D828A]">No clinic hours set yet.</p>
              ) : (
                schedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#F8FAFB] border border-[#E2EAEF] rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-[#0D6E6E]" aria-hidden="true" />
                      <span className="font-medium text-[#0F2429]">{s.dayName}</span>
                      <span className="text-xs text-[#4A6068] tabular-nums">
                        {s.startTime} – {s.endTime}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSchedule(s.id)}
                      aria-label={`Remove ${s.dayName} ${s.startTime}–${s.endTime}`}
                      className="p-1.5 rounded-md text-[#6D828A] hover:bg-[#FDF2F2] hover:text-[#9E2A2B] active:bg-[#9E2A2B] active:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Doctor Leave Days */}
          <div className="bg-white border border-[#E2EAEF] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#0F2429]">
                Mark Leave Days
              </h2>
              <p className="text-xs text-[#6D828A] mt-1">
                No slots are shown on leave dates. Any existing Pending or Confirmed appointments on that date are cancelled automatically and patients are emailed.
              </p>
            </div>

            <form onSubmit={handleAddLeave} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="leave-date"
                    className="block text-xs font-medium text-[#0F2429] mb-1"
                  >
                    Leave Date
                  </label>
                  <input
                    id="leave-date"
                    type="date"
                    required
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="leave-reason"
                    className="block text-xs font-medium text-[#0F2429] mb-1"
                  >
                    Reason (Optional)
                  </label>
                  <input
                    id="leave-reason"
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="e.g., Medical conference"
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0F2429] hover:bg-[#0D6E6E] active:bg-[#073E3E] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Mark Leave Day
              </button>
            </form>

            <div className="border-t border-[#EEF3F6] pt-4 space-y-2">
              {leaves.length === 0 ? (
                <p className="text-xs text-[#6D828A]">No upcoming leave dates marked.</p>
              ) : (
                leaves.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#F8FAFB] border border-[#E2EAEF] rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar className="w-4 h-4 text-[#0D6E6E] shrink-0" aria-hidden="true" />
                      <span className="font-medium text-[#0F2429] tabular-nums">{l.leaveDate}</span>
                      {l.reason && (
                        <span className="text-xs text-[#6D828A] truncate">· {l.reason}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLeave(l.id)}
                      aria-label={`Remove leave on ${l.leaveDate}`}
                      className="p-1.5 rounded-md text-[#6D828A] hover:bg-[#FDF2F2] hover:text-[#9E2A2B] active:bg-[#9E2A2B] active:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {emails.length === 0 ? (
            <div className="bg-white border border-[#E2EAEF] rounded-xl p-10 text-center text-sm text-[#6D828A]">
              No emails addressed to your doctor account yet.
            </div>
          ) : (
            emails.map((mail) => (
              <div
                key={mail.id}
                className="bg-white border border-[#E2EAEF] rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-[#6D828A]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#0D6E6E]">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{mail.category}</span>
                  </span>
                  <span className="tabular-nums">
                    {new Date(mail.created_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-display font-semibold text-[#0F2429]">
                  {mail.subject}
                </h3>
                <pre className="text-xs text-[#4A6068] whitespace-pre-wrap font-sans leading-relaxed">
                  {mail.body}
                </pre>
              </div>
            ))
          )}
        </div>
      )}

      {/* Visit Completion & Note Modal */}
      {completeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2429]/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-visit-title"
          onClick={() => setCompleteTarget(null)}
        >
          <div
            className="bg-white border border-[#D8E5EC] rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                id="complete-visit-title"
                className="text-lg font-display font-semibold text-[#0F2429]"
              >
                Record Visit Outcome ({completeOutcome})
              </h2>
              <button
                type="button"
                onClick={() => setCompleteTarget(null)}
                aria-label="Close"
                className="p-2 text-[#4A6068] hover:bg-[#EDF6F6] hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#6D828A]">
              {completeTarget.patient_name} · {completeTarget.appointment_date}{' '}
              {completeTarget.start_time}
            </p>
            <form onSubmit={handleSubmitCompletion} className="space-y-4">
              <div>
                <label
                  htmlFor="visit-note-input"
                  className="block text-xs font-medium text-[#0F2429] mb-1"
                >
                  Private Visit Note (Visible only to you and the patient)
                </label>
                <textarea
                  id="visit-note-input"
                  rows={4}
                  value={visitNote}
                  onChange={(e) => setVisitNote(e.target.value)}
                  placeholder="Optional clinical summary or follow-up guidance..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCompleteTarget(null)}
                  className="px-4 py-2 text-sm text-[#4A6068] bg-white border border-[#E2EAEF] rounded-lg hover:bg-[#F2F6F8] hover:text-[#0F2429] active:bg-[#DCE7ED] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Save {completeOutcome}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
