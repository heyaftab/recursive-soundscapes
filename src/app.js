/* UI controller: one composition event timeline is the sole source for sound and visuals. */
(function (RS) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { ...RS.defaults, variationIndex: 0 };
  const settingsKey = 'recursive-soundscapes-settings';
  let savedLoop = false;
  function restoreSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey) || 'null');
      if (!saved || typeof saved !== 'object') return;
      const choices = {
        algorithm: Object.keys(RS.algorithmInfo), mood: Object.keys(RS.moods),
        instrument: [...document.querySelectorAll('[data-instrument]')].map(item => item.dataset.instrument),
        scale: Object.keys(RS.scales), kochMode: [...$('kochMode').options].map(option => option.value)
      };
      for (const [key, values] of Object.entries(choices)) if (values.includes(saved[key])) state[key] = saved[key];
      const ranges = { depth: [1, 8], disks: [1, 8], tempo: [40, 160], density: [1, 10], branchAngle: [16, 50], branchLength: [60, 80], volume: [0, 100], seed: [0, 2147483647], variationIndex: [0, 2147483647] };
      for (const [key, [min, max]] of Object.entries(ranges)) {
        const value = Number(saved[key]);
        if (Number.isFinite(value)) state[key] = Math.round(RS.clamp(value, min, max));
      }
      if (state.algorithm === 'koch') state.depth = Math.min(state.depth, 5);
      savedLoop = saved.loop === true;
      if (typeof saved.reducedMotion === 'boolean') state.reducedMotion = saved.reducedMotion;
    } catch (_) { /* Use defaults when storage is unavailable or malformed. */ }
  }
  restoreSettings();
  let scene = null;
  let composition = null;
  let exporting = false;
  let toastTimer = null;
  let relaxationTimer = null;
  let relaxationPlayPending = false;
  const stage = new RS.VisualStage($('visualCanvas'));
  const audio = new RS.AudioEngine((position, event) => {
    stage.setActive(event?.sourceNodeId || null);
    stage.setPosition(position);
    updateAlgorithmProgress(position);
    updateTransport();
    syncRelaxation(event);
    $('elapsed').textContent = RS.formatTime(position);
    $('timeline').value = composition?.duration ? Math.round(position / composition.duration * 1000) : 0;
    $('timeline').style.setProperty('--range-fill', `${composition?.duration ? position / composition.duration * 100 : 0}%`);
    if (event) {
      $('activeNoteLabel').textContent = 'NOW RESONATING';
      $('activeNoteText').textContent = `${RS.noteName(event.pitch)} · ${event.sourceNodeId.replace(/^\w-/, '#')}`;
      $('activeNote').classList.add('active');
    } else {
      $('activeNoteLabel').textContent = audio.playing ? 'LISTEN TO THE PATTERN' : 'AWAITING YOUR PLAY';
      $('activeNoteText').textContent = audio.playing ? 'Following the recursive structure' : 'C · ready to resonate';
      $('activeNote').classList.remove('active');
    }
  }, (error) => {
    updateTransport();
    if (error) toast(error.message, true);
    else if (!audio.loop) toast('Your composition has finished playing.');
  });
  audio.loop = savedLoop;

  function persistSettings() {
    try { localStorage.setItem(settingsKey, JSON.stringify({ ...state, loop: audio.loop, reducedMotion: stage.reducedMotion })); } catch (_) { /* Storage may be disabled or full. */ }
  }

  function updateAlgorithmProgress(position) {
    if(!scene || !composition)return;
    const node=$('algorithmProgress');
    node.hidden=!['koch','hanoi'].includes(scene.algorithm);
    if(scene.algorithm==='hanoi'){
      const moves=composition.events.filter(e=>e.kind==='melody');
      const event=moves.filter(e=>e.time<=position).at(-1);
      const move=event?scene.moves.find(m=>m.id===event.sourceNodeId):null;
      const finished=position >= moves.at(-1).time+moves.at(-1).moveDuration;
      node.textContent=(finished?'Complete \u00b7 ':'')+'Move '+(event?move.index+1:0)+' / '+scene.moves.length+' \u00b7 '+(move?['Left','Middle','Right'][move.from]+' \u2192 '+['Left','Middle','Right'][move.to]:'Left \u2192 Right')+' \u00b7 Recursion depth '+(move?.depth||0);
    }
    if(scene.algorithm==='koch'){
      const iteration=composition.iterations.filter(i=>i.time<=position).at(-1)||composition.iterations[0];
      node.textContent='Iteration '+iteration.depth+' / '+scene.depth+' \u00b7 '+scene.levels[iteration.depth].length.toLocaleString()+' segments \u00b7 '+(scene.mode==='curve'?'Curve':'Snowflake');
    }
  }
  function toast(message, isError = false) {
    const node = $('toast');
    node.textContent = message;
    node.className = `toast visible ${isError ? 'error' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('visible'), 3400);
  }
  function setStudioStatus(stateName) {
    const status = $('studioStatus');
    const label = stateName === 'ready' ? 'STUDIO ONLINE' : stateName === 'unavailable' ? 'AUDIO UNAVAILABLE' : 'STUDIO ERROR';
    status.dataset.status = stateName;
    status.setAttribute('aria-label', label.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()));
    status.querySelector('span').textContent = label;
  }
  function setTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    try { localStorage.setItem('recursive-soundscapes-theme', isDark ? 'dark' : 'light'); } catch (_) { /* Storage may be disabled. */ }
    $('themeButton').setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    $('themeButton').setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    $('moonIcon').toggleAttribute('hidden', !isDark);
    $('sunIcon').toggleAttribute('hidden', isDark);
    document.querySelector('meta[name="theme-color"]').content = isDark ? '#090b16' : '#f6f8fc';
    stage.setTheme(theme);
  }
  function updateTransport() {
    const playing = audio.playing;
    $('playIcon').hidden = playing;
    $('pauseIcon').hidden = !playing;
    $('playButton').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    $('playButton').setAttribute('title', playing ? 'Pause' : 'Play');
    $('playingEyebrow').textContent = playing ? 'NOW PLAYING' : 'YOUR COMPOSITION';
    document.body.classList.toggle('is-playing', playing);
    stage.setPlaying(playing);
    setRelaxPlayState(playing);
  }
  function setRelaxPlayState(playing) {
    const button = $('relaxPlayButton');
    button.dataset.playbackState = playing ? 'playing' : 'paused';
    button.setAttribute('aria-label', playing ? 'Pause playback' : 'Play playback');
    button.setAttribute('title', playing ? 'Pause playback' : 'Play playback');
    button.setAttribute('aria-pressed', String(playing));
  }
  function syncRelaxation(event) {
    $('relaxTrackTitle').textContent = $('trackTitle').textContent;
    $('relaxTrackDetail').textContent = audio.playing
      ? event ? `${RS.noteName(event.pitch)} · ${event.sourceNodeId.replace(/^\w-/, '#')} · following the recursive shape` : 'Following the recursive shape'
      : audio.position() > 0 ? 'Paused · press play to continue' : 'Ready · press play to begin';
    $('relaxVolume').value = state.volume;
    $('relaxVolumeValue').textContent = `${state.volume}%`;
  }
  function resetRelaxationFade() {
    const controls = $('relaxationControls');
    if (controls.hidden || !document.body.classList.contains('immersive-mode')) return;
    controls.classList.remove('is-faded');
    clearTimeout(relaxationTimer);
    if (controls.contains(document.activeElement)) return;
    relaxationTimer = window.setTimeout(() => {
      if (!controls.contains(document.activeElement) && document.body.classList.contains('immersive-mode')) controls.classList.add('is-faded');
    }, 4500);
  }
  function enterRelaxation() {
    document.body.classList.add('immersive-mode');
    stage.setImmersive(true);
    $('relaxationControls').hidden = false;
    $('relaxButton').setAttribute('aria-pressed', 'true');
    $('relaxButton').setAttribute('aria-label', 'Exit Bloom mode');
    $('relaxButton').setAttribute('title', 'Exit Bloom mode');
    updateTransport();
    syncRelaxation(audio.getActiveEvent(audio.position()));
    resetRelaxationFade();
  }
  function exitRelaxation(exitFullscreen = true) {
    clearTimeout(relaxationTimer);
    document.body.classList.remove('immersive-mode');
    stage.setImmersive(false);
    $('relaxationControls').hidden = true;
    $('relaxationControls').classList.remove('is-faded');
    $('relaxButton').setAttribute('aria-pressed', 'false');
    $('relaxButton').setAttribute('aria-label', 'Enter Bloom mode');
    $('relaxButton').setAttribute('title', 'Enter Bloom mode');
    if (exitFullscreen && (document.fullscreenElement || document.webkitFullscreenElement)) {
      const leaveFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
      leaveFullscreen?.call(document);
    }
  }
  function writeSlider(id, suffix = '') {
    const node = id === 'volume' ? $('playerVolume') : $(id);
    const val = Number(node.value);
    const valueNode = id === 'volume' ? $('playerVolumeValue') : $(id + 'Value');
    if (valueNode) valueNode.textContent = id === 'density' ? `${val} / 10` : id === 'tempo' ? `${val} BPM` : `${val}${suffix}`;
    node.style.setProperty('--range-fill', `${100 * (val - Number(node.min)) / (Number(node.max) - Number(node.min))}%`);
    state[id] = val;
    if (id === 'volume') syncPlayerVolume();
  }
  function syncPlayerVolume() {
    const slider = $('playerVolume');
    if (!slider) return;
    slider.value = state.volume;
    slider.style.setProperty('--range-fill', `${state.volume}%`);
    const output = $('playerVolumeValue');
    if (output) output.textContent = `${state.volume}%`;
  }
  function selectOptions(selector, attribute, value) {
    document.querySelectorAll(selector).forEach(node => {
      const active = node.dataset[attribute] === value;
      node.classList.toggle('selected', active);
      node.setAttribute('aria-checked', String(active));
    });
  }
  function generate(newVariation = false) {
    try {
      if (newVariation) {
        state.variationIndex += 1;
        state.seed += 137 + Math.floor(Math.random() * 997);
      }
      const result = RS.generateScene(state);
      const music = RS.makeComposition(result, state);
      scene = result;
      composition = music;
      audio.load(composition, state);
      stage.setScene(scene, composition);
      updateTransport();
      const info = RS.algorithmInfo[state.algorithm];
      $('figureNumber').textContent = info.figure;
      $('recursionDescription').textContent = info.description;
      $('mappingDescription').textContent = info.mapping;
      $('mappingTag1').textContent = info.tags[0];
      $('mappingTag2').textContent = info.tags[1];
      $('nodeCount').textContent = music.nodeCount.toLocaleString();
      $('eventCount').textContent = music.noteCount.toLocaleString();
      $('lengthMetric').textContent = RS.formatTime(music.duration);
      $('duration').textContent = RS.formatTime(music.duration);
      $('trackTitle').textContent = `${info.title} in ${RS.moods[state.mood].name}`;
      $('trackSubtitle').textContent = `${RS.scales[state.scale].name} · ${music.noteCount} musical events`;
      $('depth').closest('.control-group').hidden = state.algorithm === 'hanoi';
      $('hanoiControls').hidden = state.algorithm !== 'hanoi';
      $('moveFormula').textContent = 'Minimum moves: 2^'+state.disks+' \u2212 1 = '+(2**state.disks-1);
      $('kochControls').hidden = state.algorithm !== 'koch';
      $('depth').max = state.algorithm === 'koch' ? 5 : 8;
      updateAlgorithmProgress(0);
      $('treeControls').hidden = state.algorithm !== 'tree';
      selectOptions('[data-algorithm]', 'algorithm', state.algorithm);
      selectOptions('[data-mood]', 'mood', state.mood);
      selectOptions('[data-instrument]', 'instrument', state.instrument);
      selectOptions('[data-scale]', 'scale', state.scale);
      $('loopButton').setAttribute('aria-pressed', String(audio.loop));
      $('loopButton').classList.toggle('active', audio.loop);
      $('generateButton').classList.remove('generating');
      setStudioStatus(RS.audioSupported ? 'ready' : 'unavailable');
      persistSettings();
      if (newVariation) toast('New recursive variation generated.');
    } catch (error) {
      if ($('studioStatus').dataset.status === 'loading') setStudioStatus('error');
      toast(`Could not generate: ${error.message}`, true);
      console.error(error);
    }
  }

  document.querySelectorAll('[data-algorithm]').forEach(button => button.addEventListener('click', () => {
    if (state.algorithm === button.dataset.algorithm) return;
    state.algorithm = button.dataset.algorithm;
    state.depth = Math.min(state.depth,state.algorithm==='koch'?5:8);
    $('depth').value=state.depth;
    $('depth').max=state.algorithm==='koch'?5:8;
    writeSlider('depth');
    generate();
    toast(`${RS.algorithmInfo[state.algorithm].title} selected.`);
  }));
  document.querySelectorAll('[data-mood]').forEach(button => button.addEventListener('click', () => {
    if (state.mood === button.dataset.mood) return;
    state.mood = button.dataset.mood;
    generate(); // mood change takes effect without requiring a different algorithm
    toast(`${RS.moods[state.mood].name} soundscape selected.`);
  }));
  document.querySelectorAll('[data-instrument]').forEach(button => button.addEventListener('click', () => {
    if (state.instrument === button.dataset.instrument) return;
    state.instrument = button.dataset.instrument;
    generate();
    toast(`${button.querySelector('strong').textContent} selected.`);
  }));
  document.querySelectorAll('[data-scale]').forEach(button => button.addEventListener('click', () => {
    if (state.scale === button.dataset.scale) return;
    state.scale = button.dataset.scale;
    generate();
    toast(`${RS.scales[state.scale].name} selected.`);
  }));
  function setupScrollIndicator(container, track) {
    const thumb = track.querySelector('span');
    function update() {
      const maxScroll = container.scrollHeight - container.clientHeight;
      const size = container.scrollHeight ? Math.min(100, container.clientHeight / container.scrollHeight * 100) : 100;
      thumb.style.height = size + '%';
      thumb.style.top = (maxScroll > 0 ? container.scrollTop / maxScroll * (track.clientHeight - thumb.offsetHeight) : 0) + 'px';
      track.hidden = maxScroll <= 0;
      track.setAttribute('aria-valuenow', String(maxScroll > 0 ? Math.round(container.scrollTop / maxScroll * 100) : 0));
    }
    container.addEventListener('scroll', update, { passive: true });
    track.addEventListener('pointerdown', event => {
      const rect = track.getBoundingClientRect();
      container.scrollTop = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) * (container.scrollHeight - container.clientHeight);
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener('pointermove', event => {
      if (!track.hasPointerCapture(event.pointerId)) return;
      const rect = track.getBoundingClientRect();
      container.scrollTop = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) * (container.scrollHeight - container.clientHeight);
    });
    track.addEventListener('keydown', event => {
      const step = event.key === 'PageDown' || event.key === 'PageUp' ? container.clientHeight : 45;
      if (event.key === 'ArrowDown' || event.key === 'PageDown') container.scrollTop += step;
      else if (event.key === 'ArrowUp' || event.key === 'PageUp') container.scrollTop -= step;
      else return;
      event.preventDefault();
    });
    window.addEventListener('resize', update);
    requestAnimationFrame(update);
  }
  setupScrollIndicator(document.getElementById('moodGrid'), document.querySelector('.mood-scrollbar'));
  setupScrollIndicator(document.getElementById('algorithmOptions'), document.querySelector('.algorithm-scrollbar'));
  setupScrollIndicator(document.getElementById('instrumentOptions'), document.querySelector('.instrument-scrollbar'));
  setupScrollIndicator(document.getElementById('scaleOptions'), document.querySelector('.scale-scrollbar'));
  ['depth', 'disks', 'tempo', 'density', 'branchAngle', 'branchLength', 'volume'].forEach(id => {
    const slider = id === 'volume' ? $('playerVolume') : $(id);
    slider.value = state[id];
    writeSlider(id, id === 'branchAngle' ? '°' : id === 'branchLength' || id === 'volume' ? '%' : '');
    slider.addEventListener('input', () => {
      writeSlider(id, id === 'branchAngle' ? '°' : id === 'branchLength' || id === 'volume' ? '%' : '');
      if (id === 'volume') { audio.setVolume(state.volume); syncRelaxation(audio.getActiveEvent(audio.position())); persistSettings(); }
    });
    if (id !== 'volume') slider.addEventListener('change', () => generate());
  });
  $('kochMode').value = state.kochMode;
  ['kochMode'].forEach(id => $(id).addEventListener('change', () => { state[id] = $(id).value; generate(); }));
  $('generateButton').addEventListener('click', () => generate(true));
  $('resetButton').addEventListener('click', () => {
    Object.assign(state, RS.defaults, { variationIndex: 0 });
    audio.loop = false;
    setTheme('dark');
    stage.setReducedMotion(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false);
    $('reducedMotion').checked = stage.reducedMotion;
    for (const id of ['depth', 'disks', 'tempo', 'density', 'branchAngle', 'branchLength', 'volume']) {
      (id === 'volume' ? $('playerVolume') : $(id)).value = state[id];
      writeSlider(id, id === 'branchAngle' ? '°' : id === 'branchLength' || id === 'volume' ? '%' : '');
    }
    $('kochMode').value = state.kochMode;
    generate();
    toast('Studio settings reset to defaults.');
  });
  $('themeButton').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  $('relaxButton').addEventListener('click', () => {
    if (document.body.classList.contains('immersive-mode')) { exitRelaxation(); return; }
    if (audio.playing) audio.pause();
    enterRelaxation();
  });
  $('exitRelaxation').addEventListener('click', () => exitRelaxation());
  $('relaxPlayButton').addEventListener('click', async () => {
    if (relaxationPlayPending) return;
    if (audio.playing) {
      audio.pause();
      updateTransport();
      syncRelaxation(null);
      resetRelaxationFade();
      return;
    }
    relaxationPlayPending = true;
    $('relaxPlayButton').disabled = true;
    $('relaxTrackDetail').textContent = 'Starting playback…';
    try {
      await audio.play();
    } catch (error) {
      toast(error.message || 'Could not start playback.', true);
    } finally {
      relaxationPlayPending = false;
      $('relaxPlayButton').disabled = false;
      updateTransport();
      syncRelaxation(audio.getActiveEvent(audio.position()));
      resetRelaxationFade();
    }
  });
  $('relaxVolume').addEventListener('input', () => {
    $('playerVolume').value = $('relaxVolume').value;
    writeSlider('volume', '%');
    audio.setVolume(state.volume);
    syncRelaxation(audio.getActiveEvent(audio.position()));
    resetRelaxationFade();
  });
  $('relaxationControls').addEventListener('pointermove', resetRelaxationFade, { passive: true });
  $('relaxationControls').addEventListener('touchstart', resetRelaxationFade, { passive: true });
  $('relaxationControls').addEventListener('focusin', () => {
    clearTimeout(relaxationTimer);
    $('relaxationControls').classList.remove('is-faded');
  });
  $('relaxationControls').addEventListener('focusout', () => window.setTimeout(resetRelaxationFade, 0));
  document.addEventListener('pointermove', resetRelaxationFade, { passive: true });
  let savedTheme = 'dark';
  try {
    const storedTheme = localStorage.getItem('recursive-soundscapes-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') savedTheme = storedTheme;
  } catch (_) { /* Keep the default theme when storage is unavailable. */ }
  setTheme(savedTheme);
  if (typeof state.reducedMotion === 'boolean') stage.setReducedMotion(state.reducedMotion);
  $('reducedMotion').checked = stage.reducedMotion;
  $('reducedMotion').addEventListener('change', () => { stage.setReducedMotion($('reducedMotion').checked); persistSettings(); });
  $('loopButton').addEventListener('click', () => { audio.loop = !audio.loop; $('loopButton').setAttribute('aria-pressed', String(audio.loop)); $('loopButton').classList.toggle('active', audio.loop); persistSettings(); toast(audio.loop ? 'Loop enabled.' : 'Loop disabled.'); });
  $('playButton').addEventListener('click', async () => {
    try {
      if (audio.playing) audio.pause(); else await audio.play();
      updateTransport();
    } catch (error) { updateTransport(); toast(error.message || 'Could not start audio.', true); }
  });
  $('stopButton').addEventListener('click', () => { audio.stop(); updateTransport(); });
  $('timeline').addEventListener('input', () => {
    if (!composition) return;
    audio.seek(Number($('timeline').value) / 1000 * composition.duration);
    updateTransport();
  });
  $('exportButton').addEventListener('click', async () => {
    if (exporting || !composition) return;
    exporting = true;
    const button = $('exportButton');
    button.disabled = true;
    button.classList.add('exporting');
    const label = $('exportLabel');
    const snapshot = { ...state };
    const currentComposition = composition;
    try {
      const blob = await RS.exportWav(currentComposition, snapshot, message => { label.textContent = message; });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recursive-soundscapes-${currentComposition.algorithm}-${currentComposition.seed}.wav`;
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast(`WAV exported successfully (${(blob.size / 1024 / 1024).toFixed(1)} MB).`);
    } catch (error) {
      console.error('WAV export failed', error);
      toast(`WAV export failed: ${error.message}`, true);
    } finally {
      exporting = false; button.disabled = false; button.classList.remove('exporting'); label.textContent = 'Export WAV';
    }
  });

  const help = $('helpDialog');
  $('helpButton').addEventListener('click', () => help.showModal());
  $('closeHelp').addEventListener('click', () => help.close());
  $('dialogStart').addEventListener('click', () => help.close());
  help.addEventListener('click', e => { if (e.target === help) help.close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('immersive-mode')) {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      event.preventDefault();
      exitRelaxation();
      return;
    }
    if (document.body.classList.contains('immersive-mode')) resetRelaxationFade();
    if (event.code === 'Space' && !['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !help.open) {
      event.preventDefault(); $('playButton').click();
    }
  });
  window.addEventListener('pagehide', () => { audio.dispose(); stage.destroy(); });
  if (!RS.audioSupported) {
    toast('Your browser cannot synthesize audio. Use an updated browser with Web Audio support.', true);
    $('playButton').disabled = true; $('exportButton').disabled = true;
  }
  generate();
})(window.RS = window.RS || {});
