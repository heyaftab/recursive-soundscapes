/* Mathematical, event-model and polyphony regressions for the recursive extensions. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:{},console};vm.createContext(c);
for(const f of ['algorithms','music'])vm.runInContext(fs.readFileSync(`src/${f}.js`,'utf8'),c);
const R=c.window.RS;let count=0;
function check(scene,s){
  const music=R.makeComposition(scene,s),ids=new Set(scene.nodes.map(n=>n.id));
  assert(music.events.length<=400);assert(music.duration<=200);assert.equal(new Set(music.events.map(e=>e.id)).size,music.events.length);
  for(const e of music.events){
    assert(ids.has(e.sourceNodeId));
    for(const key of ['time','pitch','duration','velocity','depth','pan'])assert(Number.isFinite(e[key]),key);
    assert(e.time>=0&&e.duration>0&&e.velocity>0&&e.velocity<=.8);
    assert(e.pan>=-.85&&e.pan<=.85);assert(e.pitch>=36&&e.pitch<=89);
    assert(R.scales[s.scale].steps.includes(((e.pitch-R.scales[s.scale].root)%12+12)%12));
    assert(e.time+e.duration+e.release<music.duration);
  }
  const edges=music.events.flatMap(e=>[{t:e.time,n:1},{t:e.time+e.duration+e.release+.13,n:-1}]).sort((a,b)=>a.t-b.t||a.n-b.n);
  let voices=0,max=0;for(const e of edges){voices+=e.n;max=Math.max(max,voices);}assert(max<=12,`polyphony ${max}`);
  const again=R.makeComposition(scene,s);assert.deepEqual(music,again,'deterministic composition');count++;return music;
}
for(const mode of ['curve','snowflake'])for(const depth of [1,3,5]){
  const scene=R.generateScene({...R.defaults,algorithm:'koch',kochMode:mode,depth});
  for(let d=0;d<=depth;d++){
    assert.equal(scene.levels[d].length,(mode==='curve'?1:3)*4**d);
    for(const n of scene.levels[d]){
      assert(Math.abs(n.length-3**(-d))<1e-10);
      const base=scene.levels[0][0],normalizedLength=Math.hypot(base.x2-base.x1,base.y2-base.y1);
      assert(Math.abs(Math.hypot(n.x2-n.x1,n.y2-n.y1)-normalizedLength*3**(-d))<1e-10,'undistorted equilateral geometry');
      for(const k of ['x1','x2','y1','y2'])assert(n[k]>=.05&&n[k]<=.95);
      if(d){const p=scene.nodes.find(p=>p.id===n.parentId);assert(p&&p.depth===d-1);}
    }
    for(let i=1;i<scene.levels[d].length;i++){
      const a=scene.levels[d][i-1],b=scene.levels[d][i];assert(Math.abs(a.x2-b.x1)<1e-10&&Math.abs(a.y2-b.y1)<1e-10);
    }
  }
  for(const tempo of [40,80,160])for(const density of [1,4,10])for(const scale of Object.keys(R.scales))for(const mood of Object.keys(R.moods)){
    const s={...R.defaults,algorithm:'koch',depth,kochMode:mode,tempo,density,scale,mood};
    const music=check(scene,s);assert.equal(music.iterations.length,depth+1);
    for(let d=0;d<=depth;d++)assert(music.events.some(e=>e.kind==='melody'&&e.depth===d));
  }
}
for(let disks=1;disks<=8;disks++){
  const scene=R.generateScene({...R.defaults,algorithm:'hanoi',disks});assert.equal(scene.moves.length,2**disks-1);
  const pegs=[Array.from({length:disks},(_,i)=>disks-i),[],[]];
  for(const move of scene.moves){
    assert.deepEqual(JSON.parse(JSON.stringify(move.before)),pegs);assert.equal(pegs[move.from].pop(),move.disk);
    assert(!pegs[move.to].length||pegs[move.to].at(-1)>move.disk);pegs[move.to].push(move.disk);
    assert.deepEqual(JSON.parse(JSON.stringify(move.after)),pegs);
  }
  assert.equal(pegs[2].length,disks);
  for(const tempo of [40,80,160])for(const density of [1,4,10])for(const scale of Object.keys(R.scales))for(const mood of Object.keys(R.moods)){
    const s={...R.defaults,algorithm:'hanoi',disks,tempo,density,scale,mood};const music=check(scene,s);
    const melody=music.events.filter(e=>e.kind==='melody');assert.equal(melody.length,scene.moves.length);
    const pitches=new Map();
    melody.forEach((e,i)=>{assert.equal(e.sourceNodeId,scene.moves[i].id);assert.equal(e.pan,[-.8,0,.8][scene.moves[i].to]);assert(Math.abs(e.time-(.15+i*30/tempo))<1e-9);pitches.set(scene.moves[i].disk,e.pitch);});
    for(let disk=2;disk<=disks;disk++)assert(pitches.get(disk)<pitches.get(disk-1));
  }
}
assert.equal(R.generateScene({...R.defaults,algorithm:'koch',depth:99}).depth,5);
assert.equal(R.generateScene({...R.defaults,algorithm:'hanoi',disks:99}).disks,8);
console.log(`PASS: ${count} extension combinations; geometry, every legal Hanoi move, scales, IDs, deterministic timing, duration, and <=12 voices.`);
