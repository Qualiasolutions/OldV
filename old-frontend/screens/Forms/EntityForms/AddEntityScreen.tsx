import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ContentTabParamList } from 'types/base';
import AddEntityForm from 'components/forms/AddEntityForm';
import { TransparentView } from 'components/molecules/ViewComponents';
import { useThemeColor } from 'components/Themed';
import { Platform, StyleSheet } from 'react-native';
import { EntityTypeName } from 'types/entities';
import DropDown from 'components/forms/components/DropDown';
import { fieldColorMapping } from 'components/forms/utils/fieldColorMapping';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import useAddEntityHeader from 'headers/hooks/useAddEntityHeader';

const styles = StyleSheet.create({
  entityTypeSelectorWrapper: {
    marginTop: 20,
    width: 200,
    alignSelf: 'center'
  },
  formContainer: {
    marginBottom: 100
  }
});

export default function AddEntityScreen({
  route,
  navigation
}: NativeStackScreenProps<ContentTabParamList, 'AddEntity'>) {
  const rawEntityTypes = route.params.entityTypes;
  const defaults = route.params.defaults;

  const entityTypes: EntityTypeName[] =
    typeof rawEntityTypes === 'string' ? [rawEntityTypes] : rawEntityTypes;

  const [selectedEntityType, selectEntityType] = useState<EntityTypeName>(
    entityTypes[0]
  );
  const fieldColor = useThemeColor(
    {},
    selectedEntityType
      ? fieldColorMapping[selectedEntityType]
      : fieldColorMapping.default
  );

  useAddEntityHeader(selectedEntityType);

  const entityTypeSelector =
    entityTypes && entityTypes.length > 1 ? (
      <TransparentView
        style={[
          styles.entityTypeSelectorWrapper,
          Platform.OS === 'ios' && { zIndex: 9999 }
        ]}
      >
        <DropDown
          value={selectedEntityType}
          items={entityTypes.map((entityType) => ({
            label: entityType,
            value: entityType
          }))}
          setFormValues={(entityType: EntityTypeName) => {
            selectEntityType(entityType);
          }}
          style={{ backgroundColor: fieldColor }}
        />
      </TransparentView>
    ) : null;

  return (
    <TransparentFullPageScrollView>
      {entityTypeSelector}
      <TransparentView style={styles.formContainer}>
        <AddEntityForm entityType={selectedEntityType} defaults={defaults} />
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
