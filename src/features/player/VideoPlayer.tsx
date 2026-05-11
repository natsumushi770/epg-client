import type { ChangeEventHandler, MouseEventHandler, RefObject } from "react";

import { PlayerControls } from "./PlayerControls";

interface VideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  controlsVisible: boolean;
  isMuted: boolean;
  volume: number;
  isFullscreen: boolean;
  onMouseMove: MouseEventHandler<HTMLDivElement>;
  onMouseLeave: MouseEventHandler<HTMLDivElement>;
  onFullscreenToggle: () => void;
  onMuteToggle: () => void;
  onVolumeChange: ChangeEventHandler<HTMLInputElement>;
}

export const VideoPlayer = ({
  videoRef,
  wrapperRef,
  controlsVisible,
  isMuted,
  volume,
  isFullscreen,
  onMouseMove,
  onMouseLeave,
  onFullscreenToggle,
  onMuteToggle,
  onVolumeChange,
}: VideoPlayerProps) => (
  <div
    className="video-wrapper"
    ref={wrapperRef}
    onMouseMove={onMouseMove}
    onDoubleClick={onFullscreenToggle}
    onMouseLeave={onMouseLeave}
  >
    <video ref={videoRef} autoPlay />
    <PlayerControls
      isVisible={controlsVisible}
      isMuted={isMuted}
      volume={volume}
      isFullscreen={isFullscreen}
      onMuteToggle={onMuteToggle}
      onVolumeChange={onVolumeChange}
      onFullscreenToggle={onFullscreenToggle}
    />
  </div>
);
