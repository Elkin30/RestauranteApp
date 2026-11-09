import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colores } from '../config/tema';
import {
  Direccion,
  EstadoJuego,
  TAMANO_TABLERO,
  estadoInicial,
  siguientePaso,
  cambiarDireccion,
  intervaloPara,
} from '../config/culebrita';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';
import Boton from '../Componentes/Boton';

// Colores del Nokia clásico
const VERDE_CLARO = '#9BBC0F';
const VERDE_OSCURO = '#0F380F';

const CLAVE_RECORD = 'culebrita_record';
const ANCHO_MAX_TABLERO = 400;
const MIN_DESLIZAR = 20; // píxeles mínimos para contar un deslizamiento

const TECLAS: Record<string, Direccion> = {
  ArrowUp: 'arriba',
  ArrowDown: 'abajo',
  ArrowLeft: 'izquierda',
  ArrowRight: 'derecha',
  w: 'arriba',
  s: 'abajo',
  a: 'izquierda',
  d: 'derecha',
};

export default function JuegoCulebrita({ navigation }: any) {
  const [estado, setEstado] = useState<EstadoJuego>(() => estadoInicial());
  const [iniciado, setIniciado] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [record, setRecord] = useState(0);

  // Refs para leer los valores actuales dentro del intervalo y de los gestos
  const estadoRef = useRef(estado);
  const direccionRef = useRef<Direccion>(estado.direccion);
  const recordRef = useRef(0);

  // Al salir de la pantalla (o ir a otra) el juego se detiene
  const enfocada = useIsFocused();
  const corriendo = iniciado && !pausado && !estado.terminado && enfocada;
  const intervalo = intervaloPara(estado.puntos);

  const { width } = useWindowDimensions();
  const celda = Math.floor(Math.min(width - 40, ANCHO_MAX_TABLERO) / TAMANO_TABLERO);
  const ladoTablero = celda * TAMANO_TABLERO;

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_RECORD)
      .then((valor) => {
        const r = Number(valor) || 0;
        recordRef.current = r;
        setRecord(r);
      })
      .catch(() => {});
  }, []);

  // Avance automático; se limpia al pausar, perder o salir de la pantalla
  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => {
      const nuevo = siguientePaso(estadoRef.current, direccionRef.current);
      estadoRef.current = nuevo;
      setEstado(nuevo);
      if (nuevo.terminado && nuevo.puntos > recordRef.current) {
        recordRef.current = nuevo.puntos;
        setRecord(nuevo.puntos);
        AsyncStorage.setItem(CLAVE_RECORD, String(nuevo.puntos)).catch(() => {});
      }
    }, intervalo);
    return () => clearInterval(id);
  }, [corriendo, intervalo]);

  // La dirección se compara con la del último paso, así dos toques rápidos
  // no pueden hacer que la culebra se devuelva sobre sí misma
  const girar = useCallback((nueva: Direccion) => {
    if (estadoRef.current.terminado) return;
    direccionRef.current = cambiarDireccion(estadoRef.current.direccion, nueva);
    setIniciado(true);
  }, []);

  const reiniciar = () => {
    const nuevo = estadoInicial();
    estadoRef.current = nuevo;
    direccionRef.current = nuevo.direccion;
    setEstado(nuevo);
    setPausado(false);
    setIniciado(true);
  };

  const alternarPausa = () => {
    if (!iniciado) setIniciado(true);
    else setPausado((p) => !p);
  };

  // Deslizar el dedo (o el mouse) sobre el tablero.
  // La regla react-hooks/refs da un falso positivo: girar() solo lee refs cuando
  // termina el gesto, nunca mientras se dibuja la pantalla.
  const gestos = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Evita que el ScrollView se quede con el gesto al deslizar hacia arriba o abajo
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_e, { dx, dy }) => {
          if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_DESLIZAR) return;
          if (Math.abs(dx) > Math.abs(dy)) girar(dx > 0 ? 'derecha' : 'izquierda');
          else girar(dy > 0 ? 'abajo' : 'arriba');
        },
      }),
    [girar]
  );

  // Teclado: solo en web (flechas y WASD; espacio pausa)
  useEffect(() => {
    if (Platform.OS !== 'web' || !enfocada) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (!e.key) return; // el autocompletado del navegador envía eventos sin tecla
      const direccion = TECLAS[e.key] ?? TECLAS[e.key.toLowerCase()];
      if (direccion) {
        e.preventDefault(); // evita que las flechas desplacen la página
        girar(direccion);
      } else if (e.key === ' ' && !estadoRef.current.terminado) {
        e.preventDefault();
        if (!iniciado) setIniciado(true);
        else setPausado((p) => !p);
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [enfocada, girar, iniciado]);

  const textoPausa = !iniciado ? 'Empezar' : pausado ? 'Continuar' : 'Pausa';

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
      <EncabezadoPantalla titulo="🐍 Culebrita" onVolver={() => navigation.goBack()} />

      <View style={[styles.marcador, { width: ladoTablero }]}>
        <Text style={styles.textoMarcador}>Puntos: {estado.puntos}</Text>
        <Text style={styles.textoMarcador}>Récord: {record}</Text>
      </View>

      <View style={[styles.tablero, { width: ladoTablero, height: ladoTablero }]} {...gestos.panHandlers}>
        <View
          style={[
            styles.comida,
            { width: celda * 0.6, height: celda * 0.6, left: estado.comida.x * celda + celda * 0.2, top: estado.comida.y * celda + celda * 0.2 },
          ]}
        />
        {estado.culebra.map((p, i) => (
          <View
            key={i}
            style={[styles.segmento, { width: celda - 1, height: celda - 1, left: p.x * celda, top: p.y * celda }]}
          />
        ))}

        {(!iniciado || pausado || estado.terminado) && (
          <View style={styles.capa}>
            {estado.terminado ? (
              <>
                <Text style={styles.tituloCapa}>Fin del juego</Text>
                <Text style={styles.textoCapa}>Puntaje: {estado.puntos}</Text>
                <TouchableOpacity style={styles.botonCapa} onPress={reiniciar}>
                  <Text style={styles.textoBotonCapa}>Jugar otra vez</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.tituloCapa}>{iniciado ? 'Pausa' : '¿Listo?'}</Text>
                <Text style={styles.textoCapa}>
                  {Platform.OS === 'web' ? 'Usa las flechas, WASD o los botones' : 'Desliza el dedo o usa las flechas'}
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {/* Flechas en pantalla */}
      <View style={styles.controles}>
        <BotonFlecha texto="▲" onPress={() => girar('arriba')} />
        <View style={styles.filaFlechas}>
          <BotonFlecha texto="◀" onPress={() => girar('izquierda')} />
          <View style={styles.espacioFlecha} />
          <BotonFlecha texto="▶" onPress={() => girar('derecha')} />
        </View>
        <BotonFlecha texto="▼" onPress={() => girar('abajo')} />
      </View>

      {!estado.terminado && (
        <View style={{ width: ladoTablero }}>
          <Boton titulo={textoPausa} onPress={alternarPausa} secundario={iniciado && !pausado} />
        </View>
      )}
    </ScrollView>
  );
}

function BotonFlecha({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.flecha} onPress={onPress}>
      <Text style={styles.textoFlecha}>{texto}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, paddingTop: 56, alignItems: 'center' },
  marcador: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  textoMarcador: { fontSize: 16, fontWeight: '800', color: VERDE_OSCURO },
  tablero: {
    backgroundColor: VERDE_CLARO,
    borderWidth: 3,
    borderColor: VERDE_OSCURO,
    boxSizing: 'content-box', // el borde va por fuera: las casillas no quedan recortadas
    position: 'relative',
    overflow: 'hidden',
  },
  segmento: { position: 'absolute', backgroundColor: VERDE_OSCURO },
  comida: { position: 'absolute', backgroundColor: VERDE_OSCURO, borderRadius: 2 },
  capa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(155, 188, 15, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  tituloCapa: { fontSize: 28, fontWeight: '900', color: VERDE_OSCURO, marginBottom: 6 },
  textoCapa: { fontSize: 15, color: VERDE_OSCURO, textAlign: 'center', marginBottom: 12 },
  botonCapa: { backgroundColor: VERDE_OSCURO, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  textoBotonCapa: { color: VERDE_CLARO, fontWeight: '800', fontSize: 16 },
  controles: { alignItems: 'center', marginVertical: 16 },
  filaFlechas: { flexDirection: 'row' },
  espacioFlecha: { width: 64, height: 64 },
  flecha: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: VERDE_OSCURO,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  textoFlecha: { color: VERDE_CLARO, fontSize: 24, fontWeight: '900' },
});
