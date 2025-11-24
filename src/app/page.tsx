"use client";
import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { getRaffles, RaffleData } from "@/services/raffleService";
import { motion } from "framer-motion";
import { Timer, Trophy, ArrowRight, Flag, SearchX } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const [raffles, setRaffles] = useState<RaffleData[]>([]);
  const [filteredRaffles, setFilteredRaffles] = useState<RaffleData[]>([]);
  const [featuredRaffle, setFeaturedRaffle] = useState<RaffleData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  useEffect(() => {
    const fetchRaffles = async () => {
      setLoading(true);
      const data = await getRaffles();
      const activeRaffles = data.filter(r => r.status === 'active');
      setRaffles(data);
      
      if (activeRaffles.length > 0) {
        setFeaturedRaffle(activeRaffles[0]);
      } else if (data.length > 0) {
        setFeaturedRaffle(data[0]);
      }
      setLoading(false);
    };
    fetchRaffles();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = raffles.filter(r => 
        r.title.toLowerCase().includes(searchQuery) || 
        r.description.toLowerCase().includes(searchQuery)
      );
      setFilteredRaffles(filtered);
    } else {
      setFilteredRaffles(raffles);
    }
  }, [searchQuery, raffles]);

  return (
    <>
      {!searchQuery && (
        <section className="relative h-[60vh] bg-neutral-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-transparent z-10" />
          {featuredRaffle && featuredRaffle.images && featuredRaffle.images.length > 0 ? (
            <>
              <Image 
                src={featuredRaffle.images[0]} // USA LA PRIMERA IMAGEN
                alt="Hero" 
                fill
                className="object-cover opacity-60"
                priority
              />
              <div className="relative z-20 h-full flex flex-col justify-center px-6 max-w-7xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <span className="bg-yellow-400 text-black px-4 py-1 rounded-full font-bold text-sm tracking-wide mb-4 inline-block shadow-lg">¡LA MÁS ESPERADA!</span>
                  <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mb-4 uppercase drop-shadow-lg">{featuredRaffle.title}</h1>
                  <p className="text-xl text-gray-200 mb-8 max-w-lg line-clamp-2 drop-shadow-md">{featuredRaffle.description}</p>
                  <Link href={`/rifa/${featuredRaffle.id}`} className="group bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 w-fit shadow-xl shadow-red-600/30">
                    Ir a la Rifa <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </>
          ) : (
             <div className="relative z-20 h-full flex items-center justify-center text-white/50 font-bold text-xl">{loading ? "Cargando..." : "Próximamente"}</div>
          )}
        </section>
      )}

      <section id="rifas-activas" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-10">
          {searchQuery ? <SearchX className="text-red-600 w-8 h-8" /> : <Flag className="text-red-600 w-8 h-8" />}
          <h2 className="text-3xl font-black uppercase italic text-blue-900">{searchQuery ? `Resultados: "${searchQuery}"` : "Rifas en Pista"}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRaffles.map((rifa) => (
            <motion.div key={rifa.id} whileHover={{ y: -10 }} className={`bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100 ${rifa.status === 'finished' ? 'opacity-90' : ''}`}>
              <div className="relative h-56 group">
                {rifa.images && rifa.images.length > 0 ? (
                  <Image src={rifa.images[0]} alt={rifa.title} fill className="object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">Sin imagen</div>
                )}
                {rifa.status === 'active' && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-xs shadow-md flex items-center gap-1"><Timer size={14} /> En curso</div>
                )}
                {rifa.status === 'finished' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm"><Trophy className="w-12 h-12 text-yellow-400 mb-2 animate-pulse" /><span className="font-bold text-xl">FINALIZADA</span></div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 italic uppercase">{rifa.title}</h3>
                <div className="flex justify-between items-end">
                  <div><p className="text-gray-400 text-xs font-bold uppercase">Costo por boleto</p><p className="text-3xl font-black text-red-600">${rifa.price} <span className="text-sm text-gray-400 font-normal">MXN</span></p></div>
                  {rifa.status === 'active' ? <Link href={`/rifa/${rifa.id}`} className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-900/20">Ver Boletos</Link> : <Link href="/ganadores" className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-300">Ver Ganador</Link>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return <main className="min-h-screen bg-gray-100"><Navbar /><Suspense fallback={<div className="p-10 text-center">Cargando...</div>}><HomeContent /></Suspense></main>;
}