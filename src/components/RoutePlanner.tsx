import { useState, useRef, useEffect } from 'react';
import { Navigation, AlertTriangle, X, Search, MapPin, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Report } from '../types';
import { fetchRoute, checkRouteHazards, RouteResult } from '../utils/routing';

interface RoutePlannerProps {
    isOpen: boolean;
    onToggle: (isOpen: boolean) => void;
    userLocation: { lat: number; lng: number } | null;
    reports: Report[];
    onRouteFound: (route: RouteResult) => void;
    onClearRoute: () => void;
    initialDestination?: { lat: number; lng: number; name: string } | null;
}

interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

export function RoutePlanner({ isOpen, onToggle, userLocation, reports, onRouteFound, onClearRoute, initialDestination }: RoutePlannerProps) {
    const [startPoint, setStartPoint] = useState<{ lat: number; lng: number; name: string } | null>(null);
    const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(initialDestination || null);
    const [isLoading, setIsLoading] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; hazardCount: number } | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    // Search state for destination
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
    const searchRef = useRef<HTMLDivElement>(null);

    // Search state for start point
    const [startSearchQuery, setStartSearchQuery] = useState('');
    const [startSearchResults, setStartSearchResults] = useState<SearchResult[]>([]);
    const [isStartSearching, setIsStartSearching] = useState(false);
    const [showStartResults, setShowStartResults] = useState(false);
    const startSearchTimeout = useRef<ReturnType<typeof setTimeout>>();
    const startSearchRef = useRef<HTMLDivElement>(null);

    // Update destination when initialDestination changes
    useEffect(() => {
        if (initialDestination) {
            setDestination(initialDestination);
            setSearchQuery(initialDestination.name);
        }
    }, [initialDestination]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
            if (startSearchRef.current && !startSearchRef.current.contains(event.target as Node)) {
                setShowStartResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (query: string) => {
        if (!query.trim() || query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id`
            );
            const data = await response.json();
            setSearchResults(data);
            setShowResults(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (value.length >= 3) {
            searchTimeout.current = setTimeout(() => {
                handleSearch(value);
            }, 800);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const handleSelectDestination = (result: SearchResult) => {
        const dest = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            name: result.display_name.split(',')[0]
        };
        setDestination(dest);
        setSearchQuery(dest.name);
        setShowResults(false);
        setSearchResults([]);
    };

    // Start point search handlers
    const handleStartSearch = async (query: string) => {
        if (!query.trim() || query.length < 3) {
            setStartSearchResults([]);
            setShowStartResults(false);
            return;
        }

        setIsStartSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id`
            );
            const data = await response.json();
            setStartSearchResults(data);
            setShowStartResults(true);
        } catch (error) {
            console.error('Start search error:', error);
        } finally {
            setIsStartSearching(false);
        }
    };

    const handleStartSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStartSearchQuery(value);

        if (startSearchTimeout.current) {
            clearTimeout(startSearchTimeout.current);
        }

        if (value.length >= 3) {
            startSearchTimeout.current = setTimeout(() => {
                handleStartSearch(value);
            }, 800);
        } else {
            setStartSearchResults([]);
            setShowStartResults(false);
        }
    };

    const handleSelectStartPoint = (result: SearchResult) => {
        const start = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            name: result.display_name.split(',')[0]
        };
        setStartPoint(start);
        setStartSearchQuery(start.name);
        setShowStartResults(false);
        setStartSearchResults([]);
    };

    const handleUseMyLocation = () => {
        setStartPoint(null);
        setStartSearchQuery('');
    };

    const handleGetDirections = async () => {
        // Use custom start point if provided, otherwise use user location
        const origin = startPoint || (userLocation ? { lat: userLocation.lat, lng: userLocation.lng, name: 'Lokasi Saya' } : null);

        if (!origin || !destination) return;

        setIsLoading(true);
        try {
            const data = await fetchRoute(origin, destination);

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates;

                const hazards = checkRouteHazards(coordinates, reports);
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
                // Auto minimize on mobile after finding route
                if (window.innerWidth < 640) {
                    setIsMinimized(true);
                }
            }
        } catch (error) {
            console.error('Failed to get directions:', error);
            alert('Gagal mencari rute. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        onToggle(false);
        onClearRoute();
        setRouteInfo(null);
        setDestination(null);
        setSearchQuery('');
        setStartPoint(null);
        setStartSearchQuery('');
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
        return null;
    }

    return (
        <div className={`absolute z-[1000] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col transition-all duration-300
            w-[95%] left-1/2 -translate-x-1/2 top-20
            sm:w-96 sm:left-auto sm:right-4 sm:top-4 sm:translate-x-0 sm:max-h-[85vh]
            ${isMinimized ? 'h-auto' : 'max-h-[70vh] sm:max-h-[85vh]'}`}
        >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex justify-between items-center shrink-0">
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="flex items-center gap-2 font-semibold hover:opacity-90 transition-opacity"
                >
                    <Navigation className="w-5 h-5" />
                    Rute Perjalanan
                    {isMinimized ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
                </button>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label={isMinimized ? "Expand" : "Minimize"}
                    >
                        {isMinimized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={handleClose}
                        className="hover:bg-brand-800 p-1.5 rounded-lg transition-colors duration-150"
                        aria-label="Close route planner"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="p-4 space-y-3 overflow-y-auto">
                    {/* Start Location */}
                    <div className="relative" ref={startSearchRef}>
                        <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-brand-500 border-2 border-white shadow-sm z-10"></div>
                        <div className="relative">
                            <input
                                type="text"
                                value={startSearchQuery || (startPoint ? startPoint.name : 'Lokasi Saya')}
                                onChange={handleStartSearchInput}
                                onFocus={() => {
                                    if (!startPoint) {
                                        setStartSearchQuery('');
                                    }
                                }}
                                placeholder="Pilih titik awal..."
                                className="w-full pl-9 pr-20 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                                {startPoint && (
                                    <button
                                        onClick={handleUseMyLocation}
                                        className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 hover:bg-brand-50 rounded transition-colors"
                                        title="Gunakan lokasi saya"
                                    >
                                        Reset
                                    </button>
                                )}
                                {isStartSearching ? (
                                    <Loader2 className="h-4 w-4 text-brand-500 animate-spin mr-1" />
                                ) : (
                                    <Search className="h-4 w-4 text-gray-400 mr-1" />
                                )}
                            </div>
                        </div>

                        {/* Start Search Results Dropdown */}
                        {showStartResults && startSearchResults && startSearchResults.length > 0 && (
                            <div className="absolute mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm z-20">
                                {startSearchResults.map((result) => (
                                    <button
                                        key={result.place_id}
                                        className="w-full text-left px-3 py-2.5 hover:bg-brand-50 active:bg-brand-100 flex items-start gap-2 border-b border-gray-100 last:border-0 transition-colors"
                                        onClick={() => handleSelectStartPoint(result)}
                                    >
                                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate text-sm">
                                                {result.display_name.split(',')[0]}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {result.display_name}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Destination Search */}
                    <div className="relative" ref={searchRef}>
                        <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm z-10"></div>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchInput}
                                placeholder="Pilih tujuan..."
                                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 text-brand-500 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4 text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults && searchResults.length > 0 && (
                            <div className="absolute mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm z-20">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.place_id}
                                        className="w-full text-left px-3 py-2.5 hover:bg-brand-50 active:bg-brand-100 flex items-start gap-2 border-b border-gray-100 last:border-0 transition-colors"
                                        onClick={() => handleSelectDestination(result)}
                                    >
                                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate text-sm">
                                                {result.display_name.split(',')[0]}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {result.display_name}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Get Directions Button */}
                    <button
                        onClick={handleGetDirections}
                        disabled={isLoading || (!startPoint && !userLocation) || !destination}
                        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600 flex justify-center items-center gap-2 shadow-sm hover:shadow-md active:shadow-sm transition-all duration-200 transform active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Mencari Rute...
                            </>
                        ) : (
                            <>
                                <Navigation className="w-4 h-4" />
                                Cari Rute
                            </>
                        )}
                    </button>

                    {/* Route Info Card */}
                    {routeInfo && (
                        <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 space-y-3 shadow-sm">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Jarak:</span>
                                <span className="font-bold text-gray-900">{formatDistance(routeInfo.distance)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Waktu:</span>
                                <span className="font-bold text-gray-900">{formatDuration(routeInfo.duration)}</span>
                            </div>

                            <div className="pt-2 border-t border-gray-300">
                                {routeInfo.hazardCount > 0 ? (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-semibold">Peringatan!</p>
                                            <p className="text-xs mt-0.5">Ada {routeInfo.hazardCount} bahaya di rute ini.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="font-medium">Rute aman dari bahaya yang dilaporkan</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
