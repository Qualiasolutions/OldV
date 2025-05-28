import {
  useGetAllEntitiesQuery,
  useGetMemberEntitiesQuery
} from 'reduxStore/services/api/entities';
import { EntityTypeName } from 'types/entities';

type Props = {
  entities?: number[];
  entityTypes?: EntityTypeName[];
  categories?: number[];
  tags?: string[];
};

export default function useEntities({
  entities,
  entityTypes,
  categories,
  tags
}: Props) {
  const { data: allEntities, isLoading: isLoadingEntities } =
    useGetAllEntitiesQuery();

  const { data: memberEntities, isLoading: isLoadingMemberEntities } =
    useGetMemberEntitiesQuery();

  if (!(categories || entities || entityTypes || tags)) {
    return [];
  }

  const isLoading =
    isLoadingEntities ||
    !allEntities ||
    isLoadingMemberEntities ||
    !memberEntities;
  if (isLoading) {
    return [];
  }

  const relevantEntities: number[] = (
    entities || Object.keys(memberEntities.byId).map((id) => parseInt(id))
  ).filter((entityId) => {
    if (allEntities.byId[entityId]?.resourcetype === 'List') {
      return false;
    }
    if (
      categories &&
      categories.includes(allEntities.byId[entityId]?.category)
    ) {
      return true;
    }
    if (entities && entities.includes(entityId)) {
      return true;
    }
    if (
      entityTypes &&
      allEntities.byId[entityId] &&
      entityTypes.includes(allEntities.byId[entityId]?.resourcetype)
    ) {
      return true;
    }
    return false;
  });

  return relevantEntities;
}
