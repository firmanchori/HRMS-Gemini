import cookiejar from "cookiejar";

/**
 * Wraps a supertest agent so its mutating calls (post/put/patch/delete)
 * automatically echo the nusahr_csrf cookie back as X-CSRF-Token — without
 * this, every integration test exercising a real login + mutating route
 * would 403 against requireCsrfToken (server/middleware/auth.ts), which a
 * browser-driven frontend handles via src/shared/csrf.ts but a raw HTTP
 * client like supertest has no reason to do automatically. Untyped (any)
 * deliberately — supertest's own exported agent type differs across its
 * versions (SuperAgentTest vs TestAgent<Test>) and doesn't expose `.jar`
 * either way; this is a test-only helper reaching into superagent's
 * underlying cookie jar, so fighting that typing isn't worth it.
 */
export function withCsrf<T>(agent: T): T {
  const anyAgent = agent as any;
  for (const method of ["post", "put", "patch", "delete"]) {
    const original = anyAgent[method].bind(anyAgent);
    anyAgent[method] = (...args: unknown[]) => {
      const req = original(...args);
      const token = anyAgent.jar.getCookie("nusahr_csrf", cookiejar.CookieAccessInfo.All);
      return token ? req.set("X-CSRF-Token", token.value) : req;
    };
  }
  return agent;
}
