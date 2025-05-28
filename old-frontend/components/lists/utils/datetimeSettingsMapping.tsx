import { EntityTypeName } from 'types/entities';

type DatetimeSettings = {
  datetimeType: 'date' | 'datetime';
  startField: string;
  endField: string;
  hidePrevious: boolean;
  allowShowPrevious: boolean;
  monthsAhead?: number;
  maxMonthsAhead?: number;
  monthsAheadPerLoad?: number;
};

const pastHiddenConfig: DatetimeSettings = {
  datetimeType: 'date',
  startField: 'start_date',
  endField: 'end_date',
  hidePrevious: true,
  allowShowPrevious: false
};

const yearAheadConfig = {
  monthsAhead: 12,
  maxMonthsAhead: 36,
  monthsAheadPerLoad: 12
};

const pastLoadableConfig: DatetimeSettings = {
  datetimeType: 'date',
  startField: 'start_date',
  endField: 'end_date',
  hidePrevious: true,
  allowShowPrevious: true
};

export const datetimeSettingsMapping: {
  [key in EntityTypeName]?: DatetimeSettings;
} = {
  Trip: pastLoadableConfig,
  SchoolBreak: pastLoadableConfig,
  DaysOff: pastLoadableConfig,
  Holiday: { ...pastHiddenConfig, ...yearAheadConfig }
};
