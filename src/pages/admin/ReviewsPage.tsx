import { useState, useEffect } from 'react';
import { Star, Check, X, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export function ReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  async function fetchReviews() {
    setLoading(true);
    let query = supabase.from('reviews').select('*, product:products(id, name)').order('created_at', { ascending: false });
    
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setReviews(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
    if (error) {
      showToast('حدث خطأ أثناء التحديث', 'error');
    } else {
      showToast('تم تحديث حالة التقييم', 'success');
      fetchReviews();
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">موافق عليه</Badge>;
      case 'rejected': return <Badge variant="danger">مرفوض</Badge>;
      case 'hidden': return <Badge variant="default">مخفي</Badge>;
      default: return <Badge variant="warning">قيد المراجعة</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">التقييمات</h1>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'hidden', ''].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === '' ? 'الكل' :
               status === 'pending' ? 'قيد المراجعة' :
               status === 'approved' ? 'موافق عليها' :
               status === 'rejected' ? 'مرفوضة' : 'مخفية'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="py-12"><Loader size="lg" className="mx-auto" /></div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{review.customer_name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      {getStatusBadge(review.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      المنتج: <span className="text-gray-900">{review.product?.name || 'غير معروف'}</span>
                    </p>
                    <p className="text-gray-700">{review.text}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((img: string, idx: number) => (
                          <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(review.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {review.status !== 'approved' && (
                      <Button size="sm" variant="primary" onClick={() => updateStatus(review.id, 'approved')}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {review.status !== 'rejected' && (
                      <Button size="sm" variant="danger" onClick={() => updateStatus(review.id, 'rejected')}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    {review.status !== 'hidden' && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(review.id, 'hidden')}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تقييمات</p>
          </div>
        )}
      </Card>
    </div>
  );
}
