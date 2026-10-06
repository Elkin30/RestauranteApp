import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navegacion/StackNavigator';
import { supabase } from '../config/supabase';
import { obtenerRol, Rol } from '../config/authService';  
import { colores } from '../config/tema';
import Boton from '../Componentes/Boton';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
};

export default function Home({ navigation }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 👇 NUEVO: estados y efecto para saber quién entró
  const [rol, setRol] = useState<Rol>('desconocido');
  const [nombreUsuario, setNombreUsuario] = useState('');

  useEffect(() => {
    obtenerRol().then(({ rol, nombre }) => {
      setRol(rol);
      setNombreUsuario(nombre);
    });
  }, []);
  // 👆 FIN DE LO NUEVO

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
    navigation.replace('Login');
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Menú</Text>

      {/* 👇 NUEVO: saludo con el rol */}
      <Text style={{ color: colores.gris, marginBottom: 12 }}>
        Hola {nombreUsuario || 'usuario'} · {rol}
      </Text>

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
            <Text style={styles.precio}>${item.precio}</Text>
          </View>
        )}
      />

      <Boton titulo="Cerrar sesión" onPress={cerrarSesion} secundario />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 16 },
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
  precio: { fontSize: 16, fontWeight: '800', color: colores.primario },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
  error: { color: 'red', marginBottom: 12 },
});