import { sampleGrayscaleFrames } from "./ffmpeg.js";

/** dHash works on a 9x8 grid: each row yields 8 bits by comparing neighbouring pixels. */
const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;
const FRAMES = 4;
const BITS_PER_FRAME = (HASH_WIDTH - 1) * HASH_HEIGHT;

/**
 * Difference hash of a single greyscale frame. Comparing each pixel with the one
 * to its right makes the result depend on structure rather than on brightness,
 * so re-encoding or rescaling the same footage lands on a near-identical hash.
 */
export function differenceHash(frame: Buffer, width = HASH_WIDTH, height = HASH_HEIGHT): string {
  let bits = "";

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width - 1; column += 1) {
      const left = frame[row * width + column] ?? 0;
      const right = frame[row * width + column + 1] ?? 0;
      bits += left > right ? "1" : "0";
    }
  }

  let hex = "";
  for (let index = 0; index < bits.length; index += 4) {
    hex += parseInt(bits.slice(index, index + 4).padEnd(4, "0"), 2).toString(16);
  }

  return hex;
}

const POPCOUNT = Array.from({ length: 16 }, (_, value) => value.toString(2).split("1").length - 1);

/** Number of differing bits between two hex fingerprints of equal length. */
export function hammingDistance(left: string, right: string): number {
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;

  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const difference = parseInt(left[index]!, 16) ^ parseInt(right[index]!, 16);
    distance += POPCOUNT[difference] ?? 0;
  }

  return distance;
}

/** Two videos are treated as the same content when under 12% of their bits differ. */
export const DUPLICATE_THRESHOLD_RATIO = 0.12;

export function isNearDuplicate(left: string, right: string): boolean {
  const totalBits = left.length * 4;
  return hammingDistance(left, right) <= Math.floor(totalBits * DUPLICATE_THRESHOLD_RATIO);
}

/**
 * Samples frames across the whole video and concatenates their hashes, so a clip
 * only matches when it looks the same from start to finish.
 */
export async function fingerprintVideo(filePath: string, durationSeconds: number): Promise<string | null> {
  try {
    const frames = await sampleGrayscaleFrames(filePath, durationSeconds, FRAMES, HASH_WIDTH, HASH_HEIGHT);
    if (frames.length === 0) return null;

    const hashes = frames.slice(0, FRAMES).map((frame) => differenceHash(frame));
    while (hashes.length < FRAMES) hashes.push(hashes[hashes.length - 1] ?? "0".repeat(BITS_PER_FRAME / 4));

    return hashes.join("");
  } catch {
    return null;
  }
}
