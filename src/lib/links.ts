/**
 * Every "docs" link on the marketing page resolves to a real heading in the
 * README. If a link here has no destination, the link should not exist.
 */
export const REPO = "https://github.com/swapnil5053/AdaptFlow";

export const DOCS = {
  /** Per-feature detail: the compatibility engine, the queue, hashing, the API. */
  internals: `${REPO}#what-makes-it-more-than-a-crud-app`,
  /** The full feature table, including sharing and captions. */
  features: `${REPO}#everything-it-does`,
  /** Stack and the request/worker diagram. */
  architecture: `${REPO}#stack`,
  /** Requirements, install, Docker, environment variables. */
  selfHost: `${REPO}#running-it`,
  /** The phone that could not open the video. */
  origin: `${REPO}#why-i-built-this`,
} as const;
