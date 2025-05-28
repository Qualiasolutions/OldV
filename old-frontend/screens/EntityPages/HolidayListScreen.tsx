import ListLinkWithCheckbox from 'components/molecules/ListLinkWithCheckbox';
import { WhiteFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetAllCountriesQuery } from 'reduxStore/services/api/holidays';
import { Country } from 'reduxStore/services/api/types';
import { useThemeColor } from 'components/Themed';
import { Button } from 'components/molecules/ButtonComponents';

import { StyleSheet } from 'react-native';
import {
  TransparentPaddedView,
  WhiteView
} from 'components/molecules/ViewComponents';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import useGetUserDetails from 'hooks/useGetUserDetails';
import { FullPageSpinner } from 'components/molecules/Spinners';
import { useGetAllTasksQuery } from 'reduxStore/services/api/tasks';
import { isHolidayTask } from 'types/tasks';

export default function HolidayListScreen({
  navigation
}: NativeStackScreenProps<any>) {
  const backgroundColor = useThemeColor({}, 'buttonDefault');
  const styles = StyleSheet.create({
    nextButton: {
      backgroundColor,
      height: 58,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 60
    }
  });
  const { data: userDetails } = useGetUserDetails();
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
  const { data: allCountries } = useGetAllCountriesQuery(
    userDetails?.id || -1,
    {
      skip: !userDetails?.id
    }
  );

  const { data: allTasks } = useGetAllTasksQuery(undefined, {
    skip: !userDetails?.id
  });

  const selectedHolidays = useMemo(() => {
    return allTasks ? Object.values(allTasks.byId).filter(isHolidayTask) : [];
  }, [allTasks]);

  useEffect(() => {
    if (allCountries && selectedHolidays && selectedHolidays.length > 0) {
      setSelectedCountries(
        allCountries.filter((country) =>
          selectedHolidays
            .map((holiday) => holiday.country_code)
            .includes(country.code)
        )
      );
    }
  }, [allCountries, selectedHolidays]);

  const onPress = useCallback(
    (country: Country) => {
      if (selectedCountries.some((cou) => cou.code === country.code)) {
        setSelectedCountries(
          selectedCountries.filter((cou) => cou.code !== country.code)
        );
      } else {
        setSelectedCountries([...selectedCountries, country]);
      }
    },
    [selectedCountries]
  );

  if (!allCountries || !selectedHolidays) {
    return <FullPageSpinner />;
  }

  return (
    <WhiteView style={{ flex: 1 }}>
      <WhiteFullPageScrollView>
        {allCountries
          ?.filter((country) => ['AU', 'GB', 'US'].includes(country.code))
          .map((country: Country) => (
            <ListLinkWithCheckbox
              key={country.code}
              text={country.name}
              showArrow={false}
              onSelect={async () => onPress(country)}
              onPressContainer={async () => onPress(country)}
              selected={selectedCountries.some(
                (cou) => cou.code === country.code
              )}
            />
          ))}
        {allCountries
          ?.filter((country) => !['AU', 'GB', 'US'].includes(country.code))
          .map((country: Country) => (
            <ListLinkWithCheckbox
              key={country.code}
              text={country.name}
              showArrow={false}
              onSelect={async () => onPress(country)}
              onPressContainer={async () => onPress(country)}
              selected={selectedCountries.some(
                (cou) => cou.code === country.code
              )}
            />
          ))}
      </WhiteFullPageScrollView>
      <TransparentPaddedView>
        <Button
          disabled={false}
          title="Next"
          onPress={() => {
            navigation.navigate('HolidayDetail', {
              countrycodes: selectedCountries.map((country) => country.code)
            });
          }}
          style={styles.nextButton}
        />
      </TransparentPaddedView>
    </WhiteView>
  );
}
