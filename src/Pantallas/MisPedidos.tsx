import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Header } from '../Componentes/Header';
import { obtenerMisPedidos, cancelarPedido, Pedido } from '../services/pedidosService';
import { colores } from '../config/tema';
import { COLOR_ESTADO, textoEstado } from '../config/estados';

export const MisPedidos = ({ navigation }: any) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPedidos = () =>
    obtenerMisPedidos()
      .then((data) => setPedidos(data || []))
      .catch(() => setError('No se pudieron cargar los pedidos. Revisa tu conexión.'))
      .finally(() => setCargando(false));

  // La primera carga ya arranca con cargando = true y sin error
  useEffect(() => {
    cargarPedidos();
  }, []);

  const recargarPedidos = () => {
    setCargando(true);
    setError(null);
    cargarPedidos();
  };

  const handleCancelar = (id: number) => {
    Alert.alert('Cancelar Pedido', '¿Deseas cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelarPedido(id);
          } catch (e: any) {
            Alert.alert('No se pudo cancelar', e?.message ?? 'Inténtalo de nuevo.');
          }
          recargarPedidos();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header titulo="Mis Pedidos" navigation={navigation} />
      <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()}>
        <Text style={styles.txtVolver}>← Volver al menú</Text>
      </TouchableOpacity>
      {cargando ? (
        <ActivityIndicator size="large" color={colores.primario} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={recargarPedidos}>
            <Text style={styles.txtVolver}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>No tienes pedidos registrados aún.</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={recargarPedidos}
          refreshing={cargando}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('DetallePedido', { pedidoId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.tipo}>Pedido #{item.id}</Text>
                <Text style={[styles.estado, { color: COLOR_ESTADO[item.estado] ?? colores.gris }]}>
                  {textoEstado(item.estado)}
                </Text>
              </View>
              <Text style={styles.total}>Total: ${item.total}</Text>
              {item.estado === 'pendiente' && (
                <TouchableOpacity style={styles.btnCancelar} onPress={() => handleCancelar(item.id!)}>
                  <Text style={styles.txtCancelar}>Cancelar Pedido</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.verDetalle}>Ver productos ›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colores.fondo },
  volver: { paddingHorizontal: 16, paddingTop: 12 },
  txtVolver: { color: colores.primario, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: colores.gris },
  error: { color: '#C62828', marginBottom: 12, textAlign: 'center' },
  card: {
    backgroundColor: colores.blanco,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  tipo: { fontWeight: 'bold', fontSize: 16, color: colores.texto },
  estado: { fontWeight: 'bold', textTransform: 'capitalize' },
  total: { fontSize: 16, color: colores.primario, fontWeight: 'bold', marginVertical: 6 },
  btnCancelar: { backgroundColor: '#FFEBEE', padding: 8, borderRadius: 6, alignItems: 'center' },
  txtCancelar: { color: '#D32F2F', fontWeight: 'bold' },
  verDetalle: { color: colores.gris, fontSize: 12, marginTop: 8, textAlign: 'right' },
});
