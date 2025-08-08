# Supabase Authentication Flow

This document explains how Supabase authentication works in the application, with a focus on the post-login redirect flow.

## Authentication Flow Overview

The application uses Supabase for authentication with the PKCE (Proof Key for Code Exchange) flow. Here's how the entire process works, with special attention to the redirect handling:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  User Login │────▶│ Auth Provider│────▶│ Auth Callback │────▶│ Code Exchange│
└─────────────┘     └─────────────┘     └──────────────┘     └─────────────┘
                                                                     │
                                                                     ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Protected   │◀────│  Session    │◀────│ Auth State   │◀────│ Session     │
│ Routes      │     │  Check      │     │ Change       │     │ Established │
└─────────────┘     └─────────────┘     └──────────────┘     └─────────────┘
```

## Post-Login Redirect Flow

### 1. Initial Authentication

When a user authenticates with Supabase (via a login provider), Supabase redirects back to the application with an authorization code.

### 2. Auth Callback Processing

1. The callback is handled by the API route at `/api/auth/callback.ts`
2. This endpoint:
   - Extracts the authorization `code` from the query parameters
   - Checks for any errors in the authentication process
   - Redirects to the app page with the code: `return res.redirect(${origin}/app?code=${code})`

### 3. Code Exchange for Session

1. The `/app.tsx` page receives the code and processes it:
   ```typescript
   // If we have a code, exchange it for a session
   if (code && typeof code === 'string') {
     const { data, error } = await supabase.auth.exchangeCodeForSession(code);
     
     if (data.session) {
       // Clear the code from URL and redirect to assistant
       router.replace('/assistant', undefined, { shallow: true });
     }
   }
   ```

2. The `exchangeCodeForSession` method:
   - Exchanges the authorization code for a valid session
   - Establishes the user's session with Supabase
   - Stores the session token in browser storage

3. After successful code exchange, the application:
   - Removes the code from the URL (for security)
   - Redirects the user to the protected `/assistant` route

### 4. Auth State Management

The `SupabaseProvider` component:

1. Initializes the auth state on application load
2. Sets up listeners for auth state changes:
   ```typescript
   supabase.auth.onAuthStateChange(async (event, newSession) => {
     if (event === 'SIGNED_IN') {
       setSession(newSession)
       // Redirect to assistant if on home page
       if (router.pathname === '/') {
         await router.replace('/assistant');
       }
     }
   })
   ```

3. Provides the session context to the entire application

### 5. Protected Routes

The `AuthGuard` component:

1. Checks for a valid session
2. Redirects unauthenticated users to the home page
3. Shows a loading state while checking authentication
4. Renders protected content only for authenticated users

## Common Redirect Issues

1. **Race Conditions**: The redirect might happen before the session is fully established, causing authentication checks to fail.

2. **Code Exchange Timing**: If the code exchange process takes too long, subsequent auth checks might fail.

3. **URL Handling**: Improper URL handling during redirects can cause the authentication code to be lost or corrupted.

4. **Multiple Redirects**: Multiple redirects in quick succession can cause navigation issues or state inconsistencies.

## Solution for Redirect Issues

The application implements several strategies to handle redirect issues:

1. **Explicit Code Exchange**: The code is explicitly exchanged for a session before any redirects happen.

2. **Auth State Listener**: The auth state listener ensures the application responds correctly to authentication changes.

3. **Loading States**: Loading states prevent UI rendering before authentication is confirmed.

4. **Error Handling**: Comprehensive error handling captures and reports authentication failures.

5. **URL Cleanup**: The code is removed from the URL after exchange for security and to prevent reuse.

## Conclusion

The Supabase authentication flow in this application follows the PKCE flow pattern with careful handling of the post-login redirect process. The code exchange happens client-side in the `/app` page, which then redirects to protected routes once authentication is confirmed.
