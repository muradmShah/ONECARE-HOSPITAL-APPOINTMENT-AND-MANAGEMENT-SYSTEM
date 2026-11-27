import type { ElementType } from 'react';
import { ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  icon: ElementType;
  onClick: () => void;
}

export function ServiceCard({
  title,
  description,
  ctaLabel,
  icon: Icon,
  onClick,
}: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white border border-[#D9E5E7] hover:border-[#0C7773] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:bg-[#EAF5F5] cursor-pointer w-full min-h-[140px]"
    >
      <div>
        <div className="w-11 h-11 rounded-[12px] bg-[#E1F3ED] text-[#0C7773] group-hover:bg-[#0C7773] group-hover:text-white inline-flex items-center justify-center transition-colors duration-150">
          <Icon className="w-5 h-5" strokeWidth={1.85} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-display font-semibold text-[#142F35] group-hover:text-[#0C7773] transition-colors">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[#647780] leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0C7773]">
        <span>{ctaLabel}</span>
        <ArrowRight
          className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
