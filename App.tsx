import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { StackNavigator } from './src/Navegacion/StackNavigator';
import { AuthProvider } from './src/config/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <StackNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}