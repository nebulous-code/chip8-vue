<template>
  <!-- This main container holds the entire application layout. -->
  <main class="app">
    <!-- This header provides the title and live status. -->
    <header class="app__header">
      <div class="app__branding">
        <h1 class="app__title">CHIP-8</h1>
        <p class="app__subtitle">
          An oxidized CHIP-8 emulator presented through web assembly by
          <a
            class="app__link"
            href="https://github.com/nebulous-code"
            target="_blank"
            rel="noreferrer"
          >
            nebulous-code
          </a>
        </p>
      </div>
      <div class="app__monogram" aria-label="nebulous-code initials">NC</div>
    </header>

    <!-- This section organizes the screen and control panels. -->
    <section class="app__content">
      <section class="screen__column">
        <!-- This panel contains the CHIP-8 screen and metadata. -->
        <section class="panel panel--screen">
          <!-- This canvas displays the 64x32 framebuffer. -->
          <canvas
            ref="canvasRef"
            class="screen"
            :width="SCREEN_WIDTH"
            :height="SCREEN_HEIGHT"
            aria-label="CHIP-8 display"
          ></canvas>
          <!-- This row shows ROM and sound status. -->
          <div class="screen__meta">
            <span>ROM: {{ romLabel }}</span>
            <span>Sound: {{ soundLabel }}</span>
          </div>
        </section>
        <section class="panel panel--details">
          <details class="screen__details" open>
            <summary class="screen__summary">Keypad Mapping</summary>
            <p class="controls__hint">Keyboard input maps to the classic CHIP-8 keypad layout.</p>
            <pre class="keypad">
