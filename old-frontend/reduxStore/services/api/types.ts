import { FixedTaskResponseType } from 'types/tasks';
import { EntityResponseType, EntityTypeName } from 'types/entities';
import { Category } from 'types/categories';

type AllTasks = {
  ids: number[];
  byId: {
    [id: number]: FixedTaskResponseType;
  };
};

type AllEntities = {
  ids: number[];
  byId: {
    [id: number]: EntityResponseType;
  };
  byCategory: {
    [key: number]: number[];
  };
  byResourceType: {
    [key in EntityTypeName]?: number[];
  };
  bySchoolAttended: {
    [key: number]: number[];
  };
};

type AllCategories = {
  ids: number[];
  byId: {
    [id: number]: Category;
  };
  byName: {
    [name: string]: Category;
  };
};

type Country = {
  code: string;
  name: string;
};

type Holiday = {
  name: string;
  start_date: string;
  end_date: string;
  id: string;
  country_code: string;
};

type AllHolidays = {
  [code: string]: Holiday[];
};

type SelectedHoliday = {
  id: number;
  country_code: string;
  start_date: string;
  end_date: string;
  name: number;
};

type HolidayList = {
  id: number;
  country_codes: string[];
  holiday_ids: string[];
};

export {
  AllTasks,
  AllEntities,
  AllCategories,
  Country,
  Holiday,
  AllHolidays,
  SelectedHoliday,
  HolidayList
};
