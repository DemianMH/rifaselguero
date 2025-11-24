"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getRaffleById, reserveTickets, RaffleData } from "@/services/raffleService";
import { CheckCircle, ArrowRight, ShieldCheck, Ticket } from "lucide-react"; 
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function RaffleDetail() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado Galería
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Estados Compra
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [assignedNumbers, setAssignedNumbers] = useState<string[]>([]); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchRaffle = async () => {
      const data = await getRaffleById(id as string);
      setRaffle(data);
      setLoading(false);
    };
    fetchRaffle();
  }, [id]);

  const handleBuyClick = () => { if (raffle) setShowPaymentModal(true); };

  const handleConfirmReservation = async () => {
    if (!buyerName || !buyerPhone || buyerPhone.length < 10) return alert("Datos incompletos.");
    if (!raffle || !id) return;
    setIsProcessing(true);
    try {
      const result = await reserveTickets(id as string, buyerName, buyerPhone, ticketQuantity, raffle.price, raffle.takenNumbers || []);
      setAssignedNumbers(result.numbers);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      alert("Error al apartar.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-gray-400">Cargando...</div>;
  if (!raffle) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-red-500">No encontrada</div>;

  const whatsappMessage = `Hola *Rifas El Güero*, aparté boletos para *${raffle.title}*.\n👤 ${buyerName}\n🎟 ${assignedNumbers.join(', ')}\n💰 $${ticketQuantity * raffle.price}`;
  const whatsappLink = `https://wa.me/523327225912?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* --- GALERÍA DE IMÁGENES (IZQUIERDA) --- */}
        <div className="space-y-4">
          {/* Imagen Principal con Lupa (Hover Zoom) */}
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gray-200 group cursor-zoom-in">
            {raffle.images && raffle.images.length > 0 ? (
              <Image 
                src={raffle.images[selectedImageIndex]} 
                alt={raffle.title} 
                fill 
                className="object-cover transition-transform duration-500 ease-in-out transform group-hover:scale-150 group-hover:origin-center" 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">Sin imagen</div>
            )}
            <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-1 rounded-full font-bold shadow-md z-20">
  {raffle.takenNumbers ? raffle.takenNumbers.length : 0} Boletos Vendidos
</div>
          </div>

          {/* Carrusel de Miniaturas */}
          {raffle.images && raffle.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {raffle.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${selectedImageIndex === idx ? 'border-blue-900 ring-2 ring-blue-900/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <Image src={img} alt={`View ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-4xl font-black text-blue-900 mb-4 italic uppercase leading-none">{raffle.title}</h1>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">{raffle.description}</p>
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><ShieldCheck size={20}/> Reglas del juego</h3>
              <p className="text-sm text-blue-800/80">La rifa se llevará a cabo conforme a la Lotería Nacional. El ganador será el poseedor del boleto cuyos últimos 4 dígitos coincidan con el premio mayor.</p>
            </div>
          </div>
        </div>

        {/* --- COMPRA (DERECHA) --- */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-red-600 sticky top-24">
            <div className="text-center mb-8">
              <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Valor del boleto</span>
              <div className="text-6xl font-black text-red-600 my-2">${raffle.price}</div>
              <div className="inline-block bg-gray-100 px-4 py-1 rounded-full text-xs font-bold text-gray-500">MXN</div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-bold text-gray-700 mb-2">Selecciona cantidad:</label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 5, 10].map(num => (
                    <button key={num} onClick={() => setTicketQuantity(num)} className={`py-3 rounded-xl font-bold border-2 transition-all ${ticketQuantity === num ? 'border-blue-900 bg-blue-900 text-white shadow-lg scale-105' : 'border-gray-100 text-gray-500 hover:border-blue-200'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                 <span className="text-gray-500 font-bold">Total a Pagar</span>
                 <span className="text-2xl font-black text-blue-900">${ticketQuantity * raffle.price}</span>
              </div>
              <button onClick={handleBuyClick} className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xl py-5 rounded-xl shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                COMPRAR BOLETOS <ArrowRight strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
             <div className="bg-black p-4 flex justify-between items-center text-white">
                <span className="font-bold">Boletos en Juego</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{raffle.takenNumbers?.length || 0} Ocupados</span>
             </div>
             <div className="p-4 grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                {raffle.takenNumbers && raffle.takenNumbers.length > 0 ? (
                  raffle.takenNumbers.slice().reverse().map((num, i) => (
                    <span key={i} className="text-center text-xs font-mono font-bold text-gray-400 bg-gray-50 py-1 rounded">{num}</span>
                  ))
                ) : (
                  <p className="col-span-5 text-center text-sm text-gray-400 py-4">Aún no hay boletos vendidos. ¡Sé el primero!</p>
                )}
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/90 backdrop-blur-sm">
            <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-gray-50 p-6 border-b"><h3 className="text-xl font-bold text-gray-800 text-center">Completa tus datos</h3><p className="text-center text-sm text-gray-500 mt-1">Para asignarte tus {ticketQuantity} boletos</p></div>
              <div className="p-6 space-y-4">
                <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-400">Nombre Completo</label><input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-600 outline-none font-bold text-gray-700" /></div>
                <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-400">WhatsApp</label><input type="tel" maxLength={10} value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-600 outline-none font-bold text-gray-700" /></div>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mt-4"><p className="text-xs text-yellow-800 font-bold text-center mb-1">Método de Pago: Transferencia</p><p className="text-2xl font-mono text-center font-black text-gray-800 select-all">1234 5678 9012 3456</p><p className="text-center text-[10px] text-gray-400 mt-1">BBVA - A nombre de El Güero</p></div>
                <div className="pt-2 gap-3 flex flex-col"><button onClick={handleConfirmReservation} disabled={isProcessing} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">{isProcessing ? "Apartando..." : "Confirmar"}</button><button onClick={() => setShowPaymentModal(false)} className="w-full text-gray-400 font-bold py-2 hover:text-gray-600">Cancelar</button></div>
              </div>
            </motion.div>
          </div>
        )}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
             <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white rounded-3xl w-full max-w-sm overflow-hidden text-center relative">
              <div className="bg-green-500 p-6"><div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto text-white mb-2"><CheckCircle size={32} /></div><h3 className="text-white font-black text-2xl uppercase italic">¡Apartados!</h3></div>
              <div className="p-8"><p className="text-gray-500 text-sm mb-4 font-bold">Tus números:</p><div className="grid grid-cols-2 gap-3 mb-6">{assignedNumbers.map(t => (<div key={t} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 relative group hover:border-blue-500 transition-colors"><Ticket size={16} className="absolute top-2 right-2 text-gray-300" /><span className="font-mono font-black text-2xl text-gray-800 tracking-widest">{t}</span></div>))}</div><p className="text-xs text-red-500 font-bold mb-6 bg-red-50 p-2 rounded">⚠️ Envía tu comprobante en menos de 1 hora.</p><a href={whatsappLink} target="_blank" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 transition-transform hover:scale-105">Enviar Comprobante</a><button onClick={() => setShowSuccessModal(false)} className="mt-4 text-gray-400 text-sm hover:text-gray-600 underline">Cerrar</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}