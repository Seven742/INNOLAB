'use client';

/**
 * InnoLab Inventory — Login Page
 * Split card: left decorative panel (teal→blue gradient, Angkor-inspired SVG) + right form.
 * Colors drawn from InnoLab logo. Bilingual EN / KH. NextAuth credentials auth.
 */

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail, Lock, Eye, EyeOff, Loader2,
  AlertCircle, HelpCircle, X, Shield, ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

/* ── Color palette from InnoLab logo ───────────────────────────────────── */
const C = {
  pageBg: '#06141A',
  cardBg: '#0B1F27',
  inputBg: '#10303A',
  inputBdr: '#1C4A57',
  teal: '#0E7C7B',
  deepTeal: '#0A4F55',
  blue: '#2F7FD1',
  lblue: '#7FB2E8',
  gold: '#D4A93C',
  textPrim: '#FFFFFF',
  textSec: '#A9C3CC',
  errRed: '#F87171',
};

/* ── 3 slide captions for the left decorative panel ────────────────────── */
const SLIDES = [
  {
    en: 'Where Ideas Become Innovation',
    kh: 'ទីកន្លែងដែលគំនិតប្រែក្លាយជានវានុវត្តន៍',
    subEn: 'Innovation & SME Incubation Hub · Kampong Thom',
    subKh: 'មជ្ឈមណ្ឌលបណ្តុះបណ្តាលសហគ្រាស ខេត្តកំពង់ធំ',
  },
  {
    en: 'Precision Stock Management',
    kh: 'ការគ្រប់គ្រងស្តុកទំនិញប្រកបដោយភាពជាក់លាក់',
    subEn: 'Real-time tracking · Supplier management · Instant alerts',
    subKh: 'តាមដានជាក់ស្តែង · អ្នកផ្គត់ផ្គង់ · ការជូនដំណឹងភ្លាមៗ',
  },
  {
    en: 'Role-Based Security Built In',
    kh: 'សុវត្ថិភាពតាមតួនាទីដែលភ្ជាប់ស្រាប់',
    subEn: '256-bit encrypted JWT sessions with granular permissions',
    subKh: 'ការការពារ JWT 256-bit ជាមួយការបែងចែកសិទ្ធិច្បាស់លាស់',
  },
];

/* ── Angkor-inspired lotus / prasat SVG pattern ─────────────────────────── */
function LotusSVG() {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  const lines = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 480 640"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Dashed rings */}
      <circle cx="240" cy="360" r="220" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="4 6" opacity="0.12" />
      <circle cx="240" cy="360" r="160" stroke="#7FB2E8" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.14" />
      <circle cx="240" cy="360" r="100" stroke="#D4A93C" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.18" />

      {/* 8-petal lotus */}
      {petals.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const r = 130;
        const cx2 = 240 + r * Math.sin(rad);
        const cy2 = 360 - r * Math.cos(rad);
        return (
          <path
            key={i}
            d={`M240,360 Q${240 + (cx2 - 240) * 0.4},${360 + (cy2 - 360) * 0.3} ${cx2},${cy2} Q${240 + (cx2 - 240) * 0.6},${360 + (cy2 - 360) * 0.3} 240,360 Z`}
            fill="none"
            stroke="#7FB2E8"
            strokeWidth="0.8"
            opacity="0.20"
          />
        );
      })}

      {/* Angkor Wat prasat silhouette */}
      <g opacity="0.22" stroke="#D4A93C" strokeWidth="1" fill="none">
        <path d="M240,220 L248,240 L252,270 L240,270 L228,270 L232,240 Z" />
        <rect x="228" y="270" width="24" height="8" rx="1" />
        <path d="M200,245 L207,260 L210,280 L190,280 L193,260 Z" />
        <rect x="190" y="280" width="20" height="6" rx="1" />
        <path d="M280,245 L287,260 L290,280 L270,280 L273,260 Z" />
        <rect x="270" y="280" width="20" height="6" rx="1" />
        <rect x="175" y="286" width="130" height="6" rx="2" />
        <rect x="185" y="292" width="110" height="4" rx="1" />
      </g>

      {/* Cardinal radiating lines */}
      {lines.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={240} y1={360}
            x2={240 + 200 * Math.sin(rad)}
            y2={360 - 200 * Math.cos(rad)}
            stroke="#ffffff"
            strokeWidth="0.4"
            opacity="0.08"
          />
        );
      })}
    </svg>
  );
}

