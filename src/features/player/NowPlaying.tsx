import { formatDuration, formatTime, getProgramProgress } from "../../shared/lib/time";
import type { Program, TvChannel } from "../schedules/types";

interface NowPlayingProps {
  channel: TvChannel;
  program: Program;
  currentTime: number;
}

export const NowPlaying = ({ channel, program, currentTime }: NowPlayingProps) => (
  <div className="now-playing">
    <div className="now-playing-channel">{channel.name}</div>
    <div className="now-playing-title">{program.name}</div>
    <div className="now-playing-time">
      {formatTime(program.startAt)} - {formatTime(program.endAt)} (
      {formatDuration(program.startAt, program.endAt)})
    </div>
    {program.description && (
      <div className="now-playing-desc">{program.description}</div>
    )}
    <div className="now-playing-progress">
      <div
        className="now-playing-progress-bar"
        style={{ width: `${getProgramProgress(program, currentTime)}%` }}
      />
    </div>
  </div>
);
