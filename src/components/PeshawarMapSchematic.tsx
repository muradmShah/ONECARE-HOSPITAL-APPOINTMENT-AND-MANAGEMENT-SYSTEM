import { MapPin } from 'lucide-react';
import type { LocalFacility } from '../data/peshawarData';

interface PeshawarMapSchematicProps {
  facilities: LocalFacility[];
  selectedFacilityId: string | null;
  onSelectFacility: (facility: LocalFacility) => void;
}

const NEIGHBORHOOD_LABELS = [
  { name: 'Hayatabad', x: 18, y: 74 },
  { name: 'University Town', x: 35, y: 37 },
  { name: 'Warsak Road', x: 47, y: 17 },
  { name: 'Cantt', x: 52, y: 66 },
  { name: 'Saddar', x: 60, y: 56 },
  { name: 'Dabgari Gardens', x: 68, y: 33 },
  { name: 'Gulbahar', x: 82, y: 56 },
];

export function PeshawarMapSchematic({
  facilities,
  selectedFacilityId,
  onSelectFacility,
}: PeshawarMapSchematicProps) {
  return (
    <div className="bg-[#EEF4F7] border border-[#D8E5EC] rounded-xl overflow-hidden flex flex-col h-full min-h-[340px]">
      {/* Map Header Bar */}
      <div className="px-4 py-3 bg-white border-b border-[#E2EAEF] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-display font-semibold text-[#0F2429] truncate">
            Peshawar Care Corridors
          </p>
          <p className="text-xs text-[#6D828A] truncate">
            Schematic map placeholder · Live mapping pending integration
          </p>
        </div>
        <span className="text-xs text-[#4A6068] tabular-nums whitespace-nowrap shrink-0">
          {facilities.length} sample {facilities.length === 1 ? 'listing' : 'listings'}
        </span>
      </div>

      {/* Interactive SVG Schematic Canvas */}
      <div className="relative flex-1 w-full min-h-[280px] select-none overflow-hidden">
        <svg
          viewBox="0 0 100 84"
          className="w-full h-full object-cover"
          role="img"
          aria-label="Schematic map of healthcare areas across Peshawar including Hayatabad, University Town, Saddar, Cantt, Dabgari Gardens, and Gulbahar"
        >
          {/* Subtle Architectural Grid */}
          <defs>
            <pattern id="peshawarGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#DCE7ED"
                strokeWidth="0.35"
              />
            </pattern>
          </defs>
          <rect width="100" height="84" fill="#F2F7F9" />
          <rect width="100" height="84" fill="url(#peshawarGrid)" />

          {/* Main Arterial Road Schematic: Jamrud Road -> University Rd -> GT Road */}
          <path
            d="M 6 68 Q 22 60, 36 49 T 62 45 T 94 46"
            fill="none"
            stroke="#CBDCE4"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Warsak Road Corridor */}
          <path
            d="M 46 8 Q 48 28, 53 46"
            fill="none"
            stroke="#D6E4EB"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Ring Road South Loop */}
          <path
            d="M 14 78 Q 45 81, 86 68"
            fill="none"
            stroke="#D6E4EB"
            strokeWidth="1.6"
            strokeDasharray="2 1.5"
            strokeLinecap="round"
          />

          {/* Road Labels */}
          <text x="20" y="54" fontSize="2.3" fill="#7B939C" fontFamily="DM Sans, sans-serif">
            Jamrud / University Rd
          </text>
          <text x="72" y="42" fontSize="2.3" fill="#7B939C" fontFamily="DM Sans, sans-serif">
            GT Road
          </text>
          <text x="48" y="77" fontSize="2.3" fill="#7B939C" fontFamily="DM Sans, sans-serif">
            Ring Road
          </text>

          {/* Neighborhood Anchor Labels */}
          {NEIGHBORHOOD_LABELS.map((area) => (
            <text
              key={area.name}
              x={area.x}
              y={area.y}
              textAnchor="middle"
              fontSize="2.7"
              fontWeight="600"
              fill="#4A6068"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {area.name}
            </text>
          ))}
        </svg>

        {/* Interactive Facility Pins Overlay */}
        {facilities.map((facility) => {
          const isSelected = selectedFacilityId === facility.id;
          return (
            <button
              key={facility.id}
              type="button"
              onClick={() => onSelectFacility(facility)}
              style={{
                left: `${facility.mapCoords.x}%`,
                top: `${(facility.mapCoords.y / 84) * 100}%`,
              }}
              aria-label={`Select ${facility.name} in ${facility.area}`}
              aria-pressed={isSelected}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0D6E6E] ${
                isSelected
                  ? 'w-9 h-9 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white shadow-md scale-110 z-20'
                  : 'w-7 h-7 bg-white text-[#0D6E6E] border border-[#0D6E6E]/50 hover:scale-110 hover:bg-[#0D6E6E] hover:text-white hover:border-[#0D6E6E] active:bg-[#073E3E] active:text-white shadow-xs z-10'
              }`}
            >
              <MapPin className={isSelected ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </button>
          );
        })}
      </div>

      {/* Selected Pin Summary Footer */}
      <div className="px-4 py-3 bg-white border-t border-[#E2EAEF] text-xs text-[#4A6068]">
        {selectedFacilityId ? (
          (() => {
            const active = facilities.find((f) => f.id === selectedFacilityId);
            if (!active) return 'Select any marker on the map to inspect a local sample facility.';
            return (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-[#0F2429]">{active.name}</span>
                <span className="text-[#6D828A] tabular-nums">
                  {active.area} · ~{active.distanceKm.toFixed(1)} km (Sample)
                </span>
              </div>
            );
          })()
        ) : (
          <span>Select a marker above to highlight its clinic details in the list.</span>
        )}
      </div>
    </div>
  );
}
