import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

export function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('position');
    setCategories(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    } else {
      showToast('تم حذف التصنيف بنجاح', 'success');
      fetchCategories();
    }
  }

  // Build tree structure
  const rootCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">التصنيفات</h1>
        <Button onClick={() => { setEditingCategory(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة تصنيف
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="py-12"><Loader size="lg" className="mx-auto" /></div>
        ) : categories.length > 0 ? (
          <div className="space-y-2">
            {rootCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                children={getChildren(category.id)}
                allCategories={categories}
                onEdit={(c: any) => { setEditingCategory(c); setShowModal(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تصنيفات</p>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}>
        <CategoryForm
          category={editingCategory}
          categories={categories.filter(c => c.id !== editingCategory?.id)}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchCategories(); }}
        />
      </Modal>
    </div>
  );
}

function CategoryItem({ category, children, allCategories, onEdit, onDelete }: any) {
  const getChildren = (parentId: string): any[] => allCategories.filter((c: any) => c.parent_id === parentId);

  return (
    <div>
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
        <div className="flex items-center gap-3">
          {category.image_url ? (
            <img src={category.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-xs text-gray-500">{category.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
            {category.is_active ? 'نشط' : 'غير نشط'}
          </span>
          <button onClick={() => onEdit(category)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {children.length > 0 && (
        <div className="mr-8 mt-2 space-y-2 border-r-2 border-gray-200 pr-4">
          {children.map((child: any) => (
            <CategoryItem
              key={child.id}
              category={child}
              children={getChildren(child.id)}
              allCategories={allCategories}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryForm({ category, categories, onClose, onSuccess }: any) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    parent_id: category?.parent_id || '',
    position: category?.position || 0,
    is_active: category?.is_active ?? true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    const data = {
      ...formData,
      slug,
      parent_id: formData.parent_id || null,
      position: parseInt(formData.position as string) || 0
    };

    let error;
    if (category) {
      ({ error } = await supabase.from('categories').update(data).eq('id', category.id));
    } else {
      ({ error } = await supabase.from('categories').insert(data));
    }

    if (error) {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } else {
      showToast(category ? 'تم تحديث التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح', 'success');
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="اسم التصنيف"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <Input
        label="الرابط (slug)"
        name="slug"
        value={formData.slug}
        onChange={handleChange}
        placeholder="يُنشأ تلقائياً"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف الأب</label>
        <select
          name="parent_id"
          value={formData.parent_id}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">بدون (تصنيف رئيسي)</option>
          {categories.filter((c: any) => !c.parent_id).map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <Input
        label="الترتيب"
        name="position"
        type="number"
        value={formData.position}
        onChange={handleChange}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          تفعيل التصنيف
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" isLoading={loading}>
          {category ? 'تحديث' : 'إضافة'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
