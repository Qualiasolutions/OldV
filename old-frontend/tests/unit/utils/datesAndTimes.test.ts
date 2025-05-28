import {
  getDateStringFromDateObject,
  getTimeStringFromDateObject,
  getDateStringsBetween,
  getUTCValuesFromDateString,
  getDatesPeriodString
} from 'utils/datesAndTimes';

import timezonedDate from 'timezoned-date';

it('datesAndTimes ::: getDateStringFromDateObject', () => {
  const originalDate = Date;

  Date = timezonedDate.makeConstructor(0);
  const gmtTestCases = [
    {
      dateObject: new Date('2022-02-02T12:00:00Z'),
      expectedString: '2022-02-02'
    },
    {
      dateObject: new Date('2022-02-02T00:00:00Z'),
      expectedString: '2022-02-02'
    },
    {
      dateObject: new Date('2022-02-02T23:59:00Z'),
      expectedString: '2022-02-02'
    }
  ];

  for (const testCase of gmtTestCases) {
    expect(getDateStringFromDateObject(testCase.dateObject)).toBe(
      testCase.expectedString
    );
  }

  Date = timezonedDate.makeConstructor(-300);
  const colombiaTestCases = [
    {
      dateObject: new Date('2022-02-02T12:00:00Z'),
      expectedString: '2022-02-02'
    },
    {
      dateObject: new Date('2022-02-02T00:00:00Z'),
      expectedString: '2022-02-01'
    },
    {
      dateObject: new Date('2022-02-02T23:59:00Z'),
      expectedString: '2022-02-02'
    }
  ];

  for (const testCase of colombiaTestCases) {
    expect(getDateStringFromDateObject(testCase.dateObject)).toBe(
      testCase.expectedString
    );
  }

  Date = timezonedDate.makeConstructor(300);
  const pakistanTestCases = [
    {
      dateObject: new Date('2022-02-02T12:00:00Z'),
      expectedString: '2022-02-02'
    },
    {
      dateObject: new Date('2022-02-02T00:00:00Z'),
      expectedString: '2022-02-02'
    },
    {
      dateObject: new Date('2022-02-02T23:59:00Z'),
      expectedString: '2022-02-03'
    }
  ];

  for (const testCase of pakistanTestCases) {
    expect(getDateStringFromDateObject(testCase.dateObject)).toBe(
      testCase.expectedString
    );
  }

  Date = originalDate;
});

it('datesAndTimes ::: getDateStringsBetween', () => {
  const originalDate = Date;

  Date = timezonedDate.makeConstructor(0);
  const gmtTestCases = [
    {
      start: '2022-06-05T01:00:00Z',
      end: '2022-06-07T01:00:00Z',
      expectedOutput: ['2022-06-05', '2022-06-06', '2022-06-07']
    },
    {
      start: '2022-06-05 01:00:00+00:00',
      end: '2022-06-07 01:00:00+00:00',
      expectedOutput: ['2022-06-05', '2022-06-06', '2022-06-07']
    },
    {
      start: '2023-06-03 08:00:00+00:00',
      end: '2023-06-03 08:15:00+00:00',
      expectedOutput: ['2023-06-03']
    },
    {
      start: '2023-06-04 00:00:00+00:00',
      end: '2023-06-04 00:00:00+00:00',
      expectedOutput: ['2023-06-04']
    },
    {
      start: '2023-06-03 08:00:00+00:00',
      end: '2023-06-04 00:00:00+00:00',
      expectedOutput: ['2023-06-03']
    },
    {
      start: '2023-06-03',
      end: '2023-06-04',
      expectedOutput: ['2023-06-03', '2023-06-04']
    }
  ];

  for (const testCase of gmtTestCases) {
    expect(getDateStringsBetween(testCase.start, testCase.end)).toStrictEqual(
      testCase.expectedOutput
    );
  }

  Date = timezonedDate.makeConstructor(-300);
  const colombiaTestCases = [
    {
      start: '2022-06-05T01:00:00Z',
      end: '2022-06-07T01:00:00Z',
      expectedOutput: ['2022-06-04', '2022-06-05', '2022-06-06']
    },
    {
      start: '2023-06-03 08:00:00+00:00',
      end: '2023-06-03 08:15:00+00:00',
      expectedOutput: ['2023-06-03']
    },
    {
      start: '2023-06-03',
      end: '2023-06-04',
      expectedOutput: ['2023-06-03', '2023-06-04']
    }
  ];

  for (const testCase of colombiaTestCases) {
    expect(getDateStringsBetween(testCase.start, testCase.end)).toStrictEqual(
      testCase.expectedOutput
    );
  }

  Date = timezonedDate.makeConstructor(300);
  const pakistanTestCases = [
    {
      start: '2022-06-05T23:00:00Z',
      end: '2022-06-07T23:00:00Z',
      expectedOutput: ['2022-06-06', '2022-06-07', '2022-06-08']
    },
    {
      start: '2023-06-03',
      end: '2023-06-04',
      expectedOutput: ['2023-06-03', '2023-06-04']
    }
  ];

  for (const testCase of pakistanTestCases) {
    expect(getDateStringsBetween(testCase.start, testCase.end)).toStrictEqual(
      testCase.expectedOutput
    );
  }

  Date = originalDate;
});

