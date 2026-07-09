'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutDashboard, KanbanSquare, BookOpen, Settings } from 'lucide-react';
import { TopNav } from '../components/layout/TopNav';
import { BottomNav } from '../components/layout/BottomNav';
import { AgentDashboard } from '../components/ui/AgentDashboard';
import { CrmPage } from '../components/ui/CrmPage';
import { KnowledgePage } from '../components/ui/KnowledgePage';
import { ConfigPage } from '../components/ui/ConfigPage';
import { LoginForm } from '../components/ui/LoginForm';
import { api } from '../lib/api';
import AgentsHome, { type AgentTab } from './components/AgentsHome';

type Tab = 'dashboard' | 'crm' | 'knowledge' | 'config';

const TABS = [
  { id: 'dashboard' as Tab, label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'crm'       as Tab, label: 'CRM',            icon: KanbanSquare },
  { id: 'knowledge' as Tab, label: 'Knowledge Base', icon: BookOpen },
  { id: 'config'    as Tab, label: 'Configuración',  icon: Settings, iconOnly: true },
];

export default function DashboardPage() {
  const [authState, setAuthState] = useState<{
    status: 'checking' | 'authenticated' | 'unauthenticated';
    user?: { role: string; name: string; email: string };
  }>({ status: 'checking' });

  const [screen, setScreen] = useState<'home' | AgentTab>('home');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // 1. Verificar sesión al cargar
  useEffect(() => {
    api.auth.me()
      .then(res => {
        setAuthState({
          status: 'authenticated',
          user: { role: res.role, name: res.name, email: res.email }
        });
      })
      .catch(() => {
        setAuthState({ status: 'unauthenticated' });
      });
  }, []);

  // 2. Cerrar Sesión
  async function handleLogout() {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error(err);
    }
    setAuthState({ status: 'unauthenticated' });
    setScreen('home');
  }

  // 3. Manejo de Login Exitoso
  function handleLoginSuccess(role: string, name: string, email: string) {
    setAuthState({
      status: 'authenticated',
      user: { role, name, email }
    });
  }

  // Mostrar Loading mientras verifica
  if (authState.status === 'checking') {
    return (
      <div className="h-screen w-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-[var(--color-primary,#C17A3A)] rounded-full animate-spin" />
      </div>
    );
  }

  // Mostrar Formulario de Login si no está autenticado
  if (authState.status === 'unauthenticated') {
    return <LoginForm onLogin={handleLoginSuccess} />;
  }

  // Mostrar Home del agente (Cards de Selección)
  if (screen === 'home') {
    return (
      <div className="h-screen overflow-y-auto overflow-x-hidden">
        <AgentsHome onSelect={(tab) => setScreen(tab)} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <TopNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
        agentName="ISABELLA"
        agentRole="GP.VENTAS"
        agentPhoto="/agents-isabella.jpg"
        onHome={() => setScreen('home')}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-h-0 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 overflow-hidden flex flex-col">
        <AnimatePresence>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex-1 min-h-0 flex flex-col"
          >
            {activeTab === 'dashboard' && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 lg:p-6">
                  <AgentDashboard />
                </div>
              </div>
            )}
            {activeTab === 'crm' && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <CrmPage />
              </div>
            )}
            {activeTab === 'knowledge' && (
              <div className="flex-1 overflow-y-auto">
                <KnowledgePage />
              </div>
            )}
            {activeTab === 'config' && (
              <div className="flex-1 overflow-y-auto">
                <ConfigPage userRole={authState.user?.role} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav tabs={TABS} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />
    </div>
  );
}
