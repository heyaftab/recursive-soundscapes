# Testing and acceptance checklist

## Automated sanity checks

- [x] All JavaScript modules pass `node --check`.
- [x] The main page loads in Chromium without JavaScript exceptions.
- [x] Five recursive scenes generate nonempty and bounded node lists.
- [x] Each scene maps to finite, correctly shaped musical events.
- [x] Music events use IDs found in the scene.
- [x] Generated pitches belong to the selected scale.
- [x] WAV export produces a playable RIFF/WAVE file.

## Manual tests for hackathon demo

1. Open `index.html` (no server required); confirm visual stage and default Fibonacci structure are visible.
2. Click Play, listen, and confirm active notes highlight corresponding shapes.
3. Pause, resume, Stop, and seek along the timeline.
4. Select each algorithm and confirm that visuals and sound structure change.
5. Try depths 1 and 8, tempos 40 and 160, and densities 1 and 10.
6. Try all eight atmospheres (Calm, Dreamy, Deep Focus, Meditation, Ambient Drift, Nocturne, Cinematic, and Pulse) and all eight instrument voices.
7. Change the scale and verify pitches remain tonal.
8. Set volume to 0; confirm sound is silent. Restore volume.
9. Export WAV; check it opens in an audio player and contains audible notes.
10. Resize to tablet/mobile, use keyboard navigation, and enable Reduced Motion.
11. Change configuration during playback and verify no old playback session remains active.
12. Start playback and enter Bloom mode; confirm the composition continues, the canvas expands, and the minimal controls fade and return on pointer or keyboard activity.
13. Adjust volume, pause/resume, enter/exit full screen, then exit Bloom mode with Escape; verify the normal studio controls return.

## Browser and operating conditions

Chrome, Edge and Firefox on desktop are suggested for the live demo. Audio permissions and user interaction are required by browser policy. Headphones recommended.

## Architecture-specific invariants

- Active-node highlights use `MusicEvent.sourceNodeId`, never a separate visual timeline.
- Both live and offline synthesis call the same `renderNote()` and `buildBus()` functions.
- Original algorithms keep depth 8, 10,000 nodes, 105 melody notes, and 95-second limits. New algorithms use Koch depth 5 / Hanoi 8 disks, fewer than 400 total events, below 200 seconds, and at most 12 overlapping note voices.
- Initial browser load does not initialize or play the audio context.


## Verified results (November 25, 2026)

- **Syntax:** all five JavaScript files passed `node --check`.
- **Algorithms/music:** `node tests/verify.cjs` passed 135 combinations across 3 algorithms, 3 depth values, 3 density values, and 5 scales, validating node identity, finite timing, pan limits, bounded events, and in-scale pitches.
- **Chromium smoke test:** initial page rendered with no JavaScript exceptions. Switched all three algorithms, changed a sound mood, and toggled Play/Pause successfully.
- **High-depth stress test:** Sierpinski and three-way Tree both generated 9,841 nodes at depth 8 without browser exceptions.
- **Responsive:** mobile Chromium viewport 390px showed no horizontal overflow (`scrollWidth == innerWidth`).
- **WAV export:** Chromium generated a RIFF/WAVE file, decoded with Python's `wave` module as 2-channel, 44,100-Hz, 16-bit audio, with nonzero signal (peak ≈ 0.10, RMS ≈ 0.023) and no clipped samples for the tested short composition.
- **Test environment note:** The sandbox's Chromium blocks navigation to `file://` and `localhost` by administrator policy, so the in-container browser tests injected the same HTML/CSS/JS contents into a Chromium page. This does not indicate ordinary browsers block opening `index.html`; direct file-opening on the user's machine has not been separately verified here.

**Still recommended manually:** listen to each atmosphere with all eight instrument voices using headphones, export a long composition, and check the target demo laptop/browser before submission.


## Extension verification (2026-11-26)

