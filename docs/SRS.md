# Software Requirements Specification (SRS)
## Recursive Soundscapes
**Version:** 1.0  
**Project Type:** Web Application  
**Project Category:** Creative Coding / Generative Music  
**Document Status:** Development Specification

---

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements, system architecture, user interactions, technical constraints, and acceptance criteria for Recursive Soundscapes.

The application will transform recursive mathematical processes into original musical compositions and synchronized visual simulations. Users will be able to configure recursion parameters, observe the algorithm's behavior, listen to generated soundscapes, adjust musical characteristics, and export compositions as audio files.

### 1.2 Product Vision

**Make recursion audible. Make simulation beautiful. Make the experience relaxing.**

Recursive Soundscapes will turn mathematical structures into interactive audiovisual experiences. Rather than simply generating random ambient music, the application will use the actual behavior of recursive algorithms to determine musical events.

### 1.3 Problem Statement

Mathematical recursion is often difficult to understand visually and abstract to experience. At the same time, generative music applications frequently separate their musical output from the underlying mathematical processes.

Recursive Soundscapes addresses this by connecting three elements:

- Mathematical recursion.
- Real-time visual simulation.
- Procedural music generation.

### 1.4 Intended Users

1. People looking for relaxing ambient soundscapes.
2. Students and educators interested in recursion and mathematical patterns.
3. Creative coders and generative-art enthusiasts.
4. Music enthusiasts interested in algorithmic composition.

### 1.5 Definitions

| Term | Definition |
|---|---|
| Recursion | A function calling itself to solve smaller instances of a problem |
| Recursion depth | Maximum number of recursive levels |
| Musical event | A generated note or sound event with timing and audio properties |
| Soundscape | A composition of musical notes, textures, and ambient layers |
| Timbre | The tonal character or quality of a sound |
| Procedural music | Music generated through rules or algorithms |
| Visualization | A graphical representation of the recursive process |

---

## 2. Project Scope

### 2.1 In Scope

The application shall provide:

- Three selectable recursive visualization engines.
- User-configurable recursion parameters.
- Interactive visualization of recursive behavior.
- Procedural music generation based on algorithm output.
- Synthesized musical instruments and ambient sounds.
- Eight selectable sound atmospheres.
- Audio playback controls.
- Real-time visual synchronization with musical events.
- Audio export in WAV format.
- Responsive and accessible user interface.

### 2.2 Out of Scope

The first release will not include:

- User registration or authentication.
- Subscription or payment functionality.
- Social networking or public sharing feeds.
- Cloud-based composition storage.
- AI-generated music.
- Multiplayer collaboration.
- A backend database.
- Professional multitrack audio editing.

These features do not directly satisfy the core hackathon requirements and would consume time better spent improving musical quality and user experience.

---

## 3. System Overview

### 3.1 Product Description

Recursive Soundscapes is a browser-based interactive music studio.

The user selects an algorithm and configures its parameters. The application executes the recursive process, generates a visual representation, converts meaningful algorithm events into musical events, and plays the resulting composition.

The same event data must drive both the audio scheduler and visual animation.

### 3.2 Supported Algorithms

#### RS-ALG-01: Fibonacci Sequence

The application shall generate Fibonacci values and use their relationships to create melodic patterns.

**Visual behavior:**
- Display the sequence and its recursive relationship.
- Highlight the currently processed value.
- Animate the sequence as musical events are played.

**Musical mapping:**
- Normalized Fibonacci values determine pitch.
- Sequence position influences note timing.
- Repeating patterns influence melodic phrases.
- Recursion depth can influence instrument layers.

**Musical character:** Flowing, melodic, and repetitive.

Implementation note: Avoid naïve exponential recursive Fibonacci computation. Use memoization or iterative generation for the sequence, and generate a bounded recursive call-tree representation separately if needed.

#### RS-ALG-02: Sierpinski Triangle

The application shall recursively divide a triangle into smaller triangular structures.

**Visual behavior:**
- Render the initial triangle.
- Recursively generate smaller triangles.
- Highlight individual triangles during playback.
- Allow the user to change recursion depth.

**Musical mapping:**
- Triangle depth determines instrument layers or octave.
- Triangle position determines stereo panning.
- Recursive subdivision determines rhythmic subdivisions.
- Traversal order determines note order.

