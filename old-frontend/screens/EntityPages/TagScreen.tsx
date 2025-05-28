import useEntityTypeHeader from 'headers/hooks/useEntityTypeHeader';
import TagNavigator from 'navigation/TagNavigator';
import { ContentTabScreenProps } from 'types/base';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TransparentContainerView } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import {
  useCreateTagSetupCompletionMutation,
  useGetTagSetupCompletionsQuery
} from 'reduxStore/services/api/user';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { Button } from 'components/molecules/ButtonComponents';
import { Text } from 'components/Themed';

const SETUP_TEXT_PAGES: {
  [key: string]: string[];
} = {
  SOCIAL_INTERESTS__INFORMATION__PUBLIC: [
    'My Social Information is a place to add important numbers as References and action around expiration dates of memberships or accounts related to social.'
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
  tagName
}: {
  pages: string[];
  tagName: string;
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const { data: userDetails } = useGetUserFullDetails();
  const [createTagCompletion, createTagCompletionResult] =
    useCreateTagSetupCompletionMutation();

  if (!userDetails) {
    return null;
  }

  return (
    <TransparentContainerView style={setupPagesStyles.container}>
      <Text>{pages[currentPage]}</Text>
      {createTagCompletionResult.isLoading ? (
        <PaddedSpinner />
      ) : (
        <Button
          onPress={() => {
            if (currentPage === pages.length - 1) {
              createTagCompletion({
                user: userDetails.id,
                tag_name: tagName
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

type TagScreenProps = ContentTabScreenProps<'TagScreen'>;

export default function TagScreen({ route }: TagScreenProps) {
  const tagName = route.params.tagName;
  useEntityTypeHeader(tagName);
  const { data: tagCompletions, isFetching: isFetchingCompletions } =
    useGetTagSetupCompletionsQuery();

  if (SETUP_TEXT_PAGES[tagName]) {
    if (!tagCompletions || isFetchingCompletions) {
      return <FullPageSpinner />;
    }
    if (
      !tagCompletions
        .map((tagCompletion) => tagCompletion.tag_name)
        .includes(tagName)
    ) {
      return <SetupPages pages={SETUP_TEXT_PAGES[tagName]} tagName={tagName} />;
    }
  }

  return <TagNavigator tagName={tagName} />;
}
