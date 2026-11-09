// Lógica del juego de la culebrita (Snake). Solo funciones puras:
// reciben un estado y devuelven uno nuevo, sin tocar la pantalla.

export const TAMANO_TABLERO = 20; // casillas por lado
export const PUNTOS_POR_COMIDA = 10;
export const PUNTOS_POR_NIVEL = 50; // cada 50 puntos aumenta la velocidad
export const VELOCIDAD_INICIAL = 160; // milisegundos entre pasos
export const AUMENTO_VELOCIDAD = 12; // milisegundos menos por nivel
export const VELOCIDAD_MAXIMA = 70; // el intervalo nunca baja de aquí

export type Punto = { x: number; y: number };
export type Direccion = 'arriba' | 'abajo' | 'izquierda' | 'derecha';

export type EstadoJuego = {
  culebra: Punto[]; // la cabeza es el primer elemento
  direccion: Direccion; // última dirección en la que se movió
  comida: Punto;
  puntos: number;
  terminado: boolean;
};

const MOVIMIENTO: Record<Direccion, Punto> = {
  arriba: { x: 0, y: -1 },
  abajo: { x: 0, y: 1 },
  izquierda: { x: -1, y: 0 },
  derecha: { x: 1, y: 0 },
};

const OPUESTA: Record<Direccion, Direccion> = {
  arriba: 'abajo',
  abajo: 'arriba',
  izquierda: 'derecha',
  derecha: 'izquierda',
};

const mismaCasilla = (a: Punto, b: Punto) => a.x === b.x && a.y === b.y;

// No se puede dar la vuelta en sentido contrario: en ese caso se sigue igual
export const cambiarDireccion = (actual: Direccion, nueva: Direccion): Direccion =>
  nueva === OPUESTA[actual] ? actual : nueva;

// Casilla libre al azar (null si la culebra llenó el tablero)
export function casillaLibreAlAzar(culebra: Punto[], aleatorio: () => number = Math.random): Punto | null {
  const libres: Punto[] = [];
  for (let y = 0; y < TAMANO_TABLERO; y++) {
    for (let x = 0; x < TAMANO_TABLERO; x++) {
      if (!culebra.some((p) => p.x === x && p.y === y)) libres.push({ x, y });
    }
  }
  if (libres.length === 0) return null;
  return libres[Math.floor(aleatorio() * libres.length)];
}

// Culebra de 3 casillas en el centro, mirando a la derecha
export function estadoInicial(aleatorio: () => number = Math.random): EstadoJuego {
  const centro = Math.floor(TAMANO_TABLERO / 2);
  const culebra = [
    { x: centro, y: centro },
    { x: centro - 1, y: centro },
    { x: centro - 2, y: centro },
  ];
  return {
    culebra,
    direccion: 'derecha',
    comida: casillaLibreAlAzar(culebra, aleatorio)!,
    puntos: 0,
    terminado: false,
  };
}

const fueraDelTablero = (p: Punto) => p.x < 0 || p.y < 0 || p.x >= TAMANO_TABLERO || p.y >= TAMANO_TABLERO;

// Avanza la culebra una casilla en la dirección pedida
export function siguientePaso(
  estado: EstadoJuego,
  direccionPedida: Direccion,
  aleatorio: () => number = Math.random
): EstadoJuego {
  if (estado.terminado) return estado;

  const direccion = cambiarDireccion(estado.direccion, direccionPedida);
  const cabeza = estado.culebra[0];
  const nuevaCabeza = { x: cabeza.x + MOVIMIENTO[direccion].x, y: cabeza.y + MOVIMIENTO[direccion].y };
  const come = mismaCasilla(nuevaCabeza, estado.comida);

  // Si no come, la cola se mueve en este mismo paso: esa casilla queda libre
  const cuerpo = come ? estado.culebra : estado.culebra.slice(0, -1);

  if (fueraDelTablero(nuevaCabeza) || cuerpo.some((p) => mismaCasilla(p, nuevaCabeza))) {
    return { ...estado, direccion, terminado: true };
  }

  const culebra = [nuevaCabeza, ...cuerpo];
  if (!come) return { ...estado, culebra, direccion };

  const comida = casillaLibreAlAzar(culebra, aleatorio);
  return {
    culebra,
    direccion,
    // Si ya no hay casillas libres, el tablero está lleno y el juego termina
    comida: comida ?? estado.comida,
    puntos: estado.puntos + PUNTOS_POR_COMIDA,
    terminado: comida === null,
  };
}

// Milisegundos entre pasos según el puntaje
export const intervaloPara = (puntos: number) =>
  Math.max(VELOCIDAD_MAXIMA, VELOCIDAD_INICIAL - Math.floor(puntos / PUNTOS_POR_NIVEL) * AUMENTO_VELOCIDAD);
