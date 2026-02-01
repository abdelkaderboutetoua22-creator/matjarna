import { useState, useEffect } from 'react';
import { Download, Upload, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { config } from '@/config';
import * as XLSX from 'xlsx';

export function ShippingRatesPage() {
  const { showToast } = useToast();
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedRates, setEditedRates] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    setLoading(true);
    const { data } = await supabase.from('shipping_rates').select('*').order('wilaya_code');
    setRates(data || []);
    setLoading(false);
  }

  const handleRateChange = (id: string, field: string, value: string) => {
    setEditedRates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === 'is_active' ? value === 'true' : parseFloat(value) || 0
      }
    }));
  };

  async function handleSave() {
    setSaving(true);
    const updates = Object.entries(editedRates).map(([id, data]) => ({
      id,
      ...data
    }));

    for (const update of updates) {
      await supabase.from('shipping_rates').update(update).eq('id', update.id);
    }

    showToast('تم حفظ التغييرات بنجاح', 'success');
    setEditedRates({});
    fetchRates();
    setSaving(false);
  }

  function handleExport() {
    const exportData = rates.map(r => ({
      'رمز الولاية': r.wilaya_code,
      'اسم الولاية': r.wilaya_name,
      'سعر المكتب': r.office_price,
      'سعر المنزل': r.home_price,
      'نشط': r.is_active ? 'نعم' : 'لا'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'أسعار التوصيل');
    XLSX.writeFile(wb, 'shipping_rates.xlsx');
    showToast('تم تصدير الملف بنجاح', 'success');
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        for (const row of jsonData as any[]) {
          const wilayaCode = String(row['رمز الولاية'] || row['wilaya_code'] || '').padStart(2, '0');
          const officePrice = parseFloat(row['سعر المكتب'] || row['office_price']) || 0;
          const homePrice = parseFloat(row['سعر المنزل'] || row['home_price']) || 0;

          await supabase
            .from('shipping_rates')
            .update({ office_price: officePrice, home_price: homePrice })
            .eq('wilaya_code', wilayaCode);
        }

        showToast('تم استيراد البيانات بنجاح', 'success');
        fetchRates();
      } catch (error) {
        showToast('حدث خطأ أثناء استيراد الملف', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  const hasChanges = Object.keys(editedRates).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">أسعار التوصيل</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
            <span className="inline-flex items-center justify-center font-medium rounded-lg transition-colors px-4 py-2 text-base border-2 border-primary-600 text-primary-600 hover:bg-primary-50">
              <Upload className="w-4 h-4 ml-2" />
              استيراد
            </span>
          </label>
          {hasChanges && (
            <Button onClick={handleSave} isLoading={saving}>
              <Save className="w-4 h-4 ml-2" />
              حفظ التغييرات
            </Button>
          )}
        </div>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="py-12"><Loader size="lg" className="mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right border-b bg-gray-50">
                  <th className="p-4 font-medium text-gray-500 text-sm">الرمز</th>
                  <th className="p-4 font-medium text-gray-500 text-sm">الولاية</th>
                  <th className="p-4 font-medium text-gray-500 text-sm">سعر المكتب ({config.store.currency})</th>
                  <th className="p-4 font-medium text-gray-500 text-sm">سعر المنزل ({config.store.currency})</th>
                  <th className="p-4 font-medium text-gray-500 text-sm">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => {
                  const edited = editedRates[rate.id] || {};
                  const officePrice = edited.office_price ?? rate.office_price;
                  const homePrice = edited.home_price ?? rate.home_price;
                  const isActive = edited.is_active ?? rate.is_active;

                  return (
                    <tr key={rate.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-mono text-sm">{rate.wilaya_code}</td>
                      <td className="p-4 font-medium">{rate.wilaya_name}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          value={officePrice}
                          onChange={(e) => handleRateChange(rate.id, 'office_price', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          value={homePrice}
                          onChange={(e) => handleRateChange(rate.id, 'home_price', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="p-4">
                        <select
                          value={isActive.toString()}
                          onChange={(e) => handleRateChange(rate.id, 'is_active', e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="true">نشط</option>
                          <option value="false">غير نشط</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
