import { CategoryName } from './categories';

export type AllTags = {
  [key in CategoryName]?: string[];
};
