import { View, StyleSheet } from 'react-native';
import { colores } from '../config/tema';

export const ANCHO_MAXIMO = 520;

// En pantallas anchas (computador) centra el contenido con un ancho máximo;
// en el celular ocupa todo el ancho como siempre.
export default function ContenedorCentrado({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.fondo}>
      <View style={styles.contenido}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenido: { flex: 1, width: '100%', maxWidth: ANCHO_MAXIMO, alignSelf: 'center' },
});
