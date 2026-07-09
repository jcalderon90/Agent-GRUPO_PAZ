# Sistema de Diseño — Garoo Dashboard

Guía de componentes, colores y patrones de UI para dashboards internos de proyectos Garoo.

---

## Stack de UI

```
Tailwind CSS v4    → estilos utilitarios, mobile-first
DaisyUI            → componentes base (btn, table, modal, badge, etc.)
Recharts           → gráficas (AreaChart, BarChart, PieChart)
Lucide React       → iconos consistentes
```

**No usar** Bootstrap, Ant Design, MUI u otras librerías de componentes — mantener solo este stack para consistencia entre proyectos.

---

## Colores

Cada proyecto define su paleta en `app/globals.css` como variables CSS:

```css
:root {
  --color-primary: #4F46E5;     /* Color principal del proyecto */
  --color-primary-dark: #3730A3;
  --color-accent: #10B981;      /* Acento / success */
  --color-surface: #F9FAFB;     /* Fondo de cards */
  --color-border: #E5E7EB;
}
```

### Paletas por proyecto de referencia

| Proyecto | Primary | Acento |
|----------|---------|--------|
| MundoVerde | `#22C55E` (verde) | `#16A34A` |
| GrupoAlthura | `#567988` (azul petróleo) | `#3D5A68` |
| ReservasFicohsa | `#DC2626` (rojo FIFA) | `#991B1B` |

---

## Layout

### Desktop (≥ lg / 1024px)

```
┌─────────────────────────────────────────────┐
│  SIDEBAR (260px)  │    MAIN CONTENT          │
│                   │                          │
│  Logo             │  Header con título        │
│  Nav items        │  ─────────────────────   │
│  User info        │  Contenido de la tab     │
│                   │                          │
└─────────────────────────────────────────────┘
```

### Mobile (< lg)

```
┌─────────────────────────────────────────────┐
│  Header + título del proyecto               │
│  ───────────────────────────────────────    │
│                                             │
│  Contenido de la tab                        │
│                                             │
│  ─────────────────────────────────────────  │
│  BOTTOM NAV (iconos + labels)               │
└─────────────────────────────────────────────┘
```

### Estructura de componentes

```tsx
// app/layout.tsx
<html>
  <body>
    <DashboardLayout>  {/* Sidebar + BottomNav */}
      {children}
    </DashboardLayout>
  </body>
</html>
```

---

## Componentes base

### Tabs (navegación principal)

El dashboard principal usa tabs para separar secciones. Cada tab = un módulo del proyecto.

```tsx
// Patrón de tabs con DaisyUI
const TABS = [
  { id: 'conversations', label: 'Conversaciones', icon: MessageSquare },
  { id: 'contacts',      label: 'Contactos',      icon: Users },
  { id: 'metrics',       label: 'Métricas',        icon: BarChart2 },
  { id: 'config',        label: 'Config',          icon: Settings },
];

<div role="tablist" className="tabs tabs-bordered">
  {TABS.map(tab => (
    <button
      key={tab.id}
      role="tab"
      className={`tab gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
      onClick={() => setActiveTab(tab.id)}
    >
      <tab.icon size={16} />
      <span className="hidden sm:inline">{tab.label}</span>
    </button>
  ))}
</div>
```

### Cards de métricas

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard
    label="Total contactos"
    value={metrics.totalContacts}
    icon={Users}
    trend="+12%"
  />
</div>
```

### Tabla de contactos

```tsx
<div className="overflow-x-auto">
  <table className="table table-zebra table-sm">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Canal</th>
        <th>Último mensaje</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      {contacts.map(contact => (
        <tr key={contact.id} className="hover cursor-pointer" onClick={() => openContact(contact)}>
          <td>{contact.name ?? contact.contact_id}</td>
          <td><ChannelBadge channel={contact.channel} /></td>
          <td>{formatRelativeTime(contact.updated_at)}</td>
          <td><StatusBadge role={contact.agent_role} /></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Vista de conversación

```tsx
<div className="flex flex-col gap-2 p-4 overflow-y-auto max-h-[60vh]">
  {messages.map(msg => (
    <div
      key={msg.id}
      className={`chat ${msg.role === 'user' ? 'chat-start' : 'chat-end'}`}
    >
      <div className={`chat-bubble ${msg.role === 'assistant' ? 'chat-bubble-primary' : ''}`}>
        {msg.content}
      </div>
      <div className="chat-footer opacity-50 text-xs">
        {formatTime(msg.created_at)}
      </div>
    </div>
  ))}
</div>
```

---

## Reglas absolutas de UI

1. **Mobile-first siempre** — diseñar primero para 390px, escalar a desktop con `lg:`
2. **No pixel values fijos** — usar clases Tailwind (spacing system: 4px base)
3. **safe-area en mobile** — usar `pb-[calc(4rem+env(safe-area-inset-bottom))]` en el contenido cuando hay BottomNav
4. **Loading states** — toda llamada async tiene estado de loading (skeleton o spinner DaisyUI)
5. **Error states** — toda llamada async tiene manejo de error visible al usuario
6. **Tablas responsivas** — siempre dentro de `overflow-x-auto`
7. **Colores semánticos** — usar `success`, `error`, `warning` de DaisyUI, no hardcodear colores en componentes

---

## Tipografía

```css
/* Sistema de fuentes (globals.css) */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Tamaños utilizados */
text-xs    /* 12px — labels, timestamps */
text-sm    /* 14px — tabla, body */
text-base  /* 16px — párrafos */
text-lg    /* 18px — títulos de sección */
text-xl    /* 20px — títulos de página */
text-2xl   /* 24px — KPIs grandes */
```

---

## Iconos (Lucide React)

```tsx
import { Users, MessageSquare, BarChart2, Settings, ChevronRight } from 'lucide-react';

// Tamaño estándar
<Icon size={16} />   // inline en texto o botones
<Icon size={20} />   // nav items
<Icon size={24} />   // headers de sección
```

No mezclar con otros conjuntos de iconos en el mismo proyecto.
