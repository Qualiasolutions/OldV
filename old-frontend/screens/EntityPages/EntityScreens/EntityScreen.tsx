import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ContentTabParamList } from 'types/base';
import React, { useEffect } from 'react';
import useEntityHeader from '../../../headers/hooks/useEntityHeader';
import EntityNavigator from 'navigation/EntityNavigator';
import useEntityById from 'hooks/entities/useEntityById';

export default function EntityScreen({
  navigation,
  route
}: NativeStackScreenProps<ContentTabParamList, 'EntityScreen'>) {
  const entityIdRaw = route.params.entityId;
  const entityId =
    typeof entityIdRaw === 'number' ? entityIdRaw : parseInt(entityIdRaw);
  const entity = useEntityById(entityId);

  useEntityHeader(entityId);
  useEffect(() => {
    if (!entity) {
      navigation.goBack();
    }
  }, [entity, navigation]);

  return <EntityNavigator entityId={entityId} />;
}
