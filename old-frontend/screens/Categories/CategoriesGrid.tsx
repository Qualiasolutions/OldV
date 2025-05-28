import React from 'react';
import { ImageBackground, StyleSheet, ImageSourcePropType } from 'react-native';

import { useThemeColor, View } from 'components/Themed';
import { Category as CategoryType } from 'types/categories';

import GenericError from 'components/molecules/GenericError';
import { useTranslation } from 'react-i18next';
import Layout from 'constants/Layout';
import { FullPageSpinner } from 'components/molecules/Spinners';
import { BlackText } from 'components/molecules/TextComponents';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useDispatch } from 'react-redux';
import { setShowPremiumModal } from 'reduxStore/slices/misc/actions';
import PremiumTag from 'components/molecules/PremiumTag';
import { useNavigation } from '@react-navigation/native';
import { ContentTabParamList } from 'types/base';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import * as Sentry from 'sentry-expo';

type CategoryGroupName =
  | 'PETS'
  | 'SOCIAL_INTERESTS'
  | 'EDUCATION_CAREER'
  | 'TRAVEL'
  | 'HEALTH_BEAUTY'
  | 'HOME_GARDEN'
  | 'FINANCE'
  | 'TRANSPORT';

const categoriesImages: {
  [key in CategoryGroupName | 'REFERENCES']: ImageSourcePropType;
} = {
  PETS: require('assets/images/categories/pets.png'),
  SOCIAL_INTERESTS: require('assets/images/categories/social.png'),
  EDUCATION_CAREER: require('assets/images/categories/education.png'),
  TRAVEL: require('assets/images/categories/travel.png'),
  HEALTH_BEAUTY: require('assets/images/categories/health.png'),
  HOME_GARDEN: require('assets/images/categories/home.png'),
  FINANCE: require('assets/images/categories/finance.png'),
  TRANSPORT: require('assets/images/categories/transport.png'),
  REFERENCES: require('assets/images/categories/transport.png')
};

const styles = StyleSheet.create({
  spinnerWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridContainer: {
    width: '100%',
    height: '100%',
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridSquare: {
    width: Layout.window.width / 3 - 17,
    height: Layout.window.height * 0.2,
    margin: 2.5,
    overflow: 'hidden',
    borderRadius: 10
  },
  gridText: {
    textAlign: 'center',
    fontSize: 13
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: 10,
    padding: 10
  },
  premiumTag: { position: 'absolute', bottom: 3, right: 3 }
});

export default function CategoriesGrid() {
  const { data: allCategories, isLoading, error } = useGetAllCategoriesQuery();
  const { data: userDetails } = useGetUserFullDetails();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<ContentTabParamList>>();

  const whiteColor = useThemeColor({}, 'white');
  const overlayColor = useThemeColor({}, 'almostBlack');

  if (isLoading || !allCategories || !userDetails) {
    return <FullPageSpinner />;
  }

  const CATEGORY_GROUPS: { [key in CategoryGroupName]: CategoryType[] } = {
    PETS: [allCategories.byName.PETS],
    SOCIAL_INTERESTS: [allCategories.byName.SOCIAL_INTERESTS],
    EDUCATION_CAREER: [
      allCategories.byName.EDUCATION,
      allCategories.byName.CAREER
    ],
    TRAVEL: [allCategories.byName.TRAVEL],
    HEALTH_BEAUTY: [allCategories.byName.HEALTH_BEAUTY],
    HOME_GARDEN: [
      allCategories.byName.HOME,
      allCategories.byName.GARDEN,
      allCategories.byName.FOOD,
      allCategories.byName.LAUNDRY
    ],
    FINANCE: [allCategories.byName.FINANCE],
    TRANSPORT: [allCategories.byName.TRANSPORT]
  };

  if (error) {
    return <GenericError />;
  }

  const categoriesContent = Object.entries(CATEGORY_GROUPS).map(
    ([categoryGroupName, categoryGroup]) => {
      const textColor = whiteColor;

      const isPremiumTag = categoryGroup
        .map((cat) => cat.is_premium)
        .some((isPrem) => isPrem) ? (
        <PremiumTag />
      ) : null;

      return (
        <TouchableOpacity
          onPress={() => {
            if (categoryGroup.length === 1) {
              navigation.navigate('CategoryList', {
                categoryId: categoryGroup[0].id
              });
            } else {
              navigation.navigate('SubCategoryList', {
                categoryIds: categoryGroup.map((cat) => cat.id)
              });
            }
          }}
          key={categoryGroupName}
        >
          <ImageBackground
            // source={categoriesImages[categoryGroupName as CategoryGroupName]}
            style={styles.gridSquare}
            resizeMode="cover"
          >
            <View
              style={[styles.overlay, { backgroundColor: `${overlayColor}` }]}
            >
              <BlackText
                style={[styles.gridText, { color: textColor }]}
                text={t(`categories.${categoryGroupName}`)}
                bold={true}
              />
              {/* {isPremiumTag} */}
            </View>
          </ImageBackground>
        </TouchableOpacity>
      );
    }
  );

  return (
    <View style={styles.gridContainer}>
      {categoriesContent}
      <TouchableOpacity
        onPress={() => {
          if (userDetails.is_premium) {
            navigation.navigate('AllReferences');
          } else {
            dispatch(setShowPremiumModal(true));
          }
        }}
      >
        <ImageBackground style={styles.gridSquare} resizeMode="cover">
          <View
            style={[styles.overlay, { backgroundColor: `${overlayColor}` }]}
          >
            <BlackText
              style={[styles.gridText, { color: whiteColor }]}
              text={t('pageTitles.references')}
              bold={true}
            />
            <PremiumTag style={styles.premiumTag} />
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}
