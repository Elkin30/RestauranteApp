import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../Pantallas/Login';
import Registro from '../Pantallas/Registro';
import Home from '../Pantallas/Home';
import { MisPedidos } from '../Pantallas/MisPedidos';

export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  Home: undefined;
  MisPedidos: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={Login as any} />
      <Stack.Screen name="Registro" component={Registro as any} />
      <Stack.Screen name="Home" component={Home as any} />
      <Stack.Screen name="MisPedidos" component={MisPedidos as any} />
    </Stack.Navigator>
  );
};

export default StackNavigator;