// Reglas de validación de todos los formularios de la app.
// Cada función devuelve el mensaje de error, o undefined si el valor es válido.

export const DOMINIOS_PERMITIDOS = ['gmail.com', 'hotmail.com'];

export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 12;
export const NOMBRE_MIN = 3;
export const NOMBRE_MAX = 50;
export const TELEFONO_DIGITOS = 10;
export const DIRECCION_MIN = 5;
export const DIRECCION_MAX = 100;
export const PRODUCTO_NOMBRE_MIN = 3;
export const PRODUCTO_NOMBRE_MAX = 60;

const MENSAJE_PASSWORD = `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres, con al menos una letra y un número.`;

// Errores de un formulario: un mensaje (o nada) por cada campo
export type Errores<T> = Partial<Record<keyof T, string>>;

export const sinErrores = (errores: Errores<any>) => Object.values(errores).every((e) => !e);

// ---------- Correo ----------

// Minúsculas y sin espacios: se usa antes de validar y antes de enviar a Supabase
export const normalizarEmail = (email: string) => email.replace(/\s/g, '').toLowerCase();

export const esEmailValido = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizarEmail(email));

export function validarEmail(email: string) {
  const e = normalizarEmail(email);
  if (!e) return 'El correo es obligatorio.';
  if (!esEmailValido(e)) return 'Escribe un correo válido.';
  const dominio = e.split('@')[1];
  if (!DOMINIOS_PERMITIDOS.includes(dominio)) return 'Usa un correo de Gmail o Hotmail.';
}

// ---------- Contraseña ----------

const largoPasswordValido = (password: string) =>
  password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;

// Para crear cuentas: largo + al menos una letra y un número
export function validarPassword(password: string) {
  if (!largoPasswordValido(password) || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password) || !/\d/.test(password)) {
    return MENSAJE_PASSWORD;
  }
}

// Para iniciar sesión: solo el largo (puede haber cuentas viejas sin la regla de letra y número)
export function validarPasswordLogin(password: string) {
  if (!largoPasswordValido(password)) {
    return `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`;
  }
}

export function validarConfirmacion(password: string, confirmacion: string) {
  if (password !== confirmacion) return 'Las contraseñas no coinciden.';
}

// ---------- Datos personales ----------

export function validarNombre(nombre: string) {
  const n = nombre.trim();
  if (!n) return 'El nombre es obligatorio.';
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(n)) return 'El nombre solo puede tener letras y espacios.';
  if (n.length < NOMBRE_MIN || n.length > NOMBRE_MAX) {
    return `El nombre debe tener entre ${NOMBRE_MIN} y ${NOMBRE_MAX} caracteres.`;
  }
}

// Celular de Colombia: exactamente 10 dígitos
export function validarTelefono(telefono: string) {
  const t = telefono.trim();
  if (!t) return 'El teléfono es obligatorio.';
  if (!new RegExp(`^\\d{${TELEFONO_DIGITOS}}$`).test(t)) {
    return `El teléfono debe tener exactamente ${TELEFONO_DIGITOS} números.`;
  }
}

export function validarDireccion(direccion: string) {
  const d = direccion.trim();
  if (!d) return 'Escribe la dirección de entrega.';
  if (d.length < DIRECCION_MIN || d.length > DIRECCION_MAX) {
    return `La dirección debe tener entre ${DIRECCION_MIN} y ${DIRECCION_MAX} caracteres.`;
  }
}

// ---------- Administración ----------

export function validarNombreProducto(nombre: string) {
  const n = nombre.trim();
  if (!n) return 'El nombre es obligatorio.';
  if (n.length < PRODUCTO_NOMBRE_MIN || n.length > PRODUCTO_NOMBRE_MAX) {
    return `El nombre debe tener entre ${PRODUCTO_NOMBRE_MIN} y ${PRODUCTO_NOMBRE_MAX} caracteres.`;
  }
}

// Número entero mayor a 0 (precio, número de mesa, capacidad)
export function validarNumeroPositivo(valor: string, campo: string) {
  const n = Number(valor);
  if (!valor.trim() || isNaN(n) || n <= 0) return `${campo} debe ser mayor a 0.`;
}

// ---------- Errores de Supabase ----------

export function mensajeErrorAuth(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes('invalid login credentials'))
    return 'Correo o contraseña incorrectos, o la cuenta no existe.';
  if (m.includes('email not confirmed'))
    return 'Debes confirmar tu correo antes de entrar.';
  if (m.includes('user already registered'))
    return 'Ya existe una cuenta con ese correo.';
  if (m.includes('rate limit'))
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  if (m.includes('network') || m.includes('fetch'))
    return 'No hay conexión con el servidor. Revisa tu internet.';
  if (m.includes('password'))
    return 'El servidor rechazó la contraseña. Prueba con otra.';
  if (m.includes('email') && m.includes('invalid'))
    return 'El servidor rechazó el correo. Revisa que esté bien escrito.';
  return 'Ocurrió un error. Inténtalo de nuevo.';
}
