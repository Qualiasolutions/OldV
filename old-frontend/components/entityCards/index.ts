import { EntityTypeName } from 'types/entities';
import AnniversaryCard from './AnniversaryCard';
import EventCard from './EventCard';
import DaysOffCard from './DaysOffCard';
import TripCard from './TripCard';
import GenericEntityWithImageCard from './GenericEntityWithImageCard';

type LinkMapping = {
  [key in EntityTypeName]?: React.ElementType;
};

export default {
  Pet: GenericEntityWithImageCard,
  Trip: TripCard,
  Anniversary: AnniversaryCard,
  Birthday: AnniversaryCard,
  Event: EventCard,
  DaysOff: DaysOffCard,
  SocialPlan: GenericEntityWithImageCard,
  Hobby: GenericEntityWithImageCard,
  Car: GenericEntityWithImageCard,
  Boat: GenericEntityWithImageCard,
  Home: GenericEntityWithImageCard,
  School: GenericEntityWithImageCard,
  SocialMedia: GenericEntityWithImageCard
} as LinkMapping;
