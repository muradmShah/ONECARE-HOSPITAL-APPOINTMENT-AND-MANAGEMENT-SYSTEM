import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  SPECIALTIES,
  type NavSection,
  type PeshawarArea,
  type SearchScope,
} from './data/peshawarData';
import {
  authApi,
  doctorsApi,
  setInMemoryToken,
  type AuthUser,
  type ClinicClock,
  type LiveDoctorProfile,
} from './lib/api';
import { Navbar, type AppView } from './components/Navbar';
import { HomeView, type ConsultationType } from './components/HomeView';
import { DoctorsView } from './components/DoctorsView';
import { MedicinesView } from './components/MedicinesView';
import { LabTestsView } from './components/LabTestsView';
import { AboutView } from './components/AboutView';
import { PortalView } from './components/PortalView';
import { Footer } from './components/Footer';
import { DoctorDetailModal } from './components/DoctorDetailModal';
import { CompareDrawer } from './components/CompareDrawer';
import { InfoModal, type InfoModalType } from './components/InfoModal';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedArea, setSelectedArea] = useState<PeshawarArea>('All Peshawar');

  // Shared discovery state
  const [doctorQuery, setDoctorQuery] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('all');
  const [consultationType, setConsultationType] = useState<ConsultationType | 'all'>('all');
  const [medicineQuery, setMedicineQuery] = useState('');
  const [labQuery, setLabQuery] = useState('');

  // Live clinic backend state
  const [liveDoctors, setLiveDoctors] = useState<LiveDoctorProfile[]>([]);
  const [clinicClock, setClinicClock] = useState<ClinicClock | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const [inviteToken, setInviteToken] = useState('');

  // Interactive modal & compare state
  const [activeDoctor, setActiveDoctor] = useState<LiveDoctorProfile | null>(null);
  const [comparedDoctorIds, setComparedDoctorIds] = useState<string[]>([]);
  const [policyModal, setPolicyModal] = useState<InfoModalType>(null);

  const refreshDoctors = useCallback(async () => {
    try {
      const res = await doctorsApi.list();
      setLiveDoctors(res.doctors);
      setClinicClock(res.clock);
    } catch {
      // ignore transient network errors on initial mount
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await authApi.me();
      setAuthUser(res.user);
      setClinicClock(res.clock);
      setNeedsAdminSetup(res.needsAdminSetup);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('inviteToken');
    if (tokenParam) {
      setInviteToken(tokenParam);
      setActiveView('portal');
    }
    void refreshSession();
    void refreshDoctors();
  }, [refreshSession, refreshDoctors]);

  const comparedDoctors = useMemo(
    () => liveDoctors.filter((d) => comparedDoctorIds.includes(d.id)),
    [liveDoctors, comparedDoctorIds]
  );

  const navigateTo = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExecuteSearch = (
    query: string,
    scope: SearchScope,
    area: PeshawarArea
  ) => {
    setSelectedArea(area);
    const lower = query.toLowerCase();

    if (scope === 'medicines') {
      setMedicineQuery(query);
      navigateTo('medicines');
      return;
    }

    if (scope === 'labs') {
      setLabQuery(query);
      navigateTo('labs');
      return;
    }

    if (scope === 'all' && lower) {
      const looksLikeLab = [
        'cbc',
        'lipid',
        'hba1c',
        'thyroid',
        'vitamin d',
        'ecg',
        'blood',
        'sugar',
        'lab',
        'test',
        'diagnostic',
        'cholesterol',
      ].some((kw) => lower.includes(kw));
      const looksLikeMed = [
        'paracetamol',
        'amlodipine',
        'cetirizine',
        'metformin',
        'gel',
        'medicine',
        'tablet',
        'pharmacy',
        'vitamin',
        'iron',
      ].some((kw) => lower.includes(kw));

      if (looksLikeLab) {
        setLabQuery(lower.includes('blood sugar') ? 'HbA1c' : query);
        navigateTo('labs');
        return;
      }
      if (looksLikeMed) {
        setMedicineQuery(query);
        navigateTo('medicines');
        return;
      }
    }

    const specialtyAlias: Record<string, string> = {
      cardiologist: 'cardiology',
      heart: 'cardiology',
      dermatologist: 'dermatology',
      skin: 'dermatology',
      'child specialist': 'pediatrics',
      pediatrician: 'pediatrics',
      child: 'pediatrics',
      orthopedic: 'orthopedics',
      bone: 'orthopedics',
      neurologist: 'neurology',
      migraine: 'neurology',
      physician: 'general-physician',
      gynecologist: 'gynecology',
      dentist: 'dentistry',
    };

    const aliasId = Object.entries(specialtyAlias).find(([key]) =>
      lower.includes(key)
    )?.[1];

    const matchedSpecialty =
      SPECIALTIES.find(
        (s) => s.name.toLowerCase() === lower || s.id === lower
      ) || (aliasId ? SPECIALTIES.find((s) => s.id === aliasId) : undefined);

    if (matchedSpecialty) {
      setSelectedSpecialtyId(matchedSpecialty.id);
      setDoctorQuery('');
    } else {
      setSelectedSpecialtyId('all');
      setDoctorQuery(query);
    }

    navigateTo('doctors');
  };

  const handleSelectSpecialty = (specialtyId: string) => {
    setSelectedSpecialtyId(specialtyId);
    setDoctorQuery('');
    navigateTo('doctors');
  };

  const handleFindDoctorBySpecialtyName = (specialtyName: string) => {
    const matched = SPECIALTIES.find(
      (s) => s.name.toLowerCase() === specialtyName.toLowerCase()
    );
    if (matched) {
      setSelectedSpecialtyId(matched.id);
      setDoctorQuery('');
    } else {
      setSelectedSpecialtyId('all');
      setDoctorQuery(specialtyName);
    }
    navigateTo('doctors');
  };

  const handleToggleCompare = (doctorId: string) => {
    setComparedDoctorIds((prev) => {
      if (prev.includes(doctorId)) {
        return prev.filter((id) => id !== doctorId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), doctorId];
      }
      return [...prev, doctorId];
    });
  };

  const handleAuthenticated = (user: AuthUser) => {
    setAuthUser(user);
    void refreshSession();
    void refreshDoctors();
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setInMemoryToken(null);
    setAuthUser(null);
    void refreshSession();
  };

  const handleOpenInviteTokenAsFreshSession = async (token: string) => {
    await handleLogout();
    setInviteToken(token);
    setActiveView('portal');
  };

  const clearInviteToken = () => {
    setInviteToken('');
    if (window.location.search.includes('inviteToken=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF5F5] text-[#142F35]">
      <Navbar
        activeView={activeView}
        authUser={authUser}
        onNavigate={navigateTo}
      />

      <main className="flex-1">
        {activeView === 'home' && (
          <HomeView
            doctors={liveDoctors}
            selectedArea={selectedArea}
            onAreaChange={setSelectedArea}
            comparedDoctorIds={comparedDoctorIds}
            onToggleCompare={handleToggleCompare}
            selectedConsultationType={consultationType}
            onConsultationNext={(type) => {
              setConsultationType(type);
              navigateTo('doctors');
            }}
            onNavigate={navigateTo}
            onExecuteSearch={handleExecuteSearch}
            onSelectSpecialty={handleSelectSpecialty}
            onViewDoctor={setActiveDoctor}
          />
        )}

        {activeView === 'doctors' && (
          <DoctorsView
            doctors={liveDoctors}
            searchQuery={doctorQuery}
            onSearchQueryChange={setDoctorQuery}
            selectedArea={selectedArea}
            onAreaChange={setSelectedArea}
            selectedSpecialtyId={selectedSpecialtyId}
            onSpecialtyChange={setSelectedSpecialtyId}
            consultationType={consultationType}
            onConsultationTypeChange={setConsultationType}
            comparedDoctorIds={comparedDoctorIds}
            onToggleCompare={handleToggleCompare}
            onViewDoctor={setActiveDoctor}
          />
        )}

        {activeView === 'medicines' && (
          <MedicinesView
            searchQuery={medicineQuery}
            onSearchQueryChange={setMedicineQuery}
            selectedArea={selectedArea}
            onAreaChange={setSelectedArea}
            onFindDoctorForSpecialty={handleFindDoctorBySpecialtyName}
          />
        )}

        {activeView === 'labs' && (
          <LabTestsView
            searchQuery={labQuery}
            onSearchQueryChange={setLabQuery}
            selectedArea={selectedArea}
            onAreaChange={setSelectedArea}
            onFindDoctorForSpecialty={handleFindDoctorBySpecialtyName}
          />
        )}

        {activeView === 'about' && <AboutView />}

        {activeView === 'portal' && (
          <PortalView
            user={authUser}
            clock={clinicClock}
            needsAdminSetup={needsAdminSetup}
            initialInviteToken={inviteToken}
            onAuthenticated={handleAuthenticated}
            onLogout={() => void handleLogout()}
            onClearInviteToken={clearInviteToken}
            onBrowseDoctors={() => navigateTo('doctors')}
            onOpenInviteTokenAsFreshSession={(t) =>
              void handleOpenInviteTokenAsFreshSession(t)
            }
            onDoctorsMutated={() => void refreshDoctors()}
          />
        )}
      </main>

      <Footer
        onNavigate={(s: NavSection) => navigateTo(s)}
        onOpenPolicy={setPolicyModal}
      />

      <DoctorDetailModal
        doctor={activeDoctor}
        authUser={authUser}
        clock={clinicClock}
        onClose={() => setActiveDoctor(null)}
        onGoToPortal={() => navigateTo('portal')}
        onExploreMedicines={(specialtyQuery) => {
          setMedicineQuery(specialtyQuery);
          navigateTo('medicines');
        }}
        onExploreLabs={(specialtyQuery) => {
          setLabQuery(specialtyQuery);
          navigateTo('labs');
        }}
      />

      <CompareDrawer
        doctors={comparedDoctors}
        onRemove={(id) =>
          setComparedDoctorIds((prev) => prev.filter((item) => item !== id))
        }
        onClearAll={() => setComparedDoctorIds([])}
        onViewProfile={setActiveDoctor}
      />

      <InfoModal type={policyModal} onClose={() => setPolicyModal(null)} />
    </div>
  );
}
