import { useEffect } from 'react';
import { X } from 'lucide-react';

export type InfoModalType = 'privacy' | 'terms' | 'faqs' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export function InfoModal({ type, onClose }: InfoModalProps) {
  useEffect(() => {
    if (!type) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [type, onClose]);

  if (!type) return null;

  const title =
    type === 'privacy'
      ? 'Privacy Policy'
      : type === 'faqs'
        ? 'Frequently Asked Questions'
        : 'Terms of Service';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142F35]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#D9E5E7] rounded-[16px] w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[#D9E5E7] px-6 py-4 flex items-center justify-between gap-4">
          <h2 id="info-modal-title" className="text-lg font-display font-semibold text-[#142F35]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-11 h-11 inline-flex items-center justify-center rounded-[12px] text-[#647780] hover:bg-[#E1F3ED] hover:text-[#0C7773] active:bg-[#0C7773] active:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-[#647780] leading-relaxed">
          {type === 'privacy' && (
            <>
              <p>
                ONECARE is designed around patient privacy from the first step. You can browse doctors, medicines, and diagnostic lab tests across Peshawar without sharing personal medical records.
              </p>
              <p>
                <strong className="text-[#142F35]">Private Visit Notes:</strong> Appointment visit notes recorded in the portal are visible strictly to the patient and the treating physician—never to clinic administrators.
              </p>
              <p>
                <strong className="text-[#142F35]">Data Handling:</strong> Contact requests and clinic inquiries are used solely to help coordinate onboarding or patient support.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                ONECARE is a healthcare discovery and clinic scheduling platform designed to help residents of Peshawar locate specialists, prescription pharmacies, and diagnostic laboratories.
              </p>
              <p>
                <strong className="text-[#142F35]">Not Medical Advice:</strong> Information presented here does not replace an in-person consultation with a licensed physician. Never start, stop, or alter prescribed medication without qualified medical guidance.
              </p>
              <p>
                <strong className="text-[#142F35]">Demonstration &amp; Clinic Data:</strong> Sample medicine catalogs, lab price estimates, and neighborhood facility directories are clearly labeled for demonstration unless verified through clinic onboarding.
              </p>
            </>
          )}

          {type === 'faqs' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-semibold text-[#142F35]">
                  How do I book a doctor appointment on ONECARE?
                </h3>
                <p className="mt-1">
                  Open any doctor profile via Doctors or search above, pick a date and open 30-minute clinic slot, and confirm your request. Slots lock immediately to prevent double bookings.
                </p>
              </div>
              <div>
                <h3 className="font-display font-semibold text-[#142F35]">
                  Which areas of Peshawar are currently covered?
                </h3>
                <p className="mt-1">
                  ONECARE covers Hayatabad, University Town, Dabgari Gardens, Saddar, Cantt, Gulbahar, and Warsak Road, with future expansion planned across Khyber Pakhtunkhwa.
                </p>
              </div>
              <div>
                <h3 className="font-display font-semibold text-[#142F35]">
                  Can I order medicines or diagnose conditions directly here?
                </h3>
                <p className="mt-1">
                  No. ONECARE helps you find verified information, nearby pharmacies, and lab test preparation details so you can act safely on a licensed doctor&apos;s guidance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
