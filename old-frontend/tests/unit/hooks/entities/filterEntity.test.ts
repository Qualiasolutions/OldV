import { AllCategories } from 'reduxStore/services/api/types';
import { Category } from 'types/categories';
import { ScheduledEntityResponseType, TaskType } from 'types/tasks';
import {
  EntityResponseType,
  EntityTypeName,
  SchoolTermTypeName
} from 'types/entities';
import filterEntity from 'hooks/entities/filterEntity';
import {
  AllSchoolBreaks,
  AllSchoolTerms,
  AllSchoolYears
} from 'types/schoolTerms';

type TestCase = {
  description: string;
  filterEntityArgs: {
    entity: ScheduledEntityResponseType;
    filteredEntity?: EntityResponseType;
    resourceTypes?: (EntityTypeName | SchoolTermTypeName)[];
    data: {
      allCategories: AllCategories;
      schoolYears: AllSchoolYears;
      schoolBreaks: AllSchoolBreaks;
      schoolTerms: AllSchoolTerms;
      entitiesByCategory: { [key: number]: number[] };
      entitiesBySchool: { [key: number]: number[] };
      studentIds: number[];
    };
    filters: {
      filteredUsers: number[];
      filteredCategories: number[];
      filteredTaskTypes: (TaskType | 'OTHER')[];
      completionFilters: ('COMPLETE' | 'INCOMPLETE')[];
    };
  };
  expectedResult: boolean;
};

const DEFAULT_CATEGORY: Category = {
  id: 1,
  is_enabled: false,
  is_premium: false,
  name: 'TRAVEL',
  readable_name: 'Travel'
};

const DEFAULT_ALL_CATEGORIES: AllCategories = {
  ids: [1, 2, 3, 4, 5],
  byId: {
    1: { ...DEFAULT_CATEGORY, id: 1, name: 'TRAVEL' },
    2: { ...DEFAULT_CATEGORY, id: 2, name: 'TRANSPORT' },
    3: { ...DEFAULT_CATEGORY, id: 3, name: 'PETS' },
    4: { ...DEFAULT_CATEGORY, id: 4, name: 'HEALTH_BEAUTY' },
    5: { ...DEFAULT_CATEGORY, id: 5, name: 'CAREER' }
  },
  byName: {
    TRAVEL: { ...DEFAULT_CATEGORY, id: 1, name: 'TRAVEL' },
    TRANSPORT: { ...DEFAULT_CATEGORY, id: 2, name: 'TRANSPORT' },
    PETS: { ...DEFAULT_CATEGORY, id: 3, name: 'PETS' },
    HEALTH_BEAUTY: { ...DEFAULT_CATEGORY, id: 4, name: 'HEALTH_BEAUTY' },
    CAREER: { ...DEFAULT_CATEGORY, id: 5, name: 'CAREER' }
  }
};

const DEFAULT_SCHOOL_YEARS = {
  ids: [],
  byId: {},
  bySchool: {}
};

const DEFAULT_SCHOOL_TERMS = {
  ids: [],
  byId: {},
  byYear: {}
};

const DEFAULT_SCHOOL_BREAKS = {
  ids: [],
  byId: {},
  byYear: {}
};

const DEFAULT_ENTITY: ScheduledEntityResponseType = {
  id: 1,
  members: [],
  title: '__ENTITY__',
  resourcetype: 'Car',
  start_date: null,
  end_date: null,
  start_datetime: null,
  end_datetime: null
};

const DEFAULT_ENTITIES_BY_CATEGORY = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: []
};

const DEFAULT_ENTITIES_BY_SCHOOL = {};

const DEFAULT_STUDENT_IDS: number[] = [];

const DEFAULT_DATA = {
  allCategories: DEFAULT_ALL_CATEGORIES,
  schoolYears: DEFAULT_SCHOOL_YEARS,
  schoolTerms: DEFAULT_SCHOOL_TERMS,
  schoolBreaks: DEFAULT_SCHOOL_BREAKS,
  entitiesByCategory: DEFAULT_ENTITIES_BY_CATEGORY,
  entitiesBySchool: DEFAULT_ENTITIES_BY_SCHOOL,
  studentIds: DEFAULT_STUDENT_IDS
};

const DEFAULT_FILTERS = {
  filteredUsers: [],
  filteredCategories: [],
  filteredTaskTypes: [],
  completionFilters: []
};

const DEFAULT_FILTERED_ENTITY: EntityResponseType = {
  id: 1,
  name: 'ENTITY',
  category: 1,
  created_at: '123',
  resourcetype: 'Car',
  hidden: false,
  child_entities: [],
  members: [],
  parent: null,
  parent_name: '',
  professional_category: null
};

