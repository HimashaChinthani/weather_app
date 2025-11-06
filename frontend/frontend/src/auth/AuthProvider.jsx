import React, { createContext, useContext, useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
const useAuth0Enabled = Boolean(domain && clientId);

const DevAuthContext = createContext(null);

export function AuthProvider({ children }) {
  if (useAuth0Enabled) {
    return (
     <Auth0Provider
  domain={domain}
  clientId={clientId}
  authorizationParams={{
    redirect_uri: `${window.location.origin}/callback`,
    audience: audience,
    scope: 'openid profile email'
  }}
>
  {children}
</Auth0Provider>

    );
  }

  // Mock provider for local development when Auth0 is not configured
  const MockProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const loginWithRedirect = async () => {
      // simple mock login — set a test user
      setIsAuthenticated(true);
      setUser({ name: 'Dev User', email: 'dev@example.com' });
    };

    const logout = ({ returnTo } = {}) => {
      setIsAuthenticated(false);
      setUser(null);
      if (returnTo) window.location.href = returnTo;
    };

    const getAccessTokenSilently = async () => {
      // return a dummy token for local dev
      return 'dev-token';
    };

    const value = { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently };

    return <DevAuthContext.Provider value={value}>{children}</DevAuthContext.Provider>;
  };

  return <MockProvider>{children}</MockProvider>;
}

// useAuth hook: delegates to Auth0 hook when enabled, otherwise returns dev context
export function useAuth() {
  if (useAuth0Enabled) {
    return useAuth0();
  }
  const ctx = useContext(DevAuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthProvider;
