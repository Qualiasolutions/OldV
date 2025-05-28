import { LinkListLink } from 'components/lists/LinkList';

export default [
  {
    name: 'social.anniversaryDates',
    toScreen: 'AnniversaryDates',
    navMethod: 'push'
  },
  {
    name: 'social.anniversaryPlans',
    toScreen: 'EntityList',
    navMethod: 'push',
    toScreenParams: {
      entityTypes: ['AnniversaryPlan'],
      entityTypeName: 'anniversary-plans'
    }
  }
] as LinkListLink[];
