import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { Navigation, Plus, MapPin, Star, Menu as MenuIcon } from 'lucide-react';
import { supabase, Report, getActiveReports } from '../supabaseClient';
import { ReportModal } from './ReportModal';
import { VoteButtons } from './VoteButtons';
import { Menu } from './Menu';
import { WarningSystem } from './WarningSystem';
import { WarningControls } from './WarningControls';
import { UserProfile } from './UserProfile';
import { REPORT_TYPES, ReportType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: LatLngTuple = [-6.597, 106.799];
const DEFAULT_ZOOM = 12;

function LocationMarker({
  onLocationSelect,
  isPinMode
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  isPinMode: boolean;
}) {
  const [mousePosition, setMousePosition] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
    mousemove(e) {
      if (isPinMode) {
        setMousePosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else {
        setMousePosition(null);
      }
    },
    mouseout() {
      setMousePosition(null);
    },
  });

  // Show visual pin indicator when in pin mode and mouse is over map
  if (isPinMode && mousePosition) {
    return (
      <Marker
        position={[mousePosition.lat, mousePosition.lng]}
        icon={new Icon({
          iconUrl: `data:image/svg+xml;base64,${btoa(`
            <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="#3B82F6" opacity="0.8" stroke="#ffffff" stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="#ffffff"/>
            </svg>
          `)}`,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        })}
        interactive={false}
      />
    );
  }

  return null;
}

function LocateMeButton() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 15, { duration: 1.5 });
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi diaktifkan.');
          setIsLocating(false);
        }
      );
    } else {
      alert('Geolocation tidak didukung di browser Anda.');
      setIsLocating(false);
    }
  };

  return (
    <button
      onClick={handleLocateMe}
      disabled={isLocating}
      className="absolute top-20 right-4 z-[999] bg-white p-2 sm:p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      aria-label="Locate me"
      title="Temukan Lokasi Saya"
    >
      <Navigation className={`w-5 h-5 sm:w-6 sm:h-6 text-blue-600 ${isLocating ? 'animate-pulse' : ''}`} />
    </button>
  );
}

