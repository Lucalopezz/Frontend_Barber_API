import { test, expect } from '@playwright/test';
const sid='11111111-1111-4111-8111-111111111111';
const tokens=()=>({accessToken:'memory-only-session',sessionId:sid,accessTokenExpiresAt:new Date(Date.now()+900000).toISOString(),sessionExpiresAt:new Date(Date.now()+604800000).toISOString()});
test('login keeps authentication out of persistent JavaScript storage',async({page})=>{
 await page.route('**/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const body=path.endsWith('/users/login')?tokens():path.endsWith('/auth/refresh')?{code:'AUTH_SESSION_INVALID'}:{data:[],meta:{lastPage:1,total:0}};
  await route.fulfill({status:path.endsWith('/auth/refresh')?401:200,json:body});
 });
 await page.goto('/login');
 await page.getByPlaceholder('seu@exemplo.com').fill('memory@example.test');
 await page.getByPlaceholder('••••••••').fill('Password2026!');
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page).toHaveURL(/\/$/);
 expect(await page.evaluate(()=>localStorage.getItem('token'))).toBeNull();
});

async function call(page: import('@playwright/test').Page, name: string, args: unknown[] = []) {
 return page.evaluate(async ({name,args}) => {
  const module = await import('/src/auth/session.ts');
  try { await module[name](...args); return {ok:true}; } catch { return {ok:false}; }
 }, {name,args});
}
async function request(page: import('@playwright/test').Page, url='/users/me') {
 return page.evaluate(async url=>{
  const {default:api}=await import('/src/utils/api.ts');
  try {const r=await api.get(url);return {ok:true,data:r.data};}catch(e){return {ok:false,status:(e as {response?:{status:number}}).response?.status};}
 },url);
}
function barrier() { let resolve!:()=>void; const promise=new Promise<void>(r=>resolve=r);return {promise,resolve}; }
async function mock(context: import('@playwright/test').BrowserContext) {
 let current='initial-access', active=false, refreshes=0, logouts=0;
 let refreshMode:'ok'|'invalid'|'offline'='ok';
 let protectedStatus=200;
 await context.route('**/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/users/login')){active=true;current='initial-access';return route.fulfill({status:201,json:{...tokens(),accessToken:current}});}
  if(path.endsWith('/auth/logout')){logouts++;active=false;return route.fulfill({status:204});}
  if(path.endsWith('/auth/refresh')){
   refreshes++;
   if(refreshMode==='offline')return route.abort('failed');
   if(!active||refreshMode==='invalid')return route.fulfill({status:401,json:{code:'AUTH_SESSION_INVALID'}});
   current=`renewed-access-${refreshes}`;return route.fulfill({json:{...tokens(),accessToken:current}});
  }
  if(path.endsWith('/users/me'))return route.fulfill({status:protectedStatus,json:protectedStatus===200?{data:{id:'user-a',name:'Account A',email:'a@example.test',role:'client',ownedBarberShops:[]}}:{code:protectedStatus===401?'AUTHENTICATION_REQUIRED':'FORBIDDEN'}});
  return route.fulfill({json:{data:[],meta:{lastPage:1,total:0}}});
 });
 return {get refreshes(){return refreshes;},get logouts(){return logouts;},expire(){current='expired';},status(n:number){protectedStatus=n;},mode(m:typeof refreshMode){refreshMode=m;},activate(){active=true;}};
}
test('reload waits for restoration and never reads a legacy persisted token',async({page,context})=>{
 const server=await mock(context);
 await page.addInitScript(()=>localStorage.setItem('token','legacy-must-be-removed'));
 await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 await page.goto('/profile');await expect(page.getByText('Account A',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByText('Account A',{exact:true})).toBeVisible();
 expect(server.refreshes).toBeGreaterThan(1);
 expect(await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}))).not.toContain('access');
 expect(await page.evaluate(()=>localStorage.getItem('token'))).toBeNull();
});
test('401 retries only once and a second authentication rejection ends the session',async({page,context})=>{
 const server=await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 const before=server.refreshes;server.status(401);
 await request(page);
 expect(server.refreshes-before).toBe(1);
 expect(await page.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).toBe('anonymous');
});
test('403 and network mutation failure never trigger refresh or automatic retries',async({page,context})=>{
 const server=await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 const before=server.refreshes;server.status(403);expect((await request(page)).status).toBe(403);
 let mutations=0;await context.route('**/api/v1/appointments',route=>{mutations++;return route.abort('failed');});
 await page.evaluate(async()=>{const {default:api}=await import('/src/utils/api.ts');try{await api.post('/appointments',{serviceId:'s',date:'2026-10-22'});}catch{ /* observable count below */ }});
 expect(server.refreshes).toBe(before);expect(mutations).toBe(1);
});
test('two tabs and simultaneous rejected requests perform one effective renewal',async({page,context})=>{
 const server=await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 const second=await context.newPage();await second.goto('/login');await call(second,'bootstrap');
 await expect.poll(async()=>second.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).toBe('authenticated');
 expect(await second.evaluate(async()=>(await import('/src/auth/session.ts')).getAccessToken())).toBe('initial-access');
 const before=server.refreshes;const held=barrier();let seen=0;
 await context.route('**/api/v1/protected',async route=>{
  if(route.request().headers().authorization==='Bearer initial-access'){
   seen++;if(seen===4)held.resolve();await held.promise;
   return route.fulfill({status:401,json:{code:'AUTHENTICATION_REQUIRED'}});
  }
  return route.fulfill({json:{ok:true}});
 });
 const results=await Promise.all([request(page,'/protected'),request(page,'/protected'),request(second,'/protected'),request(second,'/protected')]);
 expect(results.every(r=>r.ok)).toBe(true);expect(server.refreshes-before).toBe(1);await second.close();
});
test('offline logout is immediate, survives reload, and revokes before new login',async({page,context})=>{
 await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 const second=await context.newPage();await second.goto('/login');
 await expect.poll(async()=>second.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).toBe('authenticated');
 let online=false, attempts=0;await context.route('**/api/v1/auth/logout',route=>{attempts++;return online?route.fulfill({status:204}):route.abort('failed');});
 await call(page,'logoutSession');
 await expect.poll(async()=>second.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).not.toBe('authenticated');
 await page.reload();await call(page,'bootstrap');
 expect((await call(page,'loginSession',[{email:'b@example.test',password:'Password2026!'}])).ok).toBe(false);
 const pending=await page.evaluate(()=>JSON.parse(localStorage.getItem('barber.session.v1')!).pending);
 expect(pending).toHaveLength(1);
 online=true;expect((await call(page,'loginSession',[{email:'b@example.test',password:'Password2026!'}])).ok).toBe(true);
 expect(attempts).toBeGreaterThan(1);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('barber.session.v1')!).pending)).toHaveLength(0);
 await second.close();
});
test('lost refresh response offers explicit recovery without repeating refresh',async({page,context})=>{
 const server=await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 server.mode('offline');const before=server.refreshes;
 expect((await call(page,'refreshSession',['initial-access'])).ok).toBe(false);
 expect(server.refreshes-before).toBe(1);
 expect(await page.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).toBe('unavailable');
 await page.goto('/profile');await expect(page.getByText(/Não foi possível recuperar sua sessão/)).toBeVisible();
 server.mode('invalid');await page.getByRole('button',{name:'Tentar recuperar sessão'}).click();
 await expect(page).toHaveURL(/\/login$/);
});
test('a refresh response delayed across logout cannot restore authentication',async({page,context})=>{
 await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 const started=barrier(),held=barrier();
 await context.route('**/api/v1/auth/refresh',async route=>{started.resolve();await held.promise;return route.fulfill({json:{...tokens(),accessToken:'stale-access'}});});
 const renewal=call(page,'refreshSession',['initial-access']);await started.promise;
 const logout=call(page,'logoutSession');
 await expect.poll(async()=>page.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).toBe('anonymous');
 held.resolve();await Promise.all([renewal,logout]);
 expect(await page.evaluate(async()=>(await import('/src/auth/session.ts')).getAccessToken())).toBeUndefined();
});
test('logout during a held login revokes the late session and reload cannot discover it again',async({page,context})=>{
 const server=await mock(context);await page.goto('/login');await call(page,'bootstrap');
 const held=barrier(),started=barrier();let revocations=0;
 await context.route('**/api/v1/users/login',async route=>{started.resolve();await held.promise;server.activate();return route.fulfill({json:tokens()});});
 await context.route('**/api/v1/auth/logout',route=>{revocations++;return route.fulfill({status:204});});
 const login=call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);await started.promise;
 const logout=call(page,'logoutSession');
 await expect.poll(async()=>page.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).toBe('anonymous');
 held.resolve();await Promise.all([login,logout]);expect(revocations).toBeGreaterThan(0);
 const before=server.refreshes;await page.reload();await call(page,'bootstrap');
 expect(await page.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).toBe('anonymous');
 expect(server.refreshes).toBe(before);
});
test('an unsupported coordination API blocks restoration with a recoverable explanation',async({page,context})=>{
 await mock(context);await page.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined}));
 await page.goto('/profile');await expect(page.getByRole('alert')).toContainText('navegador atualizado');
});
test('a queued login cannot override a later logout intention',async({page,context})=>{
 await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 const held=barrier(),started=barrier();let logins=0;
 await context.route('**/api/v1/auth/refresh',async route=>{started.resolve();await held.promise;return route.fulfill({json:tokens()});});
 await context.route('**/api/v1/users/login',route=>{logins++;return route.fulfill({json:tokens()});});
 const renewal=call(page,'refreshSession',['initial-access']);await started.promise;
 const queuedLogin=call(page,'loginSession',[{email:'b@example.test',password:'Password2026!'}]);
 // The queued call has acquired its intent before the durable logout barrier.
 await page.evaluate(async()=>{const {logoutSession}=await import('/src/auth/session.ts');void logoutSession();});
 held.resolve();await Promise.all([renewal,queuedLogin]);
 expect(logins).toBe(0);
 expect(await page.evaluate(async()=>(await import('/src/auth/session.ts')).getAccessToken())).toBeUndefined();
});
test('unknown logout revokes every cookie-proven ambiguous session before login',async({page,context})=>{
 await mock(context);await page.goto('/login');await call(page,'bootstrap');
 const secondSid='22222222-2222-4222-8222-222222222222';
 const events:string[]=[];
 await context.route('**/api/v1/auth/refresh',route=>route.fulfill({status:401,json:{code:'AUTH_SESSION_AMBIGUOUS',sessionIds:[sid,secondSid]}}));
 await context.route('**/api/v1/auth/logout',route=>{events.push(route.request().postDataJSON().sessionId);return route.fulfill({status:204});});
 await call(page,'logoutSession');
 expect(events).toEqual([sid,secondSid]);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('barber.session.v1')!).unknownLogout)).toBeUndefined();
});
test('an old successful private response is discarded after a new account login',async({page,context})=>{
 await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 const held=barrier(),started=barrier();
 await context.route('**/api/v1/private-old',async route=>{started.resolve();await held.promise;return route.fulfill({json:{private:'old-account-data'}});});
 const oldRequest=request(page,'/private-old');await started.promise;
 await call(page,'logoutSession');await call(page,'loginSession',[{email:'b@example.test',password:'Password2026!'}]);
 held.resolve();expect((await oldRequest).ok).toBe(false);
});
test('password change clears both tabs and their private drafts immediately',async({page,context})=>{
 await mock(context);await page.goto('/login');await call(page,'bootstrap');
 await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 const second=await context.newPage();await second.goto('/profile');
 await expect(second.getByText('Account A',{exact:true})).toBeVisible();
 for(const tab of [page,second])await tab.evaluate(()=>sessionStorage.setItem('barber.booking.draft.v1',JSON.stringify({userId:'user-a',shopId:'shop-a'})));
 await context.route('**/api/v1/users/user-a',route=>route.fulfill({json:{data:{id:'user-a'}}}));
 await page.goto('/profile');
 await page.locator('input[autocomplete="old-password"]').fill('OldPassword2026!');
 await page.locator('input[autocomplete="new-password"]').fill('NewPassword2026!');
 await page.getByRole('button',{name:'Atualizar Senha'}).click();
 await expect(page).toHaveURL(/\/login$/);await expect(second).toHaveURL(/\/login$/);
 for(const tab of [page,second]){
  expect(await tab.evaluate(()=>sessionStorage.getItem('barber.booking.draft.v1'))).toBeNull();
  expect(await tab.evaluate(async()=>(await import('/src/auth/session.ts')).getAccessToken())).toBeUndefined();
 }
});
test('a new context with one valid cookie can restore without a local SID',async({page,context})=>{
 const server=await mock(context);server.activate();await page.goto('/profile');
 await expect(page.getByText('Account A',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('barber.session.v1')!).sessionId)).toBe(sid);
 await page.close();const reopened=await context.newPage();await reopened.goto('/profile');
 await expect(reopened.getByText('Account A',{exact:true})).toBeVisible();
});
test('an already open anonymous tab adopts the SID established later in the same login generation',async({page,context})=>{
 await mock(context);await page.goto('/login');await call(page,'bootstrap');
 const other=await context.newPage();await other.goto('/login');await call(other,'bootstrap');
 const started=barrier(),held=barrier();
 await context.route('**/api/v1/users/login',async route=>{started.resolve();await held.promise;return route.fulfill({json:tokens()});});
 const login=call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);await started.promise;
 const generation=await page.evaluate(async()=>(await import('/src/auth/session.ts')).getIdentity().generation);
 await expect.poll(async()=>other.evaluate(async()=>(await import('/src/auth/session.ts')).getIdentity().generation)).toBe(generation);
 held.resolve();await login;
 await expect.poll(async()=>other.evaluate(async()=>(await import('/src/auth/session.ts')).getAuthState().status)).toBe('authenticated');
});
test('a durable identity change without a storage event never sends the previous bearer under the new identity',async({page,context})=>{
 await mock(context);await page.goto('/login');await call(page,'bootstrap');await call(page,'loginSession',[{email:'a@example.test',password:'Password2026!'}]);
 let sent=0;await context.route('**/api/v1/private-switch',route=>{sent++;return route.fulfill({json:{private:'Account A'}});});
 const result=await page.evaluate(async()=>{
  const key='barber.session.v1';const metadata=JSON.parse(localStorage.getItem(key)!);
  localStorage.setItem(key,JSON.stringify({...metadata,generation:crypto.randomUUID(),sessionId:'22222222-2222-4222-8222-222222222222'}));
  // Same-document writes deliberately produce no storage event.
  const {default:api}=await import('/src/utils/api.ts');
  try{await api.get('/private-switch');return true;}catch{return false;}
 });
 expect(result).toBe(false);expect(sent).toBe(0);
});
