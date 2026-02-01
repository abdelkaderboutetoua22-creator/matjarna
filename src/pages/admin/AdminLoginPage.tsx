import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { loginSchema, validateForm } from '@/lib/validation';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(loginSchema, { email, password });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: adminProfile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !adminProfile) {
        await supabase.auth.signOut();
        showToast('هذا الحساب غير مصرح له بالوصول', 'error');
        setLoading(false);
        return;
      }

      // Login successful
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
    }
    setLoading(false);
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
          <p className="text-primary-200 mt-1">سجل دخولك للمتابعة</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute right-3 top-[38px] w-5 h-5 text-gray-400" />
              <Input
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({});
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
          </div>

          <Button type="submit" size="lg" className="w-full mt-6" isLoading={loading}>
            تسجيل الدخول
          </Button>

          <p className="text-center text-xs text-gray-500 mt-6">
            تسجيل الدخول للمسؤولين فقط
          </p>
        </form>

        {/* Demo Credentials (for development) */}
        <div className="mt-4 bg-white/10 rounded-xl p-4 text-center">
          <p className="text-primary-100 text-sm">
            للتجربة: يرجى إنشاء حساب مسؤول في Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