export function MapView() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [reportTrustScores, setReportTrustScores] = useState<Record<string, number>>({});
  const [isPinMode, setIsPinMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [warningRadius, setWarningRadius] = useState(2); // Default 2km
  const [isWarningEnabled, setIsWarningEnabled] = useState(true); // Default enabled for safety
  const [enabledHazardTypes, setEnabledHazardTypes] = useState<Set<ReportType>>(
    new Set(REPORT_TYPES.map(rt => rt.value))
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const iconCache = useRef(new Map<string, Icon>());

  const CATEGORY_ICONS: Record<ReportType, string> = {
    banjir: 'M12 22c4.97 0 9-4.03 9-9-4.5 0-4.5-5-9-5s-4.5 5-9 5c0 4.97 4.03 9 9 9z', // Water drop/wave
    macet: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z', // Car
    kriminal: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 10c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z', // Shield/Person
    jalan_rusak: 'M12 2L1 21h22L12 2zm0 3.45l8.43 14.55H3.57L12 5.45z M11 10h2v6h-2zm0 8h2v2h-2z', // Warning/Cone-ish
    lampu_mati: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z', // Lightbulb
  };

  const createCustomIcon = useCallback((color: string, iconPath: string, verified: boolean = false): Icon => {
    const svgIcon = verified ? `
      <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C9.163 0 2 7.163 2 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}" stroke="#FFD700" stroke-width="3"/>
        <circle cx="18" cy="16" r="8" fill="white" opacity="0.2"/>
        <path d="${iconPath}" transform="translate(9, 7) scale(0.75)" fill="white"/>
        <path d="M18 10l1.5 3 3.5 0.5-2.5 2.5 0.5 3.5-3-1.5-3 1.5 0.5-3.5-2.5-2.5 3.5-0.5z" fill="#FFD700" transform="translate(10, -12)"/>
      </svg>
    ` : `
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}"/>
        <circle cx="16" cy="16" r="8" fill="white" opacity="0.2"/>
        <path d="${iconPath}" transform="translate(7, 7) scale(0.75)" fill="white"/>
      </svg>
    `;

    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
      iconSize: verified ? [36, 46] : [32, 42],
      iconAnchor: verified ? [18, 46] : [16, 42],
      popupAnchor: [0, verified ? -46 : -42],
    });
  }, []);

  const getIconForType = useCallback((type: ReportType, trustScore: number = 0): Icon => {
    const verified = trustScore > 5;
    const cacheKey = `${type}-${verified}`;

    if (!iconCache.current.has(cacheKey)) {
      const reportType = REPORT_TYPES.find(rt => rt.value === type);
      const color = reportType?.color || '#6B7280';
      const iconPath = CATEGORY_ICONS[type];
      iconCache.current.set(cacheKey, createCustomIcon(color, iconPath, verified));
    }
    return iconCache.current.get(cacheKey)!;
  }, [createCustomIcon]);

  useEffect(() => {
    fetchReports();

    const subscription = supabase
      .channel('reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Continuous location tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Center map on user location once
  function MapRecenter({ location, hasCentered, setHasCentered }: { location: { lat: number; lng: number } | null, hasCentered: boolean, setHasCentered: (v: boolean) => void }) {
    const map = useMap();
    useEffect(() => {
      if (location && !hasCentered) {
        map.flyTo([location.lat, location.lng], 15);
        setHasCentered(true);
      }
    }, [location, hasCentered, map, setHasCentered]);
    return null;
  }

  const fetchReports = async () => {
    try {
      const activeReports = await getActiveReports();
      setReports(activeReports);

      const trustScores: Record<string, number> = {};
      activeReports.forEach(report => {
        trustScores[report.id] = report.trust_score;
      });
      setReportTrustScores(trustScores);
    } catch (error) {
      console.error('Error fetching active reports:', error);
    }
  };

  const handleFabClick = () => {
    setIsPinMode(true);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (isPinMode) {
      setSelectedLocation({ lat, lng });
      setShowModal(true);
      setIsPinMode(false);
    }
  };

  const handleReportSubmit = async (type: ReportType, description: string) => {
    if (!selectedLocation) return;

    const { data, error } = await supabase.from('reports').insert([
      {
        type,
        description: description || null,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        user_id: user?.id,
      },
    ]).select().single();

    if (error) {
      console.error('Error creating report:', error);
      alert('Gagal mengirim laporan. Silakan coba lagi.');
    } else {
      if (data) {
        setReports(prev => [data as Report, ...prev]);
      }
      setShowModal(false);
      setSelectedLocation(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedLocation(null);
    setIsPinMode(false);
  };

  const handleVoteSuccess = (reportId: string, newTrustScore: number) => {
    setReportTrustScores(prev => ({
      ...prev,
      [reportId]: newTrustScore
    }));

    setReports(prev => prev.map(report =>
      report.id === reportId ? { ...report, trust_score: newTrustScore } : report
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const handleHazardTypeToggle = (type: ReportType) => {
    setEnabledHazardTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Filter reports based on enabled hazard types
  const filteredReports = reports.filter((report) =>
    enabledHazardTypes.has(report.type)
  );

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className={`w-full h-full ${isPinMode ? 'cursor-pin' : ''}`}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter location={userLocation} hasCentered={hasCentered} setHasCentered={setHasCentered} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={new Icon({
              iconUrl: `data:image/svg+xml;base64,${btoa(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="12" fill="#3B82F6" stroke="white" stroke-width="1" opacity="0.9"/>
                  <circle cx="20" cy="20" r="8" fill="white"/>
                  <path d="M14 24 Q20 30 26 24" stroke="white" stroke-width="1" fill="none" stroke-linecap="round"/>
                  <circle cx="16" cy="16" r="2" fill="#1E40AF"/>
                  <circle cx="24" cy="16" r="2" fill="#1E40AF"/>
                </svg>
              `)}`,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            })}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-gray-900">Lokasi Anda</p>
                <p className="text-xs text-gray-500">Anda ada di sini</p>
              </div>
            </Popup>
          </Marker>
        )}

        <LocationMarker onLocationSelect={handleLocationSelect} isPinMode={isPinMode} />
        <LocateMeButton />

        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="absolute top-4 left-4 z-[999] bg-white p-2 sm:p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Open menu"
          title="Menu"
        >
          <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </button>

        {filteredReports.map((report) => {
          const currentTrustScore = reportTrustScores[report.id] ?? report.trust_score;
          const isVerified = currentTrustScore > 5;

          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={getIconForType(report.type, currentTrustScore)}
            >
              <Popup>
                <div className="p-2 min-w-[240px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: REPORT_TYPES.find(rt => rt.value === report.type)?.color }}
                    />
                    <h3 className="font-semibold text-gray-900 flex-1">
                      {REPORT_TYPES.find((rt) => rt.value === report.type)?.label}
                    </h3>
                    {isVerified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        Terverifikasi
                      </span>
                    )}
                  </div>
                  {report.description && (
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  )}
                  <p className="text-xs text-gray-500">{formatDate(report.created_at)}</p>
                  {report.is_resolved && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Terselesaikan
                    </span>
                  )}
                  <VoteButtons
                    reportId={report.id}
                    initialTrustScore={currentTrustScore}
                    onVoteChange={(newScore) => handleVoteSuccess(report.id, newScore)}
                  />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {user && (
        <button
          onClick={handleFabClick}
          disabled={isPinMode}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[999] bg-blue-600 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${isPinMode ? 'animate-pulse' : ''
            }`}
          aria-label="Add report"
          title="Tambah Laporan"
        >
          {isPinMode ? <MapPin className="w-6 h-6 sm:w-7 sm:h-7" /> : <Plus className="w-6 h-6 sm:w-7 sm:h-7" />}
        </button>
      )}

      {isPinMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[998] pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-blue-600">
            <p className="text-sm font-medium text-gray-900">Klik pada peta untuk memilih lokasi</p>
          </div>
        </div>
      )}

      {showModal && selectedLocation && (
        <ReportModal
          isOpen={true}
          onClose={handleModalClose}
          onSubmit={handleReportSubmit}
          userLocation={{ latitude: selectedLocation.lat, longitude: selectedLocation.lng }}
        />
      )}

      {/* Menu */}
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* User Profile */}
      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        allReports={reports}
      />

      {/* Warning System */}
      <WarningSystem
        isEnabled={isWarningEnabled}
        warningRadius={warningRadius}
        userLocation={userLocation}
        reports={reports}
        enabledHazardTypes={enabledHazardTypes}
      />

      {/* Warning Controls */}
      <WarningControls
        warningRadius={warningRadius}
        onWarningRadiusChange={setWarningRadius}
        enabledHazardTypes={enabledHazardTypes}
        onHazardTypeToggle={handleHazardTypeToggle}
        isWarningEnabled={isWarningEnabled}
        onWarningToggle={setIsWarningEnabled}
      />
    </div>
  );
}
