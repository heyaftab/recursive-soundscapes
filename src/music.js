/* Algorithm-to-music mapping: a single immutable timeline feeds audio, visuals, and WAV. */
(function (RS) {
  'use strict';
  const SCALES = {
    pentatonic: { root: 60, steps: [0, 2, 4, 7, 9], name: 'C major pentatonic' },
    major: { root: 60, steps: [0, 2, 4, 5, 7, 9, 11], name: 'C major' },
    minor: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10], name: 'A natural minor' },
    dorian: { root: 62, steps: [0, 2, 3, 5, 7, 9, 10], name: 'D dorian' },
    lydian: { root: 65, steps: [0, 2, 4, 6, 7, 9, 11], name: 'F lydian' },
    mixolydian: { root: 67, steps: [0, 2, 4, 5, 7, 9, 10], name: 'G mixolydian' },
    phrygian: { root: 64, steps: [0, 1, 3, 5, 7, 8, 10], name: 'E phrygian' },
    harmonicMinor: { root: 57, steps: [0, 2, 3, 5, 7, 8, 11], name: 'A harmonic minor' },
    blues: { root: 60, steps: [0, 3, 5, 6, 7, 10], name: 'C blues' }
  };
  const MOODS = {
    calm: { name: 'Calm', waveform: 'sine', attack: .045, release: .8, noteFactor: .94, reverb: .20, delay: .07, brightness: 950, padEvery: 8, velocity: .80 },
    dreamy: { name: 'Dreamy', waveform: 'sine', attack: .012, release: 1.45, noteFactor: 1.17, reverb: .32, delay: .13, brightness: 1800, padEvery: 6, velocity: .75 },
    focus: { name: 'Deep Focus', waveform: 'triangle', attack: .02, release: .32, noteFactor: .62, reverb: .09, delay: .08, brightness: 1200, padEvery: 10, velocity: .76 },
    meditation: { name: 'Meditation', waveform: 'sine', attack: .24, release: 2.1, noteFactor: 1.55, reverb: .30, delay: .03, brightness: 720, padEvery: 5, velocity: .64 },
    ambient: { name: 'Ambient Drift', waveform: 'sine', attack: .16, release: 1.8, noteFactor: 1.38, reverb: .42, delay: .18, brightness: 1450, padEvery: 4, velocity: .62 },
    nocturne: { name: 'Nocturne', waveform: 'triangle', attack: .08, release: 1.25, noteFactor: 1.12, reverb: .27, delay: .20, brightness: 820, padEvery: 7, velocity: .70 },
    cinematic: { name: 'Cinematic', waveform: 'sawtooth', attack: .11, release: 1.6, noteFactor: 1.32, reverb: .36, delay: .10, brightness: 1100, padEvery: 3, velocity: .66 },
    pulse: { name: 'Pulse', waveform: 'triangle', attack: .008, release: .22, noteFactor: .48, reverb: .08, delay: .16, brightness: 2100, padEvery: 12, velocity: .78 }
  };
  RS.scales = SCALES;
  RS.moods = MOODS;
  const positiveMod = (n, m) => ((n % m) + m) % m;
  const rnd = (seed) => {
    let a = seed >>> 0;
    return function () { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };
  const toneFromIndex = (index, scale, octave = 0) => scale.root + scale.steps[positiveMod(index, scale.steps.length)] + octave * 12;
  const MIDI_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  RS.noteName = (midi) => MIDI_NAMES[positiveMod(midi, 12)] + (Math.floor(midi / 12) - 1);
  RS.formatTime = (n) => { const seconds = Math.max(0, Math.floor(n || 0)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };

  function recursiveComposition(scene,s) {
    const scale=SCALES[s.scale]||SCALES.pentatonic,mood=MOODS[s.mood]||MOODS.calm;
    const variationShift=((Number(s.variationIndex)||0)*2)%scale.steps.length;
    const beat=60/RS.clamp(s.tempo,40,160),density=Math.round(RS.clamp(s.density,1,10));
    const events=[],iterations=[];
    const safePitch=pitch=>{while(pitch>89)pitch-=12;while(pitch<45)pitch+=12;return pitch;};
    const add=(node,time,pitch,duration,kind='melody',velocity=.27)=>events.push({
      id:kind+'-'+node.id+'-'+events.length,time,pitch:safePitch(pitch),duration,velocity:velocity*mood.velocity*(.92+((Math.imul(s.seed+node.index+1,16807)>>>0)%17)/100),
      depth:node.depth,pan:node.pan,sourceNodeId:node.id,kind,layer:node.depth,
      release:Math.min(mood.release,kind==='melody'?.8:1.2),
      voice:s.instrument
    });
    if(scene.algorithm==='koch'){
      let cursor=0;
      for(let level=0;level<=scene.depth;level++){
        const segments=scene.levels[level],count=Math.min(segments.length,8+density*2);
        const step=beat*(density>=8?.5:.75);
        iterations.push({depth:level,time:cursor,duration:step*count});
        for(let i=0;i<count;i++){
          const node=segments[Math.floor(i*segments.length/count)];
          const degree=Math.round(node.orientation/(Math.PI/3))+Math.floor(s.seed/137)%scale.steps.length+variationShift;
          const octave=Math.min(2,level-1);
          const duration=Math.max(.12,Math.min(step*.95,beat*1.6*node.length*mood.noteFactor));
          const shiftedOctave=octave+Math.floor(degree/scale.steps.length)-Math.floor((degree-variationShift)/scale.steps.length);
          add(node,cursor+i*step,toneFromIndex(degree,scale,shiftedOctave),duration);
          if(level>0&&i%Math.max(3,11-density)===0){
            const lower=scene.levels[level-1][Math.floor(i*scene.levels[level-1].length/count)];
            add(lower,cursor+i*step,toneFromIndex(Math.round(lower.orientation/(Math.PI/3)),scale,Math.max(-1,octave-1)),step*1.4,'pad',.10);
          }
        }
        cursor+=count*step;
      }
    }
    if(scene.algorithm==='hanoi'){
      const step=beat*.5;
      for(const node of scene.moves){
        const degree=scene.disks-node.disk+variationShift;
        const pitch=scale.root-12+Math.floor(degree/scale.steps.length)*12+scale.steps[degree%scale.steps.length];
        add(node,.15+node.index*step,pitch,Math.min(step*.8,beat*mood.noteFactor*.6));
        if(density>2&&node.index%Math.max(3,13-density)===0){
          add(node,.15+node.index*step,toneFromIndex(degree+2,scale,-1),step*1.4,'pad',.09);
        }
      }
    }
    if(scene.algorithm==='hanoi')for(const e of events)if(e.kind==='melody')e.moveDuration=beat*.5;
    const primary=events.filter(e=>e.kind==='melody'),accepted=[...primary];
    for(const e of events.filter(e=>e.kind!=='melody')){
      if(accepted.filter(n=>n.time<e.time+e.duration+e.release+.13&&n.time+n.duration+n.release+.13>e.time).length<10)accepted.push(e);
    }
    accepted.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
    const duration=Math.max(...accepted.map(e=>e.time+e.duration+e.release+.13))+1.8;
    return {algorithm:scene.algorithm,seed:s.seed,events:accepted,duration,iterations,nodeCount:scene.totalNodes,noteCount:accepted.length,scale:s.scale,mood:s.mood};
  }

  RS.makeComposition = function (scene, s) {
    if(scene.algorithm==='koch'||scene.algorithm==='hanoi')return recursiveComposition(scene,s);
    const scale = SCALES[s.scale] || SCALES.pentatonic;
    const mood = MOODS[s.mood] || MOODS.calm;
    const variationShift = ((Number(s.variationIndex) || 0) * 2) % scale.steps.length;
    const random = rnd(s.seed + 17);
    const candidates = scene.candidates;
    if (!candidates.length) throw new Error('The algorithm did not generate any nodes.');
    const target = Math.min(105, Math.max(24, Math.round(s.depth * 5 + s.density * 6)));
    const secondsPerBeat = 60 / s.tempo;
    const subdivision = s.density >= 8 ? .5 : s.density >= 5 ? .75 : 1;
    const step = secondsPerBeat * subdivision;
    const timeSafeCount = Math.max(3, Math.floor(83 / step));
    const count = scene.algorithm === 'fibonacci' ? Math.min(target, candidates.length * 2, timeSafeCount) : Math.min(target, candidates.length, timeSafeCount);
    const events = [];
    // Variation is a bounded scale-degree shift per phrase, never unrelated random notes.
    // The recursive node remains the foundation of every pitch.
    const phraseVariations = Array.from({ length: 20 }, () => Math.floor(random() * 3) - 1);
    const chordProgression = [0, 3, 4, 2];

    for (let i = 0; i < count; i++) {
      const relative = count === 1 ? 0 : i / (count - 1);
      let idx = Math.floor(relative * (candidates.length - 1));
      if (scene.algorithm === 'fibonacci') idx = i % candidates.length;
      const node = candidates[idx];
      let degree;
      let octave;
      if (scene.algorithm === 'fibonacci') {
        // Pitch is derived from Fibonacci values, not arbitrary random pitch.
        degree = positiveMod(node.value + Math.floor(i / 7), scale.steps.length);
        octave = node.value % 8 === 0 ? 1 : 0;
      } else if (scene.algorithm === 'sierpinski') {
        // Subdivision path and triangle position drive note selection and register.
        degree = positiveMod(node.value + Math.round(node.x * 4) + Math.round(node.y * 3), scale.steps.length);
        octave = node.depth >= 6 ? 1 : node.depth <= 2 ? -1 : 0;
      } else {
        // Vertical height, depth, and branch value are all measurable tree properties.
        degree = positiveMod(Math.round((1 - node.y) * 9) + node.depth + node.value, scale.steps.length);
        octave = node.depth >= 6 ? 1 : node.depth <= 2 ? -1 : 0;
      }
      degree += phraseVariations[Math.floor(i / 8) % phraseVariations.length];
      const shiftedDegree = degree + variationShift;
      octave += Math.floor(shiftedDegree / scale.steps.length) - Math.floor(degree / scale.steps.length);
      degree = shiftedDegree;
      let pitch = toneFromIndex(degree, scale, octave);
      pitch = RS.clamp(pitch, 45, 89);
      const variation = random();
      const rhythmicAccent = i % 8 === 3 ? .16 * secondsPerBeat : i % 8 === 7 ? .10 * secondsPerBeat : 0;
      const time = i * step + rhythmicAccent;
      const duration = Math.min(3.9, Math.max(.22, step * mood.noteFactor * (.88 + random() * .38)));
      const velocity = Math.min(.8, (.30 + .11 * variation + (i % 8 === 0 ? .085 : 0)) * mood.velocity);
      const pan = RS.clamp(node.pan || 0, -.85, .85);
      events.push({ id: `ev-${i}`, time, pitch, duration, velocity, depth: node.depth, pan, sourceNodeId: node.id, kind: 'melody' });
      // A slow root–fourth–fifth–third cycle gives each phrase a stable harmonic home.
      if (i % mood.padEvery === 0) {
        const chordRoot = chordProgression[Math.floor(i / 8) % chordProgression.length] + variationShift;
        const padPitch = toneFromIndex(chordRoot, scale, -1);
        events.push({ id: `pad-${i}`, time, pitch: padPitch, duration: Math.min(5, secondsPerBeat * (s.mood === 'meditation' ? 5.5 : 4.1)), velocity: .19 * mood.velocity, depth: node.depth, pan: pan * .4, sourceNodeId: node.id, kind: 'pad' });
        if (['dreamy', 'meditation', 'ambient', 'nocturne', 'cinematic'].includes(s.mood)) {
          events.push({ id: `harm-${i}`, time: time + .09, pitch: toneFromIndex(chordRoot + 2, scale, -1), duration: Math.min(5, secondsPerBeat * 4.3), velocity: .12 * mood.velocity, depth: node.depth, pan: -pan * .35, sourceNodeId: node.id, kind: 'pad' });
        }
      }
      if (i % 12 === 0 && !['meditation', 'ambient', 'nocturne'].includes(s.mood)) {
        events.push({ id: `bass-${i}`, time, pitch: toneFromIndex(degree, scale, -2), duration: secondsPerBeat * 2.2, velocity: .18, depth: node.depth, pan: 0, sourceNodeId: node.id, kind: 'bass' });
      }
    }
    events.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
    const endOfNotes = Math.max(...events.map(e => e.time + e.duration));
    const duration = Math.min(95, endOfNotes + 2.0); // effect tail is part of export
    return { algorithm: scene.algorithm, seed: s.seed, events, duration, nodeCount: scene.totalNodes, noteCount: events.length, scale: s.scale, mood: s.mood };
  };
})(window.RS = window.RS || {});
