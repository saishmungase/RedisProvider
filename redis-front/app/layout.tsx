'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import { Database, ChevronRight, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tokenExist, setTokenExist] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("AuthToken");
    setTokenExist(!!token && token.length > 5);
    setIsMenuOpen(false); // Close menu on route change
  }, [pathname]);

  const AuthButton = () => (
    <button
      onClick={() => router.push(tokenExist ? "/dashboard" : "/auth/signup")}
      className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-1 shrink-0"
    >
      {tokenExist ? "Dashboard" : "Get Started"}
      <ChevronRight size={14} />
    </button>
  );

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
          <div className="bg-zinc-900/70 backdrop-blur-lg border border-white/10 px-4 py-2 rounded-full flex items-center justify-between shadow-2xl">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 min-w-fit">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Database size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">QuickDB</span>
            </div>

            {/* Center: Desktop Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
              <a href="/#features" className="hover:text-white transition-colors">Features</a>
              <a href="/#contact" className="hover:text-white transition-colors">Support</a>
              <a href="/live" className="hover:text-white transition-colors flex items-center gap-1.5">
                Live Ports 
                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[10px] border border-green-500/20">
                  13 Free
                </span>
              </a>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <AuthButton />
              </div>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-1.5 text-zinc-400 hover:text-white"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-zinc-900 border border-white/10 p-4 rounded-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <a href="/#features" className="text-zinc-400 hover:text-white px-2">Features</a>
              <a href="/#contact" className="text-zinc-400 hover:text-white px-2">Support</a>
              <a href="/live" className="text-zinc-400 hover:text-white px-2">Live Ports</a>
              <div className="sm:hidden pt-2 border-t border-white/5">
                <AuthButton />
              </div>
            </div>
          )}
        </nav>

        <main className="pt-10">
          {children}
        </main>
      </body>
    </html>
  );
}