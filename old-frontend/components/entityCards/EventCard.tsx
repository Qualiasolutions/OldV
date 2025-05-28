import { EntityResponseType } from 'types/entities';
import EntityWithDateAndImageCard from './EntityWithDateAndImageCard';

export default function EventCard({ entity }: { entity: EntityResponseType }) {
  return (
    <EntityWithDateAndImageCard
      entity={entity}
      startDateField="start_datetime"
      endDateField="end_datetime"
      utc={false}
    />
  );
}