**Musical character:** Geometric, layered, and spatial.

#### RS-ALG-03: Recursive Branching Tree

The application shall generate a tree structure through recursive branching.

**Visual behavior:**
- Render a central trunk and recursive branches.
- Animate branch growth.
- Highlight branches as their associated musical events play.
- Allow the user to control depth and branching density.

**Musical mapping:**
- Branch depth determines musical register.
- Branch count influences rhythmic subdivisions.
- Branch position influences stereo panning.
- Traversal order determines note sequence.

**Musical character:** Organic, atmospheric, and evolving.

### 3.3 Algorithm Configuration

The user shall be able to configure supported algorithm parameters.

Initial recommended limits:

| Parameter | Minimum | Maximum | Default |
|---|---:|---:|---:|
| Recursion depth | 1 | 8 | 4 |
| Tempo | 40 BPM | 160 BPM | 80 BPM |
| Density | 1 | 10 | 4 |
| Master volume | 0% | 100% | 65% |

Algorithm-specific parameters, such as branching angle or branch length, may be provided where relevant.

Limits must be enforced to prevent excessive computation and audio overload.

---

## 4. Functional Requirements

### 4.1 Algorithm Selection

**FR-001:** The system shall display the available recursive algorithms.

**FR-002:** The user shall be able to select Fibonacci, Sierpinski Triangle, or Recursive Tree.

**FR-003:** The system shall update the visualization and available parameter controls when the selected algorithm changes.

**FR-004:** The system shall generate a valid recursive structure using the selected algorithm and parameters.

**FR-005:** The system shall limit recursion depth and generated event count to safe configured limits.

### 4.2 Recursive Visualization

**FR-006:** The system shall display a visual representation of the selected recursive process.

**FR-007:** The visualization shall update when algorithm parameters change and the user regenerates the composition.

**FR-008:** The visualization shall identify the currently active recursive node or structure during playback.

**FR-009:** The visualization shall provide smooth animations without blocking audio playback.

**FR-010:** The visualization shall provide a useful initial state before playback begins.

### 4.3 Procedural Music Generation

**FR-011:** The system shall generate musical events from the selected recursive algorithm's output.

**FR-012:** Each generated musical event shall contain, at minimum:

- Event identifier.
- Playback time.
- Pitch.
- Duration.
- Velocity.
- Recursion depth.
- Stereo pan.
- Associated visualization node identifier.

**FR-013:** The system shall map recursive properties to musical properties using documented mapping rules.

**FR-014:** The generated composition shall use musical scales or note sets to maintain tonal consistency.

**FR-015:** The system shall support multiple synthesized instrument sounds.

**FR-016:** The system shall prevent excessive overlapping audio events and clipping.

**FR-017:** The system shall regenerate a composition when the user changes relevant algorithm or musical parameters.

### 4.4 Sound Mood Selection

**FR-018:** The system shall provide eight selectable sound atmospheres: Calm, Dreamy, Deep Focus, Meditation, Ambient Drift, Nocturne, Cinematic, and Pulse.

| Mood | Intended Sound |
|---|---|
| Calm | Soft tones, gentle melodies, minimal percussion |
| Dreamy | Bell-like tones, atmospheric pads, long releases |
| Deep Focus | Repeating pulses, subtle bass, restrained melodies |
| Meditation | Sustained drones, slow transitions, sparse notes |

**FR-019:** Each mood shall define a coherent collection of instrument, envelope, effects, and arrangement settings.

**FR-020:** Switching moods shall update the sound design without requiring the user to select another algorithm.

### 4.5 Audio Playback

**FR-021:** The system shall provide Play, Pause, Stop, and Regenerate controls.

**FR-022:** The user shall be able to adjust master volume.

**FR-023:** The system shall schedule audio events using the audio clock rather than visual animation frame timing.

**FR-024:** The system shall synchronize visual highlighting with scheduled musical events.

**FR-025:** The system shall prevent multiple unintended playback sessions from running simultaneously.

**FR-026:** The system shall provide appropriate feedback when browser audio permissions or audio initialization are unavailable.

### 4.6 Composition Controls

**FR-027:** The user shall be able to adjust tempo.

**FR-028:** The user shall be able to adjust recursion depth within supported limits.

