import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Menu as MenuIcon } from 'lucide-react';
import { MapView } from './components/MapView';
import { Menu } from './components/Menu';
import { UserProfile } from './components/UserProfile';
import { getActiveReports } from './supabaseClient';
import { Report, ReportType, REPORT_TYPES } from './types';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [warningRadius, setWarningRadius] = useState(2); // Default 2km
  const [enabledHazardTypes, setEnabledHazardTypes] = useState<Set<ReportType>>(
    new Set(REPORT_TYPES.map(t => t.value))
  );
  const [isWarningEnabled, setIsWarningEnabled] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Load initial reports
  useEffect(() => {
    loadReports();

    // Set up real-time subscription or polling could go here
    const interval = setInterval(loadReports, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const loadReports = async () => {
    try {
      const data = await getActiveReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleReportSubmit = () => {
    loadReports();
  };

  const toggleHazardType = (type: ReportType) => {
    setEnabledHazardTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <AuthProvider>
      <div className="h-screen w-screen relative overflow-hidden">
        <Toaster position="top-center" />

        <MapView
          reports={reports}
          onReportSubmit={handleReportSubmit}
          userLocation={userLocation}
          warningRadius={warningRadius}
          enabledHazardTypes={enabledHazardTypes}
          isWarningEnabled={isWarningEnabled}
        />

        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="absolute top-4 left-4 z-[1000] p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon className="w-6 h-6 text-gray-700" />
        </button>

        <Menu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          warningRadius={warningRadius}
          onWarningRadiusChange={setWarningRadius}
          enabledHazardTypes={enabledHazardTypes}
          onHazardTypeToggle={toggleHazardType}
          isWarningEnabled={isWarningEnabled}
          onWarningToggle={setIsWarningEnabled}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        <UserProfile
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          allReports={reports}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
