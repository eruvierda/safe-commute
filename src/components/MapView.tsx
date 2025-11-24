import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { Navigation, Plus, MapPin, Star } from 'lucide-react';
import { supabase, Report, getActiveReports } from '../supabaseClient';
import { ReportModal } from './ReportModal';
import { VoteButtons } from './VoteButtons';
import { REPORT_TYPES, ReportType } from '../types';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: LatLngTuple = [-6.597, 106.799];
const DEFAULT_ZOOM = 12;

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
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
      className="absolute top-4 right-4 z-[999] bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      aria-label="Locate me"
      title="Temukan Lokasi Saya"
    >
      <Navigation className={`w-6 h-6 text-blue-600 ${isLocating ? 'animate-pulse' : ''}`} />
    </button>
  );
}

export function MapView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportTrustScores, setReportTrustScores] = useState<Record<string, number>>({});
  const [isPinMode, setIsPinMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const iconCache = useRef(new Map<string, Icon>());
  
  const createCustomIcon = useCallback((color: string, verified: boolean = false): Icon => {
    const svgIcon = verified ? `
      <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C9.163 0 2 7.163 2 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}" stroke="#FFD700" stroke-width="3"/>
        <circle cx="18" cy="16" r="6" fill="white"/>
        <path d="M18 10l1.5 3 3.5 0.5-2.5 2.5 0.5 3.5-3-1.5-3 1.5 0.5-3.5-2.5-2.5 3.5-0.5z" fill="#FFD700"/>
      </svg>
    ` : `
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
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
      iconCache.current.set(cacheKey, createCustomIcon(color, verified));
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

    const { error } = await supabase.from('reports').insert([
      {
        type,
        description: description || null,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      },
    ]);

    if (error) {
      console.error('Error creating report:', error);
      alert('Gagal mengirim laporan. Silakan coba lagi.');
    } else {
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

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className={`w-full h-full ${isPinMode ? 'cursor-crosshair' : ''}`}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker onLocationSelect={handleLocationSelect} />
        <LocateMeButton />

        {reports.map((report) => {
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
                    onVoteSuccess={(newScore) => handleVoteSuccess(report.id, newScore)}
                  />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <button
        onClick={handleFabClick}
        disabled={isPinMode}
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[999] bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
          isPinMode ? 'animate-pulse' : ''
        }`}
        aria-label="Add report"
        title="Tambah Laporan"
      >
        {isPinMode ? <MapPin className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
      </button>

      {isPinMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[998] pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-blue-600">
            <p className="text-sm font-medium text-gray-900">Klik pada peta untuk memilih lokasi</p>
          </div>
        </div>
      )}

      {showModal && selectedLocation && (
        <ReportModal
          onClose={handleModalClose}
          onSubmit={handleReportSubmit}
          latitude={selectedLocation.lat}
          longitude={selectedLocation.lng}
        />
      )}
    </div>
  );
}
