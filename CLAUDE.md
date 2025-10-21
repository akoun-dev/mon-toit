# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
```bash
npm run dev              # Development server (port 8080)
npm run build            # Production build
npm run build:dev        # Development build (faster)
npm run lint             # ESLint code checking
npm run preview          # Preview production build
```

### Mobile Development (Capacitor)
```bash
npx cap sync             # Sync web assets to native platforms
npx cap open android     # Open Android Studio
npx cap open ios         # Open Xcode
npx cap run android      # Run on Android device/emulator
npx cap run ios          # Run on iOS device/simulator
```

### Environment Setup
Create `.env.local` with Supabase and Mapbox tokens. The code includes fallback values for development.

## Architecture Overview

### Multi-Tenant Real Estate Platform
This is a sophisticated real estate platform for Ivory Coast with role-based architecture:
- **propriétaire**: Property owners managing listings
- **locataire**: Tenants searching and renting properties
- **agence**: Real estate agencies with portfolio management
- **tiers_de_confiance**: Trust third parties for certification

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite 5
- **UI**: Tailwind CSS + shadcn/ui + Radix UI (accessible components)
- **State Management**: TanStack Query (server state) + React Context
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Maps**: Mapbox GL JS + Supercluster for property clustering
- **Mobile**: PWA + Capacitor 7 for native iOS/Android apps
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion

### Key Architectural Patterns

#### Security Architecture
- **RLS Policies**: All database tables have Row Level Security enabled
- **Role-Based Access**: Protected routes with role verification at component level
- **Secure Storage**: Custom secure storage implementation for sensitive data
- **Audit Logging**: Comprehensive logging for sensitive operations

#### Component Architecture
- **shadcn/ui Integration**: Consistent design system with 60+ reusable components
- **Compound Components**: Complex UI patterns (dropdowns, dialogs, navigation)
- **HeroHeader Component**: Unified hero sections used across all public pages
- **Layout System**: MainLayout with sidebar support and responsive design

#### State Management
- **Server State**: TanStack Query with 5-minute stale time and intelligent caching
- **Client State**: React Context for UI state and user authentication
- **Form State**: React Hook Form with Zod schema validation
- **Real-time**: Supabase subscriptions for live updates

#### Performance Optimizations
- **Code Splitting**: Lazy loading for heavy routes and components
- **Route Prefetching**: Intelligent prefetching of likely next routes
- **Image Optimization**: WebP compression with CDN fallbacks
- **PWA Caching**: Workbox for offline functionality

### Directory Structure
```
src/
├── components/
│   ├── ui/             # shadcn/ui component library (60+ components)
│   ├── admin/          # Admin dashboard components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard widgets and layouts
│   ├── navigation/     # Mobile navigation components
│   ├── properties/     # Property-related components
│   └── shared/         # Shared components like HeroHeader
├── hooks/              # Custom React hooks (50+ specialized hooks)
├── lib/                # Core utilities and configurations
│   ├── supabase.ts     # Database client with secure storage
│   └── queryClient.ts  # TanStack Query configuration
├── pages/              # Route components (40+ pages)
├── services/           # Business logic services
├── types/              # TypeScript type definitions
└── data/               # Static data (Abidjan neighborhoods, POI)
```

### Database Schema
- **Multi-tenant design** with user_type column for role separation
- **RLS policies** ensure data isolation between tenants
- **Real-time subscriptions** for messaging and notifications
- **Type-safe queries** with generated TypeScript types

### Mobile Development
- **PWA First**: Progressive Web App with native app capabilities
- **Capacitor Integration**: Native iOS/Android apps from same codebase
- **Offline Support**: Workbox caching for critical functionality
- **Native Features**: Camera, geolocation, push notifications, etc.

### Cultural Adaptation
- **Ivorian Design Patterns**: Kente, Akan, Bogolan cultural motifs
- **Local Payment Integration**: Mobile Money (Orange Money, MTN Money)
- **French Localization**: Primary language with proper cultural context
- **Local Data**: Abidjan neighborhoods and points of interest

## Important Development Notes

### Code Style & Conventions
- Uses shadcn/ui component conventions
- TypeScript with relaxed strictness for rapid development
- ESLint with SonarJS for code quality
- Tailwind CSS for styling with custom design tokens

### Security Considerations
- Never commit API keys or sensitive data
- All database operations must respect RLS policies
- Input sanitization with DOMPurify for XSS protection
- Secure storage for authentication tokens

### Performance Guidelines
- Use TanStack Query for all API calls with proper caching
- Lazy load heavy components and routes
- Optimize images with WebP format
- Implement proper loading states and error handling

### Testing & Debugging
- Use browser dev tools for React component debugging
- Supabase dashboard for database inspection
- Network tab for API call analysis
- Capacitor CLI for native app debugging