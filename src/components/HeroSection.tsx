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

interface HeroSectionProps {
  doctors: LiveDoctorProfile[];
  selectedArea: PeshawarArea;
  onAreaChange: (area: PeshawarArea) => void;
  onNavigate: (section: NavSection) => void;
  onExecuteSearch: (query: string, scope: SearchScope, area: PeshawarArea) => void;
  onSelectDoctor: (doctorId: string) => void;
  onSelectSpecialty: (specialtyId: string) => void;
}

export function HeroSection({
  doctors,
  selectedArea,
  onAreaChange,
  onNavigate,
  onExecuteSearch,
  onSelectDoctor,
  onSelectSpecialty,
}: HeroSectionProps) {
  return (
    <section
      aria-label="Hero"
      className="bg-[#EAF5F5] border-b border-[#D9E5E7]"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-12 py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline, Subtitle, Location, Smart Search, Quick Access Cards */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <h1
                className="font-display font-bold text-[#142F35] tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2.25rem, 4.1vw, 3.625rem)' }}
              >
                The right care. Without the confusion.
              </h1>
              <p className="text-base sm:text-lg text-[#647780] leading-relaxed max-w-2xl">
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
                onSelectDoctor={onSelectDoctor}
                onSelectSpecialty={onSelectSpecialty}
              />
            </div>

            {/* Quick Access Service Cards directly below Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
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

          {/* Right Column: ONECARE Healthcare Trio Visual */}
          <div className="lg:col-span-5">
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
      </div>
    </section>
  );
}
