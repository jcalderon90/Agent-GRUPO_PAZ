import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PROJECT_NAME ?? 'Garoo Dashboard',
  description: 'Panel de administración',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="garoo">
      <body className="min-h-dvh bg-base-200">
        {children}
      </body>
    </html>
  );
}
