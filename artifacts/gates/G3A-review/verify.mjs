// Integrity and provenance checks for this review package; does not write product files.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const folder=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(folder,'../../..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const readJson=async file=>JSON.parse((await fs.readFile(path.join(folder,file),'utf8')).replace(/^\uFEFF/,''));
const capture=await readJson('captures.json'), composition=await readJson('compositions.json');
const failures=[], checkedScreenshots=[];
async function verifyFile(file,hash,kind) {
  const bytes=await fs.readFile(path.join(folder,file));
  if(sha(bytes)!==hash) failures.push({file,reason:'sha256 mismatch'});
  if(kind==='png' && bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') failures.push({file,reason:'invalid PNG header'});
  return {file,sha256:sha(bytes),bytes:bytes.length,...(kind==='png'?{width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)}:{})};
}
for(const item of capture.captures) checkedScreenshots.push(await verifyFile(item.file,item.sha256,'png'));
const sheets=[];
for(const item of composition.compositions) sheets.push(await verifyFile(item.file,item.sha256,'png'));
const video=await verifyFile(capture.playback.file,capture.playback.sha256,'webm');
const changedProtected=[];
for(const [file,hash] of Object.entries({...capture.preservation.sourceHashes,...capture.preservation.historicalHashes})) {
  if(sha(await fs.readFile(path.join(root,file)))!==hash) changedProtected.push(file);
}
if(changedProtected.length) failures.push({reason:'protected files changed',files:changedProtected});
async function walk(directory) {
  const files=[];
  for(const entry of await fs.readdir(directory,{withFileTypes:true})) {
    const file=path.join(directory,entry.name);
    if(entry.isDirectory()) files.push(...await walk(file)); else files.push(file);
  }
  return files;
}
// Make the report itself resolvable before validating Markdown links to it.
await fs.writeFile(path.join(folder,'verify-review.json'),'{}\n');
const files=(await walk(folder)).filter(file=>path.basename(file)!=='verify-review.json');
const missingLinks=[], personalPaths=[];
for(const file of files) {
  if(/\.(?:md|json|txt|mjs|py)$/.test(file)) {
    const text=await fs.readFile(file,'utf8');
    if(/C:[\\/]Users[\\/]/i.test(text)) personalPaths.push(path.relative(folder,file));
    if(file.endsWith('.md')) for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const href=match[1].split('#')[0];
      if(!href || /^[a-z]+:/i.test(href)) continue;
      try { await fs.access(path.resolve(path.dirname(file),decodeURIComponent(href))); }
      catch { missingLinks.push({file:path.relative(folder,file),href}); }
    }
  }
}
if(missingLinks.length || personalPaths.length) failures.push({reason:'review links or personal paths',missingLinks,personalPaths});
const checks=await readJson('checks.json');
if(checks.some(check=>check.exitCode!==0)) failures.push({reason:'required command failed'});
const geometry=await readJson('geometry-review.json');
if(!geometry.allPositionsFinite || geometry.maxRootCenterDriftSceneUnits!==0 || !geometry.revisit.sameHash) failures.push({reason:'geometry diagnostic failed'});
if(!capture.repeatChecks.samePngBytes || !composition.scrubPixelComparison.identicalPixels) failures.push({reason:'revisit images differ'});
if(capture.runtime.errors.length || capture.runtime.failedRequests.length) failures.push({reason:'browser runtime failure'});
if(capture.playback.phasesSeen.length!==7 || capture.playback.final.rinkaku.t!==1) failures.push({reason:'incomplete playback'});
const mobile=capture.captures.find(item=>item.group==='mobile');
if(!mobile.playing || mobile.phase!=='growth' || capture.mobileLayout.documentWidth>capture.mobileLayout.viewport) failures.push({reason:'mobile playback/layout failure'});
execFileSync('git',['diff','--check'],{cwd:root});
const inventory=await Promise.all(files.map(async file=>{const bytes=await fs.readFile(file);return {file:path.relative(folder,file).replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes)};}));
const result={verifiedAt:new Date().toISOString(),status:failures.length?'failed':'passed',failures,
  head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),
  screenshots:checkedScreenshots.length,compositions:sheets.length,checkedScreenshots,sheets,video,
  protectedSourceFiles:Object.keys(capture.preservation.sourceHashes).length,preservedPriorImages:Object.keys(capture.preservation.historicalHashes).length,changedProtected,
  checkedMarkdownFiles:files.filter(file=>file.endsWith('.md')).length,missingLinks,personalPaths,
  checks,geometrySummary:{samples:geometry.sampleCount,allFinite:geometry.allPositionsFinite,maxRootCenterDrift:geometry.maxRootCenterDriftSceneUnits},
  revisit:capture.repeatChecks,pixelComparison:composition.scrubPixelComparison,mobile:{playing:mobile.playing,phase:mobile.phase,tBefore:mobile.t,tAfter:mobile.tAfter,...capture.mobileLayout},
  runtime:capture.runtime,totalBytesExcludingThisReport:inventory.reduce((sum,item)=>sum+item.bytes,0),inventory,
  limits:['This is evidence integrity and scoped smoke verification, not human artistic approval.', 'No source, dependency, canonical content, commit, push or deployment was changed by the review.']};
await fs.writeFile(path.join(folder,'verify-review.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,screenshots:result.screenshots,compositions:result.compositions,videoBytes:video.bytes,protectedSourceFiles:result.protectedSourceFiles,preservedPriorImages:result.preservedPriorImages,changedProtected,missingLinks,personalPaths,failures,packageMiB:(result.totalBytesExcludingThisReport/1048576).toFixed(2)},null,2));
if(failures.length) process.exitCode=1;
