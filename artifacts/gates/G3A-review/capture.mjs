// Review evidence only. Uses the real production UI; does not modify application state through debug APIs.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const output = path.join(root, 'artifacts/gates/G3A-review');
const url = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
for (const folder of ['phases', 'growth', 'views', 'diagnostics', 'recording']) await fs.mkdir(path.join(output, folder), { recursive: true });
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
async function walk(folder) {
  const found = [];
  for (const item of await fs.readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) found.push(...await walk(file)); else found.push(file);
  }
  return found;
}
const protectedFiles = [...await walk('src'), ...await walk('tests'), ...await walk('contracts'), ...await walk('public'), ...await walk('research'), 'package.json', 'package-lock.json'];
const sourceHashes = Object.fromEntries(await Promise.all(protectedFiles.map(async file => [file.replaceAll('\\','/'), sha(await fs.readFile(file))])));
const historicalFiles = (await walk('artifacts')).filter(file => /\.png$/.test(file) && !file.includes('G3A-review') && !file.includes(`${path.sep}local${path.sep}`));
const historicalHashes = Object.fromEntries(await Promise.all(historicalFiles.map(async file => [file.replaceAll('\\','/'), sha(await fs.readFile(file))])));
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const runtime = { errors: [], failedRequests: [], warnings: [] };
function monitor(page) {
  page.on('pageerror', error => runtime.errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') runtime.errors.push(msg.text()); if (msg.type() === 'warning') runtime.warnings.push(msg.text()); });
  page.on('requestfailed', req => { if (!req.failure()?.errorText?.includes('ERR_ABORTED')) runtime.failedRequests.push({url:req.url(), failure:req.failure()}); });
}
const scene = page => page.evaluate(() => {
  const s = window.__ATLAS_SCENE__.snapshot();
  return { rinkaku: s.rinkaku, camera:s.camera, selectedId:s.selectedId, surfaceOpacity:s.surfaceOpacity,
    layers:s.layers, reducedMotion:s.reducedMotion, viewport:s.viewport, metrics:s.metrics };
});
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function enter(page) {
  monitor(page);
  await page.goto(url, { waitUntil:'load' });
  await page.getByTestId('scene-status').filter({hasText:'3D conectado'}).waitFor();
  await page.getByRole('slider', { name:'Opacidade da superfície', exact:true }).fill('1');
  await page.getByTestId('rinkaku-toggle').click();
  await page.waitForFunction(() => window.__ATLAS_SCENE__?.snapshot().rinkaku?.adapter && !window.__ATLAS_SCENE__.snapshot().camera.moving);
}
async function scrub(page, t) {
  await page.getByTestId('rinkaku-time').fill(String(t));
  await page.waitForFunction(t => Math.abs(window.__ATLAS_SCENE__.snapshot().rinkaku.adapter.t-t)<1e-6, t);
  await settle(page);
}
const captures = [];
async function capture(page, file, details={}, stageOnly=false) {
  const before=await scene(page);
  const stageRect=await page.getByTestId('stage').boundingBox();
  const bytes=stageOnly ? await page.getByTestId('stage').screenshot({path:path.join(output,file)}) : await page.screenshot({path:path.join(output,file)});
  const after=await scene(page);
  const item={file, ...details, captureArea:stageOnly?'stage':'viewport', viewport:page.viewportSize(), stageRect,
    sha256:sha(bytes), t:before.rinkaku.t, tAfter:after.rinkaku.t, playing:before.rinkaku.playing,
    phase:before.rinkaku.snapshot.phase, snapshot:before.rinkaku.snapshot, config:before.rinkaku.config,
    camera:before.camera, bodyOpacity:before.surfaceOpacity, selectedId:before.selectedId,
    connection:before.rinkaku.connection, adapter:before.rinkaku.adapter};
  captures.push(item); return item;
}
const context=await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1, reducedMotion:'reduce' });
const page=await context.newPage();
try {
  await enter(page);
  for (const [i, phase, label, t] of [
    [1,'rest','Repouso',.04], [2,'activation','Ativação',.14], [3,'release','Liberação',.275],
    [4,'growth','Crescimento',.53], [5,'fixation','Fixação visual',.76], [6,'active','Ativo',.9], [7,'retract','Retração',.98],
  ]) {
    await scrub(page,t); const item=await capture(page,`phases/${String(i).padStart(2,'0')}-${phase}.png`,{group:'phases',label});
    if(item.phase!==phase) throw new Error(`Unexpected phase at ${t}`);
  }
  for(const t of [.35,.4,.45,.5,.55,.6,.65,.7]) {
    await scrub(page,t);
    await capture(page,`growth/t${Math.round(t*1000).toString().padStart(3,'0')}.png`,{group:'growth',label:'Crescimento'},true);
  }
  await scrub(page,.9);
  await page.getByTestId('rinkaku-posterior').click(); await settle(page);
  await capture(page,'views/active-posterior.png',{group:'views',label:'Ativo · posterior'});
  await page.getByTestId('rinkaku-lateral').click(); await settle(page);
  await capture(page,'views/active-lateral.png',{group:'views',label:'Ativo · lateral'});
  await page.getByTestId('rinkaku-focus').click(); await settle(page);
  for(const [label,t] of [['growth',.53],['active',.9],['retract',.98]]) {
    await scrub(page,t); await capture(page,`diagnostics/root-${label}.png`,{group:'root',label:`Raiz · ${label}`},true);
  }
  await page.getByTestId('rinkaku-posterior').click(); await settle(page);
  for(const t of [.079,.081,.199,.201,.349,.351,.669,.671,.849,.851,.949,.951]) {
    await scrub(page,t); await capture(page,`diagnostics/boundary-t${Math.round(t*1000).toString().padStart(3,'0')}.png`,{group:'boundaries',label:'Transição ±.001'},true);
  }
  for(const t of [.95,.96,.97,.98,.99,.995,1]) {
    await scrub(page,t); await capture(page,`diagnostics/retract-t${Math.round(t*1000).toString().padStart(3,'0')}.png`,{group:'retraction',label:'Retração'},true);
  }
  await scrub(page,.7);
  const first=await capture(page,'diagnostics/revisit-0700-before.png',{group:'revisit',label:'t=.700 antes'},true);
  for(const t of [.2,.7,.3,.7]) await scrub(page,t);
  const repeated=await capture(page,'diagnostics/revisit-0700-after.png',{group:'revisit',label:'t=.700 revisitado'},true);
  const repeatChecks={sequence:[.7,.2,.7,.3,.7], samePositionHash:first.adapter.positionHash===repeated.adapter.positionHash,
    sameTips:JSON.stringify(first.adapter.tips)===JSON.stringify(repeated.adapter.tips),sameRoots:JSON.stringify(first.adapter.roots)===JSON.stringify(repeated.adapter.roots),
    sameCamera:JSON.stringify(first.camera)===JSON.stringify(repeated.camera),samePngBytes:first.sha256===repeated.sha256};
  if(!repeatChecks.samePositionHash || !repeatChecks.sameTips || !repeatChecks.sameRoots || !repeatChecks.sameCamera) throw new Error('Scrub revisit inconsistency');
  await context.close();

  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  const mobilePage=await mobile.newPage(); await enter(mobilePage); await scrub(mobilePage,.35);
  await mobilePage.getByTestId('rinkaku-play').click();
  await mobilePage.waitForFunction(()=>window.__ATLAS_SCENE__.snapshot().rinkaku.t>=.52);
  await mobilePage.getByTestId('stage').scrollIntoViewIfNeeded();
  const mobileCapture=await capture(mobilePage,'mobile-playing.png',{group:'mobile',label:'Mobile · crescimento automático'});
  if(!mobileCapture.playing || mobileCapture.phase!=='growth') throw new Error('Mobile must capture actual running growth');
  const mobileLayout=await mobilePage.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth}));
  await mobilePage.getByTestId('rinkaku-play').click(); await mobile.close();

  const playback=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference',recordVideo:{dir:path.join(output,'recording'),size:{width:1440,height:900}}});
  const live=await playback.newPage(); const video=live.video(); await enter(live);
  await live.getByTestId('rinkaku-reset').click(); await live.getByTestId('rinkaku-play').click();
  const started=Date.now(), samples=[];
  do {
    const state=await scene(live);
    samples.push({elapsedMs:Date.now()-started,t:state.rinkaku.t,playing:state.rinkaku.playing,snapshot:state.rinkaku.snapshot,positionHash:state.rinkaku.adapter.positionHash,root:state.rinkaku.adapter.root,tips:state.rinkaku.adapter.tips});
    if(state.rinkaku.t===1 && !state.rinkaku.playing) break;
    if(Date.now()-started>30000) throw new Error('Automatic review cycle exceeded timeout');
    await live.waitForTimeout(250);
  } while(true);
  const liveFinal=await scene(live);
  const phasesSeen=[...new Set(samples.map(sample=>sample.snapshot.phase))];
  if(phasesSeen.length!==7) throw new Error('Playback did not expose all seven phases');
  await live.waitForTimeout(400); await playback.close();
  const videoSource=await video.path();
  if(!path.resolve(videoSource).startsWith(path.resolve(output)+path.sep)) throw new Error('Video outside review directory');
  await fs.rename(videoSource,path.join(output,'playback.webm'));
  await fs.rmdir(path.join(output,'recording'));
  const changes=[];
  for(const [file,hash] of Object.entries(sourceHashes)) if(sha(await fs.readFile(file))!==hash) changes.push(file);
  for(const [file,hash] of Object.entries(historicalHashes)) if(sha(await fs.readFile(file))!==hash) changes.push(file);
  if(changes.length) throw new Error('Protected source/history changed: '+changes.join(', '));
  const result={createdAt:new Date().toISOString(),target:url,build:'Fresh production build; original application and controls; no external renders.',
    head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),
    browser:browser.version(),captures,repeatChecks,mobileLayout,
    playback:{file:'playback.webm',elapsedMs:Date.now()-started,phasesSeen,samples,final:liveFinal,sha256:sha(await fs.readFile(path.join(output,'playback.webm')))},
    runtime:{...runtime,warnings:[...new Set(runtime.warnings)]},preservation:{sourceHashes,historicalHashes,changedFiles:changes},
    limits:['Manual captures freeze actual poses with reduced motion; the mobile screenshot and WebM use actual automatic playback.', 'Opacity=1 and surface selected in the main captures reveal overlap without inspection translucency.', 'These screenshots/video are review evidence, not a physical mobile performance measurement or final artistic approval.']};
  await fs.writeFile(path.join(output,'captures.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({captures:captures.length,repeatChecks,mobileLayout,phasesSeen,playbackMs:result.playback.elapsedMs,errors:runtime.errors,failedRequests:runtime.failedRequests,sourceFiles:Object.keys(sourceHashes).length,historicalImages:Object.keys(historicalHashes).length,changes},null,2));
  if(runtime.errors.length || runtime.failedRequests.length || mobileLayout.documentWidth>mobileLayout.viewport) process.exitCode=1;
} finally { await browser.close(); }
