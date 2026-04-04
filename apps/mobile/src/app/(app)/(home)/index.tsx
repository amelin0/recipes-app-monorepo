import { View, Text } from 'react-native';
import { AppScreen } from '@/shared/ui/components/layouts/AppScreen';

export default function HomeScreen() {
  return (
    <AppScreen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Home</Text>
      </View>
    </AppScreen>
  );
}
