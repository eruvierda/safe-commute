import { useState } from 'react';
import { X, MapPin, AlertTriangle, Loader2, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './Auth/AuthModal';
import { REPORT_TYPES, ReportType } from '../types';
import { validateDescription } from '../utils/validation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: ReportType, description: string, imageUrl?: string) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export function ReportModal({ isOpen, onClose, onSubmit, userLocation }: ReportModalProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  if (!isOpen) return null;

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);

    // Validate description
    const validation = validateDescription(value);
    setDescriptionError(validation.valid ? null : validation.error || null);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar.');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file terlalu besar (maks 10MB).');
      return;
    }

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 0.2, // Compress to ~200KB
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      setSelectedImage(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Gagal memproses gambar. Silakan coba lagi.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType || !userLocation) {
      // Optionally set an error for type or location if they are not selected/available
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Final validation before submit
    const validation = validateDescription(description);
    if (!validation.valid) {
      setDescriptionError(validation.error || 'Deskripsi tidak valid');
      return;
    }

    setIsSubmitting(true);

    let imageUrl = undefined;

    if (selectedImage) {
      try {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('hazard-photos')
          .upload(filePath, selectedImage);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('hazard-photos')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Gagal mengunggah gambar. Laporan akan dikirim tanpa gambar.');
      }
    }

    await onSubmit(selectedType, description, imageUrl);
    setIsSubmitting(false);
  };

  const charCount = description.length;
  const maxChars = 500;
  const isNearLimit = charCount > maxChars * 0.8;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto transform transition-all">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Laporkan Bahaya</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-brand-50 p-4 rounded-xl text-sm text-brand-900 flex items-center gap-3 border border-brand-100">
            <MapPin className="w-5 h-5 text-brand-600 shrink-0" />
            <div>
              <p className="font-semibold text-brand-900">Lokasi Terpantau:</p>
              <p className="text-brand-700 mt-0.5">{userLocation ? `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}` : 'Lokasi tidak tersedia'}</p>
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
              Jenis Bahaya <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value as ReportType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base bg-white transition-all"
              required
            >
              <option value="" disabled>Pilih jenis bahaya</option>
              {REPORT_TYPES.map((reportType) => (
                <option key={reportType.value} value={reportType.value}>
                  {reportType.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi (Opsional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Jelaskan detail bahaya yang Anda temui..."
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base resize-none transition-all ${descriptionError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              maxLength={maxChars}
            />
            <div className="mt-2 flex justify-between items-center px-1">
              {descriptionError ? (
                <p className="text-sm text-red-600 flex items-center gap-1.5 font-medium"><AlertTriangle className="w-4 h-4" />{descriptionError}</p>
              ) : (
                <span className="text-sm text-gray-500">Maksimal {maxChars} karakter</span>
              )}
              <span className={`text-sm ${isNearLimit ? 'text-orange-600 font-bold' : 'text-gray-400'}`}>
                {charCount}/{maxChars}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Foto Bukti (Opsional)
            </label>

            {!previewUrl ? (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-xl hover:border-brand-500 hover:bg-brand-50/50 transition-all cursor-pointer relative group"
                onClick={() => document.getElementById('image-upload')?.click()}>
                <div className="space-y-1 text-center">
                  {isCompressing ? (
                    <Loader2 className="mx-auto h-12 w-12 text-brand-400 animate-spin" />
                  ) : (
                    <Camera className="mx-auto h-12 w-12 text-gray-400 group-hover:text-brand-500 transition-colors" />
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="image-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-600 hover:text-brand-500 focus-within:outline-none">
                      <span>Ambil Foto</span>
                      <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageSelect} disabled={isCompressing} />
                    </label>
                    <p className="pl-1">atau pilih dari galeri</p>
                  </div>
                  <p className="text-xs text-gray-400">Maksimal 10MB</p>
                </div>
              </div>
            ) : (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-contain bg-black/5" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-full hover:bg-white hover:text-red-600 transition-colors shadow-sm"
                  aria-label="Hapus foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1.5 font-medium">
                  <ImageIcon className="w-3 h-3" />
                  <span>{(selectedImage!.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold"
              disabled={isSubmitting}
              aria-label="Batal membuat laporan"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!descriptionError || !selectedType || !userLocation}
              className="flex-1 px-6 py-3.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
              aria-label="Kirim laporan bahaya"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Mengirim...
                </>
              ) : (
                'Kirim Laporan'
              )}
            </button>
          </div>
        </form>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
      />
    </div>
  );
}
