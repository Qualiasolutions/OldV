import { useThemeColor, View } from 'components/Themed';
import {
  StyleSheet,
  ViewStyle,
  GestureResponderEvent,
  Platform
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parsePresignedUrl } from 'utils/urls';
import { TransparentView, WhiteBox } from 'components/molecules/ViewComponents';
import { Image } from 'components/molecules/ImageComponents';
import SafePressable from 'components/molecules/SafePressable';
import { Button, LinkButton } from 'components/molecules/ButtonComponents';
import { useTranslation } from 'react-i18next';
import OutsidePressHandler from 'react-native-outside-press';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const styles = StyleSheet.create({
  container: {
    height: 120,
    width: 120,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#333333',
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderImage: {
    width: 40,
    height: 40
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    flex: 1
  },
  fullWidth: {
    borderRadius: 0,
    height: 160,
    width: '100%'
  },
  photoTypeModalBox: {
    position: 'absolute',
    width: 150,
  },
  photoTypeModalLink: {
    marginBottom: 10
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  opaqueBackground: {
    color: '#000000',
    opacity: 0.8
  },
  defaultPressable: { zIndex: 1 }
});

export type CustomFile = {
  height: number;
  width: number;
  uri: string;
  type: string;
};

export type PickedFile = File | CustomFile;

type ImagePickerProps = {
  onImageSelect: (image: PickedFile) => any;
  backgroundColor: string;
  defaultImageUrl?: string;
  style?: ViewStyle;
  displayInternalImage?: boolean;
  aspect?: [number, number];
  PressableComponent?: React.ElementType;
  modalOffsets?: {
    left: number;
    top: number;
  };
};

export function ImagePicker({
  onImageSelect,
  backgroundColor = '#ffffff',
  defaultImageUrl = '',
  style = {},
  displayInternalImage = true,
  aspect = undefined,
  PressableComponent = undefined,
  modalOffsets = {
    left: 50,
    top: 50
  }
}: ImagePickerProps) {
  /*

  displayInternalImage: this is true if we want to show the component's
    internally selected image when it exists rather than the default
    image URL. This should be avoided where possible and parent components
    should instead pass `defaultImageUrl` to prevent the data from getting
    out of sync with the parent. It defaults to `true` to support old code.
  */
  const [selectedImage, setSelectedImage] =
    useState<ExpoImagePicker.ImagePickerResult | null>(null);

  const borderColor = useThemeColor({}, 'grey');
  const [showPhotoTypeModal, setShowPhotoTypeModal] = useState(false);
  const { t } = useTranslation();

  const [permissionStatus, requestPermission] =
    ExpoImagePicker.useCameraPermissions();

  useEffect(() => {
    if (!permissionStatus?.granted) {
      requestPermission();
    }
  }, [permissionStatus?.granted, requestPermission]);

  useEffect(() => {
    if (selectedImage && !selectedImage?.canceled) {
      const imageAsset = selectedImage?.assets[0];
      if (
        imageAsset &&
        imageAsset.uri &&
        imageAsset.width &&
        imageAsset.height
      ) {
        const { uri: uriRaw } = imageAsset;
        const uri =
          Platform.OS === 'ios' ? uriRaw.replace('file://', '') : uriRaw;
        const nameParts = uri.split('.');
        const fileType = nameParts[nameParts.length - 1];

        onImageSelect({
          name: uri,
          uri,
          type: 'application/' + fileType,
          height: imageAsset.height,
          width: imageAsset.width
        });
      }
    }
  }, [selectedImage]);

  const imagePickerOptions = useMemo(() => {
    return {
      mediaTypes: ExpoImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: aspect,
      quality: 1
    };
  }, [aspect]);

  const chooseImage = useCallback(async () => {
    const res = await ExpoImagePicker.launchImageLibraryAsync(
      imagePickerOptions
    );

    if (res.canceled) {
      setSelectedImage(null);
    } else {
      setSelectedImage(res);
    }
    setShowPhotoTypeModal(false);
  }, [setSelectedImage, imagePickerOptions]);

  const takePhoto = useCallback(async () => {
    if (!permissionStatus?.granted) {
      return requestPermission();
    }

    const res = await ExpoImagePicker.launchCameraAsync(imagePickerOptions);

    if (res.canceled) {
      setSelectedImage(null);
    } else {
      setSelectedImage(res);
    }
    setShowPhotoTypeModal(false);
  }, [
    setSelectedImage,
    imagePickerOptions,
    permissionStatus?.granted,
    requestPermission
  ]);

  const photoTypeModal = useMemo(() => {
    return (
      <OutsidePressHandler
        onOutsidePress={() => setShowPhotoTypeModal(false)}
        disabled={false}
        style={[styles.photoTypeModalBox, modalOffsets]}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <WhiteBox elevated={false}>
            <LinkButton
              onPress={chooseImage}
              title={t('components.imagePicker.choosePhoto')}
              style={styles.photoTypeModalLink}
            />
            <LinkButton
              onPress={takePhoto}
              title={t('components.imagePicker.takePhoto')}
              style={styles.photoTypeModalLink}
            />
            <Button
              onPress={() => setShowPhotoTypeModal(false)}
              title={t('common.cancel')}
            />
          </WhiteBox>
        </Animated.View>
      </OutsidePressHandler>
    );
  }, [t, chooseImage, takePhoto, modalOffsets]);

  const imageSource =
    (displayInternalImage &&
      selectedImage &&
      (selectedImage as any)?.assets[0] &&
      (selectedImage as any)?.assets[0].uri &&
      !((selectedImage as any).assets as any)[0].canceled) ||
    (defaultImageUrl && {
      uri: parsePresignedUrl(defaultImageUrl)
    }) ||
    require('assets/images/icons/camera.png');

  if (PressableComponent) {
    return (
      <TransparentView>
        <PressableComponent
          onPress={() => {
            setShowPhotoTypeModal(true);
          }}
        />
        {showPhotoTypeModal && photoTypeModal}
      </TransparentView>
    );
  }

  return (
    <SafePressable onPress={() => setShowPhotoTypeModal(true)} style={styles.defaultPressable}>
      <TransparentView
        style={[{ backgroundColor, borderColor }, styles.container, style]}
      >
        <Image
          style={
            selectedImage || defaultImageUrl
              ? styles.selectedImage
              : styles.placeholderImage
          }
          source={imageSource}
          resizeMode="cover"
        />
      </TransparentView>
      {showPhotoTypeModal && photoTypeModal}
    </SafePressable>
  );
}

export function WhiteImagePicker(
  props: Omit<ImagePickerProps, 'backgroundColor'>
) {
  const backgroundColor = useThemeColor({}, 'white');
  const { style, ...otherProps } = props;

  return ImagePicker({
    style: style || {} as ViewStyle,
    backgroundColor,
    ...otherProps
  });
}

export function FullWidthImagePicker(
  props: Omit<ImagePickerProps, 'backgroundColor'>
) {
  const backgroundColor = useThemeColor({}, 'grey');
  const { style, ...otherProps } = props;

  return ImagePicker({
    style: StyleSheet.flatten([styles.fullWidth, style || {}]) as ViewStyle,
    backgroundColor,
    ...otherProps
  });
}

export function SmallImagePicker(
  props: Omit<ImagePickerProps, 'PressableComponent' | 'backgroundColor'>
) {
  const { style, modalOffsets, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'transparent');

  const PressableComponent = (pressableProps: {
    onPress: (event: GestureResponderEvent) => void;
  }) => (
    <SafePressable onPress={pressableProps.onPress} style={style}>
      <Image source={require('assets/images/icons/small-camera.png')} />
    </SafePressable>
  );

  return ImagePicker({
    style,
    backgroundColor,
    PressableComponent,
    modalOffsets: {
      top: 10,
      left: 10
    },
    ...otherProps
  });
}
