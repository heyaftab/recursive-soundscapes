<div align="center">

<img src="public/banner.svg" alt="Recursive Soundscapes — animated banner" width="100%" />

<br/>

![Zero Install](https://img.shields.io/badge/setup-zero_install-7c3aed?style=for-the-badge)
![Web Audio](https://img.shields.io/badge/Web_Audio_API-sample--accurate-06b6d4?style=for-the-badge)
![Canvas 2D](https://img.shields.io/badge/Canvas_2D-HiDPI-f43f5e?style=for-the-badge)
![Vercel](https://img.shields.io/badge/deploy-Vercel_ready-000000?style=for-the-badge&logo=vercel)
![Privacy](https://img.shields.io/badge/data_collected-none-22c55e?style=for-the-badge)

### 🌀 Fibonacci &nbsp;•&nbsp; 🔺 Sierpinski &nbsp;•&nbsp; 🌳 Recursive Tree

*Five recursive algorithms generate the **actual musical events** you hear.<br/>
The same event timeline drives the glowing node animation and the WAV export.*

[🚀 Quick Start](#-quick-start) · [✨ Features](#-features) · [🧠 How It Works](#-how-the-music-is-born) · [🏗️ Architecture](#️-architecture) · [☁️ Deploy](#️-deploy-to-vercel) · [♿ Accessibility](#-keyboard--accessibility)

</div>

---

<!-- 📸 Add a screenshot or GIF of the running app here:
<p align="center"><img src="docs/preview.gif" width="85%" alt="App preview" /></p>
-->

## 🚀 Quick Start

> **No account · No server · No database · No API key · No build step**

| Step | Action |
|:---:|---|
| **1** 📦 | Unzip the project |
| **2** 🌐 | Open **`index.html`** in a current Chrome, Edge, Firefox, or Safari |
| **3** 🎛️ | Choose Fibonacci, Sierpinski, or Recursive Tree; move the sliders; pick a mood |
| **4** ▶️ | Press **Play** *(the first click authorizes sound in your browser)* |
| **5** 💾 | Press **Export WAV** to download your original audio file |

Prefer a local server?

```bash
python -m http.server 8000
# visit http://localhost:8000
```

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🎼 Sound
- 🌀🔺🌳 Fibonacci, Sierpinski triangle, recursive tree
- 🎭 **8 atmospheres** and **8 synthesizer voices**
- 🎹 **9 tonal scales**
- 🔊 Master volume, stereo panning, reverb and delay
- 💿 Offline-rendered **stereo 16-bit PCM WAV**

</td>
<td width="50%" valign="top">

### 🎨 Visuals & Control
- ✨ Real-time synchronized active-node highlighting
- 🌸 Bloom mode with full-screen listening and minimal playback controls
- ▶️ ⏸️ ⏹️ Play, pause, stop, loop, seek, regenerate
- 🌿 Tree angle and branch-length controls
- 📱 Responsive layouts and keyboard input
- 🕊️ Reduced-motion switch

</td>
</tr>
</table>

### 🎚️ Bounded Controls

| Control | Range |
|---|:---:|
| 🔁 Recursion depth | `1 – 8` |
| ⏱️ Tempo | `40 – 160 BPM` |
| 🌫️ Density | `1 – 10` |

<details>
<summary><b>📋 Full feature status</b></summary>

<br/>

| Feature | Status |
|---|:---:|
| Fibonacci, Sierpinski triangle, recursive tree | ✅ |
| Recursion depth 1–8, tempo 40–160 BPM, density 1–10 | ✅ |
| Algorithm-specific tree angle and branch-length controls | ✅ |
| Shared algorithm → music timeline → visualization | ✅ |
| Eight distinct sound atmospheres and eight synthesizer voices | ✅ |
| Nine tonal scales | ✅ |
| Play, pause, stop, loop, seek, regenerate | ✅ |
| Real-time synchronized active-node highlighting | ✅ |
| Master volume and reduced motion | ✅ |
| Offline rendered, stereo 16-bit PCM WAV with reverb/delay | ✅ |
| Responsive layouts and keyboard input | ✅ |
| Client-only design, no user data collected | ✅ |

</details>

---

## 🧠 How the Music Is Born

Every note is quantized to your chosen scale. Pad and bass voices come from the **same nodes** as the melody, never an unrelated backing track.

| Algorithm | 🎵 Pitch | ⏳ Timing | 🎧 Pan |
|---|---|---|---|
| 🌀 **Fibonacci** | Actual Fibonacci values drive scale degrees | Sequence index sets timing and phrase length | n/a |
| 🔺 **Sierpinski** | Subdivision path, triangle position and depth set pitch and register | Traversal order | Horizontal position |
| 🌳 **Recursive Tree** | Branch depth, position and height set pitch and register | Traversal order | Left / right branch |

> 💡 Fibonacci uses a memoized/linear process, avoiding exponential recursion.
> 🌿 In the tree, higher density produces three-way branching.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    UI["🖥️ index.html + styles.css + app.js<br/><i>UI and state</i>"]
    ALG["🧮 algorithms.js<br/><i>recursive geometry + metadata</i>"]
    MUS["🎼 music.js<br/><i>canonical MusicEvent[] timeline</i>"]
    AUD["🔊 audio.js<br/><i>Web Audio clock + offline WAV</i>"]
    VIS["🎨 visualization.js<br/><i>Canvas active node via sourceNodeId</i>"]

    UI --> ALG --> MUS
    MUS --> AUD
    MUS --> VIS

    style UI fill:#7c3aed,color:#fff,stroke:none
    style ALG fill:#0ea5e9,color:#fff,stroke:none
    style MUS fill:#f59e0b,color:#fff,stroke:none
    style AUD fill:#10b981,color:#fff,stroke:none
    style VIS fill:#f43f5e,color:#fff,stroke:none
```

> Each **MusicEvent** carries: `id` · `time` · `pitch` · `duration` · `velocity` · `depth` · `pan` · `sourceNodeId`

### 🧰 Technology

| | Tech | Role |
|:---:|---|---|
| 🧱 | **Plain HTML + CSS + modular JS** | No dependency installation; open the app directly |
| 🖼️ | **Canvas 2D** | Smooth HiDPI recursive visuals with cached static geometry |
| 🎧 | **Web Audio API** | Sample-accurate scheduling, synthesis, panning, effects, compression |
| 💽 | **OfflineAudioContext** | Exports the same composition, synthesis and effects to WAV |

<sub>The SRS lists React/TypeScript/Vite/Tailwind as *recommended*, not mandatory. This dependency-free build prioritizes zero-setup hackathon demos while keeping the algorithm, music, audio, visualization and UI layers modular.</sub>

### 📁 Project Structure

```text
recursive-soundscapes/
├── index.html
├── public/
│   ├── favicon.svg
│   ├── banner.svg
│   └── footer.svg
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

---

## ☁️ Deploy to Vercel

A static site with **no build command and no dependencies**. The root-level `vercel.json` selects Vercel's **Other** preset and publishes the project root (`index.html`, `src/`, `public/`).

1. 📤 Push the project to a Git provider supported by Vercel
2. ➕ In Vercel, choose **Add New → Project** and import the repository
3. 📁 Keep the project root as the **Root Directory**; the checked-in `vercel.json` supplies the settings
4. 🚀 Deploy. No environment variables are required

> 🔒 The app runs entirely in the visitor's browser. Audio playback still needs a user gesture, and WAV export is rendered locally.

---

## ♿ Keyboard & Accessibility

- ⌨️ All controls are buttons, selects, or labelled range sliders
- ␣ Press **Space** (outside form fields) to toggle playback
- 🕊️ The **reduced-motion** switch suppresses visual pulsing
- 🔇 The interface **never autoplays**

---

## ⚠️ Known Limitations

| | Limitation |
|:---:|---|
| 👆 | Browser audio needs a click/tap to satisfy autoplay policies |
| 🧠 | Offline WAV export uses memory proportional to duration (lengths are bounded) |
| 📱 | Mobile backgrounding may suspend Web Audio; return to the page and press Play |
| ☁️ | No cloud saving and no multitrack editing |
| 🌐 | Canvas animations may differ across browsers; use modern versions |

---

## 🏆 Hackathon Evidence

The SRS asks for the **real AI prompt chain and actual agent responses**.

- 🤖 [`docs/AI_PROMPT_LOG.md`](docs/AI_PROMPT_LOG.md) documents your project prompts and the assistant's responses, giving judges a record of your design and development process
- ⚠️ The log is a curated project record, not a complete chat export. Include original Codex/ChatGPT conversation exports too if the judges require the full chats
- 🧪 `docs/TESTING.md` lists checks and results
- 📘 `docs/SRS.md` holds the supplied specification

---

## 📜 License

Project source created for the user. The original procedural music is synthesized in the browser and uses **no copyrighted sound samples**.

<br/>

<div align="center">

<img src="public/footer.svg" alt="Animated sound waves — Made with recursion, curiosity and calm" width="100%" />

</div>

## Five algorithms, one musical timeline

1. **Fibonacci Sequence:** sequence values select notes; sequence order creates the melody.
2. **Sierpinski Triangle:** recursively subdivided triangles map position to stereo pan and depth to register.
3. **Recursive Branching Tree:** branch geometry shapes pitch, register, and stereo movement.
4. **Koch Snowflake / Curve:** choose an equilateral triangle or straight line. Each segment recursively becomes four. Playback morphs through every iteration; orientation selects scale notes, segment length sets bounded note duration, and horizontal position pans the sound. Each iteration adds a register one octave higher. Softer notes in the earlier registers play alongside it on selected beats.
5. **Towers of Hanoi (experimental):** a complete recursive solution on three pegs. Larger disks sound lower notes, each destination selects pan (-0.8, 0, +0.8), and recursion depth colors the timbre. Every move is retained in order, including all 255 moves at eight disks.

Only relevant controls appear: Koch mode and depth 1-5, Hanoi disks 1-8, or tree geometry. All algorithms retain tempo, nine scales, eight atmospheres (Calm, Dreamy, Deep Focus, Meditation, Ambient Drift, Nocturne, Cinematic, and Pulse), eight synthesizer voices (Soft Keys, Glass Bells, Warm Analog Pad, Plucked Strings, Wooden Marimba, Soft Choir, Air Flute, and Velvet Strings), volume, looping, seek, regenerate, reduced motion, and stereo WAV export. Density is available for Fibonacci, Sierpinski, Recursive Tree, and Koch. The studio starts in its dark theme and retains the light-theme toggle.

### Geometry, timing, and sound limits

Koch renders every segment: curve = 4^N; snowflake = 3 * 4^N (maximum 3,072 final segments). Music samples an ordered, bounded traversal of each iteration rather than sounding thousands of simultaneous notes. Completed iteration geometry uses cached canvas paths; subdivisions interpolate from parent segments.

Hanoi uses 2^N - 1 legal moves. Each move lasts half a beat and triggers exactly one note. The disk state is reconstructed from immutable move snapshots and playback position, so pause, seek, and stop preserve mathematical validity. Regeneration changes subtle musical accents while retaining the canonical solution.

Every event has id, time, pitch, duration, velocity, depth, pan, and sourceNodeId. New events also carry layer/voice and bounded release; Hanoi melody events carry moveDuration. Shared audio-clock position drives both new visualizations. No independent animation timer determines recursive progress.

New compositions stay below 400 events, 200 seconds, and 12 simultaneous note voices including release tails. Pitches stay in the selected scale within MIDI 45-89. Conservative gain and the shared compressor provide headroom. Live playback and WAV export use the same event list, voice selection, envelope, pan, and effects graph.

### Verification

Run from the project root:

```sh
node tests/verify.cjs
node tests/extensions.cjs
node tests/browser.cjs
```

The browser suite requires Playwright as test tooling and a local Chrome installation; it is not an application dependency. See [testing details](docs/TESTING.md).
