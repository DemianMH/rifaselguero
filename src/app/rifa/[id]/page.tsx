"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getRaffleById, reserveTickets, RaffleData } from "@/services/raffleService";
import SlotMachine from "@/components/SlotMachine";
import { CheckCircle, ShieldCheck, Search } from "lucide-react"; 
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function RaffleDetail() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const [buyMode, setBuyMode] = useState<'machine' | 'manual'>('machine');
  const [machineQuantity, setMachineQuantity] = useState(1); // Cantidad por defecto
  const [customQuantity, setCustomQuantity] = useState(""); // Input manual de cantidad
  const [machineNumbers, setMachineNumbers] = useState<string[]>([]);

  const [manualSearch, setManualSearch] = useState("");
  const [manualResults, setManualResults] = useState<string[]>([]);
  const [selectedManualNumbers, setSelectedManualNumbers] = useState<string[]>([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [finalNumbers, setFinalNumbers] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const data = await getRaffleById(id as string);
      setRaffle(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  // Manejo de cantidad personalizada en maquinita
  const handleCustomQuantityChange = (val: string) => {
    setCustomQuantity(val);
    const num = parseInt(val);
    if (num > 0) setMachineQuantity(num);
  };

  const handleSearch = () => {
    if (!raffle) return;
    const suggestions: string[] = [];
    let attempts = 0;
    while (suggestions.length < 5 && attempts < 50) {
      const prefixLength = 6 - manualSearch.length;
      let candidate = manualSearch;
      if (prefixLength > 0) {
        const prefix = Math.floor(Math.random() * Math.pow(10, prefixLength)).toString().padStart(prefixLength, '0');
        candidate = prefix + manualSearch;
      }
      if (!raffle.takenNumbers.includes(candidate) && !selectedManualNumbers.includes(candidate) && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
      attempts++;
    }
    setManualResults(suggestions);
  };

  const selectNumber = (num: string) => {
    setSelectedManualNumbers([...selectedManualNumbers, num]);
    setManualResults(manualResults.filter(n => n !== num));
  };

  const handleConfirmReservation = async () => {
    if (!buyerName || !buyerPhone || buyerPhone.length < 10) return alert("Datos incompletos.");
    if (!raffle) return;
    
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

  // --- MENSAJE DE WHATSAPP FORMATEADO ---
  const whatsappMessage = 
`Hola! Quiero apartar boletos en *Rifas El Güero*.

🎟 *Rifa:* ${raffle.title}
🔢 *Boletos:* ${finalNumbers.join(', ')}
💰 *Total a pagar:* $${finalNumbers.length * raffle.price} MXN
👤 *Nombre:* ${buyerName}

--------------------------------
🏦 *CUENTA DE PAGO*
Banco: *BBVA*
Cuenta: *1234 5678 9012 3456*
A nombre de: *El Güero*
--------------------------------

Adjunto mi comprobante de pago aquí mismo.`;

  const whatsappLink = `https://wa.me/523327225912?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl bg-gray-200">
            {raffle.images?.[0] && <Image src={raffle.images[selectedImageIndex]} alt="" fill className="object-cover" />}
            <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-1 rounded-full font-bold shadow-md z-10">
              {raffle.takenNumbers ? raffle.takenNumbers.length : 0} Vendidos
            </div>
          </div>
          {raffle.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {raffle.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImageIndex(idx)} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 ${selectedImageIndex === idx ? 'border-blue-900' : ''}`}>
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-4xl font-black text-blue-900 mb-4 uppercase italic">{raffle.title}</h1>
            <div className="text-gray-600 text-lg mb-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: raffle.description }} />
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center gap-2">
              <ShieldCheck className="text-blue-900" /> <p className="text-sm text-blue-800">Sorteo con Lotería Nacional</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border-t-8 border-red-600 sticky top-24">
            <div className="text-center mb-6">
              <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Precio Boleto</span>
              <div className="text-5xl font-black text-red-600 my-1">${raffle.price}</div>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button onClick={() => setBuyMode('machine')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${buyMode === 'machine' ? 'bg-white shadow text-blue-900' : 'text-gray-400'}`}>🎰 MAQUINITA</button>
              <button onClick={() => setBuyMode('manual')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${buyMode === 'manual' ? 'bg-white shadow text-blue-900' : 'text-gray-400'}`}>✍️ MANUAL</button>
            </div>

            {buyMode === 'machine' ? (
              <div className="space-y-4">
                {/* INPUT CANTIDAD PERSONALIZADA */}
                <div className="flex flex-wrap justify-center gap-2 mb-2 items-center">
                   {[1, 5, 10].map(n => (
                     <button key={n} onClick={() => {setMachineQuantity(n); setCustomQuantity("")}} className={`px-4 py-2 rounded-full font-bold border text-sm ${machineQuantity === n && customQuantity === "" ? 'bg-blue-900 text-white' : 'bg-white text-gray-500'}`}>{n}</button>
                   ))}
                   <div className="relative">
                     <input 
                       type="number" 
                       placeholder="Otro..." 
                       value={customQuantity}
                       onChange={(e) => handleCustomQuantityChange(e.target.value)}
                       className="w-20 py-2 px-3 rounded-full border border-gray-300 text-sm font-bold text-center focus:border-blue-900 outline-none"
                     />
                   </div>
                </div>
                <SlotMachine quantity={machineQuantity} takenNumbers={raffle.takenNumbers || []} onGenerate={setMachineNumbers} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input type="number" placeholder="Terminación (Ej: 777)" value={manualSearch} onChange={(e) => setManualSearch(e.target.value.slice(0,6))} className="flex-1 border-2 p-3 rounded-xl outline-none" />
                  <button onClick={handleSearch} className="bg-gray-800 text-white p-3 rounded-xl"><Search /></button>
                </div>
                {manualResults.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                    {manualResults.map(num => <button key={num} onClick={() => selectNumber(num)} className="bg-white border border-green-500 text-green-700 font-mono font-bold px-3 py-1 rounded">{num}</button>)}
                  </div>
                )}
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-gray-400 mb-2">Seleccionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedManualNumbers.map(n => <span key={n} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold text-sm">{n}</span>)}
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => setShowPaymentModal(true)} className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xl py-4 rounded-xl shadow-lg mt-6">
              ¡LOS QUIERO!
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/90 backdrop-blur-sm">
            <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
              <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Confirmar Pedido</h3>
              <div className="flex flex-wrap justify-center gap-1 mb-4">
                {(buyMode === 'machine' ? machineNumbers : selectedManualNumbers).map(n => (<span key={n} className="bg-yellow-100 text-yellow-800 font-mono font-bold px-2 py-1 rounded text-sm">{n}</span>))}
              </div>
              <input type="text" placeholder="Nombre" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full border p-3 rounded-xl mb-3" />
              <input type="tel" placeholder="WhatsApp" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full border p-3 rounded-xl mb-3" />
              <button onClick={handleConfirmReservation} disabled={isProcessing} className="w-full bg-black text-white font-bold py-3 rounded-xl">{isProcessing ? "..." : "Confirmar"}</button>
              <button onClick={() => setShowPaymentModal(false)} className="w-full text-gray-400 py-2 mt-2">Cancelar</button>
            </motion.div>
          </div>
        )}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
             <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white rounded-3xl w-full max-w-sm p-8 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase italic mb-2 text-gray-800">¡Boletos Apartados!</h2>
                <p className="text-sm text-gray-600 mb-6">Presiona el botón para enviar los detalles y la cuenta de pago por WhatsApp.</p>
                <a href={whatsappLink} target="_blank" className="bg-green-500 text-white px-6 py-4 rounded-xl font-bold block w-full shadow-lg hover:bg-green-600 transition">Enviar Pedido WhatsApp</a>
                <button onClick={() => setShowSuccessModal(false)} className="mt-4 text-gray-400 underline text-sm">Cerrar</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}