"use client";
import { useState } from "react";
import { getMyTickets, TicketData } from "@/services/raffleService";
import { Search, Ticket } from "lucide-react";

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
    <div className="bg-white border-t-8 border-black shadow-2xl rounded-xl overflow-hidden w-full max-w-2xl mx-auto my-10">
      <div className="bg-red-600 p-4 text-center">
        <h3 className="text-white font-black text-2xl uppercase italic">Verificador de Boletos</h3>
        <p className="text-white/80 text-sm">Introduce tu número de celular para ver tus boletos</p>
      </div>
      
      <div className="p-8">
        <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-4">
          <input 
            type="tel" 
            placeholder="Tu número de celular (Ej. 3312345678)" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 border-2 border-gray-300 rounded-lg p-3 text-lg focus:border-red-600 outline-none text-gray-800 font-bold text-center"
          />
          <button type="submit" className="bg-black text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition">
            {loading ? "Buscando..." : "Verificar"}
          </button>
        </form>

        {tickets && (
          <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in">
            {tickets.length === 0 ? (
              <p className="text-center text-gray-500 font-bold">No encontramos boletos con ese número.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-green-600 font-bold">¡Encontramos {tickets.length} orden(es)!</p>
                {tickets.map((t, i) => (
                  <div key={i} className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>{new Date(t.createdAt.seconds * 1000).toLocaleDateString()}</span>
                      <span className={t.status === 'sold' ? "text-green-600 font-bold" : "text-yellow-600 font-bold"}>
                        {t.status === 'sold' ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.numbers.map(num => (
                        <span key={num} className="bg-white border border-gray-300 px-2 py-1 rounded text-gray-800 font-mono font-black text-lg flex items-center gap-1">
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