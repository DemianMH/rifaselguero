"use client";
import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { getRaffles, RaffleData } from "@/services/raffleService";
import { motion } from "framer-motion";
import { Timer, Trophy, ArrowRight, Flag, SearchX, Search, Ticket } from "lucide-react"; // Added Ticket import
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import TicketVerifier from "@/components/TicketVerifier";

function HomeContent() {
  const [raffles, setRaffles] = useState<RaffleData[]>([]);
  const [featuredRaffle, setFeaturedRaffle] = useState<RaffleData | null>(null);
  
  useEffect(() => {
    const fetch = async () => {
      const data = await getRaffles();
      setRaffles(data);
      const active = data.filter(r => r.status === 'active');
      if (active.length > 0) setFeaturedRaffle(active[0]);
    };
    fetch();
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative h-[60vh] bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-transparent z-10" />
        {featuredRaffle?.images?.[0] && (
          <Image src={featuredRaffle.images[0]} alt="Hero" fill className="object-cover opacity-60" priority />
        )}
        <div className="relative z-20 h-full flex flex-col justify-center px-6 max-w-7xl mx-auto text-white">
          <h1 className="text-5xl font-black italic uppercase mb-4 drop-shadow-lg">{featuredRaffle?.title || "Grandes Rifas"}</h1>
          {featuredRaffle && (
            <Link href={`/rifa/${featuredRaffle.id}`} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold w-fit flex items-center gap-2 shadow-xl transition hover:scale-105">
              Comprar Boletos <ArrowRight />
            </Link>
          )}
        </div>
      </section>

      {/* VERIFICADOR */}
      <section className="py-10 bg-gray-100 px-4 -mt-10 relative z-30">
        <TicketVerifier />
      </section>

      {/* INFO LOTERÍA */}
      <section className="bg-white py-16 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl font-black text-blue-900 uppercase italic">Dinámica Transparente</h2>
          <p className="text-gray-600 text-lg">
            Todos nuestros sorteos se basan en los últimos dígitos del 
            <span className="font-bold text-black"> Premio Mayor de la Lotería Nacional</span>.
          </p>
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-red-600 mb-2">¿Si el boleto ganador no se vendió?</h3>
            <p className="text-gray-700">
              Se elige un nuevo ganador en una fecha cercana. 
              <br/><span className="font-bold">¡Tienes doble oportunidad con tu mismo boleto!</span>
            </p>
          </div>
        </div>
      </section>

      {/* RIFAS */}
      <section id="rifas-activas" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-10">
          <Flag className="text-red-600 w-8 h-8" />
          <h2 className="text-3xl font-black uppercase italic text-blue-900">Sorteos Disponibles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {raffles.map((rifa) => (
            <motion.div key={rifa.id} whileHover={{ y: -10 }} className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100 group hover:shadow-2xl transition-all">
              <div className="relative h-56">
                {rifa.images?.[0] && <Image src={rifa.images[0]} alt={rifa.title} fill className="object-cover transition-transform group-hover:scale-105" />}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1 ${rifa.status === 'active' ? 'bg-yellow-400 text-black' : 'bg-black text-white'}`}>
                  {rifa.status === 'active' ? <><Timer size={14} /> En curso</> : "FINALIZADA"}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase italic line-clamp-1">{rifa.title}</h3>
                <div className="flex justify-between items-end">
                  <div><p className="text-gray-400 text-xs font-bold uppercase">Boleto</p><p className="text-3xl font-black text-red-600">${rifa.price}</p></div>
                  <Link href={rifa.status === 'active' ? `/rifa/${rifa.id}` : '/ganadores'} className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-blue-800 transition">
                    {rifa.status === 'active' ? 'Participar' : 'Ver Ganador'}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <span className="font-black text-2xl italic text-yellow-400 block mb-2">RIFAS EL GÜERO</span>
            <p className="text-xs text-gray-500">Tu suerte está garantizada con la Lotería Nacional.</p>
          </div>
          <div className="flex gap-6 text-sm font-bold text-gray-400 flex-wrap justify-center">
            <Link href="/preguntas-frecuentes" className="hover:text-white transition">Preguntas Frecuentes</Link>
            <Link href="/metodos-pago" className="hover:text-white transition">Métodos de Pago</Link>
            <Link href="/contacto" className="hover:text-white transition">Contacto</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function Home() {
  return <main className="min-h-screen bg-gray-100"><Navbar /><Suspense fallback={<div>Cargando...</div>}><HomeContent /></Suspense></main>;
}