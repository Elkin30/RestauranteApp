import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import StackNavigator from './src/Navegacion/StackNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <StackNavigator />
    </NavigationContainer>
  );
}