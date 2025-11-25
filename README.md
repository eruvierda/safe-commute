# SafeCommute

A mobile-first crowdsourced hazard mapping application for commuters in Jakarta/Bogor.

## Features

- **Interactive Map**: Full-screen map interface centered on Jakarta/Bogor region
- **Report Hazards**: Tap the "+" button to enter pin mode, then click on the map to report a hazard
- **Hazard Types**:
  - 🌊 Banjir (Flood) - Blue markers
  - 🚗 Macet (Traffic) - Red markers
  - ⚠️ Kriminal (Crime) - Dark red markers
  - 🚧 Jalan Rusak (Road Damage) - Orange markers
  - 💡 Lampu Mati (Light Out) - Gray markers
- **Real-time Updates**: See new reports from other users instantly
- **Locate Me**: GPS button to center map on your current location
- **Mobile-Optimized**: Designed for easy thumb operation on mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Maps**: react-leaflet + OpenStreetMap
- **Backend**: Supabase (PostgreSQL with PostGIS)
- **Icons**: Lucide React

## Getting Started

The application is ready to use. The database has been configured with:
- PostGIS extension for geospatial queries
- `reports` table with proper indexes
- Row Level Security (RLS) enabled with public read/write policies for MVP

## Usage

1. The map loads centered on Bogor/Jakarta coordinates
2. Click the blue "+" floating action button at the bottom
3. Click anywhere on the map to select a location
4. Fill out the hazard type and optional description
5. Submit the report
6. View all reports as colored markers on the map
7. Click any marker to see report details

## Database Schema

```sql
reports
├── id (uuid, primary key)
├── created_at (timestamptz)
├── type (text enum: banjir, macet, kriminal, jalan_rusak, lampu_mati)
├── description (text, nullable)
├── latitude (float8)
├── longitude (float8)
├── is_resolved (boolean)
├── trust_score (integer, default 0)
└── last_confirmed_at (timestamptz)

votes
├── report_id (uuid, foreign key to reports)
├── user_id (uuid)
├── vote_type (text: 'up' or 'down')
├── created_at (timestamptz)
└── PRIMARY KEY (report_id, user_id)
```

## Environment Variables

Supabase connection details are configured in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
