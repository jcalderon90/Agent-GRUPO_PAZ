# garoo-api-template

Backend template del **Garoo Agent Framework** — Express 5 + TypeScript + PostgreSQL + Claude.

Úsalo como punto de partida para cualquier proyecto nuevo en Garoo. Todos los proyectos siguen esta misma arquitectura: [MundoVerdeAgenteRE](../../MundoVerdeAgenteRE), [GrupoAlthura](../../GrupoAlthura), [ReservasFicohsa](../../ReservasFicohsa).

---

## Inicio rápido (5 minutos)

```bash
# 1. Clonar y renombrar
cp -r garoo-api-template mi-proyecto-api
cd mi-proyecto-api

# 2. Variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Instalar dependencias
npm install

# 4. Crear schema en la base de datos
psql $DATABASE_URL -f src/db/schema.sql

# 5. Desarrollo local
npm run dev

# 6. Build para producción
npm run build
docker compose up -d --build
```

---

## Estructura del proyecto

```
garoo-api-template/
├── src/
│   ├── index.ts              ← Entrada principal (Express app)
│   ├── config/
│   │   ├── env.ts            ← Validación de variables de entorno (Zod)
│   │   └── database.ts       ← Pool de conexiones PostgreSQL
│   ├── api/
│   │   └── routes/
│   │       ├── webhook.ts    ← Endpoint ManyChat (patrón async)
│   │       ├── chat.ts       ← Chat directo (dashboard interno)
│   │       ├── dashboard.ts  ← Datos para el frontend
│   │       └── health.ts     ← Health check para Docker
│   ├── services/
│   │   ├── agent.ts          ← Loop del agente Claude (tool use)
│   │   ├── debounce.ts       ← Acumulador de mensajes por número
│   │   ├── manychat.ts       ← Envío outbound a ManyChat
│   │   └── email.ts          ← Emails con Resend
│   ├── db/
│   │   ├── client.ts         ← Queries reutilizables
│   │   └── schema.sql        ← Schema inicial (prefijo: xx_*)
│   ├── middleware/
│   │   ├── auth.ts           ← Validación del header de autenticación
│   │   └── errorHandler.ts   ← Manejo global de errores
│   └── types/
│       └── index.ts          ← Tipos TypeScript compartidos
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── ARCHITECTURE.md           ← Cómo funciona todo
├── AGENTS.md                 ← Cómo definir y extender agentes
└── DEPLOYMENT.md             ← Guía de despliegue
```

---

## Variables de entorno

Todas las variables están documentadas en [`.env.example`](.env.example). Las esenciales:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | API key de Anthropic (Claude) |
| `MANYCHAT_API_TOKEN` | Token para enviar mensajes outbound |
| `RESEND_API_KEY` | API key de Resend (emails) |
| `API_AUTH_KEY` | Key secreta para autenticar el dashboard |
| `PROJECT_PREFIX` | Prefijo de tablas en DB (ej: `mv`, `fh`, `alt`) |
| `PORT` | Puerto del servidor (ej: `3010`) |

---

## Convenciones obligatorias

### 1. Prefijo de tablas

Cada proyecto usa un prefijo único para sus tablas. Nunca uses nombres genéricos.

```sql
-- ✅ Correcto
CREATE TABLE mv_clients (...);
CREATE TABLE fh_reservations (...);

-- ❌ Incorrecto
CREATE TABLE clients (...);
CREATE TABLE users (...);
```

### 2. Patrón async del webhook

El webhook de ManyChat **siempre** responde `200 {}` inmediatamente y procesa en background.

```typescript
// ✅ Correcto — ver src/api/routes/webhook.ts
router.post('/webhook', (req, res) => {
  res.json({});                    // respuesta inmediata
  processInBackground(req.body);   // procesamiento async
});

// ❌ Incorrecto
router.post('/webhook', async (req, res) => {
  const reply = await callClaude(req.body); // ManyChat timeout!
  res.json(reply);
});
```

### 3. Configuración en base de datos

Los prompts del sistema, nombres de agentes y configuración del cliente van en la tabla `xx_client_configs`. **Nunca hardcodear** en el código.

### 4. Puertos por proyecto

Asignar pares consecutivos. Backend en par, frontend en par+1.

| Proyecto | Backend | Frontend |
|----------|---------|----------|
| MundoVerde | 3010 | 3011 |
| ReservasFicohsa | 3020 | 3021 |
| GrupoAlthura | 3040 | 3041 |
| **Tu proyecto** | **30XX** | **30XX+1** |

---

## Scripts disponibles

```bash
npm run dev      # Desarrollo con hot-reload (tsx watch)
npm run build    # Compilar TypeScript → dist/
npm run start    # Ejecutar dist/index.js
npm run lint     # ESLint
npm run typecheck # TypeScript sin emitir
```

---

## Docker

```bash
# Build y levantar
docker compose up -d --build

# Ver logs
docker compose logs -f

# Rebuild solo el backend
docker compose up -d --build api
```

El contenedor se conecta automáticamente a la red `garoo-tier-1` que comparte acceso a `garoo-db` (PostgreSQL) y `garoo-redis` (Redis).

---

## Documentación adicional

- [ARCHITECTURE.md](ARCHITECTURE.md) — Diagrama completo del sistema, patrón de agentes
- [AGENTS.md](AGENTS.md) — Cómo crear, extender y configurar agentes Claude
- [DEPLOYMENT.md](DEPLOYMENT.md) — Despliegue en producción con Dokploy

---

## Proyectos de referencia

Para ver implementaciones reales de este framework:

| Proyecto | Descripción | Repo |
|----------|-------------|------|
| MundoVerdeAgenteRE | Agente inmobiliario multi-canal | `../MundoVerdeAgenteRE/mundoverde-core` |
| GrupoAlthura | Clone de MundoVerde (cliente Althura) | `../GrupoAlthura/Althura-API` |
| ReservasFicohsa | Sistema de reservas con QR + Wallet | `../ReservasFicohsa/Orquestador` |
