// src/app.js
import express from 'express';
import cors from 'cors';
import dbConnect from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './api-docs/swagger.js';
import morgan from 'morgan';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleSlack.js';
import { env } from './config/env.js';

const app = express();

// Middleware globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Después de express.json(), antes de las rutas
morganBody(app, {
  noColors: true,
  skip: (req, res) => res.statusCode < 400, // Solo errores
  stream: loggerStream
});

// Archivos estáticos
app.use('/uploads', express.static('storage'));     // Cuando el usuario mete uploads en la URL, se mete en la carpeta storage del servidor

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

const isProduction = process.env.NODE_ENV === 'production';

// Configurar según entorno
if (isProduction) {
  // Menos logs
  app.use(morgan('combined'));
} else {
  // Más verbose
  app.use(morgan('dev'));
}

// Error handler diferente
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: true,
    message: isProduction ? 'Error interno' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});


// Después de los middlewares, antes de las rutas
// Esto sirve para ver la documentación de la API en http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas de la API
app.use('/api', routes);

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const PORT = env.PORT;

const startServer = async () => {
  console.log('Intentando conectar a:', env.DB_URI);
  await dbConnect();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT} [${env.NODE_ENV}]`);
  });
};

startServer();

export default app;