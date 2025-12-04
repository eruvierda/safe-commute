import { useState } from 'react';
import { Navigation, AlertTriangle, X } from 'lucide-react';
import { SearchControl } from './SearchControl';
import { Report } from '../types';
import { fetchRoute, checkRouteHazards, RouteResult } from '../utils/routing';

interface RoutePlannerProps {
    userLocation: { lat: number; lng: number } | null;
    reports: Report[];
    onRouteFound: (route: RouteResult) => void;
    onClearRoute: () => void;
}

export function RoutePlanner({ userLocation, reports, onRouteFound, onClearRoute }: RoutePlannerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; hazardCount: number } | null>(null);

    const handleGetDirections = async () => {
        if (!userLocation || !destination) return;

        setIsLoading(true);
        try {
            const data = await fetchRoute(userLocation, destination);

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates; // [lng, lat]

                const hazards = checkRouteHazards(coordinates, reports);

                // Convert [lng, lat] to [lat, lng] for Leaflet
                const leafletCoordinates = coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);

                const result: RouteResult = {
                    geometry: leafletCoordinates,
                    distance: route.distance,
                    duration: route.duration,
                    hazardsOnRoute: hazards
                };

                setRouteInfo({
                    distance: route.distance,
                    duration: route.duration,
                    hazardCount: hazards.length
                });

                onRouteFound(result);
            }
        } catch (error) {
            console.error('Failed to get directions:', error);
            alert('Gagal mencari rute. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.round(seconds / 60);
        if (mins < 60) return `${mins} mnt`;
        const hrs = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hrs} jam ${remainingMins} mnt`;
    };

    const formatDistance = (meters: number) => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                title="Rute Perjalanan"
            >
                <Navigation className="w-6 h-6 text-blue-600" />
            </button>
        );
    }

    return (
        <div className="absolute top-4 right-4 z-[1000] w-80 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    Rute Perjalanan
                </h3>
                <button onClick={() => { setIsOpen(false); onClearRoute(); setRouteInfo(null); }} className="hover:bg-blue-700 p-1 rounded">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
                {/* Start Location (Fixed to User Location for now) */}
                <div className="relative">
                    <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                    <input
                        type="text"
                        value="Lokasi Saya"
                        disabled
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
                    />
                </div>

                {/* Destination Input - Reusing logic or simplified input */}
                {/* For simplicity, we'll use a placeholder or integrate SearchControl logic later. 
            For now, let's assume the user selects a destination on the map or uses the main search.
            Actually, let's make it simple: User searches on main map, clicks a "Route Here" button on popup?
            OR we embed a simple search here.
        */}
                <div className="text-sm text-gray-500 italic">
                    Gunakan pencarian utama untuk memilih tujuan, lalu klik tombol di bawah.
                    (Temporary: Click 'Get Directions' to route to currently selected search result)
                </div>

                <button
                    onClick={handleGetDirections}
                    disabled={isLoading || !userLocation}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isLoading ? 'Mencari Rute...' : 'Cari Rute'}
                </button>

                {routeInfo && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Jarak:</span>
                            <span className="font-medium">{formatDistance(routeInfo.distance)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Waktu:</span>
                            <span className="font-medium">{formatDuration(routeInfo.duration)}</span>
                        </div>

                        {routeInfo.hazardCount > 0 ? (
                            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-red-700 text-sm flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>Waspada! Ada {routeInfo.hazardCount} bahaya di rute ini.</span>
                            </div>
                        ) : (
                            <div className="mt-2 text-green-600 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Rute aman dari bahaya yang dilaporkan.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