1 2 3 4     1 2 3 C
Q W E R  => 4 5 6 D
A S D F     7 8 9 E
Z X C V     A 0 B F
          </pre>
          </details>
          <details class="screen__details" open>
            <summary class="screen__summary">About CHIP-8</summary>
            <p class="controls__hint">
              CHIP-8 is an interpreted language for the COSMAC VIP, created by Joseph Weisbecker
              in the 1970s for the 1802 microprocessor. It was designed to make writing and running
              games easier on early systems rather than acting as a dedicated game console.
            </p>
          </details>
        </section>
      </section>

      <!-- This panel collects input controls and helper text. -->
      <section class="panel panel--controls">
        <div class="controls__group">
          <h2 class="controls__title">Control Flow</h2>
          <div class="controls__buttons">
            <button
              type="button"
              class="button"
              :disabled="!hasRom"
              @click="toggleRunState"
            >
              {{ runButtonLabel }}
            </button>
            <button
              type="button"
              class="button button--ghost"
              :disabled="!hasRom"
              @click="resetEmulator"
            >
              Reset
            </button>
          </div>
          <div class="controls__step">
            <button
              type="button"
              class="button button--ghost"
              :disabled="isRunning || !hasRom"
              @click="stepOnce"
            >
              Step
            </button>
            <span class="controls__pc">PC: {{ programCounterLabel }}</span>
          </div>
        </div>

        <div class="controls__group">
          <h2 class="controls__title">ROM</h2>
          <div class="roms__section">
            <button
              type="button"
              class="roms__toggle"
              :aria-expanded="showAllRoms"
              @click="toggleRomList"
            >
              Available ROMs:
            </button>
            <div class="controls__buttons">
            <button
              type="button"
              class="button button--ghost"
              :class="{ 'button--active': isActiveRom('CHIP-8 Logo') }"
              @click="loadPresetRom('CHIP-8 Logo')"
            >
              CHIP-8 Logo
            </button>
            <button
              type="button"
              class="button button--ghost"
              :class="{ 'button--active': isActiveRom('Flags') }"
              @click="loadPresetRom('Flags')"
            >
              Flags
            </button>
            <button
              type="button"
              class="button button--ghost"
              :class="{ 'button--active': isActiveRom('Walking Man') }"
              @click="loadPresetRom('Walking Man')"
            >
              Walking Man
            </button>
          </div>
          <div v-if="showAllRoms" class="controls__buttons">
              <button
                type="button"
                class="button button--ghost"
                :class="{ 'button--active': isActiveRom('Beep') }"
                @click="loadPresetRom('Beep')"
              >
                Beep
              </button>
              <button
                type="button"
                class="button button--ghost"
                :class="{ 'button--active': isActiveRom('Quirks') }"
                @click="loadPresetRom('Quirks')"
              >
                Quirks
              </button>
              <button
                type="button"
                class="button button--ghost"
                :class="{ 'button--active': isActiveRom('Keypad') }"
                @click="loadPresetRom('Keypad')"
              >
                Keypad
              </button>
            </div>
          </div>
          <p class="controls__hint">Or load a CHIP-8 ROM in .ch8 format:</p>
          <input
            class="file-input"
            :class="{ 'file-input--active': isUploadedRomActive }"
            type="file"
            accept=".ch8"
            @change="handleRomChange"
          />
        </div>

        <div class="controls__group">
          <h2 class="controls__title">Sound</h2>
          <p class="controls__hint">Toggle audio output for CHIP-8 sound.</p>
          <button type="button" class="button button--ghost" @click="toggleMute">
            {{ isMuted ? "Unmute" : "Mute" }}
          </button>
        </div>

        <div class="controls__group">
          <details class="controls__details" open>
            <summary class="controls__summary">
              Quirks <span class="controls__note">(requires restart)</span>
            </summary>
            <p class="controls__hint">Choose a preset or toggle individual flags.</p>
            <label class="controls__label">
              <span>Preset</span>
              <select
                class="controls__select"
                :value="quirkPresetLabel"
                @change="selectQuirkPreset"
              >
                <option value="CHIP-8">CHIP-8</option>
                <option value="Super CHIP-8">Super CHIP-8</option>
                <option value="XO-CHIP">XO-CHIP</option>
                <option value="Custom">Custom</option>
              </select>
            </label>
            <label class="controls__checkbox">
              <input type="checkbox" v-model="quirks.incrementIOnStore" />
              <span>Increment I on store</span>
            </label>
            <label class="controls__checkbox">
              <input type="checkbox" v-model="quirks.resetVfOnLogic" />
              <span>Reset VF on logic</span>
            </label>
            <label class="controls__checkbox">
              <input type="checkbox" v-model="quirks.wrapDraw" />
              <span>Wrap sprite draw</span>
            </label>
            <label class="controls__checkbox">
              <input type="checkbox" v-model="quirks.shiftUsesVx" />
              <span>Shift uses VX</span>
            </label>
          </details>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  createWasmClient,
  StubChip8Client,
  type Chip8Client,
  type Chip8KeyMask,
  type Chip8Quirks,
} from "./wasm/chip8Client";

/**
 * This constant defines the CHIP-8 screen width in pixels.
 */
const SCREEN_WIDTH = 64;

/**
 * This constant defines the CHIP-8 screen height in pixels.
 */
const SCREEN_HEIGHT = 32;

/**
 * This constant defines the target CPU speed for the main loop.
 */
const CYCLES_PER_SECOND = 1300;

/**
 * This constant caps CPU catch-up to keep the UI responsive.
 */
const MAX_CYCLES_PER_FRAME = 100;

/**
 * This constant defines the timer tick rate.
 */
const TIMER_HZ = 60;

/**
 * This constant defines the timer interval in milliseconds.
 */
const TIMER_INTERVAL_MS = 1000 / TIMER_HZ;

/**
 * This constant defines the render target frame rate.
 */
const TARGET_FPS = 60;

/**
 * This constant defines the render interval in milliseconds.
 */
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

/**
 * This constant maps preset ROM labels to their file paths.
 */
