import { useState } from 'react';
import { CheckCircle2, ShieldCheck, Compass, HeartHandshake } from 'lucide-react';

export function AboutView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | 'facility'>('patient');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please include a brief message (at least 10 characters).');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <section
      aria-label="About ONECARE and Contact"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6 min-h-[calc(100vh-7.5rem)] flex items-center"
    >
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Calm Mission & Care Principles */}
        <div className="lg:col-span-6 bg-white border border-[#E2EAEF] rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-[#0C7773]">About ONECARE</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-display font-bold text-[#142F35] tracking-tight leading-tight">
              Calm healthcare discovery for Peshawar.
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#647780] leading-relaxed">
              ONECARE brings doctors, medicines, and lab tests into one simple, non-scrolling interface so patients and elderly family members never struggle while unwell.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#EEF3F6] space-y-4">
            {[
              {
                icon: Compass,
                title: 'Local to Peshawar',
                body: 'Covers Hayatabad, University Town, Dabgari Gardens, Saddar, Cantt, Gulbahar, and Warsak Road.',
              },
              {
                icon: HeartHandshake,
                title: 'Clinician-Led Care',
                body: 'Designed to connect patients directly with qualified doctors and private visit notes.',
              },
              {
                icon: ShieldCheck,
                title: 'Zero Double Bookings',
                body: 'Every 30-minute clinic slot locks upon request with upfront consultation fees.',
              },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EDF6F6] text-[#0D6E6E] inline-flex items-center justify-center shrink-0">
                    <IconComp className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-sm font-display font-semibold text-[#0F2429]">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[#4A6068] leading-relaxed mt-0.5">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Contact & Clinic Onboarding */}
        <div className="lg:col-span-6 bg-white border border-[#E2EAEF] rounded-2xl p-6 sm:p-7 flex flex-col justify-center">
          <h2 className="text-xl font-display font-semibold text-[#0F2429]">
            Contact &amp; Clinic Onboarding
          </h2>
          <p className="mt-1 text-sm text-[#4A6068]">
            Share patient feedback or request clinic, pharmacy, or lab onboarding in Peshawar.
          </p>

          {submitted ? (
            <div className="mt-5 bg-[#EDF6F6] border border-[#C2DFDF] rounded-xl p-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#0D6E6E] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-display font-semibold text-[#0F2429]">
                  Message received
                </h3>
                <p className="mt-1 text-sm text-[#4A6068] leading-relaxed">
                  Thank you, {name}. Your {role} note has been validated in this prototype preview.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-white border border-[#BBDCDC] text-xs font-medium text-[#0D6E6E] hover:bg-[#0D6E6E] hover:text-white hover:border-[#0D6E6E] active:bg-[#073E3E] transition-colors cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-medium text-[#0F2429] mb-1">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-medium text-[#0F2429] mb-1">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-[#0F2429] mb-1.5">
                  I am reaching out as a
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'patient', label: 'Patient / Family' },
                    { id: 'doctor', label: 'Doctor' },
                    { id: 'facility', label: 'Clinic, Pharmacy, or Lab' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id as 'patient' | 'doctor' | 'facility')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        role === item.id
                          ? 'bg-[#0D6E6E] border-[#0D6E6E] text-white hover:bg-[#0A5858] active:bg-[#073E3E]'
                          : 'bg-[#F8FAFB] border-[#D4E1E7] text-[#4A6068] hover:bg-[#EDF6F6] hover:text-[#0D6E6E] hover:border-[#0D6E6E] active:bg-[#0D6E6E] active:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="contact-msg" className="block text-xs font-medium text-[#0F2429] mb-1">
                  Message
                </label>
                <textarea
                  id="contact-msg"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your feedback or clinic onboarding inquiry..."
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFB] border border-[#D4E1E7] rounded-lg text-[#0F2429] focus:bg-white focus:border-[#0D6E6E] focus:outline-none resize-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-[#9E2A2B]">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0A5858] active:bg-[#073E3E] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Send Message
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
