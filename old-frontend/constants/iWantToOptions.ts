import { CategoryName } from 'types/categories';

type CategoryNameOrRef = CategoryName | 'REFERENCES';

type Option = {
  title: string;
  link: string;
};
const iWantToOptions: {
  [key in CategoryNameOrRef]: Option[];
} = {
  PETS: [
    {
      title: 'Remember my Vet appointments',
      link: 'https://www.instagram.com/reel/CwKE-IGNbbGuhtTCsfgZn8c5q2s68IDJnnxyAs0/?igshid=NTc4MTIwNjQ2YQ=='
    },
    {
      title: 'Share tasks for health or after care plan',
      link: 'https://www.instagram.com/reel/CwKGvURtRujaj9Uqh6iWQuW-gxVds4bobF_GuE0/?igshid=NTc4MTIwNjQ2YQ=='
    },
    {
      title: 'Make sure there is an exercise schedule for every day',
      link: ''
    },
    { title: 'Share feeding tasks', link: '' },
    { title: 'Keep up with bathing and grooming', link: '' },
    {
      title:
        'Have a place to keep vet contact information, microchip details, insurance policy, etc',
      link: ''
    },
    { title: 'Remember to check supplies for pets', link: '' },
    { title: 'Weigh pets regularly and review', link: '' }
  ],
  TRANSPORT: [
    {
      title:
        'Be reminded of due dates for MOT, Service, Warranty, Insurance, Lease Expiration',
      link: ''
    },
    { title: 'Schedule a monthly wash', link: '' },
    { title: 'Schedule a repair', link: '' },
    { title: 'Be reminded to decide if trading', link: '' },
    {
      title:
        'Keep up with driving license numbers, contact information, warranty, insurance logins',
      link: ''
    },
    { title: 'Be reminded when driving license(s) will expire', link: '' },
    { title: 'Remember to buy train tickets for commute', link: '' }
  ],
  SOCIAL_INTERESTS: [
    {
      title:
        'Be reminded to plan and task birthdays, anniversaries, holidays and events',
      link: ''
    },
    { title: 'schedule days to post on social media', link: '' },
    {
      title: 'Task to make a photo book or electronically organise my photos',
      link: ''
    },
    { title: 'Plan regular days out for a group', link: '' },
    { title: 'Plan coffee mornings with me and X', link: '' },
    {
      title: 'Make sure I spend enough time on my own interests and hobbies',
      link: ''
    },
    { title: 'Keep up with books I have read', link: '' },
    { title: 'Keep up with goals I have for my hobbies', link: '' }
  ],
  EDUCATION: [
    { title: 'Put all school breaks in my calendar', link: '' },
    {
      title: 'Be able to schedule travel, tasks, routines around term time',
      link: ''
    },
    {
      title: 'Be reminded of tasks that need to be done before term ends',
      link: ''
    },
    {
      title: 'Be reminded of tasks that need to be done before term starts',
      link: ''
    },
    { title: 'Set a revision schedule for tasks within a subject', link: '' },
    { title: 'Schedule revision for more than one subject', link: '' },
    {
      title: "Be reminded to review kids' extracurricular activities",
      link: ''
    },
    { title: 'Keep to hand school logins', link: '' },
    { title: 'Reference schedule or syllabus', link: '' }
  ],
  CAREER: [
    { title: 'Add one', link: '' },
    { title: 'Block work time', link: '' }
  ],
  TRAVEL: [
    { title: 'Be reminded to research trip in advance', link: '' },
    {
      title:
        'Be able to see if I have booked all transport, accomodation and activities I want to before the trip',
      link: ''
    },
    { title: 'Remember to shop and pack using my packing list', link: '' },
    { title: 'Keep up with my bucket list of destinations', link: '' },
    {
      title:
        'Reference my passport number(s) and be reminded when they will expire',
      link: ''
    }
  ],
  HEALTH_BEAUTY: [
    { title: 'Remember to book annual appointment for all', link: '' },
    { title: 'Schedule gym time or exercise plans', link: '' },
    { title: 'Measure regularly and review', link: '' },
    { title: 'Set a menu plan for my diet', link: '' },
    { title: 'Make an after care plan for appointment', link: '' },
    { title: 'Remember regular hair cuts, salon visits', link: '' },
    { title: 'Reference health policy and login details', link: '' }
  ],
  HOME: [
    {
      title:
        'Share responsibility for clean, tidy, organise, maintain and improve',
      link: ''
    },
    { title: 'Add a rental property bills, tasks and income', link: '' },
    { title: 'Reference logins for house subscriptions', link: '' },
    { title: 'Print a chore chart', link: '' },
    { title: 'Keep up with how much is spent in the home', link: '' },
    { title: "Make sure I don't miss deadlines for bills", link: '' },
    { title: 'Source a cleaning service (link to handy.com?)', link: '' },
    {
      title: 'Source an organisation service (is there a free app somewhere?)',
      link: ''
    }
  ],
  FOOD: [
    { title: 'Schedule a weekly meal planner', link: '' },
    { title: 'Be reminded to prep and shop weekly ', link: '' },
    { title: 'Schedule family members to be chef on certain days', link: '' },
    { title: 'Share menu plans with family members', link: '' },
    { title: 'Share grocery lists with family members', link: '' },
    { title: 'Allow family members to request menu changes', link: '' },
    { title: 'Keep up with my shopping list', link: '' },
    { title: 'Keep up with food spending', link: '' },
    {
      title:
        'I want to buy a database of recipes to use for menu planning and ordering (is there a free app somewhere?)',
      link: ''
    }
  ],
  LAUNDRY: [
    { title: 'Share laundry responsibilities with others', link: '' },
    { title: 'Remember to sort clothes each season', link: '' },
    { title: 'Remember to sort clothes around school terms', link: '' },
    { title: 'Cull and sell clothes', link: '' },
    { title: 'Keep up with shopping list and sizes needed', link: '' },
    { title: 'Source a laundry service', link: '' },
    { title: 'Task help at home to iron each week', link: '' },
    {
      title: 'Schedule family members to put away clothing on specific days',
      link: ''
    },
    { title: 'Schedule seasonal cleans of wardrobes', link: '' },
    { title: 'Schedule seasonal reminders to check closets', link: '' },
    { title: 'Schedule shopping for specific events or trips', link: '' }
  ],
  FINANCE: [
    { title: 'Set a budget and review it monthly', link: '' },
    { title: 'Organise my bills across categories', link: '' },
    { title: 'Remember tax deadlines', link: '' },
    { title: 'Review networth and pensions regularly', link: '' },
    {
      title: 'Can I outsource any of these tasks (is there a free app?)',
      link: ''
    },
    {
      title:
        'Be reminded of deadlines for transferring money for bills or investments',
      link: ''
    }
  ],
  FAMILY: [],
  GARDEN: [
    { title: 'Plan regular grass cuts with a family member', link: '' },
    { title: 'Schedule Gardener visits weekly', link: '' },
    { title: 'Task gardener specific items', link: '' }
  ],
  REFERENCES: [
    { title: 'Remember when my electronic upgrade(s) are available', link: '' },
    { title: 'Set house rules for screen usage and monitoring', link: '' },
    { title: 'Set curfews or rules for the family to Reference', link: '' },
    {
      title: 'Be able to reference logins and numbers I sometimes need',
      link: ''
    },
    { title: 'See a report of how I am using my time each week', link: '' }
  ]
};

export default iWantToOptions;
