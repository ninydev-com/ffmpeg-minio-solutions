# FFmpeg + Next.js Demo

A demo project showcasing how to use FFmpeg (via ffmpeg.wasm) in a Next.js environment. It demonstrates how to:
- capture media from the camera and microphone in the browser,
- cache FFmpeg artifacts to speed up startup,
- process recorded media files (transcoding/conversion) entirely client-side, without a server.

![Demo screenshot](screenshot.png)

---

## How to run the project

Requirements:
- Node.js 18+ (LTS recommended)
- npm or yarn (choose one package manager)

Steps:
1) Install dependencies in the `nextjs` folder:
   - npm i
   - or: yarn
2) Start the dev server:
   - npm run dev
   - or: yarn dev
3) Open http://localhost:3000 in your browser

Production build:
- npm run build && npm run start
- or: yarn build && yarn start

Important:
- The browser will request permission to use the camera.
- In some browsers, access to the camera/microphone is only available over HTTPS or on `localhost`.

---

## Main components

1) FFmpeg cache
   - Path: `components/converter/front/cacheFfmpeg/ffmpegCache.ts`.
   - Responsible for caching ffmpeg.wasm binaries and data (e.g., in memory/IndexedDB) so repeated runs don’t waste time re-downloading. Provides load, read, and cache cleanup.

2) Camera handling
   - Files: `components/recorder/media.ts`, `components/recorder/RecorderDashboard.tsx`.
   - Uses MediaDevices.getUserMedia / MediaRecorder to capture video/audio in the browser. Manages permission prompts, start/stop recording, and passes media blobs further down the processing pipeline.

3) Processing recorded media
   - Frontend worker components: `components/converter/front/worker/FfmpegWorkerPanel.tsx` and related modules.
   - Runs ffmpeg.wasm inside a Web Worker, performs transcoding/conversion of recorded files, track/preview extraction, and other operations — all on the client side.

---

## Author

**Oleksandr Nykytin**

- Website: [ninydev.com](https://ninydev.com)
- Email: [keeper@ninydev.com](mailto:keeper@ninydev.com)
