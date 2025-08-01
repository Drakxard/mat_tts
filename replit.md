# Overview

This is a phrase management application built with a React frontend and Express backend. The app delivers inspirational phrases sequentially through a rate-limited API, featuring a public interface for consuming phrases and an admin dashboard for managing the phrase collection. The application is now configured for deployment on Vercel with serverless functions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless driver
- **Session Management**: PostgreSQL-based sessions using connect-pg-simple
- **API Design**: RESTful endpoints with rate limiting and sequential phrase delivery

## Database Schema
The application uses three main tables:
- **Users**: Basic user authentication with username/password
- **Phrases**: Content storage with creation timestamps
- **App Config**: Global application state including current phrase index, daily request counts, and reset tracking

## Key Features
- **Sequential Phrase Delivery**: Phrases are served in order (n+1 pattern) rather than randomly
- **Rate Limiting**: 100 requests per day with automatic daily reset
- **Admin Interface**: Bulk phrase management with import/export capabilities
- **Responsive Design**: Mobile-first approach with dark mode support

## Development Environment
- **Build System**: Vite for frontend bundling with hot module replacement
- **Database Migrations**: Drizzle Kit for schema management
- **Development Server**: Express with Vite middleware for seamless development experience
- **Type Safety**: Shared TypeScript types between frontend and backend

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **DATABASE_URL**: Environment variable for database connection string

## Deployment Platform
- **Vercel**: Serverless deployment platform with automatic builds
- **@vercel/node**: Runtime for serverless functions
- **vercel.json**: Configuration for routing and build settings

## UI Framework Dependencies
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Replit Integration**: Development environment integration with cartographer plugin
- **PostCSS**: CSS processing with Tailwind and Autoprefixer plugins
- **ESBuild**: Fast JavaScript bundler for production builds

## Validation and Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performance-optimized form library
- **Drizzle Zod**: Integration between Drizzle ORM and Zod schemas

# Deployment Configuration

## Vercel Setup
- **API Routes**: Converted to serverless functions in `/server/api/` directory
- **Static Build**: Frontend builds to `/dist` directory for static hosting
- **Environment Variables**: `DATABASE_URL` required for database connection
- **Routing**: Configured in `vercel.json` to handle API and static routes