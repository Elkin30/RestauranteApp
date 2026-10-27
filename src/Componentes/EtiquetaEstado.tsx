import { Text, StyleSheet } from 'react-native';
import { COLOR_ESTADO, textoEstado } from '../config/estados';
import { colores } from '../config/tema';

// Etiqueta de color con el estado de un pedido, domicilio o mesa
export default function EtiquetaEstado({ estado }: { estado: string }) {
  const color = COLOR_ESTADO[estado] ?? colores.gris;
  return <Text style={[styles.etiqueta, { color, borderColor: color }]}>{textoEstado(estado)}</Text>;
}

const styles = StyleSheet.create({
  etiqueta: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
});
