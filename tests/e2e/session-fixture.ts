import type { Page, Route } from '@playwright/test';
export function sessionTokens(accessToken: string, sessionId='11111111-1111-4111-8111-111111111111') {
 return { accessToken,sessionId,accessTokenExpiresAt:'2099-01-01T00:00:00.000Z',sessionExpiresAt:'2099-01-02T00:00:00.000Z' };
}
export async function mockSession(page: Page, token: string) {
 // Install at context level so page-specific product routes can fall through.
 await page.context().route('**/api/v1/auth/**', async (route: Route) => {
  if(new URL(route.request().url()).pathname.endsWith('/logout')) return route.fulfill({status:204});
  return route.fulfill({json:sessionTokens(token)});
 });
}
