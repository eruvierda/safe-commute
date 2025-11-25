# SafeCommute - Next Development Roadmap

This document outlines potential features and improvements for future development of SafeCommute.

---

## 🎯 High Priority (MVP Enhancements)

### 1. Report Filtering & Search
**Priority**: High | **Effort**: Medium | **Impact**: High

- [ ] Filter reports by date range
- [ ] Search reports by description keywords
- [ ] Filter by trust score threshold (e.g., only show reports with score > 0)
- [ ] Sort reports (newest first, highest trust score, closest to user)
- [ ] Save filter preferences in localStorage

**Technical Notes**:
- Add filter UI in Menu component
- Implement client-side filtering for performance
- Consider debouncing search input

---

### 2. User Profile & History ✅ COMPLETED
**Priority**: High | **Effort**: Medium | **Impact**: High

- [x] View your own submitted reports
- [x] See your voting history
- [x] Personal statistics dashboard (reports submitted, votes cast, accuracy rate)
- [x] Edit your own reports (within 15 minutes of submission)
- [x] Delete your own reports (with confirmation)

**Implementation Notes**:
- ✅ User ID stored consistently in localStorage (UUID v4)
- ✅ Added `UserProfile` component with statistics dashboard
- ✅ Added `MyReports` component for viewing/editing/deleting reports
- ✅ Added `VotingHistory` component for viewing vote history
- ✅ Implemented `update_user_report()` function with 15-minute time limit
- ✅ Implemented soft delete via `delete_user_report()` function
- ✅ Implemented `get_user_voting_history()` function for vote tracking
- ✅ Added `user_id` and `deleted_at` columns to reports table
- ✅ Real-time vote count in user statistics

---

### 3. Photo Upload for Reports
**Priority**: High | **Effort**: High | **Impact**: Very High

- [ ] Add photo upload to ReportModal
- [ ] Support multiple photos per report (max 3)
- [ ] Image compression before upload
- [ ] Display photos in report popup
- [ ] Photo gallery/carousel view

**Technical Notes**:
- Use Supabase Storage for image hosting
- Implement image compression (e.g., browser-image-compression)
- Add image validation (max size, allowed formats)
- Update database schema to include photo URLs array
- Consider lazy loading for images

**Database Schema Update**:
```sql
ALTER TABLE reports ADD COLUMN photos text[] DEFAULT '{}';
```

---

### 4. Map Clustering
**Priority**: High | **Effort**: Medium | **Impact**: High

- [ ] Implement marker clustering for better performance
- [ ] Show cluster count badges
- [ ] Smooth cluster expansion on zoom
- [ ] Color-code clusters by dominant hazard type

**Technical Notes**:
- Use `react-leaflet-cluster` or `react-leaflet-markercluster`
- Configure cluster radius and max zoom
- Optimize for mobile performance
- Test with 1000+ markers

---

### 5. Enhanced Notifications
**Priority**: Medium | **Effort**: High | **Impact**: High

- [ ] Browser push notifications for nearby hazards
- [ ] Email alerts for severe hazards (optional)
- [ ] Subscribe to specific areas/routes
- [ ] Daily digest of reports in your area
- [ ] Notification preferences in settings

**Technical Notes**:
- Implement service worker for push notifications
- Request notification permissions
- Use Supabase Edge Functions for email sending
- Store notification preferences in database
- Add unsubscribe functionality

---

## 💡 Medium Priority (UX Improvements)

### 6. Social Features
**Priority**: Medium | **Effort**: Medium | **Impact**: Medium

- [ ] Comment on reports
- [ ] Share reports via WhatsApp/social media
- [ ] Follow specific locations
- [ ] Report trending hazards section
- [ ] "Thanks" button for helpful reports

**Technical Notes**:
- Add comments table with foreign key to reports
- Implement Web Share API for sharing
- Add location bookmarks feature
- Calculate trending based on recent activity

---

### 7. Analytics Dashboard
**Priority**: Medium | **Effort**: High | **Impact**: Medium

- [ ] Heatmap of most dangerous areas
- [ ] Time-based patterns (rush hour hazards)
- [ ] Historical trends charts
- [ ] Most active reporters leaderboard
- [ ] Area safety score

**Technical Notes**:
- Use Chart.js or Recharts for visualizations
- Implement heatmap layer on Leaflet
- Add date range selector
- Cache analytics data for performance
- Consider server-side aggregation

---

### 8. Offline Support (PWA)
**Priority**: Medium | **Effort**: High | **Impact**: High

