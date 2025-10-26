# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Environment
```bash
npm run dev              # Start development server on port 8080
npm run build            # Production build
npm run build:dev        # Development build (faster, less optimized)
npm run lint             # ESLint code checking
npm run preview          # Preview production build locally
npm run seed:auth        # Seed authentication data (17 users)
npm run seed:auth:create # Same as seed:auth - creates users with working passwords
npm run seed:passwords  # Generate and apply working password hashes
npm run seed:properties  # Seed property data (30+ properties)
```

### Mobile Development (Capacitor)
```bash
npx cap sync             # Sync web assets to native platforms
npx cap open android     # Open Android Studio
npx cap open ios         # Open Xcode
npx cap run android      # Run on Android device/emulator
npx cap run ios          # Run on iOS device/emulator
CAPACITOR=true npm run build  # Build specifically for mobile
```

### Testing & Quality
```bash
npx vitest              # Run Vitest tests
npx vitest ui           # Run tests with Vitest UI
npx vitest run          # Run tests once
npx vitest run --coverage  # Run tests with coverage report
npx jscpd .             # Detect duplicate code (configured in .jscpd.json)
```

### Environment Setup
Create `.env.local` with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_MAPBOX_PUBLIC_TOKEN=your_mapbox_token
VITE_SENTRY_DSN=your_sentry_dsn  # Optional for error tracking
```

**Important**: Supabase keys have secure fallbacks for local development in `src/lib/supabase.ts`

## Architecture Overview

### Multi-Platform Real Estate Application
- **Web PWA**: Progressive Web App with offline capabilities
- **Mobile Native**: Capacitor-based iOS and Android apps
- **Backend**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Maps**: Mapbox GL JS with Supercluster clustering
- **Authentication**: Multi-factor auth with role-based access control

### Multi-Tenant Role System
The application supports 5 distinct user roles with separate dashboards:
- **admin_ansut** (Platform Admin): Full system administration and user management
- **propriétaire** (Owner): Property management and tenant applications (9 users)
- **locataire** (Tenant): Property search and lease management (4 users)
- **agence** (Agency): Portfolio management and mandates (2 users)
- **tiers_de_confiance** (Third-party Trust): Certification and mediation (1 user)

**Test Accounts** (updated emails and passwords):
- Admin: `admin@mon-toit.ci` / `admin123`
- Owners: `kouadio.jean@mon-toit.ci` / `proprietaire123`, `marie.aya@mon-toit.ci`, `koffi.alain@mon-toit.ci`, etc.
- Tenants: `yao.konan@mon-toit.ci` / `locataire123`, `aminata.diarra@mon-toit.ci`, etc.
- Agencies: `contact@agence-cocody.ci` / `agence123`, `info@ankou-realestate.ci` / `agence123`
- Tiers: `notaire.konan@mon-toit.ci` / `tiers123`

### Key Directory Structure

#### Core Application (`src/`)
- `pages/`: 40+ React components for different routes including role-specific dashboards
- `components/`: Reusable UI components organized by feature
  - `ui/`: shadcn/ui components with custom cultural theming
  - `auth/`: Authentication and MFA components
  - `admin/`: Administrative interface components
  - `agency/`: Agency-specific components
  - `navigation/`: Mobile navigation patterns
- `hooks/`: 50+ custom React hooks for business logic
- `lib/`: Core utilities, Supabase client, query configuration
- `contexts/`: React contexts for global state management
- `data/`: Static data for Abidjan neighborhoods, POIs, and constants

#### Configuration Files
- `vite.config.ts`: Vite configuration with PWA and Capacitor support
- `capacitor.config.ts`: Native app configuration with security settings
- `supabase.ts`: Database client with secure storage integration
- `vitest.config.ts`: Test configuration with coverage and aliases
- `tailwind.config.ts`: Tailwind CSS with custom design system
- `eslint.config.js`: Code quality and security rules
- `components.json`: shadcn/ui component configuration

### State Management & Data Flow
- **TanStack Query**: Server state management with caching and synchronization
- **React Context**: Global state for auth, theme, and user preferences
- **Secure Storage**: Encrypted local storage for sensitive data
- **Offline Sync**: Workbox-based caching with intelligent invalidation

### Security Architecture
- **RLS Policies**: Database-level access control for all tables
- **MFA Support**: Multi-factor authentication for admin users
- **Secure Storage**: Encrypted client-side storage for auth tokens
- **CORS & Headers**: Security headers configured in Vite and Vercel
- **Role-Based Permissions**: Component-level access control

### Map & Location System
- **Supercluster**: Point clustering for performance with large datasets
- **Abidjan Focus**: 28 POIs across 6 categories in 10 defined neighborhoods
- **Geolocation**: Native device location integration with fallbacks
- **Heat Mapping**: Price density visualization

### Performance Optimizations
- **Code Splitting**: Automatic route-based and feature-based splitting
- **Image Optimization**: WebP format with compression
- **PWA Caching**: Strategic caching for API responses and assets
- **Bundle Analysis**: Built-in bundle analyzer integration

### UI/UX Features
- **Cultural Design**: Ivorian patterns (Kente, Akan, Bogolan) integrated
- **Mobile-First**: Responsive design with native mobile gestures
- **Accessibility**: WCAG compliance with screen reader support
- **Dark Mode**: System-preference based theming

### Testing & Quality
- **ESLint**: Code quality with React and TypeScript rules
- **SonarJS**: Additional security and quality checks (eslint-plugin-sonarjs)
- **TypeScript**: Full type safety with extended Supabase types
- **Vitest**: Unit testing framework with coverage and UI interface
- **JSCPD**: Duplicate code detection with configurable thresholds (.jscpd.json)
- **Test Structure**: Tests located in `tests/` directory with security focus
- **Coverage**: Configured for src/ directory excluding type definitions

## Development Notes

### Supabase Integration & Database Management
- Uses environment variables with secure fallbacks for local development
- Only ANON keys are exposed to the client - never use service_role keys
- All database operations should go through the configured Supabase client in `src/lib/supabase.ts`
- TypeScript types are auto-generated in `src/integrations/supabase/types.ts`
- **Seed Data**: Complete seed in `supabase/seed.sql` with 17 users and 30+ properties

```bash
# Database Management
docker exec supabase_db_mon-toit psql -U postgres -d postgres -f supabase/seed.sql
docker exec supabase_db_mon-toit psql -U postgres -d postgres -c "SELECT role, COUNT(*) FROM public.user_roles GROUP BY role;"
```

### Mapbox & Location System
- Mapbox tokens should be set in environment variables
- Custom styles and clustering are configured for Abidjan region
- POI data is pre-loaded in `src/data/abidjanPOI.ts`
- **Supercluster**: Point clustering for performance with large datasets
- **Geolocation**: Native device location integration with fallbacks

### Mobile Development Workflow
1. Make changes to web code
2. Run `npm run build` to create dist folder
3. Run `npx cap sync` to copy changes to native platforms
4. Use platform-specific IDEs (Android Studio/Xcode) for device testing

### Role-Based Development
When creating new features, consider which roles can access them:
- Use `useRequireRole` and `useRequireRoles` hooks for access control
- Role-specific components should be organized in appropriate directories
- Dashboard routes are protected and redirect based on user role

### Security Architecture
- **RLS Policies**: Database-level access control for all tables
- **MFA Support**: Multi-factor authentication for admin users
- **Secure Storage**: Encrypted client-side storage for auth tokens
- **Input Sanitization**: All form inputs sanitized using DOMPurify
- **Error Sanitization**: Error messages sanitized to prevent information leakage
- **Native App Security**: Restricted navigation in `capacitor.config.ts`
- **PWA Security**: Service worker caching strategies in `vite.config.ts`

### Authentication & Role System
- **Multi-factor authentication** with OTP verification for sensitive operations
- **Role-based redirection** handled in `useAuthEnhanced.tsx` and `ProtectedRoute.tsx`
- **User roles stored** in `public.user_roles` table with RLS policies
- **Login attempt tracking** in `public.login_attempts` with rate limiting
- **Session management** with secure storage and device fingerprinting
- **Default role fallback** to 'locataire' if no role found

### Common Issues & Solutions
- **All users redirect to tenant dashboard**: Check `user_roles` table is populated
- **Authentication fails**: Verify password hashes are compatible with Supabase auth
- **404 on check_login_rate_limit**: Grant EXECUTE permissions on RPC function to anon/authenticated roles
- **401 on login_attempts**: Update RLS policy to allow anonymous INSERT operations
- **Missing user profiles**: Run `npm run seed:auth` to create proper user data

### Offline Development
The PWA includes sophisticated offline capabilities:
- API responses cached with NetworkFirst strategy
- Images use CacheFirst strategy
- App remains functional during network interruptions
- Sync operations handle conflict resolution gracefully

### Code Quality & Testing
- **JSCPD**: Duplicate code detection with 3-line threshold, 50 token minimum (configured in .jscpd.json)
- **ESLint**: Code quality with React, TypeScript, and SonarJS rules
- **Vitest**: Unit testing framework with coverage and UI interface
- **Test Coverage**: Configured for src/ directory excluding type definitions
- **Test Setup**: Global test configuration in `tests/setup.ts` with mocked environment variables
- **Security Focus**: Tests emphasize authentication, authorization, and input validation scenarios

### Build Configuration
- **PWA Manifest**: Auto-generated with Workbox caching strategies
- **Capacitor Build**: Excludes Capacitor modules from web builds
- **Code Splitting**: Automatic route-based and feature-based splitting
- **Source Maps**: Enabled in production for Sentry integration
- **Bundle Analysis**: Custom chunk and asset naming patterns
- **Image Optimization**: WebP format with compression
- **Asset Caching**: Strategic caching for API responses and static assets

### Hook Architecture
The application uses 70+ custom React hooks organized by functionality:
- **Authentication**: `useAuthEnhanced`, `useRequireRole`, `useMfaStatus`, `useMfaCompliance`
- **Properties**: `useProperties`, `usePropertyDetail`, `usePropertyFilters`, `usePropertyForm`, `usePropertyDelete`, `usePropertyPermissions`, `usePropertyImageAccess`, `usePropertyViews`
- **Dashboard**: `useOwnerDashboard`, `useOwnerAnalytics`, `useTenantDashboard`, `useDashboardLayout`
- **Mobile**: `useGeolocation`, `usePushNotifications`, `useOfflineSync`, `useNetworkStatus`, `useOnlineStatus`
- **UI/UX**: `useFavorites`, `useAccessibility`, `usePerformance`, `useFocusTrap`, `useContrastMode`, `useReducedMotion`, `usePrefersReducedMotion`
- **Communication**: `useMessages`, `useVoiceSearch`, `useRealtimeVoice`, `useTextToSpeech`
- **Forms & Input**: `useAutoSave`, `useLongPress`, `useKeyboardShortcuts`, `useDebounce`
- **Search & Discovery**: `useSearchSuggestions`, `useRecommendations`, `useMapProperties`, `useSavedSearches`
- **Agency & Business**: `useAgencyProperties`, `useAgencyMandates`, `useApplications`, `useMaintenance`, `useMaintenanceRequests`
- **System & Utils**: `useCurrentTime`, `useTimeAgo`, `useWeather`, `useMediaUpload`, `usePermissions`