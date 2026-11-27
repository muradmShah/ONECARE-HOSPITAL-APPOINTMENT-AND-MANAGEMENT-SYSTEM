import type { NavSection } from '../data/peshawarData';
import type { InfoModalType } from './InfoModal';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onNavigate: (section: NavSection) => void;
  onOpenPolicy: (type: InfoModalType) => void;
}

export function Footer({ onNavigate, onOpenPolicy }: FooterProps) {
  const handleNav = (section: NavSection) => {
    onNavigate(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-[#D9E5E7]">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-12 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#647780]">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
          <BrandLogo size="sm" />
          <span>·</span>
          <span>Peshawar, Pakistan · Visit an emergency room for urgent care.</span>
        </div>

        <nav aria-label="Footer links" className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {[
            { label: 'Doctors', action: () => handleNav('doctors') },
            { label: 'Medicines', action: () => handleNav('medicines') },
            { label: 'Lab Tests', action: () => handleNav('labs') },
            { label: 'About', action: () => handleNav('about') },
            { label: 'Contact', action: () => handleNav('about') },
            { label: 'FAQs', action: () => onOpenPolicy('faqs') },
            { label: 'Privacy Policy', action: () => onOpenPolicy('privacy') },
            { label: 'Terms of Service', action: () => onOpenPolicy('terms') },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="px-2.5 py-1.5 rounded-[8px] text-[#647780] hover:bg-[#E1F3ED] hover:text-[#0C7773] transition-colors cursor-pointer whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
}
