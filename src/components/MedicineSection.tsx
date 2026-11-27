import { useState, useMemo } from 'react';
import { Search, Info, ArrowRight } from 'lucide-react';
import { SAMPLE_MEDICINES, type PeshawarArea } from '../data/peshawarData';

interface MedicineSectionProps {
  selectedArea: PeshawarArea;
  onExploreMedicines: (query: string) => void;
}

export function MedicineSection({ selectedArea, onExploreMedicines }: MedicineSectionProps) {
  const [medQuery, setMedQuery] = useState('');

  const filtered = useMemo(() => {
    const q = medQuery.trim().toLowerCase();
    return SAMPLE_MEDICINES.filter((med) => {
      const areaOk = selectedArea === 'All Peshawar' || med.availableAreas.includes(selectedArea);
      const qOk =
        !q ||
        med.genericName.toLowerCase().includes(q) ||
        med.commonClass.toLowerCase().includes(q) ||
        med.typicalUseContext.toLowerCase().includes(q);
      return areaOk && qOk;
    }).slice(0, 3);
  }, [medQuery, selectedArea]);

  return (
    <section
      aria-labelledby="medicine-finder-heading"
      className="bg-white border-b border-[#D9E5E7]"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-12 py-12 sm:py-16 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2
              id="medicine-finder-heading"
              className="text-2xl sm:text-3xl font-display font-bold text-[#142F35] tracking-tight"
            >
              Medicine Finder
            </h2>
            <p className="mt-2 text-base text-[#647780] leading-relaxed">
              Search common medicine classes, check basic usage context, and see demo pharmacy availability in Peshawar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search
                className="w-4 h-4 text-[#647780] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={medQuery}
                onChange={(e) => setMedQuery(e.target.value)}
                placeholder="Search medicine name (e.g., Paracetamol)"
                aria-label="Search medicines"
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm bg-[#EAF5F5]/50 border border-[#D9E5E7] rounded-[14px] text-[#142F35] placeholder:text-[#647780] focus:bg-white focus:border-[#0C7773] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => onExploreMedicines(medQuery.trim())}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#1565D8] hover:bg-[#1052B5] active:bg-[#0B3F8E] text-white text-sm font-semibold rounded-[12px] shadow-[0_4px_12px_rgba(21,101,216,0.22)] hover:shadow-[0_6px_16px_rgba(21,101,216,0.3)] transition-all whitespace-nowrap cursor-pointer"
            >
              <span>Explore Medicines</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Clear Pharmacist / Doctor Consultation Disclaimer */}
        <div className="bg-[#EAF5F5] border border-[#D9E5E7] rounded-[16px] p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#0C7773] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-[#142F35] leading-relaxed">
            <span className="font-semibold">Consult a qualified doctor or pharmacist:</span> Medicine information shown below is for educational demonstration only. Always verify dosage and suitability with a licensed healthcare professional before taking any medicine.
          </p>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((med) => (
              <article
                key={med.id}
                className="bg-white border border-[#D9E5E7] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#647780] mb-2">
                    <span>{med.commonClass}</span>
                    <span>Demo catalog</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-display font-semibold text-[#142F35] leading-snug">
                    {med.genericName}
                  </h3>
                  <p className="mt-2 text-sm text-[#647780] leading-relaxed">
                    {med.typicalUseContext}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#D9E5E7]/70 space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#647780]">Status</span>
                    <span className="font-medium text-[#142F35]">{med.prescriptionStatus}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#647780]">Demo availability</span>
                    <span className="font-medium text-[#0C7773] text-right">
                      {med.availableAreas.slice(0, 2).join(', ')}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-[#EAF5F5]/60 border border-[#D9E5E7] rounded-[16px] p-8 text-center">
            <p className="text-base font-medium text-[#142F35]">
              No sample medicines match &ldquo;{medQuery}&rdquo; in {selectedArea}.
            </p>
            <button
              type="button"
              onClick={() => setMedQuery('')}
              className="mt-3 px-4 py-2 min-h-[44px] text-sm font-semibold text-[#0C7773] bg-white border border-[#D9E5E7] rounded-[12px] hover:bg-[#E1F3ED] transition-colors cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
