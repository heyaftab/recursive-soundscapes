const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = { window: {}, console };
vm.createContext(context);
for (const name of ['algorithms.js', 'music.js']) vm.runInContext(fs.readFileSync(`src/${name}`, 'utf8'), context, { filename: name });
const RS = context.window.RS;
const keys = Object.keys(RS.scales);
let allCount = 0;
for (const algorithm of ['fibonacci', 'sierpinski', 'tree']) {
  for (const depth of [1,4,8]) {
    for (const density of [1,4,10]) {
      const settings = { ...RS.defaults, algorithm, depth, density, seed: 551, tempo: 90 };
      const scene = RS.generateScene(settings);
      assert(scene.nodes.length > 0 && scene.nodes.length <= 10000, `${algorithm}: invalid node count`);
      const ids = new Set(scene.nodes.map(n => n.id));
      assert.equal(ids.size, scene.nodes.length, `${algorithm}: duplicate node IDs`);
      for (const scale of keys) {
        settings.scale = scale;
        const composition = RS.makeComposition(scene, settings);
        assert(composition.events.length > 0 && composition.events.length < 300, `${algorithm}: invalid event count`);
        assert(composition.duration < 95.001, `${algorithm}: excessive duration`);
        const musicalDegrees = RS.scales[scale].steps;
        for (const e of composition.events) {
          assert(ids.has(e.sourceNodeId), `missing ${e.sourceNodeId}`);
          assert(Number.isFinite(e.time) && e.time >= 0 && Number.isFinite(e.pitch) && Number.isFinite(e.duration));
          assert(e.pan >= -1 && e.pan <= 1);
          assert(musicalDegrees.includes(((e.pitch - RS.scales[scale].root) % 12 + 12) % 12), `off-scale pitch ${e.pitch} for ${scale}`);
        }
        allCount++;
      }
    }
  }
}
const fib = RS.generateScene({ ...RS.defaults, algorithm: 'fibonacci', depth:4 });
assert.equal(fib.sequence[10], 55);
console.log(`PASS: ${allCount} algorithm/scale/depth/density combinations; valid IDs, bounds, and scale pitches.`);