it('filterEntity ::: addMembers', () => {
  const testCases: TestCase[] = [
    {
      description: 'No filters',
      filterEntityArgs: {
        entity: DEFAULT_ENTITY,
        filteredEntity: undefined,
        resourceTypes: undefined,
        data: DEFAULT_DATA,
        filters: DEFAULT_FILTERS
      },
      expectedResult: true
    },
    {
      description: 'Entity ID provided',
      filterEntityArgs: {
        entity: { ...DEFAULT_ENTITY, id: 2, resourcetype: 'Car' },
        filteredEntity: {
          ...DEFAULT_FILTERED_ENTITY,
          id: DEFAULT_ENTITY.id,
          resourcetype: 'Car'
        },
        resourceTypes: undefined,
        data: DEFAULT_DATA,
        filters: DEFAULT_FILTERS
      },
      expectedResult: false
    },
    {
      description: 'Resource types provided',
      filterEntityArgs: {
        entity: { ...DEFAULT_ENTITY, resourcetype: 'Boat' },
        filteredEntity: undefined,
        resourceTypes: ['Car'],
        data: DEFAULT_DATA,
        filters: DEFAULT_FILTERS
      },
      expectedResult: false
    },
    {
      description: 'Entity ID provided for SchoolYearStart',
      filterEntityArgs: {
        entity: { ...DEFAULT_ENTITY, id: 1, resourcetype: 'SchoolYearStart' },
        filteredEntity: {
          ...DEFAULT_FILTERED_ENTITY,
          id: 1,
          resourcetype: 'Car'
        },
        resourceTypes: undefined,
        data: {
          ...DEFAULT_DATA,
          schoolYears: {
            ids: [1],
            byId: {
              1: {
                id: 1,
                start_date: 'string',
                end_date: 'string',
                school: 1,
                year: 'string',
                show_on_calendars: true
              }
            },
            bySchool: {
              1: [1]
            }
          },
          entitiesBySchool: {
            1: [1]
          }
        },
        filters: DEFAULT_FILTERS
      },
      expectedResult: false
    },
    {
      description: 'School Entity ID provided for SchoolYearStart',
      filterEntityArgs: {
        entity: { ...DEFAULT_ENTITY, id: 1, resourcetype: 'SchoolYearStart' },
        filteredEntity: {
          ...DEFAULT_FILTERED_ENTITY,
          id: 10,
          resourcetype: 'School'
        },
        resourceTypes: undefined,
        data: {
          ...DEFAULT_DATA,
          schoolYears: {
            ids: [1],
            byId: {
              1: {
                id: 1,
                start_date: 'string',
                end_date: 'string',
                school: 10,
                year: 'string',
                show_on_calendars: true
              }
            },
            bySchool: {
              10: [1]
            }
          },
          entitiesBySchool: {
            10: [1]
          }
        },
        filters: DEFAULT_FILTERS
      },
      expectedResult: true
    },
    {
      description:
        'School Entity ID provided for SchoolYearStart - unmatching School Year',
      filterEntityArgs: {
        entity: { ...DEFAULT_ENTITY, id: 1, resourcetype: 'SchoolYearStart' },
        filteredEntity: {
          ...DEFAULT_FILTERED_ENTITY,
          id: 11,
          resourcetype: 'School'
        },
        resourceTypes: undefined,
        data: {
          ...DEFAULT_DATA,
          schoolYears: {
            ids: [1, 2],
            byId: {
              1: {
                id: 1,
                start_date: 'string',
                end_date: 'string',
                school: 10,
                year: 'string',
                show_on_calendars: true
              },
              2: {
                id: 2,
                start_date: 'string',
                end_date: 'string',
                school: 11,
                year: 'string',
                show_on_calendars: true
              }
            },
            bySchool: {
              10: [1],
              11: [2]
            }
          },
          entitiesBySchool: {
            10: [1],
            11: [2]
          }
        },
        filters: DEFAULT_FILTERS
      },
      expectedResult: false
    },
    {
      description:
        'School Entity ID provided for SchoolYearStart - unmatching School Year where schools have students',
      filterEntityArgs: {
        entity: { ...DEFAULT_ENTITY, id: 1, resourcetype: 'SchoolYearStart' },
        filteredEntity: {
          ...DEFAULT_FILTERED_ENTITY,
          id: 11,
          resourcetype: 'School'
        },
        resourceTypes: undefined,
        data: {
          ...DEFAULT_DATA,
          schoolYears: {
            ids: [1, 2],
            byId: {
              1: {
                id: 1,
                start_date: 'string',
                end_date: 'string',
                school: 10,
                year: 'string',
                show_on_calendars: true
              },
              2: {
                id: 2,
                start_date: 'string',
                end_date: 'string',
                school: 11,
                year: 'string',
                show_on_calendars: true
              }
            },
            bySchool: {
              10: [1],
              11: [2]
            }
          },
          entitiesBySchool: {
            10: [1, 3],
            11: [2, 4]
          },
          studentIds: [3, 4]
        },
        filters: DEFAULT_FILTERS
      },
      expectedResult: false
    },
    {
      description:
        'Student Entity ID provided for SchoolYearStart - matching School Year',
      filterEntityArgs: {
        entity: { ...DEFAULT_ENTITY, id: 1, resourcetype: 'SchoolYearStart' },
        filteredEntity: {
          ...DEFAULT_FILTERED_ENTITY,
          id: 3,
          resourcetype: 'Student',
          school_attended: 10
        },
        resourceTypes: undefined,
        data: {
          ...DEFAULT_DATA,
          schoolYears: {
            ids: [1, 2],
            byId: {
              1: {
                id: 1,
                start_date: 'string',
                end_date: 'string',
                school: 10,
                year: 'string',
                show_on_calendars: true
              },
              2: {
                id: 2,
                start_date: 'string',
                end_date: 'string',
                school: 11,
                year: 'string',
                show_on_calendars: true
              }
            },
            bySchool: {
              10: [1],
              11: [2]
            }
          },
          entitiesBySchool: {
            10: [1, 3],
            11: [2, 4]
          },
          studentIds: [3, 4]
        },
        filters: DEFAULT_FILTERS
      },
      expectedResult: true
    }
  ];

  for (const testCase of testCases) {
    expect(
      filterEntity(
        testCase.filterEntityArgs.entity,
        testCase.filterEntityArgs.filteredEntity,
        testCase.filterEntityArgs.resourceTypes,
        testCase.filterEntityArgs.data,
        testCase.filterEntityArgs.filters
      )
    ).toStrictEqual(testCase.expectedResult);
  }
});
