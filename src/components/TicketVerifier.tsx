"use client";
import { useState } from "react";
import { getMyTickets, TicketData } from "@/services/raffleService";
import { Ticket, Search } from "lucide-react";

export default function TicketVerifier() {
  const [phone, setPhone] = useState("");
  const [tickets, setTickets] = useState<TicketData[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return alert("Ingresa un número válido de 10 dígitos");
    setLoading(true);
    const results = await getMyTickets(phone);
    setTickets(results);
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="bg-red-600 p-4 md:p-6 text-center text-white">
        <h3 className="font-black text-xl md:text-3xl uppercase italic mb-2 flex items-center justify-center gap-2">
           <Search size={24}/> Verificador de Boletos
        </h3>
        <p className="text-white/90 text-sm md:text-base">Ingresa tu número de celular para consultar tus compras.</p>
      </div>
      
      <div className="p-6 md:p-8 bg-white">
        <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-4">
          <input 
            type="tel" 
            placeholder="Tu celular (Ej. 3312345678)" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full flex-1 border-2 border-gray-300 rounded-xl p-3 md:p-4 text-lg focus:border-red-600 outline-none text-gray-800 font-bold text-center"
          />
          <button type="submit" className="w-full md:w-auto bg-black text-white font-bold px-8 py-3 md:py-4 rounded-xl hover:bg-gray-900 transition shadow-lg transform active:scale-95">
            {loading ? "Buscando..." : "Consultar Ahora"}
          </button>
        </form>

        {tickets && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
            {tickets.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-bold">No encontramos boletos asociados a ese número.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-bold shadow-sm">
                    ¡Encontramos {tickets.length} orden(es)!
                  </span>
                </div>
                {tickets.map((t, i) => (
                  <div key={i} className="border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition bg-white shadow-sm">
                    <div className="flex justify-between text-xs text-gray-500 mb-3 border-b pb-2">
                      <span>📅 {new Date(t.createdAt.seconds * 1000).toLocaleDateString()}</span>
                      <span className={t.status === 'sold' ? "text-green-600 font-black bg-green-50 px-2 rounded" : "text-yellow-600 font-black bg-yellow-50 px-2 rounded"}>
                        {t.status === 'sold' ? 'PAGADO ✅' : 'PENDIENTE ⏳'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.numbers.map(num => (
                        <span key={num} className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg text-gray-800 font-mono font-black text-base flex items-center gap-1 shadow-sm">
                          <Ticket size={14} className="text-red-500"/> {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}