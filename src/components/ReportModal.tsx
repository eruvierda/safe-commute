import { useState } from 'react';
import { X } from 'lucide-react';
import { REPORT_TYPES, ReportType } from '../types';
import { validateDescription } from '../utils/validation';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (type: ReportType, description: string) => void;
  latitude: number;
  longitude: number;
}

export function ReportModal({ onClose, onSubmit, latitude, longitude }: ReportModalProps) {
  const [type, setType] = useState<ReportType>('banjir');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);

    // Validate description
    const validation = validateDescription(value);
    setDescriptionError(validation.valid ? null : validation.error || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation before submit
    const validation = validateDescription(description);
    if (!validation.valid) {
      setDescriptionError(validation.error || 'Deskripsi tidak valid');
      return;
    }

    setIsSubmitting(true);
    await onSubmit(type, description);
    setIsSubmitting(false);
  };

  const charCount = description.length;
  const maxChars = 500;
  const isNearLimit = charCount > maxChars * 0.8;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">Laporkan Bahaya</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            <p className="font-medium">Lokasi:</p>
            <p>{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Bahaya *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            >
              {REPORT_TYPES.map((reportType) => (
                <option key={reportType.value} value={reportType.value}>
                  {reportType.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi (Opsional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Tambahkan detail tentang bahaya ini..."
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none ${descriptionError ? 'border-red-500' : 'border-gray-300'
                }`}
              maxLength={maxChars}
            />
            <div className="mt-1 flex justify-between items-center">
              {descriptionError ? (
                <p className="text-sm text-red-600">{descriptionError}</p>
              ) : (
                <span className="text-sm text-gray-500">Maksimal {maxChars} karakter</span>
              )}
              <span className={`text-sm ${isNearLimit ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                {charCount}/{maxChars}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!descriptionError}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