- [ ] Service worker for offline functionality
- [ ] Cache recent reports for offline viewing
- [ ] Queue reports when offline, sync when online
- [ ] Offline map tiles caching
- [ ] Install as mobile app

**Technical Notes**:
- Configure Vite PWA plugin
- Implement background sync API
- Cache strategy: Network first, fallback to cache
- Add offline indicator in UI
- Test offline scenarios thoroughly

---

### 9. Accessibility Enhancements
**Priority**: Medium | **Effort**: Low | **Impact**: Medium

- [ ] High contrast mode toggle
- [ ] Font size adjustment (A-, A, A+)
- [ ] Voice commands for reporting (Web Speech API)
- [ ] Text-to-speech for report details
- [ ] Keyboard shortcuts guide

**Technical Notes**:
- Add accessibility settings panel
- Implement CSS custom properties for theming
- Use Web Speech API for voice features
- Add keyboard shortcut hints (? key)
- Test with screen readers (NVDA, JAWS)

---

### 10. Gamification
**Priority**: Low | **Effort**: Medium | **Impact**: Medium

- [ ] Badges for contributions (First Report, 10 Reports, Validator, etc.)
- [ ] Points system for accurate reports
- [ ] User levels/ranks (Novice, Expert, Guardian)
- [ ] Monthly top contributor recognition
- [ ] Achievement notifications

**Technical Notes**:
- Add user_stats table for tracking
- Implement badge system with icons
- Calculate points based on report accuracy and votes
- Add achievements modal/page
- Consider weekly/monthly leaderboards

---

## 🚀 Advanced Features (Post-MVP)

### 11. AI/ML Integration
**Priority**: Low | **Effort**: Very High | **Impact**: High

- [ ] Auto-categorize reports from description (NLP)
- [ ] Predict hazard likelihood based on patterns
- [ ] Suggest optimal routes avoiding hazards
- [ ] Detect duplicate/spam reports automatically
- [ ] Image recognition for hazard type

**Technical Notes**:
- Use OpenAI API or local ML models
- Implement text classification for auto-categorization
- Train model on historical data
- Consider edge ML for privacy
- Add confidence scores to predictions

---

### 12. External API Integrations
**Priority**: Low | **Effort**: High | **Impact**: Medium

- [ ] Traffic API integration (Google Maps Traffic Layer)
- [ ] Weather API for flood predictions
- [ ] Government incident reports feed
- [ ] Public transportation delays
- [ ] Road closure data

**Technical Notes**:
- Evaluate API costs and rate limits
- Implement caching for API responses
- Add API key management
- Handle API failures gracefully
- Display external data with different markers

---

### 13. Admin/Moderation Panel
**Priority**: Medium | **Effort**: High | **Impact**: High

- [ ] Review flagged reports
- [ ] Manage users (ban, warn)
- [ ] Analytics and insights dashboard
- [ ] Bulk operations (delete, resolve)
- [ ] Export data for authorities (CSV, JSON)

**Technical Notes**:
- Create admin role in database
- Build separate admin UI
- Implement role-based access control
- Add audit logs for admin actions
- Create data export functionality

---

### 14. Multi-language Support (i18n)
**Priority**: Low | **Effort**: Medium | **Impact**: Medium

- [ ] Support English, Indonesian, Sundanese
- [ ] Auto-detect user language from browser
- [ ] Translate report descriptions (optional)
- [ ] Localized date/time formats
- [ ] RTL support for future languages

**Technical Notes**:
- Use react-i18next or similar
- Create translation files (en.json, id.json)
- Implement language switcher in menu
- Store language preference
- Consider machine translation API for user content

---

### 15. Advanced Security
**Priority**: High | **Effort**: High | **Impact**: Very High

- [ ] Rate limiting (5 reports per hour per user)
- [ ] CAPTCHA on report submission (reCAPTCHA v3)
- [ ] IP-based spam detection
- [ ] Report flagging system
- [ ] User reputation scores
- [ ] Implement Supabase Auth

**Technical Notes**:
- Add rate_limits table
- Implement CAPTCHA verification
- Use Supabase Edge Functions for rate limiting
- Add flag_report RPC function
- Calculate reputation based on report accuracy

**Database Schema**:
```sql
CREATE TABLE user_rate_limits (
  user_id uuid PRIMARY KEY,
  report_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now()
);

CREATE TABLE report_flags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid REFERENCES reports(id),
  user_id uuid,
  reason text,
  created_at timestamptz DEFAULT now()
);
```

