# garoo-ux-template

Frontend template del **Garoo Agent Framework** — Next.js 15 + Tailwind CSS + DaisyUI.

Panel de administración y dashboard para proyectos Garoo. Se conecta siempre a su `garoo-api-template` correspondiente.

---

## Inicio rápido

```bash
# 1. Clonar y renombrar
cp -r garoo-ux-template mi-proyecto-dashboard
cd mi-proyecto-dashboard

# 2. Variables de entorno
cp .env.example .env.local

# 3. Instalar
npm install

# 4. Desarrollo
npm run dev        # http://localhost:3011

# 5. Producción
npm run build
docker compose up -d --build
```

---

## Estructura del proyecto

```
garoo-ux-template/
├── app/
│   ├── layout.tsx           ← Root layout (fuentes, metadata, providers)
│   ├── page.tsx             ← Dashboard principal con tabs
│   ├── globals.css          ← Variables CSS + Tailwind base
│   └── dashboard/           ← Páginas adicionales del dashboard
│       └── contacts/
│           └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx      ← Navegación lateral (desktop)
│   │   └── BottomNav.tsx    ← Navegación inferior (mobile)
│   └── ui/
│       ├── ConversationView.tsx  ← Historial de mensajes
│       ├── ContactsTable.tsx     ← Tabla de contactos/prospectos
│       ├── MetricsCards.tsx      ← KPIs del dashboard
│       └── AgentConfig.tsx       ← Editar config del agente
├── lib/
│   ├── api.ts               ← Cliente HTTP hacia la API
│   └── types.ts             ← Tipos TypeScript compartidos
├── public/                  ← Assets estáticos
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
└── DESIGN.md                ← Sistema de diseño y componentes
```

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `CORE_API_URL` | URL interna del backend (Docker/localhost) — nunca `NEXT_PUBLIC_` | `http://localhost:3010` |
| `NEXT_PUBLIC_PROJECT_NAME` | Nombre del proyecto | `Mi Proyecto` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Color principal (hex) | `#4F46E5` |

Las variables con `NEXT_PUBLIC_` son visibles en el cliente. Las sin prefijo solo en el servidor. No hay ninguna key de auth en el cliente: la sesión viaja por cookie httpOnly.

---

## Stack de UI

| Librería | Uso |
|----------|-----|
| Next.js 15 (App Router) | Framework principal |
| Tailwind CSS v4 | Estilos utilitarios |
| DaisyUI | Componentes base (botones, tablas, modals) |
| Recharts | Gráficas y métricas |
| Lucide React | Iconos |

---

## Convenciones

### Mobile-first

Todo componente usa mobile-first. El layout cambia en `lg:`:

```tsx
// ✅ Correcto
<div className="flex flex-col lg:flex-row">
  <Sidebar className="hidden lg:flex" />
  <BottomNav className="lg:hidden" />
</div>

// ❌ Incorrecto — desktop primero
<div className="flex flex-row">
```

### Temas DaisyUI

El tema se define en `tailwind.config.ts` y en `app/globals.css`. Para cambiar colores del proyecto, editar las variables CSS en `globals.css`.

### Autenticación

El dashboard NO usa una API key en el cliente. La sesión se maneja con una cookie httpOnly que setea el backend en `/auth/login`. El browser siempre llama a `/api/core/*` (proxy de Next.js, mismo dominio) para que esa cookie viaje en cada request; el servidor (SSR) llama directo a `CORE_API_URL`. Un 401 dispara `setUnauthorizedHandler()` (ver `lib/api.ts`) para forzar logout.

---

## Scripts

```bash
npm run dev        # Desarrollo con hot-reload
npm run build      # Build de producción
npm run start      # Servir build de producción
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
```

---

## Proyectos de referencia

| Proyecto | Dashboard | Puerto |
|----------|-----------|--------|
| MundoVerde | `mundoverde-dashboard/` | 3011 |
| GrupoAlthura | `Althura-UX/` | 3041 |
| ReservasFicohsa | `Ui-Reservas/` | 3021 |

Ver [DESIGN.md](DESIGN.md) para el sistema de diseño completo.
