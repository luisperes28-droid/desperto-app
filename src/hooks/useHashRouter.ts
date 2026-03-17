import { useState, useEffect, useCallback } from 'react';

interface Route {
  path: string;
  params: Record<string, string>;
}

function parseHash(hash: string): Route {
  const cleanHash = hash.replace(/^#\/?/, '');
  if (!cleanHash) return { path: '/', params: {} };

  const parts = cleanHash.split('/');
  const path = '/' + parts[0];
  const params: Record<string, string> = {};

  if (parts[0] === 'cancel' && parts[1]) {
    params.bookingId = parts[1];
  } else if (parts[0] === 'reschedule' && parts[1]) {
    params.bookingId = parts[1];
  } else if (parts[0] === 'booking' && parts[1]) {
    params.bookingId = parts[1];
  }

  return { path, params };
}

export function useHashRouter() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  const clearRoute = useCallback(() => {
    history.replaceState(null, '', window.location.pathname);
    setRoute({ path: '/', params: {} });
  }, []);

  return { route, navigate, clearRoute };
}
