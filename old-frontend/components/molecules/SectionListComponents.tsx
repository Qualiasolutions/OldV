import { SectionList as DefaultSectionList } from 'react-native';
type SectionListProps = DefaultSectionList['props'];

export function SectionList(props: SectionListProps) {
  return <DefaultSectionList {...props} />;
}
