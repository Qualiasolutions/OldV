import { LinkListLink } from 'components/lists/LinkList';

export default [
  {
    name: 'social.holidayDates',
    toScreen: 'HolidayDates',
    navMethod: 'push'
  },
  {
    name: 'social.holidayPlans',
    toScreen: 'EntityList',
    navMethod: 'push',
    toScreenParams: {
      entityTypes: ['HolidayPlan'],
      entityTypeName: 'holiday-plans'
    }
  }
] as LinkListLink[];
