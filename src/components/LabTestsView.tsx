import { useMemo, useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Clock,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  PESHAWAR_AREAS,
  SAMPLE_FACILITIES,
  SAMPLE_LAB_TESTS,
  type PeshawarArea,
} from '../data/peshawarData';

interface LabTestsViewProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedArea: PeshawarArea;
  onAreaChange: (area: PeshawarArea) => void;
  onFindDoctorForSpecialty: (specialtyName: string) => void;
}

const ITEMS_PER_PAGE = 2;

export function LabTestsView({
  searchQuery,
  onSearchQueryChange,
  selectedArea,
  onAreaChange,
  onFindDoctorForSpecialty,
}: LabTestsViewProps) {
  const [page, setPage] = useState(1);

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SAMPLE_LAB_TESTS.filter((test) => {
      const areaMatch =
        selectedArea === 'All Peshawar' || test.availableAreas.includes(selectedArea);
      const queryMatch =
        !q ||
        test.name.toLowerCase().includes(q) ||
        test.category.toLowerCase().includes(q) ||
        test.shortDescription.toLowerCase().includes(q) ||
        test.relatedSpecialty.toLowerCase().includes(q);
      return areaMatch && queryMatch;
    });
  }, [searchQuery, selectedArea]);

  const totalPages = Math.max(1, Math.ceil(filteredTests.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedArea]);

  const safePage = Math.min(page, totalPages);
  const pagedTests = filteredTests.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const nearbyLabs = useMemo(() => {
    return SAMPLE_FACILITIES.filter(
      (f) =>
        f.category === 'labs' &&
        (selectedArea === 'All Peshawar' || f.area === selectedArea)
    ).slice(0, 2);
  }, [selectedArea]);

  const handleReset = () => {
    onSearchQueryChange('');
    onAreaChange('All Peshawar');
    setPage(1);
  };

  return (
    <section
      aria-label="Lab Tests and Diagnostic Laboratories"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6 min-h-[calc(100vh-7.5rem)] flex flex-col justify-center"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0F2429] tracking-tight">
            Find Lab Tests &amp; Diagnostics
          </h1>
          <p className="mt-1 text-sm text-[#4A6068]">
            Check test preparation, expected report times, and nearby diagnostic labs on one screen.
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

      {/* Simple Single-Row Search & Area Filter */}
      <div className="bg-white border border-[#E2EAEF] rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full flex items-center">
          <Search
            className="w-4 h-4 text-[#6D828A] absolute left-3 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search CBC, Lipid Profile, HbA1c, Thyroid, Vitamin D..."
            aria-label="Search lab tests"
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] placeholder:text-[#6D828A] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
          />
        </div>

        <select
          value={selectedArea}
          onChange={(e) => onAreaChange(e.target.value as PeshawarArea)}
          aria-label="Filter laboratories by Peshawar area"
          className="w-full sm:w-52 px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none cursor-pointer"
        >
          {PESHAWAR_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        {(searchQuery || selectedArea !== 'All Peshawar') && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-[#0D6E6E] hover:bg-[#EDF6F6] active:bg-[#0D6E6E] active:text-white transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Split: 2 Lab Tests + Nearby Diagnostic Labs on One Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8">
          {pagedTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
              {pagedTests.map((test) => (
                <article
                  key={test.id}
                  className="bg-white border border-[#E2EAEF] rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs text-[#6D828A] mb-1.5">{test.category}</div>
                    <h2 className="text-base font-display font-semibold text-[#0F2429] leading-snug">
                      {test.name}
                    </h2>
                    <p className="mt-2 text-sm text-[#4A6068] leading-relaxed">
                      {test.shortDescription}
                    </p>

                    <dl className="mt-4 pt-3 border-t border-[#EEF3F6] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[#6D828A]">Preparation</dt>
                        <dd className="font-medium text-[#0F2429] text-right">
                          {test.preparation}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[#6D828A]">Turnaround</dt>
                        <dd className="font-medium text-[#0F2429] text-right">
                          {test.turnaroundTime}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[#6D828A]">Indicative fee</dt>
                        <dd className="font-semibold text-[#0F2429] tabular-nums text-right">
                          {test.sampleFeeRange}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EEF3F6]">
                    <button
                      type="button"
                      onClick={() => onFindDoctorForSpecialty(test.relatedSpecialty)}
                      className="w-full inline-flex items-center justify-between gap-1.5 px-3.5 py-2 rounded-lg bg-[#F8FAFB] border border-[#E2EAEF] text-xs font-medium text-[#0D6E6E] hover:bg-[#0D6E6E] hover:border-[#0D6E6E] hover:text-white active:bg-[#073E3E] transition-colors cursor-pointer"
                    >
                      <span>Find {test.relatedSpecialty} to review results</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2EAEF] rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
              <p className="text-base font-display font-semibold text-[#0F2429]">
                No lab tests match your filters
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D6E6E] text-white text-sm font-medium rounded-lg hover:bg-[#0A5858] active:bg-[#073E3E] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 bg-white border border-[#E2EAEF] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-display font-semibold text-[#0F2429]">
              Diagnostic Laboratories
            </h2>
            <p className="text-xs text-[#6D828A] mt-0.5">{selectedArea}</p>

            <div className="mt-3.5 space-y-3">
              {nearbyLabs.length > 0 ? (
                nearbyLabs.map((lab) => (
                  <div
                    key={lab.id}
                    className="p-3.5 rounded-lg bg-[#F8FAFB] border border-[#E2EAEF]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#0F2429]">{lab.name}</h3>
                      <span className="text-xs font-medium text-[#0D6E6E] tabular-nums shrink-0">
                        ~{lab.distanceKm.toFixed(1)} km
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#4A6068] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#6D828A] shrink-0" />
                      <span>
                        {lab.landmark}, {lab.area}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#6D828A] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#6D828A] shrink-0" />
                      <span>{lab.hours}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-[#F8FAFB] border border-[#E2EAEF] text-xs text-[#4A6068]">
                  No sample labs listed in {selectedArea}.{' '}
                  <button
                    type="button"
                    onClick={() => onAreaChange('All Peshawar')}
                    className="text-[#0D6E6E] font-medium hover:underline cursor-pointer"
                  >
                    Show All Peshawar
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 pt-3 border-t border-[#EEF3F6] text-xs text-[#6D828A]">
            Results should always be reviewed by a qualified physician.
          </p>
        </aside>
      </div>
    </section>
  );
}
