# AppleAura - Marketplace Tecnológico

## Overview

AppleAura is a comprehensive e-commerce marketplace specializing in Apple and technology products. The platform provides a unified marketplace experience with distinct interfaces for buyers, sellers, and administrators. Built with modern web technologies, it follows Apple's Human Interface Guidelines for design consistency and user experience excellence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and React Context for local state
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Design System**: Apple Human Interface Guidelines implementation with custom CSS variables for theming
- **Authentication**: JWT-based authentication with role-based access control

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API development
- **Database**: SQLite with Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt for password hashing
- **API Documentation**: Swagger/OpenAPI integration for comprehensive API documentation

### Database Design
- **Users Table**: Supports multi-role authentication (buyer, seller, admin)
- **Products & Variants**: Flexible product catalog with variant support for different configurations
- **Orders & Cart**: Complete e-commerce transaction flow
- **Reviews & Ratings**: User feedback system with star ratings
- **Seller Profiles**: Dedicated seller management with verification status

### Multi-Role Architecture
The application implements a unified authentication system with three distinct user roles:
- **Buyers**: Default role with product browsing, cart management, and purchase capabilities
- **Sellers**: Access to product management dashboard and sales analytics
- **Administrators**: Full system access including user management and platform analytics

### File Structure Strategy
Due to Replit configuration limitations, the physical file structure differs from the conceptual organization:
- **Physical Frontend**: Located in `client/` directory
- **Physical Backend**: Located in `server/` directory
- **Conceptual Documentation**: `frontend/` and `backend/` folders contain architectural documentation
- **Shared Schemas**: `shared/` directory contains database schemas and type definitions

### Development Workflow
- **Database Seeding**: Automated setup with pre-configured test users and sample products
- **Hot Reloading**: Vite-powered development server with instant updates
- **Type Safety**: End-to-end TypeScript implementation from database to frontend

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router alternatives (Wouter)
- **TypeScript**: Full TypeScript implementation across frontend and backend
- **Vite**: Modern build tool for fast development and optimized production builds

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **shadcn/ui**: Pre-built component library based on Radix UI
- **Lucide React**: Modern icon library for consistent iconography

### Backend Services
- **Express.js**: Web application framework for Node.js
- **Better SQLite3**: High-performance SQLite database driver
- **Drizzle ORM**: TypeScript ORM with excellent developer experience
- **bcrypt**: Password hashing library for secure authentication
- **jsonwebtoken**: JWT implementation for stateless authentication

### Development Tools
- **Swagger/OpenAPI**: API documentation and testing interface
- **TanStack Query**: Powerful data synchronization for React applications
- **React Hook Form**: Performant forms with easy validation
- **Zod**: TypeScript-first schema validation

### Database Considerations
The application is designed to work with both SQLite (default) and PostgreSQL. The current implementation uses SQLite for development with the flexibility to migrate to PostgreSQL for production deployments on platforms like Neon or Railway.

### Asset Management
Product images are generated as SVG files through automated scripts, ensuring consistent visual presentation and lightweight asset delivery.