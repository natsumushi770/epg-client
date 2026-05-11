import { ChannelItem } from "./ChannelItem";
import type { ScheduleItem } from "../schedules/types";

interface ChannelListProps {
  channels: ScheduleItem[];
  currentChannelId: number | null;
  currentTime: number;
  onSelectChannel: (channelId: number, name: string) => void;
}

export const ChannelList = ({
  channels,
  currentChannelId,
  currentTime,
  onSelectChannel,
}: ChannelListProps) => (
  <div className="channel-list">
    {channels.length === 0 ? (
      <div className="channel-item">Loading...</div>
    ) : (
      channels.map((item) => (
        <ChannelItem
          key={item.channel.id}
          item={item}
          currentTime={currentTime}
          isActive={currentChannelId === item.channel.id}
          onSelect={onSelectChannel}
        />
      ))
    )}
  </div>
);
