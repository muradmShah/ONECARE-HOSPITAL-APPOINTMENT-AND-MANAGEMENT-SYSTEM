import { ArrowRight, MapPin } from 'lucide-react';
import type { LabTestItem } from '../data/peshawarData';

interface LabTestCardProps {
  test: LabTestItem;
  diagnosticCenter?: string;
  onViewDetails: (testName: string) => void;
}

export function LabTestCard({ test, diagnosticCenter, onViewDetails }: LabTestCardProps) {
  return (
    <article className="bg-white border border-[#D9E5E7] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between transition-all duration-150 hover:border-[#0C7773]/60 hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-[#647780] mb-2">
          <span>{test.category}</span>
          <span>Demo listing</span>
        </div>

        <h3 className="text-base sm:text-lg font-display font-semibold text-[#142F35] leading-snug">
          {test.name}
        </h3>
        <p className="mt-2 text-sm text-[#647780] leading-relaxed">
          {test.shortDescription}
        </p>

        <dl className="mt-4 pt-3.5 border-t border-[#D9E5E7]/70 space-y-2 text-xs sm:text-sm">
          {diagnosticCenter && (
            <div className="flex items-start justify-between gap-2">
              <dt className="text-[#647780] inline-flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#0C7773]" aria-hidden="true" />
                <span>Center</span>
              </dt>
              <dd className="font-medium text-[#142F35] text-right">{diagnosticCenter}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[#647780]">Estimated fee</dt>
            <dd className="font-semibold text-[#142F35] tabular-nums text-right">
              {test.sampleFeeRange}
            </dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={() => onViewDetails(test.name)}
        className="mt-5 w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EBF3FE] hover:bg-[#1565D8] active:bg-[#0B3F8E] text-[#1565D8] hover:text-white text-sm font-semibold rounded-[12px] transition-colors cursor-pointer"
      >
        <span>Book or view details</span>
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </article>
  );
}
