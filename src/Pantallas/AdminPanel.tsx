import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colores } from '../config/tema';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';

const OPCIONES = [
  { ruta: 'AdminPedidos', icono: '🧾', titulo: 'Pedidos', subtitulo: 'Estados y asignación de repartidores' },
  { ruta: 'AdminProductos', icono: '🍔', titulo: 'Productos', subtitulo: 'Menú, precios y disponibilidad' },
  { ruta: 'AdminMesas', icono: '🪑', titulo: 'Mesas', subtitulo: 'Crear y eliminar mesas' },
  { ruta: 'AdminEmpleados', icono: '👥', titulo: 'Empleados', subtitulo: 'Meseros, repartidores y administradores' },
] as const;

export default function AdminPanel({ navigation }: any) {
  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo="Administración" onVolver={() => navigation.goBack()} />
      {OPCIONES.map((o) => (
        <TouchableOpacity key={o.ruta} style={styles.tarjeta} onPress={() => navigation.navigate(o.ruta)}>
          <Text style={styles.icono}>{o.icono}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>{o.titulo}</Text>
            <Text style={styles.subtitulo}>{o.subtitulo}</Text>
          </View>
          <Text style={styles.flecha}>➔</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.blanco,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  icono: { fontSize: 26, marginRight: 12 },
  titulo: { fontSize: 16, fontWeight: '700', color: colores.texto },
  subtitulo: { fontSize: 12, color: colores.gris },
  flecha: { fontSize: 18, color: colores.primario },
});