const ROM_PRESETS: Record<string, string> = {
  "CHIP-8 Logo": "/roms/1-chip8-logo.ch8",
  Flags: "/roms/4-flags.ch8",
  "Walking Man": "/roms/walking_man.ch8",
  Beep: "/roms/7-beep.ch8",
  Quirks: "/roms/5-quirks.ch8",
  Keypad: "/roms/6-keypad.ch8",
};

/**
 * This set of presets defines the supported quirk configurations.
 */
const QUIRK_PRESETS: Record<string, Chip8Quirks> = {
  "CHIP-8": {
    incrementIOnStore: true,
    resetVfOnLogic: true,
    wrapDraw: false,
    shiftUsesVx: false,
  },
  "Super CHIP-8": {
    incrementIOnStore: false,
    resetVfOnLogic: false,
    wrapDraw: false,
    shiftUsesVx: true,
  },
  "XO-CHIP": {
    incrementIOnStore: true,
    resetVfOnLogic: false,
    wrapDraw: true,
    shiftUsesVx: false,
  },
};

/**
 * This ref stores the canvas element for drawing.
 */
const canvasRef = ref<HTMLCanvasElement | null>(null);

/**
 * This ref stores whether the main loop is running.
 */
const isRunning = ref(false);

/**
 * This ref stores the currently loaded ROM name.
 */
const romLabel = ref("No ROM loaded");

/**
 * This ref stores the most recent sound timer value.
 */
const soundTimerValue = ref(0);

/**
 * This ref stores the current quirk configuration.
 */
const quirks = ref<Chip8Quirks>({ ...QUIRK_PRESETS["CHIP-8"] });

/**
 * This ref stores whether audio output is muted.
 */
const isMuted = ref(true);

const hasRom = computed(() => pendingRomBytes.value !== null);

const showAllRoms = ref(false);

const activeRomLabel = ref<string | null>(null);

/**
 * This ref stores the current program counter value.
 */
const programCounter = ref(0x200);

/**
 * This computed value exposes the active quirk preset name.
 */
const quirkPresetLabel = computed(() => getQuirkPresetLabel(quirks.value));

/**
 * This computed value exposes the run button label.
 */
const runButtonLabel = computed(() => (isRunning.value ? "Pause" : "Start"));

/**
 * This computed value exposes the program counter display.
 */
const programCounterLabel = computed(() => {
  const hex = programCounter.value.toString(16).toUpperCase().padStart(4, "0");
  return `0x${hex}`;
});

/**
 * This computed value exposes the current sound state.
 */
const soundLabel = computed(() => (soundTimerValue.value > 0 ? "Beep" : "Silent"));

/**
 * This computed value indicates an uploaded ROM is active.
 */
const isUploadedRomActive = computed(
  () => hasRom.value && activeRomLabel.value === null,
);

/**
 * This instance represents the emulator client boundary.
 */
let emulator: Chip8Client = new StubChip8Client();

/**
 * This map translates keyboard keys into CHIP-8 key indices.
 */
const keyMap: Record<string, number> = {
  "1": 0x1,
  "2": 0x2,
  "3": 0x3,
  "4": 0xC,
  q: 0x4,
  w: 0x5,
  e: 0x6,
  r: 0xD,
  a: 0x7,
  s: 0x8,
  d: 0x9,
  f: 0xE,
  z: 0xA,
  x: 0x0,
  c: 0xB,
  v: 0xF,
};

/**
 * This value stores the current 16-key input state.
 */
let keyMask: Chip8KeyMask = 0;

/**
 * This value stores the current animation frame request id.
 */
let rafId = 0;

/**
 * This value stores the last loop timestamp in milliseconds.
 */
let lastFrameMs = 0;

/**
 * This value accumulates time for CPU cycle budgeting.
 */
let cpuAccumulatorMs = 0;

/**
 * This value accumulates time for 60Hz timer ticks.
 */
let timerAccumulatorMs = 0;

