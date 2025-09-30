// Purpose: Central config for ffmpeg core assets and cache naming.
// We use the public UMD build of @ffmpeg/core that matches @ffmpeg/ffmpeg 0.12.x.
// These files will be precached via the Cache Storage API and optionally served as blob URLs.

export const FFMPEG_CORE_VERSION = "0.12.10"; // compatible with @ffmpeg/ffmpeg ^0.12

// Base URL of the UMD build on a public CDN. You can replace this with your own hosting later.
export const FFMPEG_CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

// Full URLs for core JS and WASM assets.
export const CORE_JS_URL = `${FFMPEG_CORE_BASE}/ffmpeg-core.js`;
export const CORE_WASM_URL = `${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`;

// Cache Storage bucket name we use for these assets.
export const FFMPEG_CACHE_NAME = "ffmpeg-core-cache-v1";
