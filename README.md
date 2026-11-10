# 🍔 RestauranteApp

Aplicación móvil para la gestión de un restaurante: menú, pedidos en mesa, domicilios y administración. Hecha con React Native (Expo) y Supabase.

## Tecnologías
- React Native + Expo + TypeScript
- React Navigation
- Supabase (PostgreSQL, Auth, Row Level Security)
- ESLint (`eslint-config-expo`)

## Requisitos
- Node.js (versión LTS) y npm
- App **Expo Go** en el celular, o un emulador
- Acceso al proyecto de Supabase

## Instalación
```bash
git clone https://github.com/Elkin30/RestauranteApp.git
cd RestauranteApp
npm install
```

## Variables de entorno
Copia `.env.example` como `.env` y completa los valores (URL y *publishable key* del proyecto, en Supabase → Project Settings → API Keys):

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=
```

El archivo `.env` no se sube al repositorio.

## Ejecución
```bash
npx expo start -c
```
Escanea el código QR con Expo Go (el celular y el computador deben estar en la misma red Wi‑Fi).

### Abrir en el navegador (web)
```bash
npm run web        # equivale a: npx expo start --web
```
Se abre sola en `http://localhost:8081`. Si ya tienes `npx expo start` corriendo, presiona la tecla **w** en la terminal.

En el computador el contenido se muestra centrado con un ancho máximo de 520 px. Las confirmaciones (cancelar pedido, eliminar, liberar mesa…) usan los diálogos del navegador.

Para generar la versión web estática (carpeta `dist/`):
```bash
npx expo export --platform web
```

### Revisión del código
```bash
npx tsc --noEmit   # revisión de tipos
npm run lint       # ESLint (equivale a npx expo lint)
```

## Roles de usuario
Al iniciar sesión, la pantalla de inicio muestra los accesos según el rol. Las pantallas de cada rol solo existen para quien tiene ese rol.

| Rol | Acciones |
|---|---|
| Cliente | Se registra desde la app, ve el menú, arma un carrito y hace pedidos a domicilio con su dirección de entrega. En **Mis Pedidos** ve el estado y los productos de cada pedido, y puede cancelarlo mientras esté pendiente |
| Mesero | En **Mesas** ve las mesas por estado, toma pedidos en mesa, avanza el estado de los pedidos activos y libera mesas |
| Repartidor | En **Mis domicilios** ve los domicilios asignados con dirección y datos del cliente, marca "Salí a entregar" y "Entregado", y consulta su historial |
| Administrador | En **Administración** gestiona pedidos (estados, cancelación y asignación de repartidor), productos (precio y disponibilidad), mesas y empleados. También tiene acceso al panel de mesas |

Los empleados no se registran desde la app: los crea el administrador en **Administración → Empleados**, con un correo y una contraseña inicial. Si en Supabase está activada la confirmación de correo, el empleado debe confirmarlo antes de iniciar sesión.

## Estados de los pedidos
- **Mesa:** `pendiente` → `en_preparacion` → `listo` → `entregado`
- **Domicilio:** `pendiente` → `en_preparacion` → `listo` → `en_camino` → `entregado`
  (el repartidor marca `en_camino` y `entregado`)
- Cualquier pedido se puede `cancelar`; el cliente solo puede hacerlo mientras esté `pendiente`.
- Mesas: `libre`, `ocupada`, `reservada`. Al tomar un pedido la mesa pasa a `ocupada`.

## Validaciones de formularios
Todas las reglas están en `src/config/validaciones.ts`. Cada campo muestra su nombre arriba (etiqueta), un `*` si es obligatorio y su error en rojo debajo; el error se borra al volver a escribir en el campo.

| Campo | Regla |
|---|---|
| Correo | Formato válido y solo dominios de `DOMINIOS_PERMITIDOS` (`gmail.com`, `hotmail.com`). Se pasa a minúsculas y sin espacios antes de validar y enviar |
| Contraseña | Entre 6 y 12 caracteres (`PASSWORD_MIN` / `PASSWORD_MAX`), con al menos una letra y un número. En **Login** solo se revisa el largo, por las cuentas creadas antes de esta regla |
| Confirmar contraseña | Debe coincidir con la contraseña (Registro y crear empleado) |
| Nombre | Obligatorio, solo letras y espacios (con tildes y ñ), entre 3 y 50 caracteres |
| Teléfono | Celular de Colombia: exactamente 10 números |
| Dirección de entrega | Entre 5 y 100 caracteres |
| Producto | Nombre entre 3 y 60 caracteres; precio mayor a 0 |
| Mesa | Número y capacidad mayores a 0 |

Los errores que devuelve Supabase se traducen con `mensajeErrorAuth()`.

## Juego: Culebrita 🐍
Cualquier persona puede jugar **Culebrita** (Snake estilo Nokia): sin cuenta, desde el enlace de la pantalla de **Login**, y con sesión iniciada, desde la tarjeta del inicio (para todos los roles).

- **Controles:** flechas en pantalla o deslizar el dedo sobre el tablero. En el navegador también funcionan las flechas del teclado, WASD y la barra espaciadora para pausar.
- Cada comida suma 10 puntos y alarga la culebra; cada 50 puntos la velocidad aumenta.
- Se pierde al chocar con una pared o consigo misma. El récord se guarda en el dispositivo.
- La lógica del juego (mover, comer, chocar) está en `src/config/culebrita.ts`, separada de la pantalla.

## Estructura del proyecto
```
src/
├── Componentes/   Componentes reutilizables (Boton, CampoTexto, Header,
│                  EncabezadoPantalla, EtiquetaEstado, Opciones,
│                  ContenedorCentrado: ancho máximo en pantallas grandes)
├── config/        Cliente Supabase, tema, autenticación (AuthContext),
│                  carrito (CarritoContext), estados, validaciones,
│                  dialogos (avisos y confirmaciones para móvil y web)
│                  y culebrita (lógica del juego)
├── Navegacion/    Navegador con rutas protegidas por sesión y por rol
├── Pantallas/     Vistas de la aplicación
│                  · Cliente: Home, Carrito, MisPedidos, DetallePedido
│                  · Mesero: PanelMesero, PedidoMesa
│                  · Repartidor: PanelRepartidor
│                  · Administrador: AdminPanel, AdminPedidos, AdminProductos,
│                    AdminMesas, AdminEmpleados
│                  · Acceso: Login, Registro
│                  · Todos, con o sin sesión: JuegoCulebrita
└── services/      Acceso a datos: pedidos, domicilios, empleados, mesas, productos
```

## Base de datos
Tablas: `clientes`, `empleados`, `mesas`, `productos`, `pedidos`, `detalles_pedido`, `domicilios`.
La dirección de cada domicilio se guarda en `domicilios.direccion_entrega`.

Los scripts SQL están en la carpeta `Database/`:
- `01_seguridad_y_rls.sql`: restricciones, trigger de registro de clientes, funciones de rol y políticas RLS (qué puede ver y modificar cada rol). Se ejecuta completo en Supabase → SQL Editor y se puede ejecutar varias veces.

## Autores
Elkin y Paola
