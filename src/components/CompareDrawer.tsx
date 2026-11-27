import { useState } from 'react';
import { X, Scale, ArrowUpRight } from 'lucide-react';
import type { LiveDoctorProfile } from '../lib/api';
import { ResilientImage } from './ResilientImage';

interface CompareDrawerProps {
  doctors: LiveDoctorProfile[];
  onRemove: (doctorId: string) => void;
  onClearAll: () => void;
  onViewProfile: (doctor: LiveDoctorProfile) => void;
}

export function CompareDrawer({
  doctors,
  onRemove,
  onClearAll,
  onViewProfile,
}: CompareDrawerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (doctors.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-3xl bg-[#0F2429] text-white rounded-xl px-4 py-3 shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Scale className="w-4 h-4 text-[#7BD3CC] shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm truncate">
            <span className="font-medium tabular-nums">{doctors.length} of 3</span>{' '}
            <span className="text-white/80">
              {doctors.length === 1 ? 'doctor' : 'doctors'} selected for comparison
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearAll}
            className="px-2.5 py-1.5 rounded-md text-xs text-white/80 hover:bg-white/15 hover:text-white active:bg-[#0D6E6E] transition-colors whitespace-nowrap cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#0D6E6E] hover:bg-[#148888] active:bg-[#073E3E] text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Compare Side-by-Side
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2429]/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white border border-[#D8E5EC] rounded-xl w-full max-w-4xl max-h-[88vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-[#E2EAEF] px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <h2
                  id="compare-modal-title"
                  className="text-lg font-display font-semibold text-[#0F2429]"
                >
                  Compare Doctors
                </h2>
                <p className="text-xs text-[#6D828A]">
                  Side-by-side overview of specialty, location, consultation fee, and hours.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close comparison view"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#4A6068] hover:bg-[#EDF6F6] hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[540px]">
                <thead>
                  <tr className="border-b border-[#E2EAEF]">
                    <th className="py-3 pr-4 text-xs font-medium text-[#6D828A] w-36 align-top">
                      Criteria
                    </th>
                    {doctors.map((doc) => (
                      <th key={doc.id} className="py-3 px-4 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#EEF4F8] shrink-0">
                              <ResilientImage
                                src={doc.image}
                                alt={doc.name}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-display font-semibold text-[#0F2429] truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs font-normal text-[#6D828A] truncate">
                                {doc.specialtyName}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(doc.id)}
                            aria-label={`Remove ${doc.name} from comparison`}
                            className="p-1.5 rounded-md text-[#6D828A] hover:bg-[#FDF2F2] hover:text-[#9E2A2B] active:bg-[#9E2A2B] active:text-white transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F6] text-sm">
                  <tr>
                    <td className="py-3.5 pr-4 text-xs font-medium text-[#6D828A]">Fee</td>
                    {doctors.map((doc) => (
                      <td
                        key={doc.id}
                        className="py-3.5 px-4 font-display font-semibold text-[#0F2429] tabular-nums"
                      >
                        PKR {doc.feePkr.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-xs font-medium text-[#6D828A]">
                      Experience
                    </td>
                    {doctors.map((doc) => (
                      <td key={doc.id} className="py-3.5 px-4 text-[#0F2429] tabular-nums">
                        {doc.experienceYears} years
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-xs font-medium text-[#6D828A]">Area</td>
                    {doctors.map((doc) => (
                      <td key={doc.id} className="py-3.5 px-4 text-[#0F2429]">
                        <span className="block font-medium">{doc.area}</span>
                        <span className="text-xs text-[#6D828A]">{doc.clinicName}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-xs font-medium text-[#6D828A]">
                      Qualifications
                    </td>
                    {doctors.map((doc) => (
                      <td key={doc.id} className="py-3.5 px-4 text-xs text-[#4A6068]">
                        {doc.qualifications}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 text-xs font-medium text-[#6D828A]">Action</td>
                    {doctors.map((doc) => (
                      <td key={doc.id} className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setModalOpen(false);
                            onViewProfile(doc);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <span>Book Slot</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
