import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';

export default function useEntityById(entityId: number) {
  const { data: entityData } = useGetAllEntitiesQuery(undefined, {
    selectFromResult: ({ data }) => {
      if (!data) {
        return { data: null };
      }
      return { data: data.byId[entityId] };
    }
  });

  return entityData;
}
