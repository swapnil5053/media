import { describe, expect, it } from "vitest";
import { differenceHash, hammingDistance, isNearDuplicate } from "../server/media/fingerprint.js";

/** Builds a 9x8 greyscale frame from a function of the pixel position. */
function frame(shade: (x: number, y: number) => number): Buffer {
  const pixels = Buffer.alloc(9 * 8);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      pixels[y * 9 + x] = Math.max(0, Math.min(255, Math.round(shade(x, y))));
    }
  }
  return pixels;
}

const gradient = frame((x) => x * 28);
const brighterGradient = frame((x) => Math.min(255, x * 28 + 40));
const inverted = frame((x) => 255 - x * 28);

describe("difference hash", () => {
  it("produces a 64-bit hash as 16 hex characters", () => {
    expect(differenceHash(gradient)).toHaveLength(16);
  });

  it("is unchanged by a uniform brightness shift", () => {
    expect(differenceHash(brighterGradient)).toBe(differenceHash(gradient));
  });

  it("changes completely when the gradient is reversed", () => {
    const distance = hammingDistance(differenceHash(gradient), differenceHash(inverted));
    expect(distance).toBe(64);
  });
});

describe("hamming distance", () => {
  it("is zero for identical hashes", () => {
    expect(hammingDistance("ff00", "ff00")).toBe(0);
  });

  it("counts differing bits", () => {
    expect(hammingDistance("0", "1")).toBe(1);
    expect(hammingDistance("0", "f")).toBe(4);
  });

  it("refuses to compare hashes of different lengths", () => {
    expect(hammingDistance("ff", "ffff")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("near-duplicate matching", () => {
  const original = "a1b2c3d4e5f60718";

  it("matches a hash with itself", () => {
    expect(isNearDuplicate(original, original)).toBe(true);
  });

  it("tolerates a few flipped bits, as a re-encode would cause", () => {
    const slightlyOff = `a1b2c3d4e5f60719`;
    expect(isNearDuplicate(original, slightlyOff)).toBe(true);
  });

  it("rejects unrelated footage", () => {
    expect(isNearDuplicate(original, "0000000000000000")).toBe(false);
  });
});