**FR-029:** The user shall be able to adjust musical density.

**FR-030:** The user shall be able to select a musical scale.

**FR-031:** Changes to relevant settings shall be reflected in the next generated composition.

**FR-032:** The system shall provide a way to generate a new variation without changing the selected algorithm.

### 4.7 Audio Export

**FR-033:** The system shall allow users to export the generated composition as a WAV file.

**FR-034:** The exported file shall contain the generated musical events and configured sound effects.

**FR-035:** The exported composition shall respect the selected tempo, mood, instruments, and composition settings.

**FR-036:** The system shall display export progress or a clear completion/failure state.

**FR-037:** The exported audio shall be playable in standard audio players.

### 4.8 User Interface

**FR-038:** The system shall provide a single primary music-studio workspace.

**FR-039:** The workspace shall include algorithm selection, parameter controls, visualization, sound settings, and playback controls.

**FR-040:** The system shall provide clear labels and understandable controls.

**FR-041:** The system shall display useful loading, empty, error, and playback states.

**FR-042:** The interface shall adapt to desktop, tablet, and mobile screen sizes.

---

## 5. User Interface Requirements

### 5.1 Design Direction

The interface shall use a futuristic, immersive, dark visual style.

Suggested color palette:

| Purpose | Color |
|---|---|
| Main background | #090B16 |
| Panel background | #171E34 |
| Primary accent | #65E7EF |
| Secondary accent | #A78BFA |
| Highlight accent | #F0A5E8 |
| Main text | #EEF2FF |
| Muted text | #9BA8C7 |

Visual elements may include subtle glowing borders, gradients, animated particles, and translucent panels. These effects must not reduce readability or performance.

### 5.2 Main Workspace Layout

**Header**
- Product logo and name.
- Short tagline.
- Optional help or information control.

**Left Panel — Algorithm Studio**
- Algorithm selector.
- Algorithm-specific parameters.
- Recursion depth control.
- Tempo and density controls.
- Musical scale selector.

**Center Panel — Visualization**
- Large recursive visualization area.
- Active node highlighting.
- Algorithm status.
- Optional recursion depth indicator.

**Right Panel — Sound Studio**
- Mood selector.
- Instrument selection.
- Musical mapping information.
- Volume control.

**Bottom Panel — Playback**
- Play.
- Pause.
- Stop.
- Regenerate.
- Playback progress.
- WAV export.

### 5.3 User Experience Principles

- The user should understand the primary workflow without documentation.
- Audio should not start unexpectedly.
- Controls should provide immediate feedback.
- Visual animation should feel smooth and relaxing.
- Default settings should produce a pleasant composition.
- The interface should avoid excessive flashing, sudden loud sounds, and distracting motion.
- Users should be able to reduce or disable nonessential animations.

---

## 6. User Workflow

### 6.1 Primary Workflow

1. User opens Recursive Soundscapes.
2. The application displays the main workspace.
3. User selects a recursive algorithm.
4. User configures recursion parameters.
5. User selects a mood and musical settings.
6. User clicks Generate.
7. The application executes the algorithm.
8. The application creates the visualization and musical event sequence.
9. User clicks Play.
10. The audio begins and the visualization highlights corresponding events.
11. User adjusts settings or regenerates a variation.
12. User exports the composition as a WAV file.

### 6.2 Error Workflow

If an invalid or excessive configuration is submitted:

1. The system validates the parameters.
2. The system rejects unsafe values.
3. The system displays a clear explanation.
4. The system preserves the last valid composition where possible.

---

## 7. Technical Requirements

### 7.1 Recommended Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Visualization | HTML Canvas or Three.js |
| Audio synthesis | Tone.js / Web Audio API |
| Audio export | OfflineAudioContext or offline rendering pipeline |
| State management | React state and custom hooks |
| Hosting | Static web hosting |

A backend is not required for the first release.

### 7.2 System Architecture

The application shall use modular separation between algorithms, musical mapping, audio synthesis, visualization, and user interface.

```text
User Interface
      |
      v
Application State
      |
      v
Algorithm Engine
      |
      +------> Visualization Renderer
      |
      v
Musical Mapping Engine
      |
      v
Music Event Timeline
      |
      +------> Audio Scheduler
      |              |
      |              v
      |         Audio Synthesis
      |
      +------> Visual Event Synchronization
      |
      v
Offline Audio Renderer
      |
      v
WAV Export
```

