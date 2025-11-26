"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getRaffleById, reserveTickets, getGlobalSettings, RaffleData } from "@/services/raffleService";
import SlotMachine from "@/components/SlotMachine";
import { CheckCircle, ShieldCheck, Search, Gift, Lock } from "lucide-react"; 
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function RaffleDetail() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isMaintenance, setIsMaintenance] = useState(false); // <--- ESTADO MANTENIMIENTO

  // ... (Mismos estados de compra)
  const [buyMode, setBuyMode] = useState<'machine' | 'manual'>('machine');
  const [machineQuantity, setMachineQuantity] = useState(1);
  const [machineNumbers, setMachineNumbers] = useState<string[]>([]);
  const [manualSearch, setManualSearch] = useState("");
  const [manualResults, setManualResults] = useState<string[]>([]);
  const [selectedManualNumbers, setSelectedManualNumbers] = useState<string[]>([]);
  const [customQuantity, setCustomQuantity] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [finalNumbers, setFinalNumbers] = useState<string[]>([]);
  const [finalTotal, setFinalTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([getRaffleById(id as string), getGlobalSettings()]).then(([d, s]) => {
        setRaffle(d);
        setIsMaintenance(s.maintenanceMode || false); // Leemos configuración
        setLoading(false);
      });
    }
  }, [id]);

  const getBonusTickets = (qty: number) => {
    if (!raffle?.promotions) return 0;
    let bonus = 0;
    raffle.promotions.forEach(p => { if (qty >= p.buy) bonus += (Math.floor(qty / p.buy) * p.get); });
    return bonus;
  };

  const handleSearch = () => {
    if (!raffle) return;
    const suggestions: string[] = [];
    const digits = raffle.digitCount || 4;
    let attempts = 0;
    while (suggestions.length < 5 && attempts < 50) {
      const prefixLength = digits - manualSearch.length;
      let candidate = manualSearch;
      if (prefixLength > 0) candidate = Math.floor(Math.random() * Math.pow(10, prefixLength)).toString().padStart(prefixLength, '0') + manualSearch;
      if (!raffle.takenNumbers.includes(candidate) && !selectedManualNumbers.includes(candidate) && !suggestions.includes(candidate)) suggestions.push(candidate);
      attempts++;
    }
    setManualResults(suggestions);
  };

  const handleConfirm = async () => {
    if (!buyerName || !buyerPhone) return alert("Llena tus datos");
    const qty = buyMode === 'machine' ? machineQuantity : selectedManualNumbers.length;
    setIsProcessing(true);
    try {
      const res = await reserveTickets(
        id as string, buyerName, buyerPhone, qty, raffle!.price, raffle!.takenNumbers, 
        raffle!.digitCount || 4, 
        buyMode==='manual' ? selectedManualNumbers : undefined, 
        raffle!.promotions
      );
      setFinalNumbers(res.numbers);
      setFinalTotal(res.total);
      setShowPaymentModal(false); setShowSuccessModal(true);
    } catch (error) { alert("Error: Números no disponibles"); } finally { setIsProcessing(false); }
  };

  if (loading || !raffle) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  
  const bonusCount = getBonusTickets(buyMode === 'machine' ? machineQuantity : selectedManualNumbers.length);
  const totalQty = (buyMode === 'machine' ? machineQuantity : selectedManualNumbers.length) + bonusCount;
  const whatsappMsg = `Hola Rifas El Güero! Aparté boletos.\nRifa: ${raffle.title}\nBoletos (${finalNumbers.length}): ${finalNumbers.join(', ')}\nTotal: $${finalTotal}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-10">
        
        <div className="space-y-4">
          <div className="relative h-96 bg-white rounded-2xl shadow-lg overflow-hidden">
            {raffle.images && raffle.images[0] && <Image src={raffle.images[selectedImageIndex]} alt="" fill className={`object-${raffle.imageFit || 'cover'}`} />}
          </div>
          {raffle.images.length > 1 && <div className="flex gap-2 overflow-x-auto">{raffle.images.map((img, i) => <div key={i} onClick={()=>setSelectedImageIndex(i)} className="relative w-20 h-20 shrink-0 cursor-pointer border-2 hover:border-blue-500 rounded-lg overflow-hidden"><Image src={img} alt="" fill className="object-cover"/></div>)}</div>}
          <div className="bg-white p-6 rounded-xl shadow"><h1 className="text-3xl font-black uppercase text-blue-900 mb-4">{raffle.title}</h1><div className="prose max-w-none text-gray-600" dangerouslySetInnerHTML={{__html: raffle.description}} /><div className="bg-blue-50 p-4 rounded border border-blue-100 mt-4 font-bold text-blue-900 flex items-center gap-2"><ShieldCheck/> Lotería Nacional ({raffle.digitCount || 4} Cifras)</div></div>
        </div>

        {/* PANEL DE COMPRA INTELIGENTE */}
        <div className={`bg-white p-6 rounded-xl shadow-xl h-fit sticky top-24 border-t-8 ${isMaintenance ? 'border-gray-400' : 'border-red-600'}`}>
          
          {isMaintenance ? (
            <div className="text-center py-10 px-4">
              <Lock className="w-20 h-20 mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-black text-gray-700 mb-3 uppercase italic">Ventas Pausadas</h3>
              <p className="text-gray-500 font-medium">El sistema se encuentra en mantenimiento temporal. <br/>Por favor intenta más tarde.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <span className="text-gray-400 font-bold text-xs uppercase">Precio Boleto</span>
                <div className="text-5xl font-black text-red-600">${raffle.price}</div>
                {raffle.promotions?.map((p,i) => <div key={i} className="bg-yellow-100 text-yellow-800 text-xs font-bold inline-block px-2 py-1 rounded mt-2 animate-pulse flex items-center gap-1"><Gift size={12}/> Compra {p.buy}, Gratis {p.get}!</div>)}
              </div>

              {/* Resto del código de compra (Maquinita/Manual) se mantiene igual */}
              <div className="flex bg-gray-100 p-1 rounded mb-6">
                <button onClick={()=>setBuyMode('machine')} className={`flex-1 py-2 rounded font-bold text-sm ${buyMode==='machine'?'bg-white shadow text-blue-900':'text-gray-400'}`}>MAQUINITA</button>
                <button onClick={()=>setBuyMode('manual')} className={`flex-1 py-2 rounded font-bold text-sm ${buyMode==='manual'?'bg-white shadow text-blue-900':'text-gray-400'}`}>MANUAL</button>
              </div>

              {buyMode === 'machine' ? (
                <div className="space-y-4 text-center">
                  <div className="flex justify-center gap-2 mb-2 flex-wrap">
                    {[1, 3, 5, 10, 20, 50].map(n => <button key={n} onClick={()=>{setMachineQuantity(n); setCustomQuantity("")}} className={`px-4 py-2 rounded border font-bold ${machineQuantity===n && customQuantity==="" ?'bg-blue-900 text-white':'bg-white'}`}>{n}</button>)}
                    <input type="number" placeholder="Otro" value={customQuantity} onChange={e=>{setCustomQuantity(e.target.value); setMachineQuantity(+e.target.value)}} className="w-20 border p-2 rounded text-center font-bold"/>
                  </div>
                  <SlotMachine quantity={1} digitCount={raffle.digitCount||4} takenNumbers={[]} onGenerate={()=>{}} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2"><input type="number" placeholder={`Terminación`} value={manualSearch} onChange={(e)=>setManualSearch(e.target.value)} className="flex-1 border-2 p-3 rounded-xl outline-none"/><button onClick={handleSearch} className="bg-gray-800 text-white p-3 rounded-xl"><Search/></button></div>
                  {manualResults.length>0 && <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded">{manualResults.map(n=><button key={n} onClick={()=>{setSelectedManualNumbers([...selectedManualNumbers, n]); setManualResults(manualResults.filter(x=>x!==n))}} className="bg-white border px-3 py-1 rounded font-mono font-bold">{n}</button>)}</div>}
                  <div className="border-t pt-4"><p className="text-xs font-bold text-gray-400 mb-2">Seleccionados:</p><div className="flex flex-wrap gap-2">{selectedManualNumbers.map(n=><span key={n} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold text-sm flex items-center gap-2">{n} <button onClick={()=>setSelectedManualNumbers(selectedManualNumbers.filter(x=>x!==n))} className="text-red-500">x</button></span>)}</div></div>
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center font-bold text-gray-700">
                  <span>Boletos: {(buyMode==='machine'?machineQuantity:selectedManualNumbers.length)} + <span className="text-green-600">{bonusCount} Gratis</span></span>
                  <span className="text-xl text-black">${(buyMode==='machine'?machineQuantity:selectedManualNumbers.length) * raffle.price}</span>
                </div>
                <button onClick={()=>setShowPaymentModal(true)} className="w-full bg-red-600 text-white font-black text-xl py-4 rounded shadow mt-4 hover:bg-red-700">¡LOS QUIERO!</button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* MODALES IGUALES QUE ANTES... */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/90 backdrop-blur-sm">
            <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
              <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Confirmar Pedido</h3>
              <div className="text-center mb-4 text-sm text-gray-500">Apartarás <b>{totalQty}</b> boletos.</div>
              <input type="text" placeholder="Nombre" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full border p-3 rounded-xl mb-3 text-gray-800" />
              <input type="tel" placeholder="WhatsApp" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full border p-3 rounded-xl mb-3 text-gray-800" />
              <button onClick={handleConfirm} disabled={isProcessing} className="w-full bg-black text-white font-bold py-3 rounded-xl">{isProcessing?"...":"Confirmar"}</button>
              <button onClick={() => setShowPaymentModal(false)} className="w-full text-gray-400 py-2 mt-2">Cancelar</button>
            </motion.div>
          </div>
        )}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
             <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white rounded-3xl w-full max-w-sm p-8 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase italic mb-2 text-gray-800">¡Apartados!</h2>
                <div className="max-h-40 overflow-y-auto my-4 grid grid-cols-4 gap-2">{finalNumbers.map(n => <span key={n} className="bg-gray-100 text-xs font-bold p-1 rounded">{n}</span>)}</div>
                <a href={`https://wa.me/52${whatsappMsg}`} target="_blank" className="bg-green-500 text-white px-6 py-4 rounded-xl font-bold block w-full shadow-lg hover:bg-green-600 transition">Enviar Pedido WhatsApp</a>
                <button onClick={() => setShowSuccessModal(false)} className="mt-4 text-gray-400 underline text-sm">Cerrar</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}