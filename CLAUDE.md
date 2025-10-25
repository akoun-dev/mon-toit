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
npm run seed:auth        # Seed authentication data
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

**Test Accounts** (all passwords match role name + "123"):
- Admin: `admin@mon-toit.ci` / `admin123`
- Proprietaire: `kouadio.jean@mon-toit.ci` / `proprietaire123`
- Locataire: `yao.konan@mon-toit.ci` / `locataire123`
- Agence: `contact@agence-cocody.ci` / `agence123`
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

### Supabase Integration
- Uses environment variables with secure fallbacks for local development
- Only ANON keys are exposed to the client - never use service_role keys
- All database operations should go through the configured Supabase client in `src/lib/supabase.ts`
- TypeScript types are auto-generated in `src/integrations/supabase/types.ts`
- Secure storage integration for auth tokens via `src/lib/secureStorage.ts`

### Mapbox Configuration
- Mapbox tokens should be set in environment variables
- Custom styles and clustering are configured for Abidjan region
- POI data is pre-loaded in `src/data/abidjanPOI.ts`

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

### Offline Development
The PWA includes sophisticated offline capabilities:
- API responses are cached with NetworkFirst strategy
- Images use CacheFirst strategy
- The app remains functional during network interruptions
- Sync operations handle conflict resolution gracefully

### Security Best Practices
- All API calls should use the configured Supabase client
- Sensitive operations require appropriate RLS policies
- Form inputs are sanitized using DOMPurify
- Error messages are sanitized to prevent information leakage
- Native app security configured in `capacitor.config.ts` with restricted navigation
- PWA security with service worker caching strategies in `vite.config.ts`
- Sentry integration available for production error tracking
- Test security policies located in `tests/security/` directory
- Duplicate code detection with JSCPD prevents maintenance issues

### Authentication & Role System
- **Multi-factor authentication** with OTP verification for sensitive operations
- **Role-based redirection** handled in `useAuthEnhanced.tsx` and `ProtectedRoute.tsx`
- **User roles stored** in `public.user_roles` table with RLS policies
- **Login attempt tracking** in `public.login_attempts` with rate limiting
- **Session management** with secure storage and device fingerprinting
- **Default role fallback** to 'locataire' if no role found (check `user_roles` table first)

### Common Issues & Solutions
- **All users redirect to tenant dashboard**: Check `user_roles` table is populated
- **Authentication fails**: Verify password hashes are compatible with Supabase auth
- **404 on check_login_rate_limit**: Grant EXECUTE permissions on RPC function to anon/authenticated roles
- **401 on login_attempts**: Update RLS policy to allow anonymous INSERT operations
- **Missing user profiles**: Run `npm run seed:auth` to create proper user data

### Testing Commands
```bash
# Run tests (when test files are added)
npx vitest              # Run Vitest tests
npx vitest ui           # Run tests with Vitest UI
npx vitest run          # Run tests once
npx vitest run --coverage  # Run tests with coverage report
```

### Database & Data Seeding
```bash
npm run seed:auth        # Seed authentication data (creates 17 functional user accounts)
npm run seed:auth:create # Same as seed:auth - creates users with working passwords
npm run seed:passwords  # Generate and apply working password hashes
npm run seed:properties  # Seed property data (30+ properties with images)
```

### Supabase Database Management
```bash
# Reset and reseed database (use with caution)
docker exec supabase_db_mon-toit psql -U postgres -d postgres -f supabase/seed.sql

# Fix user roles if everyone appears as tenant
docker exec supabase_db_mon-toit psql -U postgres -d postgres -f fix-user-roles.sql

# Update password hashes if authentication fails
docker exec supabase_db_mon-toit psql -U postgres -d postgres -f fix-passwords.sql

# Check user role distribution
docker exec supabase_db_mon-toit psql -U postgres -d postgres -c "SELECT role, COUNT(*) FROM public.user_roles GROUP BY role;"
```

### Code Quality
```bash
npm run lint             # ESLint code checking
npx jscpd .              # Detect duplicate code (configured in .jscpd.json)
```

### Build Configuration
- **PWA Manifest**: Auto-generated in `vite.config.ts` with caching strategies
- **Capacitor Build**: Excludes Capacitor modules from web builds
- **Code Splitting**: Automatic with custom chunk and asset naming
- **Source Maps**: Enabled in production for Sentry integration
- **Bundle Analysis**: Available via Next.js bundle analyzer integration