it('datesAndTimes ::: getDateStringsBetween ::: utc', () => {
  const originalDate = Date;

  Date = timezonedDate.makeConstructor(0);
  const gmtTestCases = [
    {
      start: '2022-06-05T01:00:00Z',
      end: '2022-06-07T01:00:00Z',
      expectedOutput: ['2022-06-05', '2022-06-06', '2022-06-07']
    },
    {
      start: '2022-06-05T22:00:00Z',
      end: '2022-06-07T01:00:00Z',
      expectedOutput: ['2022-06-05', '2022-06-06', '2022-06-07']
    }
  ];

  for (const testCase of gmtTestCases) {
    expect(
      getDateStringsBetween(testCase.start, testCase.end, true)
    ).toStrictEqual(testCase.expectedOutput);
  }

  Date = timezonedDate.makeConstructor(-300);
  const colombiaTestCases = [
    {
      start: '2022-06-05T01:00:00Z',
      end: '2022-06-07T01:00:00Z',
      expectedOutput: ['2022-06-05', '2022-06-06', '2022-06-07']
    },
    {
      start: '2023-06-03 08:00:00+00:00',
      end: '2023-06-03 08:15:00+00:00',
      expectedOutput: ['2023-06-03']
    }
  ];

  for (const testCase of colombiaTestCases) {
    expect(
      getDateStringsBetween(testCase.start, testCase.end, true)
    ).toStrictEqual(testCase.expectedOutput);
  }

  Date = timezonedDate.makeConstructor(300);
  const pakistanTestCases = [
    {
      start: '2022-06-05T23:00:00Z',
      end: '2022-06-07T23:00:00Z',
      expectedOutput: ['2022-06-05', '2022-06-06', '2022-06-07']
    }
  ];

  for (const testCase of pakistanTestCases) {
    expect(
      getDateStringsBetween(testCase.start, testCase.end, true)
    ).toStrictEqual(testCase.expectedOutput);
  }

  Date = originalDate;
});

it('datesAndTimes ::: getTimeStringFromDateObject', () => {
  const originalDate = Date;

  Date = timezonedDate.makeConstructor(0);
  const gmtTestCases = [
    {
      input: new Date('2022-06-05T01:00:00Z'),
      expectedOutput: '01:00'
    }
  ];

  for (const testCase of gmtTestCases) {
    expect(getTimeStringFromDateObject(testCase.input)).toBe(
      testCase.expectedOutput
    );
  }

  Date = timezonedDate.makeConstructor(-300);
  const colombiaTestCases = [
    {
      input: new Date('2022-06-05T01:00:00Z'),
      expectedOutput: '20:00'
    }
  ];

  for (const testCase of colombiaTestCases) {
    expect(getTimeStringFromDateObject(testCase.input)).toBe(
      testCase.expectedOutput
    );
  }

  Date = timezonedDate.makeConstructor(300);
  const pakistanTestCases = [
    {
      input: new Date('2022-06-05T01:00:00Z'),
      expectedOutput: '06:00'
    }
  ];

  for (const testCase of pakistanTestCases) {
    expect(getTimeStringFromDateObject(testCase.input)).toBe(
      testCase.expectedOutput
    );
  }

  Date = originalDate;
});

it('datesAndTimes ::: getUTCValuesFromDateString', () => {
  const values = getUTCValuesFromDateString('2020-10-20');
  expect(values).toStrictEqual({
    day: 20,
    month: 9,
    monthShortName: 'Oct',
    monthName: 'October',
    year: 2020
  });
});

it('datesAndTimes ::: getDatesPeriodString', () => {
  const originalDate = Date;

  Date = timezonedDate.makeConstructor(0);
  const gmtTestCases = [
    {
      startDate: new Date('2022-02-02'),
      endDate: new Date('2022-02-02'),
      expectedString: 'Feb 02, 2022',
      utc: true
    },
    {
      startDate: new Date('2022-02-02'),
      endDate: new Date('2022-02-02'),
      expectedString: 'Feb 02, 2022',
      utc: false
    }
  ];

  for (const testCase of gmtTestCases) {
    expect(
      getDatesPeriodString(testCase.startDate, testCase.endDate, testCase.utc)
    ).toBe(testCase.expectedString);
  }

  Date = timezonedDate.makeConstructor(-300);
  const colombiaTestCases = [
    {
      startDate: new Date('2022-02-02'),
      endDate: new Date('2022-02-02'),
      utc: false,
      expectedString: 'Feb 01, 2022'
    },
    {
      startDate: new Date('2022-02-02'),
      endDate: new Date('2022-02-02'),
      utc: true,
      expectedString: 'Feb 02, 2022'
    }
  ];

  for (const testCase of colombiaTestCases) {
    expect(
      getDatesPeriodString(testCase.startDate, testCase.endDate, testCase.utc)
    ).toBe(testCase.expectedString);
  }

  Date = timezonedDate.makeConstructor(300);
  const pakistanTestCases = [
    {
      startDate: new Date('2022-02-02'),
      endDate: new Date('2022-02-02'),
      utc: false,
      expectedString: 'Feb 02, 2022'
    },
    {
      startDate: new Date('2022-02-02'),
      endDate: new Date('2022-02-02'),
      utc: true,
      expectedString: 'Feb 02, 2022'
    }
  ];

  for (const testCase of pakistanTestCases) {
    expect(
      getDatesPeriodString(testCase.startDate, testCase.endDate, testCase.utc)
    ).toBe(testCase.expectedString);
  }

  Date = originalDate;
});
