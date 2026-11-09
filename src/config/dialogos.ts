import { Alert, Platform } from 'react-native';

// En web, react-native-web no implementa Alert.alert (y menos con botones),
// así que se usan los diálogos del navegador.

const textoWeb = (titulo: string, mensaje?: string) => (mensaje ? `${titulo}\n\n${mensaje}` : titulo);

// Mensaje informativo con un solo botón "OK"
export function avisar(titulo: string, mensaje?: string) {
  if (Platform.OS === 'web') window.alert(textoWeb(titulo, mensaje));
  else Alert.alert(titulo, mensaje);
}

// Pregunta Sí/No. Devuelve true si el usuario confirma.
export function confirmar(titulo: string, mensaje: string, textoBoton = 'Aceptar'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(textoWeb(titulo, mensaje)));

  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: 'No', style: 'cancel', onPress: () => resolve(false) },
        { text: textoBoton, style: 'destructive', onPress: () => resolve(true) },
      ],
      // En Android, tocar fuera del diálogo lo cierra: cuenta como "No"
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
