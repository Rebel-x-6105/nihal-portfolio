// CSS is the single source for canvas, WebGL, and interface colors.
const styles = getComputedStyle(document.documentElement);
const read = (name) => styles.getPropertyValue(name).trim();
const rgb = (hex) =>
  [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
    .join(",");
export const palette = {
  foreground: read("--foreground"),
  accent: read("--accent"),
  interactionRed: read("--interaction-red"),
  interactionRedRgb: rgb(read("--interaction-red")),
  foregroundRgb: rgb(read("--foreground")),
  accentRgb: rgb(read("--accent")),
};
