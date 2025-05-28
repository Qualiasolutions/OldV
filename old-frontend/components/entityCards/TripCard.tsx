import { EntityResponseType } from 'types/entities';
import EntityWithDateAndImageCard from './EntityWithDateAndImageCard';

export default function TripCard({ entity }: { entity: EntityResponseType }) {
  return (
    <EntityWithDateAndImageCard
      entity={entity}
      startDateField="start_date"
      endDateField="end_date"
      utc={true}
    />
  );
}
