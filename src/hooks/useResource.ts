'use client';
import { useCallback, useEffect, useState } from 'react';
export function useResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(url, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(response.status === 401 ? 'Your session has expired. Please sign in again.' : 'We could not load this content. Please try again.');
        setData(result.data);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Something went wrong.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [url, revision]);
  return { data, loading, error, reload };
}

