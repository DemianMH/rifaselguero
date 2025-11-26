"use client";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Search, Menu, X, AlertOctagon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGlobalSettings } from "@/services/raffleService";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [whatsapp, setWhatsapp] = useState("3326269409");
  const [isMaintenance, setIsMaintenance] = useState(false); // <--- ESTADO NUEVO
  const router = useRouter();

  useEffect(() => {
    getGlobalSettings().then(s => { 
      if(s.whatsapp) setWhatsapp(s.whatsapp); 
      setIsMaintenance(s.maintenanceMode || false); // Leemos el modo mantenimiento
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
      setIsOpen(false);
    }
  };

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <>
      {/* BANNER DE MANTENIMIENTO (Solo si está activo) */}
      {isMaintenance && (
        <div className="bg-red-600 text-white text-center py-3 font-black text-sm md:text-base flex items-center justify-center gap-2 animate-pulse sticky top-0 z-[60] shadow-md">
          <AlertOctagon size={20} /> SITIO EN MANTENIMIENTO - VENTAS PAUSADAS MOMENTÁNEAMENTE
        </div>
      )}

      <nav className={`bg-blue-900 text-white sticky ${isMaintenance ? 'top-[44px]' : 'top-0'} z-50 shadow-lg border-b-4 border-red-600`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            <div className="flex-shrink-0 flex items-center gap-2 md:gap-3 cursor-pointer z-50" onClick={() => router.push('/')}>
              <div className="relative w-14 h-14 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 md:border-4 border-yellow-400 shadow-lg transform hover:scale-105 transition md:mt-8 mt-2">
                 <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-lg md:text-2xl tracking-tighter italic uppercase">RIFAS</span>
                <span className="font-bold text-[10px] md:text-base text-yellow-400 tracking-widest uppercase">EL GÜERO</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <form onSubmit={handleSearch} className="relative group">
                <input 
                  type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..." 
                  className="bg-blue-950/50 border border-blue-700 rounded-full py-2 px-4 pl-10 focus:ring-2 focus:ring-yellow-400 text-sm w-32 transition-all focus:w-56"
                />
                <button type="submit" className="absolute left-3 top-2.5 text-blue-300"><Search className="w-4 h-4" /></button>
              </form>
              <Link href="/" className="hover:text-yellow-400 font-bold text-sm uppercase">Inicio</Link>
              <Link href="/ganadores" className="hover:text-yellow-400 font-bold text-sm uppercase">Ganadores</Link>
              <button onClick={() => scrollToSection('metodos-pago')} className="hover:text-yellow-400 font-bold text-sm uppercase bg-transparent">Pagos</button>
              <a href={`https://wa.me/52${whatsapp}`} target="_blank" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-lg hover:scale-105 transition">
                <MessageCircle size={18} /> <span className="hidden lg:inline">{whatsapp}</span>
              </a>
            </div>

            <div className="md:hidden flex items-center gap-3">
              <a href={`https://wa.me/52${whatsapp}`} className="text-green-400"><MessageCircle size={26} /></a>
              <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1">
                {isOpen ? <X size={30} /> : <Menu size={30} />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-blue-900 border-t border-blue-800 p-4 space-y-4 animate-in slide-in-from-top-5">
            <form onSubmit={handleSearch} className="relative">
              <input className="w-full bg-blue-950/50 border border-blue-700 rounded-lg py-3 pl-10 text-white" placeholder="Buscar rifa..." onChange={e => setSearchTerm(e.target.value)} />
              <Search className="absolute left-3 top-3.5 text-blue-300 w-5 h-5"/>
            </form>
            <Link href="/" className="block font-bold text-lg py-2 border-b border-blue-800" onClick={()=>setIsOpen(false)}>🏠 Inicio</Link>
            <Link href="/ganadores" className="block font-bold text-lg py-2 border-b border-blue-800" onClick={()=>setIsOpen(false)}>🏆 Ganadores</Link>
            <button onClick={() => scrollToSection('metodos-pago')} className="block font-bold text-lg py-2 w-full text-left border-b border-blue-800">💳 Métodos de Pago</button>
            <button onClick={() => scrollToSection('contacto')} className="block font-bold text-lg py-2 w-full text-left">📞 Contacto</button>
          </div>
        )}
      </nav>
    </>
  );
}