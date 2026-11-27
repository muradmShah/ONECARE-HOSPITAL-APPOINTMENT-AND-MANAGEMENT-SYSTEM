import { MapPin, Clock, ArrowUpRight, Check, Scale } from 'lucide-react';
import type { LiveDoctorProfile } from '../lib/api';
import { ResilientImage } from './ResilientImage';

interface DoctorCardProps {
  doctor: LiveDoctorProfile;
  isCompared: boolean;
  onToggleCompare: (doctorId: string) => void;
  onViewProfile: (doctor: LiveDoctorProfile) => void;
}

export function DoctorCard({
  doctor,
  isCompared,
  onToggleCompare,
  onViewProfile,
}: DoctorCardProps) {
  const scheduleSummary =
    doctor.schedules && doctor.schedules.length > 0
      ? doctor.schedules
          .slice(0, 2)
          .map((s) => `${s.dayName.slice(0, 3)} ${s.startTime}–${s.endTime}`)
          .join(' · ') +
        (doctor.schedules.length > 2 ? ` (+${doctor.schedules.length - 2} more)` : '')
      : null;

  return (
    <article className="bg-white border border-[#D9E5E7] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between transition-all duration-150 hover:border-[#0C7773]/60 hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-[#647780] mb-3.5">
          <span className="font-medium text-[#0C7773] truncate">{doctor.specialtyName}</span>
          <span className="tabular-nums shrink-0">{doctor.experienceYears} yrs exp</span>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-[#EAF5F5] shrink-0 border border-[#D9E5E7]">
            <ResilientImage
              src={doctor.image}
              alt={`${doctor.name}, ${doctor.specialtyName}`}
              fallbackLabel={doctor.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-display font-semibold text-[#142F35] leading-snug">
              {doctor.name}
            </h3>
            <p className="text-xs sm:text-sm text-[#647780] mt-0.5 leading-snug">
              {doctor.qualifications}
            </p>
            <p className="text-xs text-[#647780] mt-1">
              Languages: {doctor.languages.join(', ')}
            </p>
          </div>
        </div>

        <div className="border-t border-[#D9E5E7]/70 my-4" />

        <dl className="space-y-2.5 text-sm">
          <div className="flex items-start gap-2.5 text-[#647780]">
            <MapPin className="w-4 h-4 text-[#0C7773] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="sr-only">Clinic and location</dt>
              <dd className="text-sm text-[#142F35] font-medium leading-snug truncate">
                {doctor.clinicName}
              </dd>
              <dd className="text-xs text-[#647780] mt-0.5">{doctor.area}, Peshawar</dd>
            </div>
          </div>

          {scheduleSummary && (
            <div className="flex items-start gap-2.5 text-[#647780]">
              <Clock className="w-4 h-4 text-[#647780] mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="sr-only">Verified clinic availability</dt>
                <dd className="text-xs text-[#647780] leading-snug truncate">
                  {scheduleSummary}
                </dd>
              </div>
            </div>
          )}
        </dl>

        {typeof doctor.feePkr === 'number' && doctor.feePkr > 0 && (
          <div className="mt-4 pt-3.5 border-t border-[#D9E5E7]/70 flex items-baseline justify-between gap-2">
            <span className="text-xs text-[#647780]">Consultation fee</span>
            <span className="text-base font-display font-semibold text-[#142F35] tabular-nums">
              PKR {doctor.feePkr.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onViewProfile(doctor)}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1565D8] hover:bg-[#1052B5] active:bg-[#0B3F8E] text-white text-sm font-semibold rounded-[12px] shadow-[0_3px_10px_rgba(21,101,216,0.2)] transition-all duration-150 whitespace-nowrap cursor-pointer"
        >
          <span>View Profile</span>
          <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onToggleCompare(doctor.id)}
          aria-pressed={isCompared}
          className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-[12px] border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
            isCompared
              ? 'bg-[#0C7773] border-[#0C7773] text-white hover:bg-[#095E5B]'
              : 'bg-white border-[#D9E5E7] text-[#647780] hover:bg-[#E1F3ED] hover:text-[#0C7773] hover:border-[#0C7773]'
          }`}
        >
          {isCompared ? (
            <>
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Added</span>
            </>
          ) : (
            <>
              <Scale className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Compare</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
