'use client';

import { Inter, Syne, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { ScanProvider } from '@/components/ScanContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const syne = Syne({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-syne' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <html lang="en" className={`dark ${inter.variable} ${syne.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-ds-bg-deep text-ds-text-primary overflow-hidden font-sans">
        <ScanProvider>
          <div className="flex h-screen overflow-hidden relative">
            <Sidebar 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen} 
            />
            
            <div className="flex flex-col flex-1 overflow-hidden relative z-10 transition-all duration-300">
              <Navbar 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen}
              />
              
              <main className="flex-1 overflow-y-auto relative bg-ds-bg-deep">
                <div className="relative z-10 h-full">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </ScanProvider>
      </body>
    </html>
  );
}
