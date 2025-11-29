const fs = require('fs');

function generateValidDummyData() {
    // Center roughly between land and sea for Jakarta Bay area
    const centerLat = -6.100000;
    const centerLng = 106.865528;
    const radiusKm = 15;
    const numRecords = 300; // Total records

    // Land types
    const landTypes = ['banjir', 'macet', 'kriminal', 'jalan_rusak', 'lampu_mati'];
    // Sea types
    const seaTypes = ['banjir_rob', 'tanggul_jebol', 'kapal_tenggelam'];

    const descriptions = {
        'banjir': ['Banjir setinggi lutut', 'Genangan air cukup tinggi', 'Banjir bandang kecil', 'Jalan tergenang air'],
        'macet': ['Macet total tidak bergerak', 'Padat merayap', 'Kecelakaan menyebabkan macet', 'Lampu merah mati bikin macet'],
        'kriminal': ['Pencurian motor', 'Begal di malam hari', 'Pecah kaca mobil', 'Copet di angkot'],
        'jalan_rusak': ['Lubang besar di tengah jalan', 'Aspal mengelupas', 'Jalan bergelombang parah', 'Jalan amblas'],
        'lampu_mati': ['PJU mati total', 'Lampu jalan kedip-kedip', 'Gelap gulita rawan kejahatan', 'Tiang lampu roboh'],
        'banjir_rob': ['Air laut pasang tinggi', 'Tanggul rembes air laut', 'Jalan pesisir tergenang', 'Rumah warga kemasukan air laut'],
        'tanggul_jebol': ['Tanggul penahan ombak jebol', 'Air meluap melewati tanggul', 'Retakan besar di tanggul', 'Tanggul kritis hampir jebol'],
        'kapal_tenggelam': ['Kapal nelayan karam', 'Kapal barang miring', 'Perahu wisata terbalik', 'Bangkai kapal menghalangi jalur']
    };

    const sqlStatements = [];

    const latOffsetMax = radiusKm / 111.0;
    const lngOffsetMax = radiusKm / (111.0 * Math.cos(centerLat * Math.PI / 180));

    // Simple "coastline" approximation at -6.11 (North of this is sea, South is land)
    const coastlineLat = -6.11;

    for (let i = 0; i < numRecords; i++) {
        const latOffset = (Math.random() * 2 - 1) * latOffsetMax;
        const lngOffset = (Math.random() * 2 - 1) * lngOffsetMax;

        const lat = centerLat + latOffset;
        const lng = centerLng + lngOffset;

        let rType;

        if (lat > coastlineLat) {
            // Sea area (North, closer to 0) - mostly sea types, maybe some land types near coast
            if (Math.random() < 0.8) {
                rType = seaTypes[Math.floor(Math.random() * seaTypes.length)];
            } else {
                // Some overlap
                rType = landTypes[Math.floor(Math.random() * landTypes.length)];
            }
        } else {
            // Land area (South)
            rType = landTypes[Math.floor(Math.random() * landTypes.length)];
        }

        const descList = descriptions[rType];
        let desc = descList[Math.floor(Math.random() * descList.length)];

        // TTL Logic
        let daysAgo;
        if (['banjir', 'macet', 'kriminal', 'banjir_rob'].includes(rType)) {
            daysAgo = Math.random() * 0.1; // < 2.4 hours
        } else {
            daysAgo = Math.random() * 6; // < 6 days
        }

        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const createdAtStr = createdAt.toISOString().replace('T', ' ').substring(0, 19);

        const trustScore = Math.floor(Math.random() * 11);
        const isResolved = Math.random() < 0.3 ? 'true' : 'false';

        desc = desc.replace(/'/g, "''");

        const sql = `INSERT INTO reports (type, description, latitude, longitude, trust_score, is_resolved, created_at, last_confirmed_at) VALUES ('${rType}', '${desc}', ${lat.toFixed(6)}, ${lng.toFixed(6)}, ${trustScore}, ${isResolved}, '${createdAtStr}', '${createdAtStr}');`;
        sqlStatements.push(sql);
    }

    fs.writeFileSync('dummy_data.sql', sqlStatements.join('\n'), 'utf8');
    console.log(`Generated ${numRecords} records in dummy_data.sql with sea/land logic`);
}

generateValidDummyData();
