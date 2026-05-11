export interface TvChannel {
  id: number;
  name: string;
  channelType: string;
  serviceId?: number;
  networkId?: number;
  hasLogoData?: boolean;
  remoteControlKeyId?: number;
}

export interface Program {
  id: number;
  name: string;
  description?: string;
  startAt: number;
  endAt: number;
  channelId?: number;
  isFree?: boolean;
}

export interface ScheduleItem {
  channel: TvChannel;
  programs: Program[];
}
