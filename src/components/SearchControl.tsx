import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, MapPin, Menu, Navigation } from 'lucide-react';
import { useMap } from 'react-leaflet';

interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    type: string;
}

interface SearchControlProps {
    onMenuClick: () => void;
    onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void;
    onRouteClick: () => void;
}

export function SearchControl({ onMenuClick, onLocationSelect, onRouteClick }: SearchControlProps) {
    const map = useMap();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Disable map dragging when interacting with search
        const container = containerRef.current;
        if (container) {
            const disableMapInteraction = () => {
                map.dragging.disable();
                map.scrollWheelZoom.disable();
            };
            const enableMapInteraction = () => {
                map.dragging.enable();
                map.scrollWheelZoom.enable();
            };

            container.addEventListener('mouseenter', disableMapInteraction);
            container.addEventListener('mouseleave', enableMapInteraction);

            return () => {
                container.removeEventListener('mouseenter', disableMapInteraction);
                container.removeEventListener('mouseleave', enableMapInteraction);
                enableMapInteraction(); // Ensure re-enabled
            };
        }
    }, [map]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchQuery
                )}&limit=5&countrycodes=id`
            );
            const data = await response.json();
            setResults(data);
            setIsOpen(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (value.length >= 3) {
            searchTimeout.current = setTimeout(() => {
                handleSearch(value);
            }, 1000);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        map.flyTo([lat, lng], 16, {
            duration: 1.5
        });

        // Notify parent component of selected location
        if (onLocationSelect) {
            onLocationSelect({
                lat,
                lng,
                name: result.display_name.split(',')[0]
            });
        }

        setQuery(result.display_name.split(',')[0]);
        setIsOpen(false);
        setResults([]);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-md"
        >
            <div className="relative flex items-center gap-2">
                <button
                    onClick={onMenuClick}
                    className="p-3 glass rounded-xl border-none hover:bg-white/80 active:scale-95 transition-all text-gray-700 hover:text-brand-600"
                    aria-label="Menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="glass block w-full pl-10 pr-10 py-3 rounded-xl border-none leading-5 bg-white/90 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm transition-all"
                        placeholder="Cari lokasi..."
                        value={query}
                        onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
                        ) : query ? (
                            <button
                                onClick={clearSearch}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        ) : null}
                    </div>
                </div>
                <button
                    onClick={onRouteClick}
                    className="p-3 glass rounded-xl border-none hover:bg-brand-50 text-brand-600 active:scale-95 transition-all duration-200"
                    aria-label="Open route planner"
                    title="Rencanakan Rute"
                >
                    <Navigation className="h-5 w-5" />
                </button>
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute mt-2 w-full bg-white/95 backdrop-blur-md shadow-2xl max-h-60 rounded-xl py-2 text-base ring-1 ring-black/5 overflow-auto focus:outline-none sm:text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    {results.map((result) => (
                        <button
                            key={result.place_id}
                            className="w-full text-left px-4 py-3 hover:bg-brand-50 active:bg-brand-100 flex items-start gap-3 border-b border-gray-100/50 last:border-0 transition-colors group"
                            onClick={() => handleSelect(result)}
                        >
                            <MapPin className="h-5 w-5 text-gray-400 group-hover:text-brand-500 flex-shrink-0 mt-0.5 transition-colors" />
                            <div>
                                <p className="font-medium text-gray-900 truncate group-hover:text-brand-900">
                                    {result.display_name.split(',')[0]}
                                </p>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {result.display_name}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