---

## 🛠️ Technical Improvements

### 16. Performance Optimization
**Priority**: Medium | **Effort**: Medium | **Impact**: High

- [ ] Virtual scrolling for large report lists
- [ ] Lazy loading of map markers
- [ ] Image optimization and CDN
- [ ] Code splitting by route
- [ ] Implement React.memo for expensive components

**Technical Notes**:
- Use react-window for virtual scrolling
- Implement viewport-based marker loading
- Configure Cloudflare/Vercel CDN
- Use React.lazy and Suspense
- Profile with React DevTools

---

### 17. Testing & Quality Assurance
**Priority**: High | **Effort**: High | **Impact**: High

- [ ] Unit tests for utilities (Vitest)
- [ ] Component tests (React Testing Library)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Performance testing (Lighthouse CI)
- [ ] Accessibility testing (axe-core)

**Technical Notes**:
- Aim for 80%+ code coverage
- Test critical user flows
- Add CI/CD pipeline for tests
- Set up automated accessibility checks
- Performance budgets in CI

---

### 18. DevOps & Monitoring
**Priority**: Medium | **Effort**: Medium | **Impact**: High

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics, Mixpanel)
- [ ] Performance monitoring (Web Vitals)
- [ ] Automated database backups

**Technical Notes**:
- Set up GitHub Actions workflow
- Configure Sentry for error tracking
- Implement analytics events
- Monitor Core Web Vitals
- Schedule daily Supabase backups

---

## ⚡ Quick Wins (Easy to Implement)

### 19. UI Polish
**Priority**: Low | **Effort**: Low | **Impact**: Medium

- [ ] Loading skeletons for reports
- [ ] Empty states with illustrations
- [ ] Smooth transitions/animations
- [ ] Haptic feedback on mobile
- [ ] Pull-to-refresh on mobile

**Technical Notes**:
- Create skeleton components
- Add empty state SVGs
- Use Framer Motion for animations
- Implement Vibration API
- Use touch events for pull-to-refresh

---

### 20. Small Quality-of-Life Features
**Priority**: Low | **Effort**: Low | **Impact**: Low

- [ ] "Copy coordinates" button
- [ ] "Get directions" link (opens Google Maps)
- [ ] Report expiry countdown timer
- [ ] "Last updated" timestamp
- [ ] Weather overlay on map
- [ ] Dark mode toggle

**Technical Notes**:
- Use Clipboard API
- Generate Google Maps URL
- Implement countdown with setInterval
- Add relative time updates
- Integrate weather tile layer
- CSS custom properties for theming

---

## 📋 Implementation Priority Matrix

### Must Have (Next Sprint)
1. ✅ Toast notifications (implemented with react-hot-toast)
2. ✅ User profile/history (implemented with edit/delete functionality)
3. Map clustering
4. Photo upload for reports

### Should Have (Next Month)
5. Report filtering & search
6. Enhanced notifications
7. Admin panel basics
8. Advanced security (rate limiting, CAPTCHA)

### Nice to Have (Next Quarter)
9. Analytics dashboard
10. PWA/Offline support
11. Social features
12. Gamification

### Future Consideration
13. AI/ML integration
14. Multi-language support
15. External API integrations

---

## 🎯 Recommended Next Steps

Based on current state and user needs, I recommend implementing in this order:

1. ✅ ~~**Toast notifications**~~ - Completed with react-hot-toast
2. ✅ ~~**User profile**~~ - Completed with statistics, edit, and delete features
3. **Map clustering** - Essential for performance with many reports
4. **Photo upload** - Visual proof significantly increases report trust
5. **Rate limiting** - Prevent spam before it becomes a problem
6. **Voting history** - Complete the user profile feature set

---

## 📝 Notes

- All features should maintain mobile-first design
- Consider performance impact on low-end devices
- Ensure accessibility in all new features
- Document new features in README
- Update CODE_REVIEW.md with implementation notes

---

**Last Updated**: 2025-11-25  
**Version**: 1.2  
**Maintainer**: Development Team

## 📊 Recent Updates (v1.2)

- ✅ **Voting History**: Complete voting history view with vote type indicators
- ✅ **User Profile System**: Complete user statistics dashboard
- ✅ **Report Management**: Edit reports within 15 minutes, soft delete functionality
- ✅ **MyReports Component**: Dedicated view for user's own reports
- ✅ **Database Schema**: Added `user_id` and `deleted_at` columns
- ✅ **Toast Notifications**: Improved UX with react-hot-toast