### 7.3 Shared Music Event Model

The algorithm and music engine shall communicate through a shared event structure.

```typescript
type MusicEvent = {
  id: string;
  time: number;
  pitch: number;
  duration: number;
  velocity: number;
  depth: number;
  pan: number;
  sourceNodeId: string;
};
```

The event timeline shall be the shared source of truth for audio playback and visual highlighting.

This is a critical architectural requirement. Do not independently generate visual events and musical notes. That would break the connection between the mathematics and the sound.

### 7.4 Audio Engine

The audio engine shall support:

- Oscillator-based sound synthesis.
- Sine, triangle, and filtered sawtooth waveforms.
- Envelope control.
- Low-pass filtering.
- Reverb and delay effects.
- Stereo panning.
- Master volume control.
- Safe scheduling of overlapping notes.

A shared audio context should be reused. The application should avoid creating a new audio context for every playback operation.

### 7.5 Visualization Engine

The visualization engine shall:

- Render algorithm structures.
- Support real-time active-node highlighting.
- Animate recursion growth or traversal.
- Remain independent of the audio scheduling clock.
- Handle resizing and different display resolutions.

### 7.6 Audio Export Engine

The export engine shall render the composition offline using the same event data and sound settings used by playback.

The resulting audio shall be encoded into a WAV file and made available for download.

The export process must not depend on recording whatever happens to be audible from the live browser speakers.

---

## 8. Non-Functional Requirements

### 8.1 Performance

**NFR-001:** The application shall remain responsive during normal algorithm generation and playback.

**NFR-002:** The application shall enforce limits on recursion depth and musical event count.

**NFR-003:** Visualization rendering shall not block audio scheduling.

**NFR-004:** The application shall reuse audio resources where practical.

**NFR-005:** The application shall avoid unnecessary re-rendering of complex visualization components.

### 8.2 Reliability

**NFR-006:** Invalid parameter values shall not crash the application.

**NFR-007:** Audio playback shall stop cleanly when Stop is selected.

**NFR-008:** Regenerating a composition shall not leave old scheduled notes playing.

**NFR-009:** Export failures shall be communicated clearly.

### 8.3 Usability

**NFR-010:** The primary workflow shall be understandable without technical knowledge of recursion.

**NFR-011:** Controls shall have clear labels and appropriate ranges.

**NFR-012:** The interface shall provide visible feedback for user actions.

### 8.4 Accessibility

**NFR-013:** Text and controls shall have sufficient contrast.

**NFR-014:** Interactive controls shall be keyboard accessible.

**NFR-015:** Important states shall not be communicated through color alone.

**NFR-016:** Motion shall be restrained and respect reduced-motion preferences.

**NFR-017:** Audio shall only begin after an intentional user action.

### 8.5 Compatibility

**NFR-018:** The application shall support modern desktop browsers with Web Audio API support.

**NFR-019:** The interface shall be responsive on mobile browsers.

**NFR-020:** The application shall handle browsers that require a user gesture before audio playback.

---

## 9. Data Management

The initial release shall operate without a server database.

The application shall maintain:

- Selected algorithm.
- Algorithm parameters.
- Musical settings.
- Generated recursive structure.
- Music event timeline.
- Playback state.
- Export state.

Optional user presets may be saved locally using browser storage.

No personal information shall be required to use the application.

---

## 10. Validation and Error Handling

The application shall validate:

- Recursion depth.
- Tempo.
- Density.
- Musical scale.
- Generated event count.
- Audio initialization.
- Export availability.

Expected error conditions include:

| Condition | Expected Behavior |
|---|---|
| Invalid depth | Reject value and show validation message |
| Excessive event count | Limit generation or request simpler settings |
| Audio context unavailable | Display an audio initialization error |
| Playback interrupted | Stop or recover gracefully |
| Export failure | Display error and allow retry |
| Unsupported browser | Display a compatibility message |

---

## 11. Acceptance Criteria

The application will be considered ready for submission when the following conditions are satisfied.

### Core Functional Acceptance

