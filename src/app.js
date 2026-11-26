/* UI controller: one composition event timeline is the sole source for sound and visuals. */
(function (RS) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { ...RS.defaults, variationIndex: 0 };
  let scene = null;
  let composition = null;
  let exporting = false;
  let toastTimer = null;
  const stage = new RS.VisualStage($('visualCanvas'));
  const audio = new RS.AudioEngine((position, event) => {
    stage.setActive(event?.sourceNodeId || null);
    stage.setPosition(position);
    updateAlgorithmProgress(position);
    updateTransport();
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
  function setTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
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
      if (newVariation) toast('New recursive variation generated.');
    } catch (error) {
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
    writeSlider(id, id === 'branchAngle' ? '°' : id === 'branchLength' || id === 'volume' ? '%' : '');
    $(id).addEventListener('input', () => {
      writeSlider(id, id === 'branchAngle' ? '°' : id === 'branchLength' || id === 'volume' ? '%' : '');
      if (id === 'volume') audio.setVolume(state.volume);
    });
    if (id !== 'volume') $(id).addEventListener('change', () => generate());
  });
  ['kochMode'].forEach(id => $(id).addEventListener('change', () => { state[id] = $(id).value; generate(); }));
  $('generateButton').addEventListener('click', () => generate(true));
  $('themeButton').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  setTheme('dark');
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
