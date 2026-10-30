import { useState } from 'react';
import { detectCooperative } from '../data/mockData';

interface Props {
  onLogin: (role: 'admin' | 'member') => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [detectedCoop, setDetectedCoop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  const handleMemberIdChange = (value: string) => {
    setMemberId(value.toUpperCase());
    if (value.length >= 3) {
      const coop = detectCooperative(value);
      setDetectedCoop(coop);
    } else {
      setDetectedCoop(null);
    }
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      if (memberId === 'AGR001') {
        onLogin('admin');
      } else if (memberId.length >= 3) {
        onLogin('member');
      } else {
        setError('ID Anggota tidak valid. Minimal 3 karakter.');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <span className="text-4xl">🏛️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Koperasi Digital</h1>
          <p className="text-emerald-200/80 text-sm">Sistem Informasi Koperasi Terintegrasi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Login Anggota Koperasi</h2>
            <p className="text-sm text-emerald-200/70">Masukkan kredensial Anda untuk melanjutkan</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'password'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-emerald-200/70 hover:text-white'
              }`}
            >
              🔑 Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('otp')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'otp'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-emerald-200/70 hover:text-white'
              }`}
            >
              📱 OTP
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Member ID */}
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                Kode ID Anggota
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => handleMemberIdChange(e.target.value)}
                  placeholder="Contoh: AGR001"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  maxLength={30}
                />
                {detectedCoop && (
                  <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-xs text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Terdeteksi: {detectedCoop}
                  </div>
                )}
              </div>
            </div>

            {/* Password / OTP */}
            <div className={detectedCoop ? 'mt-4' : ''}>
              <label className="block text-sm font-medium text-emerald-200 mb-1.5">
                {loginMethod === 'password' ? 'Password' : 'Kode OTP'}
              </label>
              {loginMethod === 'password' ? (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6 digit kode OTP"
                      maxLength={6}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all tracking-widest text-center text-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOtp(!showOtp)}
                      className="px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all"
                    >
                      Kirim OTP
                    </button>
                  </div>
                  <p className="text-xs text-emerald-200/50">OTP akan dikirim ke nomor terdaftar via WhatsApp</p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || memberId.length < 3}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memverifikasi...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Quick Login Demo */}
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300 font-medium mb-1">🎮 Demo Login:</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setMemberId('AGR001'); setDetectedCoop('Koperasi AGRID Sejahtera'); }}
                className="flex-1 py-1.5 text-xs bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/30 transition-colors"
              >
                Admin (AGR001)
              </button>
              <button
                onClick={() => { setMemberId('AGR002'); setDetectedCoop('Koperasi AGRID Sejahtera'); }}
                className="flex-1 py-1.5 text-xs bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/30 transition-colors"
              >
                Anggota (AGR002)
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/40">atau</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Alternative Links */}
          <div className="space-y-3">
            <a href="#" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
              <span className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">📝</span>
              <div>
                <div className="text-sm font-medium text-white">Belum punya ID? Daftar Koperasi Baru</div>
                <div className="text-xs text-emerald-200/50">Registrasi sebagai anggota koperasi</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
              <span className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">📞</span>
              <div>
                <div className="text-sm font-medium text-white">Hubungi Koperasi Anda</div>
                <div className="text-xs text-blue-200/50">Butuh bantuan? Hubungi admin koperasi</div>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-emerald-200/40">
            © 2026 Koperasi Digital • Terintegrasi dengan AGRID Marketplace
          </p>
        </div>
      </div>
    </div>
  );
}
