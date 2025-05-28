export type ICalType = 'UNKNOWN' | 'GOOGLE' | 'ICLOUD';
export type ICalShareType = 'OFF' | 'BUSY' | 'FULL';

export type ICalIntegration = {
  id: number;
  ical_name: string;
  ical_type: ICalType;
  share_type: ICalShareType;
  user: number;
};

export type ICalIntegrationCreateRequest = {
  ical_url: string;
  user: number;
};

export type ICalIntegrationUpdateRequest = {
  id: number;
  share_type?: ICalShareType;
};
