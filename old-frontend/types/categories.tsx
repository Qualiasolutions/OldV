import { isDate } from 'lodash';

type CategoryName =
  | 'FAMILY'
  | 'PETS'
  | 'SOCIAL_INTERESTS'
  | 'EDUCATION'
  | 'CAREER'
  | 'TRAVEL'
  | 'HEALTH_BEAUTY'
  | 'HOME'
  | 'GARDEN'
  | 'FOOD'
  | 'LAUNDRY'
  | 'FINANCE'
  | 'TRANSPORT';

type Category = {
  is_enabled: boolean;
  is_premium: boolean;
  id: number;
  name: CategoryName;
  readable_name: string;
};

type ProfessionalCategory = {
  id: number;
  name: string;
  user: number;
};

type AllProfessionalCategories = {
  ids: number[];
  byId: {
    [key: number]: ProfessionalCategory;
  };
};

export {
  CategoryName,
  Category,
  ProfessionalCategory,
  AllProfessionalCategories
};
