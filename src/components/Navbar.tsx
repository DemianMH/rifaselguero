"use client";
import Link from "next/link";
import Image from "next/image"; // <--- Asegúrate de importar Image
import { MessageCircle, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  return (
    <nav className="bg-blue-900 text-white sticky top-0 z-50 shadow-lg border-b-4 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo ACTUALIZADO */}
          <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-400 shadow-md">
               {/* Aquí cargamos tu logo desde /public/logo.jpg */}
               <Image 
                 src="/logo.jpg" 
                 alt="Logo El Güero" 
                 fill 
                 className="object-cover"
                 priority // Carga prioritaria para que no parpadee
               />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-xl tracking-tighter italic uppercase">RIFAS</span>
              <span className="font-bold text-sm text-yellow-400 tracking-widest uppercase">EL GÜERO</span>
            </div>
          </div>

          {/* Menú de Escritorio */}
          <div className="hidden md:flex items-center space-x-8">
            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar rifa..." 
                className="bg-blue-950/50 border border-blue-700 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm placeholder-blue-300/70 w-48 transition-all focus:w-64"
              />
              <button type="submit" className="absolute left-3 top-2.5 text-blue-300 group-hover:text-yellow-400 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <Link href="/" className="hover:text-yellow-400 transition-colors font-bold text-sm uppercase tracking-wide">Rifas en Curso</Link>
            <Link href="/ganadores" className="hover:text-yellow-400 transition-colors font-bold text-sm uppercase tracking-wide">Ganadores</Link>
            
            <a 
              href="https://wa.me/523327225912" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full flex items-center gap-2 font-bold transition-transform hover:scale-105 shadow-lg shadow-green-900/20"
            >
              <MessageCircle size={18} />
              <span className="hidden lg:inline">WhatsApp</span>
            </a>
          </div>

          {/* Botón Menú Móvil */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {isOpen && (
        <div className="md:hidden bg-blue-900 border-t border-blue-800 animate-in slide-in-from-top-5">
          <div className="px-4 pt-4 pb-6 space-y-3">
            <form onSubmit={(e) => { handleSearch(e); setIsOpen(false); }} className="relative mb-4">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..." 
                className="w-full bg-blue-950/50 border border-blue-700 rounded-lg py-3 px-4 pl-10 text-white placeholder-blue-300"
              />
              <Search className="w-5 h-5 absolute left-3 top-3.5 text-blue-300" />
            </form>
            
            <Link href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold hover:bg-blue-800">🎫 Rifas en Curso</Link>
            <Link href="/ganadores" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold hover:bg-blue-800">🏆 Ganadores</Link>
            <a href="https://wa.me/523327225912" className="block px-3 py-3 mt-4 text-center bg-green-600 rounded-lg font-bold shadow-md">
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}