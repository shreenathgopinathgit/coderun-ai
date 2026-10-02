// Ambient module declaration for the Pyodide ESM module loaded from the
// jsDelivr CDN. The browser resolves this at runtime; TypeScript needs a
// declaration to type-check the worker.
declare module 'https://cdn.jsdelivr.net/npm/pyodide@314.0.7/pyodide.mjs' {
  export function loadPyodide(options?: {
    indexURL?: string
  }): Promise<unknown>
}