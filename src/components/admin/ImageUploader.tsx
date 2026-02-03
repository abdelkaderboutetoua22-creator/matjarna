import { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/utils/cn';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  cf_image_id: string | null;
  position: number;
  is_primary: boolean;
}

interface ImageUploaderProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  disabled?: boolean;
}

export function ImageUploader({
  productId,
  images,
  onImagesChange,
  disabled = false,
}: ImageUploaderProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!productId) {
        showToast('يجب حفظ المنتج أولاً قبل رفع الصور', 'error');
        return null;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('يرجى رفع ملف صورة فقط', 'error');
        return null;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast('حجم الصورة يجب أن يكون أقل من 10 ميغابايت', 'error');
        return null;
      }

      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        return null;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);
      formData.append('isPrimary', images.length === 0 ? 'true' : 'false');

      try {
        const response = await fetch('/api/images/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          console.error('Upload error:', result);
          throw new Error(result.message || result.error || 'فشل رفع الصورة');
        }

        return result.image as ProductImage;
      } catch (error) {
        console.error('Upload error:', error);
        const msg = error instanceof Error ? error.message : 'فشل رفع الصورة';
        showToast(msg, 'error');
        return null;
      }
    },
    [productId, images.length, showToast]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled || uploading) return;

      const fileArray = Array.from(files).slice(0, 10); // Max 10 files at once
      if (fileArray.length === 0) return;

      setUploading(true);
      const newImages: ProductImage[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`جاري رفع ${i + 1} من ${fileArray.length}...`);

        const uploaded = await uploadFile(file);
        if (uploaded) {
          newImages.push(uploaded);
        }
      }

      setUploading(false);
      setUploadProgress(null);

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        showToast(`تم رفع ${newImages.length} صورة بنجاح`, 'success');
      }
    },
    [disabled, uploading, uploadFile, images, onImagesChange, showToast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = async (imageId: string) => {
    if (disabled) return;

    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذه الصورة؟');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('product_images').delete().eq('id', imageId);

      if (error) {
        throw error;
      }

      const remaining = images.filter((img) => img.id !== imageId);

      // If we deleted the primary, make the first remaining image primary
      if (remaining.length > 0 && !remaining.some((img) => img.is_primary)) {
        await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', remaining[0].id);
        remaining[0].is_primary = true;
      }

      onImagesChange(remaining);
      showToast('تم حذف الصورة', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('فشل حذف الصورة', 'error');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (disabled) return;

    try {
      // Clear all primaries first
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Set the new primary
      await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId);

      // Update local state
      const updated = images.map((img) => ({
        ...img,
        is_primary: img.id === imageId,
      }));
      onImagesChange(updated);
      showToast('تم تعيين الصورة الرئيسية', 'success');
    } catch (error) {
      console.error('Set primary error:', error);
      showToast('فشل تعيين الصورة الرئيسية', 'error');
    }
  };

  const sortedImages = [...images].sort((a, b) => {
    // Primary first, then by position
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.position - b.position;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">صور المنتج</label>
        <span className="text-xs text-gray-500">{images.length} صورة</span>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400',
          (disabled || uploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-gray-600">{uploadProgress || 'جاري الرفع...'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              اسحب الصور هنا أو <span className="text-primary-600 font-medium">اختر ملفات</span>
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP حتى 10MB</p>
          </div>
        )}
      </div>

      {/* No product ID warning */}
      {!productId && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>يجب حفظ المنتج أولاً قبل رفع الصور</span>
        </div>
      )}

      {/* Images Grid */}
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              className={cn(
                'relative group rounded-lg overflow-hidden border-2 aspect-square',
                image.is_primary ? 'border-primary-500' : 'border-gray-200'
              )}
            >
              <img
                src={image.image_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  رئيسية
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(image.id);
                    }}
                    disabled={disabled}
                    title="تعيين كرئيسية"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(image.id);
                  }}
                  disabled={disabled}
                  title="حذف"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && productId && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">لا توجد صور بعد</p>
        </div>
      )}
    </div>
  );
}
