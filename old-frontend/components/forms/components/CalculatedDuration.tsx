import { TextInput, useThemeColor } from 'components/Themed';
import { ViewStyle } from 'react-native';

const MILLISECONDS_PER_MINUTE = 1000 * 60;
const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * 60;
const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * 24;

export default function CalculatedDuration({
  startDatetime,
  endDatetime,
  textInputStyle
}: {
  startDatetime: Date;
  endDatetime: Date;
  textInputStyle: ViewStyle;
}) {
  const disabledTextColor = useThemeColor({}, 'disabledGrey');

  const deltaMilliseconds = endDatetime.getTime() - startDatetime.getTime();
  const days = Math.floor(deltaMilliseconds / MILLISECONDS_PER_DAY);
  const hours = Math.floor(
    (deltaMilliseconds % MILLISECONDS_PER_DAY) / MILLISECONDS_PER_HOUR
  );
  const minutes = Math.floor(
    (deltaMilliseconds % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE
  );

  return (
    <TextInput
      value={`${days ? `${days}d ` : ''}${
        hours ? `${hours}h ` : ''
      }${minutes}m`}
      style={[textInputStyle, { color: disabledTextColor }]}
      focusable={false}
      editable={false}
    />
  );
}
