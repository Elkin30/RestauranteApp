import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { colores } from '../config/tema';
import {
  Producto,
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../services/productosService';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';
import CampoTexto from '../Componentes/CampoTexto';
import Boton from '../Componentes/Boton';

const FORM_VACIO = { nombre: '', descripcion: '', precio: '', categoria: '' };

export default function AdminProductos({ navigation }: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario: editandoId = null → crear; número → editar ese producto
  const [formVisible, setFormVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setProductos(await obtenerProductos());
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setFormVisible(true);
  };

  const abrirEditar = (p: Producto) => {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: String(p.precio),
      categoria: p.categoria ?? '',
    });
    setFormVisible(true);
  };

  const guardar = async () => {
    const precio = Number(form.precio);
    if (!form.nombre.trim()) return Alert.alert('Falta el nombre', 'Escribe el nombre del producto.');
    if (!form.precio || isNaN(precio) || precio < 0) return Alert.alert('Precio inválido', 'Escribe un precio válido.');

    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio,
      categoria: form.categoria.trim() || null,
    };
    setGuardando(true);
    try {
      if (editandoId === null) await crearProducto({ ...datos, disponible: true });
      else await actualizarProducto(editandoId, datos);
      setFormVisible(false);
      cargar();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarDisponible = async (p: Producto, disponible: boolean) => {
    // Se actualiza en pantalla de una vez y se revierte si falla
    setProductos((lista) => lista.map((x) => (x.id === p.id ? { ...x, disponible } : x)));
    try {
      await actualizarProducto(p.id, { disponible });
    } catch {
      setProductos((lista) => lista.map((x) => (x.id === p.id ? { ...x, disponible: !disponible } : x)));
      Alert.alert('Error', 'No se pudo cambiar la disponibilidad.');
    }
  };

  const confirmarEliminar = (p: Producto) => {
    Alert.alert('Eliminar producto', `¿Eliminar "${p.nombre}"?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarProducto(p.id);
            cargar();
          } catch (e: any) {
            Alert.alert('No se pudo eliminar', e?.message ?? 'Inténtalo de nuevo.');
          }
        },
      },
    ]);
  };

  if (formVisible) {
    return (
      <ScrollView style={styles.contenedor} contentContainerStyle={{ paddingBottom: 40 }}>
        <EncabezadoPantalla
          titulo={editandoId === null ? 'Nuevo producto' : 'Editar producto'}
          onVolver={() => setFormVisible(false)}
          textoVolver="← Cancelar"
        />
        <CampoTexto placeholder="Nombre" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} />
        <CampoTexto
          placeholder="Descripción"
          value={form.descripcion}
          onChangeText={(v) => setForm({ ...form, descripcion: v })}
        />
        <CampoTexto
          placeholder="Precio"
          value={form.precio}
          onChangeText={(v) => setForm({ ...form, precio: v.replace(/[^0-9]/g, '') })}
          keyboardType="numeric"
        />
        <CampoTexto
          placeholder="Categoría (ej: Hamburguesas)"
          value={form.categoria}
          onChangeText={(v) => setForm({ ...form, categoria: v })}
        />
        <Boton titulo="Guardar" onPress={guardar} cargando={guardando} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo="Productos" onVolver={() => navigation.goBack()} />
      <Boton titulo="+ Nuevo producto" onPress={abrirNuevo} />
      <View style={{ height: 12 }} />
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={productos}
        keyExtractor={(p) => String(p.id)}
        refreshing={cargando}
        onRefresh={cargar}
        ListEmptyComponent={!cargando ? <Text style={styles.vacio}>No hay productos.</Text> : null}
        renderItem={({ item }) => (
          <View style={[styles.tarjeta, !item.disponible && { opacity: 0.6 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.detalle}>
                ${item.precio}
                {item.categoria ? ` · ${item.categoria}` : ''}
              </Text>
              <View style={styles.acciones}>
                <TouchableOpacity onPress={() => abrirEditar(item)}>
                  <Text style={styles.accion}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmarEliminar(item)}>
                  <Text style={[styles.accion, { color: '#C62828' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Switch
                value={item.disponible}
                onValueChange={(v) => cambiarDisponible(item, v)}
                trackColor={{ true: colores.primario }}
              />
              <Text style={styles.detalle}>{item.disponible ? 'Disponible' : 'Agotado'}</Text>
            </View>
          </View>
        )}
      />
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
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombre: { fontSize: 16, fontWeight: '700', color: colores.texto },
  detalle: { color: colores.gris, fontSize: 12, marginTop: 2 },
  acciones: { flexDirection: 'row', gap: 16, marginTop: 8 },
  accion: { color: colores.primario, fontWeight: '700' },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
  error: { color: '#C62828', marginBottom: 12, textAlign: 'center' },
});
