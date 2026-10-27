export const PASSWORD_MIN = 6;

export const esEmailValido = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

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
  return 'Ocurrió un error. Inténtalo de nuevo.';
}