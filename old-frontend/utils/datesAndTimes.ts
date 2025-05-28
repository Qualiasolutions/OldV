import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'intl';
import 'intl/locale-data/jsonp/en';

dayjs.extend(utc);
dayjs.extend(timezone);

const getTimeInTimezone = (datetime: string, tz: string) => {
  return new Date(datetime).toLocaleString('en-US', {
    timeZone: tz
  });
};

const getDateStringFromDateObject = (
  date: Date,
  useUtc: boolean = false
): string => {
  const dayjsFunction = useUtc ? dayjs.utc : dayjs;
  return dayjsFunction(date).format('YYYY-MM-DD');
};

const getTimeStringFromDateObject = (date: Date): string => {
  return dayjs(date).format('HH:mm');
};

const getDateWithoutTimezone = (date: string): Date => {
  return new Date(`${date}T00:00:00Z`);
};

const getLongDateFromDateObject = (
  date: Date,
  useUtc: boolean = false
): string => {
  if (useUtc) {
    return dayjs.utc(date).format('MMM DD, YYYY');
  }
  return dayjs(date).format('MMM DD, YYYY');
};

const getDatesPeriodString = (
  startDate: Date,
  endDate: Date,
  useUtc: boolean = false
): string => {
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameDate =
    getLongDateFromDateObject(startDate, useUtc) ===
    getLongDateFromDateObject(endDate, useUtc);

  if (sameDate) {
    return getLongDateFromDateObject(startDate, useUtc);
  }

  if (sameYear) {
    if (useUtc) {
      return `${dayjs.utc(startDate).format('MMM DD')} - ${dayjs
        .utc(endDate)
        .format('MMM DD YYYY')}`;
    } else {
      return `${dayjs(startDate).format('MMM DD')} - ${dayjs(endDate).format(
        'MMM DD YYYY'
      )}`;
    }
  }

  return `${getLongDateFromDateObject(
    startDate,
    useUtc
  )} - ${getLongDateFromDateObject(endDate, useUtc)}`;
};

type UTCValues = {
  day: number;
  month: number;
  monthShortName: string;
  monthName: string;
  year: number;
};

const getUTCValuesFromDateString = (date: string): UTCValues => {
  const utcDate = getDateWithoutTimezone(date);
  const dayJsDate = dayjs.utc(utcDate);

  return {
    day: dayJsDate.date(),
    month: dayJsDate.month(),
    monthShortName: dayJsDate.format('MMM'),
    monthName: dayJsDate.format('MMMM'),
    year: dayJsDate.year()
  };
};

const getUTCValuesFromDateTimeString = (datetime: string): UTCValues => {
  const utcDate = new Date(datetime);
  const dayJsDate = dayjs.utc(utcDate);

  return {
    day: dayJsDate.date(),
    month: dayJsDate.month(),
    monthShortName: dayJsDate.format('MMM'),
    monthName: dayJsDate.format('MMMM'),
    year: dayJsDate.year()
  };
};

const getDatesBetween = (
  start: string | Date,
  end: string | Date,
  useUtc: boolean = false
): Date[] => {
  /*
    Edge cases considered:
      - If a task ends at midnight then it should not include the last day
      - If a task has start_date and end_date at midnight then it should only
        include the day that starts at midnight
      - If a task has start_date and end_date the same and at midnight then it should
        include the day that starts at midnight
  */
  const datesArray = [];
  const dayjsFunction = useUtc ? dayjs.utc : dayjs;

  let parsedEnd = end
  if (typeof end === 'string' && end.length < 12) {
    // e.g. 2020-01-01
    // Go to the middle of the final day so that the final day will
    // be included in the date range
    parsedEnd = new Date(end)
    parsedEnd.setHours(parsedEnd.getHours() + 12)
  }

  const secondBeforeEnd = dayjsFunction(parsedEnd).toDate();
  secondBeforeEnd.setSeconds(secondBeforeEnd.getSeconds() - 1);
  const latestAllowed = new Date(
    Math.max(Number(secondBeforeEnd), Number(dayjsFunction(start).toDate()))
  );
  latestAllowed.setHours(23);
  latestAllowed.setMinutes(59);
  latestAllowed.setSeconds(59);

  let dt = dayjsFunction(start).toDate();
  while (dt <= latestAllowed) {
    datesArray.push(dayjsFunction(dt).toDate());
    dt.setDate(dt.getDate() + 1);
  }

  return datesArray;
};

