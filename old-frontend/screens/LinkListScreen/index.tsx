import annualDates from './linkConfigs/annualDates';
import anniversaries from './linkConfigs/anniversaries';
import holidays from './linkConfigs/holidays';
import LinkList from 'components/lists/LinkList';
import useEntityTypeHeader from 'headers/hooks/useEntityTypeHeader';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { ContentTabScreenProps } from 'types/base';
import { useState } from 'react';
import { TransparentContainerView } from 'components/molecules/ViewComponents';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import {
  useCreateLinkListSetupCompletionMutation,
  useGetLinkListCompletionsQuery
} from 'reduxStore/services/api/user';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { Button } from 'components/molecules/ButtonComponents';
import { Text } from 'components/Themed';

const SETUP_TEXT_PAGES: {
  [key: string]: string[];
} = {
  anniversaries: [
    'The Birthday & Annversary subcategory allows users to better organise celebrating birthdays and anniversaries. When a date is added, if you want to plan anything for the birthday, add an “Action” weeks or days before.  This action will appear as a task on calendar.',
    'When it is time to start planning, use the “B&A Planning” subcategory to plan gifts, dinners, activities and more. In addition to the tasks and due dates you can add, there are List templates and Shopping lists to help.'
  ],
  holidays: [
    'The Holidays subcategory allows users to better organise celebrating holidays during the year. All holidays will be listed and added to the calendar. If you want to plan anything for the holiday, add an “Action” weeks or days before.  This action will appear as a task on calendar.',
    'When it is time to start planning, use the “Holiday Plans” subcategory to plan activities. In addition to the tasks and due dates you can add, there are List templates and Shopping lists to help.'
  ]
};
const setupPagesStyles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start'
  },
  button: { marginTop: 20 }
});

const SetupPages = ({
  pages,
  listName
}: {
  pages: string[];
  listName: string;
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const { data: userDetails } = useGetUserFullDetails();
  const [createLinkListCompletion, createLinkListCompletionResult] =
    useCreateLinkListSetupCompletionMutation();

  if (!userDetails) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentContainerView style={setupPagesStyles.container}>
      <Text>{pages[currentPage]}</Text>
      {createLinkListCompletionResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <Button
          onPress={() => {
            if (currentPage === pages.length - 1) {
              createLinkListCompletion({
                user: userDetails.id,
                list_name: listName
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

type LinkListScreenProps = ContentTabScreenProps<'LinkList'>;

const listNameToLinks = {
  annualDates,
  anniversaries,
  holidays
};

export default function LinkListScreen({ route }: LinkListScreenProps) {
  const listName = route.params.listName;
  useEntityTypeHeader(listName);

  const { data: linkListCompletions, isFetching: isFetchingCompletions } =
    useGetLinkListCompletionsQuery();

  if (!linkListCompletions || isFetchingCompletions) {
    return <FullPageSpinner />;
  }
  if (
    !linkListCompletions
      .map((linkListCompletion) => linkListCompletion.list_name)
      .includes(listName)
  ) {
    return (
      <SetupPages pages={SETUP_TEXT_PAGES[listName]} listName={listName} />
    );
  }

  return <LinkList links={listNameToLinks[listName]} />;
}
