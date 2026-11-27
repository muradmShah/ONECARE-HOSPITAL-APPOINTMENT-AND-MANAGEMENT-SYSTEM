import { Stethoscope, Pill, FlaskConical } from 'lucide-react';
import {
  type NavSection,
  type PeshawarArea,
  type SearchScope,
} from '../data/peshawarData';
import type { LiveDoctorProfile } from '../lib/api';
import { LocationSelector } from './LocationSelector';
import { HealthcareSearch } from './HealthcareSearch';
import { ServiceCard } from './ServiceCard';
import { ResilientImage } from './ResilientImage';

export type ConsultationType = 'online' | 'physical';

interface HomeViewProps {
  doctors: LiveDoctorProfile[];
  selectedArea: PeshawarArea;
  onAreaChange: (area: PeshawarArea) => void;
  comparedDoctorIds: string[];
  onToggleCompare: (doctorId: string) => void;
  selectedConsultationType?: ConsultationType | 'all';
  onConsultationNext?: (type: ConsultationType) => void;
  onNavigate: (section: NavSection | 'portal') => void;
  onExecuteSearch: (query: string, scope: SearchScope, area: PeshawarArea) => void;
  onSelectSpecialty: (specialtyId: string) => void;
  onViewDoctor: (doctor: LiveDoctorProfile) => void;
}

export function HomeView({
  doctors,
  selectedArea,
  onAreaChange,
  onNavigate,
  onExecuteSearch,
  onSelectSpecialty,
  onViewDoctor,
}: HomeViewProps) {
  const handleSelectDoctorById = (doctorId: string) => {
    const match = doctors.find((d) => d.id === doctorId);
    if (match) onViewDoctor(match);
  };

  return (
    <section
      aria-label="ONECARE Home"
      className="bg-[#EAF5F5] min-h-[calc(100vh-8.25rem)] flex items-center"
    >
      <div className="max-w-[1440px] w-full mx-auto px-5 sm:px-6 lg:px-12 py-6 lg:py-8">
        {/* Top Row: Calm Hero + Location + Smart Search + Healthcare Trio Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-3">
              <h1
                className="font-display font-bold text-[#142F35] tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2.1rem, 3.6vw, 3.25rem)' }}
              >
                The right care. Without the confusion.
              </h1>
              <p className="text-base sm:text-lg text-[#647780] leading-relaxed max-w-xl">
                Find trusted doctors, medicines, and lab tests around Peshawar — all in one place.
              </p>
            </div>

            <div className="space-y-3">
              <LocationSelector
                selectedArea={selectedArea}
                onAreaChange={onAreaChange}
              />

              <HealthcareSearch
                doctors={doctors}
                selectedArea={selectedArea}
                onExecuteSearch={onExecuteSearch}
                onSelectDoctor={handleSelectDoctorById}
                onSelectSpecialty={onSelectSpecialty}
              />
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-[22px] overflow-hidden bg-white border border-[#D9E5E7] shadow-sm p-2 aspect-video">
              <ResilientImage
                src="/assets/aistudio/Modern_Healthcare_Trio_89c4c963.png"
                alt="ONECARE healthcare trio showing doctor consultation, prescribed medicines, and diagnostic lab testing"
                fallbackLabel="ONECARE — Healthcare. All in One."
                className="w-full h-full object-contain rounded-[16px]"
              />
            </div>
          </div>
        </div>

        {/* Three Primary Service Cards — Visible immediately on one screen */}
        <div className="mt-7 lg:mt-9 grid grid-cols-1 md:grid-cols-3 gap-5">
          <ServiceCard
            title="Find a Doctor"
            description="Explore medical specialists"
            ctaLabel="Explore Doctors"
            icon={Stethoscope}
            onClick={() => onNavigate('doctors')}
          />
          <ServiceCard
            title="Find Medicines"
            description="Search medicines and information"
            ctaLabel="Explore Medicines"
            icon={Pill}
            onClick={() => onNavigate('medicines')}
          />
          <ServiceCard
            title="Book Lab Tests"
            description="Find diagnostic tests and labs"
            ctaLabel="Explore Tests"
            icon={FlaskConical}
            onClick={() => onNavigate('labs')}
          />
        </div>
      </div>
    </section>
  );
}
