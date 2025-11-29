const fs = require('fs');

function generateDummyDataV2() {
    const centerLat = -6.180800;
    const centerLng = 106.865528;
    const radiusKm = 15;
    const numRecords = 150;

    const reportTypes = ['banjir', 'macet', 'kriminal', 'jalan_rusak', 'lampu_mati'];
    const descriptions = {
        'banjir': ['Banjir setinggi lutut', 'Genangan air cukup tinggi', 'Banjir bandang kecil', 'Jalan tergenang air'],
        'macet': ['Macet total tidak bergerak', 'Padat merayap', 'Kecelakaan menyebabkan macet', 'Lampu merah mati bikin macet'],
        'kriminal': ['Pencurian motor', 'Begal di malam hari', 'Pecah kaca mobil', 'Copet di angkot'],
        'jalan_rusak': ['Lubang besar di tengah jalan', 'Aspal mengelupas', 'Jalan bergelombang parah', 'Jalan amblas'],
        'lampu_mati': ['PJU mati total', 'Lampu jalan kedip-kedip', 'Gelap gulita rawan kejahatan', 'Tiang lampu roboh']
    };

    const sqlStatements = [];

    // 1 degree lat is approx 111km
    // 1 degree lng is approx 111km * cos(lat)
    const latOffsetMax = radiusKm / 111.0;
    const lngOffsetMax = radiusKm / (111.0 * Math.cos(centerLat * Math.PI / 180));

    for (let i = 0; i < numRecords; i++) {
        const latOffset = (Math.random() * 2 - 1) * latOffsetMax;
        const lngOffset = (Math.random() * 2 - 1) * lngOffsetMax;

        const lat = centerLat + latOffset;
        const lng = centerLng + lngOffset;

        const rType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
        const descList = descriptions[rType];
        let desc = descList[Math.floor(Math.random() * descList.length)];

        // Random time in last 7 days
        const daysAgo = Math.random() * 7;
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const createdAtStr = createdAt.toISOString().replace('T', ' ').substring(0, 19);

        const trustScore = Math.floor(Math.random() * 11);
        const isResolved = Math.random() < 0.3 ? 'true' : 'false';

        desc = desc.replace(/'/g, "''");

        const sql = `INSERT INTO reports (type, description, latitude, longitude, trust_score, is_resolved, created_at, last_confirmed_at) VALUES ('${rType}', '${desc}', ${lat.toFixed(6)}, ${lng.toFixed(6)}, ${trustScore}, ${isResolved}, '${createdAtStr}', '${createdAtStr}');`;
        sqlStatements.push(sql);
    }

    fs.appendFileSync('dummy_data.sql', '\n' + sqlStatements.join('\n'), 'utf8');
    console.log(`Appended ${numRecords} records to dummy_data.sql`);
}

generateDummyDataV2();