/* ── Language toggle pill ───────────────────────────────────────────────── */
function LangToggle({ lang, setLang }) {
  return (
    <div
      className="flex items-center gap-0.5 p-1 rounded-xl"
      style={{ background: C.inputBg, border: `1px solid ${C.inputBdr}` }}
      role="group"
      aria-label="Language selection"
    >
      {[{ code: 'en', label: 'EN' }, { code: 'kh', label: 'ខ្មែរ' }].map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer"
          style={lang === code
            ? { background: C.teal, color: C.textPrim }
            : { color: C.textSec }}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── Main login form ────────────────────────────────────────────────────── */
function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { lang, setLang } = useLanguage();
  const isKh = lang === 'kh';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  /* Validators */
  const validateEmail = (v) => {
    if (!v.trim()) return isKh ? 'សូមបញ្ចូលអ៊ីមែល' : 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))
      return isKh ? 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ' : 'Enter a valid email (e.g. admin@innolab.kh)';
    return '';
  };
  const validatePassword = (v) => {
    if (!v) return isKh ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Password is required';
    if (v.length < 6) return isKh ? 'ពាក្យសម្ងាត់ត្រូវយ៉ាងហោចណាស់ ៦ តួ' : 'Password must be at least 6 characters';
    return '';
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setFormError(
          result.error === 'Account is deactivated'
            ? (isKh ? 'គណនីនេះត្រូវបានផ្អាក។ ទាក់ទង IT Admin។' : 'Account deactivated. Contact your administrator.')
            : (isKh ? 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។' : 'Invalid email or password. Please try again.')
        );
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setFormError(isKh ? 'មានបញ្ហាតភ្ជាប់ប្រព័ន្ធ។ សូមព្យាយាមម្តងទៀត។' : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Quick-fill demo account */
  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('admin123');
    setEmailError('');
    setPasswordError('');
    setFormError('');
    setShowHelp(false);
  };

  /* Shared input className */
  const inputCls = (err) => [
    'w-full h-12 rounded-[12px] text-sm text-white transition-all duration-200 focus:outline-none',
    `bg-[${C.inputBg}]`,
    err
      ? 'border border-[#F87171] ring-1 ring-[#F87171]/30'
      : 'border border-[#1C4A57] focus:border-[#D4A93C] focus:ring-2 focus:ring-[#2F7FD1]/35',
  ].join(' ');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-10"
      style={{ background: C.pageBg }}
    >
      {/* Ambient page glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-48 w-[560px] h-[560px] rounded-full blur-[150px]"
          style={{ background: `${C.teal}1A` }} />
        <div className="absolute -bottom-32 -right-48 w-[520px] h-[520px] rounded-full blur-[150px]"
          style={{ background: `${C.blue}1A` }} />
      </div>

      {/* ── MAIN CARD ─────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-[960px] rounded-[24px] shadow-2xl shadow-black/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        style={{ background: C.cardBg, border: `1px solid ${C.inputBdr}60` }}
      >

        {/* ── LEFT PANEL (desktop only) ─────────────────────────────────── */}
        <div
          className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${C.deepTeal} 0%, ${C.teal} 45%, ${C.blue} 100%)`,
            borderRight: `1px solid ${C.inputBdr}50`,
          }}
        >
          {/* SVG pattern layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <LotusSVG />
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl"
              style={{ background: `${C.lblue}25` }} />
            <div className="absolute bottom-0 right-0 w-96 h-64 rounded-full blur-3xl"
              style={{ background: `${C.pageBg}50` }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-2xl"
              style={{ background: `${C.gold}12` }} />
          </div>

          {/* Top bar: logo + "Back to website" pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className=" rounded-xl flex items-center justify-center "
              // style={{ background: `${C.pageBg}60`, border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <img src="/logo.png" alt="InnoLab logo" className="h-full w-auto object-contain drop-shadow" />
              </div>
              {/* <div>
                <p className="font-extrabold text-sm tracking-widest text-white leading-none">INNOLAB</p>
                <p className="text-[9px] uppercase tracking-[0.2em] leading-none mt-0.5" style={{ color: C.textSec }}>
                  Inventory Hub
                </p>
              </div> */}
            </div>

            {/* <a
              href="/dashboard"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:bg-white/25 group"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: C.textPrim }}
              title="Return to dashboard"
            >
              <span>{isKh ? 'ត្រឡប់' : 'Back to website'}</span>
              <ChevronRight className="h-3 w-3 opacity-80 group-hover:translate-x-0.5 transition-transform duration-200" />
            </a> */}
          </div>

          {/* Bottom: caption + pagination dots */}
          <div className="relative z-10">
            <blockquote className="mb-4">
              <p className="text-[22px] font-bold text-white leading-snug tracking-tight drop-shadow-sm">
                &ldquo;{isKh ? SLIDES[activeDot].kh : SLIDES[activeDot].en}&rdquo;
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: C.textSec }}>
                {isKh ? SLIDES[activeDot].subKh : SLIDES[activeDot].subEn}
              </p>
            </blockquote>

            {/* Pagination dots — active dot is gold */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Slide indicators">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={activeDot === i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setActiveDot(i)}
                  className="h-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none"
                  style={{
                    width: activeDot === i ? '24px' : '8px',
                    background: activeDot === i ? C.gold : 'rgba(169,195,204,0.4)',
                    boxShadow: activeDot === i ? `0 0 8px ${C.gold}80` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ──────────────────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          <div>

            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between mb-7">
              <div className="flex items-center gap-2">
                <img src="/main-logo.png" alt="InnoLab" className="h-8 w-auto object-contain" />
                <span className="font-extrabold text-sm tracking-widest text-white">INNOLAB</span>
              </div>
              <LangToggle lang={lang} setLang={setLang} />
            </div>

            {/* Desktop lang toggle */}
            <div className="hidden lg:flex justify-end mb-5">
              <LangToggle lang={lang} setLang={setLang} />
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {isKh ? 'សូមស្វាគមន៍ការត្រឡប់មកវិញ' : 'Welcome back'}
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: C.textSec }}>
                {isKh
                  ? 'បញ្ចូលព័ត៌មានគណនីដើម្បីចូលប្រើប្រព័ន្ធ InnoLab'
                  : 'Log in to your InnoLab Inventory account'}
              </p>
            </div>

            {/* Global auth error banner */}
            {formError && (
              <div
                className="mb-5 flex items-start gap-2.5 p-3 rounded-[12px] text-xs font-medium"
                style={{ background: `${C.errRed}18`, border: `1px solid ${C.errRed}40`, color: C.errRed }}
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: C.textSec }}
                >
                  {isKh ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'}
                  <span className="ml-0.5" style={{ color: C.errRed }} aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                    style={{ color: C.textSec }}
                    aria-hidden="true"
                  >
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); if (formError) setFormError(''); }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    placeholder={isKh ? 'admin@innolab.kh' : 'Enter your email address'}
                    className={`${inputCls(emailError)} pl-10 pr-4`}
                    style={{ background: C.inputBg }}
                    aria-required="true"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-err' : undefined}
                  />
                </div>
                {emailError && (
                  <p id="email-err" className="mt-1.5 text-xs flex items-center gap-1" style={{ color: C.errRed }} role="alert">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: C.textSec }}
                >
                  {isKh ? 'ពាក្យសម្ងាត់' : 'Password'}
                  <span className="ml-0.5" style={{ color: C.errRed }} aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                    style={{ color: C.textSec }}
                    aria-hidden="true"
                  >
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); if (formError) setFormError(''); }}
                    onBlur={() => setPasswordError(validatePassword(password))}
                    placeholder={isKh ? 'បញ្ចូលពាក្យសម្ងាត់' : 'Enter your password'}
                    className={`${inputCls(passwordError)} pl-10 pr-11`}
                    style={{ background: C.inputBg }}
                    aria-required="true"
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'pw-err' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors duration-200 hover:text-white"
                    style={{ color: C.textSec }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p id="pw-err" className="mt-1.5 text-xs flex items-center gap-1" style={{ color: C.errRed }} role="alert">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group" htmlFor="remember-me">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded cursor-pointer"
                    style={{ accentColor: C.teal }}
                  />
                  <span className="text-xs transition-colors duration-200 group-hover:text-white" style={{ color: C.textSec }}>
                    {isKh ? 'ចងចាំការចូលប្រើ' : 'Remember me'}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  className="text-xs font-medium transition-colors duration-200 hover:underline underline-offset-2 cursor-pointer"
                  style={{ color: C.lblue }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.lblue; }}
                >
                  {isKh ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot password?'}
                </button>
              </div>

              {/* Log in button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-[12px] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                style={{
                  background: `linear-gradient(90deg, ${C.teal}, ${C.blue})`,
                  boxShadow: `0 4px 20px ${C.teal}35`,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{isKh ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Logging in…'}</span>
                  </>
                ) : (
                  <span>{isKh ? 'ចូលប្រើប្រាស់' : 'Log in'}</span>
                )}
              </button>
            </form>
          </div>

          {/* Security footnote */}
          <footer
            className="pt-6 mt-6 flex items-center justify-between text-[11px]"
            style={{ borderTop: `1px solid ${C.inputBdr}60`, color: `${C.textSec}99` }}
          >
            <span className="flex items-center gap-1.5">
              {/* <Shield className="h-3.5 w-3.5" style={{ color: C.teal }} aria-hidden="true" />
              <span>TLS 1.3 · 256-bit AES JWT</span> */}
            </span>

            <span >Innolab Kampong Thom</span>
          </footer>
        </div>
      </div>

      {/* ── HELP / FORGOT PASSWORD MODAL ─────────────────────────────────── */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <div
            className="w-full max-w-[420px] rounded-[20px] p-6 shadow-2xl"
            style={{ background: C.cardBg, border: `1px solid ${C.inputBdr}` }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between pb-3 mb-4"
              style={{ borderBottom: `1px solid ${C.inputBdr}80` }}
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" style={{ color: C.gold }} aria-hidden="true" />
                <h2 id="help-title" className="text-sm font-bold text-white">
                  {isKh ? 'ជំនួយការចូលប្រើប្រាស់' : 'Account Access Help'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                style={{ color: C.textSec }}
                aria-label="Close help modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs mb-4 leading-relaxed" style={{ color: C.textSec }}>
              {isKh
                ? 'ប្រសិនបើអ្នកភ្លេចពាក្យសម្ងាត់ ឬត្រូវការគណនី សូមទាក់ទង Support។'
                : 'If you forgot your password or need an account, contact the Support.'}
            </p>

            {/* Demo accounts */}
            {/* <div
              className="p-3 rounded-[12px] mb-4 space-y-2"
              style={{ background: C.inputBg, border: `1px solid ${C.inputBdr}` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  {isKh ? 'គណនីសាកល្បង (Demo):' : 'Pre-configured test roles:'}
                </span>
                <span className="text-[10px]" style={{ color: C.gold }}>1-click autofill</span>
              </div>
              {[
                { label: 'Admin', demoEmail: 'admin@innolab.kh' },
                { label: 'Manager', demoEmail: 'manager@innolab.kh' },
                { label: 'Staff', demoEmail: 'staff@innolab.kh' },
              ].map(({ label, demoEmail }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => fillDemo(demoEmail)}
                  className="w-full p-2 rounded-[10px] text-left flex items-center justify-between transition-all duration-200 cursor-pointer"
                  style={{ background: C.cardBg, border: `1px solid ${C.inputBdr}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.inputBdr; }}
                >
                  <span className="text-[11px]" style={{ color: C.textSec }}>
                    <strong className="text-white">{label}:</strong> {demoEmail}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: `${C.blue}20`, color: C.lblue }}
                  >
                    admin123
                  </span>
                </button>
              ))}
            </div> */}

            <p className="text-[11px]" style={{ color: `${C.textSec}99` }}>
              {isKh
                ? 'ជំនួយបច្ចេកទេស: saikoemsean@gmail.com · ខេត្តកំពង់ធំ'
                : 'Support: saikoemsean@gmail.com · Kampong Thom Facility'}
            </p>

            <div className="mt-5 pt-3 flex justify-end" style={{ borderTop: `1px solid ${C.inputBdr}60` }}>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="px-4 py-1.5 rounded-[10px] text-xs font-semibold text-white transition-colors duration-200 cursor-pointer"
                style={{ background: C.teal }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.deepTeal; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.teal; }}
              >
                {isKh ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Root export (wraps in Suspense for useSearchParams) ────────────────── */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#06141A' }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#7FB2E8' }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
