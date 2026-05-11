import type { CSSProperties, ChangeEvent } from "react";

import { EnterFullscreenIcon } from "../../shared/components/icons/EnterFullscreenIcon";
import { ExitFullscreenIcon } from "../../shared/components/icons/ExitFullscreenIcon";
import { VolumeHighIcon } from "../../shared/components/icons/VolumeHighIcon";
import { VolumeMutedIcon } from "../../shared/components/icons/VolumeMutedIcon";

interface PlayerControlsProps {
  isVisible: boolean;
  isMuted: boolean;
  volume: number;
  isFullscreen: boolean;
  onMuteToggle: () => void;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFullscreenToggle: () => void;
}

export const PlayerControls = ({
  isVisible,
  isMuted,
  volume,
  isFullscreen,
  onMuteToggle,
  onVolumeChange,
  onFullscreenToggle,
}: PlayerControlsProps) => {
  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div className={`controls-overlay${isVisible ? " visible" : ""}`}>
      <div className="controls-left">
        <button
          className="control-button"
          type="button"
          onClick={onMuteToggle}
          aria-label={isMuted || volume === 0 ? "ミュート解除" : "ミュート"}
          title={isMuted || volume === 0 ? "ミュート解除" : "ミュート"}
        >
          {isMuted || volume === 0 ? (
            <VolumeMutedIcon className="control-icon" />
          ) : (
            <VolumeHighIcon className="control-icon" />
          )}
        </button>
        <input
          className="volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={effectiveVolume}
          onChange={onVolumeChange}
          aria-label="音量"
          style={{ "--volume-level": `${effectiveVolume * 100}%` } as CSSProperties}
        />
      </div>
      <div className="controls-right">
        <button
          className="control-button"
          type="button"
          onClick={onFullscreenToggle}
          aria-label={isFullscreen ? "全画面を終了" : "全画面"}
          title={isFullscreen ? "全画面を終了" : "全画面"}
        >
          {isFullscreen ? (
            <ExitFullscreenIcon className="control-icon" />
          ) : (
            <EnterFullscreenIcon className="control-icon" />
          )}
        </button>
      </div>
    </div>
  );
};
