import { ArrowRight } from 'lucide-react';
import type { SpecialtyItem } from '../data/peshawarData';
import { SpecialtyIcon } from './SpecialtyIcon';

interface SpecialtyCardProps {
  specialty: SpecialtyItem;
  onSelect: (specialtyId: string) => void;
}

export function SpecialtyCard({ specialty, onSelect }: SpecialtyCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(specialty.id)}
      className="group text-left bg-white border border-[#D9E5E7] hover:border-[#0C7773] rounded-[16px] p-5 transition-all duration-150 hover:shadow-sm cursor-pointer w-full min-h-[44px]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-[#E1F3ED] text-[#0C7773] group-hover:bg-[#0C7773] group-hover:text-white inline-flex items-center justify-center transition-colors">
          <SpecialtyIcon iconKey={specialty.iconKey} className="w-5 h-5" />
        </div>
        <ArrowRight
          className="w-4 h-4 text-[#647780] group-hover:text-[#0C7773] group-hover:translate-x-0.5 transition-all"
          aria-hidden="true"
        />
      </div>

      <h3 className="mt-4 text-base font-display font-semibold text-[#142F35] group-hover:text-[#0C7773] transition-colors">
        {specialty.name}
      </h3>
      <p className="mt-1 text-sm text-[#647780] leading-relaxed">
        {specialty.shortDesc}
      </p>
    </button>
  );
}
