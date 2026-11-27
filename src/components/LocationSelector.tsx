import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { PESHAWAR_AREAS, type PeshawarArea } from '../data/peshawarData';

interface LocationSelectorProps {
  selectedArea: PeshawarArea;
  onAreaChange: (area: PeshawarArea) => void;
}

export function LocationSelector({ selectedArea, onAreaChange }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const locationDisplay =
    selectedArea === 'All Peshawar'
      ? 'Peshawar, Pakistan'
      : `${selectedArea}, Peshawar`;

  return (
    <div ref={wrapperRef} className="relative inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 font-medium text-[#142F35]">
        <MapPin className="w-4 h-4 text-[#0C7773] shrink-0" aria-hidden="true" />
        <span>{locationDisplay}</span>
      </span>

      <span className="text-[#D9E5E7]" aria-hidden="true">
        |
      </span>

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 font-medium text-[#0C7773] hover:text-[#095E5B] underline-offset-4 hover:underline py-1 min-h-[36px] cursor-pointer"
      >
        <span>Change location</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select Peshawar location"
          className="absolute left-0 top-full mt-2 w-72 bg-white border border-[#D9E5E7] rounded-[16px] shadow-lg p-2 z-30"
        >
          <div className="px-3 py-2 border-b border-[#D9E5E7] mb-1">
            <p className="text-xs font-semibold text-[#142F35]">
              Peshawar Service Areas
            </p>
            <p className="text-xs text-[#647780] mt-0.5">
              Currently serving Peshawar · More cities coming soon
            </p>
          </div>
          <ul className="max-h-60 overflow-y-auto space-y-0.5">
            {PESHAWAR_AREAS.map((area) => {
              const isSelected = selectedArea === area;
              return (
                <li key={area}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onAreaChange(area);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-[10px] text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#E1F3ED] text-[#0C7773] font-semibold'
                        : 'text-[#142F35] hover:bg-[#EAF5F5]'
                    }`}
                  >
                    <span>{area === 'All Peshawar' ? 'All Peshawar' : `${area}, Peshawar`}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#0C7773]" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
