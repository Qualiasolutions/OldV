import momentTZ from 'moment-timezone';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'components/Themed';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
import ListingModal from 'components/molecules/ListingModal';

const timeZonesList = momentTZ.tz.names();

type Props = {
  value: string;
  onSelectTimezone: (tz: string) => void;
  disabled?: boolean;
};

export default function TimezoneSelect({
  value,
  onSelectTimezone,
  disabled
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const timezoneOptions = timeZonesList.map((tzName) => ({
    name: tzName,
    id: tzName,
    selected: tzName === value
  }));

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setOpen(true);
        }}
        disabled={disabled}
      >
        <Text>{value || t('components.timezoneSelect.selectTimezone')}</Text>
      </TouchableOpacity>
      <ListingModal
        data={timezoneOptions}
        visible={open}
        onSelect={(option) => {
          onSelectTimezone(String(option.id));
          setOpen(false);
        }}
        onClose={() => {
          setOpen(false);
        }}
        minSearchLength={2}
      />
    </>
  );
}
