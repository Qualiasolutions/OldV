import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { TransparentView } from 'components/molecules/ViewComponents';
import { useThemeColor, View } from 'components/Themed';
import {
  ImageBackground,
  ImageSourcePropType,
  StyleSheet,
  TextStyle,
  ViewStyle
} from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { HeaderTitle, HeaderBackButton } from '@react-navigation/elements';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  sideSections: {
    width: 100,
    backgroundColor: 'transparent'
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    borderBottomWidth: 4
  }
});

export const headerWithBackgroundColor = (
  backgroundColor: string,
  height: number = 100
) => {
  return (props: NativeStackHeaderProps) => {
    const headerRight = props.options.headerRight;
    const borderColor = useThemeColor({}, 'grey');
    const borderBottomWidth = 4;
    const statusBarHeight = getStatusBarHeight();

    return (
      <TransparentView
        style={{
          height: height + statusBarHeight,
          paddingTop: statusBarHeight
        }}
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: backgroundColor || '#444444',
              borderBottomWidth: borderBottomWidth,
              borderBottomColor: borderColor
            }
          ]}
        >
          <HeaderBackButton
            tintColor={props.options.headerTintColor}
            onPress={props.navigation.goBack}
            labelVisible={false}
          />
          <HeaderTitle tintColor={props.options.headerTintColor}>
            {props.options.title}
          </HeaderTitle>
          <View style={styles.sideSections}>
            {headerRight ? headerRight({ canGoBack: true }) : null}
          </View>
        </View>
      </TransparentView>
    );
  };
};

export const headerWithBackground = (
  backgroundImage: ImageSourcePropType,
  height: number = 100,
  customStyles?: {
    header?: TextStyle;
    overlay?: (overlayColour: string) => ViewStyle;
  }
) => {
  return (props: NativeStackHeaderProps) => {
    const overlayColor = useThemeColor({}, 'overlay');
    const borderColor = useThemeColor({}, 'grey');
    const headerRight = props.options.headerRight;
    const statusBarHeight = getStatusBarHeight();

    return (
      <TransparentView
        style={{
          height: height + statusBarHeight,
          paddingTop: statusBarHeight
        }}
      >
        <ImageBackground
          style={[
            styles.imageBackground,
            {
              borderBottomColor: borderColor
            }
          ]}
          source={backgroundImage}
        >
          <View
            style={[
              styles.overlay,
              { backgroundColor: `${overlayColor}99` },
              (customStyles?.overlay && customStyles?.overlay(overlayColor)) ||
                {}
            ]}
          >
            <HeaderBackButton
              tintColor={props.options.headerTintColor}
              onPress={props.navigation.goBack}
              labelVisible={false}
            />
            <HeaderTitle
              tintColor={props.options.headerTintColor}
              style={customStyles?.header || {}}
            >
              {props.options.title}
            </HeaderTitle>
            <View style={styles.sideSections}>
              {headerRight ? headerRight({ canGoBack: true }) : null}
            </View>
          </View>
        </ImageBackground>
      </TransparentView>
    );
  };
};

export const entityTypeHeader = (backgroundImage: ImageSourcePropType) =>
  headerWithBackground(backgroundImage, 100, {
    header: { fontSize: 22 },
    overlay: (overlayColor) => ({ backgroundColor: `${overlayColor}dd` })
  });

export const categoryHeader = (backgroundImage: ImageSourcePropType) =>
  headerWithBackground(backgroundImage, 100, { header: { fontSize: 28 } });

// TODO - set correct images
export const headerMapping = {
  entities: {
    default: headerWithBackgroundColor('#444444'),
    Car: headerWithBackground(
      require('assets/images/header-backgrounds/cars.png')
    )
  },
  entityTypes: {
    cars: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    boats: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'public-transport': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    events: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    anniversaries: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    hobbies: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    trips: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    pets: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'days-off': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    holidays: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    schools: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'academic-plans': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'extracurricular-plans': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'career-goals': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    homes: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    food: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    clothing: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'social-plans': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'social-media': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'school-breaks': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    'health-beauty': entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    finance: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    SchoolBreak: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    Flight: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    TrainBusFerry: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    RentalCar: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    TaxiOrTransfer: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    DriveTime: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    HotelOrRental: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    StayWithFriend: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    Birthday: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    Anniversary: entityTypeHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    default: headerWithBackgroundColor('#444444')
  },
  categories: {
    FAMILY: headerWithBackground(
      require('assets/images/header-backgrounds/holidays.png'),
      100,
      { header: { fontSize: 28 } }
    ),
    PETS: categoryHeader(
      require('assets/images/header-backgrounds/holidays.png')
    ),
    SOCIAL_INTERESTS: categoryHeader(
      require('assets/images/header-backgrounds/holidays.png')
    ),
    EDUCATION_CAREER: categoryHeader(
      require('assets/images/header-backgrounds/holidays.png')
    ),
    TRAVEL: categoryHeader(
      require('assets/images/header-backgrounds/holidays.png')
    ),
    HEALTH_BEAUTY: categoryHeader(
      require('assets/images/header-backgrounds/holidays.png')
    ),
    HOME_GARDEN: categoryHeader(
      require('assets/images/header-backgrounds/holidays.png')
    ),
    FINANCE: categoryHeader(
      require('assets/images/header-backgrounds/holidays.png')
    ),
    TRANSPORT: categoryHeader(
      require('assets/images/header-backgrounds/cars.png')
    ),
    default: headerWithBackgroundColor('#444444')
  }
} as {
  entities: { [key: string]: React.ElementType | undefined };
  entityTypes: { [key: string]: React.ElementType | undefined };
  categories: { [key: string]: React.ElementType | undefined };
};
