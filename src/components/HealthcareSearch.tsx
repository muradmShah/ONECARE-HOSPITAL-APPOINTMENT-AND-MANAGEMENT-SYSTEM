import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';
import {
  SAMPLE_LAB_TESTS,
  SAMPLE_MEDICINES,
  SPECIALTIES,
  type PeshawarArea,
  type SearchScope,
} from '../data/peshawarData';
import type { LiveDoctorProfile } from '../lib/api';

interface HealthcareSearchProps {
  doctors: LiveDoctorProfile[];
  selectedArea: PeshawarArea;
  onExecuteSearch: (query: string, scope: SearchScope, area: PeshawarArea) => void;
  onSelectDoctor: (doctorId: string) => void;
  onSelectSpecialty: (specialtyId: string) => void;
}

interface SearchSuggestion {
  id: string;
  label: string;
  category: string;
  meta: string;
  type: 'doctor' | 'specialty' | 'medicine' | 'lab';
  rawId: string;
  searchQuery?: string;
}

const EXAMPLE_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: 'ex-cardio',
    label: 'Cardiologist',
    category: 'Specialty',
    meta: 'Heart & blood pressure specialists',
    type: 'specialty',
    rawId: 'cardiology',
  },
  {
    id: 'ex-derm',
    label: 'Dermatologist',
    category: 'Specialty',
    meta: 'Skin, hair, and allergy care',
    type: 'specialty',
    rawId: 'dermatology',
  },
  {
    id: 'ex-peds',
    label: 'Child specialist',
    category: 'Specialty',
    meta: 'Pediatrics & child wellness',
    type: 'specialty',
    rawId: 'pediatrics',
  },
  {
    id: 'ex-cbc',
    label: 'CBC test',
    category: 'Lab Test · Demo',
    meta: 'Complete Blood Count · Peshawar labs',
    type: 'lab',
    rawId: 'lab-1',
    searchQuery: 'CBC',
  },
  {
    id: 'ex-sugar',
    label: 'Blood sugar test',
    category: 'Lab Test · Demo',
    meta: 'HbA1c diabetes monitoring panel',
    type: 'lab',
    rawId: 'lab-3',
    searchQuery: 'HbA1c',
  },
  {
    id: 'ex-para',
    label: 'Paracetamol',
    category: 'Medicine · Demo',
    meta: 'Analgesic & fever relief info',
    type: 'medicine',
    rawId: 'med-1',
    searchQuery: 'Paracetamol',
  },
];

