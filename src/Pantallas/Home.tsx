import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../config/AuthContext';
import { useCarrito } from '../config/CarritoContext';
import { colores } from '../config/tema';
import Boton from '../Componentes/Boton';

// Acceso principal según el rol del usuario
const ACCESOS: Record<string, { ruta: string; icono: string; titulo: string; subtitulo: string }[]> = {
  cliente: [{ ruta: 'MisPedidos', icono: '📦', titulo: 'Mis Pedidos', subtitulo: 'Ver y gestionar mis pedidos activos' }],
  admin: [
    { ruta: 'AdminPanel', icono: '⚙️', titulo: 'Administración', subtitulo: 'Pedidos, productos, mesas y empleados' },
    { ruta: 'PanelMesero', icono: '🪑', titulo: 'Mesas', subtitulo: 'Tomar pedidos en mesa' },
  ],
  mesero: [{ ruta: 'PanelMesero', icono: '🪑', titulo: 'Mesas y pedidos', subtitulo: 'Tomar y seguir pedidos en mesa' }],
  repartidor: [{ ruta: 'PanelRepartidor', icono: '🛵', titulo: 'Mis domicilios', subtitulo: 'Pedidos asignados para entregar' }],
};

type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
};

export default function Home({ navigation }: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { rol, nombre: nombreUsuario } = useAuth();
  const { agregar, cantidadTotal, total } = useCarrito();
  const esCliente = rol === 'cliente';

  useEffect(() => {
    const cargar = async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, descripcion, precio, categoria')
        .eq('disponible', true);
      if (error) setError(error.message);
      else setProductos(data ?? []);
      setCargando(false);
    };
    cargar();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Menú</Text>

      <Text style={{ color: colores.gris, marginBottom: 12 }}>
        Hola {nombreUsuario || 'usuario'} · {rol}
      </Text>

      {/* Accesos según el rol */}
      {(ACCESOS[rol] ?? []).map((a) => (
        <TouchableOpacity key={a.ruta} style={styles.cardPedidos} onPress={() => navigation.navigate(a.ruta)}>
          <Text style={{ fontSize: 20, marginRight: 10 }}>{a.icono}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloPedidos}>{a.titulo}</Text>
            <Text style={styles.subtituloPedidos}>{a.subtitulo}</Text>
          </View>
          <Text style={{ fontSize: 18, color: colores.primario }}>➔</Text>
        </TouchableOpacity>
      ))}

      {cargando && <ActivityIndicator size="large" color={colores.primario} />}
      {error && <Text style={styles.error}>Error: {error}</Text>}

      <FlatList
        data={productos}
        keyExtractor={(p) => String(p.id)}
        ListEmptyComponent={!cargando && !error ? <Text style={styles.vacio}>No hay productos disponibles.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              {item.descripcion ? <Text style={styles.descripcion}>{item.descripcion}</Text> : null}
              {item.categoria ? <Text style={styles.categoria}>{item.categoria}</Text> : null}
            </View>
            <View style={styles.columnaPrecio}>
              <Text style={styles.precio}>${item.precio}</Text>
              {esCliente && (
                <TouchableOpacity style={styles.botonAgregar} onPress={() => agregar(item)}>
                  <Text style={styles.textoAgregar}>+ Agregar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* Barra del carrito: solo aparece si hay productos */}
      {esCliente && cantidadTotal > 0 && (
        <TouchableOpacity style={styles.barraCarrito} onPress={() => navigation.navigate('Carrito')}>
          <Text style={styles.textoBarra}>🛒 Ver carrito ({cantidadTotal})</Text>
          <Text style={styles.textoBarra}>${total}</Text>
        </TouchableOpacity>
      )}

      <Boton titulo="Cerrar sesión" onPress={cerrarSesion} secundario />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 8 },
  cardPedidos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.blanco,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  tituloPedidos: { fontSize: 15, fontWeight: '700', color: colores.texto },
  subtituloPedidos: { fontSize: 12, color: colores.gris },
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: colores.blanco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombre: { fontSize: 16, fontWeight: '700', color: colores.texto },
  descripcion: { color: colores.gris, marginTop: 2 },
  categoria: { color: colores.primario, fontSize: 12, marginTop: 4 },
  columnaPrecio: { alignItems: 'flex-end', justifyContent: 'space-between', marginLeft: 8 },
  precio: { fontSize: 16, fontWeight: '800', color: colores.primario },
  botonAgregar: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colores.primario,
  },
  textoAgregar: { color: colores.blanco, fontWeight: '700', fontSize: 13 },
  barraCarrito: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colores.texto,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  textoBarra: { color: colores.blanco, fontWeight: '700', fontSize: 15 },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
  error: { color: '#C62828', marginBottom: 12 },
});