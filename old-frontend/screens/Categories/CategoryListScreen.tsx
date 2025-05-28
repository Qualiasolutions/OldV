import React, { useState } from 'react';
import { ContentTabScreenProps } from 'types/base';
import CategoryNavigator from 'navigation/CategoryNavigator';
import { useSelector } from 'react-redux';
import { selectCategoryById } from 'reduxStore/slices/categories/selectors';
import useCategoryHeader from 'headers/hooks/useCategoryHeader';
import {
  useCreateCategorySetupCompletionMutation,
  useGetCategorySetupCompletionsQuery
} from 'reduxStore/services/api/user';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import { Text } from 'components/Themed';
import { Button } from 'components/molecules/ButtonComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useTranslation } from 'react-i18next';
import { TransparentContainerView } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { CategoryName } from 'types/categories';

type CategoryListScreenProps = ContentTabScreenProps<'CategoryList'>;

const setupPagesStyles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start'
  },
  button: {
    marginTop: 20
  }
});

const SETUP_TEXT_PAGES: { [key in CategoryName]: string[] | null } = {
  TRANSPORT: [
    `
Transport Category allows users to record and action due dates and tasks for automobiles, motorcycles, boats, bicycles and more. Even Public Transportation.

Remember service dates, MOTs, insurance, warranty. Wash the car(s) monthly.
`,
    `
To get started, Choose “Cars & Motorcycles”, “Boats & Other” or “Public Transportation” and start added due dates or tasks!
`,
    `
Any tasks that cant be associated with one or more Transport entities can be added in My Transport Information. This includes  License numbers and expiration dates for various for multiple family members.
`
  ],
  FAMILY: null,
  PETS: [
    'The Pets Category allows users to keep up with their pets individually or as a group. The first step is to enter the pets as an Entity.',
    'Once Pets are added, users can set up feeding, grooming/cleaning, exercise and health schedules individually or as a group by choosing from the subcategories.'
  ],
  SOCIAL_INTERESTS: [
    'The Social Category allows users to better organise their social diaries. The first step recommended would be to enter Birthdays and Anniversaries and Holidays I Celebrate using the subcategories provided.',
    'Other examples of items that can be added are listed within each category.'
  ],
  EDUCATION: [
    'The Education category allows users to better organise their academic diaries and tasks. The first step recommended would be to enter Students, Schools and School Terms into the subcategories. These will be added as tags and dates added to the calendar.',
    'Once these are added, academic (eg Homework or math) and extracurricular goals (eg swimming) tasks, appointments and due dates can be added and actioned.'
  ],
  CAREER: [
    'The Career category allows users to better organise their work diaries and tasks. This is meant to be Career goals for growth and tracking days off and important employee details. For work tasks, use the toggle on Categories to switch to the Professional version.'
  ],
  TRAVEL: [
    'The Travel Category allows users to plan travel and bucket lists and once a trip is decided to plan and view the trip at a glance to check that transport, accommodation or activities you want to pre-book are sorted and in the calendar. To get started, add a trip under “My Trips” or add a new entity under “My travel plans” for bucket lists or locations of interest.',
    'My Travel Information is a place to add passport numbers as References and action around expiration dates. Other items that could be added here include Frequent Flier numbers, logins for car rentals, travel membership details and expirarion dates.'
  ],
  HEALTH_BEAUTY: [
    'The Health and Beauty category is intended to help users take the best care of themselves. The first step recommended would be to enter People whose appointments are needed to manage. After this, enter Appointment Types. This could be Dental, Eye, Diabetes, Haircuts.',
    'Once these tags are available, start planning and tagging track people and/or appointment types.',
    'For Health & Beauty Goals, you might make a goal to go to the gym every day or measure yourself daily or weekly and track using one of the Lists Templates. Medical information such as insurance can be stored in References.'
  ],
  HOME: ['PBF to add intro info here'],
  GARDEN: ['PBF to add intro info here'],
  FOOD: ['PBF to add intro info here'],
  LAUNDRY: ['PBF to add intro info here'],
  FINANCE: ['PBF to add intro info here']
};

const SetupPages = ({
  pages,
  category
}: {
  pages: string[];
  category: number;
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const { data: userDetails } = useGetUserFullDetails();
  const [createCategoryCompletion, createCategoryCompletionResult] =
    useCreateCategorySetupCompletionMutation();

  if (!userDetails) {
    return null;
  }

  return (
    <TransparentContainerView style={setupPagesStyles.container}>
      <Text>{pages[currentPage]}</Text>
      {createCategoryCompletionResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <Button
          onPress={() => {
            if (currentPage === pages.length - 1) {
              createCategoryCompletion({
                user: userDetails.id,
                category
              });
            } else {
              setCurrentPage(currentPage + 1);
            }
          }}
          title={t('common.continue')}
          style={setupPagesStyles.button}
        />
      )}
    </TransparentContainerView>
  );
};

export default function CategoryListScreen({ route }: CategoryListScreenProps) {
  const category = useSelector(selectCategoryById(route.params.categoryId));
  useCategoryHeader(category?.name || '');

  const { data: categorySetupData, isFetching: isFetchingSetupData } =
    useGetCategorySetupCompletionsQuery();

  if (!category) {
    return <FullPageSpinner />;
  }

  if (isFetchingSetupData || !categorySetupData) {
    return <FullPageSpinner />;
  }

  if (
    !categorySetupData
      .map((obj) => obj.category)
      .includes(route.params.categoryId)
  ) {
    const setupPages = SETUP_TEXT_PAGES[category.name];

    if (setupPages) {
      return (
        <SetupPages pages={setupPages} category={route.params.categoryId} />
      );
    }
  }

  return <CategoryNavigator categoryId={route.params.categoryId} />;
}
