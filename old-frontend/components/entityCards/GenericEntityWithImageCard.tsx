import React from 'react';
import { StyleSheet, Image } from 'react-native';
import {
  TransparentView,
  WhiteView
} from 'components/molecules/ViewComponents';
import { BlackText } from 'components/molecules/TextComponents';
import { EntityResponseType } from 'types/entities';
import { Feather } from '@expo/vector-icons';
import { useThemeColor } from 'components/Themed';
import { useNavigation } from '@react-navigation/native';
import { parsePresignedUrl } from 'utils/urls';
import SafePressable from 'components/molecules/SafePressable';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';

const styles = StyleSheet.create({
  listEntry: {
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden'
  },
  image: {
    height: 50,
    width: 50
  },
  imageWrapper: {
    borderRightWidth: 1
  },
  listEntryText: {
    fontSize: 20,
    marginLeft: 15
  }
});

export default function GenericEntityWithImageCard({
  entity
}: {
  entity: EntityResponseType;
}) {
  const blackColor = useThemeColor({}, 'black');
  const greyColor = useThemeColor({}, 'grey');
  const navigation = useNavigation();

  const imageSource = parsePresignedUrl(entity.presigned_image_url);
  return (
    <TouchableOpacity
      onPress={() => {
        (navigation as any).push('EntityScreen', { entityId: entity.id });
      }}
    >
      <WhiteView style={[styles.listEntry, { borderColor: blackColor }]}>
        {imageSource ? (
          <TransparentView
            style={[styles.imageWrapper, { borderColor: blackColor }]}
          >
            <Image source={{ uri: imageSource }} style={[styles.image]} />
          </TransparentView>
        ) : (
          <Feather name="image" size={50} color={greyColor} />
        )}
        <BlackText text={`${entity.name}`} style={styles.listEntryText} />
      </WhiteView>
    </TouchableOpacity>
  );
}
