interface LoopingVideoBackgroundProps {
  videoSrc: string
  scale?: string
}

export function isVideoBgOff(): boolean {
  return localStorage.getItem("video_bg_off") === "1"
}

export function setVideoBgOff(off: boolean) {
  localStorage.setItem("video_bg_off", off ? "1" : "0")
}

export function LoopingVideoBackground({
  videoSrc,
  scale = "100"
}: LoopingVideoBackgroundProps) {
  if (isVideoBgOff()) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`w-full h-full object-cover`}
        style={{ transform: `scale(${scale}%)`, filter: 'blur(2px)' }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      {/* Overlay biar content tetep kebaca */}
      <div className="solid"/>
    </div>
  )
}
