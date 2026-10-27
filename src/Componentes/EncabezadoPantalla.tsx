import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colores } from '../config/tema';

type Props = { titulo: string; onVolver?: () => void; textoVolver?: string };

// Título de pantalla con enlace "← Volver" opcional
export default function EncabezadoPantalla({ titulo, onVolver, textoVolver = '← Volver' }: Props) {
  return (
    <View style={styles.contenedor}>
      {onVolver && (
        <TouchableOpacity onPress={onVolver}>
          <Text style={styles.volver}>{textoVolver}</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.titulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 12 },
  volver: { color: colores.primario, fontWeight: '600', marginBottom: 8 },
  titulo: { fontSize: 26, fontWeight: '800', color: colores.texto },
});
