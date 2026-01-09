<template>
  <!-- This main container holds the entire application layout. -->
  <main class="app">
    <!-- This header provides the title and live status. -->
    <header class="app__header">
      <div class="app__branding">
        <h1 class="app__title">Chip-8 Vue</h1>
        <p class="app__subtitle">Vue scaffolding that consumes a Chip-8 client API</p>
      </div>
      <div class="app__status">
        <span class="app__status-label">Status</span>
        <strong class="app__status-value">{{ statusLabel }}</strong>
      </div>
    </header>

    <!-- This section organizes the screen and control panels. -->
    <section class="app__content">
      <!-- This panel contains the CHIP-8 screen and metadata. -->
      <section class="panel panel--screen">
        <!-- This canvas displays the 64x32 framebuffer. -->
        <canvas
          ref="canvasRef"
          class="screen"
          :width="SCREEN_WIDTH"
          :height="SCREEN_HEIGHT"
          aria-label="Chip-8 display"
        ></canvas>
        <!-- This row shows ROM and sound status. -->
        <div class="screen__meta">
          <span>ROM: {{ romLabel }}</span>
          <span>Sound: {{ soundLabel }}</span>
        </div>
      </section>

      <!-- This panel collects input controls and helper text. -->
      <section class="panel panel--controls">
        <div class="controls__group">
          <h2 class="controls__title">Controls</h2>
          <div class="controls__buttons">
            <button type="button" class="button" :disabled="isRunning" @click="startLoop">
              Start
            </button>
            <button type="button" class="button" :disabled="!isRunning" @click="stopLoop">
              Stop
            </button>
            <button type="button" class="button button--ghost" @click="resetEmulator">
              Reset
            </button>
          </div>
        </div>

        <div class="controls__group">
          <h2 class="controls__title">ROM</h2>
          <p class="controls__hint">Load a .ch8 file to replace the stub animation.</p>
          <input
            class="file-input"
            type="file"
            accept=".ch8"
            @change="handleRomChange"
          />
        </div>

        <div class="controls__group">
          <h2 class="controls__title">Keypad Mapping</h2>
          <p class="controls__hint">Keyboard input maps to the classic CHIP-8 keypad layout.</p>
          <pre class="keypad">
1 2 3 4     1 2 3 C
Q W E R  => 4 5 6 D
A S D F     7 8 9 E
Z X C V     A 0 B F
          </pre>
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
const CYCLES_PER_SECOND = 700;

/**
 * This constant defines the timer tick rate.
 */
const TIMER_HZ = 60;

/**
 * This constant defines the timer interval in milliseconds.
 */
const TIMER_INTERVAL_MS = 1000 / TIMER_HZ;

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
 * This computed value exposes the current run state.
 */
const statusLabel = computed(() => (isRunning.value ? "Running" : "Stopped"));

/**
 * This computed value exposes the current sound state.
 */
const soundLabel = computed(() => (soundTimerValue.value > 0 ? "Beep" : "Silent"));

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
 * This value stores the 2D canvas context for drawing.
 */
let canvasContext: CanvasRenderingContext2D | null = null;

/**
 * This value stores the reusable ImageData buffer.
 */
let imageData: ImageData | null = null;

/**
 * This value stores the most recent ROM bytes for reloads.
 */
let pendingRomBytes: Uint8Array | null = null;

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
 * This function starts the animation loop.
 * @returns No return value.
 */
function startLoop(): void {
  if (isRunning.value) {
    return;
  }

  isRunning.value = true;
  lastFrameMs = performance.now();
  rafId = window.requestAnimationFrame(loop);
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

  const cyclesPerMs = CYCLES_PER_SECOND / 1000;
  const cyclesToRun = Math.floor(cpuAccumulatorMs * cyclesPerMs);

  const timerTicks = Math.floor(timerAccumulatorMs / TIMER_INTERVAL_MS);
  if (timerTicks > 0) {
    emulator.tickTimers(timerTicks);
    timerAccumulatorMs -= timerTicks * TIMER_INTERVAL_MS;
  }

  if (cyclesToRun > 0) {
    emulator.tick(cyclesToRun);
    cpuAccumulatorMs -= cyclesToRun / cyclesPerMs;
  }

  soundTimerValue.value = emulator.soundTimer();
  renderFrame();

  rafId = window.requestAnimationFrame(loop);
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
  pendingRomBytes = new Uint8Array(buffer);
  romLabel.value = file.name;
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
  emulator.reset();
  cpuAccumulatorMs = 0;
  timerAccumulatorMs = 0;
  lastFrameMs = performance.now();
  if (pendingRomBytes) {
    emulator.loadRom(pendingRomBytes);
  }
  soundTimerValue.value = emulator.soundTimer();
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
    if (pendingRomBytes) {
      emulator.loadRom(pendingRomBytes);
    }
    soundTimerValue.value = emulator.soundTimer();
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
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});
</script>