const getDateStringsBetween = (
  start: string | Date,
  end: string | Date,
  useUtc: boolean = false
): string[] => {
  const datesArray = getDatesBetween(start, end, useUtc);
  return datesArray.map((date) => getDateStringFromDateObject(date, useUtc));
};

function getNextDate(startDate: Date): Date {
  const startDateCopy = new Date(startDate.getTime());
  const dateNow = new Date();
  while (startDateCopy < dateNow) {
    // Pretty inefficient
    startDateCopy.setFullYear(startDateCopy.getFullYear() + 1);
  }
  return startDateCopy;
}

function getDaysToAge(startDate: Date): {
  days: number;
  age: number;
  month: number;
  monthName: string;
  date: number;
  year: number;
} {
  const nextOccurrence = getNextDate(startDate);
  const todayDate = new Date();
  const millisecondsDifference = nextOccurrence.getTime() - todayDate.getTime();
  const daysDifference = Math.ceil(
    millisecondsDifference / (1000 * 60 * 60 * 24)
  );

  const nextYear = nextOccurrence.getUTCFullYear();
  const age = nextYear - startDate.getUTCFullYear();

  const monthName = dayjs.utc(nextOccurrence).format('MMMM');

  return {
    days: daysDifference,
    age,
    date: nextOccurrence.getUTCDate(),
    month: nextOccurrence.getUTCMonth() + 1,
    monthName,
    year: nextYear
  };
}

function getCurrentDateString() {
  return getDateStringFromDateObject(new Date());
}

function getCurrentDateTimeString() {
  return dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss');
}

const getOffsetMonthStartDateString = (
  date: Date,
  offset: number
): {
  date: Date;
  dateString: string;
} => {
  const dateCopy = new Date(date.getTime());
  dateCopy.setHours(0);
  dateCopy.setMinutes(0);
  dateCopy.setSeconds(0);
  dateCopy.setMilliseconds(0);
  dateCopy.setDate(1);
  dateCopy.setMonth(dateCopy.getMonth() + offset);
  return {
    date: dateCopy,
    dateString: dayjs.utc(dateCopy).format('YYYY-MM-DDTHH:mm:ss') + 'Z'
  };
};

const getEndOfDay = (datetime: Date) => {
  const endOfDay = new Date(datetime);
  endOfDay.setHours(23);
  endOfDay.setMinutes(59);
  endOfDay.setSeconds(59);
  endOfDay.setMilliseconds(0);
  return endOfDay;
};

const getStartOfDay = (datetime: Date) => {
  const startOfDay = new Date(datetime);
  startOfDay.setHours(0);
  startOfDay.setMinutes(0);
  startOfDay.setSeconds(0);
  startOfDay.setMilliseconds(0);
  return startOfDay;
};

const parseSummaryTime = (datetimeString: string) => {
  const now = new Date();
  const datetime = new Date(datetimeString);

  const nowDateString = getDateStringFromDateObject(now);
  const datetimeDateString = getDateStringFromDateObject(datetime);

  if (nowDateString === datetimeDateString) {
    return getTimeStringFromDateObject(datetime);
  }

  const dateString = getDateStringFromDateObject(datetime);
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const getHumanReadableDate = (dateString: string) => {
  return getLongDateFromDateObject(getDateWithoutTimezone(dateString));
};

const getHumanReadableDateTime = (dateTimeString: string) => {
  return dayjs(dateTimeString).format('HH:mm MMM DD, YYYY');
};

export {
  getTimeInTimezone,
  getDateStringFromDateObject,
  getTimeStringFromDateObject,
  getCurrentDateString,
  getCurrentDateTimeString,
  getDateWithoutTimezone,
  getLongDateFromDateObject,
  getDatesPeriodString,
  getUTCValuesFromDateString,
  getUTCValuesFromDateTimeString,
  getDatesBetween,
  getDateStringsBetween,
  getDaysToAge,
  getNextDate,
  getOffsetMonthStartDateString,
  getEndOfDay,
  getStartOfDay,
  parseSummaryTime,
  getHumanReadableDate,
  getHumanReadableDateTime
};
