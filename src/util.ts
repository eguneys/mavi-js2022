export const PI = Math.PI;
export const HALFPI = PI / 2;
export const THIRDPI = PI / 3;
export const TAU = PI * 2;
export const THIRDTAU = TAU / 3;

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function randInt(min,max) {
  return Math.floor(rand(min,max));
}

export function randItem(items) {
  return items[randInt(0, items.length)];
}

export function sinh(v) {
  return (Math.sin(v) + 1) / 2;
}

export function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

export function round(x) {
  return Math.round(x * 100) / 100;
}

export function now() { return Date.now(); }
