import { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, UserPlus, LogIn } from 'lucide-react';
import { authApi, setInMemoryToken, type AuthUser } from '../lib/api';

type AuthMode = 'signin' | 'register' | 'set-password' | 'claim-admin';

interface AuthPanelProps {
  needsAdminSetup: boolean;
  initialInviteToken?: string;
  onAuthenticated: (user: AuthUser) => void;
  onClearInviteToken?: () => void;
}

export function AuthPanel({
  needsAdminSetup,
  initialInviteToken = '',
  onAuthenticated,
  onClearInviteToken,
}: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(
    initialInviteToken ? 'set-password' : 'signin'
  );

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Patient Sign Up fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Doctor Set Password fields
  const [setupToken, setSetupToken] = useState(initialInviteToken);
  const [setupPassword, setSetupPassword] = useState('');

  // First-Run Admin Claim fields
  const [adminName, setAdminName] = useState('Clinic Manager');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialInviteToken) {
      setSetupToken(initialInviteToken);
      setMode('set-password');
      setError('');
    }
  }, [initialInviteToken]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      setInMemoryToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });
      setInMemoryToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.setPassword({
        token: setupToken.trim(),
        password: setupPassword,
      });
      setInMemoryToken(res.token);
      onClearInviteToken?.();
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not activate password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.claimAdmin({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
      });
      setInMemoryToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin setup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Context Column */}
      <div className="lg:col-span-5 space-y-5">
        <div>
          <p className="text-sm font-medium text-[#0D6E6E] mb-2">
            Clinic Appointment &amp; Care Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0F2429] tracking-tight">
            One place for patients, doctors, and clinic staff
          </h1>
          <p className="mt-3 text-sm text-[#4A6068] leading-relaxed">
            Sign in to request 30-minute appointments with zero double bookings, manage doctor schedules and leave days, or oversee daily clinic operations.
          </p>
        </div>

        <div className="bg-white border border-[#E2EAEF] rounded-xl p-5 space-y-3 text-xs text-[#4A6068]">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0D6E6E] shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-[#0F2429]">Role-checked privacy:</strong> Visit notes are strictly private between the patient and the doctor who saw them. Clinic admins cannot read visit notes.
            </p>
          </div>
          {needsAdminSetup && (
            <div className="pt-3 border-t border-[#EEF3F6]">
              <p className="font-semibold text-[#0F2429] mb-1">
                First-time clinic setup available
              </p>
              <p className="leading-relaxed mb-2">
                No clinic administrator password is set yet. Claim the initial admin account to add doctors and manage schedules.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('claim-admin');
                  setError('');
                }}
                className="px-2.5 py-1 rounded-md bg-[#F8FAFB] border border-[#D4E1E7] text-xs font-medium text-[#0D6E6E] hover:bg-[#0D6E6E] hover:text-white hover:border-[#0D6E6E] active:bg-[#073E3E] transition-colors cursor-pointer"
              >
                Open First-Time Admin Setup
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Auth Form Card */}
      <div className="lg:col-span-7 bg-white border border-[#E2EAEF] rounded-xl p-6 sm:p-8 shadow-xs">
        {/* Segmented Auth Mode Tabs */}
        <div
          role="tablist"
          aria-label="Portal authentication mode"
          className="flex flex-wrap items-center gap-1 p-1 bg-[#EEF4F6] rounded-lg mb-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setError('');
            }}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#0D6E6E] text-white shadow-xs hover:bg-[#0A5858] active:bg-[#073E3E]'
                : 'text-[#4A6068] hover:bg-white hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'register'
                ? 'bg-[#0D6E6E] text-white shadow-xs hover:bg-[#0A5858] active:bg-[#073E3E]'
                : 'text-[#4A6068] hover:bg-white hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
            }`}
          >
            Patient Sign Up
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'set-password'}
            onClick={() => {
              setMode('set-password');
              setError('');
            }}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'set-password'
                ? 'bg-[#0D6E6E] text-white shadow-xs hover:bg-[#0A5858] active:bg-[#073E3E]'
                : 'text-[#4A6068] hover:bg-white hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
            }`}
          >
            Set Doctor Password
          </button>
          {needsAdminSetup && (
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'claim-admin'}
              onClick={() => {
                setMode('claim-admin');
                setError('');
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'claim-admin'
                  ? 'bg-[#0D6E6E] text-white shadow-xs hover:bg-[#0A5858] active:bg-[#073E3E]'
                  : 'text-[#4A6068] hover:bg-white hover:text-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
              }`}
            >
              Admin Setup
            </button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-lg bg-[#FDF2F2] border border-[#F5C6C6] text-xs sm:text-sm text-[#9E2A2B]"
          >
            {error}
          </div>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#0F2429]">
                Sign in to your account
              </h2>
              <p className="text-xs text-[#6D828A] mt-1">
                Works for patients, doctors, and clinic administrators.
              </p>
            </div>
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-[#0F2429] mb-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-[#0F2429] mb-1"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#0F2429]">
                Create a patient account
              </h2>
              <p className="text-xs text-[#6D828A] mt-1">
                Book, cancel, or reschedule clinic visits and receive automatic confirmations.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-medium text-[#0F2429] mb-1">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g., Ayesha Ahmad"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-medium text-[#0F2429] mb-1">
                  Mobile Number
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0300-0000000"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-[#0F2429] mb-1">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-medium text-[#0F2429] mb-1"
              >
                Password (min 6 characters)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Choose a secure password"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating account...' : 'Create Patient Account'}</span>
            </button>
          </form>
        )}

        {mode === 'set-password' && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#0F2429]">
                Set your doctor portal password
              </h2>
              <p className="text-xs text-[#6D828A] mt-1">
                Paste the single-use setup token from your clinic invitation email to activate your doctor account.
              </p>
            </div>
            <div>
              <label htmlFor="setup-token" className="block text-xs font-medium text-[#0F2429] mb-1">
                Setup Token
              </label>
              <input
                id="setup-token"
                type="text"
                required
                value={setupToken}
                onChange={(e) => setSetupToken(e.target.value)}
                placeholder="Paste invitation token"
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="setup-password"
                className="block text-xs font-medium text-[#0F2429] mb-1"
              >
                Choose Password (min 6 characters)
              </label>
              <input
                id="setup-password"
                type="password"
                required
                minLength={6}
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                placeholder="Create your doctor password"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Activating...' : 'Save Password & Sign In'}</span>
            </button>
          </form>
        )}

        {mode === 'claim-admin' && needsAdminSetup && (
          <form onSubmit={handleClaimAdmin} className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#0F2429]">
                First-time Clinic Admin Setup
              </h2>
              <p className="text-xs text-[#6D828A] mt-1">
                Create the initial clinic manager account. Once claimed, this setup form locks permanently.
              </p>
            </div>
            <div>
              <label htmlFor="admin-name" className="block text-xs font-medium text-[#0F2429] mb-1">
                Manager Name
              </label>
              <input
                id="admin-name"
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-[#0F2429] mb-1">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="manager@nowsheraclinic.pk"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#0F2429] mb-1"
              >
                Admin Password (min 8 characters)
              </label>
              <input
                id="admin-password"
                type="password"
                required
                minLength={8}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Choose a strong admin password"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-5 bg-[#0F2429] hover:bg-[#0D6E6E] active:bg-[#073E3E] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Setting up admin...' : 'Claim Clinic Admin Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
