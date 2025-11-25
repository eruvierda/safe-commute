import { X, Settings, Bell, Filter, MapPin } from 'lucide-react';
import { REPORT_TYPES, ReportType } from '../types';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  warningRadius: number;
  onWarningRadiusChange: (radius: number) => void;
  enabledHazardTypes: Set<ReportType>;
  onHazardTypeToggle: (type: ReportType) => void;
  isWarningEnabled: boolean;
  onWarningToggle: (enabled: boolean) => void;
}

export function Menu({
  isOpen,
  onClose,
  warningRadius,
  onWarningRadiusChange,
  enabledHazardTypes,
  onHazardTypeToggle,
  isWarningEnabled,
  onWarningToggle,
}: MenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[1001] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pengaturan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning System Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Sistem Peringatan</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Aktifkan Peringatan
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Dapatkan notifikasi saat mendekati bahaya
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isWarningEnabled}
                    onChange={(e) => onWarningToggle(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {isWarningEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radius Peringatan: {warningRadius} km
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={warningRadius}
                    onChange={(e) => onWarningRadiusChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5 km</span>
                    <span>5 km</span>
                    <span>10 km</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Anda akan mendapat peringatan jika ada bahaya dalam radius ini
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Filter Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter Bahaya</h3>
            </div>

            <div className="space-y-2">
              {REPORT_TYPES.map((reportType) => {
                const isEnabled = enabledHazardTypes.has(reportType.value);
                return (
                  <label
                    key={reportType.value}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => onHazardTypeToggle(reportType.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: reportType.color }}
                    />
                    <span className="flex-1 text-sm font-medium text-gray-700">
                      {reportType.label}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Pilih jenis bahaya yang ingin ditampilkan di peta
            </p>
          </section>

          {/* Info Section */}
          <section className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tentang</h3>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                SafeCommute membantu Anda menghindari bahaya di jalan dengan sistem
                peringatan berbasis radius.
              </p>
              <p>
                Aktifkan sistem peringatan untuk mendapatkan notifikasi saat mendekati
                area bahaya.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

