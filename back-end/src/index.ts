import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Conectar a MongoDB
connectDB();

// Middleware
app.use(helmet());
// Configurar CORS para permitir los puertos de desarrollo del frontend
const allowedOrigins = [
  // Origen configurado por variable de entorno (recomendado)
  process.env.FRONTEND_URL,
  // Dominio de Render del frontend conocido
  'https://innovatube-frontend-uwy6.onrender.com',
  // Puertos locales de desarrollo
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4200'
].filter(Boolean) as string[];

const allowAllOrigins = process.env.ALLOW_CORS_ALL === 'true';

// Log básico para depuración de CORS
app.use((req, _res, next) => {
  if (req.method === 'OPTIONS' || req.path.startsWith('/api/')) {
    console.log('CORS check:', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
    });
  }
  next();
});

const corsOptions: cors.CorsOptions = allowAllOrigins
  ? {
      origin: true, // refleja el origin del request
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    }
  : {
      origin: (origin, callback) => {
        // Permitir solicitudes sin origen (como herramientas internas, pruebas, o curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS bloqueado para origen: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    };

app.use(cors(corsOptions));
// Asegurar respuesta correcta a preflights
app.options('*', cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API de InnovaTube funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a InnovaTube API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      videos: '/api/videos',
      health: '/health'
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo global de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Configurar puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor InnovaTube ejecutándose en puerto ${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configurado' : 'No configurado'}`);
  console.log(`📺 YouTube API: ${process.env.YOUTUBE_API_KEY ? 'Configurada' : 'No configurada'}`);
});

export default app;