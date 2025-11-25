/**
 * Validates geographic coordinates
 * @param lat Latitude value (-90 to 90)
 * @param lng Longitude value (-180 to 180)
 * @returns true if coordinates are valid, false otherwise
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Validates report description
 * @param desc Description text (optional)
 * @returns Object with validation result and optional error message
 */
export const validateDescription = (desc: string | null): {
    valid: boolean;
    error?: string
} => {
    if (!desc || desc.trim().length === 0) {
        return { valid: true }; // Optional field
    }
    if (desc.length > 500) {
        return { valid: false, error: 'Deskripsi maksimal 500 karakter' };
    }
    return { valid: true };
};
