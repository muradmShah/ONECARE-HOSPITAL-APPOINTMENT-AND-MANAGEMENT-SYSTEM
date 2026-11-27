import { LogOut, Clock } from 'lucide-react';
import type { AuthUser, ClinicClock } from '../lib/api';
import { AuthPanel } from './AuthPanel';
import { PatientDashboard } from './PatientDashboard';
import { DoctorDashboard } from './DoctorDashboard';
import { AdminDashboard } from './AdminDashboard';

interface PortalViewProps {
  user: AuthUser | null;
  clock: ClinicClock | null;
  needsAdminSetup: boolean;
  initialInviteToken: string;
  onAuthenticated: (user: AuthUser) => void;
  onLogout: () => void;
  onClearInviteToken: () => void;
  onBrowseDoctors: () => void;
  onOpenInviteTokenAsFreshSession: (token: string) => void;
  onDoctorsMutated: () => void;
}

const ROLE_LABEL: Record<AuthUser['role'], string> = {
  patient: 'Patient Portal',
  doctor: 'Doctor Portal',
  admin: 'Clinic Manager Dashboard',
};

export function PortalView({
  user,
  clock,
  needsAdminSetup,
  initialInviteToken,
  onAuthenticated,
  onLogout,
  onClearInviteToken,
  onBrowseDoctors,
  onOpenInviteTokenAsFreshSession,
  onDoctorsMutated,
}: PortalViewProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {!user ? (
        <AuthPanel
          needsAdminSetup={needsAdminSetup}
          initialInviteToken={initialInviteToken}
          onAuthenticated={onAuthenticated}
          onClearInviteToken={onClearInviteToken}
        />
      ) : (
        <div className="space-y-8">
          {/* Portal Header */}
          <div className="bg-white border border-[#E2EAEF] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#0D6E6E]">
                {ROLE_LABEL[user.role]}
              </p>
              <h1 className="text-2xl font-display font-bold text-[#0F2429] mt-0.5">
                Welcome, {user.name}
              </h1>
              <p className="text-xs text-[#6D828A] mt-1">
                {user.email}
                {clock ? ` · Clinic Time: ${clock.todayDate} ${clock.currentTimeHm} PKT` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {clock && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#4A6068] tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-[#0D6E6E]" aria-hidden="true" />
                  <span>PKT (UTC+5)</span>
                </span>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-[#4A6068] bg-[#F8FAFB] hover:bg-[#FDF2F2] hover:text-[#9E2A2B] hover:border-[#F0D3D3] active:bg-[#9E2A2B] active:text-white border border-[#D4E1E7] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Role-Specific Dashboard */}
          {user.role === 'patient' && (
            <PatientDashboard onBrowseDoctors={onBrowseDoctors} />
          )}
          {user.role === 'doctor' && <DoctorDashboard />}
          {user.role === 'admin' && (
            <AdminDashboard
              onOpenInviteToken={onOpenInviteTokenAsFreshSession}
              onDoctorsMutated={onDoctorsMutated}
            />
          )}
        </div>
      )}
    </div>
  );
}
