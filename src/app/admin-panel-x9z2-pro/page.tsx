"use client";
import { useState, useEffect } from "react";
import { 
  createRaffle, 
  updateRaffle, 
  getRaffles, 
  deleteRaffle, 
  getTickets, 
  approveTicket, 
  cancelTicket, 
  uploadRaffleImage,
  setLotteryWinner,
  getHomeConfig, // Nuevo
  updateHomeConfig, // Nuevo
  RaffleData, 
  TicketData 
} from "@/services/raffleService";
import { Plus, Edit, Trash, Check, X, RefreshCw, Search, Upload, Loader2, Trophy, AlertTriangle, Lock, Home } from "lucide-react";
import Image from "next/image";
import TextEditor from "@/components/TextEditor"; 

export default function SecretAdminPanel() {
  // --- ESTADO DE LOGIN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // --- ESTADOS DEL SISTEMA ---
  const [activeTab, setActiveTab] = useState<'raffles' | 'tickets' | 'home'>('raffles');
  const [raffles, setRaffles] = useState<RaffleData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado Formulario Rifa
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado Configuración Home
  const [homeConfig, setHomeConfig] = useState({ title: "", content: "" });

  // Estado Modal Lotería
  const [showLotteryModal, setShowLotteryModal] = useState(false);
  const [lotteryRaffleId, setLotteryRaffleId] = useState<string | null>(null);
  const [lotteryNumber, setLotteryNumber] = useState("");

  const [newRaffle, setNewRaffle] = useState<Partial<RaffleData>>({
    title: "", description: "", price: 0, images: [], endDate: "", status: "active"
  });

  // --- EFECTOS ---
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rafflesData, ticketsData, homeData] = await Promise.all([
        getRaffles(),
        getTickets(),
        getHomeConfig()
      ]);
      setRaffles(rafflesData);
      setTickets(ticketsData);
      setHomeConfig(homeData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIN ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // AQUÍ PUEDES CAMBIAR EL USUARIO Y CONTRASEÑA
    if (username === "admin" && password === "Elgu3r0.2025") {
      setIsAuthenticated(true);
    } else {
      alert("Credenciales incorrectas");
    }
  };

  // --- HANDLERS RIFAS ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];
      try {
        for (const file of files) {
          const url = await uploadRaffleImage(file);
          uploadedUrls.push(url);
        }
        setNewRaffle(prev => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }));
      } catch (error) { alert("Error subiendo"); } finally { setIsUploading(false); }
    }
  };

  const removeImage = (index: number) => setNewRaffle(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));

  const handleEditClick = (raffle: RaffleData) => {
    setNewRaffle(raffle);
    setEditingId(raffle.id!);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setNewRaffle({ title: "", description: "", price: 0, images: [], endDate: "", status: "active" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSaveRaffle = async () => {
    if (!newRaffle.title || !newRaffle.price || !newRaffle.images?.length) return alert("Faltan datos");
    try {
      if (editingId) { await updateRaffle(editingId, newRaffle); alert("Actualizado"); }
      else { await createRaffle(newRaffle as RaffleData); alert("Creado"); }
      handleResetForm(); loadData();
    } catch (error) { alert("Error"); }
  };

  const handleDeleteRaffle = async (id: string) => {
    if (confirm("¿Borrar?")) { await deleteRaffle(id); loadData(); }
  };

  // --- HANDLERS LOTERÍA ---
  const openLotteryModal = (id: string) => { setLotteryRaffleId(id); setLotteryNumber(""); setShowLotteryModal(true); };
  
  const confirmLotteryWinner = async () => {
    if (lotteryNumber.length !== 6) return alert("Deben ser 6 dígitos");
    setIsLoading(true);
    try {
      const result = await setLotteryWinner(lotteryRaffleId!, lotteryNumber);
      if (result) {
        alert(`¡GANADOR ENCONTRADO!\n${result.winnerName} - Boleto ${result.winningNumber}`);
        setShowLotteryModal(false);
        loadData();
      } else {
        if (confirm(`El número ${lotteryNumber} NO fue vendido.\n¿Deseas editar la fecha para posponer?`)) {
          setShowLotteryModal(false);
          const r = raffles.find(x => x.id === lotteryRaffleId);
          if (r) handleEditClick(r);
        }
      }
    } catch (error) { alert("Error"); } finally { setIsLoading(false); }
  };

  // --- HANDLERS TICKETS ---
  const handleApprove = async (id: string) => { if(confirm("¿Aprobar pago?")) { await approveTicket(id); loadData(); } };
  const handleReject = async (t: TicketData) => { if(confirm("¿Rechazar y liberar?")) { await cancelTicket(t.id!, t.raffleId, t.numbers); loadData(); } };

  // --- HANDLER HOME ---
  const handleSaveHome = async () => {
    try {
      await updateHomeConfig(homeConfig);
      alert("Información de inicio actualizada");
    } catch (error) { alert("Error guardando"); }
  };

  // --- VISTA LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
          <div className="bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-6">Acceso Admin</h2>
          <input type="text" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-2 p-3 rounded-lg mb-3 outline-none focus:border-blue-900" />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-2 p-3 rounded-lg mb-6 outline-none focus:border-blue-900" />
          <button type="submit" className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition">Entrar</button>
        </form>
      </div>
    );
  }

  const filteredTickets = tickets.filter(t => t.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) || t.buyerPhone.includes(searchTerm));

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* MODAL LOTERÍA */}
      {showLotteryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2">Ganador Lotería</h3>
            <input type="number" maxLength={6} value={lotteryNumber} onChange={e => setLotteryNumber(e.target.value.slice(0,6))} className="w-full text-center text-3xl font-mono font-black border-2 rounded-xl p-4 mb-6" placeholder="000000" />
            <div className="flex gap-2">
              <button onClick={() => setShowLotteryModal(false)} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
              <button onClick={confirmLotteryWinner} className="flex-1 py-3 bg-blue-900 text-white rounded-lg font-bold">Verificar</button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-black text-white p-4 sticky top-0 z-50 border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-bold text-xl italic text-yellow-400">PANEL ADMIN</span>
          <div className="flex bg-gray-800 p-1 rounded-lg gap-1">
            <button onClick={() => setActiveTab('raffles')} className={`px-4 py-2 rounded ${activeTab === 'raffles' ? 'bg-blue-600' : 'text-gray-400'}`}>Rifas</button>
            <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 rounded ${activeTab === 'tickets' ? 'bg-blue-600' : 'text-gray-400'}`}>Pagos</button>
            <button onClick={() => setActiveTab('home')} className={`px-4 py-2 rounded ${activeTab === 'home' ? 'bg-blue-600' : 'text-gray-400'}`}><Home size={18}/></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* PESTAÑA RIFAS */}
        {activeTab === 'raffles' && (
          <div className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-2xl font-black">Rifas</h2>
              <button onClick={() => { handleResetForm(); setShowForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><Plus size={20}/> Nueva</button>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
                <h3 className="font-bold text-lg mb-4 text-blue-900">{editingId ? "Editar" : "Nueva"} Rifa</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500">TÍTULO</label><input value={newRaffle.title} onChange={e => setNewRaffle({...newRaffle, title: e.target.value})} className="w-full border p-2 rounded" /></div>
                  <div><label className="text-xs font-bold text-gray-500">PRECIO</label><input type="number" value={newRaffle.price || ''} onChange={e => setNewRaffle({...newRaffle, price: +e.target.value})} className="w-full border p-2 rounded" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">IMÁGENES</label><input type="file" multiple onChange={handleImageSelect} className="block w-full text-sm text-gray-500"/>
                    <div className="flex gap-2 mt-2">{newRaffle.images?.map((img, i) => <div key={i} className="relative w-16 h-16"><Image src={img} alt="" fill className="object-cover rounded"/><button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1">x</button></div>)}</div>
                  </div>
                  <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">FECHA FIN</label><input type="datetime-local" value={newRaffle.endDate} onChange={e => setNewRaffle({...newRaffle, endDate: e.target.value})} className="border p-2 rounded w-full" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">DESCRIPCIÓN</label><TextEditor value={newRaffle.description || ""} onChange={val => setNewRaffle({...newRaffle, description: val})} /></div>
                </div>
                <div className="mt-4 flex justify-end gap-2"><button onClick={handleResetForm} className="px-4 text-gray-500">Cancelar</button><button onClick={handleSaveRaffle} disabled={isUploading} className="bg-blue-900 text-white px-6 py-2 rounded font-bold">{isUploading ? "..." : "Guardar"}</button></div>
              </div>
            )}

            <div className="grid gap-4">
              {raffles.map(r => (
                <div key={r.id} className={`bg-white p-4 rounded shadow flex gap-4 items-center ${r.status === 'finished' ? 'border-l-4 border-green-500' : ''}`}>
                  <div className="relative w-20 h-20 bg-gray-100 shrink-0">{r.images?.[0] && <Image src={r.images[0]} alt="" fill className="object-cover rounded"/>}</div>
                  <div className="flex-1">
                    <h3 className="font-bold">{r.title}</h3>
                    <p className="text-xs text-gray-500">${r.price} | {r.takenNumbers?.length || 0} vendidos</p>
                    {r.status === 'finished' && <p className="text-xs text-green-600 font-bold">🏆 Ganó: {r.winnerName}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {r.status === 'active' && <button onClick={() => openLotteryModal(r.id!)} className="bg-yellow-400 px-3 py-1 rounded text-xs font-bold">Ingresar Ganador</button>}
                    <div className="flex gap-2 justify-end"><button onClick={() => handleEditClick(r)} className="text-blue-600"><Edit size={20}/></button><button onClick={() => handleDeleteRaffle(r.id!)} className="text-red-600"><Trash size={20}/></button></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA TICKETS */}
        {activeTab === 'tickets' && (
          <div>
            <h2 className="text-2xl font-black mb-4">Pagos Pendientes</h2>
            <input placeholder="Buscar..." className="w-full p-3 border rounded mb-4" onChange={e => setSearchTerm(e.target.value)}/>
            {filteredTickets.map(t => (
              <div key={t.id} className={`p-4 border rounded mb-2 flex justify-between items-center ${t.status === 'reserved' ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                <div>
                  <p className="font-bold">{t.buyerName} <span className="text-xs text-gray-500">({t.buyerPhone})</span></p>
                  <p className="text-xs">Boletos: {t.numbers.join(", ")}</p>
                  <p className="font-black text-lg">${t.total}</p>
                </div>
                <div className="flex gap-2">
                  {t.status === 'reserved' ? <><button onClick={() => handleApprove(t.id!)} className="bg-green-500 text-white p-2 rounded"><Check/></button><button onClick={() => handleReject(t)} className="bg-red-500 text-white p-2 rounded"><X/></button></> : <span className="text-green-600 font-bold text-sm">PAGADO</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PESTAÑA HOME (EDITAR INICIO) */}
        {activeTab === 'home' && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-black mb-6">Editar Página de Inicio</h2>
            <div className="space-y-4">
              <div>
                <label className="font-bold text-sm text-gray-500">Título de Sección</label>
                <input value={homeConfig.title} onChange={e => setHomeConfig({...homeConfig, title: e.target.value})} className="w-full border p-3 rounded-lg"/>
              </div>
              <div>
                <label className="font-bold text-sm text-gray-500 mb-2 block">Contenido (Dinámica)</label>
                <TextEditor value={homeConfig.content} onChange={val => setHomeConfig({...homeConfig, content: val})} />
              </div>
              <button onClick={handleSaveHome} className="bg-blue-900 text-white px-8 py-3 rounded-lg font-bold w-full">Guardar Cambios</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}