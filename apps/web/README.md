# MessMate Web Application

A modern mess management platform for meal tracking, expense management, and monthly accounting for shared living environments.

## Key Features

### Authentication

- Email/password sign-in
- JWT-based authentication
- Session persistence
- Route protection

### Dashboard

- User profile overview
- Quick access to features
- Session management

### Landing Page

- Hero section with call-to-action
- Features overview
- How it works guide
- Pricing information

## Tech Stack

### Frontend

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand + Immer
- **Data Fetching**: TanStack Query
- **Routing**: Next.js App Router

### Backend

- **Framework**: NestJS 11
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma 7.8
- **Auth**: JWT with Refresh Tokens

## Getting Started

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

### Type Check

```bash
pnpm check-types
```

## Architecture

The application uses a server-actions approach for authentication, where Next.js Server Actions securely call the NestJS backend API. This provides:

- **Security**: Server-side validation and API calls
- **Performance**: Reduced client-side bundle size
- **Maintainability**: Clear separation of concerns

## Development Notes

### Authentication Flow

1. User submits credentials via form
2. Server Action calls NestJS `/auth/signin` API
3. JWT tokens set as HttpOnly cookies
4. Redirect to dashboard
5. Session stored in Zustand store

### Route Protection

- Middleware protects all routes except public ones (`/`, `/signin`, `/signup`)
- Automatic redirect to sign-in if not authenticated
- Session validation on every protected route

## Files Structure

```
apps/web/
├── app/
│   ├── _actions/                    # Server Actions (auth)
│   ├── _components/                 # Reusable UI components
│   ├── _hooks/                      # React hooks
│   ├── _lib/                        # Utility libraries
│   ├── _store/                      # Zustand stores
│   ├── components/                  # UI components
│   │   ├── landing/                 # Landing page components
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page
│   ├── signin/                      # Sign-in page
│   ├── signup/                      # Sign-up page
│   ├── dashboard/                   # Dashboard page
│   └── protected-page.tsx           # Protected route wrapper
├── components/                       # General UI components
├── hooks/                           # Custom React hooks
├── lib/                             # Libraries and utilities
├── store/                           # Zustand stores
├── middleware.ts                    # Route protection middleware
├── package.json                     # Dependencies
└── README.md                        # Documentation
```

## Current Status

### Phase 0 - Project Foundation ✅

- Monorepo initialization
- Next.js + NestJS architecture
- Authentication system
- Landing page development
- Auth pages development
- Session management

### Phase 2 - Authentication Module ✅

- User registration (API + UI)
- User login (API + UI)
- Session management
- Route protection

### Future Phases 🔄

- **Phase 3**: Mess Management
- **Phase 4**: Month Management
- **Phase 5**: Meal Management
- **Phase 6**: Bazaar Management
- **Phase 7**: Expense Management
- **Phase 8**: Deposit Management
- **Phase 9**: Accounting Engine
- **Phase 10**: Dashboard
- **Phase 11**: Activity Logs
- **Phase 12**: Reports

## Security

### Authentication

- JWT-based authentication with refresh tokens
- HttpOnly cookies to prevent XSS
- Secure flag in production
- SameSite: Strict policy

### Route Protection

- Middleware-based authentication
- Session validation on route access
- Automatic redirects for unauthenticated users

## Technology Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **TanStack Query** - Server state management
- **Zustand + Immer** - State management
- **Lucide React** - Icon library

### Backend

- **NestJS 11** - Progressive JavaScript framework
- **Prisma ORM 7.8** - Database toolkit
- **PostgreSQL** - Relational database (Neon)
- **JWT** - JSON Web Token authentication

## Best Practices

### Code Quality

- TypeScript-first development
- Component-based architecture
- Separation of concerns
- Consistent code formatting

### Security

- Zero-trust architecture
- Input validation
- Route protection
- Secure cookie handling

### Performance

- Server-side rendering
- Client-side hydration
- Efficient caching strategies
- Component optimization

## License

MIT
