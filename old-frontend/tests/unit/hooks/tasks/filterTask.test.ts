import filterTask from 'hooks/tasks/filterTask';
import { AllCategories, AllEntities } from 'reduxStore/services/api/types';
import { Category } from 'types/categories';
import { ScheduledTaskResponseType, TaskType } from 'types/tasks';
import { EntityResponseType } from 'types/entities';

type TestCase = {
  description: string;
  filterTaskArgs: {
    task: ScheduledTaskResponseType;
    filteredUsers: number[];
    filteredCategories: number[];
    filteredTaskTypes: (TaskType | 'OTHER')[];
    completionFilters: ('COMPLETE' | 'INCOMPLETE')[];
    allCategories: AllCategories;
    allEntities: AllEntities;
  };
  expectedResult: boolean;
};

const DEFAULT_TASK: ScheduledTaskResponseType = {
  id: 1,
  is_complete: false,
  is_partially_complete: false,
  is_ignored: false,
  action_id: null,
  members: [1],
  entities: [1],
  tags: ['__TAG__'],
  recurrence: null,
  recurrence_index: null,
  routine: null,
  title: '__TASK__',
  resourcetype: 'FixedTask',
  type: 'TASK',
  alert: [],
  start_datetime: '2020-01-01T10:00:00',
  end_datetime: '2020-01-01T11:00:00'
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

const DEFAULT_ENTITY: EntityResponseType = {
  id: 1,
  name: 'ENTITY',
  category: 1,
  created_at: 'CREATED_AT',
  resourcetype: 'Car',
  hidden: false,
  child_entities: [],
  members: [],
  parent: null,
  parent_name: null,
  professional_category: null
};
const DEFAULT_ALL_ENTITIES: AllEntities = {
  ids: [1, 2, 3, 4, 5],
  byId: {
    1: { ...DEFAULT_ENTITY, id: 1, name: 'ENTITY_1', category: 1 },
    2: { ...DEFAULT_ENTITY, id: 2, name: 'ENTITY_2', category: 2 },
    3: { ...DEFAULT_ENTITY, id: 3, name: 'ENTITY_3', category: 3 },
    4: { ...DEFAULT_ENTITY, id: 4, name: 'ENTITY_4', category: 4 },
    5: { ...DEFAULT_ENTITY, id: 5, name: 'ENTITY_5', category: 5 }
  },
  byCategory: {},
  byResourceType: {},
  bySchoolAttended: {}
};

it('filterTask ::: addMembers', () => {
  const testCases: TestCase[] = [
    {
      description: 'No filters',
      filterTaskArgs: {
        task: DEFAULT_TASK,
        filteredUsers: [],
        filteredCategories: [],
        filteredTaskTypes: [],
        completionFilters: [],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: true
    },
    {
      description: 'Matching user',
      filterTaskArgs: {
        task: { ...DEFAULT_TASK, members: [1] },
        filteredUsers: [1],
        filteredCategories: [],
        filteredTaskTypes: [],
        completionFilters: [],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: true
    },
    {
      description: 'Un-matching members',
      filterTaskArgs: {
        task: { ...DEFAULT_TASK, members: [2] },
        filteredUsers: [1],
        filteredCategories: [],
        filteredTaskTypes: [],
        completionFilters: [],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: false
    },
    {
      description: 'Matching category',
      filterTaskArgs: {
        task: { ...DEFAULT_TASK, entities: [1] },
        filteredUsers: [],
        filteredCategories: [1],
        filteredTaskTypes: [],
        completionFilters: [],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: true
    },
    {
      description: 'Un-matching category',
      filterTaskArgs: {
        task: { ...DEFAULT_TASK, entities: [2] },
        filteredUsers: [],
        filteredCategories: [1],
        filteredTaskTypes: [],
        completionFilters: [],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: false
    },
    {
      description: 'Matching task type',
      filterTaskArgs: {
        task: { ...DEFAULT_TASK, type: 'APPOINTMENT' },
        filteredUsers: [],
        filteredCategories: [],
        filteredTaskTypes: ['APPOINTMENT'],
        completionFilters: [],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: true
    },
    {
      description: 'Un-matching task type',
      filterTaskArgs: {
        task: { ...DEFAULT_TASK, type: 'APPOINTMENT' },
        filteredUsers: [],
        filteredCategories: [],
        filteredTaskTypes: ['DUE_DATE'],
        completionFilters: [],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: false
    },
    {
      description: 'Matching completion filter',
      filterTaskArgs: {
        task: { ...DEFAULT_TASK, is_complete: false },
        filteredUsers: [],
        filteredCategories: [],
        filteredTaskTypes: [],
        completionFilters: ['INCOMPLETE'],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: true
    },
    {
      description: 'Un-matching completion filter',
      filterTaskArgs: {
        task: { ...DEFAULT_TASK, is_complete: false },
        filteredUsers: [],
        filteredCategories: [],
        filteredTaskTypes: [],
        completionFilters: ['COMPLETE'],
        allCategories: DEFAULT_ALL_CATEGORIES,
        allEntities: DEFAULT_ALL_ENTITIES
      },
      expectedResult: false
    }
  ];

  for (const testCase of testCases) {
    expect(
      filterTask(
        testCase.filterTaskArgs.task,
        testCase.filterTaskArgs.filteredUsers,
        testCase.filterTaskArgs.filteredCategories,
        testCase.filterTaskArgs.filteredTaskTypes,
        testCase.filterTaskArgs.completionFilters,
        testCase.filterTaskArgs.allCategories,
        testCase.filterTaskArgs.allEntities
      )
    ).toStrictEqual(testCase.expectedResult);
  }
});
