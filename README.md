# 🍔 RestauranteApp

Aplicación móvil para la gestión de un restaurante: menú, pedidos en mesa, domicilios y administración. Hecha con React Native (Expo) y Supabase.

## Tecnologías
- React Native + Expo + TypeScript
- React Navigation
- Supabase (PostgreSQL, Auth, Row Level Security)

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

## Roles de usuario
| Rol | Acciones |
|---|---|
| Cliente | Se registra desde la app, ve el menú y hace pedidos a domicilio |
| Mesero | Toma pedidos en mesa |
| Repartidor | Gestiona los domicilios asignados |
| Administrador | Gestiona productos, mesas y empleados |

Los empleados no se registran desde la app: los crea el administrador.

## Estructura del proyecto
```
src/
├── Componentes/   Componentes reutilizables (Boton, CampoTexto, Header)
├── config/        Cliente Supabase, tema, autenticación y validaciones
├── Navegacion/    Navegador con rutas protegidas
├── Pantallas/     Vistas de la aplicación
└── services/      Acceso a datos (pedidos, etc.)
```

## Base de datos
Tablas: `clientes`, `empleados`, `mesas`, `productos`, `pedidos`, `detalles_pedido`, `domicilios`.
Los scripts SQL están en la carpeta `database/`.

## Autores
Elkin y Paola