export function HealthcareSearch({
  doctors,
  selectedArea,
  onExecuteSearch,
  onSelectDoctor,
  onSelectSpecialty,
}: HealthcareSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return EXAMPLE_SUGGESTIONS;

    const results: SearchSuggestion[] = [];

    EXAMPLE_SUGGESTIONS.forEach((ex) => {
      if (ex.label.toLowerCase().includes(trimmed)) {
        results.push(ex);
      }
    });

    SPECIALTIES.forEach((spec) => {
      const matchesName = spec.name.toLowerCase().includes(trimmed);
      const matchesCond = spec.commonConditions.some((c) => c.toLowerCase().includes(trimmed));
      if (matchesName || matchesCond) {
        if (!results.some((r) => r.type === 'specialty' && r.rawId === spec.id)) {
          results.push({
            id: `spec-${spec.id}`,
            label: spec.name,
            category: 'Specialty',
            meta: spec.commonConditions.slice(0, 2).join(', '),
            type: 'specialty',
            rawId: spec.id,
          });
        }
      }
    });

    doctors.forEach((doc) => {
      const textMatch =
        doc.name.toLowerCase().includes(trimmed) ||
        doc.specialtyName.toLowerCase().includes(trimmed) ||
        doc.area.toLowerCase().includes(trimmed) ||
        doc.focusAreas.some((f) => f.toLowerCase().includes(trimmed));
      if (textMatch) {
        results.push({
          id: `doc-${doc.id}`,
          label: doc.name,
          category: 'Doctor',
          meta: `${doc.specialtyName} · ${doc.area}`,
          type: 'doctor',
          rawId: doc.id,
        });
      }
    });

    SAMPLE_MEDICINES.forEach((med) => {
      const textMatch =
        med.genericName.toLowerCase().includes(trimmed) ||
        med.commonClass.toLowerCase().includes(trimmed) ||
        med.typicalUseContext.toLowerCase().includes(trimmed);
      if (textMatch) {
        results.push({
          id: `med-${med.id}`,
          label: med.genericName,
          category: 'Medicine · Demo',
          meta: med.prescriptionStatus,
          type: 'medicine',
          rawId: med.id,
          searchQuery: med.genericName.split(' ')[0],
        });
      }
    });

    SAMPLE_LAB_TESTS.forEach((lab) => {
      const textMatch =
        lab.name.toLowerCase().includes(trimmed) ||
        lab.category.toLowerCase().includes(trimmed) ||
        lab.shortDescription.toLowerCase().includes(trimmed);
      if (textMatch) {
        results.push({
          id: `lab-${lab.id}`,
          label: lab.name,
          category: 'Lab Test · Demo',
          meta: lab.preparation,
          type: 'lab',
          rawId: lab.id,
          searchQuery: lab.name.split(' ')[0],
        });
      }
    });

    return results.slice(0, 6);
  }, [query, doctors]);

  const selectItem = (item: SearchSuggestion) => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (item.type === 'doctor') {
      onSelectDoctor(item.rawId);
    } else if (item.type === 'specialty') {
      onSelectSpecialty(item.rawId);
    } else if (item.type === 'medicine') {
      onExecuteSearch(item.searchQuery || item.label, 'medicines', selectedArea);
    } else {
      onExecuteSearch(item.searchQuery || item.label, 'labs', selectedArea);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
      selectItem(suggestions[activeIndex]);
      return;
    }
    setIsOpen(false);
    onExecuteSearch(query.trim(), 'all', selectedArea);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search doctors, medicines, or lab tests"
        className="bg-white border border-[#D9E5E7] rounded-[16px] p-2 lg:h-[72px] shadow-sm focus-within:border-[#0C7773] focus-within:ring-3 focus-within:ring-[#0C7773]/15 transition-all flex items-center"
      >
        <div className="flex w-full items-center gap-2">
          <div className="relative flex-1 flex items-center min-w-0">
            <Search
              className="w-5 h-5 text-[#647780] ml-3 shrink-0"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setActiveIndex(-1);
              }}
              placeholder="Search doctor, medicine, or lab test"
              aria-label="Search doctor, medicine, or lab test"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="healthcare-search-listbox"
              className="w-full py-2.5 px-3 text-sm sm:text-base text-[#142F35] placeholder:text-[#647780] bg-transparent border-0 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveIndex(-1);
                  setIsOpen(true);
                }}
                aria-label="Clear search"
                className="w-10 h-10 inline-flex items-center justify-center rounded-[10px] text-[#647780] hover:bg-[#E1F3ED] hover:text-[#0C7773] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 min-h-[48px] lg:h-[54px] bg-[#1565D8] hover:bg-[#1052B5] active:bg-[#0B3F8E] text-white text-sm sm:text-base font-semibold rounded-[12px] shadow-[0_4px_12px_rgba(21,101,216,0.24)] hover:shadow-[0_6px_16px_rgba(21,101,216,0.32)] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {isOpen && (
        <div
          id="healthcare-search-listbox"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#D9E5E7] rounded-[16px] shadow-lg overflow-hidden z-30"
        >
          <div className="px-4 py-2 bg-[#EAF5F5]/65 border-b border-[#D9E5E7] flex items-center justify-between text-xs text-[#647780]">
            <span>
              {query.trim() ? 'Matching healthcare options' : 'Popular search examples'}
            </span>
            <span>Demo &amp; live clinic data</span>
          </div>

          {suggestions.length > 0 ? (
            <ul className="divide-y divide-[#D9E5E7]/60">
              {suggestions.map((item, idx) => {
                const isHighlighted = idx === activeIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectItem(item)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                        isHighlighted ? 'bg-[#E1F3ED]' : 'hover:bg-[#EAF5F5]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#142F35] truncate">
                          {item.label}
                        </p>
                        <p className="text-xs text-[#647780] truncate mt-0.5">
                          {item.meta}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-[#0C7773] whitespace-nowrap shrink-0">
                        {item.category}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-4 text-sm text-[#647780]">
              No exact match for &ldquo;{query}&rdquo;. Press Search to browse doctors in Peshawar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
