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
```

## Architecture Overview

### Multi-Platform Real Estate Application
- **Web PWA**: Progressive Web App with offline capabilities
- **Mobile Native**: Capacitor-based iOS and Android apps
- **Backend**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Maps**: Mapbox GL JS with Supercluster clustering
- **Authentication**: Multi-factor auth with role-based access control

### Multi-Tenant Role System
The application supports 4 distinct user roles with separate dashboards:
- **propriétaire** (Owner): Property management and tenant applications
- **locataire** (Tenant): Property search and lease management
- **agence** (Agency): Portfolio management and mandates
- **tiers_de_confiance** (Third-party Trust): Certification and mediation

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
- **SonarJS**: Additional security and quality checks
- **TypeScript**: Full type safety with extended Supabase types

## Development Notes

### Supabase Integration
- Uses environment variables with secure fallbacks for local development
- Only ANON keys are exposed to the client - never use service_role keys
- All database operations should go through the configured Supabase client in `src/lib/supabase.ts`

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