- node tests/verify.cjs: PASS, 135 original algorithm/scale/depth/density regressions.
- node tests/extensions.cjs: PASS, 2,520 new combinations across minimum/default/maximum Koch depths, all Hanoi disk counts, tempos 40/80/160, densities 1/4/10, all five scales, and all four moods.
- Geometry: every Koch level has 4^N or 3*4^N segments, continuous endpoints and expected 1/3 length ratios. Normalized coordinates fit the stage. Each iteration opens with its melody and a quieter note in each earlier octave.
- Hanoi: independent peg replay validates every move, before/after snapshots, top-disk source, legal destination, final right-peg stack, 2^N-1 count, and exactly one note event per move. Three disks yield seven legal moves and seven notes. Every note pans by destination peg.
- Events: unique IDs, valid source references, finite time/pitch/duration/depth/velocity/pan, selected-scale notes, safe register, deterministic regeneration for a fixed seed, bounded total duration, and no more than 12 simultaneous note voices including release.
- Chromium: all five choices load without console exceptions. Verified Koch curve/snowflake counts at depth 5, Hanoi eight-disk count, contextual controls, Play/Pause/Resume, seek, Stop reset, regenerate while playing, algorithm switching, completion text, loop restart and player-state synchronization.
- Responsive: 390x844 viewport has no horizontal overflow. Captured desktop and full-page mobile screenshots of both new algorithms; checked dark styling, geometry fit, disks, and status. Reduced-motion setting tested.
- Export: the actual Export WAV button produces a downloaded RIFF file. Thirty-two offline renders (Koch and Hanoi in all four moods and all four instruments) produce stereo, 44,100-Hz, 16-bit WAVs with nonzero signal, peak below 0.11, and no clipped samples for these short test compositions.

### Browser test setup

The app needs no installation. Browser tests require Playwright and Google Chrome. Install Playwright in an external tooling folder, then set PLAYWRIGHT_MODULE to the absolute module path if it is not otherwise resolvable. CHROME_PATH optionally overrides the Windows Chrome executable. The implementation session used an isolated temporary tooling folder named recursive-soundscapes-verification. The suite starts a temporary localhost static server and closes it after verification; no backend is introduced into the app.

### Manual listening check

Automated checks validate audio content and signal bounds, not artistic listening quality. Listen with headphones at a comfortable volume to compare layering, disk-size melody, all instruments, and the full eight-disk resolution.

Final edge checks: zero-volume export is digitally silent; Stop invalidates a pending asynchronous audio start. Koch normalized endpoint lengths preserve the equilateral construction without aspect distortion.

## Verification (2026-11-26)

- `node tests/verify.cjs`: PASS, 243 algorithm/scale/depth/density combinations.
- `node tests/extensions.cjs`: PASS, 9,072 Koch/Hanoi geometry and composition combinations, including deterministic events, legal Hanoi moves, bounded duration/polyphony, and scale-safe pitches.
- `node --check` passed for `app.js`, `audio.js`, `music.js`, and `visualization.js`.
- Browser automation could not start in this environment: `tests/browser.cjs` requires Playwright; its fallback expects `TEMP` to point to the optional external verification folder, and `TEMP` is unset here. A visual browser check of Bloom mode remains manual.
- The project is served as static files (`vercel.json` sets `buildCommand: null` and `outputDirectory: "."`), so there is no production build command. The JavaScript syntax and static resource checks are the applicable local checks.

## Chrome submission check (2026-11-26)

- A local Chrome run on a temporary copy passed the five-algorithm browser suite. The Export WAV button produced a RIFF download. The suite measured 64 additional short stereo WAV renders with nonzero audio and no clipping.
- An additional Koch Snowflake check changed depth, entered Bloom mode, played, paused, resumed, changed volume, and exited with Escape. Playback continued in the studio and the volume setting carried over.
- A headphone listening check on the intended demo device is still pending.

### Octave layering and Hanoi note count

- The extension suite checks the octave assigned to each Koch event and verifies that each iteration opens with every earlier octave. It also verifies exactly one correctly panned note per Hanoi move across all supported disk counts.
- The Chrome browser suite passed for all five modes. Its 64 short stereo WAV renders produced nonzero audio without clipping.
