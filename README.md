# Phrase Management App

Una aplicación para gestionar frases con entrega secuencial, panel de administración y límite de velocidad.

## Características

- **API pública**: Endpoint `/api/frase` que devuelve frases en secuencia (n+1)
- **Límite de velocidad**: 100 requests por día con reset automático
- **Panel de administración**: Interface completa para gestionar frases
- **Operaciones masivas**: Agregar múltiples frases separadas por punto y coma
- **Exportación**: Descarga frases en formato TXT o CSV
- **Tema oscuro**: Interface elegante con gradiente oscuro

## Despliegue en Vercel

### 1. Preparar la base de datos

1. Crea una base de datos PostgreSQL en [Neon](https://neon.tech/) o [Supabase](https://supabase.com/)
2. Copia la URL de conexión

### 2. Configurar Vercel

1. Conecta tu repositorio a Vercel
2. En la configuración del proyecto, agrega la variable de entorno:
   - `DATABASE_URL`: Tu URL de conexión PostgreSQL

### 3. Deploy

El proyecto está configurado para deployarse automáticamente en Vercel con:
- Frontend estático servido desde `/dist`
- API serverless functions en `/server/api/`
- Configuración automática de rutas en `vercel.json`

## Estructura del Proyecto

```
├── client/           # Frontend React
├── server/
│   ├── api/          # Serverless functions para Vercel
│   │   ├── frase.ts  # Endpoint principal
│   │   └── admin/    # Endpoints de administración
│   ├── db.ts         # Configuración de base de datos
│   └── storage.ts    # Lógica de almacenamiento
├── shared/
│   └── schema.ts     # Esquemas de base de datos
└── vercel.json       # Configuración de deployment
```

## API Endpoints

- `GET /api/frase` - Obtener siguiente frase (texto plano)
- `GET /api/admin/stats` - Estadísticas del sistema
- `GET /api/admin/phrases` - Lista todas las frases
- `POST /api/admin/phrases/bulk` - Agregar frases en masa
- `DELETE /api/admin/phrases` - Eliminar todas las frases
- `GET /api/admin/export?format=txt|csv` - Exportar frases

## Variables de Entorno Requeridas

- `DATABASE_URL` - URL de conexión PostgreSQL

## Desarrollo Local

```bash
npm install
npm run db:push  # Crear tablas en la base de datos
npm run dev      # Iniciar servidor de desarrollo
```

La aplicación estará disponible en `http://localhost:5000`