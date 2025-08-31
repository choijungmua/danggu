# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application called "danggu" - a Korean user management system that features:
- **Framework**: Next.js 15.5.2 with App Router and Turbopack
- **Styling**: Tailwind CSS v4 with shadcn/ui components (New York style)
- **Backend**: Supabase for authentication and database
- **State Management**: Zustand for client state, TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Date Handling**: Day.js
- **Fonts**: Pretendard Variable font for Korean text support

## Development Commands

```bash
# Start development server with Turbopack
yarn dev

# Build for production with Turbopack  
yarn build

# Start production server
yarn start

# Run ESLint
yarn lint
```

## Project Architecture

### Application Structure
- **Root Layout**: Includes QueryProvider, AuthInitializer, and NavigationWrapper for global state and navigation
- **Authentication Flow**: Complete auth system with login/signup pages, protected routes, and session persistence
- **User Management**: Full CRUD operations for users with drawer-based UI
- **Navigation**: Conditional navigation based on auth state

### Key Directories
- `src/app/` - App Router pages (layout.js, page.js, login/, signup/, users/)
- `src/components/` - Reusable components including Navigation, UserDrawer, ProtectedRoute
- `src/components/ui/` - shadcn/ui components (button, card, input, label, form, badge)
- `src/lib/` - Core utilities (utils.js with cn() helper, supabase.js client)
- `src/stores/` - Zustand stores (authStore.js for authentication state)
- `src/services/` - API service layer (s_user.js for user operations)
- `src/hooks/` - Custom hooks (useUser.js)
- `src/constants/` - Query client configuration and query keys
- `src/utils/` - Utility functions (dateUtils.js)

### State Management Pattern
- **Authentication**: Zustand store (authStore.js) manages user session and auth actions
- **Server State**: TanStack Query for API calls with query keys defined in constants/
- **API Layer**: Services pattern with dedicated service files for different domains

### Configuration Files
- **jsconfig.json**: Path aliases (`@/*` → `./src/*`)
- **components.json**: shadcn/ui config (New York style, JavaScript, gray base color)
- **eslint.config.mjs**: Next.js core-web-vitals configuration
- **globals.css**: Tailwind v4 with CSS custom properties for theming and dark mode

## Authentication Architecture

The app uses a comprehensive authentication system:
1. **Supabase Client**: Basic client setup in `src/lib/supabase.js`
2. **Auth Store**: Zustand store managing session state and auth operations
3. **Auth Initializer**: Component that initializes auth state on app load
4. **Protected Routes**: Wrapper component for pages requiring authentication
5. **Navigation**: Conditional rendering based on auth state

## Styling System

- **Tailwind v4**: Uses `@import "tailwindcss"` with CSS custom properties
- **Theme System**: Light/dark mode support with CSS custom properties
- **Color System**: OKLCH color space for better color consistency
- **Korean Typography**: Pretendard Variable font optimized for Korean text
- **Component Variants**: Uses class-variance-authority for component styling

## Environment Requirements

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`