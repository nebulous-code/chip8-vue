/* This file provides type hints for Vite and Vue single-file components. */
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  /**
   * This type represents a Vue single-file component module.
   */
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
