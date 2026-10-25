// Offline diagnostics of the existing adapter; no runtime/product code is changed.
import fs from 'node:fs/promises';
import { Matrix4 } from 'three';
import { ProceduralRinkakuAdapter } from '../../../src/scene/rinkaku/ProceduralRinkakuAdapter.ts';
import { sampleRinkakuAt } from '../../../src/simulation/rinkaku.ts';

const adapter=new ProceduralRinkakuAdapter(), connection=new Matrix4();
function pose(t) {
  const snapshot=sampleRinkakuAt(t);
  adapter.apply(snapshot,connection);
  return {snapshot,inspection:adapter.inspect(),positions:adapter.group.children.filter(object=>object.isMesh&&!object.isInstancedMesh)
    .map(object=>Float32Array.from(object.geometry.getAttribute('position').array))};
}
function vertexDelta(a,b) {
  let max=0,finite=true;
  for(let mesh=0;mesh<a.positions.length;mesh++) for(let i=0;i<a.positions[mesh].length;i+=3) {
    const pa=a.positions[mesh], pb=b.positions[mesh];
    const delta=Math.hypot(pa[i]-pb[i],pa[i+1]-pb[i+1],pa[i+2]-pb[i+2]);
    finite&&=Number.isFinite(delta); max=Math.max(max,delta);
  }
  return {maxVertexDisplacementSceneUnits:max,finite};
}
const epsilon=.000001;
const boundaries=[.08,.2,.35,.67,.85,.95].map(t=>{
  const before=pose(t-epsilon),after=pose(t+epsilon);
  return {boundary:t,beforeT:t-epsilon,afterT:t+epsilon,beforePhase:before.snapshot.phase,afterPhase:after.snapshot.phase,...vertexDelta(before,after)};
});
const first=pose(.7); for(const t of [.2,.7,.3]) pose(t); const repeat=pose(.7);
const reference=pose(0).inspection.roots;
let maxRootCenterDrift=0,allFinite=true;
for(let i=0;i<=200;i++) {
  const current=pose(i/200);
  allFinite&&=current.positions.every(positions=>positions.every(Number.isFinite));
  for(let root=0;root<4;root++) maxRootCenterDrift=Math.max(maxRootCenterDrift,Math.hypot(...current.inspection.roots[root].map((value,j)=>value-reference[root][j])));
}
const ending=vertexDelta(pose(.999999),pose(1));
const result={method:'Offline evaluation of the original pure sampler and procedural adapter in identity connection space; no new geometry algorithm and no edits to product.',
  epsilon,boundaries,sampleCount:201,allPositionsFinite:allFinite,maxRootCenterDriftSceneUnits:maxRootCenterDrift,
  revisit:{sequence:[.7,.2,.7,.3,.7],sameHash:first.inspection.positionHash===repeat.inspection.positionHash,...vertexDelta(first,repeat)},ending,
  notes:['Scene units are illustrative and are not a physiological RC scale.', 'Position continuity and fixed root centres do not prove clean surface intersections, continuous skin topology, natural motion or human artistic approval.', 'The screenshots, actual playback and close-ups provide separate visual evidence.']};
await fs.writeFile(new URL('geometry-review.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
adapter.dispose(); console.log(JSON.stringify(result,null,2));
if(!allFinite || maxRootCenterDrift>1e-9 || !result.revisit.sameHash || boundaries.some(item=>!item.finite)) process.exitCode=1;