- [ ] At least one recursive algorithm executes correctly.
- [ ] The selected algorithm has configurable parameters.
- [ ] The recursive process is visibly simulated.
- [ ] The musical composition is derived from actual algorithm output.
- [ ] The application generates original synthesized audio.
- [ ] The user can play, pause, stop, and regenerate a composition.
- [ ] Visual elements synchronize with musical events.
- [ ] The user can adjust musical settings.
- [ ] The user can export a playable WAV file.
- [ ] The interface works without requiring account registration.

### Product Quality Acceptance

- [ ] Default settings produce a pleasant, coherent soundscape.
- [ ] Different algorithm settings produce perceptibly different compositions.
- [ ] Different moods produce distinct sound characteristics.
- [ ] Playback does not create uncontrolled overlapping sessions.
- [ ] The interface is responsive and understandable.
- [ ] No major performance or playback errors occur during the demo.

### Extended Scope Acceptance

- [ ] Fibonacci algorithm works.
- [ ] Sierpinski Triangle algorithm works.
- [ ] Recursive Tree algorithm works.
- [ ] All three algorithms share the same musical event architecture.

---

## 12. Development Priorities

### Priority 1 — Mandatory Core

1. Build the application workspace.
2. Implement one recursive algorithm.
3. Visualize the recursive process.
4. Convert algorithm output into musical events.
5. Synthesize and play audio.
6. Synchronize visualization with audio.
7. Export WAV.

### Priority 2 — Product Differentiation

1. Add the other two algorithms.
2. Add four sound moods.
3. Add musical scale selection.
4. Add richer instruments and effects.
5. Improve visual transitions and animations.
6. Add composition variations.

### Priority 3 — Optional Polish

1. Save favorite presets locally.
2. Add random preset generation.
3. Add a short explanation of each algorithm.
4. Improve mobile-specific layouts.
5. Add optional composition configuration export.

---

## 13. Testing Strategy

### 13.1 Algorithm Testing

- Verify Fibonacci values.
- Verify Sierpinski subdivision at different depths.
- Verify recursive tree branching.
- Verify that depth limits are enforced.
- Verify that generated event counts remain bounded.

### 13.2 Music Testing

- Verify that generated pitches belong to the selected scale.
- Verify that event timing follows the selected tempo.
- Verify that depth and branching influence musical output.
- Verify that different algorithms create distinguishable compositions.
- Verify that sound levels do not clip under normal configurations.

### 13.3 Synchronization Testing

- Verify that the highlighted visual node corresponds to the active musical event.
- Verify synchronization at different tempos.
- Verify that Pause and Stop update visual playback state correctly.
- Verify that regeneration clears the previous timeline.

### 13.4 Export Testing

- Export a WAV file.
- Open it in a standard audio player.
- Confirm that the file contains audible audio.
- Confirm that the duration and musical settings are correct.
- Compare exported audio with the live composition.

### 13.5 User Interface Testing

- Test desktop layout.
- Test mobile layout.
- Test keyboard navigation.
- Test error messages.
- Test reduced-motion behavior.

---

## 14. Suggested Project Structure

```text
recursive-soundscapes/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── AlgorithmSelector.tsx
│   │   ├── ParameterControls.tsx
│   │   ├── Visualization.tsx
│   │   ├── AudioPlayer.tsx
│   │   └── SoundStudio.tsx
│   │
│   ├── algorithms/
│   │   ├── fibonacci.ts
│   │   ├── sierpinski.ts
│   │   └── recursiveTree.ts
│   │
│   ├── audio/
│   │   ├── synthesizer.ts
│   │   ├── musicMapper.ts
│   │   ├── scheduler.ts
│   │   ├── effects.ts
│   │   └── exportWav.ts
│   │
│   ├── visualization/
│   │   ├── fibonacciRenderer.ts
│   │   ├── sierpinskiRenderer.ts
│   │   └── treeRenderer.ts
│   │
│   ├── hooks/
│   │   ├── useAudio.ts
│   │   └── useComposition.ts
│   │
│   ├── types/
│   │   └── music.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── README.md
├── package.json
└── tsconfig.json
```

---

## 15. Hackathon Submission Requirements

The hackathon brief states that AI coding agents may be used, but the repository must contain the prompt chain and corresponding agent responses. Failure to submit these may result in disqualification.

Therefore, the project repository shall include:

