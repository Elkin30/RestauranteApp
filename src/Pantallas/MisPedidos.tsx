import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Header } from '../Componentes/Header';
import { obtenerMisPedidos, cancelarPedido, Pedido } from '../services/pedidosService';

export const MisPedidos = ({ navigation }: any) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      const data = await obtenerMisPedidos();
      setPedidos(data || []);
    } catch (e: any) {
      console.log('Error:', e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const handleCancelar = (id: number) => {
    Alert.alert('Cancelar Pedido', '¿Deseas cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          await cancelarPedido(id);
          cargarPedidos();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header titulo="Mis Pedidos" navigation={navigation} />
      {cargando ? (
        <ActivityIndicator size="large" color="#E65100" style={{ marginTop: 40 }} />
      ) : pedidos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>No tienes pedidos registrados aún.</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.tipo}>Pedido #{item.id}</Text>
                <Text style={[styles.estado, { color: item.estado === 'cancelado' ? 'red' : 'green' }]}>
                  {item.estado}
                </Text>
              </View>
              <Text style={styles.total}>Total: ${item.total}</Text>
              {item.estado !== 'cancelado' && (
                <TouchableOpacity style={styles.btnCancelar} onPress={() => handleCancelar(item.id!)}>
                  <Text style={styles.txtCancelar}>Cancelar Pedido</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  tipo: { fontWeight: 'bold', fontSize: 16 },
  estado: { fontWeight: 'bold', textTransform: 'capitalize' },
  total: { fontSize: 16, color: '#E65100', fontWeight: 'bold', marginVertical: 6 },
  btnCancelar: { backgroundColor: '#FFEBEE', padding: 8, borderRadius: 4, alignItems: 'center' },
  txtCancelar: { color: '#D32F2F', fontWeight: 'bold' },
});