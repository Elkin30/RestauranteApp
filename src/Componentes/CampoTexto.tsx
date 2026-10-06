import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colores } from '../config/tema';

export default function CampoTexto(props: TextInputProps) {
  return <TextInput placeholderTextColor={colores.gris} style={styles.campo} {...props} />;
}

const styles = StyleSheet.create({
  campo: {
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: colores.texto,
  },
});