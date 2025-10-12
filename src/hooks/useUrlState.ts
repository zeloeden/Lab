import { useEffect, useCallback } from 'react';

export function useUrlSync(params: Record<string, any>) {
  useEffect(() => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
        url.searchParams.delete(k);
      } else {
        url.searchParams.set(k, String(v));
      }
    });
    window.history.replaceState({}, '', url.toString());
  }, [JSON.stringify(params)]);
}

export function useUrlState() {
  const setParam = useCallback((key: string, value: string | number | undefined | null) => {
    const url = new URL(window.location.href);
    if (value === undefined || value === null || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const getParam = useCallback((key: string) => {
    const url = new URL(window.location.href);
    return url.searchParams.get(key);
  }, []);

  return { setParam, getParam };
}


