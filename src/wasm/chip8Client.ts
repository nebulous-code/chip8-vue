/* This module defines the boundary for a Chip-8 client implementation. */

import initWasm, { Chip8Wasm } from "chip8wasm";
import wasmUrl from "chip8wasm/chip8wasm_bg.wasm?url";

/**
 * This type stores the 16-key input state as a bitmask.
 */
export type Chip8KeyMask = number;

/**
 * This type stores the Chip-8 quirk configuration flags.
 */
export type Chip8Quirks = {
  incrementIOnStore: boolean;
  resetVfOnLogic: boolean;
  wrapDraw: boolean;
  shiftUsesVx: boolean;
};

/**
 * This interface describes the API that a Chip-8 implementation should expose.
 */
export interface Chip8Client {
  /**
   * This resets the emulator state to a clean boot state.
   * @returns No return value.
   */
  reset(): void;

  /**
   * This loads a ROM byte buffer into the emulator memory.
   * @param romBytes The ROM bytes to load.
   * @returns No return value.
   */
  loadRom(romBytes: Uint8Array): void;

  /**
   * This updates the keypad state using a 16-bit bitmask.
   * @param mask A bitmask representing the pressed keys.
   * @returns No return value.
   */
  setKeys(mask: Chip8KeyMask): void;

  /**
   * This advances the emulator by a number of CPU cycles.
   * @param cycles The number of cycles to execute.
   * @returns No return value.
   */
  tick(cycles: number): void;

  /**
   * This updates the emulator quirk configuration.
   * @param quirks The quirk configuration to apply.
   * @returns No return value.
   */
  setQuirks(quirks: Chip8Quirks): void;

  /**
   * This advances the delay and sound timers by a number of ticks.
   * @param ticks The number of 60Hz timer ticks to apply.
   * @returns No return value.
   */
  tickTimers(ticks: number): void;

  /**
   * This exposes the emulator framebuffer as a 64x32 byte array.
   * @returns The framebuffer view for rendering.
   */
  framebuffer(): Uint8Array;

  /**
   * This returns the current sound timer value.
   * @returns The current sound timer value.
   */
  soundTimer(): number;

  /**
   * This returns the current program counter address.
   * @returns The current program counter address.
   */
  programCounter(): number;
}

/**
 * This class provides a temporary animation-only implementation for UI scaffolding.
 * TODO: Replace this stub with a real WASM-backed client from the chip8 library.
 */
export class StubChip8Client implements Chip8Client {
  /** This buffer stores a 64x32 monochrome framebuffer. */
  private readonly framebufferData: Uint8Array;
  /** This counter drives a simple moving-pixel animation. */
  private frameCounter: number;
  /** This value stores the current key mask. */
  private keyMask: Chip8KeyMask;
  /** This value stores the current program counter. */
  private programCounterValue: number;

  /**
   * This constructs a stub client with an empty framebuffer.
   * @returns No return value.
   */
  public constructor() {
    this.framebufferData = new Uint8Array(64 * 32);
    this.frameCounter = 0;
    this.keyMask = 0;
    this.programCounterValue = 0x200;
  }

  /**
   * This resets the animation and clears the framebuffer.
   * @returns No return value.
   */
  public reset(): void {
    this.framebufferData.fill(0);
    this.frameCounter = 0;
    this.programCounterValue = 0x200;
  }

  /**
   * This accepts ROM bytes and clears the framebuffer for a fresh start.
   * @param romBytes The ROM bytes to load.
   * @returns No return value.
   */
  public loadRom(romBytes: Uint8Array): void {
    void romBytes;
    this.reset();
  }

  /**
   * This stores the current key mask for UI feedback.
   * @param mask A bitmask representing the pressed keys.
   * @returns No return value.
   */
  public setKeys(mask: Chip8KeyMask): void {
    this.keyMask = mask;
  }

  /**
   * This advances a simple moving pixel to verify rendering.
   * @param cycles The number of cycles to execute.
   * @returns No return value.
   */
  public tick(cycles: number): void {
    const safeCycles = Math.max(1, Math.floor(cycles));
    this.frameCounter += safeCycles;
    this.programCounterValue = (this.programCounterValue + safeCycles * 2) & 0x0fff;

    const x = this.frameCounter % 64;
    const y = Math.floor(this.frameCounter / 64) % 32;

    this.framebufferData.fill(0);
    this.framebufferData[y * 64 + x] = 1;

    if (this.keyMask !== 0) {
      this.framebufferData[0] = 1;
    }
  }

