"use client";
import { useState } from "react";
import { getMyTickets, getTicketByNumber, getRaffleById, TicketData } from "@/services/raffleService";
import { Ticket, Search, Printer } from "lucide-react";

interface TicketWithRaffleInfo extends TicketData {
  raffleTitle?: string;
  raffleImage?: string;
}

export default function TicketVerifier() {
  const [queryInput, setQueryInput] = useState("");
  const [tickets, setTickets] = useState<TicketWithRaffleInfo[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput) return alert("Ingresa un número válido");
    setLoading(true);
    
    try {
      let results: TicketData[] = [];
      
      // Intentar primero por teléfono
      results = await getMyTickets(queryInput);
      
      // Si no hay resultados, intentar por número de boleto
      if (results.length === 0) {
        results = await getTicketByNumber(queryInput);
      }
      
      const enrichedTickets = await Promise.all(results.map(async (ticket) => {
        const raffleData = await getRaffleById(ticket.raffleId);
        return {
          ...ticket,
          raffleTitle: raffleData?.title || "Sorteo Especial",
          raffleImage: raffleData?.images?.[0] || ""
        };
      }));

      setTickets(enrichedTickets);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openReceipt = (t: TicketWithRaffleInfo) => {
    const statusColor = t.status === 'sold' ? '#166534' : '#ca8a04'; 
    const statusText = t.status === 'sold' ? 'PAGADO' : 'PENDIENTE DE PAGO';
    const borderColor = t.status === 'sold' ? '#22c55e' : '#eab308';
    
    const htmlContent = `
      <html>
        <head>
          <title>Recibo - ${t.buyerName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
            body { font-family: 'Courier Prime', monospace; background: #555; display: flex; justify-content: center; padding: 20px; margin: 0; min-height: 100vh; align-items: center; }
            .receipt { background: white; width: 100%; max-width: 450px; padding: 40px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-top: 12px solid ${borderColor}; overflow: hidden; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120%; max-width: none; opacity: 0.05; z-index: 0; pointer-events: none; filter: grayscale(100%); }
            .content { position: relative; z-index: 1; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #ccc; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #000; }
            .subtitle { font-size: 14px; color: #666; }
            .product-img-container { text-align: center; margin-bottom: 20px; }
            .product-img { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; }
            .raffle-name { font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0 20px 0; text-transform: uppercase; color: #1e3a8a; }
            .info-group { margin-bottom: 15px; }
            .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
            .value { font-size: 17px; font-weight: bold; color: #222; border-bottom: 1px dotted #ddd; padding-bottom: 2px;}
            .numbers-box { background: #f4f4f5; border: 2px dashed #ddd; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px; }
            .number-tag { display: inline-block; margin: 4px; padding: 6px 10px; border: 2px solid #333; font-weight: bold; background: #fff; font-size: 18px; box-shadow: 2px 2px 0 #333; }
            .total-section { display: flex; justify-content: space-between; align-items: center; border-top: 3px double #ccc; padding-top: 20px; margin-top: 20px; }
            .total-label { font-size: 20px; font-weight: bold; }
            .total-amount { font-size: 32px; font-weight: black; color: ${statusColor}; }
            .stamp-container { margin-top: 40px; text-align: center; }
            .stamp { border: 4px solid ${statusColor}; color: ${statusColor}; font-size: 24px; font-weight: black; text-transform: uppercase; padding: 15px 30px; border-radius: 12px; transform: rotate(-8deg); display: inline-block; opacity: 0.9; letter-spacing: 2px; background: rgba(255,255,255,0.9); }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
            .download-btn-container { margin-top: 30px; text-align: center; }
            .download-btn { background: #000; color: white; border: none; padding: 15px 30px; font-family: 'Courier Prime', monospace; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: transform 0.1s; }
            .download-btn:active { transform: scale(0.98); }
            .download-hint { font-size: 11px; color: #666; margin-top: 8px; }
            @media print { body { background: none; padding: 0; display: block; } .receipt { box-shadow: none; border-top: none; max-width: 100%; width: 100%; padding: 20px; } .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <img src="/logo.jpg" class="watermark" />
            <div class="content">
              <div class="header">
                <div class="title">RIFAS EL GÜERO</div>
                <div class="subtitle">Comprobante Oficial de Participación</div>
              </div>
              ${t.raffleImage ? `<div class="product-img-container"><img src="${t.raffleImage}" class="product-img" /></div>` : ''}
              <div class="raffle-name">${t.raffleTitle}</div>
              <div class="info-group"><div class="label">CLIENTE TITULAR</div><div class="value" style="font-size: 20px;">${t.buyerName}</div></div>
              <div style="display: flex; gap: 20px;">
                 <div class="info-group" style="flex: 1;"><div class="label">TELÉFONO</div><div class="value">${t.buyerPhone}</div></div>
                 <div class="info-group" style="flex: 1; text-align: right;"><div class="label">FOLIO</div><div class="value" style="font-family: monospace;">#${t.id?.slice(0, 6).toUpperCase()}</div></div>
              </div>
               <div class="info-group"><div class="label">ESTADO</div><div class="value">${t.buyerState || 'N/A'}</div></div>
               <div class="info-group"><div class="label">FECHA DE EMISIÓN</div><div class="value">${new Date(t.createdAt.seconds * 1000).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
              <div class="label" style="text-align:center; margin-top:25px; font-size: 14px;">TUS BOLETOS SELECCIONADOS</div>
              <div class="numbers-box">${t.numbers.map(n => `<span class="number-tag">${n}</span>`).join('')}</div>
              <div class="total-section"><span class="total-label">IMPORTE TOTAL:</span><span class="total-amount">$${t.total.toFixed(2)} MXN</span></div>
              <div class="stamp-container"><div class="stamp">${statusText}</div></div>
              <div class="footer"><p>Este documento digital es su comprobante oficial de participación en la rifa.<br/>Consérvelo para cualquier reclamación.</p><p>www.rifaselguero.com | Zapopan, Jalisco</p></div>
              <div class="download-btn-container no-print">
                <button class="download-btn" onclick="window.print()">DESCARGAR RECIBO</button>
                <div class="download-hint">(Selecciona "Guardar como PDF")</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    const width = 500;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const win = window.open('', '_blank', `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
    win?.document.write(htmlContent);
    win?.document.close();
  };

  return (
    <div className="w-full">
      <div className="bg-red-600 p-4 md:p-6 text-center text-white">
        <h3 className="font-black text-xl md:text-3xl uppercase italic mb-2 flex items-center justify-center gap-2">
           <Search size={24}/> Verificador de Boletos
        </h3>
        <p className="text-white/90 text-sm md:text-base">Ingresa tu número de celular o boleto para ver tus comprobantes.</p>
      </div>
      
      <div className="p-6 md:p-8 bg-white">
        <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-4">
          <input type="text" placeholder="Tu celular o número de boleto" value={queryInput} onChange={(e) => setQueryInput(e.target.value)} className="w-full flex-1 border-2 border-gray-300 rounded-xl p-3 md:p-4 text-lg focus:border-red-600 outline-none text-gray-800 font-bold text-center" />
          <button type="submit" className="w-full md:w-auto bg-black text-white font-bold px-8 py-3 md:py-4 rounded-xl hover:bg-gray-900 transition shadow-lg transform active:scale-95">{loading ? "Buscando..." : "Consultar"}</button>
        </form>

        {tickets && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
            {tickets.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-bold">No encontramos boletos con ese dato.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4"><span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-bold shadow-sm">¡Encontramos {tickets.length} orden(es)!</span></div>
                {tickets.map((t, i) => (
                  <div key={i} className="border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="w-full md:w-auto text-center md:text-left">
                      <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-2">
                        <span className="font-bold text-gray-800">Orden #{t.id?.slice(0, 6).toUpperCase()}</span>
                        <span className="text-xs text-gray-500">({new Date(t.createdAt.seconds * 1000).toLocaleDateString()})</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${t.status === 'sold' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{t.status === 'sold' ? 'PAGADO' : 'PENDIENTE'}</span>
                      </div>
                      <div className="flex flex-wrap justify-center md:justify-start gap-1">{t.numbers.map(num => (<span key={num} className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-mono font-bold text-sm">{num}</span>))}</div>
                      <div className="text-xs text-blue-900 font-bold mt-1">{t.raffleTitle}</div> 
                    </div>
                    <button onClick={() => openReceipt(t)} className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 transition shadow-md whitespace-nowrap"><Printer size={16} /> Ver Recibo</button>
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