// Deliberate exception to the ES2021 lib pin (Chrome 91 WebView floor):
// `new Error(message, { cause })` is ES2022, but engines without it
// silently ignore the options argument, so it degrades gracefully
// instead of crashing. Declaring it locally keeps the 12 intentional
// call sites compiling without re-enabling the rest of the ES2022 lib.
interface ErrorOptions {
  cause?: unknown;
}

interface ErrorConstructor {
  new (message?: string, options?: ErrorOptions): Error;
  (message?: string, options?: ErrorOptions): Error;
}
