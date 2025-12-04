import { Report } from '../types';

const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteSegment {
    coordinates: [number, number][];
    distance: number;
    duration: number;
}

export interface RouteResult {
    geometry: [number, number][]; // Decoded polyline coordinates [lat, lng]
    distance: number; // meters
    duration: number; // seconds
    hazardsOnRoute: Report[];
}

// Decode OSRM polyline string (Google Polyline Algorithm)
// Simplified version or use a library if needed. OSRM returns geojson if requested.
// We requested overview=full&geometries=geojson, so we get coordinates directly.

export const fetchRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
): Promise<any> => {
    try {
        const response = await fetch(
            `${OSRM_API_URL}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch route');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching route:', error);
        throw error;
    }
};

export const checkRouteHazards = (
    routeCoordinates: [number, number][], // [lng, lat] from OSRM GeoJSON
    reports: Report[],
    warningRadius: number = 0.0005 // Approx 50 meters in degrees (rough approximation)
): Report[] => {
    const hazards: Report[] = [];
    const uniqueHazards = new Set<string>();

    // Simple proximity check: for each hazard, is it close to ANY point on the route?
    // Optimization: Could use a spatial index or bounding box check first.

    reports.forEach(report => {
        if (report.is_resolved) return;

        const isNear = routeCoordinates.some(coord => {
            const routeLat = coord[1];
            const routeLng = coord[0];

            // Euclidean distance squared for speed (approximation)
            const dLat = report.latitude - routeLat;
            const dLng = report.longitude - routeLng;
            const distSq = dLat * dLat + dLng * dLng;

            return distSq < warningRadius * warningRadius;
        });

        if (isNear && !uniqueHazards.has(report.id)) {
            uniqueHazards.add(report.id);
            hazards.push(report);
        }
    });

    return hazards;
};