/**
 * This value accumulates time for rendering at a steady rate.
 */
let frameAccumulatorMs = 0;

/**
 * This value stores the 2D canvas context for drawing.
 */
let canvasContext: CanvasRenderingContext2D | null = null;

/**
 * This value stores the reusable ImageData buffer.
 */
let imageData: ImageData | null = null;

/**
 * This value stores the audio context for sound output.
 */
let audioContext: AudioContext | null = null;

/**
 * This value stores the oscillator used for the beep tone.
 */
let toneOscillator: OscillatorNode | null = null;

/**
 * This value stores the gain node for volume control.
 */
let toneGain: GainNode | null = null;

/**
 * This value stores the most recent ROM bytes for reloads.
 */
const pendingRomBytes = ref<Uint8Array | null>(null);

/**
 * This function toggles the preset ROM list expansion.
 * @returns No return value.
 */
function toggleRomList(): void {
  showAllRoms.value = !showAllRoms.value;
}

/**
 * This function checks whether a preset ROM is currently active.
 * @param label The preset ROM label.
 * @returns True if the preset ROM is active.
 */
function isActiveRom(label: string): boolean {
  return activeRomLabel.value === label;
}

/**
 * This function compares two quirk configurations.
 * @param left The first quirk configuration.
 * @param right The second quirk configuration.
 * @returns True if all flags match.
 */
function quirksMatch(left: Chip8Quirks, right: Chip8Quirks): boolean {
  return (
    left.incrementIOnStore === right.incrementIOnStore &&
    left.resetVfOnLogic === right.resetVfOnLogic &&
    left.wrapDraw === right.wrapDraw &&
    left.shiftUsesVx === right.shiftUsesVx
  );
}

/**
 * This function determines the preset name for a quirk configuration.
 * @param current The current quirk configuration.
 * @returns The preset label or Custom if no match.
 */
function getQuirkPresetLabel(current: Chip8Quirks): string {
  for (const [label, preset] of Object.entries(QUIRK_PRESETS)) {
    if (quirksMatch(current, preset)) {
      return label;
    }
  }
  return "Custom";
}

/**
 * This function applies a preset selected from the dropdown.
 * @param event The select change event.
 * @returns No return value.
 */
function selectQuirkPreset(event: Event): void {
  const target = event.target as HTMLSelectElement | null;
  const value = target?.value;
  if (!value || !(value in QUIRK_PRESETS)) {
    return;
  }
  quirks.value = { ...QUIRK_PRESETS[value] };
}

/**
 * This function configures the canvas for 1:1 pixel rendering.
 * @returns No return value.
 */
function configureCanvas(): void {
  const canvas = canvasRef.value;

  if (!canvas) {
    return;
  }

  canvasContext = canvas.getContext("2d");

  if (!canvasContext) {
    return;
  }

  canvasContext.imageSmoothingEnabled = false;
  imageData = canvasContext.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
}

/**
 * This function renders the current framebuffer onto the canvas.
 * @returns No return value.
 */
function renderFrame(): void {
  if (!canvasContext || !imageData) {
    return;
  }

  const framebuffer = emulator.framebuffer();
  const target = imageData.data;

  for (let index = 0; index < framebuffer.length; index += 1) {
    const isOn = framebuffer[index] === 1;
    const offset = index * 4;

    target[offset] = 0;
    target[offset + 1] = isOn ? 255 : 0;
    target[offset + 2] = 0;
    target[offset + 3] = 255;
  }

  canvasContext.putImageData(imageData, 0, 0);
}

/**
 * This function ensures the audio context is ready for playback.
 * @returns No return value.
 */
