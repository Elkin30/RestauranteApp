import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../Pantallas/Login';
import Registro from '../Pantallas/Registro';
import Home from '../Pantallas/Home';

export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Registro" component={Registro} />
      <Stack.Screen name="Home" component={Home} />
    </Stack.Navigator>
  );
}