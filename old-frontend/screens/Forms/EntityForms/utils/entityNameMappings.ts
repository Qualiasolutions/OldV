import { EntityTypeName } from 'types/entities';

export default {
  Car: 'Vehicle',
  Boat: 'Boat or Other'
} as {
  [key in EntityTypeName]: string;
};
