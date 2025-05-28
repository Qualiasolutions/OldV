import React from 'react';
import EventPage from './EntityScreens/components/EventPage';
import { EntityTypeName } from 'types/entities';
import useEntityById from 'hooks/entities/useEntityById';

export const RESOURCE_TYPE_TO_COMPONENT = {
  Event: EventPage,
  AnniversaryPlan: EventPage,
  HolidayPlan: EventPage
} as {
  [key in EntityTypeName]?: React.ElementType;
};

export default function EntityOverview({ entityId }: { entityId: number }) {
  const entity = useEntityById(entityId);
  const resourceType = entity?.resourcetype;

  if (!resourceType) {
    return null;
  }

  const Comp = RESOURCE_TYPE_TO_COMPONENT[resourceType];

  if (!Comp) {
    return null;
  }

  return <Comp entityId={entityId} />;
}
