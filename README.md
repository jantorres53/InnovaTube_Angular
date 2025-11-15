Proyecto con frontend Angular y backend Node.js/Express. El frontend usa Angular Material y el backend autentica con JWT. Aquí encontrarás lo necesario para levantar ambos en desarrollo y producción.

## Visión General
- Frontend Angular: interfaz para autenticación, búsqueda y reproducción de videos, favoritos y playlists. UI responsiva con Angular Material y protección con reCAPTCHA.
- Backend Express: API REST que maneja autenticación JWT, persistencia en MongoDB, integración con YouTube Data API y verificación de reCAPTCHA.

## Frontend (Angular)
- Framework: Angular 17 (standalone components)
- UI: Angular Material
- Estado y datos: RxJS, HttpClient
- Seguridad: reCAPTCHA (Google), Auth Guard, Interceptor de Auth
- Responsivo: estilos y media queries personalizados
- SSR: dependencias para Angular SSR incluidas

### Características Principales
- Autenticación: login, registro, recuperar y restablecer contraseña
- Dashboard: búsqueda de videos (YouTube), vista previa embebida, favoritos
- Playlists: creación y gestión básica (persistencia local)
- Experiencia móvil: navbar optimizada, modales full-screen en móviles, inputs táctiles
- Indicadores: spinner de carga, mensajes de error de credenciales

### Librerías y Dependencias
- `@angular/*` (core, router, forms, animations)
- `@angular/material`
- `rxjs`, `zone.js`
- Dev tooling: `@angular/cli`, `karma`, `jasmine`
- Estilos: Angular Material y CSS

### Scripts
- `npm start`: desarrollo (`ng serve` en puerto 4200)
- `npm run build`: build producción
- `npm test`: unit tests (Karma/Jasmine)
- `npm run serve:ssr:Front-end-Angular`: ejecutar bundle SSR generado

### Configuración
- Las variables del frontend se ubican en `Front-end-Angular/src/environments/`.
  - Edita `environment.ts` y `environment.development.ts` para definir:
    - `apiUrl`: URL base del backend (ej. `http://localhost:5000`)
    - `recaptchaSiteKey`: clave de sitio de Google reCAPTCHA
- `index.html` incluye el script de reCAPTCHA: `https://www.google.com/recaptcha/api.js`

### Ubicaciones Clave
- Navbar y dashboard: `src/app/pages/dashboard/dashboard.component.*`
- Autenticación y guards: `src/app/services/auth.service.ts`, `src/app/interceptors/auth.interceptor.ts`, `src/app/guards/*`
- Login: `src/app/pages/login/login.component.*`
- Registro: `src/app/pages/register/register.component.*`
- Rutas: `src/app/app.routes.ts`

### Ejecución (Frontend)
1. `cd Front-end-Angular`
2. `npm install`
3. Configura `src/environments/*.ts` con `apiUrl` y `recaptchaSiteKey`
4. `npm start` y abre `http://localhost:4200`

---

## Backend (Node.js/Express)
- Framework: Express 4
- Base de datos: MongoDB (Mongoose)
- Seguridad: JWT, bcrypt, helmet, CORS
- Email: Nodemailer (SMTP configurable)
- Logs: morgan
- Configuración: dotenv

### Características Principales
- Autenticación basada en JWT: registro, login, logout, perfil (`/api/auth/*`)
- Sesiones: revocación y verificación de JWT y sesiones persistidas
- YouTube: endpoint de búsqueda (`/api/videos/search`) proxy hacia API de YouTube
- Salud: `GET /health`
- CORS: configuración flexible para orígenes de frontend en desarrollo y producción

### Librerías y Dependencias
- `express`, `cors`, `helmet`, `morgan`
- `mongoose`
- `jsonwebtoken`, `bcrypt`
- `nodemailer`
- `dotenv`, `axios`, `node-fetch`
- Dev: `typescript`, `ts-node`, `nodemon`

### Estructura (resumen)
```
back-end/
├─ src/
│  ├─ config/           # Conexión a BD
│  ├─ controllers/      # Controladores (auth, etc.)
│  ├─ middleware/       # Autenticación
│  ├─ models/           # Modelos Mongoose
│  ├─ routes/           # Rutas API
│  ├─ services/         # Servicios (auth, youtube, mail)
│  └─ index.ts          # Entrada del servidor
└─ package.json
```

### Variables de Entorno (Backend)
- Básicas:
  - `PORT` (ej. `5000`)
  - `NODE_ENV` (`development` | `production`)
  - `MONGODB_URI` (URI de MongoDB Atlas)
  - `JWT_SECRET` (secreto JWT)
  - `JWT_EXPIRE` (ej. `7d`)
  - `YOUTUBE_API_KEY` (API key de YouTube Data API v3)
  - `RECAPTCHA_SECRET_KEY` (clave secreta de reCAPTCHA)
  - `FRONTEND_URL` (ej. `http://localhost:4200`)
  - Opcional: `ALLOW_CORS_ALL` (`true` para permitir cualquier origen en dev)
- SMTP (para recuperación de password):
  - `SMTP_USERNAME`, `SMTP_PASSWORD`
  - `SMTP_HOST` (ej. `smtp.gmail.com`), `SMTP_PORT` (ej. `587`)
  - `SMTP_SECURE` (`true|false`), `SMTP_REQUIRE_TLS` (`true|false`)

### Scripts
- `npm run dev`: desarrollo con `nodemon`
- `npm run build`: compila TypeScript a `dist`
- `npm start`: producción (`node dist/index.js`)

### Ejecución (Backend)
1. `cd back-end`
2. `npm install`
3. Crear `.env` con las variables anteriores
4. `npm run dev` → API en `http://localhost:5000`

### Endpoints Básicos
- `GET /health`: estado del servidor
- `POST /api/auth/register`: registro
- `POST /api/auth/login`: login
- `POST /api/auth/logout`: logout
- `GET /api/auth/me`: perfil (autenticado)
- `GET /api/videos/search?query=...`: búsqueda de videos

### CORS
- Orígenes permitidos incluyen puertos locales (`http://localhost:4200`) y el dominio de despliegue configurado.
- Para habilitar todos los orígenes (solo desarrollo), utiliza `ALLOW_CORS_ALL=true`.

---

## Desarrollo Conjunto
- Arranca el backend en `http://localhost:5000` y el frontend en `http://localhost:4200`.
- Configura `apiUrl` del frontend apuntando al backend.
- Verifica reCAPTCHA: en frontend configura `recaptchaSiteKey`, en backend `RECAPTCHA_SECRET_KEY`.

## Producción
- Backend: `npm run build` y `npm start` (usa `.env` de producción)
- Frontend: `npm run build` y sirve el contenido `dist/front-end-angular` en tu hosting preferido; opcionalmente usa el script SSR.
