import { PaddedSpinner } from 'components/molecules/Spinners';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useGetAllRoutinesQuery } from 'reduxStore/services/api/routines';
import { FieldValueTypes } from '../types';
import DropDown from './DropDown';
import { ViewStyle } from 'react-native';
import PremiumTag from 'components/molecules/PremiumTag';

export default function RoutineSelector({
  onChange,
  value,
  textInputStyle,
  containerStyle,
  disabled
}: {
  onChange: (values: FieldValueTypes) => void;
  value: string;
  textInputStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}) {
  const { data: allRoutines } = useGetAllRoutinesQuery();
  const { data: user } = useGetUserFullDetails();

  if (!allRoutines || !user) {
    return <PaddedSpinner />;
  }

  if (!user.is_premium) {
    return <PremiumTag />;
  }

  return (
    <DropDown
      value={value}
      items={Object.values(allRoutines.byId).map((routine) => ({
        value: routine.id,
        label: routine.name
      }))}
      setFormValues={(item) => {
        onChange(item);
      }}
      listMode={'MODAL'}
      style={textInputStyle}
      containerStyle={containerStyle}
      disabled={disabled}
    />
  );
}
