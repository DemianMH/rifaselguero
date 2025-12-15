"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getRaffleById, reserveTickets, getGlobalSettings, RaffleData, GlobalSettings } from "@/services/raffleService";
import SlotMachine from "@/components/SlotMachine";
import { CheckCircle, ShieldCheck, Search, Lock, Ticket, Gift } from "lucide-react"; 
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function RaffleDetail() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  
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
  const [buyerState, setBuyerState] = useState(""); 
  const [finalNumbers, setFinalNumbers] = useState<string[]>([]);
  const [finalTotal, setFinalTotal] = useState(0);
  const [finalPaidCount, setFinalPaidCount] = useState(0);
  const [finalBonusCount, setFinalBonusCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([getRaffleById(id as string), getGlobalSettings()]).then(([d, s]) => {
        setRaffle(d);
        setGlobalSettings(s);
        setIsMaintenance(s.maintenanceMode || false);
        setLoading(false);
      });
    }
  }, [id]);

  const generateRandomNumbers = (qty: number, digits: number, taken: string[]) => {
    const nums: string[] = [];
    const limit = Math.pow(10, digits);
    let attempts = 0;
    while (nums.length < qty && attempts < 10000) {
      const n = Math.floor(Math.random() * limit).toString().padStart(digits, '0');
      if (!taken.includes(n) && !nums.includes(n)) nums.push(n);
      attempts++;
    }
    return nums;
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

  const handlePrePurchaseCheck = () => {
    if (buyMode === 'machine') {
      if (machineNumbers.length !== machineQuantity) {
        const autoNumbers = generateRandomNumbers(machineQuantity, raffle?.digitCount || 4, raffle?.takenNumbers || []);
        setMachineNumbers(autoNumbers);
      }
    } else {
      if (selectedManualNumbers.length === 0) return alert("Selecciona al menos un número manual.");
    }
    setShowPaymentModal(true);
  };

  const handleConfirm = async () => {
    if (!buyerName || !buyerPhone || !buyerState) return alert("Llena todos los datos (Nombre, Teléfono y Estado)");
    const qty = buyMode === 'machine' ? machineQuantity : selectedManualNumbers.length;
    const numbersToSend = buyMode === 'machine' ? machineNumbers : selectedManualNumbers;
    
    setIsProcessing(true);
    try {
      const res = await reserveTickets(
        id as string, 
        buyerName, 
        buyerPhone, 
        buyerState, 
        qty, 
        raffle!.price, 
        raffle!.digitCount || 4, 
        numbersToSend, 
        raffle!.promotions
      );
      
      setFinalNumbers(res.numbers);
      setFinalTotal(res.total);
      setFinalPaidCount(res.paidCount); 
      setFinalBonusCount(res.bonusCount); 
      setShowPaymentModal(false); 
      setShowSuccessModal(true);
    } catch (error: any) { 
      alert(error.message || error || "Error al apartar. Intenta de nuevo."); 
      if (buyMode === 'machine') {
         const newAutoNumbers = generateRandomNumbers(machineQuantity, raffle?.digitCount || 4, raffle?.takenNumbers || []);
         setMachineNumbers(newAutoNumbers);
      }
    } finally { 
      setIsProcessing(false); 
    }
  };

  if (loading || !raffle) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  
  let paymentText = "";
  if (globalSettings?.paymentMethods && Array.isArray(globalSettings.paymentMethods) && globalSettings.paymentMethods.length > 0) {
    paymentText = globalSettings.paymentMethods.map(pm => 
      `🔹 *${pm.bankName}*: ${pm.accountNumber}\n   (Titular: ${pm.accountName})`
    ).join('\n\n');
  } else {
    paymentText = "Solicita la cuenta bancaria al administrador.";
  }

  const paidNumbersList = finalNumbers.slice(0, finalPaidCount).join(', ');
  const bonusNumbersList = finalBonusCount > 0 ? finalNumbers.slice(finalPaidCount).join(', ') : '';

  const whatsappMsg = `Hola Rifas El Güero! 🎟️\n` +
    `Quiero apartar boletos para: *${raffle.title}*\n` +
    `👤 A nombre de: ${buyerName}\n` +
    `📍 Desde: ${buyerState}\n\n` +
    `🔢 *Boletos Seleccionados (${finalPaidCount}):* ${paidNumbersList}\n` +
    (finalBonusCount > 0 ? `🎁 *Boletos de Regalo (${finalBonusCount}):* ${bonusNumbersList}\n` : ``) +
    `\n💰 *Total a pagar: $${finalTotal}* (Por ${finalPaidCount} boletos)\n\n` +
    `⚠️ IMPORTANTE: Pondré mi nombre completo en el concepto de la transferencia.\n\n` +
    `----------------------------------\n` +
    `💳 *CUENTAS DE PAGO:*\n\n` +
    `${paymentText}\n` +
    `----------------------------------\n\n` +
    `Espero confirmación. Gracias!`;

  const previewNumbers = buyMode === 'machine' ? machineNumbers : selectedManualNumbers;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 w-full overflow-x-hidden">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        <div className="grid lg:grid-cols-2 gap-6 md:gap-10 mb-8">
          {/* COLUMNA IZQUIERDA: FOTOS E INFO */}
          <div className="space-y-4 w-full">
            <div className="relative h-64 md:h-[500px] bg-white rounded-2xl shadow-lg overflow-hidden w-full border border-gray-100 flex items-center justify-center">
              {raffle.images && raffle.images[0] && (
                <Image 
                  src={raffle.images[selectedImageIndex]} 
                  alt={raffle.title} 
                  fill 
                  className="object-contain" 
                  priority 
                />
              )}
            </div>

            {raffle.images.length > 1 && (
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
                {raffle.images.map((img, i) => (
                  <div 
                    key={i} 
                    onClick={()=>setSelectedImageIndex(i)} 
                    className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${selectedImageIndex === i ? 'border-blue-900 scale-105' : 'border-transparent opacity-80'}`}
                  >
                    <Image src={img} alt="" fill className="object-cover"/>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow w-full">
              <h1 className="text-2xl md:text-4xl font-black uppercase text-blue-900 mb-4 break-words">{raffle.title}</h1>
              <div className="prose max-w-none text-gray-600 text-sm md:text-base break-words" dangerouslySetInnerHTML={{__html: raffle.description}} />
              <div className="bg-blue-50 p-4 rounded border border-blue-100 mt-4 font-bold text-blue-900 flex items-center gap-2 text-sm md:text-base">
                <ShieldCheck className="shrink-0"/> Lotería Nacional ({raffle.digitCount || 4} Cifras)
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: COMPRA */}
          <div className={`bg-white p-6 rounded-xl shadow-xl h-fit sticky top-24 border-t-8 w-full ${isMaintenance ? 'border-gray-400' : 'border-red-600'}`}>
            
            {isMaintenance ? (
              <div className="text-center py-10 px-4">
                <Lock className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl md:text-2xl font-black text-gray-700 mb-3 uppercase italic">Ventas Pausadas</h3>
                <p className="text-gray-500 font-medium text-sm">Mantenimiento temporal. <br/>Intenta más tarde.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-2">
                  <p suppressHydrationWarning className="text-blue-900 font-bold uppercase text-sm tracking-widest border-b border-blue-100 pb-2 inline-block">
                    📅 Juega el: {new Date(raffle.endDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                  </p>
                </div>

                <div className="text-center mb-6">
                  {/* NUEVO: BLOQUE DE PROMOCIONES ACTIVAS */}
                  {raffle.promotions && raffle.promotions.length > 0 && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mb-4 animate-pulse mx-auto w-full max-w-xs">
                      <h4 className="font-black text-yellow-800 flex items-center justify-center gap-2 text-xs uppercase tracking-wide">
                        <Gift size={16} /> Promociones Activas
                      </h4>
                      <div className="space-y-1 mt-1 text-center">
                        {raffle.promotions.map((p, i) => (
                          <p key={i} className="text-sm text-yellow-900 font-bold">
                            🎁 Compra {p.buy} y llévate {p.get} GRATIS
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-gray-400 font-bold text-xs uppercase">Precio Boleto</span>
                  <div className="text-4xl md:text-5xl font-black text-red-600">${raffle.price}</div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded mb-6">
                  <button onClick={()=>setBuyMode('machine')} className={`flex-1 py-2 rounded font-bold text-sm transition ${buyMode==='machine'?'bg-white shadow text-blue-900':'text-gray-400'}`}>MAQUINITA</button>
                  <button onClick={()=>setBuyMode('manual')} className={`flex-1 py-2 rounded font-bold text-sm transition ${buyMode==='manual'?'bg-white shadow text-blue-900':'text-gray-400'}`}>MANUAL</button>
                </div>

                {buyMode === 'machine' ? (
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center gap-2 mb-2 flex-wrap">
                      {[1, 3, 5, 10, 20].map(n => (
                        <button key={n} onClick={()=>{setMachineQuantity(n); setCustomQuantity("")}} className={`px-3 py-2 md:px-4 rounded border font-bold text-sm ${machineQuantity===n && customQuantity==="" ?'bg-blue-900 text-white':'bg-white'}`}>{n}</button>
                      ))}
                      <input type="number" placeholder="Otro" value={customQuantity} onChange={e=>{setCustomQuantity(e.target.value); setMachineQuantity(+e.target.value)}} className="w-16 md:w-20 border p-2 rounded text-center font-bold text-sm"/>
                    </div>
                    <SlotMachine quantity={machineQuantity} 
                      digitCount={raffle.digitCount||4} 
                      takenNumbers={raffle.takenNumbers || []} 
                      onGenerate={setMachineNumbers} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input type="number" placeholder={`Terminación`} value={manualSearch} onChange={(e)=>setManualSearch(e.target.value)} className="flex-1 border-2 p-3 rounded-xl outline-none w-full" />
                      <button onClick={handleSearch} className="bg-gray-800 text-white p-3 rounded-xl flex-shrink-0"><Search/></button>
                    </div>
                    {manualResults.length>0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded">
                        {manualResults.map(n=><button key={n} onClick={()=>{setSelectedManualNumbers([...selectedManualNumbers, n]); setManualResults(manualResults.filter(x=>x!==n))}} className="bg-white border px-3 py-1 rounded font-mono font-bold text-sm">{n}</button>)}
                      </div>
                    )}
                    <div className="border-t pt-4">
                      <p className="text-xs font-bold text-gray-400 mb-2">Seleccionados:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedManualNumbers.map(n=><span key={n} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold text-sm flex items-center gap-2">{n} <button onClick={()=>setSelectedManualNumbers(selectedManualNumbers.filter(x=>x!==n))} className="text-red-500">x</button></span>)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center font-bold text-gray-700 text-sm md:text-base">
                    <span>Boletos: {(buyMode==='machine'?machineQuantity:selectedManualNumbers.length)}</span>
                    <span className="text-xl text-black">${(buyMode==='machine'?machineQuantity:selectedManualNumbers.length) * raffle.price}</span>
                  </div>
                  <button onClick={handlePrePurchaseCheck} className="w-full bg-red-600 text-white font-black text-lg md:text-xl py-4 rounded shadow mt-4 hover:bg-red-700 transition transform active:scale-95">
                    ¡LOS QUIERO!
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* TABLA DE NÚMEROS COMPRADOS */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-2xl font-black text-blue-900 mb-6 uppercase flex items-center gap-2 border-b pb-2">
            <Ticket size={28}/> Números Comprados
          </h3>
          {raffle.takenNumbers && raffle.takenNumbers.length > 0 ? (
            <div>
              <p className="mb-4 text-sm text-gray-500">Estos números ya han sido vendidos y no están disponibles.</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                {raffle.takenNumbers.sort((a,b) => Number(a) - Number(b)).map(num => (
                  <div key={num} className="bg-red-100 text-red-700 font-mono font-bold text-center py-1 rounded text-xs md:text-sm border border-red-200 select-none opacity-80 cursor-not-allowed">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
              <Ticket size={48} className="mx-auto mb-2 opacity-20"/>
              <p className="italic">Aún no se han comprado números. ¡Sé el primero en participar!</p>
            </div>
          )}
        </div>

      </div>
      
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/90 backdrop-blur-sm">
            <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Confirmar Pedido</h3>
              
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Estás a punto de apartar estos números:</p>
                <div className="flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto p-2 bg-gray-50 rounded border">
                  {previewNumbers.map(n => <span key={n} className="text-xs font-bold bg-white border px-2 py-1 rounded text-gray-800">{n}</span>)}
                </div>
                <p className="text-lg font-black text-blue-900 mt-2">Total: ${(buyMode==='machine'?machineQuantity:selectedManualNumbers.length) * raffle.price}</p>
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="Nombre Completo" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800 outline-none focus:border-blue-600" />
                <input type="tel" placeholder="WhatsApp (10 dígitos)" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800 outline-none focus:border-blue-600" />
                <input type="text" placeholder="Estado / Ciudad" value={buyerState} onChange={e => setBuyerState(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800 outline-none focus:border-blue-600" />
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 font-bold mb-4">
                 ⚠️ Al transferir, por favor escribe tu nombre completo en el concepto de pago.
              </div>

              <button onClick={handleConfirm} disabled={isProcessing} className="w-full bg-black text-white font-bold py-3 rounded-xl shadow-lg hover:bg-gray-800 transition">{isProcessing?"Procesando...":"Confirmar Apartado"}</button>
              <button onClick={() => setShowPaymentModal(false)} className="w-full text-gray-400 py-3 mt-1 font-bold">Cancelar</button>
            </motion.div>
          </div>
        )}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
             <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white rounded-3xl w-full max-w-sm p-8 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase italic mb-2 text-gray-800">¡Apartados!</h2>
                <div className="max-h-40 overflow-y-auto my-4 grid grid-cols-3 gap-2">
                  {finalNumbers.map(n => <span key={n} className="bg-gray-100 text-xs font-bold p-1 rounded text-gray-600 border">{n}</span>)}
                </div>
                <p className="text-xs text-gray-500 mb-4">Envía el mensaje pre-cargado con tu estado y recuerda poner tu nombre en la transferencia.</p>
                <a href={`https://wa.me/523326269409?text=${encodeURIComponent(whatsappMsg)}`} target="_blank" className="bg-green-500 text-white px-6 py-4 rounded-xl font-bold block w-full shadow-lg hover:bg-green-600 transition transform hover:scale-105">Enviar WhatsApp</a>
                <button onClick={() => setShowSuccessModal(false)} className="mt-4 text-gray-400 underline text-sm">Cerrar</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}