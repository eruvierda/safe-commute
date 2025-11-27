# SafeCommute

A mobile-first crowdsourced hazard mapping application for commuters in Jakarta/Bogor.

## Features

### Core Functionality
- **Interactive Map**: Full-screen map interface centered on Jakarta/Bogor region
- **Report Hazards**: Tap the "+" button to enter pin mode, then click on the map to report a hazard
- **Hazard Types**:
  - 🌊 Banjir (Flood) - Blue markers
  - 🚗 Macet (Traffic) - Red markers
  - ⚠️ Kriminal (Crime) - Dark red markers
  - 🚧 Jalan Rusak (Road Damage) - Orange markers
  - 💡 Lampu Mati (Light Out) - Gray markers
- **Real-time Updates**: See new reports from other users instantly via Supabase subscriptions
- **Locate Me**: GPS button to center map on your current location
- **Mobile-Optimized**: Designed for easy thumb operation on mobile devices

### Smart Report Expiration (TTL)
Reports automatically expire based on hazard type to keep data fresh:
- **Short-lived hazards** (Flood, Traffic, Crime): Auto-expire after **3 hours**
- **Long-lived hazards** (Road Damage, Lights Out): Auto-expire after **7 days**
- **Community validation**: Upvotes extend report lifetime by resetting `last_confirmed_at`
- No data deletion - filtering happens at query time via `get_active_reports()` function

### Trust Score System
Community-driven accuracy through voting:
- Reports start at `trust_score = 0`
- **Upvote** (+1): "This report is valid"
- **Downvote** (-1): "This report is fake/outdated"
- Reports with `trust_score ≤ -3` are automatically hidden
- Reports with `trust_score > 5` get a ⭐ "Verified" badge
- Encourages community participation and data quality

### Proximity Warning System
Stay alert to nearby hazards:

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Maps**: react-leaflet + OpenStreetMap
- **Backend**: Supabase (PostgreSQL with PostGIS)
- **Icons**: Lucide React
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safe-commute
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the migrations in order from `supabase/migrations/`:
   - `20251124035722_create_reports_table.sql`
   - `20251124044642_add_ttl_logic_for_reports.sql`
   - `20251124050000_create_votes_table_and_trust_score.sql`
   - `20251125_add_user_profile_support.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to `http://localhost:5173`

## Usage

1. The map loads centered on Bogor/Jakarta coordinates
2. Click the blue "+" floating action button at the bottom
3. Click anywhere on the map to select a location
4. Fill out the hazard type and optional description (max 500 characters)
5. Submit the report - you'll see a success notification
6. View all reports as colored markers on the map
7. Click any marker to see report details and vote on accuracy
8. Use the menu (top-left) to:
   - Enable proximity warnings and filter hazard types
   - Access your user profile and statistics
   - View, edit, or delete your own reports

## Database Schema

```sql
reports
├── id (uuid, primary key)
├── created_at (timestamptz)
├── type (text enum: banjir, macet, kriminal, jalan_rusak, lampu_mati)
├── description (text, nullable, max 500 chars)
├── latitude (float8, validated -90 to 90)
├── longitude (float8, validated -180 to 180)
├── is_resolved (boolean, default false)
├── trust_score (integer, default 0)
├── last_confirmed_at (timestamptz, updated on upvote)
├── user_id (uuid, nullable, tracks report owner)
└── deleted_at (timestamptz, nullable, for soft deletes)

votes
├── report_id (uuid, foreign key to reports)
├── user_id (uuid, stored in localStorage)
├── vote_type (text: 'up' or 'down')
├── created_at (timestamptz)
└── PRIMARY KEY (report_id, user_id)
```

### Key Database Functions

- `get_active_reports()`: Returns only non-expired, non-deleted reports based on TTL rules
- `handle_vote(report_id, user_id, vote_type)`: Processes votes and updates trust scores
- `get_user_reports(user_id)`: Returns all reports created by a specific user (including deleted)
- `update_user_report(report_id, user_id, type, description)`: Updates report if owner and within 15 minutes
- `delete_user_report(report_id, user_id)`: Soft deletes report if owner

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests with Vitest

### Code Quality

The project includes:
- ✅ TypeScript for type safety
- ✅ ESLint for code quality
- ✅ Input validation utilities
- ✅ Comprehensive error handling with toast notifications
- ✅ Accessibility features (ARIA labels, semantic HTML)

## Security Notes

**Current MVP Setup**:
- Public RLS policies allow anonymous read/write access
- User IDs stored in localStorage (UUID v4)
- No authentication required

**Recommended for Production**:
- Implement Supabase Auth
- Add rate limiting (max 5 reports per hour per user)
- Add CAPTCHA for report submission
- Implement content moderation system
- Add report flagging functionality

## Troubleshooting

### TypeScript Error: "Parameter 'cluster' implicitly has an 'any' type"

**Problem**: When working with `react-leaflet-cluster`, you may encounter this TypeScript error in `MapView.tsx`:
```
Parameter 'cluster' implicitly has an 'any' type. @[MapView.tsx:L427]
```

**Root Cause**: The `MarkerCluster` type comes from the `leaflet.markercluster` package, which requires separate type definitions that may not be installed by default.

**Solution**:

1. **Install the type definitions**:
   ```bash
   npm install --save-dev @types/leaflet.markercluster
   ```

2. **Import the MarkerCluster type** in your component:
   ```tsx
   import { Icon, LatLngTuple, MarkerCluster } from 'leaflet';
   import 'leaflet.markercluster'; // Import for type augmentation
   ```

3. **Add explicit type annotation** to the cluster parameter:
   ```tsx
   iconCreateFunction={(cluster: MarkerCluster) => {
     const count = cluster.getChildCount();
     // ... rest of your code
   }}
   ```

4. **Verify the fix**:
   ```bash
   npm run typecheck
   ```

The type check should now pass without errors.

### Other Common Issues

**Map not loading**:
- Verify your internet connection (OpenStreetMap tiles require internet)
- Check browser console for CORS or network errors
- Ensure Leaflet CSS is properly imported

**Reports not appearing**:
- Check Supabase connection in browser DevTools Network tab
- Verify environment variables in `.env` are correct
- Ensure database migrations have been run in order
- Check that reports haven't expired based on TTL rules

**Geolocation not working**:
- Grant location permissions in your browser
- Use HTTPS in production (geolocation requires secure context)
- Check browser compatibility (most modern browsers support it)

## Contributing

See [CODE_REVIEW.md](CODE_REVIEW.md) for detailed code analysis and improvement suggestions.

## License

[Add your license here]

## Acknowledgments

- OpenStreetMap contributors for map data
- Supabase for backend infrastructure
- Jakarta/Bogor commuter community
