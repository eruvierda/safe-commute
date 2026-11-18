// SafeCommute Alpine.js Global Application Store
document.addEventListener('alpine:init', () => {
    Alpine.store('app', {
        // Auth state
        user: null,
        isLoggedIn: false,
        authModalOpen: false,
        authTab: 'login', // 'login' | 'register'
        authEmail: '',
        authPassword: '',
        authName: '',
        authLoading: false,

        // Data state
        reports: [],
        enabledTypes: new Set(['banjir', 'macet', 'kriminal', 'jalan_rusak', 'lampu_mati', 'banjir_rob', 'tanggul_jebol', 'kapal_tenggelam']),
        reportTypes: [
            { value: 'banjir', label: '🌊 Banjir (Flood)', color: '#3B82F6' },
            { value: 'macet', label: '🚗 Macet (Traffic)', color: '#EF4444' },
            { value: 'kriminal', label: '⚠️ Kriminal (Crime)', color: '#DC2626' },
            { value: 'jalan_rusak', label: '🚧 Jalan Rusak (Road Damage)', color: '#F59E0B' },
            { value: 'lampu_mati', label: '💡 Lampu Mati (Light Out)', color: '#6B7280' },
            { value: 'banjir_rob', label: '🌊 Banjir Rob (High Tide)', color: '#0EA5E9' },
            { value: 'tanggul_jebol', label: '🏚️ Tanggul Jebol (Broken Dam)', color: '#7F1D1D' },
            { value: 'kapal_tenggelam', label: '🚢 Kapal Tenggelam (Sunken Ship)', color: '#1E3A8A' }
        ],

        // User GPS & Warnings
        userLocation: null,
        isWarningEnabled: true,
        warningRadius: 2, // km
        activeWarnings: [],
        dismissedWarningIds: new Set(),
        alertSoundAudio: null,

        // UI Modals & Menus
        menuOpen: false,
        profileOpen: false,
        reportModalOpen: false,
        routePlannerOpen: false,
        warningControlsOpen: false,

        // Pin mode & reporting
        isPinMode: false,
        selectedPinLocation: null,
        reportType: 'banjir',
        reportDescription: '',
        reportImageFile: null,
        reportImagePreview: null,
        reportSubmitting: false,

        // Search & Routing
        searchQuery: '',
        searchResults: [],
        searchLoading: false,
        routeStartQuery: '',
        routeDestQuery: '',
        routeStartResults: [],
        routeDestResults: [],
        routeStartPoint: null,
        routeDestPoint: null,
        routeInfo: null,
        routeLoading: false,

        // My Reports & History
        myReports: [],
        myVotes: [],
        myStats: null,
        profileTab: 'reports', // 'reports' | 'votes' | 'stats'

        async init() {
            // Audio alert setup (clean beep)
            this.alertSoundAudio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSdTgwOUKzn8LZjGwU8k9nyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDknU4MDlCs5/C2YxsFPJPZ8sx5LAUkd8fw3ZBAC");

            // Initialize Map
            SafeMap.init('map');

            // Load Auth
            await this.checkAuth();

            // Load initial reports
            await this.fetchReports();

            // Start polling loop every 30s
            setInterval(() => {
                if (!document.hidden) {
                    this.fetchReports();
                }
            }, 30000);

            // Geolocation tracking
            this.startLocationTracking();
        },

        async checkAuth() {
            try {
                const res = await SafeAPI.get('/api/auth/me');
                if (res.data?.user) {
                    this.user = res.data.user;
                    this.isLoggedIn = true;
                } else {
                    this.user = null;
                    this.isLoggedIn = false;
                }
            } catch (e) {
                this.user = null;
                this.isLoggedIn = false;
            }
        },

        async fetchReports() {
            try {
                const res = await SafeAPI.get('/api/reports');
                if (res.data) {
                    this.reports = res.data;
                    SafeMap.updateReports(this.reports, this.enabledTypes);
                    this.checkWarnings();
                }
            } catch (e) {
                console.error('Error fetching reports:', e);
            }
        },

        startLocationTracking() {
            if ('geolocation' in navigator) {
                navigator.geolocation.watchPosition(
                    (pos) => {
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        this.userLocation = loc;
                        SafeMap.setUserLocation(loc.lat, loc.lng);
                        this.checkWarnings();
                    },
                    (err) => console.warn('Geolocation watch error:', err),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
                );
            }
        },

        locateMe() {
            if (!navigator.geolocation) {
                SafeToast.error('Browser tidak mendukung GPS');
                return;
            }
            SafeToast.info('Mencari sinyal GPS...');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    this.userLocation = { lat, lng };
                    SafeMap.setUserLocation(lat, lng);
                    SafeMap.map.flyTo([lat, lng], 15);
                    SafeToast.success('Lokasi GPS ditemukan!');
                },
                (err) => SafeToast.error('Gagal mengakses GPS: ' + err.message)
            );
        },

        // Pin & Reporting
        togglePinMode() {
            if (!this.isLoggedIn) {
                this.authModalOpen = true;
                return;
            }
            this.isPinMode = !this.isPinMode;
            SafeMap.isPinMode = this.isPinMode;
            const mapEl = document.getElementById('map');
            if (this.isPinMode) {
                mapEl.classList.add('cursor-pin');
                SafeToast.info('Klik lokasi pada peta untuk meletakkan pin');
            } else {
                mapEl.classList.remove('cursor-pin');
            }
        },

        onMapPinSelect(lat, lng) {
            this.selectedPinLocation = { lat, lng };
            this.isPinMode = false;
            SafeMap.isPinMode = false;
            document.getElementById('map').classList.remove('cursor-pin');
            this.reportModalOpen = true;
        },

        handleImageSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                SafeToast.error('File harus berupa foto.');
                return;
            }
            this.reportImageFile = file;
            this.reportImagePreview = URL.createObjectURL(file);
        },

        removeImage() {
            this.reportImageFile = null;
            if (this.reportImagePreview) {
                URL.revokeObjectURL(this.reportImagePreview);
                this.reportImagePreview = null;
            }
        },

        async submitReport() {
            if (!this.selectedPinLocation) return;
            if (!this.reportType) {
                SafeToast.error('Pilih tipe bahaya.');
                return;
            }

            this.reportSubmitting = true;
            try {
                const formData = new FormData();
                formData.append('type', this.reportType);
                formData.append('latitude', this.selectedPinLocation.lat);
                formData.append('longitude', this.selectedPinLocation.lng);
                formData.append('description', this.reportDescription || '');
                if (this.reportImageFile) {
                    formData.append('image', this.reportImageFile);
                }

                const res = await SafeAPI.post('/api/reports', formData);
                SafeToast.success('Laporan berhasil dikirim!');
                this.reportModalOpen = false;
                this.reportDescription = '';
                this.removeImage();
                this.fetchReports();
            } catch (err) {
                SafeToast.error(err.message);
            } finally {
                this.reportSubmitting = false;
            }
        },

        // Voting
        async vote(reportId, voteType) {
            if (!this.isLoggedIn) {
                this.authModalOpen = true;
                return;
            }

            try {
                const res = await SafeAPI.post(`/api/reports/${reportId}/vote`, { vote_type: voteType });
                const newScore = res.data.trust_score;

                // Update popup score text
                const el = document.getElementById(`score-${reportId}`);
                if (el) {
                    el.innerText = newScore;
                    el.className = (newScore > 0 ? 'text-green-600' : (newScore < 0 ? 'text-red-600' : 'text-gray-600')) + ' font-bold';
                }

                // Update state
                const rep = this.reports.find(r => r.id === reportId);
                if (rep) {
                    rep.trust_score = newScore;
                }
                SafeToast.success('Vote berhasil dicatat');
            } catch (e) {
                SafeToast.error(e.message);
            }
        },

        // Warnings Check (Proximity)
        checkWarnings() {
            if (!this.isWarningEnabled || !this.userLocation || this.warningRadius <= 0) {
                this.activeWarnings = [];
                return;
            }

            const currentIds = new Set(this.activeWarnings.map(w => w.id));
            const newWarnings = [];
            let hasNewAlert = false;

            this.reports.forEach((rep) => {
                if (!this.enabledTypes.has(rep.type) || rep.is_resolved || rep.trust_score <= -3) {
                    return;
                }

                const dist = SafeUtils.calculateDistance(
                    this.userLocation.lat,
                    this.userLocation.lng,
                    rep.latitude,
                    rep.longitude
                );

                if (dist <= this.warningRadius && !this.dismissedWarningIds.has(rep.id)) {
                    newWarnings.push({
                        id: rep.id,
                        label: rep.label,
                        color: rep.color,
                        distance: dist.toFixed(1)
                    });
                    if (!currentIds.has(rep.id)) {
                        hasNewAlert = true;
                    }
                }
            });

            newWarnings.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            this.activeWarnings = newWarnings;

            // Play sound ONLY when a brand new hazard is entered
            if (hasNewAlert && this.alertSoundAudio) {
                this.alertSoundAudio.play().catch(() => {});
            }
        },

        dismissWarning(id) {
            this.dismissedWarningIds.add(id);
            this.activeWarnings = this.activeWarnings.filter(w => w.id !== id);
        },

        toggleHazardFilter(type) {
            if (this.enabledTypes.has(type)) {
                this.enabledTypes.delete(type);
            } else {
                this.enabledTypes.add(type);
            }
            SafeMap.updateReports(this.reports, this.enabledTypes);
            this.checkWarnings();
        },

        // Search
        async handleSearchInput() {
            if (this.searchQuery.length < 3) {
                this.searchResults = [];
                return;
            }
            this.searchLoading = true;
            try {
                const res = await SafeAPI.get(`/api/geocode?q=${encodeURIComponent(this.searchQuery)}`);
                this.searchResults = res.data || [];
            } catch (e) {
                console.error(e);
            } finally {
                this.searchLoading = false;
            }
        },

        selectSearchResult(item) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const name = item.display_name.split(',')[0];
            SafeMap.setSearchMarker(lat, lng, name);
            this.searchQuery = name;
            this.searchResults = [];
        },

        // Route Planner
        async calculateRoute() {
            if (!this.routeStartPoint || !this.routeDestPoint) {
                SafeToast.error('Pilih titik awal dan tujuan.');
                return;
            }

            this.routeLoading = true;
            try {
                const res = await SafeAPI.get(`/api/route?start_lat=${this.routeStartPoint.lat}&start_lng=${this.routeStartPoint.lng}&end_lat=${this.routeDestPoint.lat}&end_lng=${this.routeDestPoint.lng}`);
                const routeData = res.data.routes[0];
                const coords = routeData.geometry.coordinates;

                SafeMap.drawRoute(coords);

                // Count hazards along route (within 50 meters)
                const hazardsOnRoute = [];
                this.reports.forEach((rep) => {
                    if (rep.is_resolved) return;
                    // Proximity to route points
                    const isNear = coords.some(c => {
                        const d = SafeUtils.calculateDistance(rep.latitude, rep.longitude, c[1], c[0]);
                        return d <= 0.05; // 50 meters in km
                    });
                    if (isNear) {
                        hazardsOnRoute.push(rep);
                    }
                });

                this.routeInfo = {
                    distance: (routeData.distance / 1000).toFixed(1), // km
                    duration: Math.round(routeData.duration / 60), // mins
                    hazardCount: hazardsOnRoute.length,
                    hazards: hazardsOnRoute
                };
            } catch (e) {
                SafeToast.error('Gagal membuat rute navigasi.');
            } finally {
                this.routeLoading = false;
            }
        },

        clearCurrentRoute() {
            SafeMap.clearRoute();
            this.routeInfo = null;
            this.routeStartPoint = null;
            this.routeDestPoint = null;
            this.routeStartQuery = '';
            this.routeDestQuery = '';
        },

        // Auth Operations
        async submitAuth() {
            if (!this.authEmail || !this.authPassword) {
                SafeToast.error('Email dan password wajib diisi.');
                return;
            }

            this.authLoading = true;
            try {
                if (this.authTab === 'login') {
                    const res = await SafeAPI.post('/api/auth/login', {
                        email: this.authEmail,
                        password: this.authPassword
                    });
                    this.user = res.data.user;
                    this.isLoggedIn = true;
                    this.authModalOpen = false;
                    SafeToast.success('Selamat datang kembali, ' + this.user.display_name);
                } else {
                    const res = await SafeAPI.post('/api/auth/register', {
                        email: this.authEmail,
                        password: this.authPassword,
                        display_name: this.authName
                    });
                    this.user = res.data.user;
                    this.isLoggedIn = true;
                    this.authModalOpen = false;
                    SafeToast.success('Pendaftaran akun berhasil!');
                }
                this.fetchReports();
            } catch (err) {
                SafeToast.error(err.message);
            } finally {
                this.authLoading = false;
            }
        },

        async logout() {
            await SafeAPI.post('/api/auth/logout');
            this.user = null;
            this.isLoggedIn = false;
            this.menuOpen = false;
            this.profileOpen = false;
            SafeToast.success('Anda telah logout.');
            this.fetchReports();
        },

        // Profile, My Reports, My Votes
        async openProfile() {
            if (!this.isLoggedIn) {
                this.authModalOpen = true;
                return;
            }
            this.menuOpen = false;
            this.profileOpen = true;
            await this.loadMyReports();
            await this.loadMyStats();
        },

        async loadMyReports() {
            const res = await SafeAPI.get('/api/me/reports');
            this.myReports = res.data || [];
        },

        async loadMyVotes() {
            const res = await SafeAPI.get('/api/me/votes');
            this.myVotes = res.data || [];
        },

        async loadMyStats() {
            const res = await SafeAPI.get('/api/me/stats');
            this.myStats = res.data || null;
        },

        async deleteMyReport(id) {
            if (!confirm('Yakin ingin menghapus laporan ini?')) return;
            try {
                await SafeAPI.delete(`/api/reports/${id}`);
                SafeToast.success('Laporan dihapus.');
                await this.loadMyReports();
                this.fetchReports();
            } catch (e) {
                SafeToast.error(e.message);
            }
        }
    });
});
