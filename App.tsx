import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { StackNavigator } from './src/Navegacion/StackNavigator';
import { AuthProvider } from './src/config/AuthContext';
import { CarritoProvider } from './src/config/CarritoContext';

export default function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <StackNavigator />
        </NavigationContainer>
      </CarritoProvider>
    </AuthProvider>
  );
}