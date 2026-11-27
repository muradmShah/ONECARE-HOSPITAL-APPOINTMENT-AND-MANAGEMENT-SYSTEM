import { useState, useEffect, useCallback } from 'react';
import {
  X,
  MapPin,
  Clock,
  Pill,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { SAMPLE_LAB_TESTS, SAMPLE_MEDICINES } from '../data/peshawarData';
import {
  appointmentsApi,
  doctorsApi,
  type AuthUser,
  type ClinicClock,
  type LiveDoctorProfile,
  type SlotItem,
} from '../lib/api';
import { ResilientImage } from './ResilientImage';

interface DoctorDetailModalProps {
  doctor: LiveDoctorProfile | null;
  authUser: AuthUser | null;
  clock: ClinicClock | null;
  onClose: () => void;
  onGoToPortal: () => void;
  onExploreMedicines: (query: string) => void;
  onExploreLabs: (query: string) => void;
}

export function DoctorDetailModal({
  doctor,
  authUser,
  clock,
  onClose,
  onGoToPortal,
  onExploreMedicines,
  onExploreLabs,
}: DoctorDetailModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotNotice, setSlotNotice] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [visitReason, setVisitReason] = useState('');

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<{
    date: string;
    startTime: string;
  } | null>(null);

  const loadSlots = useCallback(async (doctorId: string, dateStr: string) => {
    if (!dateStr) return;
    setSlotsLoading(true);
    setSelectedStartTime('');
    setBookingError('');
    try {
      const res = await doctorsApi.getSlots(doctorId, dateStr);
      setSlots(res.slots);
      setSlotNotice(res.message || '');
    } catch (err) {
      setSlots([]);
      setSlotNotice(err instanceof Error ? err.message : 'Unable to check slots.');
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!doctor) return;
    const initialDate = clock?.todayDate || new Date().toISOString().slice(0, 10);
    setSelectedDate(initialDate);
    setVisitReason('');
    setBookingError('');
    setBookingSuccess(null);
    void loadSlots(doctor.id, initialDate);
  }, [doctor?.id, clock?.todayDate, loadSlots]);

  useEffect(() => {
    if (!doctor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doctor, onClose]);

  if (!doctor) return null;

  const relatedMeds = SAMPLE_MEDICINES.filter(
    (m) => m.relatedSpecialty.toLowerCase() === doctor.specialtyName.toLowerCase()
  ).slice(0, 2);
  const relatedLabs = SAMPLE_LAB_TESTS.filter(
    (l) => l.relatedSpecialty.toLowerCase() === doctor.specialtyName.toLowerCase()
  ).slice(0, 2);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStartTime) {
      setBookingError('Please select a free 30-minute time slot.');
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    try {
      await appointmentsApi.book({
        doctorId: doctor.id,
        date: selectedDate,
        startTime: selectedStartTime,
        reason: visitReason.trim(),
      });
      setBookingSuccess({ date: selectedDate, startTime: selectedStartTime });
      setVisitReason('');
      await loadSlots(doctor.id, selectedDate);
    } catch (err) {
      setBookingError(
        err instanceof Error ? err.message : 'Could not submit appointment request.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2429]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#D8E5EC] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E2EAEF] px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-[#6D828A]">{doctor.specialtyName}</p>
            <h2
              id="doctor-modal-title"
              className="text-lg font-display font-semibold text-[#0F2429] truncate"
            >
              {doctor.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close doctor profile"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A6068] hover:bg-[#EDF6F6] hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Summary Block */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#EEF4F8] shrink-0">
              <ResilientImage
                src={doctor.image}
                alt={`${doctor.name} portrait`}
                fallbackLabel={doctor.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm text-[#4A6068]">{doctor.qualifications}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6D828A]">
                <span className="tabular-nums">{doctor.experienceYears} years experience</span>
                <span aria-hidden="true">·</span>
                <span>{doctor.languages.join(', ')}</span>
              </div>
              <div className="pt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-xs text-[#6D828A] block">Consultation Fee</span>
                  <span className="font-display font-semibold text-[#0F2429] tabular-nums">
                    PKR {doctor.feePkr.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[#6D828A] block">Clinic Location</span>
                  <span className="text-[#0F2429]">
                    {doctor.clinicName} ({doctor.area})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Clinic Hours Summary */}
          <div className="bg-[#F8FAFB] border border-[#E2EAEF] rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2429]">
              <Clock className="w-3.5 h-3.5 text-[#0D6E6E]" aria-hidden="true" />
              <span>Weekly Clinic Hours (30-Minute Slots · PKT)</span>
            </div>
            {doctor.schedules && doctor.schedules.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4A6068] tabular-nums">
                {doctor.schedules.map((s) => (
                  <span key={s.id}>
                    <strong className="text-[#0F2429] font-medium">{s.dayName.slice(0, 3)}:</strong>{' '}
                    {s.startTime}–{s.endTime}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6D828A]">
                This doctor has not published weekly hours yet.
              </p>
            )}
          </div>

          {/* Live 30-Minute Slot Booking */}
          <div className="border-t border-[#E2EAEF] pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-display font-semibold text-[#0F2429]">
                  Select Date &amp; Free Slot
                </h3>
                <p className="text-xs text-[#6D828A]">
                  Each slot holds one appointment only. Requesting reserves it immediately.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0D6E6E]" aria-hidden="true" />
                <label htmlFor="booking-date-input" className="sr-only">
                  Appointment date
                </label>
                <input
                  id="booking-date-input"
                  type="date"
                  min={clock?.todayDate}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setBookingSuccess(null);
                    void loadSlots(doctor.id, e.target.value);
                  }}
                  className="px-3 py-1.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
                />
              </div>
            </div>

            {slotsLoading ? (
              <p className="text-xs text-[#6D828A] py-3">Checking available 30-minute slots...</p>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const active = selectedStartTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => {
                        setSelectedStartTime(slot.startTime);
                        setBookingError('');
                      }}
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
              <div className="bg-[#F8FAFB] border border-[#E2EAEF] rounded-lg p-4 text-xs text-[#4A6068]">
                {slotNotice || 'No free slots available on this date.'}
              </div>
            )}

            {bookingSuccess && (
              <div className="bg-[#EDF6F6] border border-[#BBDCDC] rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0D6E6E] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-[#0F2429]">
                  <p className="font-semibold">Appointment Request Saved (Pending)</p>
                  <p className="text-xs text-[#4A6068] mt-1">
                    Requested {bookingSuccess.date} at {bookingSuccess.startTime} PKT with {doctor.name}. The slot is held while awaiting doctor confirmation.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToPortal();
                    }}
                    className="mt-2.5 px-3 py-1.5 rounded-lg bg-white border border-[#BBDCDC] text-xs font-medium text-[#0D6E6E] hover:bg-[#0D6E6E] hover:text-white hover:border-[#0D6E6E] active:bg-[#073E3E] transition-colors cursor-pointer"
                  >
                    Open My Appointments in Portal
                  </button>
                </div>
              </div>
            )}

            {authUser?.role === 'patient' ? (
              <form onSubmit={handleBookSlot} className="space-y-3 pt-1">
                <div>
                  <label
                    htmlFor="booking-reason"
                    className="block text-xs font-medium text-[#0F2429] mb-1"
                  >
                    Brief Reason for Visit (Optional, private to you &amp; doctor)
                  </label>
                  <input
                    id="booking-reason"
                    type="text"
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    placeholder="e.g., Persistent cough for 4 days"
                    className="w-full px-3.5 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
                  />
                </div>

                {bookingError && (
                  <p role="alert" className="text-xs font-medium text-[#9E2A2B]">
                    {bookingError}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-[#6D828A]">
                    {selectedStartTime
                      ? `Selected: ${selectedDate} at ${selectedStartTime} PKT`
                      : 'Select a slot above to continue'}
                  </span>
                  <button
                    type="submit"
                    disabled={!selectedStartTime || bookingLoading}
                    className="px-5 py-2.5 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {bookingLoading ? 'Requesting...' : 'Request Appointment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-[#EEF4F8] border border-[#D4E2EB] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#4A6068]">
                  {authUser
                    ? `Signed in as ${authUser.role}. Sign in with a patient account to book an appointment slot.`
                    : 'Sign in or create a patient account to reserve an open 30-minute slot.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToPortal();
                  }}
                  className="px-4 py-2 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {authUser ? 'Open Portal' : 'Sign In / Sign Up'}
                </button>
              </div>
            )}
          </div>

          {/* Connected Clinician-Guided Resources */}
          {(relatedMeds.length > 0 || relatedLabs.length > 0) && (
            <div className="border-t border-[#E2EAEF] pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedMeds.length > 0 && (
                <div className="bg-[#F8FAFB] border border-[#E2EAEF] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2429] mb-2">
                    <Pill className="w-3.5 h-3.5 text-[#0D6E6E]" aria-hidden="true" />
                    <span>Related Medicine Classes</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#4A6068]">
                    {relatedMeds.map((med) => (
                      <li key={med.id}>{med.genericName}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onExploreMedicines(doctor.specialtyName);
                    }}
                    className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E2EAEF] text-xs font-medium text-[#0D6E6E] hover:bg-[#0D6E6E] hover:border-[#0D6E6E] hover:text-white active:bg-[#073E3E] transition-colors cursor-pointer"
                  >
                    <span>View nearby pharmacies</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {relatedLabs.length > 0 && (
                <div className="bg-[#F8FAFB] border border-[#E2EAEF] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2429] mb-2">
                    <FlaskConical className="w-3.5 h-3.5 text-[#0D6E6E]" aria-hidden="true" />
                    <span>Common Diagnostic Tests</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#4A6068]">
                    {relatedLabs.map((lab) => (
                      <li key={lab.id}>{lab.name}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onExploreLabs(doctor.specialtyName);
                    }}
                    className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E2EAEF] text-xs font-medium text-[#0D6E6E] hover:bg-[#0D6E6E] hover:border-[#0D6E6E] hover:text-white active:bg-[#073E3E] transition-colors cursor-pointer"
                  >
                    <span>Explore labs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[#6D828A]">
            <MapPin className="w-3.5 h-3.5 text-[#0D6E6E]" aria-hidden="true" />
            <span>
              {doctor.clinicName} · {doctor.area}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
