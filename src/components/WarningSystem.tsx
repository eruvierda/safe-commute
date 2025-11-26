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

      <div className="fixed top-36 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[1002] space-y-2">
        {warnings.slice(0, 3).map((warning) => {
          const reportTypeInfo = REPORT_TYPES.find(
            (rt) => rt.value === warning.report.type
          );

          return (
            <div
              key={warning.id}
              className="bg-red-50 border-2 border-red-500 rounded-lg shadow-lg p-2.5 animate-in slide-in-from-top duration-300"
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: reportTypeInfo?.color }}
                    />
                    <h4 className="font-semibold text-red-900 text-xs">
                      {reportTypeInfo?.label}
                    </h4>
                  </div>
                  <p className="text-xs text-red-700 font-medium mt-0.5">
                    {warning.distance} km dari lokasi Anda
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(warning.id)}
                  className="flex-shrink-0 p-0.5 hover:bg-red-100 rounded transition-colors"
                  aria-label="Dismiss warning"
                >
                  <X className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            </div>
          );
        })}
        {warnings.length > 3 && (
          <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-2 text-center">
            <p className="text-xs text-yellow-800 font-medium">
              +{warnings.length - 3} bahaya lainnya dalam radius
            </p>
          </div>
        )}
      </div>
    </>
  );
}

