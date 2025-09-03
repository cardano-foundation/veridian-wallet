// make Ionic DOM element types available to ESLint/TS
declare global {
  // Minimal branded property to avoid `@typescript-eslint/no-empty-interface`
  // and make the Ionic input element type available to the linter/TS.
  interface HTMLIonInputElement extends HTMLInputElement {
    __ionBrand?: never;
  }
}
export {};
