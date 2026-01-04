/* This module defines the boundary for a Chip-8 client implementation. */

/**
 * This type stores the 16-key input state as a bitmask.
 */
export type Chip8KeyMask = number;

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
   * This exposes the emulator framebuffer as a 64x32 byte array.
   * @returns The framebuffer view for rendering.
   */
  framebuffer(): Uint8Array;

  /**
   * This returns the current sound timer value.
   * @returns The current sound timer value.
   */
  soundTimer(): number;
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

  /**
   * This constructs a stub client with an empty framebuffer.
   * @returns No return value.
   */
  public constructor() {
    this.framebufferData = new Uint8Array(64 * 32);
    this.frameCounter = 0;
    this.keyMask = 0;
  }

  /**
   * This resets the animation and clears the framebuffer.
   * @returns No return value.
   */
  public reset(): void {
    this.framebufferData.fill(0);
    this.frameCounter = 0;
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

    const x = this.frameCounter % 64;
    const y = Math.floor(this.frameCounter / 64) % 32;

    this.framebufferData.fill(0);
    this.framebufferData[y * 64 + x] = 1;

    if (this.keyMask !== 0) {
      this.framebufferData[0] = 1;
    }
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
}
