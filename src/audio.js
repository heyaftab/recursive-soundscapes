/* Shared Web Audio synthesis for both realtime playback and offline WAV export. */
(function (RS) {
  'use strict';
  const SUPPORTED = Boolean(window.AudioContext || window.webkitAudioContext) && Boolean(window.OfflineAudioContext || window.webkitOfflineAudioContext);
  RS.audioSupported = SUPPORTED;
  const midiFreq = midi => 440 * Math.pow(2, (midi - 69) / 12);

  function impulse(context, seconds = 1.75) {
    const rate = context.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = context.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      let seed = 1469 + channel * 613;
      const samples = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        samples[i] = ((seed / 2147483648) - 1) * Math.pow(1 - i / length, 2.7);
      }
    }
    return buffer;
  }

  function buildBus(context, settings, volume) {
    const mood = RS.moods[settings.mood] || RS.moods.calm;
    const input = context.createGain();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -13;
    limiter.knee.value = 13;
    limiter.ratio.value = 6;
    limiter.attack.value = .007;
    limiter.release.value = .18;
    const master = context.createGain();
    // Conservative headroom prevents clipping even on densely layered patterns.
    master.gain.value = RS.clamp(volume, 0, 100) / 100 * .57;
    input.connect(limiter);
    const reverbSend = context.createGain();
    reverbSend.gain.value = mood.reverb;
    const convolver = context.createConvolver();
    convolver.buffer = impulse(context);
    input.connect(reverbSend);
    reverbSend.connect(convolver);
    convolver.connect(limiter);
    const delaySend = context.createGain();
    delaySend.gain.value = mood.delay;
    const delay = context.createDelay(1.2);
    delay.delayTime.value = mood.delayTime || .345;
    const feedback = context.createGain();
    feedback.gain.value = mood.feedback ?? .17;
    input.connect(delaySend);
    delaySend.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(limiter);
    limiter.connect(master);
    master.connect(context.destination);
    return { input, master };
  }

  function renderNote(context, bus, event, settings, startAt, liveSources) {
    const mood = RS.moods[settings.mood] || RS.moods.calm;
    const voice = event.kind === 'pad' ? 'pad' : event.kind === 'bass' ? 'soft' : (event.voice || settings.instrument);
    const freq = midiFreq(event.pitch);
    const now = context.currentTime || 0;
    const at = Math.max(now + .001, startAt);
    const duration = Math.max(.12, event.duration);
    const release = event.release ?? (event.kind === 'bass' ? .36 : event.kind === 'pad' ? Math.max(1.25, mood.release) : mood.release);
    const attack = event.kind === 'pad' ? .36 : voice === 'pad' ? .22 : mood.attack;
    const sustain = Math.max(.04, duration - Math.min(duration * .5, attack));
    const stopAt = at + duration + release + .08;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.linearRampToValueAtTime(Math.max(.0002, event.velocity * .32), at + Math.min(attack, duration * .6));
    envelope.gain.setTargetAtTime(.0001, at + sustain, Math.max(.025, release / 4));
    envelope.gain.setValueAtTime(.0001, stopAt);
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    const cutoff = event.kind === 'bass' ? 400 : event.kind === 'pad' ? 900 : voice === 'bell' ? 3200 : voice === 'pluck' ? 2300 : mood.brightness;
    lowpass.frequency.setValueAtTime(cutoff, at);
    if (voice === 'pluck') lowpass.frequency.exponentialRampToValueAtTime(Math.max(260, cutoff * .35), Math.min(stopAt, at + .6));
    const panner = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
    if (panner.pan) panner.pan.value = event.pan;
    envelope.connect(lowpass);
    lowpass.connect(panner);
    panner.connect(bus.input);

    const oscs = [];
    const voices = voice === 'bell' ? [['sine', 1, .92], ['sine', 2.005, .11], ['triangle', 3.01, .065]] :
      voice === 'pad' ? [['triangle', 1, .55], ['sawtooth', .998, .16], ['sine', 2, .14]] :
      voice === 'pluck' ? [['triangle', 1, .65], ['sine', 2, .13]] :
      [['sine', 1, .8], ['triangle', 2, .13]];
    voices.forEach(([wave, ratio, mix]) => {
      const oscillator = context.createOscillator();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(freq * ratio, at);
      const partial = context.createGain();
      partial.gain.value = mix;
      oscillator.connect(partial);
      partial.connect(envelope);
      oscillator.start(at);
      oscillator.stop(stopAt + .05);
      if (liveSources) liveSources.push(oscillator);
      oscs.push(oscillator);
    });
    return oscs;
  }

  class AudioEngine {
    constructor(onTick, onEnded) {
      this.playToken = 0;
      this.context = null;
      this.timer = null;
      this.composition = null;
      this.settings = null;
      this.bus = null;
      this.sources = [];
      this.pointer = 0;
      this.offset = 0;
      this.startTime = 0;
      this.playing = false;
      this.loop = false;
      this.onTick = onTick;
      this.onEnded = onEnded;
    }
    async initialize() {
      if (!SUPPORTED) throw new Error('Web Audio is unavailable in this browser. Try an updated Chrome, Edge, Firefox, or Safari.');
      if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state !== 'running') await this.context.resume();
    }
    load(composition, settings) {
      this.stop(false);
      this.composition = composition;
      this.settings = { ...settings };
      this.offset = 0;
      this.onTick?.(0, null);
    }
    position() {
      if (!this.playing || !this.context) return this.offset;
      return Math.min(this.composition?.duration || 0, Math.max(0, this.context.currentTime - this.startTime));
    }
    getActiveEvent(position) {
      if (!this.composition) return null;
      // Find a recent melodic event; its node is the source of the audible note.
      for (let i = this.composition.events.length - 1; i >= 0; i--) {
        const e = this.composition.events[i];
        if (e.time > position || e.kind !== 'melody') continue;
        if (position < e.time + (e.moveDuration || Math.min(.8, Math.max(.22, e.duration)))) return e;
        return null;
      }
      return null;
    }
    async play() {
      if (!this.composition) throw new Error('Generate a composition before playing.');
      if (this.playing) return;
      const token=++this.playToken;
      await this.initialize();
      if(token!==this.playToken)return;
      if (this.offset >= this.composition.duration - .05) this.offset = 0;
      this.settings = { ...this.settings };
      this.bus = buildBus(this.context, this.settings, this.settings.volume);
      this.sources = [];
      this.startTime = this.context.currentTime - this.offset + .06;
      this.pointer = this.composition.events.findIndex(e => e.time >= this.offset - .002);
      if (this.pointer === -1) this.pointer = this.composition.events.length;
      this.playing = true;
      // Resume the audible portion of a note when seeking or pausing mid-event.
      if(this.offset>0)for(const event of this.composition.events){
        if(event.time<this.offset && event.time+event.duration>this.offset){
          renderNote(this.context,this.bus,{...event,duration:event.time+event.duration-this.offset},this.settings,this.startTime+this.offset,this.sources);
        }
      }
      this._tick();
      this.timer = window.setInterval(() => this._tick(), 30);
    }
    _tick() {
      if (!this.playing) return;
      const now = this.context.currentTime;
      const lookahead = .20;
      const events = this.composition.events;
      while (this.pointer < events.length && this.startTime + events[this.pointer].time <= now + lookahead) {
        const event = events[this.pointer++];
        if (this.startTime + event.time >= now - .025) {
          renderNote(this.context, this.bus, event, this.settings, this.startTime + event.time, this.sources);
        }
      }
      const pos = this.position();
      this.onTick?.(pos, this.getActiveEvent(pos));
      if (pos >= this.composition.duration - .02) {
        this.stop(false);
        this.onEnded?.();
        if (this.loop) {
          this.offset = 0;
          this.play().catch(err => this.onEnded?.(err));
        }
      }
    }
    _silence() {
      this.playToken++;
      if (this.timer) window.clearInterval(this.timer);
      this.timer = null;
      if (this.bus && this.context) {
        const now = this.context.currentTime;
        this.bus.master.gain.cancelScheduledValues(now);
        this.bus.master.gain.setTargetAtTime(0, now, .01);
      }
      this.sources.forEach(osc => { try { osc.stop(); } catch (_) { /* already stopped */ } });
      this.sources = [];
      this.bus = null;
    }
    pause() {
      if (!this.playing) return;
      this.offset = this.position();
      this.playing = false;
      this._silence();
      this.onTick?.(this.offset, null);
    }
    stop(notify = true) {
      this.playing = false;
      this._silence();
      this.offset = 0;
      if (notify) this.onTick?.(0, null);
    }
    seek(position) {
      const target = RS.clamp(position, 0, this.composition?.duration || 0);
      const playing = this.playing;
      this.pause();
      this.offset = target;
      this.onTick?.(target, this.getActiveEvent(target));
      if (playing) this.play().catch(err => this.onEnded?.(err));
    }
    setVolume(volume) {
      this.settings = { ...(this.settings || {}), volume };
      if (this.bus && this.context) this.bus.master.gain.setTargetAtTime(RS.clamp(volume, 0, 100) / 100 * .57, this.context.currentTime, .025);
    }
    dispose() {
      this.stop();
      if (this.context) { this.context.close().catch(() => {}); this.context = null; }
    }
  }
  RS.AudioEngine = AudioEngine;

  function encodeWav(buffer) {
    const channels = Math.min(2, buffer.numberOfChannels);
    const samples = buffer.length;
    const byteLength = 44 + samples * channels * 2;
    const view = new DataView(new ArrayBuffer(byteLength));
    const writeText = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
    writeText(0, 'RIFF');
    view.setUint32(4, byteLength - 8, true);
    writeText(8, 'WAVE');
    writeText(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeText(36, 'data');
    view.setUint32(40, byteLength - 44, true);
    const channelData = Array.from({ length: channels }, (_, ch) => buffer.getChannelData(ch));
    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let ch = 0; ch < channels; ch++) {
        const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([view.buffer], { type: 'audio/wav' });
  }

  RS.exportWav = async function (composition, settings, onStatus) {
    if (!SUPPORTED) throw new Error('Offline audio rendering is not available in this browser.');
    const sampleRate = 44100;
    const frameCount = Math.ceil(composition.duration * sampleRate);
    onStatus?.('Preparing offline audio...');
    // The render is deterministic and uses precisely the same musical events and sound graph as playback.
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const context = new Offline(2, frameCount, sampleRate);
    const bus = buildBus(context, settings, settings.volume);
    composition.events.forEach(event => renderNote(context, bus, event, settings, event.time + .025, null));
    onStatus?.('Rendering your WAV...');
    const buffer = await context.startRendering();
    onStatus?.('Encoding WAV...');
    return encodeWav(buffer);
  };
})(window.RS = window.RS || {});