  /**
   * This ignores quirk updates because the stub has no emulator.
   * @param quirks The quirk configuration to apply.
   * @returns No return value.
   */
  public setQuirks(quirks: Chip8Quirks): void {
    void quirks;
  }

  /**
   * This ignores timer ticks because the stub has no timers.
   * @param ticks The number of timer ticks to apply.
   * @returns No return value.
   */
  public tickTimers(ticks: number): void {
    void ticks;
  }

  /**
   * This returns the framebuffer view for rendering.
   * @returns The framebuffer view for rendering.
   */
  public framebuffer(): Uint8Array {
    return this.framebufferData;
  }

  /**
   * This returns zero because the stub does not produce sound.
   * @returns The current sound timer value.
   */
  public soundTimer(): number {
    return 0;
  }

  /**
   * This returns a stubbed program counter value.
   * @returns The current program counter value.
   */
  public programCounter(): number {
    return this.programCounterValue;
  }
}

/**
 * This class wraps the WASM-backed Chip-8 implementation.
 */
export class WasmChip8Client implements Chip8Client {
  /** This field stores the WASM emulator instance. */
  private readonly emulator: Chip8Wasm;
  /** This field stores whether the emulator exposes programCounter. */
  private readonly hasProgramCounter: boolean;

  /**
   * This constructs a WASM-backed Chip-8 client.
   * @param emulator The initialized WASM emulator.
   * @returns No return value.
   */
  public constructor(emulator: Chip8Wasm) {
    this.emulator = emulator;
    this.hasProgramCounter =
      typeof (emulator as unknown as { programCounter?: () => number }).programCounter ===
      "function";
  }

  /**
   * This resets the emulator state to a clean boot state.
   * @returns No return value.
   */
  public reset(): void {
    this.emulator.reset();
  }

  /**
   * This loads a ROM byte buffer into the emulator memory.
   * @param romBytes The ROM bytes to load.
   * @returns No return value.
   */
  public loadRom(romBytes: Uint8Array): void {
    this.emulator.loadRom(romBytes);
  }

  /**
   * This updates the keypad state using a 16-bit bitmask.
   * @param mask A bitmask representing the pressed keys.
   * @returns No return value.
   */
  public setKeys(mask: Chip8KeyMask): void {
    this.emulator.setKeys(mask);
  }

  /**
   * This advances the emulator by a number of CPU cycles.
   * @param cycles The number of cycles to execute.
   * @returns No return value.
   */
  public tick(cycles: number): void {
    this.emulator.tick(cycles);
  }

  /**
   * This updates the emulator quirk configuration.
   * @param quirks The quirk configuration to apply.
   * @returns No return value.
   */
  public setQuirks(quirks: Chip8Quirks): void {
    this.emulator.setQuirks(
      quirks.incrementIOnStore,
      quirks.resetVfOnLogic,
      quirks.wrapDraw,
      quirks.shiftUsesVx,
    );
  }

  /**
   * This advances the delay and sound timers by a number of ticks.
   * @param ticks The number of 60Hz timer ticks to apply.
   * @returns No return value.
   */
  public tickTimers(ticks: number): void {
    this.emulator.tickTimers(ticks);
  }

  /**
   * This exposes the emulator framebuffer as a 64x32 byte array.
   * @returns The framebuffer view for rendering.
   */
  public framebuffer(): Uint8Array {
    return this.emulator.framebuffer();
  }

  /**
   * This returns the current sound timer value.
   * @returns The current sound timer value.
   */
  public soundTimer(): number {
    return this.emulator.soundTimer();
  }

  /**
   * This returns the current program counter value.
   * @returns The current program counter value.
   */
  public programCounter(): number {
    if (!this.hasProgramCounter) {
      return 0x200;
    }
    return this.emulator.programCounter();
  }
}

let wasmInitPromise: Promise<void> | null = null;

/**
 * This function initializes the WASM module once.
 * @returns A promise that resolves when the module is ready.
 */
async function initWasmOnce(): Promise<void> {
  if (!wasmInitPromise) {
    wasmInitPromise = initWasm(wasmUrl).then(() => undefined);
  }
  await wasmInitPromise;
}

/**
 * This function creates a WASM-backed Chip-8 client.
 * @returns A promise that resolves to the Chip-8 client.
 */
export async function createWasmClient(): Promise<Chip8Client> {
  await initWasmOnce();
  return new WasmChip8Client(new Chip8Wasm());
}
