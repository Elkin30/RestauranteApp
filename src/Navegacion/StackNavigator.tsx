import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../Pantallas/Login';
import Registro from '../Pantallas/Registro';
import Home from '../Pantallas/Home';
import { MisPedidos } from '../Pantallas/MisPedidos';
import { useAuth } from '../config/AuthContext';
import { colores } from '../config/tema';

export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  Home: undefined;
  MisPedidos: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const StackNavigator = () => {
  const { session, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="Home" component={Home as any} />
          <Stack.Screen name="MisPedidos" component={MisPedidos as any} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={Login as any} />
          <Stack.Screen name="Registro" component={Registro as any} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;