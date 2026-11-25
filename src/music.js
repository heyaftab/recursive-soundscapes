/* Algorithm-to-music mapping: a single immutable timeline feeds audio, visuals, and WAV. */
(function (RS) {
  'use strict';
  const SCALES = {
    pentatonic: { root: 60, steps: [0, 2, 4, 7, 9], name: 'C major pentatonic' },
    major: { root: 60, steps: [0, 2, 4, 5, 7, 9, 11], name: 'C major' },
    minor: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10], name: 'A natural minor' },
    dorian: { root: 62, steps: [0, 2, 3, 5, 7, 9, 10], name: 'D dorian' },
    lydian: { root: 65, steps: [0, 2, 4, 6, 7, 9, 11], name: 'F lydian' }
  };
  const MOODS = {
    calm: { name: 'Calm', waveform: 'sine', attack: .045, release: .8, noteFactor: .94, reverb: .20, delay: .07, brightness: 950, padEvery: 8, velocity: .80 },
    dreamy: { name: 'Dreamy', waveform: 'sine', attack: .012, release: 1.45, noteFactor: 1.17, reverb: .32, delay: .13, brightness: 1800, padEvery: 6, velocity: .75 },
    focus: { name: 'Deep Focus', waveform: 'triangle', attack: .02, release: .32, noteFactor: .62, reverb: .09, delay: .08, brightness: 1200, padEvery: 10, velocity: .76 },
    meditation: { name: 'Meditation', waveform: 'sine', attack: .24, release: 2.1, noteFactor: 1.55, reverb: .30, delay: .03, brightness: 720, padEvery: 5, velocity: .64 }
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

  RS.makeComposition = function (scene, s) {
    const scale = SCALES[s.scale] || SCALES.pentatonic;
    const mood = MOODS[s.mood] || MOODS.calm;
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
      let pitch = toneFromIndex(degree, scale, octave);
      pitch = RS.clamp(pitch, 45, 89);
      const variation = random();
      const rhythmicAccent = i % 8 === 3 ? .16 * secondsPerBeat : i % 8 === 7 ? .10 * secondsPerBeat : 0;
      const time = i * step + rhythmicAccent;
      const duration = Math.min(3.9, Math.max(.22, step * mood.noteFactor * (.88 + random() * .38)));
      const velocity = Math.min(.8, (.30 + .11 * variation + (i % 8 === 0 ? .085 : 0)) * mood.velocity);
      const pan = RS.clamp(node.pan || 0, -.85, .85);
      events.push({ id: `ev-${i}`, time, pitch, duration, velocity, depth: node.depth, pan, sourceNodeId: node.id, kind: 'melody' });
      // Additional voices are harmonically derived from the exact same recursive node.
      if (i % mood.padEvery === 0) {
        const padPitch = toneFromIndex(degree - 2, scale, -1);
        events.push({ id: `pad-${i}`, time, pitch: padPitch, duration: Math.min(5, secondsPerBeat * (s.mood === 'meditation' ? 5.5 : 4.1)), velocity: .19 * mood.velocity, depth: node.depth, pan: pan * .4, sourceNodeId: node.id, kind: 'pad' });
        if (s.mood === 'dreamy' || s.mood === 'meditation') {
          events.push({ id: `harm-${i}`, time: time + .09, pitch: toneFromIndex(degree + 2, scale, -1), duration: Math.min(5, secondsPerBeat * 4.3), velocity: .12 * mood.velocity, depth: node.depth, pan: -pan * .35, sourceNodeId: node.id, kind: 'pad' });
        }
      }
      if (i % 12 === 0 && s.mood !== 'meditation') {
        events.push({ id: `bass-${i}`, time, pitch: toneFromIndex(degree, scale, -2), duration: secondsPerBeat * 2.2, velocity: .18, depth: node.depth, pan: 0, sourceNodeId: node.id, kind: 'bass' });
      }
    }
    events.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
    const endOfNotes = Math.max(...events.map(e => e.time + e.duration));
    const duration = Math.min(95, endOfNotes + 2.0); // effect tail is part of export
    return { algorithm: scene.algorithm, seed: s.seed, events, duration, nodeCount: scene.totalNodes, noteCount: events.length, scale: s.scale, mood: s.mood };
  };
})(window.RS = window.RS || {});
