import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { loginSchema, validateForm } from '@/lib/validation';

type Mode = 'login' | 'requestReset' | 'setNewPassword';

function mapSupabaseAuthError(err: unknown): string {
  const e = err as { message?: string; code?: string } | null;
  const code = e?.code;

  if (code === 'invalid_credentials') {
    return 'بيانات الدخول غير صحيحة. تأكد من البريد/كلمة المرور، أو استخدم "نسيت كلمة المرور".';
  }
  if (code === 'email_not_confirmed') {
    return 'البريد الإلكتروني غير مؤكد. افتح رسالة التأكيد أو اطلب إعادة تعيين كلمة المرور.';
  }
  if (code === 'user_not_found') {
    return 'هذا البريد غير موجود.';
  }
  if (code === 'over_request_rate_limit') {
    return 'طلبات كثيرة جداً. انتظر قليلاً ثم أعد المحاولة.';
  }

  return e?.message || 'تعذر تسجيل الدخول. حاول مرة أخرى.';
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const login = useAuthStore((s) => s.login);

  const [mode, setMode] = useState<Mode>('login');

  const [missingAdminProfile, setMissingAdminProfile] = useState<null | { userId: string; email: string }>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRecoveryFlow = useMemo(() => {
    const hash = window.location.hash || '';
    // Supabase recovery links عادةً تحتوي: #access_token=...&type=recovery
    return hash.includes('type=recovery');
  }, []);

  useEffect(() => {
    if (isRecoveryFlow) {
      setMode('setNewPassword');
    }
  }, [isRecoveryFlow]);

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMissingAdminProfile(null);

    const validation = validateForm(loginSchema, { email, password });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        showToast(mapSupabaseAuthError(authError), 'error');
        return;
      }

      // Fetch admin profile using RPC that bypasses RLS (SECURITY DEFINER)
      const { data: profileRows, error: profileError } = await supabase.rpc('get_my_admin_profile');
      
      console.log('[Admin Login] get_my_admin_profile result:', { profileRows, profileError });
      
      const adminProfile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : null;
      
      if (profileError) {
        console.error('[Admin Login] RPC error:', profileError);
        await supabase.auth.signOut();
        showToast(`خطأ في التحقق من صلاحيات الأدمن: ${profileError.message}`, 'error');
        return;
      }
      
      if (!adminProfile) {
        // User is authenticated in Supabase Auth but NOT registered as admin
        console.warn('[Admin Login] User authenticated but no admin_profiles row');
        await supabase.auth.signOut();
        setMissingAdminProfile({
          userId: authData.user.id,
          email: authData.user.email || email,
        });
        showToast('هذا الحساب غير مُضاف كمسؤول. أضِفه إلى جدول admin_profiles في Supabase.', 'error');
        return;
      }

      login({
        id: adminProfile.id,
        email: adminProfile.email,
        name: adminProfile.name,
        role: adminProfile.role,
        created_at: adminProfile.created_at,
      });

      showToast('تم تسجيل الدخول بنجاح', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      showToast('حدث خطأ أثناء تسجيل الدخول', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('أدخل البريد الإلكتروني أولاً', 'error');
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/login`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo });

      if (error) {
        showToast(mapSupabaseAuthError(error), 'error');
        return;
      }

      showToast('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك (إن كان موجوداً).', 'success');
      setMode('login');
    } catch (error) {
      console.error('Reset password error:', error);
      showToast('تعذر إرسال رابط إعادة التعيين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      return;
    }
    if (newPassword !== newPassword2) {
      showToast('كلمتا المرور غير متطابقتين', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        showToast('جلسة الاسترجاع غير صالحة. اطلب رابط إعادة تعيين جديد.', 'error');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast(mapSupabaseAuthError(error), 'error');
        return;
      }

      // Remove hash to avoid staying in recovery mode
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

      showToast('تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.', 'success');
      setNewPassword('');
      setNewPassword2('');
      setMode('login');
    } catch (error) {
      console.error('Set new password error:', error);
      showToast('تعذر تحديث كلمة المرور', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-primary-600 font-bold text-3xl">م</span>
          </div>
          <h1 className="text-2xl font-bold text-white">لوحة تحكم متجرنا</h1>
          <p className="text-primary-200 mt-1">{mode === 'login' ? 'سجل دخولك للمتابعة' : mode === 'requestReset' ? 'إعادة تعيين كلمة المرور' : 'تعيين كلمة مرور جديدة'}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {missingAdminProfile && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900 mb-1">هذا المستخدم مسجل في Auth لكنه ليس مسؤولاً بعد</p>
              <p className="text-sm text-amber-800 mb-3">
                أضِف هذا المستخدم إلى جدول <span className="font-mono">admin_profiles</span> داخل Supabase ثم جرّب تسجيل الدخول مرة أخرى.
              </p>
              <div className="text-xs text-amber-900 bg-white/60 border border-amber-200 rounded-lg p-3 mb-3" dir="ltr">
                <div><span className="font-semibold">user_id:</span> {missingAdminProfile.userId}</div>
                <div><span className="font-semibold">email:</span> {missingAdminProfile.email}</div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-amber-800">SQL (انسخه إلى Supabase SQL Editor):</p>
                <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-auto" dir="ltr">{`insert into admin_profiles (user_id, email, name, role)
values ('${missingAdminProfile.userId}', '${missingAdminProfile.email}', 'مدير المتجر', 'admin');`}</pre>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const sql = `insert into admin_profiles (user_id, email, name, role)\nvalues ('${missingAdminProfile.userId}', '${missingAdminProfile.email}', 'مدير المتجر', 'admin');`;
                    await navigator.clipboard.writeText(sql);
                    showToast('تم نسخ SQL', 'success');
                  }}
                >
                  نسخ SQL
                </Button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute right-3 top-[38px] w-5 h-5 text-gray-400" />
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({});
                    setMissingAdminProfile(null);
                  }}
                  error={errors.email}
                  placeholder="admin@matjarna.com"
                  className="pr-10"
                />
              </div>

              <div className="relative">
                <Lock className="absolute right-3 top-[38px] w-5 h-5 text-gray-400" />
                <Input
                  label="كلمة المرور"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({});
                    setMissingAdminProfile(null);
                  }}
                  error={errors.password}
                  placeholder="••••••••"
                  className="pr-10 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                تسجيل الدخول
              </Button>

              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setMode('requestReset');
                }}
                className="w-full text-sm text-primary-700 hover:text-primary-800 font-medium"
              >
                نسيت كلمة المرور؟
              </button>

              <p className="text-center text-xs text-gray-500">تسجيل الدخول للمسؤولين فقط</p>
            </form>
          )}

          {mode === 'requestReset' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="relative">
                <Mail className="absolute right-3 top-[38px] w-5 h-5 text-gray-400" />
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@matjarna.com"
                  className="pr-10"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                إرسال رابط إعادة التعيين
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('login')}>
                رجوع
              </Button>

              <p className="text-xs text-gray-500 leading-relaxed">
                ملاحظة: يجب إضافة نطاق <span className="font-mono">{window.location.origin}</span> ضمن Redirect URLs في Supabase.
              </p>
            </form>
          )}

          {mode === 'setNewPassword' && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <KeyRound className="w-4 h-4" />
                <span>أدخل كلمة مرور جديدة لإكمال الاسترجاع.</span>
              </div>

              <Input
                label="كلمة المرور الجديدة"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Input
                label="تأكيد كلمة المرور"
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                placeholder="••••••••"
              />

              <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                حفظ كلمة المرور
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('requestReset')}>
                طلب رابط جديد
              </Button>
            </form>
          )}
        </div>

        <div className="mt-4 bg-white/10 rounded-xl p-4 text-center">
          <p className="text-primary-100 text-sm">للتجربة: يجب إنشاء مستخدم أدمن في Supabase ثم إضافته إلى جدول admin_profiles</p>
        </div>
      </div>
    </div>
  );
}
