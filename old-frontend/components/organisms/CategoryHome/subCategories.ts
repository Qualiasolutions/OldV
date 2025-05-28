import { LinkListLink } from 'components/lists/LinkList';

export default {
  PETS: [
    {
      name: 'pets.myPets',
      navMethod: 'push',
      toScreen: 'EntityList',
      toScreenParams: {
        entityTypes: ['Pet', 'PetBirthday'],
        entityTypeName: 'pets',
        showCreateForm: false
      }
    },
    {
      name: 'pets.feedingSchedule',
      navMethod: 'push',
      toScreen: 'TagScreen',
      toScreenParams: {
        tagName: 'PETS__FEEDING'
      }
    },
    {
      name: 'pets.exercise',
      navMethod: 'push',
      toScreen: 'TagScreen',
      toScreenParams: {
        tagName: 'PETS__EXERCISE'
      }
    },
    {
      name: 'pets.cleaningGrooming',
      navMethod: 'push',
      toScreen: 'TagScreen',
      toScreenParams: {
        tagName: 'PETS__GROOMING'
      }
    },
    {
      name: 'pets.health',
      navMethod: 'push',
      toScreen: 'TagScreen',
      toScreenParams: {
        tagName: 'PETS__HEALTH'
      }
    }
  ],
  SOCIAL_INTERESTS: [
    {
      name: 'social.socialPlans',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['SocialPlan'],
        entityTypeName: 'social-plans'
      }
    },
    {
      name: 'social.anniversaries',
      toScreen: 'LinkList',
      navMethod: 'push',
      toScreenParams: { listName: 'anniversaries' }
    },
    {
      name: 'social.nationalHolidays',
      toScreen: 'LinkList',
      navMethod: 'push',
      toScreenParams: { listName: 'holidays' }
    },
    {
      name: 'social.events',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Event'],
        entityTypeName: 'events'
      }
    },
    {
      name: 'social.hobbies',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Hobby'],
        entityTypeName: 'hobbies'
      }
    },
    {
      name: 'social.socialMedia',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['SocialMedia'],
        entityTypeName: 'social-media'
      }
    },
    {
      name: 'social.mySocialInformation',
      navMethod: 'push',
      toScreen: 'TagScreen',
      toScreenParams: {
        tagName: 'SOCIAL_INTERESTS__INFORMATION__PUBLIC'
      }
    }
  ],
  EDUCATION: [
    {
      name: 'education.students',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Student'],
        entityTypeName: 'students'
      }
    },
    {
      name: 'education.schools',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: [
          'School',
          'SchoolYearStart',
          'SchoolYearEnd',
          'SchoolTerm',
          'SchoolTermStart',
          'SchoolTermEnd',
          'SchoolBreak'
        ],
        entityTypeName: 'schools'
      }
    },
    {
      name: 'education.schoolTerms',
      toScreen: 'SchoolTerms',
      navMethod: 'push'
    },
    {
      name: 'education.academicPlans',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['AcademicPlan'],
        entityTypeName: 'academic-plans'
      }
    },
    {
      name: 'education.extracurricularPlans',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['ExtracurricularPlan'],
        entityTypeName: 'extracurricular-plans'
      }
    }
  ],
  CAREER: [
    {
      name: 'career.employees',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Employee'],
        entityTypeName: 'employees'
      }
    },
    {
      name: 'career.daysOff',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['DaysOff'],
        entityTypeName: 'days-off'
      }
    },
    {
      name: 'career.careerGoal',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['CareerGoal'],
        entityTypeName: 'career-goals'
      }
    },
    {
      name: 'career.myCareerInformation',
      toScreen: 'TagScreen',
      navMethod: 'push',
      toScreenParams: {
        tagName: 'CAREER__INFORMATION__PUBLIC'
      }
    }
  ],
  TRAVEL: [
    {
      name: 'travel.myTrips',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Trip'],
        entityTypeName: 'trips'
      }
    },
    {
      name: 'travel.myTravelPlans',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['TravelPlan'],
        entityTypeName: 'travel-plans'
      }
    },
    {
      name: 'travel.travellerInfo',
      toScreen: 'TagScreen',
      navMethod: 'push',
      toScreenParams: {
        tagName: 'TRAVEL__INFORMATION__PUBLIC'
      }
    }
  ],
  HEALTH_BEAUTY: [
    {
      name: 'healthBeauty.patients',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Patient'],
        entityTypeName: 'patient'
      }
    },
    {
      name: 'healthBeauty.appointments',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Appointment'],
        entityTypeName: 'appointment'
      }
    },
    {
      name: 'healthBeauty.goals',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['HealthGoal'],
        entityTypeName: 'health-goal'
      }
    }
  ],
  HOME: [
    {
      name: 'home.myHomes',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Home'],
        entityTypeName: 'homes'
      }
    },
    {
      name: 'home.myHomeInformation',
      toScreen: 'TagScreen',
      navMethod: 'push',
      toScreenParams: { tagName: 'HOME__INFORMATION__PUBLIC' }
    }
  ],
  GARDEN: [
    {
      name: 'garden.gardens',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Garden'],
        entityTypeName: 'gardens'
      }
    },
    {
      name: 'garden.myGardenInformation',
      toScreen: 'TagScreen',
      navMethod: 'push',
      toScreenParams: { tagName: 'GARDEN__INFORMATION__PUBLIC' }
    }
  ],
  FOOD: [
    {
      name: 'food.foodPlans',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['FoodPlan'],
        entityTypeName: 'foodPlans'
      }
    },
    {
      name: 'food.myFoodInformation',
      toScreen: 'TagScreen',
      navMethod: 'push',
      toScreenParams: { tagName: 'FOOD__INFORMATION__PUBLIC' }
    }
  ],
  LAUNDRY: [
    {
      name: 'laundry.laundryPlans',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['LaundryPlan'],
        entityTypeName: 'laundryPlans'
      }
    },
    {
      name: 'laundry.myLaundryInformation',
      toScreen: 'TagScreen',
      navMethod: 'push',
      toScreenParams: { tagName: 'LAUNDRY__INFORMATION__PUBLIC' }
    }
  ],
  FINANCE: [
    {
      name: 'finance.myFinances',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Finance'],
        entityTypeName: 'finance'
      }
    },
    {
      name: 'finance.myFinanceInformation',
      toScreen: 'TagScreen',
      navMethod: 'push',
      toScreenParams: { tagName: 'FINANCE__INFORMATION__PUBLIC' }
    }
  ],
  TRANSPORT: [
    {
      name: 'transport.cars',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Car'],
        entityTypeName: 'cars'
      }
    },
    {
      name: 'transport.boats',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['Boat'],
        entityTypeName: 'boats'
      }
    },
    {
      name: 'transport.publicTransport',
      toScreen: 'EntityList',
      navMethod: 'push',
      toScreenParams: {
        entityTypes: ['PublicTransport'],
        entityTypeName: 'public-transport'
      }
    },
    {
      name: 'transport.myTransportInformation',
      toScreen: 'TagScreen',
      navMethod: 'push',
      toScreenParams: { tagName: 'TRANSPORT__INFORMATION__PUBLIC' }
    }
  ]
} as {
  [key: string]: LinkListLink[];
};
