import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Report, ReportType } from '../types';
import { REPORT_TYPES } from '../types';
import { calculateDistance } from '../utils/distance';

interface WarningSystemProps {
  isEnabled: boolean;
  warningRadius: number;
  userLocation: { lat: number; lng: number } | null;
  reports: Report[];
  enabledHazardTypes: Set<ReportType>;
}

interface Warning {
  id: string;
  report: Report;
  distance: number;
}

export function WarningSystem({
  isEnabled,
  warningRadius,
  userLocation,
  reports,
  enabledHazardTypes,
}: WarningSystemProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isEnabled || !userLocation || warningRadius <= 0) {
      setWarnings([]);
      return;
    }

    const nearbyReports: Warning[] = [];

    reports.forEach((report) => {
      // Only check enabled hazard types
      if (!enabledHazardTypes.has(report.type)) {
        return;
      }

      // Skip resolved reports
      if (report.is_resolved) {
        return;
      }

      // Skip reports with very negative trust scores
      if (report.trust_score <= -3) {
        return;
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        report.latitude,
        report.longitude
      );

      if (distance <= warningRadius) {
        nearbyReports.push({
          id: report.id,
          report,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        });
      }
    });

    // Sort by distance (closest first)
    nearbyReports.sort((a, b) => a.distance - b.distance);

    // Filter out dismissed warnings
    const activeWarnings = nearbyReports.filter(
      (w) => !dismissedWarnings.has(w.id)
    );

    setWarnings(activeWarnings);

    // Play sound for new warnings (only if there are warnings and audio is available)
    if (activeWarnings.length > 0 && audioRef.current) {
      try {
        audioRef.current.play().catch(() => {
          // Ignore audio play errors (user interaction required)
        });
      } catch (error) {
        // Ignore audio errors
      }
    }
  }, [isEnabled, warningRadius, userLocation, reports, enabledHazardTypes, dismissedWarnings]);

  // Reset dismissed warnings when settings change
  useEffect(() => {
    setDismissedWarnings(new Set());
  }, [warningRadius, enabledHazardTypes]);

  const handleDismiss = (warningId: string) => {
    setDismissedWarnings((prev) => new Set([...prev, warningId]));
  };

  if (!isEnabled || warnings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element for warning sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSdTgwOUKzn8LZjGwU8k9nyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDknU4MDlCs5/C2YxsFPJPZ8sx5LAUkd8fw3ZBAC" type="audio/wav" />
      </audio>

      <div className="fixed top-24 left-4 right-4 sm:left-auto sm:right-4 sm:top-24 sm:w-80 z-[1002] space-y-3 pointer-events-none">
        {warnings.slice(0, 3).map((warning) => {
          const reportTypeInfo = REPORT_TYPES.find(
            (rt) => rt.value === warning.report.type
          );

          return (
            <div
              key={warning.id}
              className="bg-white/95 backdrop-blur-md border border-red-200 rounded-xl shadow-xl p-4 animate-in slide-in-from-top duration-300 pointer-events-auto ring-1 ring-red-100"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full ring-2 ring-red-50"
                      style={{ backgroundColor: reportTypeInfo?.color }}
                    />
                    <h4 className="font-bold text-gray-900 text-sm leading-none">
                      {reportTypeInfo?.label}
                    </h4>
                  </div>
                  <p className="text-sm text-red-600 font-semibold mt-1">
                    {warning.distance} km <span className="text-gray-500 font-normal">dari lokasi Anda</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(warning.id)}
                  className="flex-shrink-0 -mr-2 -mt-2 p-3 hover:bg-gray-50 rounded-full transition-colors group"
                  aria-label="Dismiss warning"
                >
                  <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
            </div>
          );
        })}
        {warnings.length > 3 && (
          <div className="bg-white/90 backdrop-blur pointer-events-auto border border-yellow-400/50 rounded-xl p-3 text-center shadow-lg">
            <p className="text-xs text-yellow-800 font-bold uppercase tracking-wide">
              +{warnings.length - 3} bahaya lainnya dalam radius
            </p>
          </div>
        )}
      </div>
    </>
  );
}

