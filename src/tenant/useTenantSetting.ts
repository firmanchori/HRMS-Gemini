import { useCallback, useEffect, useState } from 'react';
import { tenantApi } from './api';

/**
 * A per-tenant configuration value kept on the server (module settings, stored as { value }), shared by every browser/device of the
 * tenant. Replaces localStorage for configuration such as loan schemes or SLA tables. `defaults` is what a tenant sees until it
 * saves its own copy; `save` resolves after the server accepted the change and rejects with the server's message otherwise.
 */
let cache: Promise<Record<string, Record<string, unknown>>> | null = null;
const load = () => (cache ??= tenantApi.getModuleSettings().catch((err) => {
  cache = null;
  throw err;
}));

export function useTenantSetting<T>(key: string, defaults: T) {
  const [value, setValue] = useState<T>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomized, setIsCustomized] = useState(false);

  useEffect(() => {
    let alive = true;
    load()
      .then((all) => {
        const stored = all[key]?.value as T | undefined;
        if (alive && stored !== undefined) {
          setValue(stored);
          setIsCustomized(true);
        }
      })
      .catch(() => undefined)
      .finally(() => alive && setIsLoading(false));
    return () => {
      alive = false;
    };
  }, [key]);

  const save = useCallback(
    async (next: T) => {
      await tenantApi.updateModuleSettings(key, { value: next });
      cache = null; // next reader refetches the authoritative copy
      setValue(next);
      setIsCustomized(true);
    },
    [key]
  );

  /** Drops the tenant's saved copy and returns to the built-in defaults. */
  const reset = useCallback(async () => {
    await tenantApi.updateModuleSettings(key, {});
    cache = null;
    setValue(defaults);
    setIsCustomized(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { value, save, reset, isLoading, isCustomized };
}
