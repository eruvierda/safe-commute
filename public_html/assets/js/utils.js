// SafeCommute Utilities: Date Formatting & Haversine Distance
window.SafeUtils = {
    formatRelativeDate(dateString) {
        if (!dateString) return '';
        // Ensure UTC parse
        const utcString = dateString.endsWith('Z') ? dateString : dateString.replace(' ', 'T') + 'Z';
        const date = new Date(utcString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} jam lalu`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} hari lalu`;

        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    // Haversine formula: returns distance in Kilometers
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in KM
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    canEditReport(createdAt) {
        if (!createdAt) return false;
        const utcString = createdAt.endsWith('Z') ? createdAt : createdAt.replace(' ', 'T') + 'Z';
        const created = new Date(utcString);
        const now = new Date();
        const diffMinutes = (now.getTime() - created.getTime()) / 60000;
        return diffMinutes < 15;
    }
};
