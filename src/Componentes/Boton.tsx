import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colores } from '../config/tema';

type Props = { titulo: string; onPress: () => void; cargando?: boolean; secundario?: boolean };

export default function Boton({ titulo, onPress, cargando, secundario }: Props) {
  return (
    <TouchableOpacity
      style={[styles.boton, secundario && styles.secundario]}
      onPress={onPress}
      disabled={cargando}
    >
      {cargando ? (
        <ActivityIndicator color={secundario ? colores.primario : colores.blanco} />
      ) : (
        <Text style={[styles.texto, secundario && { color: colores.primario }]}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: { backgroundColor: colores.primario, padding: 14, borderRadius: 10, alignItems: 'center' },
  secundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colores.primario },
  texto: { color: colores.blanco, fontWeight: '700', fontSize: 16 },
});