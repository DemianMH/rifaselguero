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
  pickWinner, // <--- IMPORTANTE: Nueva función
  RaffleData, 
  TicketData 
} from "@/services/raffleService";
import { Plus, Edit, Trash, Check, X, MessageCircle, RefreshCw, Search, Upload, Loader2, Trophy, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function SecretAdminPanel() {
  const [activeTab, setActiveTab] = useState<'raffles' | 'tickets'>('raffles');
  const [raffles, setRaffles] = useState<RaffleData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newRaffle, setNewRaffle] = useState<Partial<RaffleData>>({
    title: "",
    description: "",
    price: 0,
    images: [],
    endDate: "",
    status: "active"
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rafflesData = await getRaffles();
      const ticketsData = await getTickets();
      setRaffles(rafflesData);
      setTickets(ticketsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      } catch (error) {
        alert("Error subiendo imágenes");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setNewRaffle(prev => ({ ...prev, images: prev.images?.filter((_, index) => index !== indexToRemove) }));
  };

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
    if (!newRaffle.title || !newRaffle.price || !newRaffle.images || newRaffle.images.length === 0) {
      return alert("Faltan datos o imágenes");
    }
    try {
      if (editingId) {
        await updateRaffle(editingId, newRaffle);
        alert("¡Rifa actualizada!");
      } else {
        await createRaffle(newRaffle as RaffleData);
        alert("¡Rifa creada!");
      }
      handleResetForm();
      loadData();
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const handleDeleteRaffle = async (id: string) => {
    if (confirm("¿Seguro que quieres borrar esta rifa?")) {
      await deleteRaffle(id);
      loadData();
    }
  };

  // --- Lógica para Finalizar Rifa ---
  const handleFinishRaffle = async (id: string) => {
    if(confirm("¿Estás seguro de finalizar la rifa ahora? El sistema elegirá un ganador aleatorio entre los boletos vendidos.")) {
      try {
        setIsLoading(true);
        const result = await pickWinner(id);
        alert(`¡GANADOR SELECCIONADO!\nNúmero: ${result.winningNumber}\nCliente: ${result.winnerName}`);
        loadData();
      } catch (error) {
        alert("Error: Asegúrate que hay boletos vendidos.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleApprove = async (ticket: TicketData) => {
    if (!ticket.id) return;
    if(confirm(`¿Confirmar pago de ${ticket.buyerName}?`)) {
      await approveTicket(ticket.id);
      loadData();
    }
  };

  const handleReject = async (ticket: TicketData) => {
    if (!ticket.id) return;
    if(confirm(`¿RECHAZAR y LIBERAR números de ${ticket.buyerName}?`)) {
      await cancelTicket(ticket.id, ticket.raffleId, ticket.numbers);
      loadData();
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.buyerPhone.includes(searchTerm)
  ).sort((a, b) => (a.status === 'reserved' ? -1 : 1));

  // Helper para saber si ya venció la fecha
  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-black text-white p-4 border-b-4 border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
             <span className="bg-white text-black font-bold px-2 py-1 rounded text-xs">ADMIN</span>
             <span className="font-bold text-xl italic tracking-tighter text-yellow-400">EL GÜERO</span>
          </div>
          <div className="flex bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setActiveTab('raffles')} className={`px-6 py-2 rounded-md font-bold transition-all ${activeTab === 'raffles' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Rifas</button>
            <button onClick={() => setActiveTab('tickets')} className={`px-6 py-2 rounded-md font-bold transition-all flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              Pagos {tickets.filter(t => t.status === 'reserved').length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{tickets.filter(t => t.status === 'reserved').length}</span>}
            </button>
          </div>
          <button onClick={loadData} className="p-2 hover:bg-gray-800 rounded-full transition"><RefreshCw size={20} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'raffles' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800 uppercase italic">Mis Rifas Activas</h2>
              <button onClick={() => { handleResetForm(); setShowForm(true); }} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg transition hover:translate-y-[-2px]"><Plus size={20} /> Crear Rifa</button>
            </div>

            {showForm && (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl border-2 border-blue-100 mb-8">
                <h3 className="font-bold text-xl mb-6 text-blue-900 pb-2 border-b">{editingId ? "Editar Rifa" : "Nueva Rifa"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input value={newRaffle.title} onChange={e => setNewRaffle({...newRaffle, title: e.target.value})} placeholder="Título" className="border-2 p-3 rounded-lg focus:border-blue-600 outline-none" />
                  <input type="number" value={newRaffle.price || ''} onChange={e => setNewRaffle({...newRaffle, price: +e.target.value})} placeholder="Precio ($)" className="border-2 p-3 rounded-lg focus:border-blue-600 outline-none" />
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-bold text-sm text-gray-600">Galería</label>
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-xl text-center relative hover:bg-gray-50 cursor-pointer">
                      <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="font-bold text-sm text-gray-400">{isUploading ? "Subiendo..." : "Click para subir imágenes"}</span>
                    </div>
                    {newRaffle.images && newRaffle.images.length > 0 && (
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {newRaffle.images.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded overflow-hidden group"><Image src={img} alt="img" fill className="object-cover" /><button onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100"><X size={10} /></button></div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Fecha Final</label><input type="datetime-local" value={newRaffle.endDate} className="w-full border-2 border-gray-200 p-3 rounded-lg outline-none" onChange={e => setNewRaffle({...newRaffle, endDate: e.target.value})} /></div>
                  <textarea value={newRaffle.description} onChange={e => setNewRaffle({...newRaffle, description: e.target.value})} placeholder="Descripción" className="w-full border-2 p-3 rounded-lg md:col-span-2 h-24 outline-none" />
                </div>
                <div className="mt-6 flex justify-end gap-3"><button onClick={handleResetForm} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button><button onClick={handleSaveRaffle} disabled={isUploading} className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">{isUploading ? "..." : (editingId ? "Actualizar" : "Publicar")}</button></div>
              </div>
            )}

            <div className="grid gap-4">
              {raffles.map(raffle => (
                <div key={raffle.id} className={`bg-white p-4 md:p-6 rounded-xl shadow-sm border flex flex-col md:flex-row items-center gap-6 transition ${raffle.status === 'finished' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="relative w-full md:w-40 h-32 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    {raffle.images && raffle.images.length > 0 ? <Image src={raffle.images[0]} alt={raffle.title} fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300 text-xs">Sin foto</div>}
                    {raffle.status === 'finished' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Trophy className="text-yellow-400 w-10 h-10" /></div>}
                  </div>
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                       <h3 className="font-black text-lg text-gray-800 uppercase">{raffle.title}</h3>
                       {raffle.status === 'active' && isExpired(raffle.endDate) && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle size={10} /> TIEMPO AGOTADO</span>}
                    </div>
                    <p className="text-gray-500 text-sm mb-2 line-clamp-1">{raffle.description}</p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm items-center">
                      <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full font-bold">${raffle.price}</span>
                      <span className="bg-green-50 text-green-800 px-3 py-1 rounded-full font-bold">{raffle.takenNumbers?.length || 0} Vendidos</span>
                      <span className="text-gray-400 font-mono text-xs">📅 {new Date(raffle.endDate).toLocaleString()}</span>
                    </div>
                    
                    {/* SECCIÓN DE GANADOR */}
                    {raffle.status === 'finished' && (
                      <div className="mt-2 p-2 bg-green-100 text-green-800 rounded-lg text-sm font-bold inline-block border border-green-200">
                        🏆 Ganador: {raffle.winnerName} (Boleto: {raffle.winnerNumber})
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* BOTÓN PARA FINALIZAR RIFA SI EL TIEMPO PASÓ O SI EL ADMIN QUIERE */}
                    {raffle.status === 'active' && (
                      <button 
                        onClick={() => handleFinishRaffle(raffle.id!)}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg text-xs shadow-md flex items-center gap-1 justify-center"
                      >
                        <Trophy size={14} /> Finalizar / Sorteo
                      </button>
                    )}
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEditClick(raffle)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit size={20}/></button>
                      <button onClick={() => handleDeleteRaffle(raffle.id!)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash size={20}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="animate-in fade-in duration-500">
             {/* ... (Misma tabla de tickets que tenías antes) ... */}
             {/* Pongo el div contenedor para mantener la estructura, usa el mismo código de tickets */}
             <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 p-4 text-center text-gray-500">
                Utiliza el buscador para gestionar los pagos pendientes.
                <div className="overflow-x-auto mt-4">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                    <tr><th className="p-4">Estado</th><th className="p-4">Cliente</th><th className="p-4">Boletos</th><th className="p-4">Total</th><th className="p-4 text-center">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTickets.map(ticket => (
                      <tr key={ticket.id} className={`hover:bg-gray-50 transition ${ticket.status === 'reserved' ? 'bg-yellow-50/30' : ''}`}>
                        <td className="p-4">{ticket.status === 'reserved' ? <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><RefreshCw size={12} className="animate-spin" /> Pendiente</span> : <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Check size={12} /> Pagado</span>}</td>
                        <td className="p-4"><p className="font-bold text-gray-900">{ticket.buyerName}</p><a href={`https://wa.me/${ticket.buyerPhone}`} target="_blank" className="text-xs text-green-600 flex items-center gap-1 hover:underline mt-1"><MessageCircle size={12} /> {ticket.buyerPhone}</a></td>
                        <td className="p-4"><div className="flex flex-wrap gap-1 max-w-[200px]">{ticket.numbers.map(n => (<span key={n} className="bg-gray-100 border border-gray-300 text-gray-700 font-mono font-bold text-xs px-2 py-0.5 rounded">{n}</span>))}</div></td>
                        <td className="p-4 font-black text-gray-800">${ticket.total}</td>
                        <td className="p-4">{ticket.status === 'reserved' && (<div className="flex justify-center gap-2"><button onClick={() => handleApprove(ticket)} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg shadow-md"><Check size={18} /></button><button onClick={() => handleReject(ticket)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-md"><X size={18} /></button></div>)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}