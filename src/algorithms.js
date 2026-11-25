/* Pure mathematical generators. Every node has a stable ID used by the music timeline. */
(function (RS) {
  'use strict';
  const MAX_NODES = 10000;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));
  RS.clamp = clamp;
  RS.defaults = Object.freeze({ algorithm: 'fibonacci', kochMode: 'snowflake', disks: 4, depth: 4, tempo: 80, density: 4, branchAngle: 32, branchLength: 72, mood: 'calm', instrument: 'soft', scale: 'pentatonic', volume: 65, seed: 417, loop: false });
  RS.algorithmInfo = {
    fibonacci: { title: 'Fibonacci spiral', subtitle: 'Every number tells a story. Every note follows it.', description: 'Each Fibonacci value is the sum of the two before it: F(n) = F(n−1) + F(n−2). Values become pitches, and their sequence creates the melody.', tags: ['VALUE → PITCH', 'INDEX → RHYTHM'], mapping: 'Fibonacci values are mapped into a musical scale. Each sequence position controls when its note sounds; longer patterns add new phrases.', figure: '01' },
    sierpinski: { title: 'Sierpinski triangle', subtitle: 'Infinite detail. A geometry of sound.', description: 'Each triangle splits recursively into three smaller triangles. Subdivision controls rhythm, position shapes panning, and depth changes musical register.', tags: ['POSITION → PAN', 'DEPTH → REGISTER'], mapping: 'The recursive triangle traversal creates note order. Triangle depth controls register, and left-to-right position places notes across your headphones.', figure: '02' },
    tree: { title: 'Recursive branching tree', subtitle: 'An evolving forest of harmonies.', description: 'Each branch generates smaller branches. Growth depth shapes musical register, and branch positions determine melody and stereo movement.', tags: ['DEPTH → REGISTER', 'BRANCH → RHYTHM'], mapping: 'Every recursive branch becomes a possible note. Its height and depth select pitch, while its horizontal position controls the stereo panorama.', figure: '03' }
  };

  function fibonacci(depth) {
    const count = 10 + depth * 5;
    const numbers = [0, 1];
    for (let i = 2; i < count; i++) numbers[i] = numbers[i - 1] + numbers[i - 2];
    const nodes = numbers.map((value, i) => {
      const angle = i * .49 - Math.PI / 2; // contiguous nodes follow a true outward spiral
      const radius = .055 + .39 * Math.sqrt((i + 1) / count);
      return { id: `f-${i}`, index: i, depth: Math.min(depth, Math.max(1, Math.floor(i / 5) + 1)), x: .5 + Math.cos(angle) * radius, y: .5 + Math.sin(angle) * radius, value, label: `F${i}`, type: 'point', pan: Math.cos(angle) * .68 };
    });
    return { algorithm: 'fibonacci', nodes, candidates: nodes, sequence: numbers, totalNodes: nodes.length };
  }

  function sierpinski(depth) {
    const nodes = [];
    const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
    const a = { x: .5, y: .10 }, b = { x: .07, y: .87 }, c = { x: .93, y: .87 };
    function recurse(a, b, c, d, path) {
      if (nodes.length >= MAX_NODES) return;
      const x = (a.x + b.x + c.x) / 3;
      const y = (a.y + b.y + c.y) / 3;
      const node = { id: `s-${path || 'root'}`, index: nodes.length, depth: d, x, y, type: 'triangle', triangle: [a, b, c], path, leaf: d === depth, pan: (x - .5) * 1.8, value: path.split('').reduce((sum, digit, i) => sum + (Number(digit) + 1) * (i + 1), d) };
      nodes.push(node);
      if (d >= depth || nodes.length >= MAX_NODES) return;
      const ab = mid(a, b), bc = mid(b, c), ac = mid(a, c);
      recurse(a, ab, ac, d + 1, path + '0');
      recurse(ab, b, bc, d + 1, path + '1');
      recurse(ac, bc, c, d + 1, path + '2');
    }
    recurse(a, b, c, 0, '');
    const leaves = nodes.filter(n => n.leaf);
    // Include shallower nodes so the music can audibly represent multiple recursion layers.
    const intermediate = nodes.filter(n => !n.leaf && n.depth > 0 && n.index % Math.max(2, depth * 3) === 0);
    const candidates = leaves.length > 0 ? [...leaves, ...intermediate].sort((u, v) => u.index - v.index) : nodes;
    return { algorithm: 'sierpinski', nodes, candidates, totalNodes: nodes.length };
  }

  function tree(depth, angleDegrees, lengthPct, density) {
    const nodes = [];
    const angle = clamp(angleDegrees, 16, 50) * Math.PI / 180;
    const lengthMultiplier = clamp(lengthPct, 60, 80) / 100;
    const branches = density >= 8 ? 3 : 2;
    function grow(x1, y1, direction, length, d, path) {
      if (nodes.length >= MAX_NODES) return;
      const x2 = x1 + Math.cos(direction) * length;
      const y2 = y1 + Math.sin(direction) * length;
      nodes.push({ id: `t-${path || 'root'}`, index: nodes.length, depth: d, x: (x1 + x2) / 2, y: (y1 + y2) / 2, x1, y1, x2, y2, type: 'branch', pan: clamp((x2 - .5) * 1.85, -1, 1), value: Math.round((x2 + y2) * 100) + d, leaf: d === depth });
      if (d >= depth || nodes.length >= MAX_NODES) return;
      const offsets = branches === 2 ? [-angle, angle] : [-angle, 0, angle];
      offsets.forEach((offset, i) => grow(x2, y2, direction + offset, length * lengthMultiplier, d + 1, path + i));
    }
    grow(.5, .95, -Math.PI / 2, .22, 0, '');
    const candidates = nodes.filter(n => n.depth > 0);
    return { algorithm: 'tree', nodes, candidates: candidates.length ? candidates : nodes, totalNodes: nodes.length };
  }

  function koch(depth, mode) {
    const nodes = [], levels = [];
    const points = mode === 'curve' ? [{x:0,y:0},{x:1,y:0}] :
      [{x:0,y:0},{x:1,y:0},{x:.5,y:Math.sqrt(3)/2},{x:0,y:0}];
    function segment(a,b,d,path,parentId=null,child=0) {
      const dx=b.x-a.x,dy=b.y-a.y;
      const n={id:'k-'+path,index:nodes.length,type:'segment',depth:d,
        x1:a.x,y1:a.y,x2:b.x,y2:b.y,x:(a.x+b.x)/2,y:(a.y+b.y)/2,
        length:Math.hypot(dx,dy),orientation:Math.atan2(dy,dx),parentId,child,leaf:d===depth};
      nodes.push(n); (levels[d] ||= []).push(n);
      if(d===depth)return;
      const u={x:a.x+dx/3,y:a.y+dy/3},v={x:a.x+dx*2/3,y:a.y+dy*2/3};
      const peak={x:u.x+dx/6+dy*Math.sqrt(3)/6,y:u.y+dy/6-dx*Math.sqrt(3)/6};
      const chain=[a,u,peak,v,b];
      for(let i=0;i<4;i++)segment(chain[i],chain[i+1],d+1,path+i,n.id,i);
    }
    for(let i=0;i<points.length-1;i++)segment(points[i],points[i+1],0,String(i));
    const minX=Math.min(...nodes.flatMap(n=>[n.x1,n.x2])),maxX=Math.max(...nodes.flatMap(n=>[n.x1,n.x2]));
    const minY=Math.min(...nodes.flatMap(n=>[n.y1,n.y2])),maxY=Math.max(...nodes.flatMap(n=>[n.y1,n.y2]));
    const extent=Math.max(maxX-minX,maxY-minY,.01);
    for(const n of nodes){
      for(const k of ['x','x1','x2'])n[k]=.5+(n[k]-(minX+maxX)/2)*.78/extent;
      for(const k of ['y','y1','y2'])n[k]=.5+(n[k]-(minY+maxY)/2)*.78/extent;
      n.pan=(n.x-.5)*1.8;
    }
    return {algorithm:'koch',mode,depth,nodes,levels,candidates:levels[depth],totalNodes:levels[depth].length};
  }
  RS.algorithmInfo.koch={title:'Koch snowflake / curve',subtitle:'Four smaller paths. A richer musical world.',description:'Replace the middle third of each line with a triangular peak. Every line becomes four; each iteration adds a higher musical layer.',mapping:'Segment orientation selects scale notes, length sets duration, and horizontal position sets pan. Higher iterations retain gentle lower-octave echoes.',tags:['ANGLE \u2192 PITCH','ITERATION \u2192 LAYER'],figure:'04'};

  function hanoi(disks) {
    const pegs=[Array.from({length:disks},(_,i)=>disks-i),[],[]],nodes=[];
    const snapshot=()=>pegs.map(p=>[...p]);
    const initial=snapshot();
    function solve(n,from,to,aux,depth){
      if(n===0)return;
      solve(n-1,from,aux,to,depth+1);
      const before=snapshot(),disk=pegs[from].pop();
      if(disk!==n || (pegs[to].length && pegs[to].at(-1)<disk))throw new Error('Illegal Hanoi move');
      const sourceHeight=before[from].length-1,destinationHeight=pegs[to].length;
      pegs[to].push(disk);
      nodes.push({id:'h-'+(nodes.length+1),index:nodes.length,type:'move',depth,disk,from,to,before,after:snapshot(),sourceHeight,destinationHeight,x:[.2,.5,.8][to],y:.75,pan:[-.8,0,.8][to]});
      solve(n-1,aux,to,from,depth+1);
    }
    solve(disks,0,2,1,1);
    return {algorithm:'hanoi',disks,nodes,moves:nodes,candidates:nodes,totalNodes:nodes.length,initial,final:snapshot()};
  }
  RS.algorithmInfo.hanoi={title:'Towers of Hanoi',subtitle:'An experimental rhythm of recursive resolution.',description:'Move the top disk between three pegs, never placing a larger disk on a smaller one. Solve the smaller tower, move the largest disk, then solve the smaller tower again.',mapping:'Every legal move sounds a note: larger disks sing lower, smaller disks higher. Destination pegs pan left, center or right; recursion depth colors the voice. Density adds supporting texture without skipping moves.',tags:['DISK SIZE \u2192 PITCH','DESTINATION \u2192 PAN'],figure:'05'};

  RS.generateScene = function (rawSettings) {
    const s = rawSettings;
    const depth = Math.round(clamp(s.depth, 1, 8));
    if (s.algorithm === 'hanoi') return hanoi(Math.round(clamp(s.disks ?? 4,1,8)));
    if (s.algorithm === 'koch') return koch(Math.round(clamp(s.depth,1,5)),s.kochMode === 'curve' ? 'curve' : 'snowflake');
    if (s.algorithm === 'fibonacci') return fibonacci(depth);
    if (s.algorithm === 'sierpinski') return sierpinski(depth);
    if (s.algorithm === 'tree') return tree(depth, s.branchAngle, s.branchLength, s.density);
    throw new Error('Unknown recursive algorithm.');
  };
})(window.RS = window.RS || {});
