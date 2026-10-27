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

## Estructura del proyecto
```
src/
├── Componentes/   Componentes reutilizables (Boton, CampoTexto, Header,
│                  EncabezadoPantalla, EtiquetaEstado, Opciones)
├── config/        Cliente Supabase, tema, autenticación (AuthContext),
│                  carrito (CarritoContext), estados y validaciones
├── Navegacion/    Navegador con rutas protegidas por sesión y por rol
├── Pantallas/     Vistas de la aplicación
│                  · Cliente: Home, Carrito, MisPedidos, DetallePedido
│                  · Mesero: PanelMesero, PedidoMesa
│                  · Repartidor: PanelRepartidor
│                  · Administrador: AdminPanel, AdminPedidos, AdminProductos,
│                    AdminMesas, AdminEmpleados
│                  · Acceso: Login, Registro
└── services/      Acceso a datos: pedidos, domicilios, empleados, mesas, productos
```

## Base de datos
Tablas: `clientes`, `empleados`, `mesas`, `productos`, `pedidos`, `detalles_pedido`, `domicilios`.
La dirección de cada domicilio se guarda en `domicilios.direccion_entrega`.

Los scripts SQL están en la carpeta `Database/`:
- `01_seguridad_y_rls.sql`: restricciones, trigger de registro de clientes, funciones de rol y políticas RLS (qué puede ver y modificar cada rol). Se ejecuta completo en Supabase → SQL Editor y se puede ejecutar varias veces.

## Autores
Elkin y Paola
