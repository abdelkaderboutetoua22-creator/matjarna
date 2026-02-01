import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

const socialPlatforms = [
  { key: 'facebook', label: 'فيسبوك', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'انستغرام', placeholder: 'https://instagram.com/...' },
  { key: 'tiktok', label: 'تيك توك', placeholder: 'https://tiktok.com/@...' },
  { key: 'youtube', label: 'يوتيوب', placeholder: 'https://youtube.com/...' },
  { key: 'telegram', label: 'تيليغرام', placeholder: 'https://t.me/...' },
  { key: 'x', label: 'X (تويتر)', placeholder: 'https://x.com/...' },
  { key: 'snapchat', label: 'سناب شات', placeholder: 'https://snapchat.com/...' },
];

export function SettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase.from('store_settings').select('*').single();
    setSettings(data || {
      store_name: 'متجرنا',
      support_phone: '',
      support_email: '',
      social_links: {},
      features: []
    });
    setLoading(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (key: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      social_links: { ...prev.social_links, [key]: value }
    }));
  };

  const handleFeatureChange = (index: number, field: string, value: string) => {
    setSettings((prev: any) => {
      const features = [...(prev.features || [])];
      features[index] = { ...features[index], [field]: value };
      return { ...prev, features };
    });
  };

  const addFeature = () => {
    setSettings((prev: any) => ({
      ...prev,
      features: [...(prev.features || []), { title: '', description: '', icon: '' }]
    }));
  };

  const removeFeature = (index: number) => {
    setSettings((prev: any) => ({
      ...prev,
      features: prev.features.filter((_: any, i: number) => i !== index)
    }));
  };

  async function handleSave() {
    setSaving(true);
    
    const { error } = await supabase
      .from('store_settings')
      .update({
        store_name: settings.store_name,
        support_phone: settings.support_phone,
        support_email: settings.support_email,
        social_links: settings.social_links,
        features: settings.features
      })
      .eq('id', settings.id);

    if (error) {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } else {
      showToast('تم حفظ الإعدادات بنجاح', 'success');
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="py-12"><Loader size="lg" className="mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات المتجر</h1>
        <Button onClick={handleSave} isLoading={saving}>
          <Save className="w-4 h-4 ml-2" />
          حفظ التغييرات
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">المعلومات الأساسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="اسم المتجر"
            name="store_name"
            value={settings.store_name || ''}
            onChange={handleChange}
          />
          <Input
            label="رقم الدعم"
            name="support_phone"
            value={settings.support_phone || ''}
            onChange={handleChange}
            dir="ltr"
          />
          <Input
            label="بريد الدعم"
            name="support_email"
            type="email"
            value={settings.support_email || ''}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Social Links */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">روابط التواصل الاجتماعي</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialPlatforms.map((platform) => (
            <Input
              key={platform.key}
              label={platform.label}
              value={settings.social_links?.[platform.key] || ''}
              onChange={(e) => handleSocialChange(platform.key, e.target.value)}
              placeholder={platform.placeholder}
              dir="ltr"
            />
          ))}
        </div>
      </Card>

      {/* Features */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">مميزات المتجر (لماذا تختارنا)</h2>
          <Button size="sm" variant="outline" onClick={addFeature}>
            <Plus className="w-4 h-4 ml-1" />
            إضافة ميزة
          </Button>
        </div>
        
        {settings.features && settings.features.length > 0 ? (
          <div className="space-y-4">
            {settings.features.map((feature: any, index: number) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="العنوان"
                    value={feature.title || ''}
                    onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                    placeholder="توصيل سريع"
                  />
                  <Input
                    label="الوصف"
                    value={feature.description || ''}
                    onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                    placeholder="توصيل لجميع الولايات"
                  />
                  <Input
                    label="الأيقونة"
                    value={feature.icon || ''}
                    onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                    placeholder="truck"
                  />
                </div>
                <button
                  onClick={() => removeFeature(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">لا توجد مميزات. أضف ميزة جديدة.</p>
        )}
      </Card>
    </div>
  );
}
