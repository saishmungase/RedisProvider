'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import { Database, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {/* Navigation - Global for all pages */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Database size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">QuickDB</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#contact" className="hover:text-white transition-colors">Support</a>
              <a href="/live" className="hover:text-white transition-colors flex items-center gap-1">
                Live Ports <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[10px]">12 Free</span>
              </a>
            </div>

            <button 
            onClick={
              ()=>{
                redirect("/auth/signup")
              }
            }
            className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-all flex items-center gap-2">
              Get Started <ChevronRight size={16} />
            </button>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}