function ensureAudioContext(): void {
  if (!audioContext) {
    audioContext = new AudioContext();
    toneGain = audioContext.createGain();
    toneGain.gain.value = 0;
    toneGain.connect(audioContext.destination);
    toneOscillator = audioContext.createOscillator();
    toneOscillator.type = "square";
    toneOscillator.frequency.value = 440;
    toneOscillator.connect(toneGain);
    toneOscillator.start();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
}

/**
 * This function updates the beep volume based on sound state.
 * @returns No return value.
 */
function updateSoundState(): void {
  if (!toneGain) {
    return;
  }

  const shouldPlay = !isMuted.value && isRunning.value && soundTimerValue.value > 0;
  toneGain.gain.value = shouldPlay ? 0.2 : 0;
}

/**
 * This function toggles the mute state for audio output.
 * @returns No return value.
 */
function toggleMute(): void {
  isMuted.value = !isMuted.value;
  if (!isMuted.value) {
    ensureAudioContext();
  }
  updateSoundState();
}

/**
 * This function starts the animation loop.
 * @returns No return value.
 */
function startLoop(): void {
  if (isRunning.value || !pendingRomBytes.value) {
    return;
  }

  isRunning.value = true;
  ensureAudioContext();
  lastFrameMs = performance.now();
  frameAccumulatorMs = 0;
  updateSoundState();
  rafId = window.requestAnimationFrame(loop);
}

/**
 * This function toggles between running and paused states.
 * @returns No return value.
 */
function toggleRunState(): void {
  if (isRunning.value) {
    stopLoop();
  } else {
    startLoop();
  }
}

/**
 * This function stops the animation loop.
 * @returns No return value.
 */
function stopLoop(): void {
  if (!isRunning.value) {
    return;
  }

  isRunning.value = false;
  window.cancelAnimationFrame(rafId);
  updateSoundState();
}

/**
 * This function runs the main loop and schedules the next frame.
 * @param timestamp The current animation frame timestamp.
 * @returns No return value.
 */
function loop(timestamp: number): void {
  if (!isRunning.value) {
    return;
  }

  const deltaMs = timestamp - lastFrameMs;
  lastFrameMs = timestamp;
  cpuAccumulatorMs += deltaMs;
  timerAccumulatorMs += deltaMs;
  frameAccumulatorMs += deltaMs;

  const cyclesPerMs = CYCLES_PER_SECOND / 1000;
  const cyclesToRun = Math.floor(cpuAccumulatorMs * cyclesPerMs);

  const timerTicks = Math.floor(timerAccumulatorMs / TIMER_INTERVAL_MS);
  if (timerTicks > 0) {
    emulator.tickTimers(timerTicks);
    timerAccumulatorMs -= timerTicks * TIMER_INTERVAL_MS;
  }

  if (cyclesToRun > 0) {
    const cappedCycles = Math.min(cyclesToRun, MAX_CYCLES_PER_FRAME);
    emulator.tick(cappedCycles);
    cpuAccumulatorMs -= cappedCycles / cyclesPerMs;
  }

  programCounter.value = emulator.programCounter();
  soundTimerValue.value = emulator.soundTimer();
  updateSoundState();

  if (frameAccumulatorMs >= FRAME_INTERVAL_MS) {
    frameAccumulatorMs -= FRAME_INTERVAL_MS;
    renderFrame();
  }

  rafId = window.requestAnimationFrame(loop);
}

/**
 * This function advances the emulator by a single instruction.
 * @returns No return value.
 */
function stepOnce(): void {
  if (isRunning.value || !pendingRomBytes.value) {
    return;
  }

  emulator.tick(1);
  programCounter.value = emulator.programCounter();
  soundTimerValue.value = emulator.soundTimer();
  updateSoundState();
  renderFrame();
}

/**
 * This function loads a ROM file and forwards it to the emulator.
 * @param event The file input change event.
 * @returns A promise that resolves when the file is loaded.
 */
async function handleRomChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];

  if (!file) {
    return;
  }

  const buffer = await file.arrayBuffer();

  stopLoop();
  activeRomLabel.value = null;
  applyRomBytes(new Uint8Array(buffer), file.name);
}

