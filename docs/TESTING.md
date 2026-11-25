# Testing and acceptance checklist

## Automated sanity checks

- [x] All JavaScript modules pass `node --check`.
- [x] The main page loads in Chromium without JavaScript exceptions.
- [x] Three recursive scenes generate nonempty and bounded node lists.
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
6. Try Calm, Dreamy, Deep Focus, Meditation and all four instruments.
7. Change the scale and verify pitches remain tonal.
8. Set volume to 0; confirm sound is silent. Restore volume.
9. Export WAV; check it opens in an audio player and contains audible notes.
10. Resize to tablet/mobile, use keyboard navigation, and enable Reduced Motion.
11. Change configuration during playback and verify no old playback session remains active.

## Browser and operating conditions

Chrome, Edge and Firefox on desktop are suggested for the live demo. Audio permissions and user interaction are required by browser policy. Headphones recommended.

## Architecture-specific invariants

- Active-node highlights use `MusicEvent.sourceNodeId`, never a separate visual timeline.
- Both live and offline synthesis call the same `renderNote()` and `buildBus()` functions.
- The recursion level is capped at 8, nodes at 10,000, melodic notes at 105, and composition duration at 95 seconds.
- Initial browser load does not initialize or play the audio context.


## Verified results (November 25, 2026)

- **Syntax:** all five JavaScript files passed `node --check`.
- **Algorithms/music:** `node tests/verify.cjs` passed 135 combinations across 3 algorithms, 3 depth values, 3 density values, and 5 scales, validating node identity, finite timing, pan limits, bounded events, and in-scale pitches.
- **Chromium smoke test:** initial page rendered with no JavaScript exceptions. Switched all three algorithms, changed a sound mood, and toggled Play/Pause successfully.
- **High-depth stress test:** Sierpinski and three-way Tree both generated 9,841 nodes at depth 8 without browser exceptions.
- **Responsive:** mobile Chromium viewport 390px showed no horizontal overflow (`scrollWidth == innerWidth`).
- **WAV export:** Chromium generated a RIFF/WAVE file, decoded with Python's `wave` module as 2-channel, 44,100-Hz, 16-bit audio, with nonzero signal (peak ≈ 0.10, RMS ≈ 0.023) and no clipped samples for the tested short composition.
- **Test environment note:** The sandbox's Chromium blocks navigation to `file://` and `localhost` by administrator policy, so the in-container browser tests injected the same HTML/CSS/JS contents into a Chromium page. This does not indicate ordinary browsers block opening `index.html`; direct file-opening on the user's machine has not been separately verified here.

**Still recommended manually:** listen to all four mood/instrument combinations with headphones, export a long composition, and check the target demo laptop/browser before submission.
