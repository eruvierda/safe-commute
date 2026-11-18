<?php
declare(strict_types=1);

require_once __DIR__ . '/../safecommute/bootstrap.php';

use SafeCommute\Auth;

$csrfToken = Auth::getCsrfToken();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
    <title>SafeCommute - Peta Bahaya Jalan Komuter</title>

    <!-- Google Font: Outfit -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Leaflet & MarkerCluster CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css">

    <!-- Notyf Toast CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css">

    <!-- App / Tailwind CSS -->
    <link rel="stylesheet" href="/assets/css/src.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Outfit', 'sans-serif'] },
                    colors: {
                        brand: {
                            500: '#6366f1',
                            600: '#4f46e5',
                            700: '#4338ca',
                        }
                    }
                }
            }
        }
    </script>

    <!-- Alpine.js -->
    <script defer src="https://unpkg.com/alpinejs@3.14.3/dist/cdn.min.js"></script>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>

    <!-- Lucide Icons & Notyf Toast JS -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js"></script>

    <!-- App Scripts -->
    <script src="/assets/js/api.js"></script>
    <script src="/assets/js/utils.js"></script>
    <script src="/assets/js/map.js"></script>
    <script src="/assets/js/app.js"></script>
</head>
<body class="w-full h-full relative overflow-hidden select-none bg-slate-100" x-data>

    <!-- MAP CONTAINER -->
    <div id="map" class="w-full h-full z-0"></div>

    <!-- TOP SEARCH & HEADER BAR -->
    <div class="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 max-w-md mx-auto pointer-events-auto">
        <!-- Menu Button -->
        <button @click="$store.app.menuOpen = true" class="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-gray-700 hover:text-blue-600 transition flex items-center justify-center">
            <i data-lucide="menu" class="w-5 h-5"></i>
        </button>

        <!-- Search Input -->
        <div class="relative flex-1">
            <div class="relative flex items-center">
                <input 
                    type="text" 
                    placeholder="Cari lokasi di peta..." 
                    class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/95 backdrop-blur shadow-lg border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    x-model="$store.app.searchQuery"
                    @input.debounce.400ms="$store.app.handleSearchInput()"
                >
                <div class="absolute left-3 text-gray-400">
                    <i data-lucide="search" class="w-4 h-4"></i>
                </div>
            </div>

            <!-- Search Dropdown Results -->
            <div x-show="$store.app.searchResults.length > 0" @click.outside="$store.app.searchResults = []" class="absolute top-12 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100 z-50">
                <template x-for="item in $store.app.searchResults" :key="item.place_id">
                    <button @click="$store.app.selectSearchResult(item)" class="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-800">
                        <i data-lucide="map-pin" class="w-4 h-4 text-blue-500 shrink-0"></i>
                        <span class="truncate" x-text="item.display_name"></span>
                    </button>
                </template>
            </div>
        </div>

        <!-- Route Planner Button -->
        <button @click="$store.app.routePlannerOpen = !$store.app.routePlannerOpen" class="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-gray-700 hover:text-blue-600 transition flex items-center justify-center">
            <i data-lucide="navigation" class="w-5 h-5"></i>
        </button>
    </div>

    <!-- FLOATING GPS RECENTER BUTTON -->
    <div class="absolute bottom-24 right-4 z-20">
        <button @click="$store.app.locateMe()" class="bg-white p-3.5 rounded-full shadow-xl border border-gray-100 text-blue-600 hover:bg-blue-50 transition active:scale-95" title="Lokasi Saya">
            <i data-lucide="crosshair" class="w-6 h-6"></i>
        </button>
    </div>

    <!-- MAIN ACTION: ADD REPORT (FAB) -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button 
            @click="$store.app.togglePinMode()" 
            class="px-5 py-3.5 rounded-full shadow-2xl font-bold flex items-center gap-2 transition active:scale-95 text-white"
            :class="$store.app.isPinMode ? 'bg-amber-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'"
        >
            <i :data-lucide="$store.app.isPinMode ? 'map-pin' : 'plus'" class="w-5 h-5"></i>
            <span x-text="$store.app.isPinMode ? 'Batal Pin' : 'Laporkan Bahaya'"></span>
        </button>
    </div>

    <!-- PROXIMITY WARNINGS LIST -->
    <div class="fixed top-20 right-4 left-4 sm:left-auto sm:w-80 z-30 space-y-2 pointer-events-none" x-show="$store.app.activeWarnings.length > 0">
        <template x-for="w in $store.app.activeWarnings.slice(0, 3)" :key="w.id">
            <div class="bg-white/95 backdrop-blur-md border border-red-200 rounded-xl shadow-xl p-3 pointer-events-auto flex items-start gap-3">
                <div class="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                    <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-gray-900 text-xs" x-text="w.label"></h4>
                    <p class="text-xs text-red-600 font-semibold mt-0.5"><span x-text="w.distance"></span> km dari posisi Anda</p>
                </div>
                <button @click="$store.app.dismissWarning(w.id)" class="text-gray-400 hover:text-gray-600 p-1">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        </template>
    </div>

    <!-- REPORT MODAL -->
    <div x-show="$store.app.reportModalOpen" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" x-cloak>
        <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto" @click.outside="$store.app.reportModalOpen = false">
            <div class="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 class="font-bold text-gray-900 text-base">Laporkan Bahaya Jalan</h3>
                <button @click="$store.app.reportModalOpen = false" class="text-gray-400 hover:text-gray-600">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Hazard Type Selector -->
            <label class="block text-xs font-semibold text-gray-700 mb-2">Tipe Bahaya</label>
            <div class="grid grid-cols-2 gap-2 mb-4">
                <template x-for="t in $store.app.reportTypes" :key="t.value">
                    <button 
                        type="button" 
                        @click="$store.app.reportType = t.value" 
                        class="p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition"
                        :class="$store.app.reportType === t.value ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'"
                    >
                        <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: t.color }"></span>
                        <span class="truncate" x-text="t.label"></span>
                    </button>
                </template>
            </div>

            <!-- Description -->
            <label class="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Tambahan (Opsional)</label>
            <textarea 
                rows="3" 
                maxlength="500" 
                placeholder="Contoh: Lubang cukup dalam di lajur kiri dekat pom bensin..."
                class="w-full text-xs p-3 border border-gray-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                x-model="$store.app.reportDescription"
            ></textarea>

            <!-- Photo Upload -->
            <label class="block text-xs font-semibold text-gray-700 mb-1">Foto Bukti (Opsional)</label>
            <div class="mb-4">
                <template x-if="!$store.app.reportImagePreview">
                    <label class="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-500">
                        <i data-lucide="camera" class="w-6 h-6 mb-1 text-gray-400"></i>
                        <span class="text-xs">Ambil atau pilih foto</span>
                        <input type="file" accept="image/*" class="hidden" @change="$store.app.handleImageSelect($event)">
                    </label>
                </template>
                <template x-if="$store.app.reportImagePreview">
                    <div class="relative rounded-xl overflow-hidden border border-gray-200 h-36">
                        <img :src="$store.app.reportImagePreview" class="w-full h-full object-cover">
                        <button type="button" @click="$store.app.removeImage()" class="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </template>
            </div>

            <!-- Submit Button -->
            <button 
                type="button" 
                @click="$store.app.submitReport()" 
                :disabled="$store.app.reportSubmitting"
                class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
                x-text="$store.app.reportSubmitting ? 'Mengirim...' : 'Kirim Laporan'"
            ></button>
        </div>
    </div>

    <!-- ROUTE PLANNER DRAWER -->
    <div x-show="$store.app.routePlannerOpen" class="fixed top-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-40" x-cloak>
        <div class="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
            <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                <i data-lucide="navigation" class="w-4 h-4 text-blue-600"></i>
                Rute Komuter Aman
            </h3>
            <button @click="$store.app.routePlannerOpen = false" class="text-gray-400 hover:text-gray-600">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <div class="space-y-2 mb-3">
            <!-- Start point (can use current location) -->
            <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></div>
                <button 
                    @click="$store.app.routeStartPoint = $store.app.userLocation" 
                    class="flex-1 text-left text-xs p-2.5 border rounded-xl truncate"
                    :class="$store.app.routeStartPoint ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-500'"
                >
                    <span x-text="$store.app.routeStartPoint ? 'Titik Awal: Lokasi GPS Saya' : 'Pilih Titik Awal (GPS)'"></span>
                </button>
            </div>

            <!-- Destination point -->
            <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
                <input 
                    type="text" 
                    placeholder="Ketik alamat tujuan..." 
                    class="flex-1 text-xs p-2.5 border border-gray-200 rounded-xl"
                    x-model="$store.app.routeDestQuery"
                    @input.debounce.400ms="
                        if ($store.app.routeDestQuery.length >= 3) {
                            SafeAPI.get('/api/geocode?q=' + encodeURIComponent($store.app.routeDestQuery)).then(r => $store.app.routeDestResults = r.data || []);
                        }
                    "
                >
            </div>

            <!-- Destination Search Results -->
            <div x-show="$store.app.routeDestResults.length > 0" class="bg-gray-50 border rounded-xl overflow-hidden divide-y divide-gray-200">
                <template x-for="item in $store.app.routeDestResults" :key="item.place_id">
                    <button 
                        @click="
                            $store.app.routeDestPoint = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
                            $store.app.routeDestQuery = item.display_name.split(',')[0];
                            $store.app.routeDestResults = [];
                        " 
                        class="w-full text-left p-2 text-xs truncate hover:bg-gray-100"
                        x-text="item.display_name"
                    ></button>
                </template>
            </div>
        </div>

        <!-- Calculate Route Button -->
        <div class="flex items-center gap-2">
            <button 
                @click="$store.app.calculateRoute()" 
                :disabled="$store.app.routeLoading || !$store.app.routeStartPoint || !$store.app.routeDestPoint"
                class="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                x-text="$store.app.routeLoading ? 'Menghitung...' : 'Cari Rute'"
            ></button>
            <button @click="$store.app.clearCurrentRoute()" class="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50">Reset</button>
        </div>

        <!-- Route Info Summary -->
        <template x-if="$store.app.routeInfo">
            <div class="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                <div class="flex justify-between font-bold">
                    <span>Jarak: <span x-text="$store.app.routeInfo.distance"></span> km</span>
                    <span>Waktu: ~<span x-text="$store.app.routeInfo.duration"></span> mnt</span>
                </div>
                <div class="text-amber-800 font-semibold">
                    ⚠️ <span x-text="$store.app.routeInfo.hazardCount"></span> bahaya terdeteksi di sepanjang rute ini.
                </div>
            </div>
        </template>
    </div>

    <!-- SIDE MENU DRAWER -->
    <div x-show="$store.app.menuOpen" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex" x-cloak>
        <div class="bg-white w-72 h-full shadow-2xl p-5 flex flex-col justify-between" @click.outside="$store.app.menuOpen = false">
            <div>
                <!-- Brand / Logo -->
                <div class="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                    <img src="/assets/img/logo.png" class="w-8 h-8 object-contain" onerror="this.style.display='none'">
                    <div>
                        <h2 class="font-bold text-gray-900 text-base leading-none">SafeCommute</h2>
                        <span class="text-[10px] text-gray-500">Bogor - Jakarta Hazard Map</span>
                    </div>
                </div>

                <!-- User Section -->
                <template x-if="$store.app.isLoggedIn">
                    <div class="mb-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                        <div class="truncate">
                            <p class="font-bold text-xs text-gray-900 truncate" x-text="$store.app.user.display_name"></p>
                            <p class="text-[11px] text-gray-500 truncate" x-text="$store.app.user.email"></p>
                        </div>
                        <button @click="$store.app.openProfile()" class="text-blue-600 hover:text-blue-800 p-1" title="Profil">
                            <i data-lucide="user" class="w-5 h-5"></i>
                        </button>
                    </div>
                </template>

                <template x-if="!$store.app.isLoggedIn">
                    <div class="mb-4">
                        <button @click="$store.app.authModalOpen = true; $store.app.menuOpen = false" class="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700">
                            Masuk / Daftar Akun
                        </button>
                    </div>
                </template>

                <!-- Navigation List -->
                <nav class="space-y-1">
                    <button @click="$store.app.openProfile()" x-show="$store.app.isLoggedIn" class="w-full text-left p-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                        <i data-lucide="shield" class="w-4 h-4 text-blue-500"></i>
                        <span>Laporan & Statistik Saya</span>
                    </button>
                    <button @click="$store.app.warningControlsOpen = true; $store.app.menuOpen = false" class="w-full text-left p-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                        <i data-lucide="bell" class="w-4 h-4 text-amber-500"></i>
                        <span>Pengaturan Radius & Filter</span>
                    </button>
                </nav>
            </div>

            <!-- Footer / Logout -->
            <div class="pt-4 border-t border-gray-100">
                <template x-if="$store.app.isLoggedIn">
                    <button @click="$store.app.logout()" class="w-full py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center gap-2">
                        <i data-lucide="log-out" class="w-4 h-4"></i>
                        <span>Keluar Akun</span>
                    </button>
                </template>
                <p class="text-[10px] text-center text-gray-400 mt-2">v2.0 (HTML5 + PHP 8.4 + MariaDB)</p>
            </div>
        </div>
    </div>

    <!-- AUTH MODAL -->
    <div x-show="$store.app.authModalOpen" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" x-cloak>
        <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6" @click.outside="$store.app.authModalOpen = false">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-900 text-base" x-text="$store.app.authTab === 'login' ? 'Masuk ke SafeCommute' : 'Buat Akun Baru'"></h3>
                <button @click="$store.app.authModalOpen = false" class="text-gray-400 hover:text-gray-600">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-gray-100 mb-4 text-xs font-bold">
                <button @click="$store.app.authTab = 'login'" class="flex-1 pb-2 border-b-2 text-center" :class="$store.app.authTab === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'">Masuk</button>
                <button @click="$store.app.authTab = 'register'" class="flex-1 pb-2 border-b-2 text-center" :class="$store.app.authTab === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'">Daftar</button>
            </div>

            <form @submit.prevent="$store.app.submitAuth()" class="space-y-3">
                <template x-if="$store.app.authTab === 'register'">
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                        <input type="text" x-model="$store.app.authName" required class="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                    </div>
                </template>

                <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" x-model="$store.app.authEmail" required class="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                    <input type="password" x-model="$store.app.authPassword" required minlength="6" class="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                </div>

                <button type="submit" :disabled="$store.app.authLoading" class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 disabled:opacity-50">
                    <span x-text="$store.app.authLoading ? 'Memproses...' : ($store.app.authTab === 'login' ? 'Masuk' : 'Daftar Sekarang')"></span>
                </button>
            </form>
        </div>
    </div>

    <!-- PROFILE / USER DASHBOARD MODAL -->
    <div x-show="$store.app.profileOpen" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" x-cloak>
        <div class="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto" @click.outside="$store.app.profileOpen = false">
            <div class="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 class="font-bold text-gray-900 text-base">Dashboard Pengguna</h3>
                <button @click="$store.app.profileOpen = false" class="text-gray-400 hover:text-gray-600">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Profile Summary Stats -->
            <template x-if="$store.app.myStats">
                <div class="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div class="p-2.5 bg-blue-50 rounded-xl">
                        <p class="text-xs text-blue-600 font-semibold">Laporan</p>
                        <p class="text-lg font-bold text-blue-900" x-text="$store.app.myStats.totalReports"></p>
                    </div>
                    <div class="p-2.5 bg-green-50 rounded-xl">
                        <p class="text-xs text-green-600 font-semibold">Vote</p>
                        <p class="text-lg font-bold text-green-900" x-text="$store.app.myStats.totalVotes"></p>
                    </div>
                    <div class="p-2.5 bg-purple-50 rounded-xl">
                        <p class="text-xs text-purple-600 font-semibold">Rata-rata Skor</p>
                        <p class="text-lg font-bold text-purple-900" x-text="$store.app.myStats.averageTrustScore"></p>
                    </div>
                </div>
            </template>

            <!-- Dashboard Tabs -->
            <div class="flex border-b border-gray-100 mb-3 text-xs font-bold">
                <button @click="$store.app.profileTab = 'reports'; $store.app.loadMyReports()" class="flex-1 pb-2 text-center border-b-2" :class="$store.app.profileTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'">Laporan Saya</button>
                <button @click="$store.app.profileTab = 'votes'; $store.app.loadMyVotes()" class="flex-1 pb-2 text-center border-b-2" :class="$store.app.profileTab === 'votes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'">Riwayat Vote</button>
            </div>

            <!-- Tab 1: My Reports List -->
            <div x-show="$store.app.profileTab === 'reports'" class="space-y-2">
                <template x-if="$store.app.myReports.length === 0">
                    <p class="text-xs text-center text-gray-400 py-6">Anda belum pernah membuat laporan.</p>
                </template>
                <template x-for="r in $store.app.myReports" :key="r.id">
                    <div class="p-3 border border-gray-100 rounded-xl flex items-start justify-between gap-2" :class="r.deleted_at ? 'opacity-40 bg-gray-50' : ''">
                        <div class="min-w-0">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1" :style="{ backgroundColor: r.color }" x-text="r.label"></span>
                            <p class="text-xs text-gray-700 truncate" x-text="r.description || 'Tanpa deskripsi'"></p>
                            <p class="text-[10px] text-gray-400 mt-0.5" x-text="SafeUtils.formatRelativeDate(r.created_at)"></p>
                        </div>
                        <div class="shrink-0 flex items-center gap-1" x-show="!r.deleted_at">
                            <button @click="$store.app.deleteMyReport(r.id)" class="text-red-500 hover:text-red-700 p-1.5" title="Hapus Laporan">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Tab 2: My Votes List -->
            <div x-show="$store.app.profileTab === 'votes'" class="space-y-2">
                <template x-if="$store.app.myVotes.length === 0">
                    <p class="text-xs text-center text-gray-400 py-6">Anda belum pernah memberikan vote.</p>
                </template>
                <template x-for="v in $store.app.myVotes" :key="v.report_id">
                    <div class="p-3 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                        <div class="min-w-0">
                            <p class="font-bold text-gray-900 truncate" x-text="v.report_type_label"></p>
                            <p class="text-[10px] text-gray-400" x-text="SafeUtils.formatRelativeDate(v.voted_at)"></p>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-bold" :class="v.vote_type === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" x-text="v.vote_type === 'up' ? '👍 Valid' : '👎 Palsu'"></span>
                    </div>
                </template>
            </div>
        </div>
    </div>

    <!-- WARNING RADIUS & FILTER CONTROLS MODAL -->
    <div x-show="$store.app.warningControlsOpen" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" x-cloak>
        <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6" @click.outside="$store.app.warningControlsOpen = false">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-900 text-base">Pengaturan Bahaya</h3>
                <button @click="$store.app.warningControlsOpen = false" class="text-gray-400 hover:text-gray-600">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Radius slider -->
            <div class="mb-4">
                <div class="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Radius Peringatan</span>
                    <span class="text-blue-600 font-bold" x-text="$store.app.warningRadius + ' KM'"></span>
                </div>
                <input type="range" min="1" max="10" step="1" x-model="$store.app.warningRadius" @change="$store.app.checkWarnings()" class="w-full">
            </div>

            <!-- Hazard filters -->
            <label class="block text-xs font-semibold text-gray-700 mb-2">Tampilkan di Peta</label>
            <div class="space-y-1.5 max-h-48 overflow-y-auto">
                <template x-for="t in $store.app.reportTypes" :key="t.value">
                    <label class="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer text-xs">
                        <span class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: t.color }"></span>
                            <span x-text="t.label"></span>
                        </span>
                        <input type="checkbox" :checked="$store.app.enabledTypes.has(t.value)" @change="$store.app.toggleHazardFilter(t.value)" class="rounded text-blue-600">
                    </label>
                </template>
            </div>
        </div>
    </div>

    <!-- Re-render Lucide icons on Alpine changes -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            setInterval(() => lucide.createIcons(), 1000);
        });
    </script>
</body>
</html>