- The prompts used with AI coding agents.
- The corresponding agent responses.
- A clear record of which prompts produced which implementation changes.

Suggested directory:

```text
docs/
  SRS.md
  AI_PROMPT_LOG.md
  TESTING.md
```

The AI prompt log should preserve the actual prompts and responses, not reconstructed summaries.

---

## 16. Evaluation Alignment

The hackathon brief assigns the following evaluation weights:

| Evaluation Area | Weight | Product Focus |
|---|---:|---|
| Relaxation and user experience | 35% | Comfortable, immersive, pleasant sound |
| Musical quality | 25% | Coherent melodies, harmony, and sound design |
| Creative use of recursion | 15% | Meaningful algorithm-to-music mapping |
| Visual design | 10% | Beautiful, clear recursive visualization |
| Interaction and usability | 10% | Simple controls and useful feedback |
| Technical execution | 5% | Reliable playback, simulation, and export |

Development effort should reflect these weights. A visually impressive application with unpleasant or random-sounding audio is not a strong submission.

---

## 17. Final Definition of Done

Recursive Soundscapes is complete when a user can select a recursive algorithm, configure its parameters, watch the algorithm unfold, hear a coherent musical composition derived from its behavior, control playback, and download the result as a WAV file.

The central product requirement is that the music must genuinely emerge from the recursive process, while the visualization and audio remain synchronized.

**The application must not feel like a fractal visualizer with unrelated background music. It must feel like the user is hearing the algorithm itself.**

## Feature extension: Koch and Towers of Hanoi (2026-11-26)

This extension supersedes the original three-algorithm scope and its global 95-second event-duration limit for the two new algorithms. Existing algorithms retain their original mappings and bounds.

### Functional requirements implemented

- Studio order: Fibonacci Sequence, Sierpinski Triangle, Recursive Branching Tree, Koch Snowflake / Curve, Towers of Hanoi (experimental). Each selection explains its recursion and musical interpretation.
- Koch: depth 1-5, curve or snowflake; true four-way recursive subdivision; 4^N or 3*4^N final segments; normalized aspect-preserving centered rendering; smoothly interpolated iterations; depth colors and active segment highlights. All geometry is generated, while a bounded ordered traversal is sonified per iteration.
- Koch sound: orientation maps to scale degree; length to bounded duration; depth to capped octave layers and voice; horizontal position to pan; iteration/order to evolving rhythmic sequence. Selected lower-register pads persist as higher iterations enter.
- Hanoi: 1-8 disks, three pegs, complete recursive solution with validated top-disk moves and no larger-on-smaller placement. Show minimum moves, current/total moves, source/destination, and recursion depth. Animate lift, transfer, and placement; highlight the moving disk and mark completion.
- Hanoi sound: every move produces one melody event. Larger disks map monotonically to lower selected-scale pitches; destination pan is -0.8, 0, or +0.8. Recursion depth selects voice layer. Density changes supporting sound only, never skips or reorders moves.
- Both extensions use the existing MusicEvent contract (id, time, pitch, duration, velocity, depth, pan, sourceNodeId), shared synthesizer, audio-clock position, and WAV renderer.
- Play/pause/resume, stop, seek, loop, regeneration, tempo, volume, scales, moods, instruments, theme toggle, and reduced motion remain supported. Changes stop prior playback and invalidate pending asynchronous starts.

### Nonfunctional requirements implemented

No runtime dependencies, paid APIs, backend, or account required. Koch has at most 4,095 stored segment nodes across levels, 3,072 final segments, and cached final-iteration paths. Hanoi has at most 255 validated moves with small peg snapshots. New musical timelines have fewer than 400 events, duration below 200 seconds, MIDI register 45-89, and no more than 12 simultaneous note voices including release tails. Export includes note releases and effects tail. Mobile uses the existing stacked responsive layout. Default dark palette: background #090B16, panel #171E34, cyan #65E7EF, purple #A78BFA, pink #F0A5E8.

### Acceptance evidence

See tests/extensions.cjs for counts, continuous Koch geometry, all legal Hanoi moves, scale consistency, deterministic events, timing, pan, register, and overlap limits. tests/browser.cjs checks real browser controls, completion, loop restart, export download, responsive layout, reduced motion, and real offline WAV signal.
