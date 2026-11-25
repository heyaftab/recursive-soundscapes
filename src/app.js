/* UI controller: one composition event timeline is the sole source for sound and visuals. */
(function (RS) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { ...RS.defaults };
  let scene = null;
  let composition = null;
  let exporting = false;
  let toastTimer = null;
  const stage = new RS.VisualStage($('visualCanvas'));
  const audio = new RS.AudioEngine((position, event) => {
    stage.setActive(event?.sourceNodeId || null);
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

  function toast(message, isError = false) {
    const node = $('toast');
    node.textContent = message;
    node.className = `toast visible ${isError ? 'error' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('visible'), 3400);
  }
  function setTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    $('themeButton').setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    $('themeButton').setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    $('moonIcon').hidden = !isDark;
    $('sunIcon').hidden = isDark;
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
  }
  function writeSlider(id, suffix = '') {
    const node = $(id);
    const val = Number(node.value);
    const valueNode = $(id + 'Value');
    if (valueNode) valueNode.textContent = id === 'density' ? `${val} / 10` : id === 'tempo' ? `${val} BPM` : `${val}${suffix}`;
    node.style.setProperty('--range-fill', `${100 * (val - Number(node.min)) / (Number(node.max) - Number(node.min))}%`);
    state[id] = val;
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
      if (newVariation) state.seed += 137 + Math.floor(Math.random() * 997);
      const result = RS.generateScene(state);
      const music = RS.makeComposition(result, state);
      scene = result;
      composition = music;
      audio.load(composition, state);
      stage.setScene(scene);
      updateTransport();
      const info = RS.algorithmInfo[state.algorithm];
      $('vizTitle').textContent = info.title;
      $('vizSubtitle').textContent = info.subtitle;
      $('figureNumber').textContent = info.figure;
      $('recursionDescription').textContent = info.description;
      $('mappingDescription').textContent = info.mapping;
      $('mappingTag1').textContent = info.tags[0];
      $('mappingTag2').textContent = info.tags[1];
      $('nodeCount').textContent = music.nodeCount.toLocaleString();
      $('eventCount').textContent = music.noteCount.toLocaleString();
      $('lengthMetric').textContent = RS.formatTime(music.duration);
      $('duration').textContent = RS.formatTime(music.duration);
      $('trackTitle').textContent = `${state.algorithm === 'tree' ? 'Recursive Tree' : state.algorithm === 'sierpinski' ? 'Sierpinski' : 'Fibonacci'} in ${RS.moods[state.mood].name}`;
      $('trackSubtitle').textContent = `${RS.scales[state.scale].name} · ${music.noteCount} musical events`;
      $('treeControls').hidden = state.algorithm !== 'tree';
      selectOptions('[data-algorithm]', 'algorithm', state.algorithm);
      selectOptions('[data-mood]', 'mood', state.mood);
      $('loopButton').setAttribute('aria-pressed', String(audio.loop));
      $('loopButton').classList.toggle('active', audio.loop);
      $('generateButton').classList.remove('generating');
      if (newVariation) toast('New recursive variation generated.');
    } catch (error) {
      toast(`Could not generate: ${error.message}`, true);
      console.error(error);
    }
  }

  document.querySelectorAll('[data-algorithm]').forEach(button => button.addEventListener('click', () => {
    if (state.algorithm === button.dataset.algorithm) return;
    state.algorithm = button.dataset.algorithm;
    generate();
    toast(`${RS.algorithmInfo[state.algorithm].title} selected.`);
  }));
  document.querySelectorAll('[data-mood]').forEach(button => button.addEventListener('click', () => {
    if (state.mood === button.dataset.mood) return;
    state.mood = button.dataset.mood;
    generate(); // mood change takes effect without requiring a different algorithm
    toast(`${RS.moods[state.mood].name} soundscape selected.`);
  }));
  ['depth', 'tempo', 'density', 'branchAngle', 'branchLength', 'volume'].forEach(id => {
    writeSlider(id, id === 'branchAngle' ? '°' : id === 'branchLength' || id === 'volume' ? '%' : '');
    $(id).addEventListener('input', () => {
      writeSlider(id, id === 'branchAngle' ? '°' : id === 'branchLength' || id === 'volume' ? '%' : '');
      if (id === 'volume') audio.setVolume(state.volume);
    });
    if (id !== 'volume') $(id).addEventListener('change', () => generate());
  });
  ['scale', 'instrument'].forEach(id => $(id).addEventListener('change', () => { state[id] = $(id).value; generate(); }));
  $('generateButton').addEventListener('click', () => generate(true));
  $('themeButton').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  setTheme('light');
  $('reducedMotion').checked = stage.reducedMotion;
  $('reducedMotion').addEventListener('change', () => stage.setReducedMotion($('reducedMotion').checked));
  $('loopButton').addEventListener('click', () => { audio.loop = !audio.loop; $('loopButton').setAttribute('aria-pressed', String(audio.loop)); $('loopButton').classList.toggle('active', audio.loop); toast(audio.loop ? 'Loop enabled.' : 'Loop disabled.'); });
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
