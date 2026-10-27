import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colores } from '../config/tema';

type Props<T extends string | number> = {
  opciones: { valor: T; etiqueta: string }[];
  seleccionada: T | null;
  onCambiar: (valor: T) => void;
};

// Fila de botones para elegir una opción (reemplaza a un "select")
export default function Opciones<T extends string | number>({ opciones, seleccionada, onCambiar }: Props<T>) {
  return (
    <View style={styles.fila}>
      {opciones.map((o) => {
        const activa = o.valor === seleccionada;
        return (
          <TouchableOpacity
            key={String(o.valor)}
            style={[styles.opcion, activa && styles.activa]}
            onPress={() => onCambiar(o.valor)}
          >
            <Text style={[styles.texto, activa && styles.textoActivo]}>{o.etiqueta}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  opcion: {
    borderWidth: 1,
    borderColor: colores.primario,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activa: { backgroundColor: colores.primario },
  texto: { color: colores.primario, fontWeight: '600' },
  textoActivo: { color: colores.blanco },
});
