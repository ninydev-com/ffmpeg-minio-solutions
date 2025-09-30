import Image from "next/image";
import { RecorderProvider, VideoRecorder, RecorderDashboard } from "../../components/recorder";
import { FfmpegCacheManager } from "../../components/converter/front/cacheFfmpeg";
import { FfmpegWorkerPanel } from "../../components/converter/front/worker";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        {/* FFmpeg cache controls */}
        <div className="w-full max-w-xl">
          <FfmpegCacheManager />
        </div>

        <RecorderProvider>
          <VideoRecorder />
          <RecorderDashboard />

          {/* Worker-based processing panel */}
          <div className="w-full max-w-2xl mt-4">
            <FfmpegWorkerPanel />
          </div>
        </RecorderProvider>

      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}
