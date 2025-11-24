"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getRaffleById, reserveTickets, RaffleData } from "@/services/raffleService";
import SlotMachine from "@/components/SlotMachine";
import { CheckCircle, ArrowRight, ShieldCheck, Ticket, Search } from "lucide-react"; 
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function RaffleDetail() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const [buyMode, setBuyMode] = useState<'machine' | 'manual'>('machine');
  const [machineQuantity, setMachineQuantity] = useState(1);
  const [machineNumbers, setMachineNumbers] = useState<string[]>([]);

  const [manualSearch, setManualSearch] = useState("");
  const [manualResults, setManualResults] = useState<string[]>([]); // Resultados sugeridos
  const [selectedManualNumbers, setSelectedManualNumbers] = useState<string[]>([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [finalNumbers, setFinalNumbers] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchRaffle = async () => {
      const data = await getRaffleById(id as string);
      setRaffle(data);
      setLoading(false);
    };
    fetchRaffle();
  }, [id]);

  // --- BÚSQUEDA MANUAL ---
  const handleSearch = () => {
    if (!raffle) return;
    // Generamos 5 sugerencias que terminen en lo que el usuario escribió
    const suggestions: string[] = [];
    let attempts = 0;
    
    while (suggestions.length < 5 && attempts < 50) {
      const prefixLength = 6 - manualSearch.length;
      let candidate = manualSearch;
      
      if (prefixLength > 0) {
        const prefix = Math.floor(Math.random() * Math.pow(10, prefixLength)).toString().padStart(prefixLength, '0');
        candidate = prefix + manualSearch;
      }
      
      // Verificar disponibilidad
      if (!raffle.takenNumbers.includes(candidate) && !selectedManualNumbers.includes(candidate) && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
      attempts++;
    }
    setManualResults(suggestions);
  };

  const selectNumber = (num: string) => {
    setSelectedManualNumbers([...selectedManualNumbers, num]);
    setManualResults(manualResults.filter(n => n !== num)); // Quitar de resultados
  };

  const removeManualNumber = (num: string) => {
    setSelectedManualNumbers(selectedManualNumbers.filter(n => n !== num));
  };

  // --- PROCESO DE PAGO ---
  const handleProceed = () => {
    if (buyMode === 'machine' && machineNumbers.length === 0) return alert("¡Gira la maquinita primero!");
    if (buyMode === 'manual' && selectedManualNumbers.length === 0) return alert("Selecciona al menos un boleto.");
    setShowPaymentModal(true);
  };

  const handleConfirmReservation = async () => {
    if (!buyerName || !buyerPhone || buyerPhone.length < 10) return alert("Faltan datos.");
    if (!raffle || !id) return;
    
    const numbersToBuy = buyMode === 'machine' ? machineNumbers : selectedManualNumbers;
    
    setIsProcessing(true);
    try {
      const result = await reserveTickets(
        id as string, buyerName, buyerPhone, numbersToBuy.length, raffle.price, raffle.takenNumbers || [], numbersToBuy
      );
      setFinalNumbers(result.numbers);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      alert("Error: Algunos números ya no están disponibles.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  if (!raffle) return <div className="min-h-screen flex items-center justify-center text-red-500">No encontrada</div>;

  const whatsappMessage = `Hola *Rifas El Güero*, aparté boletos para *${raffle.title}*.\n👤 ${buyerName}\n🎟 ${finalNumbers.join(', ')}\n💰 $${finalNumbers.length * raffle.price}`;
  const whatsappLink = `https://wa.me/523327225912?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* IZQUIERDA: Galería */}
        <div className="space-y-4">
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gray-200 group cursor-zoom-in">
            {raffle.images && raffle.images.length > 0 ? (
              <Image src={raffle.images[selectedImageIndex]} alt={raffle.title} fill className="object-cover transition-transform duration-500 group-hover:scale-150" />
            ) : <div className="flex items-center justify-center h-full text-gray-400">Sin imagen</div>}
            <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-1 rounded-full font-bold shadow-md z-10">
              {raffle.takenNumbers ? raffle.takenNumbers.length : 0} Boletos Vendidos
            </div>
          </div>
          {raffle.images && raffle.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {raffle.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImageIndex(idx)} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 ${selectedImageIndex === idx ? 'border-blue-900' : 'border-transparent'}`}>
                  <Image src={img} alt="view" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-4xl font-black text-blue-900 mb-4 italic uppercase leading-none">{raffle.title}</h1>
            {/* DESCRIPCIÓN HTML INTUITIVA */}
            <div className="text-gray-600 text-lg mb-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: raffle.description }} />
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><ShieldCheck size={20}/> Lotería Nacional</h3>
              <p className="text-sm text-blue-800/80">Participas con los últimos 6 dígitos del premio mayor.</p>
            </div>
          </div>
        </div>

        {/* DERECHA: Compra */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border-t-8 border-red-600 sticky top-24">
            <div className="text-center mb-6">
              <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Precio Boleto</span>
              <div className="text-5xl font-black text-red-600 my-1">${raffle.price}</div>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button onClick={() => setBuyMode('machine')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${buyMode === 'machine' ? 'bg-white shadow text-blue-900' : 'text-gray-400'}`}>🎰 MAQUINITA</button>
              <button onClick={() => setBuyMode('manual')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${buyMode === 'manual' ? 'bg-white shadow text-blue-900' : 'text-gray-400'}`}>✍️ MANUAL</button>
            </div>

            {buyMode === 'machine' ? (
              <div className="space-y-4">
                <div className="flex justify-center gap-2 mb-2">
                   {[1, 3, 5, 10].map(n => (
                     <button key={n} onClick={() => setMachineQuantity(n)} className={`px-4 py-2 rounded-full font-bold border text-sm ${machineQuantity === n ? 'bg-blue-900 text-white' : 'bg-white text-gray-500'}`}>{n}</button>
                   ))}
                </div>
                <SlotMachine quantity={machineQuantity} takenNumbers={raffle.takenNumbers || []} onGenerate={(nums) => setMachineNumbers(nums)} />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-gray-500 text-sm">Busca tu terminación favorita:</p>
                <div className="flex gap-2">
                  <input type="number" placeholder="Ej: 777" value={manualSearch} onChange={(e) => setManualSearch(e.target.value.slice(0,6))} className="flex-1 border-2 border-gray-300 rounded-xl p-3 text-center font-mono text-xl outline-none text-gray-800" />
                  <button onClick={handleSearch} className="bg-gray-800 text-white p-3 rounded-xl hover:bg-black"><Search /></button>
                </div>
                
                {/* Resultados de búsqueda */}
                {manualResults.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-400 mb-2">Disponibles con esa terminación:</p>
                    <div className="flex flex-wrap gap-2">
                      {manualResults.map(num => (
                        <button key={num} onClick={() => selectNumber(num)} className="bg-white border border-green-500 text-green-700 font-mono font-bold px-3 py-1 rounded hover:bg-green-50">{num}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seleccionados */}
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-gray-400 mb-2">Seleccionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedManualNumbers.map(n => (
                      <span key={n} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold text-sm flex items-center gap-2">{n} <button onClick={() => removeManualNumber(n)} className="text-red-500 font-bold">x</button></span>
                    ))}
                    {selectedManualNumbers.length === 0 && <span className="text-sm text-gray-300 italic">Lista vacía</span>}
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleProceed} className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xl py-4 rounded-xl shadow-lg mt-6">
              {(buyMode === 'machine' && machineNumbers.length === 0) ? "GIRA LA MAQUINITA" : "¡LOS QUIERO!"}
            </button>
          </div>
        </div>
      </div>

      {/* MODALES */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/90 backdrop-blur-sm">
            <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
              <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Confirmar Pedido</h3>
              <div className="flex flex-wrap justify-center gap-1 mb-4">
                {(buyMode === 'machine' ? machineNumbers : selectedManualNumbers).map(n => (<span key={n} className="bg-yellow-100 text-yellow-800 font-mono font-bold px-2 py-1 rounded text-sm">{n}</span>))}
              </div>
              <input type="text" placeholder="Nombre" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full border p-3 rounded-xl mb-3 text-gray-800" />
              <input type="tel" placeholder="WhatsApp" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full border p-3 rounded-xl mb-3 text-gray-800" />
              <button onClick={handleConfirmReservation} disabled={isProcessing} className="w-full bg-black text-white font-bold py-3 rounded-xl">{isProcessing ? "..." : "Confirmar"}</button>
              <button onClick={() => setShowPaymentModal(false)} className="w-full text-gray-400 py-2 mt-2">Cancelar</button>
            </motion.div>
          </div>
        )}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
             <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white rounded-3xl w-full max-w-sm p-8 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase italic mb-2 text-gray-800">¡Apartados!</h2>
                <a href={whatsappLink} target="_blank" className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold block w-full mt-6">Enviar Comprobante</a>
                <button onClick={() => setShowSuccessModal(false)} className="mt-4 text-gray-400 underline text-sm">Cerrar</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}