"use client";
import { useState, useEffect } from "react";
import { 
  createRaffle, updateRaffle, getRaffles, deleteRaffle, getTickets, 
  approveTicket, cancelTicket, uploadImage, setLotteryWinner, 
  getHomeSections, updateHomeSections, getGlobalSettings, updateGlobalSettings, getCancelledTickets, updateTicket,
  RaffleData, TicketData, CancelledTicketData, HomeSection, GlobalSettings, FAQItem, PaymentMethod
} from "@/services/raffleService";
import { Plus, Edit, Trash, Check, X, RefreshCw, Search, Upload, Loader2, Trophy, Home, Settings, ArrowUp, ArrowDown, Layout, Calendar, HelpCircle, Image as ImageIcon, DollarSign, AlertTriangle, CreditCard, Ban, Save } from "lucide-react";
import Image from "next/image";
import TextEditor from "@/components/TextEditor"; 

export default function SecretAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<'raffles' | 'tickets' | 'cancelled' | 'home' | 'settings'>('raffles');
  const [raffles, setRaffles] = useState<RaffleData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [cancelledTickets, setCancelledTickets] = useState<CancelledTicketData[]>([]);
  const [sections, setSections] = useState<HomeSection[]>([]);
  
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ 
    backgroundColor: "#f3f4f6", whatsapp: "3326269409", terms: "", paymentMethods: [], contactInfo: "", faqs: [], maintenanceMode: false 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Nuevo state para editar tickets
  const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editState, setEditState] = useState("");

  const [showLotteryModal, setShowLotteryModal] = useState(false);
  const [lotteryRaffleId, setLotteryRaffleId] = useState("");
  const [lotteryNumber, setLotteryNumber] = useState("");

  const [newRaffle, setNewRaffle] = useState<Partial<RaffleData>>({
    title: "", description: "", price: 0, images: [], endDate: "", status: "active",
    digitCount: 4, promotions: [], imageFit: 'cover'
  });

  const [tempDate, setTempDate] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // States para Nuevo Método de Pago
  const [newBankName, setNewBankName] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccNumber, setNewAccNumber] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [r, t, c, s, g] = await Promise.all([
        getRaffles(), 
        getTickets(), 
        getCancelledTickets(),
        getHomeSections(), 
        getGlobalSettings()
      ]);
      setRaffles(r); setTickets(t); setCancelledTickets(c); setSections(s); 
      setGlobalSettings(g || { backgroundColor: "#f3f4f6", whatsapp: "", terms: "", paymentMethods: [], contactInfo: "", faqs: [], maintenanceMode: false });
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "Elgu3r0.2025") { setIsAuthenticated(true); loadData(); } 
    else alert("Credenciales incorrectas");
  };

  const handleSaveRaffle = async () => {
    if(!newRaffle.title || !newRaffle.price) return alert("Faltan datos");
    if(editingId) await updateRaffle(editingId, newRaffle); else await createRaffle(newRaffle as RaffleData);
    setShowForm(false); loadData();
  };
  
  const initRaffle = () => { 
    setNewRaffle({title:"", price:0, digitCount:4, promotions:[], images:[], description:"", endDate:"", status:"active", imageFit:'cover'}); 
    setEditingId(null); 
    setShowForm(true); 
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const files = Array.from(e.target.files);
      const urls: string[] = []; 
      try {
        for(const f of files) {
          const url = await uploadImage(f);
          urls.push(url);
        }
        setNewRaffle(p => ({ ...p, images: [...(p.images || []), ...urls] }));
      } catch (error) { alert("Error al subir las imágenes"); } finally { setIsUploading(false); }
    }
  };

  const addSection = (type: HomeSection['type']) => setSections([...sections, {id: Date.now().toString(), type, content:"", order:sections.length, data: type==='calendar' ? {dates:[]} : {}}]);
  const moveSection = (i:number, dir:number) => { const n = [...sections]; if(i+dir<0 || i+dir>=n.length) return; [n[i], n[i+dir]] = [n[i+dir], n[i]]; setSections(n); };
  const deleteSection = (idx: number) => setSections(sections.filter((_, i) => i !== idx));
  const addDateToSection = (idx: number) => { if(!tempDate) return; const newSecs = [...sections]; newSecs[idx].data = { dates: [...(newSecs[idx].data?.dates || []), tempDate] }; setSections(newSecs); setTempDate(""); };
  const removeDateFromSection = (idx: number, dateToRemove: string) => { const newSecs = [...sections]; newSecs[idx].data.dates = newSecs[idx].data.dates.filter((d:string) => d !== dateToRemove); setSections(newSecs); };
  const saveSections = async () => { await updateHomeSections(sections); alert("Inicio guardado"); };

  const addFAQ = () => { if(!newQuestion) return; setGlobalSettings({...globalSettings, faqs: [...(globalSettings.faqs||[]), {question:newQuestion, answer:newAnswer}]}); setNewQuestion(""); setNewAnswer(""); };
  const deleteFAQ = (idx: number) => { setGlobalSettings({...globalSettings, faqs: globalSettings.faqs.filter((_, i) => i !== idx)}); };
  
  const addPaymentMethod = () => {
    if(!newBankName || !newAccNumber) return alert("Falta nombre del banco o cuenta");
    const newMethod: PaymentMethod = { bankName: newBankName, accountName: newAccName, accountNumber: newAccNumber };
    setGlobalSettings({ ...globalSettings, paymentMethods: [...(globalSettings.paymentMethods || []), newMethod] });
    setNewBankName(""); setNewAccName(""); setNewAccNumber("");
  };
  const deletePaymentMethod = (idx: number) => {
    setGlobalSettings({ ...globalSettings, paymentMethods: globalSettings.paymentMethods.filter((_, i) => i !== idx) });
  };

  const saveSettings = async () => { await updateGlobalSettings(globalSettings); alert("Ajustes guardados"); };
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setGlobalSettings({ ...globalSettings, backgroundImage: await uploadImage(e.target.files[0], 'settings') }); };

  const confirmLotteryWinner = async () => { if (!lotteryNumber) return alert("Ingresa número"); const res = await setLotteryWinner(lotteryRaffleId!, lotteryNumber); if(res) alert(`GANADOR: ${res.winnerName}`); else alert("Nadie compró ese número"); setShowLotteryModal(false); loadData(); };
  const handleApprove = async (id: string) => { if(confirm("¿Aprobar pago?")) { await approveTicket(id); loadData(); } };
  const handleReject = async (t: TicketData) => { if(confirm("¿Rechazar y liberar? Esta acción enviará el boleto a la lista de 'Cancelados'.")) { await cancelTicket(t.id!, t.raffleId, t.numbers); loadData(); } };
  const handleDeleteRaffle = async (id: string) => { if (confirm("¿Borrar?")) { await deleteRaffle(id); loadData(); } };
  const removeImage = (index: number) => setNewRaffle(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));
  const handlePromoChange = (index: number, field: 'buy' | 'get', value: number) => { const newPromos = [...(newRaffle.promotions || [])]; newPromos[index][field] = value; setNewRaffle({ ...newRaffle, promotions: newPromos }); };

  // Funciones para editar ticket
  const startEditTicket = (t: TicketData) => {
    setEditingTicket(t);
    setEditName(t.buyerName);
    setEditPhone(t.buyerPhone);
    setEditState(t.buyerState || "");
  };
  const saveTicketChanges = async () => {
    if (!editingTicket || !editingTicket.id) return;
    await updateTicket(editingTicket.id, { 
      buyerName: editName, 
      buyerPhone: editPhone, 
      buyerState: editState 
    });
    setEditingTicket(null);
    loadData();
  };

  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-xl w-full max-w-sm"><h2 className="font-bold text-xl mb-4 text-center">Admin El Güero</h2><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Usuario" className="border p-3 block w-full mb-3 rounded-lg outline-none"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" className="border p-3 block w-full mb-4 rounded-lg outline-none"/><button className="bg-blue-900 text-white p-3 w-full rounded font-bold">Entrar</button></form></div>;

  const totalSold = tickets.filter(t => t.status === 'sold').reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 pb-20">
      
      {/* MODAL DE EDICIÓN DE TICKET */}
      {editingTicket && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-black mb-4 uppercase">Editar Boleto</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full border p-2 rounded"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                <input value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full border p-2 rounded"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
                <input value={editState} onChange={e=>setEditState(e.target.value)} className="w-full border p-2 rounded"/>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setEditingTicket(null)} className="flex-1 py-2 border rounded font-bold">Cancelar</button>
              <button onClick={saveTicketChanges} className="flex-1 py-2 bg-blue-900 text-white rounded font-bold flex items-center justify-center gap-2"><Save size={16}/> Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showLotteryModal && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl text-center max-w-sm w-full"><Trophy className="text-yellow-500 w-12 h-12 mx-auto mb-2"/><h3 className="text-xl font-black mb-2">Ganador Lotería</h3><input value={lotteryNumber} onChange={e=>setLotteryNumber(e.target.value)} className="border-2 p-3 w-full text-center text-2xl font-mono font-black mb-4 rounded-lg" placeholder="000000" maxLength={6}/><div className="flex gap-2"><button onClick={()=>setShowLotteryModal(false)} className="flex-1 py-2 border rounded">Cancelar</button><button onClick={confirmLotteryWinner} className="flex-1 py-2 bg-blue-900 text-white rounded font-bold">Confirmar</button></div></div></div>}
      <nav className="bg-black text-white p-4 sticky top-0 z-50 flex flex-col md:flex-row justify-between items-center shadow-md border-b-4 border-red-600 gap-4 md:gap-0"><span className="font-black text-xl italic text-yellow-400 tracking-wide">PANEL ADMIN</span><div className="flex gap-1 bg-gray-800 p-1 rounded-lg overflow-x-auto w-full md:w-auto">{['raffles', 'tickets', 'cancelled', 'home', 'settings'].map((tab) => (<button key={tab} onClick={()=>setActiveTab(tab as any)} className={`px-3 py-2 rounded capitalize text-sm font-bold whitespace-nowrap flex items-center gap-2 transition ${activeTab===tab?'bg-blue-600 text-white shadow':'text-gray-400 hover:text-white'}`}>{tab === 'raffles' && <Layout size={14}/>}{tab === 'tickets' && <DollarSign size={14}/>}{tab === 'cancelled' && <Ban size={14}/>}{tab === 'home' && <Home size={14}/>}{tab === 'settings' && <Settings size={14}/>}{tab === 'cancelled' ? 'Cancelados' : tab}</button>))}</div></nav>
      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        
        {activeTab === 'raffles' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"><h2 className="text-2xl font-black text-gray-800 uppercase italic">Gestión de Rifas</h2><button onClick={initRaffle} className="w-full md:w-auto bg-green-600 text-white px-5 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow hover:scale-105 transition"><Plus size={20}/> Nueva Rifa</button></div>
            {showForm && (<div className="bg-white p-4 md:p-8 rounded-xl shadow-lg border-2 border-blue-100 mb-8 space-y-6 animate-in slide-in-from-bottom-5 w-full max-w-[100vw] overflow-hidden"><h3 className="font-bold text-xl text-blue-900 border-b pb-2 flex justify-between items-center">{editingId ? "Editar Rifa" : "Nueva Rifa"}<button onClick={()=>setShowForm(false)}><X className="text-gray-400 hover:text-red-500"/></button></h3><div className="grid md:grid-cols-2 gap-4 md:gap-6"><div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Título</label><input value={newRaffle.title||""} onChange={e=>setNewRaffle({...newRaffle, title:e.target.value})} className="w-full border-2 p-3 rounded-lg focus:border-blue-500 outline-none"/></div><div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Precio ($)</label><input type="number" value={newRaffle.price||0} onChange={e=>setNewRaffle({...newRaffle, price:+e.target.value})} className="w-full border-2 p-3 rounded-lg focus:border-blue-500 outline-none"/></div><div className="md:col-span-2"><label className="text-xs font-bold text-blue-800 uppercase mb-2 block flex items-center gap-1"><ImageIcon size={14}/> Galería</label><input type="file" multiple onChange={handleImageUpload} className="block w-full text-sm text-gray-500"/><div className="flex gap-2 mt-3 overflow-x-auto pb-2">{newRaffle.images?.map((img,i)=><div key={i} className="relative w-20 h-20 shrink-0 border rounded-lg overflow-hidden"><Image src={img} alt="" fill className="object-cover"/><button onClick={()=>removeImage(i)} className="absolute top-0 right-0 bg-red-600 text-white w-6 h-6 flex items-center justify-center text-xs font-bold">x</button></div>)}</div></div><div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Descripción</label><TextEditor value={newRaffle.description||""} onChange={v=>setNewRaffle({...newRaffle, description:v})} placeholder="Detalles..."/></div><div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Cifras</label><select value={newRaffle.digitCount} onChange={e=>setNewRaffle({...newRaffle, digitCount:+e.target.value})} className="w-full border-2 p-3 rounded-lg bg-white">{[2,3,4,5,6].map(n=><option key={n} value={n}>{n} Cifras</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Fin</label><input type="datetime-local" value={newRaffle.endDate} onChange={e=>setNewRaffle({...newRaffle, endDate:e.target.value})} className="w-full border-2 p-3 rounded-lg bg-white"/></div><div><label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Ajuste</label><select value={newRaffle.imageFit} onChange={e=>setNewRaffle({...newRaffle, imageFit:e.target.value as any})} className="w-full border-2 p-3 rounded-lg bg-white"><option value="cover">Recortar</option><option value="contain">Completa</option></select></div><div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-200"><label className="font-bold text-yellow-800 mb-2 block flex items-center gap-2"><Trophy size={16}/> PROMOCIONES</label>{newRaffle.promotions?.map((p,i)=>(<div key={i} className="flex items-center gap-2 mb-2 bg-white p-2 rounded border"><span className="text-sm">Compra</span><input type="number" value={p.buy} onChange={e=>handlePromoChange(i,'buy',+e.target.value)} className="w-16 border p-1 text-center rounded"/><span className="text-sm">Regalo</span><input type="number" value={p.get} onChange={e=>handlePromoChange(i,'get',+e.target.value)} className="w-16 border p-1 text-center rounded"/><button onClick={()=>setNewRaffle(p=>({...p, promotions:p.promotions?.filter((_,x)=>x!==i)}))} className="text-red-500 font-bold px-2">X</button></div>))}<button onClick={()=>setNewRaffle(p=>({...p, promotions:[...(p.promotions||[]),{buy:10,get:1}]}))} className="text-xs bg-yellow-200 px-3 py-1 rounded font-bold mt-2">+ Agregar Promo</button></div></div><div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t"><button onClick={()=>setShowForm(false)} className="px-6 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition">Cancelar</button><button onClick={handleSaveRaffle} disabled={isUploading} className="bg-blue-900 text-white px-8 py-3 rounded-lg font-bold shadow-lg">{isUploading?"Subiendo...":"Guardar Rifa"}</button></div></div>)}
            <div className="grid gap-4">{raffles.map(r => (<div key={r.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"><div className="flex items-center gap-4 w-full"><div className="w-20 h-20 relative bg-gray-100 rounded-lg shrink-0 overflow-hidden border">{r.images?.[0] && <Image src={r.images[0]} alt="" fill className="object-cover"/>}</div><div><h3 className="font-black text-lg text-gray-800">{r.title}</h3><p className="text-sm text-gray-500">${r.price} • {r.ticketsSold} vendidos</p>{r.status === 'finished' && <p className="text-xs text-green-600 font-bold mt-1 bg-green-50 px-2 py-1 rounded w-fit">🏆 Ganador: {r.winnerName}</p>}</div></div><div className="flex gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">{r.status === 'active' && <button onClick={() => { setLotteryRaffleId(r.id!); setShowLotteryModal(true); }} className="bg-yellow-400 px-3 py-2 rounded-lg text-xs font-bold text-black shadow-sm hover:bg-yellow-500">Ganador</button>}<button onClick={() => { setNewRaffle(r); setEditingId(r.id!); setShowForm(true); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Edit size={18}/></button><button onClick={() => handleDeleteRaffle(r.id!)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash size={18}/></button></div></div>))}</div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 uppercase italic">Pagos Pendientes</h2>
              <div className="bg-green-100 text-green-800 px-6 py-3 rounded-xl font-black text-lg shadow-sm border border-green-200">
                💰 Total Vendido: ${totalSold.toLocaleString('es-MX')}
              </div>
            </div>
            
            <div className="relative mb-6"><Search className="absolute left-3 top-3.5 text-gray-400" size={20}/><input placeholder="Buscar por nombre o teléfono..." className="w-full pl-10 p-3 border-2 rounded-xl outline-none focus:border-blue-500 bg-white" onChange={e => setSearchTerm(e.target.value)}/></div>
            
            <div className="space-y-3">
              {tickets
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .filter(t => t.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) || t.buyerPhone.includes(searchTerm))
                .map(t => (
                <div key={t.id} className={`p-4 md:p-5 border-2 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${t.status === 'reserved' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
                  <div className="w-full">
                    <p className="font-bold text-lg text-gray-800">{t.buyerName} <span className="text-sm font-normal text-gray-500 block md:inline">📱 {t.buyerPhone}</span></p>
                    <p className="text-xs font-bold text-blue-600">📍 {t.buyerState || "Sin estado"}</p>
                    <p className="text-xs text-gray-600 mt-1 bg-white/50 p-2 rounded border border-gray-200 inline-block">🎟️ {t.numbers.join(", ")}</p>
                    <p className="font-black text-xl text-blue-900 mt-2">${t.total} <span className="text-xs font-normal text-gray-500 uppercase">MXN</span></p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => startEditTicket(t)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Editar"><Edit size={20}/></button>
                    
                    {t.status === 'reserved' ? (
                      <>
                        <button onClick={() => handleApprove(t.id!)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow font-bold flex items-center justify-center gap-2"><Check size={20}/> Aprobar</button>
                        <button onClick={() => handleReject(t)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow font-bold flex items-center justify-center gap-2"><X size={20}/> Rechazar</button>
                      </>
                    ) : (
                      <>
                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold border border-green-200 flex items-center gap-2 justify-center"><Check size={16}/> PAGADO</span>
                        <button onClick={() => handleReject(t)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Eliminar boleto vendido"><Trash size={20}/></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ... PESTAÑA CANCELADOS ... */}
        {activeTab === 'cancelled' && (
          <div>
            <h2 className="text-2xl font-black text-red-800 mb-4 uppercase italic">Historial de Cancelados</h2>
            <div className="relative mb-6"><Search className="absolute left-3 top-3.5 text-gray-400" size={20}/><input placeholder="Buscar cancelados..." className="w-full pl-10 p-3 border-2 rounded-xl outline-none focus:border-red-300 bg-white" onChange={e => setSearchTerm(e.target.value)}/></div>
            <div className="space-y-3">
              {cancelledTickets.filter(t => t.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) || t.buyerPhone.includes(searchTerm)).map(t => (
                <div key={t.id} className="p-4 md:p-5 border-2 border-red-100 bg-red-50 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg text-red-900">{t.buyerName}</p>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded font-bold uppercase">Cancelado</span>
                    </div>
                    <span className="text-sm font-normal text-gray-600 block md:inline">📱 {t.buyerPhone} • 📍 {t.buyerState || "Sin estado"}</span>
                    <p className="text-xs text-gray-500 mt-2">
                      📅 Cancelado el: {t.cancelledAt?.seconds ? new Date(t.cancelledAt.seconds * 1000).toLocaleString() : 'Fecha desconocida'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 bg-white/50 p-2 rounded border border-red-200 inline-block font-mono">
                      🎟️ Números liberados: {t.numbers.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-gray-400 line-through">${t.total}</p>
                  </div>
                </div>
              ))}
              {cancelledTickets.length === 0 && <p className="text-gray-400 italic text-center py-10">No hay tickets cancelados en el historial.</p>}
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200"><h2 className="text-2xl font-black text-gray-800 mb-6 uppercase italic">Editor de Inicio</h2><div className="flex flex-wrap gap-3 mb-8"><button onClick={() => addSection('html')} className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 border flex items-center gap-2"><Layout size={16}/> + Texto</button><button onClick={() => addSection('calendar')} className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 border flex items-center gap-2"><Calendar size={16}/> + Calendario</button><button onClick={() => addSection('faq')} className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 border flex items-center gap-2"><HelpCircle size={16}/> + FAQ</button></div><div className="space-y-6">{sections.map((sec, i) => (<div key={sec.id} className="border-2 border-gray-200 p-4 md:p-6 rounded-xl relative group bg-gray-50"><div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-50 md:group-hover:opacity-100 transition"><button onClick={() => moveSection(i, -1)} className="p-1 bg-white rounded shadow hover:text-blue-600"><ArrowUp size={16}/></button><button onClick={() => moveSection(i, 1)} className="p-1 bg-white rounded shadow hover:text-blue-600"><ArrowDown size={16}/></button><button onClick={() => deleteSection(i)} className="p-1 bg-white rounded shadow text-red-500 hover:bg-red-50"><Trash size={16}/></button></div><span className="text-xs font-black text-blue-600 uppercase mb-3 block tracking-wider bg-blue-100 w-fit px-2 py-1 rounded">Bloque: {sec.type}</span>{sec.type === 'html' && <TextEditor value={sec.content || ""} onChange={v => { const n = [...sections]; n[i].content = v; setSections(n); }} />}{sec.type === 'calendar' && (<div className="bg-white p-4 rounded border"><div className="flex flex-col md:flex-row gap-2 mb-2 items-start md:items-center"><input type="date" value={tempDate} onChange={e => setTempDate(e.target.value)} className="border p-2 rounded text-sm w-full md:w-auto"/><button onClick={() => addDateToSection(i)} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold w-full md:w-auto">Agregar Fecha</button></div><div className="flex flex-wrap gap-2">{(sec.data?.dates || []).map((d: string) => <span key={d} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">{d} <button onClick={() => removeDateFromSection(i, d)} className="text-red-500 hover:text-red-700 font-black">x</button></span>)}</div></div>)}{sec.type === 'faq' && <p className="text-gray-500 italic text-sm bg-white p-3 rounded border text-center">Este bloque mostrará automáticamente las preguntas de la pestaña "Global".</p>}</div>))}</div><button onClick={saveSections} className="mt-8 w-full bg-blue-900 text-white py-4 rounded-xl font-bold shadow-lg hover:scale-[1.01] transition">Publicar Inicio</button></div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg space-y-8 border border-gray-200">
            <h2 className="text-2xl font-black text-gray-800 border-b pb-4 uppercase italic">Configuración Global</h2>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-yellow-50 p-5 rounded-xl border-2 border-yellow-200">
               <div>
                 <h3 className="font-black text-yellow-800 flex items-center gap-2 text-lg"><AlertTriangle size={24}/> MODO MANTENIMIENTO</h3>
                 <p className="text-sm text-yellow-700 font-medium">Si activas esto, los clientes podrán ver la página pero NO podrán comprar.</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={globalSettings.maintenanceMode || false} onChange={e => setGlobalSettings({...globalSettings, maintenanceMode: e.target.checked})} className="sr-only peer"/>
                 <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
               </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="font-bold text-sm text-gray-500 block mb-1 uppercase">Color Fondo</label><input type="color" value={globalSettings.backgroundColor} onChange={e=>setGlobalSettings({...globalSettings, backgroundColor:e.target.value})} className="w-full h-12 rounded cursor-pointer border-2"/></div>
              <div><label className="font-bold text-sm text-gray-500 block mb-1 uppercase">WhatsApp</label><input value={globalSettings.whatsapp} onChange={e=>setGlobalSettings({...globalSettings, whatsapp:e.target.value})} className="w-full border-2 p-3 rounded-lg"/></div>
              <div className="md:col-span-2"><label className="font-bold text-sm text-gray-500 block mb-1 uppercase">Imagen de Fondo</label><input type="file" onChange={handleBgUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>{globalSettings.backgroundImage && <div className="mt-2 text-xs text-green-600 font-bold">Imagen cargada ✅</div>}</div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
              <h3 className="font-bold text-lg text-blue-900 mb-4 uppercase flex items-center gap-2"><CreditCard size={20}/> Métodos de Pago (Cuentas)</h3>
              <div className="grid md:grid-cols-3 gap-2 mb-4">
                 <input value={newBankName} onChange={e=>setNewBankName(e.target.value)} placeholder="Banco / Método (Ej: BBVA)" className="border p-3 rounded-lg w-full"/>
                 <input value={newAccName} onChange={e=>setNewAccName(e.target.value)} placeholder="Nombre Titular" className="border p-3 rounded-lg w-full"/>
                 <input value={newAccNumber} onChange={e=>setNewAccNumber(e.target.value)} placeholder="No. Cuenta / Tarjeta / CLABE" className="border p-3 rounded-lg w-full"/>
              </div>
              <button onClick={addPaymentMethod} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 mb-4 w-full md:w-auto">Agregar Cuenta</button>
              
              <div className="space-y-3">
                 {Array.isArray(globalSettings.paymentMethods) && globalSettings.paymentMethods.map((pm, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                       <div>
                          <p className="font-bold text-blue-900">{pm.bankName}</p>
                          <p className="text-sm text-gray-600">{pm.accountName}</p>
                          <p className="font-mono text-sm font-bold text-gray-800">{pm.accountNumber}</p>
                       </div>
                       <button onClick={()=>deletePaymentMethod(i)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash size={18}/></button>
                    </div>
                 ))}
                 {(!Array.isArray(globalSettings.paymentMethods) || globalSettings.paymentMethods.length === 0) && <p className="text-gray-400 italic text-sm">No hay métodos de pago registrados.</p>}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200"><h3 className="font-bold text-lg text-gray-800 mb-4 uppercase">Preguntas Frecuentes (FAQ)</h3><div className="flex flex-col md:flex-row gap-2 mb-4"><input value={newQuestion} onChange={e=>setNewQuestion(e.target.value)} placeholder="Pregunta..." className="flex-1 border p-3 rounded-lg"/><input value={newAnswer} onChange={e=>setNewAnswer(e.target.value)} placeholder="Respuesta..." className="flex-1 border p-3 rounded-lg"/><button onClick={addFAQ} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700">Agregar</button></div><div className="space-y-3 max-h-60 overflow-y-auto">{globalSettings.faqs?.map((faq, i) => (<div key={i} className="bg-white p-4 rounded-lg border flex justify-between items-center shadow-sm"><div><p className="font-bold text-sm text-gray-800">{faq.question}</p><p className="text-xs text-gray-500">{faq.answer}</p></div><button onClick={()=>deleteFAQ(i)} className="text-red-500 bg-red-50 p-2 rounded hover:bg-red-100"><Trash size={16}/></button></div>))}</div></div>
            <div className="space-y-6"><div><label className="font-bold text-sm text-gray-500 block mb-2 uppercase">Términos y Condiciones</label><TextEditor value={globalSettings.terms} onChange={v=>setGlobalSettings({...globalSettings, terms:v})}/></div><div><label className="font-bold text-sm text-gray-500 block mb-2 uppercase">Contacto</label><TextEditor value={globalSettings.contactInfo} onChange={v=>setGlobalSettings({...globalSettings, contactInfo:v})}/></div></div>
            <button onClick={saveSettings} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.01] text-lg">GUARDAR CONFIGURACIÓN</button>
          </div>
        )}
      </main>
    </div>
  );
}