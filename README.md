# Recursive Soundscapes

**Make recursion audible. Make simulation beautiful. Make the experience relaxing.**

A complete, local-first creative music studio based on the provided Software Requirements Specification. Three recursive algorithms generate the **actual musical events** you hear. That same event timeline drives the animated node highlights and WAV export.

## Get started (no installation required)

1. Unzip the project.
2. Open **`index.html`** in a current Chrome, Edge, Firefox, or Safari browser.
3. Choose Fibonacci, Sierpinski, or Recursive Tree. Move the sliders and choose a mood.
4. Press **Play**. The first Play click authorizes sound in your browser.
5. Press **Export WAV** to download the original audio file.

No account, server, database, API key, network connection, package manager, or build command is required. You can also serve the folder locally if preferred:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

## Deploy to Vercel

This project is a static site and needs no build command or dependencies. The root-level `vercel.json` selects Vercel's **Other** framework preset and publishes the project root, including `index.html`, `src/`, and `public/`.

1. Push the project to a Git provider supported by Vercel.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the project root as the **Root Directory**. The checked-in `vercel.json` supplies the static deployment settings.
4. Deploy. Vercel serves the app at the deployment URL; no environment variables are required.

The app runs entirely in the visitor's browser. Audio playback still requires a user gesture, and WAV export is rendered locally.

## Main capabilities

| Feature | Status |
|---|---|
| Fibonacci, Sierpinski triangle, recursive tree | Implemented |
| Recursion depth 1–8, tempo 40–160 BPM, density 1–10 | Implemented and bounded |
| Algorithm-specific tree angle and branch-length controls | Implemented |
| Shared algorithm → music timeline → visualization | Implemented |
| Four distinct moods and four synthesizer voices | Implemented |
| Five tonal scales | Implemented |
| Play, pause, stop, loop, seek, regenerate | Implemented |
| Real-time synchronized active-node highlighting | Implemented |
| Master volume and reduced motion | Implemented |
| Offline rendered, stereo 16-bit PCM WAV with reverb/delay | Implemented |
| Responsive layouts and keyboard input | Implemented |
| Client-only design, no user data collected | Implemented |

## Technology

- **Plain HTML + CSS + modular JavaScript** (no dependency installation; open the app directly).
- **Canvas 2D** for smooth HiDPI recursive visualizations with cached static geometry.
- **Web Audio API** for sample-accurate note scheduling, instrument synthesis, stereo panning, audio effects, dynamics compression and playback.
- **OfflineAudioContext** for exporting the same composition with the same synthesis and effects to WAV.

The SRS recommends React/TypeScript/Vite/Tailwind, but lists that stack as *recommended*, not mandatory. This dependency-free implementation deliberately prioritizes zero-setup hackathon demos while preserving modular algorithm, music, audio, visualization and UI layers.

## Architecture

```text
index.html + styles.css + app.js (UI and state)
           |
           v
   algorithms.js             // actual recursive geometry and metadata
           |
           v
      music.js                // canonical MusicEvent[] timeline
           |                  event: id, time, pitch, duration,
           |                  velocity, depth, pan, sourceNodeId
      +----+-------------------+
      |                        |
   audio.js               visualization.js
 Web Audio clock          Canvas active node
 + offline WAV            (from the same sourceNodeId)
```

### Where the notes come from

- **Fibonacci:** actual Fibonacci values drive scale degrees (pitch). Sequence index drives timing and phrase length. A memoized/linear process avoids exponential recursion.
- **Sierpinski:** recursive subdivision path, triangle position, and triangle depth determine pitch/register; traversal controls timing; horizontal position controls stereo pan.
- **Tree:** recursive branch depth, position and height determine pitch/register; traversal controls rhythm; left/right branch location controls panning. Higher density produces three-way branching.
- Musical notes are quantized to your chosen scale. Pad/bass voices are derived from the same nodes as the melody, not an unrelated backing track.

## Structure

```text
recursive-soundscapes/
├── index.html
├── public/favicon.svg
├── src/
│   ├── algorithms.js
│   ├── music.js
│   ├── audio.js
│   ├── visualization.js
│   ├── app.js
│   └── styles.css
├── docs/
│   ├── SRS.md
│   ├── AI_PROMPT_LOG.md
│   └── TESTING.md
└── README.md
```

## Keyboard and accessibility

All controls use buttons, selects, or labelled range sliders. You can press **Space** (when not in a form field) to toggle playback. The reduced-motion switch suppresses visual pulsing. The interface does **not** autoplay.

## Known limitations

- Browser audio playback requires a click/tap to comply with autoplay policies.
- Offline WAV export consumes memory proportional to composition duration (export lengths are intentionally bounded).
- Mobile browser backgrounding may suspend Web Audio; return to the page and press Play.
- This demo does not save files to a cloud service and does not have multitrack editing.
- SVG/Canvas animations may look different across browsers; use modern versions.

## Hackathon evidence

The brief in the provided SRS says to submit the **real AI prompt chain and actual agent responses**. `docs/AI_PROMPT_LOG.md` records the prompt available for this delivered code and marks absent conversations clearly. It is **not** a substitute for exporting your original Codex/ChatGPT messages: add them before submission. `docs/TESTING.md` lists checks and test results. See `docs/SRS.md` for the supplied specification.

## License

Project source created for the user; the original procedural music is synthesized in the browser and uses no copyrighted sound samples.
