import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { withUnistyles } from 'react-native-unistyles';

const UniKeyboardAwareScrollView = withUnistyles(KeyboardAwareScrollView, theme => ({}));

type Props = KeyboardAwareScrollViewProps;

export const AppKeyboardAwareScrollView = (props: Props) => {
  return <UniKeyboardAwareScrollView {...props} />;
};