/**
 * This function loads a preset ROM by label.
 * @param label The preset ROM label.
 * @returns A promise that resolves when the ROM is loaded.
 */
async function loadPresetRom(label: string): Promise<void> {
  const path = ROM_PRESETS[label];
  if (!path) {
    return;
  }

  stopLoop();
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ROM: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    activeRomLabel.value = label;
    applyRomBytes(new Uint8Array(buffer), label);
  } catch (error) {
    console.error("Failed to load the preset ROM.", error);
  }
}

/**
 * This function stores ROM bytes and restarts the emulator.
 * @param romBytes The ROM bytes to load.
 * @param label The label to display for the ROM.
 * @returns No return value.
 */
function applyRomBytes(romBytes: Uint8Array, label: string): void {
  pendingRomBytes.value = romBytes;
  romLabel.value = label;
  resetEmulator();
}

/**
 * This function applies a key press to the input mask.
 * @param keyIndex The CHIP-8 key index.
 * @param pressed Whether the key is pressed or released.
 * @returns No return value.
 */
function updateKeyMask(keyIndex: number, pressed: boolean): void {
  const bit = 1 << keyIndex;

  if (pressed) {
    keyMask |= bit;
  } else {
    keyMask &= ~bit;
  }

  emulator.setKeys(keyMask);
}

/**
 * This function handles keydown events and updates input state.
 * @param event The keyboard event.
 * @returns No return value.
 */
function handleKeyDown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase();
  const mappedKey = keyMap[key];

  if (mappedKey === undefined) {
    return;
  }

  event.preventDefault();
  updateKeyMask(mappedKey, true);
}

/**
 * This function handles keyup events and updates input state.
 * @param event The keyboard event.
 * @returns No return value.
 */
function handleKeyUp(event: KeyboardEvent): void {
  const key = event.key.toLowerCase();
  const mappedKey = keyMap[key];

  if (mappedKey === undefined) {
    return;
  }

  event.preventDefault();
  updateKeyMask(mappedKey, false);
}

/**
 * This function resets the emulator and redraws the screen.
 * @returns No return value.
 */
function resetEmulator(): void {
  emulator.setQuirks(quirks.value);
  emulator.reset();
  cpuAccumulatorMs = 0;
  timerAccumulatorMs = 0;
  frameAccumulatorMs = 0;
  lastFrameMs = performance.now();
  if (pendingRomBytes.value) {
    emulator.loadRom(pendingRomBytes.value);
  }
  programCounter.value = emulator.programCounter();
  soundTimerValue.value = emulator.soundTimer();
  updateSoundState();
  renderFrame();
}

/**
 * This function initializes the WASM-backed emulator instance.
 * @returns A promise that resolves when initialization is complete.
 */
async function initEmulator(): Promise<void> {
  try {
    emulator = await createWasmClient();
    emulator.setKeys(keyMask);
    emulator.setQuirks(quirks.value);
    if (pendingRomBytes.value) {
      emulator.loadRom(pendingRomBytes.value);
    }
    programCounter.value = emulator.programCounter();
    soundTimerValue.value = emulator.soundTimer();
    updateSoundState();
    renderFrame();
  } catch (error) {
    console.error("Failed to initialize the WASM emulator.", error);
  }
}

/**
 * This lifecycle hook prepares the canvas and input listeners.
 * @returns No return value.
 */
onMounted(() => {
  configureCanvas();
  renderFrame();
  void initEmulator();
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
});

/**
 * This lifecycle hook cleans up listeners and animation frames.
 * @returns No return value.
 */
onBeforeUnmount(() => {
  stopLoop();
  if (toneOscillator) {
    toneOscillator.stop();
    toneOscillator.disconnect();
  }
  if (toneGain) {
    toneGain.disconnect();
  }
  if (audioContext) {
    void audioContext.close();
  }
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});
</script>
