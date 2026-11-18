// SafeCommute Leaflet Map, Clustering, and Marker Management
window.SafeMap = {
    map: null,
    clusterGroup: null,
    userMarker: null,
    searchMarker: null,
    routePolyline: null,
    isPinMode: false,
    iconCache: new Map(),

    categorySvgPaths: {
        banjir: 'M12 22c4.97 0 9-4.03 9-9-4.5 0-4.5-5-9-5s-4.5 5-9 5c0 4.97 4.03 9 9 9z',
        macet: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
        kriminal: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 10c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z',
        jalan_rusak: 'M12 2L1 21h22L12 2zm0 3.45l8.43 14.55H3.57L12 5.45z M11 10h2v6h-2zm0 8h2v2h-2z',
        lampu_mati: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
        banjir_rob: 'M12 22c4.97 0 9-4.03 9-9-4.5 0-4.5-5-9-5s-4.5 5-9 5c0 4.97 4.03 9 9 9z M12 13c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z',
        tanggul_jebol: 'M2 22h20V2L2 22zm16-6l-3.5-3.5 2.5-2.5 3.5 3.5-2.5 2.5z',
        kapal_tenggelam: 'M12 2L2 22h20L12 2zm0 3l7.5 15h-15L12 5z M12 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'
    },

    init(containerId) {
        // Center on Bogor / Jakarta
        this.map = L.map(containerId, {
            zoomControl: false,
            attributionControl: true
        }).setView([-6.597, 106.799], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        L.control.zoom({ position: 'topright' }).addTo(this.map);

        // Marker cluster group with custom counter style
        this.clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                let size = 40;
                if (count > 50) size = 56;
                else if (count > 10) size = 48;

                const svg = `
                    <svg width="${size}" height="${size}" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="28" cy="28" r="26" fill="#3B82F6" opacity="0.3"/>
                        <circle cx="28" cy="28" r="20" fill="#3B82F6" opacity="0.6"/>
                        <circle cx="28" cy="28" r="14" fill="#3B82F6"/>
                        <text x="28" y="33" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">${count}</text>
                    </svg>
                `;
                return L.icon({
                    iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                    className: 'custom-cluster-icon'
                });
            }
        });
        this.map.addLayer(this.clusterGroup);

        // Click on map listener (for pin mode)
        this.map.on('click', (e) => {
            if (this.isPinMode) {
                Alpine.store('app').onMapPinSelect(e.latlng.lat, e.latlng.lng);
            }
        });
    },

    getMarkerIcon(type, color, trustScore = 0) {
        const verified = trustScore > 5;
        const key = `${type}_${color}_${verified}`;
        if (this.iconCache.has(key)) {
            return this.iconCache.get(key);
        }

        const path = this.categorySvgPaths[type] || this.categorySvgPaths.banjir;
        const svg = verified ? `
            <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 0C9.163 0 2 7.163 2 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}" stroke="#FFD700" stroke-width="3"/>
                <circle cx="18" cy="16" r="8" fill="white" opacity="0.2"/>
                <path d="${path}" transform="translate(9, 7) scale(0.75)" fill="white"/>
                <path d="M18 10l1.5 3 3.5 0.5-2.5 2.5 0.5 3.5-3-1.5-3 1.5 0.5-3.5-2.5-2.5 3.5-0.5z" fill="#FFD700" transform="translate(10, -12)"/>
            </svg>
        ` : `
            <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}"/>
                <circle cx="16" cy="16" r="8" fill="white" opacity="0.2"/>
                <path d="${path}" transform="translate(7, 7) scale(0.75)" fill="white"/>
            </svg>
        `;

        const icon = L.icon({
            iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
            iconSize: verified ? [36, 46] : [32, 42],
            iconAnchor: verified ? [18, 46] : [16, 42],
            popupAnchor: [0, verified ? -46 : -42]
        });

        this.iconCache.set(key, icon);
        return icon;
    },

    updateReports(reports, enabledTypes) {
        this.clusterGroup.clearLayers();

        reports.forEach((rep) => {
            if (enabledTypes && !enabledTypes.has(rep.type)) {
                return;
            }

            const icon = this.getMarkerIcon(rep.type, rep.color, rep.trust_score);
            const marker = L.marker([rep.latitude, rep.longitude], { icon });

            // Popup HTML with voting buttons and photo view
            const isVerified = rep.trust_score > 5;
            const popupHtml = `
                <div class="p-2 min-w-[240px]">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${rep.color}"></div>
                        <h3 class="font-bold text-gray-900 flex-1 text-sm">${rep.label}</h3>
                        ${isVerified ? `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded-full font-bold">
                                ⭐ Terverifikasi
                            </span>
                        ` : ''}
                    </div>
                    ${rep.image_url ? `
                        <div class="mb-2 rounded-lg overflow-hidden border border-gray-200">
                            <img src="${rep.image_url}" alt="Foto Bukti" class="w-full h-32 object-cover cursor-pointer hover:opacity-90" onclick="window.open('${rep.image_url}', '_blank')">
                        </div>
                    ` : ''}
                    ${rep.description ? `<p class="text-xs text-gray-700 mb-2">${rep.description}</p>` : ''}
                    <p class="text-[11px] text-gray-500 mb-2">${SafeUtils.formatRelativeDate(rep.created_at)}</p>
                    
                    <div class="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div class="text-xs font-semibold text-gray-700">
                            Skor: <span id="score-${rep.id}" class="${rep.trust_score > 0 ? 'text-green-600' : (rep.trust_score < 0 ? 'text-red-600' : 'text-gray-600')} font-bold">${rep.trust_score}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="Alpine.store('app').vote('${rep.id}', 'up')" class="px-2.5 py-1 text-xs font-medium rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-1">
                                👍 Valid
                            </button>
                            <button onclick="Alpine.store('app').vote('${rep.id}', 'down')" class="px-2.5 py-1 text-xs font-medium rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1">
                                👎 Palsu
                            </button>
                        </div>
                    </div>
                </div>
            `;

            marker.bindPopup(popupHtml);
            this.clusterGroup.addLayer(marker);
        });
    },

    setUserLocation(lat, lng) {
        const svg = `
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="14" fill="#3B82F6" stroke="white" stroke-width="2" opacity="0.9"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
                <circle cx="20" cy="20" r="4" fill="#1E40AF"/>
            </svg>
        `;
        const icon = L.icon({
            iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        if (!this.userMarker) {
            this.userMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(this.map);
            this.userMarker.bindPopup('<div class="text-center font-bold text-xs p-1">Lokasi Anda</div>');
        } else {
            this.userMarker.setLatLng([lat, lng]);
        }
    },

    setSearchMarker(lat, lng, name) {
        if (this.searchMarker) {
            this.map.removeLayer(this.searchMarker);
        }
        const svg = `
            <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="#10B981" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="16" r="6" fill="#ffffff"/>
            </svg>
        `;
        const icon = L.icon({
            iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
            iconSize: [32, 42],
            iconAnchor: [16, 42],
            popupAnchor: [0, -42]
        });

        this.searchMarker = L.marker([lat, lng], { icon, zIndexOffset: 900 }).addTo(this.map);
        this.searchMarker.bindPopup(`<div class="text-center text-xs p-1"><b>${name}</b><br><span class="text-gray-500">Hasil Pencarian</span></div>`).openPopup();
        this.map.flyTo([lat, lng], 15);
    },

    drawRoute(coordinates) {
        if (this.routePolyline) {
            this.map.removeLayer(this.routePolyline);
        }
        // OSRM GeoJSON is [lng, lat], Leaflet expects [lat, lng]
        const latLngs = coordinates.map(c => [c[1], c[0]]);
        this.routePolyline = L.polyline(latLngs, {
            color: '#3B82F6',
            weight: 5,
            opacity: 0.8
        }).addTo(this.map);

        this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50], maxZoom: 16 });
    },

    clearRoute() {
        if (this.routePolyline) {
            this.map.removeLayer(this.routePolyline);
            this.routePolyline = null;
        }
    }
};
