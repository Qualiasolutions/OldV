import { SchoolTermItemType } from 'types/tasks';

export const RESOURCE_TYPE_TO_TYPE: { [key: string]: SchoolTermItemType } = {
  SchoolTerm: 'SCHOOL_TERM',
  SchoolTermStart: 'SCHOOL_TERM_START',
  SchoolTermEnd: 'SCHOOL_TERM_END',
  SchoolBreak: 'SCHOOL_BREAK',
  SchoolYearStart: 'SCHOOL_YEAR_START',
  SchoolYearEnd: 'SCHOOL_YEAR_END'
};
