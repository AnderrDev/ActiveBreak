# ActiveBreak

API REST para gestionar **pausas activas** en el trabajo: usuarios, catálogo de ejercicios, recordatorios programados por día de la semana e historial de actividad.

Construida con **Node.js + TypeScript**, **Express 5**, **TypeORM** y **PostgreSQL**, siguiendo una **arquitectura hexagonal** (puertos y adaptadores).

## Tecnologías

| Área | Herramienta |
| --- | --- |
| Runtime | Node.js (ESM) + TypeScript |
| Framework HTTP | Express 5 |
| ORM / BD | TypeORM + PostgreSQL |
| Autenticación | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validación | Joi |
| Desarrollo | nodemon + tsx |

## Arquitectura

```
src/
├── domain/            # Entidades de dominio y puertos (interfaces *Port.ts)
├── application/       # Casos de uso (*Application.ts) y AuthApplication (JWT)
├── infraestructure/
│   ├── adapter/       # Implementación de los puertos con TypeORM
│   ├── controller/    # Controladores HTTP
│   ├── routes/        # Definición de rutas Express
│   ├── entities/      # Entidades TypeORM (tablas)
│   ├── util/          # Validaciones con Joi
│   ├── config/        # Variables de entorno y conexión a la BD
│   ├── web/           # App Express y middleware de autenticación
│   └── bootstrap/     # Arranque del servidor HTTP
└── index.ts           # Punto de entrada
```

Flujo de una petición: **Route → Controller → Application (caso de uso) → Port → Adapter → Base de datos**.

## Modelo de datos

```
usuarios ──< recordatorios ──< recordatorio_dias
    │
    └──< historial_actividad >── pausas_activas
```

- **usuarios**: `nombre`, `correo` (único), `contrasena_hash`, `rol` (`usuario` | `admin`), `nivel_salud` (`bajo` | `medio` | `alto`), `activo`.
- **pausas_activas**: `nombre`, `descripcion`, `duracion_minutos`, `intensidad` (`baja` | `media` | `alta`), `activo`.
- **recordatorios**: usuario, `frecuencia_minutos`, `hora_inicio`, `hora_fin`, `activo`.
- **recordatorio_dias**: recordatorio, `dia_semana` (`lunes` … `domingo`).
- **historial_actividad**: usuario, pausa, `fecha_hora`, `completado`, `duracion_real`.

> TypeORM está configurado con `synchronize: true`, por lo que las tablas se crean automáticamente al arrancar (solo recomendado en desarrollo).

## Requisitos

- Node.js 20 o superior
- PostgreSQL

## Instalación

```bash
git clone https://github.com/AnderrDev/ActiveBreak.git
cd ActiveBreak
npm install
cp .env.example .env
```

Completa el `.env`:

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del servidor (obligatorio) |
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL (por defecto `5432`) |
| `DB_USER` | Usuario de la BD |
| `DB_PASSWORD` | Contraseña de la BD |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Clave para firmar los tokens JWT |

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor en desarrollo con recarga automática |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run star` | Ejecuta la versión compilada (`dist/index.js`) |

El servidor queda disponible en `http://localhost:<PORT>/api`.

## Autenticación

1. Crea un usuario con `POST /api/users`.
2. Inicia sesión con `POST /api/login`:

```json
{ "correo": "ana@example.com", "contrasena": "tu_contraseña" }
```

3. Usa el token recibido (válido 1 hora) en las rutas protegidas:

```
Authorization: Bearer <token>
```

## Endpoints

🔒 = requiere token JWT. Todas las rutas llevan el prefijo `/api`.

### Usuarios

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/login` | Iniciar sesión y obtener token |
| POST | `/users` | Crear usuario |
| GET | `/users` 🔒 | Listar usuarios |
| GET | `/users/active` 🔒 | Listar usuarios activos |
| GET | `/users/email/:email` 🔒 | Buscar usuario por correo |
| GET | `/users/:id` 🔒 | Obtener usuario por id |
| PUT | `/users/:id` | Actualizar usuario |
| DELETE | `/users/:id` | Eliminar usuario |

### Pausas activas

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/pausas-activas` | Crear pausa activa |
| GET | `/pausas-activas` 🔒 | Listar pausas |
| GET | `/pausas-activas/activas` 🔒 | Listar pausas activas |
| GET | `/pausas-activas/:id` 🔒 | Obtener pausa por id |
| PUT | `/pausas-activas/:id` | Actualizar pausa |
| DELETE | `/pausas-activas/:id` | Eliminar pausa |

### Recordatorios

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/recordatorios` 🔒 | Crear recordatorio |
| GET | `/recordatorios` 🔒 | Listar recordatorios |
| GET | `/recordatorios/active` 🔒 | Listar recordatorios activos |
| GET | `/recordatorios/:id` 🔒 | Obtener recordatorio por id |
| GET | `/recordatorios/user/:userId` 🔒 | Recordatorios de un usuario |
| PUT | `/recordatorios/:id` 🔒 | Actualizar recordatorio |
| DELETE | `/recordatorios/:id` 🔒 | Eliminar recordatorio |

### Días de recordatorio

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/recordatorio-dia` 🔒 | Asignar un día a un recordatorio |
| GET | `/recordatorio-dia` 🔒 | Listar días |
| GET | `/recordatorio-dia/:id` 🔒 | Obtener por id |
| GET | `/recordatorio-dia/recordatorio/:recordatorioId` 🔒 | Días de un recordatorio |
| DELETE | `/recordatorio-dia/:id` 🔒 | Eliminar |

### Historial de actividad

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/historial` | Registrar una pausa realizada |
| GET | `/historial` 🔒 | Listar historial |
| GET | `/historial/usuario/:usuarioId` 🔒 | Historial de un usuario |
| GET | `/historial/pausa/:pausaId` 🔒 | Historial de una pausa |
| GET | `/historial/:id` 🔒 | Obtener registro por id |
| DELETE | `/historial/:id` | Eliminar registro |

Ejemplo de cuerpo para `POST /api/historial`:

```json
{
  "usuarioId": 1,
  "pausaId": 3,
  "fechaHora": "2026-11-14T10:00",
  "completado": true,
  "duracionReal": 5
}
```

## Documentación adicional

En [`Artefactos_ActiveBreak.pdf`](Artefactos_ActiveBreak.pdf) se encuentran los artefactos de diseño del proyecto.
