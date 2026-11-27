import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Play,
  Mail,
  RefreshCw,
  Shield,
  Send,
  ExternalLink,
} from 'lucide-react';
import { SPECIALTIES, PESHAWAR_AREAS } from '../data/peshawarData';
import {
  adminApi,
  type AdminDoctorSummary,
  type ClinicClock,
  type EmailRecord,
} from '../lib/api';

interface AdminDashboardProps {
  onOpenInviteToken: (token: string) => void;
  onDoctorsMutated: () => void;
}

export function AdminDashboard({
  onOpenInviteToken,
  onDoctorsMutated,
}: AdminDashboardProps) {
  const [subTab, setSubTab] = useState<'overview' | 'doctors' | 'outbox'>('overview');
  const [clock, setClock] = useState<ClinicClock | null>(null);
  const [doctors, setDoctors] = useState<AdminDoctorSummary[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<
    {
      id: string;
      doctor_id: string;
      appointment_date: string;
      start_time: string;
      end_time: string;
      status: string;
      doctor_name: string;
      specialty_name: string;
      patient_name: string;
    }[]
  >([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  const [loading, setLoading] = useState(true);
  const [runningAuto, setRunningAuto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Add Doctor Form
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('general-physician');
  const [docQuals, setDocQuals] = useState('MBBS, FCPS');
  const [docExp, setDocExp] = useState(8);
  const [docFee, setDocFee] = useState(2000);
  const [docArea, setDocArea] = useState('University Town');
  const [addingDoc, setAddingDoc] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, outboxRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getOutbox(),
      ]);
      setClock(dashRes.clock);
      setDoctors(dashRes.doctors);
      setTodaysAppointments(dashRes.todaysAppointments);
      setSmtpConfigured(dashRes.smtpConfigured);
      setEmails(outboxRes.emails);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to load clinic dashboard.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingDoc(true);
    setFeedback(null);
    try {
      const res = await adminApi.addDoctor({
        name: docName.trim(),
        email: docEmail.trim(),
        specialtyId: docSpecialty,
        qualifications: docQuals.trim(),
        experienceYears: Number(docExp),
        feePkr: Number(docFee),
        area: docArea,
      });
      setDocName('');
      setDocEmail('');
      setFeedback({
        type: 'ok',
        text: `${res.doctor.name} added. A set-password invitation email has been sent to ${res.doctor.email}. Open Email Outbox to view it in preview mode.`,
      });
      onDoctorsMutated();
      await loadDashboard();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to add doctor.',
      });
    } finally {
      setAddingDoc(false);
    }
  };

  const handleToggleActive = async (doctorId: string, currentActive: boolean) => {
    setFeedback(null);
    try {
      await adminApi.setDoctorStatus(doctorId, !currentActive);
      setFeedback({
        type: 'ok',
        text: !currentActive
          ? 'Doctor activated and bookable again.'
          : 'Doctor deactivated. Patients cannot book new appointments with them.',
      });
      onDoctorsMutated();
      await loadDashboard();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to update doctor status.',
      });
    }
  };

  const handleResendInvite = async (doctorId: string) => {
    setFeedback(null);
    try {
      const res = await adminApi.sendInvite(doctorId);
      setFeedback({
        type: 'ok',
        text: `Set-password invitation email sent to ${res.recipientEmail}.`,
      });
      await loadDashboard();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not send invite.',
      });
    }
  };

  const handleRunAutomations = async () => {
    setRunningAuto(true);
    setFeedback(null);
    try {
      const res = await adminApi.runAutomations();
      setFeedback({
        type: 'ok',
        text: `Automations completed: ${res.summary.autoCancelledCount} expired Pending request(s) auto-cancelled, ${res.summary.remindersSentCount} tomorrow reminder email(s) sent.`,
      });
      await loadDashboard();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Automation run failed.',
      });
    } finally {
      setRunningAuto(false);
    }
  };

  const extractTokenFromActionPath = (actionPath: string): string | null => {
    const match = actionPath.match(/inviteToken=([a-f0-9]+)/i);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6">
      {/* Admin Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Admin portal sections"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EEF4F6] rounded-lg"
        >
          {[
            { id: 'overview', label: 'Clinic Dashboard' },
            { id: 'doctors', label: `Manage Doctors (${doctors.length})` },
            { id: 'outbox', label: `Email Outbox (${emails.length})` },
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

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A6068] bg-white border border-[#D4E1E7] rounded-lg hover:bg-[#EDF6F6] hover:text-[#0D6E6E] hover:border-[#0D6E6E] active:bg-[#0D6E6E] active:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            disabled={runningAuto}
            onClick={() => void handleRunAutomations()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{runningAuto ? 'Running...' : 'Run Automations Now'}</span>
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
          Loading clinic manager dashboard...
        </div>
      ) : subTab === 'overview' ? (
        <div className="space-y-6">
          {/* Privacy Guard Notice */}
          <div className="bg-[#F4F8FA] border border-[#DDE8EE] rounded-xl p-4 flex items-start gap-3 text-xs text-[#4A6068]">
            <Shield className="w-4 h-4 text-[#0D6E6E] shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-[#0F2429]">Clinic Privacy Boundary:</strong> Admin views display scheduling status totals and today&apos;s roster only. Private patient visit notes are omitted at the server level.
            </p>
          </div>

          {/* Per-Doctor Appointment Counts Table */}
          <div className="bg-white border border-[#E2EAEF] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EEF3F6] flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-display font-semibold text-[#0F2429]">
                Appointments by Doctor
              </h2>
              <span className="text-xs text-[#6D828A] tabular-nums">
                Clinic Date: {clock?.todayDate} ({clock?.currentTimeHm} PKT)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-[#E2EAEF] bg-[#F8FAFB] text-xs font-medium text-[#6D828A]">
                    <th className="py-3 px-6">Doctor</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Pending</th>
                    <th className="py-3 px-3 text-right">Confirmed</th>
                    <th className="py-3 px-3 text-right">Completed</th>
                    <th className="py-3 px-3 text-right">No-show</th>
                    <th className="py-3 px-6 text-right">Cancelled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F6]">
                  {doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#FAFDFE]">
                      <td className="py-3.5 px-6">
                        <p className="font-medium text-[#0F2429]">{doc.name}</p>
                        <p className="text-xs text-[#6D828A]">{doc.specialtyName}</p>
                      </td>
                      <td className="py-3.5 px-3 text-xs">
                        <span
                          className={
                            doc.isActive ? 'text-[#1E7A62] font-medium' : 'text-[#9E2A2B] font-medium'
                          }
                        >
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums font-medium text-[#9A6700]">
                        {doc.counts.pending}
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums font-medium text-[#0D6E6E]">
                        {doc.counts.confirmed}
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums font-medium text-[#1E7A62]">
                        {doc.counts.completed}
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums text-[#4A6068]">
                        {doc.counts.noShow}
                      </td>
                      <td className="py-3.5 px-6 text-right tabular-nums text-[#9E2A2B]">
                        {doc.counts.cancelled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Appointments Table */}
          <div className="bg-white border border-[#E2EAEF] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EEF3F6] flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-[#0F2429]">
                Today&apos;s Appointments ({clock?.todayDate})
              </h2>
              <span className="text-xs text-[#6D828A] tabular-nums">
                {todaysAppointments.length} total
              </span>
            </div>

            {todaysAppointments.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#6D828A]">
                No appointments scheduled for today ({clock?.todayDate}).
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[540px] text-sm">
                  <thead>
                    <tr className="border-b border-[#E2EAEF] bg-[#F8FAFB] text-xs font-medium text-[#6D828A]">
                      <th className="py-3 px-6">Time (PKT)</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F6]">
                    {todaysAppointments.map((appt) => (
                      <tr key={appt.id}>
                        <td className="py-3.5 px-6 tabular-nums font-medium text-[#0F2429]">
                          {appt.start_time} – {appt.end_time}
                        </td>
                        <td className="py-3.5 px-4 text-[#0F2429]">{appt.patient_name}</td>
                        <td className="py-3.5 px-4 text-[#4A6068]">
                          {appt.doctor_name}{' '}
                          <span className="text-xs text-[#6D828A]">· {appt.specialty_name}</span>
                        </td>
                        <td className="py-3.5 px-6 text-xs font-semibold text-[#0F2429]">
                          {appt.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : subTab === 'doctors' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add Doctor Form */}
          <div className="lg:col-span-5 bg-white border border-[#E2EAEF] rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#0F2429]">
                Add New Doctor
              </h2>
              <p className="text-xs text-[#6D828A] mt-1">
                Creates a doctor profile and emails a single-use link to set their password.
              </p>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-3.5">
              <div>
                <label htmlFor="add-doc-name" className="block text-xs font-medium text-[#0F2429] mb-1">
                  Doctor Name
                </label>
                <input
                  id="add-doc-name"
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Dr. Kamran Siddiqui"
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="add-doc-email" className="block text-xs font-medium text-[#0F2429] mb-1">
                  Doctor Email
                </label>
                <input
                  id="add-doc-email"
                  type="email"
                  required
                  value={docEmail}
                  onChange={(e) => setDocEmail(e.target.value)}
                  placeholder="doctor@clinic.pk"
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-doc-spec" className="block text-xs font-medium text-[#0F2429] mb-1">
                    Specialty
                  </label>
                  <select
                    id="add-doc-spec"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="add-doc-area" className="block text-xs font-medium text-[#0F2429] mb-1">
                    Area
                  </label>
                  <select
                    id="add-doc-area"
                    value={docArea}
                    onChange={(e) => setDocArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                  >
                    {PESHAWAR_AREAS.filter((a) => a !== 'All Peshawar').map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="add-doc-quals" className="block text-xs font-medium text-[#0F2429] mb-1">
                  Qualifications
                </label>
                <input
                  id="add-doc-quals"
                  type="text"
                  value={docQuals}
                  onChange={(e) => setDocQuals(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-doc-exp" className="block text-xs font-medium text-[#0F2429] mb-1">
                    Experience (Years)
                  </label>
                  <input
                    id="add-doc-exp"
                    type="number"
                    min={1}
                    max={60}
                    value={docExp}
                    onChange={(e) => setDocExp(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="add-doc-fee" className="block text-xs font-medium text-[#0F2429] mb-1">
                    Fee (PKR)
                  </label>
                  <input
                    id="add-doc-fee"
                    type="number"
                    min={500}
                    step={100}
                    value={docFee}
                    onChange={(e) => setDocFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingDoc}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{addingDoc ? 'Adding Doctor...' : 'Add Doctor & Send Invite'}</span>
              </button>
            </form>
          </div>

          {/* Existing Doctors List */}
          <div className="lg:col-span-7 space-y-3">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-[#E2EAEF] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        doc.isActive ? 'text-[#1E7A62]' : 'text-[#9E2A2B]'
                      }`}
                    >
                      {doc.isActive ? 'Active' : 'Deactivated'}
                    </span>
                    <span className="text-[#CBD8E0]">·</span>
                    <span className="text-[#6D828A]">{doc.specialtyName}</span>
                    <span className="text-[#CBD8E0]">·</span>
                    <span className="text-[#6D828A]">
                      {doc.hasPassword ? 'Password set' : 'Awaiting password setup'}
                    </span>
                  </div>
                  <h3 className="text-base font-display font-semibold text-[#0F2429] mt-1">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-[#6D828A]">
                    {doc.email} · {doc.area} · PKR {doc.feePkr.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleResendInvite(doc.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0D6E6E] bg-[#EDF6F6] border border-[#CBE2E2] hover:bg-[#0D6E6E] hover:text-white hover:border-[#0D6E6E] active:bg-[#073E3E] rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Set-Password Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(doc.id, doc.isActive)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      doc.isActive
                        ? 'bg-white border-[#F0D3D3] text-[#9E2A2B] hover:bg-[#9E2A2B] hover:text-white hover:border-[#9E2A2B] active:bg-[#7A1E1F]'
                        : 'bg-white border-[#BBDCDC] text-[#0D6E6E] hover:bg-[#0D6E6E] hover:text-white hover:border-[#0D6E6E] active:bg-[#073E3E]'
                    }`}
                  >
                    {doc.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Email Outbox Log */
        <div className="space-y-4">
          <div className="bg-[#EEF4F8] border border-[#D4E2EB] rounded-xl p-4 text-xs text-[#4A6068]">
            {smtpConfigured
              ? 'SMTP is configured. Outgoing clinic emails are dispatched live and logged below.'
              : 'SMTP is not configured in environment variables, so outgoing emails are persisted here in the preview outbox. Use the button on doctor invite emails to open the Set Password form directly.'}
          </div>

          {emails.length === 0 ? (
            <div className="bg-white border border-[#E2EAEF] rounded-xl p-10 text-center text-sm text-[#6D828A]">
              No emails sent yet.
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((mail) => {
                const inviteToken = mail.action_path
                  ? extractTokenFromActionPath(mail.action_path)
                  : null;
                return (
                  <div
                    key={mail.id}
                    className="bg-white border border-[#E2EAEF] rounded-xl p-5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6D828A]">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#0D6E6E]">
                        <Mail className="w-3.5 h-3.5" />
                        <span>
                          To: {mail.recipient_email} · {mail.category}
                        </span>
                      </span>
                      <span className="tabular-nums">
                        {new Date(mail.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-display font-semibold text-[#0F2429]">
                      {mail.subject}
                    </h3>
                    <pre className="text-xs text-[#4A6068] whitespace-pre-wrap font-sans leading-relaxed">
                      {mail.body}
                    </pre>
                    {inviteToken && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => onOpenInviteToken(inviteToken)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Set-Password Link (Sign out &amp; Activate)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
