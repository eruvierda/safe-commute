import random
import datetime
import math

def generate_dummy_data():
    center_lat = -6.597
    center_lng = 106.799
    radius_km = 15
    num_records = 150
    
    report_types = ['banjir', 'macet', 'kriminal', 'jalan_rusak', 'lampu_mati']
    descriptions = {
        'banjir': ['Banjir setinggi lutut', 'Genangan air cukup tinggi', 'Banjir bandang kecil', 'Jalan tergenang air'],
        'macet': ['Macet total tidak bergerak', 'Padat merayap', 'Kecelakaan menyebabkan macet', 'Lampu merah mati bikin macet'],
        'kriminal': ['Pencurian motor', 'Begal di malam hari', 'Pecah kaca mobil', 'Copet di angkot'],
        'jalan_rusak': ['Lubang besar di tengah jalan', 'Aspal mengelupas', 'Jalan bergelombang parah', 'Jalan amblas'],
        'lampu_mati': ['PJU mati total', 'Lampu jalan kedip-kedip', 'Gelap gulita rawan kejahatan', 'Tiang lampu roboh']
    }

    sql_statements = []
    
    # 1 degree lat is approx 111km
    # 1 degree lng is approx 111km * cos(lat)
    lat_offset_max = radius_km / 111.0
    lng_offset_max = radius_km / (111.0 * math.cos(math.radians(center_lat)))

    for i in range(num_records):
        # Random location within square bounds (approx circle)
        lat_offset = random.uniform(-lat_offset_max, lat_offset_max)
        lng_offset = random.uniform(-lng_offset_max, lng_offset_max)
        
        # Simple rejection sampling for circle
        if (lat_offset/lat_offset_max)**2 + (lng_offset/lng_offset_max)**2 > 1:
             # Try again or just clamp? Let's just generate another simple one to keep it fast/easy or accept square for dummy data.
             # Let's just accept the square distribution for simplicity as it covers the radius.
             pass

        lat = center_lat + lat_offset
        lng = center_lng + lng_offset
        
        r_type = random.choice(report_types)
        desc = random.choice(descriptions[r_type])
        
        # Random time in last 7 days
        days_ago = random.uniform(0, 7)
        created_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
        created_at_str = created_at.strftime('%Y-%m-%d %H:%M:%S')
        
        trust_score = random.randint(0, 10)
        is_resolved = 'true' if random.random() < 0.3 else 'false'
        
        # Escape single quotes in description if any (none in my list but good practice)
        desc = desc.replace("'", "''")
        
        sql = f"INSERT INTO reports (type, description, latitude, longitude, trust_score, is_resolved, created_at, last_confirmed_at) VALUES ('{r_type}', '{desc}', {lat:.6f}, {lng:.6f}, {trust_score}, {is_resolved}, '{created_at_str}', '{created_at_str}');"
        sql_statements.append(sql)

    with open('dummy_data.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))
    
    print(f"Generated {num_records} records in dummy_data.sql")

if __name__ == "__main__":
    generate_dummy_data()
