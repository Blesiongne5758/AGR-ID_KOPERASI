import { useState, FormEvent } from 'react';
import {
  Eye,
  EyeOff,
  LogIn,
  UserCircle,
  Lock,
  AlertCircle,
  CheckCircle2,
  Building2,
  Loader2,
} from 'lucide-react';

interface Props {
  onLogin?: (memberId: string) => void;
}

export default function App({ onLogin }: Props) {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ memberId?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ memberId?: boolean; password?: boolean }>({});

  // Validation functions
  const validateMemberId = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Kode ID Anggota wajib diisi';
    }
    if (value.length < 3) {
      return 'Kode ID minimal 3 karakter';
    }
    if (!/^[A-Z0-9-]+$/i.test(value)) {
      return 'Kode ID hanya boleh berisi huruf, angka, dan dash';
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return 'Password wajib diisi';
    }
    if (value.length < 6) {
      return 'Password minimal 6 karakter';
    }
    return undefined;
  };

  // Handle input changes with validation
  const handleMemberIdChange = (value: string) => {
    setMemberId(value.toUpperCase());
    if (touched.memberId) {
      setErrors(prev => ({ ...prev, memberId: validateMemberId(value) }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  // Handle blur events
  const handleMemberIdBlur = () => {
    setTouched(prev => ({ ...prev, memberId: true }));
    setErrors(prev => ({ ...prev, memberId: validateMemberId(memberId) }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: validatePassword(password) }));
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const memberIdError = validateMemberId(memberId);
    const passwordError = validatePassword(password);

    setTouched({ memberId: true, password: true });
    setErrors({ memberId: memberIdError, password: passwordError });

    // If there are errors, stop
    if (memberIdError || passwordError) {
      return;
    }

    // Simulate API call
    setIsLoading(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Demo logic
      if (onLogin) {
        onLogin(memberId);
      } else {
        console.log('Login successful:', { memberId });
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4 shadow-2xl">
            <Building2 className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            AGR.BIZ.ID
          </h1>
          <p className="text-emerald-200/80 text-sm sm:text-base">
            Koperasi Digital - Sistem Informasi Terintegrasi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-emerald-400" />
              Login Anggota
            </h2>
            <p className="text-sm text-emerald-200/70">Masuk ke akun koperasi Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Member ID Field */}
            <div>
              <label htmlFor="memberId" className="block text-sm font-medium text-emerald-200 mb-2">
                Kode ID Anggota
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle
                    className={`h-5 w-5 ${
                      errors.memberId && touched.memberId ? 'text-red-400' : 'text-emerald-300/50'
                    }`}
                  />
                </div>
                <input
                  id="memberId"
                  type="text"
                  value={memberId}
                  onChange={e => handleMemberIdChange(e.target.value)}
                  onBlur={handleMemberIdBlur}
                  placeholder="AGR-2024-000001"
                  disabled={isLoading}
                  className={`
                    w-full pl-10 pr-10 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30
                    focus:outline-none focus:ring-2 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      errors.memberId && touched.memberId
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-white/20 focus:border-emerald-400 focus:ring-emerald-400/20'
                    }
                  `}
                  autoComplete="username"
                />
                {memberId && !errors.memberId && touched.memberId && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                )}
              </div>
              {errors.memberId && touched.memberId && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.memberId}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-emerald-200 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 ${
                      errors.password && touched.password ? 'text-red-400' : 'text-emerald-300/50'
                    }`}
                  />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  onBlur={handlePasswordBlur}
                  placeholder="Masukkan password Anda"
                  disabled={isLoading}
                  className={`
                    w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30
                    focus:outline-none focus:ring-2 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      errors.password && touched.password
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-white/20 focus:border-emerald-400 focus:ring-emerald-400/20'
                    }
                  `}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-300/50 hover:text-emerald-300 transition-colors disabled:opacity-50"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500
                text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25
                hover:shadow-emerald-500/40 hover:scale-[1.02]
                active:scale-[0.98] transition-all
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Login Demo */}
          <div className="mt-5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300 font-medium mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Demo Login (Testing):
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMemberId('AGR-2024-000001');
                  setPassword('admin123');
                  setErrors({});
                  setTouched({});
                }}
                disabled={isLoading}
                className="flex-1 py-2 text-xs bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setMemberId('AGR-2024-000002');
                  setPassword('member123');
                  setErrors({});
                  setTouched({});
                }}
                disabled={isLoading}
                className="flex-1 py-2 text-xs bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                Anggota
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/40">atau</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-emerald-200/70">
              Belum memiliki ID Anggota?{' '}
              <a
                href="/register-coop"
                className="text-white font-semibold hover:text-emerald-300 transition-colors underline underline-offset-2"
              >
                Daftarkan Koperasi Anda
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-emerald-200/40">
            © 2026 AGR.BIZ.ID - KOPERASI DIGITAL • Terintegrasi dengan AGRID Marketplace
          </p>
        </div>
      </div>
    </div>
  );
}
