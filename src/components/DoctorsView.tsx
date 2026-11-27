import { useMemo, useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Video,
  Building2,
} from 'lucide-react';
import {
  PESHAWAR_AREAS,
  SPECIALTIES,
  type PeshawarArea,
} from '../data/peshawarData';
import type { LiveDoctorProfile } from '../lib/api';
import type { ConsultationType } from './HomeView';
import { DoctorCard } from './DoctorCard';

interface DoctorsViewProps {
  doctors: LiveDoctorProfile[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedArea: PeshawarArea;
  onAreaChange: (area: PeshawarArea) => void;
  selectedSpecialtyId: string;
  onSpecialtyChange: (specialtyId: string) => void;
  consultationType: ConsultationType | 'all';
  onConsultationTypeChange: (type: ConsultationType | 'all') => void;
  comparedDoctorIds: string[];
  onToggleCompare: (doctorId: string) => void;
  onViewDoctor: (doctor: LiveDoctorProfile) => void;
}

const DOCTORS_PER_PAGE = 3;

export function DoctorsView({
  doctors,
  searchQuery,
  onSearchQueryChange,
  selectedArea,
  onAreaChange,
  selectedSpecialtyId,
  onSpecialtyChange,
  consultationType,
  onConsultationTypeChange,
  comparedDoctorIds,
  onToggleCompare,
  onViewDoctor,
}: DoctorsViewProps) {
  const [sortBy, setSortBy] = useState<'experience' | 'fee-asc' | 'fee-desc'>('experience');
  const [maxFee, setMaxFee] = useState<number>(5000);
  const [page, setPage] = useState(1);

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = doctors.filter((doc) => {
      const areaMatch = selectedArea === 'All Peshawar' || doc.area === selectedArea;
      const specMatch =
        selectedSpecialtyId === 'all' || doc.specialtyId === selectedSpecialtyId;
      const feeMatch = doc.feePkr <= maxFee;
      const queryMatch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialtyName.toLowerCase().includes(q) ||
        doc.area.toLowerCase().includes(q) ||
        doc.clinicName.toLowerCase().includes(q) ||
        doc.focusAreas.some((f) => f.toLowerCase().includes(q));
      return areaMatch && specMatch && feeMatch && queryMatch;
    });

    if (sortBy === 'experience') {
      list.sort((a, b) => b.experienceYears - a.experienceYears);
    } else if (sortBy === 'fee-asc') {
      list.sort((a, b) => a.feePkr - b.feePkr);
    } else {
      list.sort((a, b) => b.feePkr - a.feePkr);
    }
    return list;
  }, [doctors, searchQuery, selectedArea, selectedSpecialtyId, maxFee, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / DOCTORS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedArea, selectedSpecialtyId, maxFee, sortBy, consultationType]);

  const safePage = Math.min(page, totalPages);
  const pagedDoctors = filteredDoctors.slice(
    (safePage - 1) * DOCTORS_PER_PAGE,
    safePage * DOCTORS_PER_PAGE
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedArea !== 'All Peshawar' ||
    selectedSpecialtyId !== 'all' ||
    consultationType !== 'all' ||
    maxFee < 5000;

  const handleReset = () => {
    onSearchQueryChange('');
    onAreaChange('All Peshawar');
    onSpecialtyChange('all');
    onConsultationTypeChange('all');
    setMaxFee(5000);
    setSortBy('experience');
    setPage(1);
  };

  return (
    <section
      aria-label="Find a Doctor"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6 min-h-[calc(100vh-7.5rem)] flex flex-col justify-center"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0F2429] tracking-tight">
            Find a Doctor
          </h1>
          <p className="mt-1 text-sm text-[#4A6068] flex flex-wrap items-center gap-2">
            <span>Select a specialist to reserve an open 30-minute slot.</span>
            {consultationType !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EDF6F6] border border-[#C5E0E0] text-xs font-medium text-[#0D6E6E]">
                {consultationType === 'online' ? (
                  <>
                    <Video className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Online Consultation · 15 min in advance</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Physical Consultation · 2 hours in advance</span>
                  </>
                )}
              </span>
            )}
          </p>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#D4E1E7] bg-white text-[#0F2429] hover:bg-[#EDF6F6] hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="text-xs font-medium text-[#4A6068] tabular-nums px-1.5">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#D4E1E7] bg-white text-[#0F2429] hover:bg-[#EDF6F6] hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Compact Single-Row Filter Bar */}
      <div className="bg-white border border-[#E2EAEF] rounded-xl p-3.5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          <div className="md:col-span-3 relative flex items-center">
            <Search
              className="w-4 h-4 text-[#6D828A] absolute left-3 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Doctor name or condition..."
              aria-label="Search doctors"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] placeholder:text-[#6D828A] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Consultation type"
              value={consultationType}
              onChange={(e) =>
                onConsultationTypeChange(e.target.value as ConsultationType | 'all')
              }
              className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none cursor-pointer"
            >
              <option value="all">All Consultations</option>
              <option value="online">Online Consultation</option>
              <option value="physical">Physical Consultation</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Medical specialty"
              value={selectedSpecialtyId}
              onChange={(e) => onSpecialtyChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none cursor-pointer"
            >
              <option value="all">All Specialties</option>
              {SPECIALTIES.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Area"
              value={selectedArea}
              onChange={(e) => onAreaChange(e.target.value as PeshawarArea)}
              className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none cursor-pointer"
            >
              {PESHAWAR_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[#4A6068] min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0D6E6E] shrink-0" aria-hidden="true" />
              <input
                type="range"
                min={1500}
                max={5000}
                step={250}
                value={maxFee}
                onChange={(e) => setMaxFee(Number(e.target.value))}
                aria-label="Maximum fee in PKR"
                className="accent-[#0D6E6E] w-20 cursor-pointer"
              />
              <span className="font-medium text-[#0F2429] tabular-nums whitespace-nowrap">
                ≤ {maxFee.toLocaleString()}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#0D6E6E] hover:bg-[#EDF6F6] active:bg-[#0D6E6E] active:text-white transition-colors shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {pagedDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pagedDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              isCompared={comparedDoctorIds.includes(doctor.id)}
              onToggleCompare={onToggleCompare}
              onViewProfile={onViewDoctor}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E2EAEF] rounded-xl p-10 text-center max-w-xl mx-auto">
          <h2 className="text-lg font-display font-semibold text-[#0F2429]">
            No doctors match these filters
          </h2>
          <p className="mt-2 text-sm text-[#4A6068]">
            Try widening the neighborhood or raising the consultation fee limit.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-5 px-5 py-2.5 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
