import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../Pantallas/Login';
import Registro from '../Pantallas/Registro';
import Home from '../Pantallas/Home';
import { MisPedidos } from '../Pantallas/MisPedidos';
import Carrito from '../Pantallas/Carrito';
import DetallePedido from '../Pantallas/DetallePedido';
import AdminPanel from '../Pantallas/AdminPanel';
import AdminProductos from '../Pantallas/AdminProductos';
import AdminMesas from '../Pantallas/AdminMesas';
import AdminEmpleados from '../Pantallas/AdminEmpleados';
import AdminPedidos from '../Pantallas/AdminPedidos';
import PanelMesero from '../Pantallas/PanelMesero';
import PedidoMesa from '../Pantallas/PedidoMesa';
import PanelRepartidor from '../Pantallas/PanelRepartidor';
import { useAuth } from '../config/AuthContext';
import { colores } from '../config/tema';

export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  Home: undefined;
  MisPedidos: undefined;
  Carrito: undefined;
  DetallePedido: { pedidoId: number };
  AdminPanel: undefined;
  AdminProductos: undefined;
  AdminMesas: undefined;
  AdminEmpleados: undefined;
  AdminPedidos: undefined;
  PanelMesero: undefined;
  PedidoMesa: { mesaId: number; numeroMesa: number };
  PanelRepartidor: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const StackNavigator = () => {
  const { session, rol, cargando } = useAuth();

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
          <Stack.Screen name="Carrito" component={Carrito as any} />
          <Stack.Screen name="DetallePedido" component={DetallePedido as any} />

          {/* Rutas por rol: solo existen para quien tiene ese rol */}
          {rol === 'admin' && (
            <>
              <Stack.Screen name="AdminPanel" component={AdminPanel as any} />
              <Stack.Screen name="AdminProductos" component={AdminProductos as any} />
              <Stack.Screen name="AdminMesas" component={AdminMesas as any} />
              <Stack.Screen name="AdminEmpleados" component={AdminEmpleados as any} />
              <Stack.Screen name="AdminPedidos" component={AdminPedidos as any} />
            </>
          )}
          {(rol === 'mesero' || rol === 'admin') && (
            <>
              <Stack.Screen name="PanelMesero" component={PanelMesero as any} />
              <Stack.Screen name="PedidoMesa" component={PedidoMesa as any} />
            </>
          )}
          {rol === 'repartidor' && (
            <Stack.Screen name="PanelRepartidor" component={PanelRepartidor as any} />
          )}
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