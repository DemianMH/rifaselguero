"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { getRaffles, RaffleData } from "@/services/raffleService";
import { Trophy, Calendar, User, Ticket } from "lucide-react"; // Agregamos iconos
import Image from "next/image";
import Link from "next/link";

export default function WinnersPage() {
  const [finishedRaffles, setFinishedRaffles] = useState<RaffleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinished = async () => {
      const allRaffles = await getRaffles();
      // Filtramos solo las terminadas
      const finished = allRaffles.filter(r => r.status === 'finished');
      setFinishedRaffles(finished);
      setLoading(false);
    };
    fetchFinished();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="bg-black text-white py-16 text-center border-b-4 border-yellow-400">
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 text-yellow-400">
          Salón de la Fama
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto px-4">
          Conoce a los afortunados ganadores de nuestras rifas anteriores.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold text-xl">Cargando historial...</div>
        ) : finishedRaffles.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500">Aún no hay rifas finalizadas</h3>
            <p className="text-gray-400 mb-6">Nuestros sorteos activos siguen en curso.</p>
            <Link href="/" className="inline-block bg-blue-900 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-800 transition shadow-lg">
              Ver Rifas Activas
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {finishedRaffles.map((raffle) => (
              <div key={raffle.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 group hover:shadow-2xl transition-all duration-300 flex flex-col">
                
                {/* Imagen del Premio */}
                <div className="relative h-64 w-full">
                  {raffle.images && raffle.images.length > 0 ? (
                    <Image 
                      src={raffle.images[0]} 
                      alt={raffle.title} 
                      fill 
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">Sin imagen</div>
                  )}
                  
                  {/* Overlay "Rifa Finalizada" */}
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4 backdrop-blur-[2px]">
                    <div className="bg-yellow-400 text-black p-3 rounded-full mb-3 shadow-lg animate-bounce">
                      <Trophy size={32} strokeWidth={2.5} />
                    </div>
                    <span className="text-white font-black text-2xl uppercase italic tracking-widest border-b-2 border-yellow-400 pb-1">
                      Rifa Finalizada
                    </span>
                  </div>
                </div>

                {/* Detalles de la Rifa */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-gray-900 mb-2 uppercase italic line-clamp-2">
                    {raffle.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-6 font-mono bg-gray-100 p-2 rounded w-fit">
                    <Calendar size={14} />
                    <span>Finalizó el: {new Date(raffle.endDate).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Tarjeta del Ganador (AQUÍ ESTABA EL ERROR) */}
                  <div className="mt-auto bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 text-center shadow-inner">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Ganador Oficial</p>
                    
                    <div className="flex items-center justify-center gap-2 text-blue-900 mb-1">
                      <User size={20} className="text-blue-600"/>
                      <p className="text-xl font-black capitalize">
                        {raffle.winnerName || "Por Anunciar"}
                      </p>
                    </div>

                    {raffle.winnerNumber && (
                      <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 w-fit mx-auto px-3 py-1 rounded-full mt-2 border border-green-100">
                        <Ticket size={16} />
                        <p className="text-sm font-bold font-mono tracking-wider">
                          Boleto: {raffle.winnerNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}