export interface FamilyCategoryViewPermission {
  id: number;
  user: number;
  category: number;
}

export interface AllFamilyCategoryViewPermission {
  byId: { [key: number]: FamilyCategoryViewPermission };
  ids: number[];
}

export interface PreferredDaysDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}
export type PreferredDays = PreferredDaysDays & {
  id: number;
  user: number;
  category: number;
};

export interface AllPreferredDays {
  byId: { [key: number]: PreferredDays };
  ids: number[];
}

export type BlockedCategoryType =
  | 'birthdays'
  | 'family-birthdays'
  | 'national-holidays'
  | 'term-time'
  | 'trips'
  | 'days-off';

export type BlockedCategories = {
  id: number;
  user: number;
  category: number;
};

export type AllBlockedCategories = {
  byId: { [key: number]: BlockedCategories };
  ids: number[];
};
