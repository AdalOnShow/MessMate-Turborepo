# Zustand Integration Guide

This document explains how Zustand state management has been integrated into this project.

## Installation

Zustand and Immer have been installed as dependencies in the `apps/web` package:

```bash
pnpm add zustand immer
```

## Store Structure

The store has been created at `apps/web/app/store/` with:

- **index.ts** - Main store implementation using Zustand, Immer, and DevTools
- **types.ts** - TypeScript interfaces for type safety

## Usage Examples

### Basic Usage in Components

```typescript
'use client';

import { useSessionStore } from '../store';

export function MyComponent() {
  const user = useSessionStore((state) => state.user);
  const createUser = useSessionStore((state) => state.createSession);

  const handleLogin = () => {
    createUser({
      username: 'JohnDoe',
      email: 'john@example.com',
      twitchUsername: 'johndoe',
    });
  };

  return (
    <div>
      {user ? `Hello, ${user.username}!` : <button onClick={handleLogin}>Login</button>}
    </div>
  );
}
```

### DevTools Integration

Zustand DevTools are enabled by default and will appear in your browser's DevTools/extensions tab. No additional setup is required.

### Store Actions Available

```typescript
// Create a new session
useSessionStore.getState().createSession({
  username: 'string',
  email: 'string',
  twitchUsername?: 'string',
});

// Update existing user data
useSessionStore.getState().updateUser({
  username: 'newUsername',
  email: 'newEmail@example.com',
});

// Clear session
useSessionStore.getState().clearSession();
```

### Accessing Store Directly Outside Components

```typescript
import { useSessionStore } from "@/store";

// Get entire state
const state = useSessionStore.getState();

// Subscribe to changes (like useEffect)
const unsubscribe = useSessionStore.subscribe((state) => {
  console.log("Store changed:", state.user);
});

// Cleanup subscription
unsubscribe();
```

## Best Practices

1. **Client Components Only**: Zustand works with Client Components marked with `'use client'`
2. **Type Safety**: All store access is fully typed through TypeScript interfaces
3. **Automatic Cleanup**: Unlike useState, you don't need useEffect for cleanup with Zustand
4. **DevTools**: Check Redux DevTools → Extensions → Zustand for debugging
5. **Store Placement**: Store is placed in `app/store/` to match Next.js 13+ App Router structure

## Next.js 13+ App Router Compatibility

This integration is designed to work seamlessly with:

- Server Components (no store context)
- Client Components ('use client' directive)
- No build tool configuration required

## Resources

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Next.js App Router Guide](https://nextjs.org/docs/app/building-your-application/rendering/server-components-and-client-components)
- [Zustand DevTools](https://docs.pmnd.rs/zustand/devtools)
