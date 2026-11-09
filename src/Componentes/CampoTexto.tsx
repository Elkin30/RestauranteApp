import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colores } from '../config/tema';

type Props = TextInputProps & {
  etiqueta?: string; // nombre del campo, siempre visible arriba
  error?: string; // mensaje en rojo debajo del campo
  obligatorio?: boolean; // agrega * a la etiqueta
};

// Campo de texto con etiqueta arriba y mensaje de error debajo.
// El placeholder queda como ejemplo de lo que se escribe.
export default function CampoTexto({ etiqueta, error, obligatorio, style, ...props }: Props) {
  return (
    <View style={styles.contenedor}>
      {etiqueta ? (
        <Text style={styles.etiqueta}>
          {etiqueta}
          {obligatorio ? <Text style={styles.asterisco}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colores.gris}
        style={[styles.campo, !!error && styles.campoError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 12 },
  etiqueta: { fontWeight: '700', color: colores.texto, marginBottom: 6 },
  asterisco: { color: colores.error },
  campo: {
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colores.texto,
  },
  campoError: { borderColor: colores.error },
  error: { color: colores.error, fontSize: 13, marginTop: 4 },
});
