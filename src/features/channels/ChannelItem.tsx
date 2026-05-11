import { formatDuration, formatTime, getProgramProgress } from "../../shared/lib/time";
import type { ScheduleItem } from "../schedules/types";

interface ChannelItemProps {
  item: ScheduleItem;
  currentTime: number;
  isActive: boolean;
  onSelect: (channelId: number, name: string) => void;
}

export const ChannelItem = ({
  item,
  currentTime,
  isActive,
  onSelect,
}: ChannelItemProps) => {
  const program = item.programs[0];

  return (
    <div
      className={`channel-item ${isActive ? "active" : ""}`}
      onClick={() => onSelect(item.channel.id, item.channel.name)}
    >
      <div className="channel-item-name">{item.channel.name}</div>
      <div className="channel-item-program">
        {program ? program.name : "No program info"}
      </div>
      {program && (
        <div className="channel-item-time">
          {formatTime(program.startAt)} - {formatTime(program.endAt)} (
          {formatDuration(program.startAt, program.endAt)})
        </div>
      )}
      {program?.description && (
        <div className="channel-item-desc">{program.description}</div>
      )}
      {program && (
        <div className="channel-item-progress">
          <div
            className="channel-item-progress-bar"
            style={{ width: `${getProgramProgress(program, currentTime)}%` }}
          />
        </div>
      )}
    </div>
  );
};
