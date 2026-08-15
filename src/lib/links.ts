/**
 * Every "docs" link on the marketing page resolves to a real heading in the
 * README. If a link here has no destination, the link should not exist.
 */
export const REPO = "https://github.com/swapnil5053/AdaptFlow";

export const DOCS = {
  /** The queue, perceptual hashing, scoped playback grants, the API. */
  internals: `${REPO}#the-parts-worth-looking-at`,
  /** The feature table, including sharing and captions. */
  features: `${REPO}#what-it-does`,
  /** Stack and the request/worker diagram. */
  architecture: `${REPO}#stack`,
  /** Requirements, install, Docker, environment variables. */
  selfHost: `${REPO}#running-it`,
  /** The phone that could not open the video. */
  origin: `${REPO}#the-problem`,
} as const;
