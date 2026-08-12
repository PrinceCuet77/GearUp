import config from '.';

const allowedOrigins = new Set(config.cors_origins);

/**
 * Shared by the CORS middleware and the OAuth start endpoints — the latter
 * bounce the browser back to the origin the flow began on, and that origin has
 * to be vetted here or the endpoint becomes an open redirect.
 */
export const isAllowedOrigin = (origin?: string | null): origin is string => {
  if (!origin) return false;

  const normalized = origin.trim().replace(/\/+$/, '');

  return (
    allowedOrigins.has(normalized) ||
    config.cors_origin_patterns.some((pattern) => pattern.test(normalized))
  );
};

export const corsAllowlist = () => Array.from(allowedOrigins);
