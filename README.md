# Chip-8 Vue

This is a Vue 3 + Vite + TypeScript frontend that consumes a Chip-8 client interface.

## Status

- The UI is wired to a stub Chip-8 client so the canvas loop can be verified.
- The stub client lives at `src/wasm/chip8Client.ts` and is designed to be replaced.

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`

## Planned WASM Integration

- The Vue app will import a WASM-backed Chip-8 client package.
- In this repo, the package can be built in the Rust library and consumed via a local file dependency.
- The public interface should match the `Chip8Client` interface in `src/wasm/chip8Client.ts`.

## Project Layout

- `index.html` app entry point
- `src/main.ts` Vue bootstrapping
- `src/App.vue` UI shell
- `src/styles.css` app styling
- `src/wasm/chip8Client.ts` stub client and interface contract
