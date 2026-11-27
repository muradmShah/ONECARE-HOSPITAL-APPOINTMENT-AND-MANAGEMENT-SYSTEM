import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { NavSection } from '../data/peshawarData';
import type { AuthUser } from '../lib/api';
import { BrandLogo } from './BrandLogo';

export type AppView = NavSection | 'portal';

interface NavbarProps {
  activeView: AppView;
  authUser: AuthUser | null;
  onNavigate: (view: AppView) => void;
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'medicines', label: 'Medicines' },
  { id: 'labs', label: 'Lab Tests' },
  { id: 'about', label: 'About' },
];

export function Navbar({ activeView, authUser, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (view: AppView) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const portalLabel = authUser ? 'My Portal' : 'Sign In';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#D9E5E7]">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-12 h-16 lg:h-20 flex items-center justify-between gap-6">
        {/* Zone 1: Brand mark & wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
          className="inline-flex items-center whitespace-nowrap shrink-0 focus-visible:rounded transition-opacity hover:opacity-90"
          aria-label="ONECARE Home"
        >
          <BrandLogo size="md" />
        </a>

        {/* Zone 2: Primary navigation links with active teal underline */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2.5 text-[15px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#0C7773]'
                    : 'text-[#647780] hover:text-[#142F35] active:text-[#0C7773]'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 bottom-0 h-[2.5px] rounded-full bg-[#0C7773] transition-opacity duration-150 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Modern CTA Sign In / My Portal button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick('portal')}
            className={`hidden sm:inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] text-sm font-semibold rounded-[12px] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'portal'
                ? 'bg-[#142F35] hover:bg-[#1E444D] active:bg-[#0C7773] text-white shadow-xs'
                : 'bg-[#1565D8] hover:bg-[#1052B5] active:bg-[#0B3F8E] text-white shadow-[0_4px_12px_rgba(21,101,216,0.24)] hover:shadow-[0_6px_16px_rgba(21,101,216,0.32)]'
            }`}
          >
            {portalLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-[12px] text-[#142F35] hover:bg-[#E1F3ED] hover:text-[#0C7773] active:bg-[#0C7773] active:text-white transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D9E5E7] bg-white px-5 pt-3 pb-5 shadow-sm">
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3.5 py-3 min-h-[44px] rounded-[12px] text-base font-medium transition-colors flex items-center ${
                    isActive
                      ? 'bg-[#E1F3ED] text-[#0C7773]'
                      : 'text-[#142F35] hover:bg-[#EAF5F5] active:bg-[#0C7773] active:text-white'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-3 border-t border-[#D9E5E7] mt-2">
              <button
                type="button"
                onClick={() => handleLinkClick('portal')}
                className="w-full min-h-[44px] py-3 px-4 text-sm font-semibold text-white bg-[#1565D8] hover:bg-[#1052B5] active:bg-[#0B3F8E] rounded-[12px] shadow-[0_4px_12px_rgba(21,101,216,0.24)] transition-all cursor-pointer"
              >
                {portalLabel}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
