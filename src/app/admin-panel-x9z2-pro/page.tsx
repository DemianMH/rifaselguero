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
  pickWinner, 
  RaffleData, 
  TicketData 
} from "@/services/raffleService";
import { Plus, Edit, Trash, Check, X, MessageCircle, RefreshCw, Search, Upload, Loader2, Trophy, AlertTriangle } from "lucide-react";
import Image from "next/image";
import TextEditor from "@/components/TextEditor"; 

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

  useEffect(() => { loadData(); }, []);

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
    if (confirm("¿Borrar rifa?")) {
      await deleteRaffle(id);
      loadData();
    }
  };

  const handleFinishRaffle = async (id: string) => {
    if(confirm("¿Finalizar rifa?")) {
      try {
        setIsLoading(true);
        const result = await pickWinner(id);
        alert(`¡GANADOR: ${result.winnerName} (${result.winningNumber})!`);
        loadData();
      } catch (error) {
        alert("Error: Revisa que haya vendidos.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleApprove = async (ticket: TicketData) => {
    if (!ticket.id) return;
    if(confirm("¿Aprobar pago?")) {
      await approveTicket(ticket.id);
      loadData();
    }
  };

  const handleReject = async (ticket: TicketData) => {
    if (!ticket.id) return;
    if(confirm("¿Rechazar y liberar números?")) {
      await cancelTicket(ticket.id, ticket.raffleId, ticket.numbers);
      loadData();
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.buyerPhone.includes(searchTerm)
  ).sort((a, b) => (a.status === 'reserved' ? -1 : 1));

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-black text-white p-4 border-b-4 border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-bold text-xl italic text-yellow-400">ADMIN EL GÜERO</span>
          <div className="flex bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setActiveTab('raffles')} className={`px-4 py-2 rounded ${activeTab === 'raffles' ? 'bg-blue-600' : 'text-gray-400'}`}>Rifas</button>
            <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 rounded ${activeTab === 'tickets' ? 'bg-blue-600' : 'text-gray-400'}`}>Pagos</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'raffles' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">Rifas Activas</h2>
              <button onClick={() => { handleResetForm(); setShowForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><Plus size={20} /> Nueva</button>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-blue-900">{editingId ? "Editar" : "Nueva"} Rifa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* CAMBIO: AHORA TIENEN ETIQUETAS VISIBLES */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Título del Premio</label>
                    <input 
                      value={newRaffle.title} 
                      onChange={e => setNewRaffle({...newRaffle, title: e.target.value})} 
                      placeholder="Ej. Aveo 2025" 
                      className="w-full border p-2 rounded" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Precio del Boleto</label>
                    <input 
                      type="number" 
                      value={newRaffle.price || ''} 
                      onChange={e => setNewRaffle({...newRaffle, price: +e.target.value})} 
                      placeholder="Ej. 150" 
                      className="w-full border p-2 rounded" 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Galería de Imágenes</label>
                    <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    {newRaffle.images && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {newRaffle.images.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16 shrink-0"><Image src={img} alt="preview" fill className="object-cover rounded" /><button onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1 rounded">x</button></div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Fecha y Hora de Finalización</label>
                    <input type="datetime-local" value={newRaffle.endDate} className="border p-2 rounded w-full" onChange={e => setNewRaffle({...newRaffle, endDate: e.target.value})} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Descripción (Editor)</label>
                    <TextEditor value={newRaffle.description || ""} onChange={(val) => setNewRaffle({...newRaffle, description: val})} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={handleResetForm} className="px-4 py-2 text-gray-500">Cancelar</button>
                  <button onClick={handleSaveRaffle} disabled={isUploading} className="bg-blue-900 text-white px-6 py-2 rounded font-bold">{isUploading ? "..." : "Guardar"}</button>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {raffles.map(raffle => (
                <div key={raffle.id} className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-24 h-24 relative bg-gray-100 rounded shrink-0">
                    {raffle.images?.[0] && <Image src={raffle.images[0]} alt="img" fill className="object-cover rounded" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{raffle.title}</h3>
                    <div className="text-sm text-gray-500 line-clamp-1" dangerouslySetInnerHTML={{__html: raffle.description}} />
                    <p className="text-xs font-bold text-blue-600 mt-1">${raffle.price} | {raffle.takenNumbers?.length || 0} vendidos</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {raffle.status === 'active' && <button onClick={() => handleFinishRaffle(raffle.id!)} className="bg-yellow-400 px-3 py-1 rounded text-xs font-bold">Finalizar</button>}
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(raffle)} className="p-2 bg-blue-50 text-blue-600 rounded"><Edit size={16}/></button>
                      <button onClick={() => handleDeleteRaffle(raffle.id!)} className="p-2 bg-red-50 text-red-600 rounded"><Trash size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
             <h2 className="text-2xl font-black text-gray-800 mb-4">Pagos Pendientes</h2>
             <input placeholder="Buscar por nombre o teléfono..." className="w-full p-3 border rounded mb-4" onChange={(e) => setSearchTerm(e.target.value)} />
             <div className="space-y-2">
               {filteredTickets.map(ticket => (
                 <div key={ticket.id} className={`p-4 rounded border flex justify-between items-center ${ticket.status === 'reserved' ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                    <div>
                      <p className="font-bold">{ticket.buyerName} <span className="text-xs font-normal text-gray-500">({ticket.buyerPhone})</span></p>
                      <p className="text-xs text-gray-600">Boletos: {ticket.numbers.join(", ")}</p>
                      <p className="font-black text-lg">${ticket.total}</p>
                    </div>
                    <div className="flex gap-2">
                      {ticket.status === 'reserved' ? (
                        <>
                          <button onClick={() => handleApprove(ticket)} className="bg-green-500 text-white p-2 rounded"><Check size={20}/></button>
                          <button onClick={() => handleReject(ticket)} className="bg-red-500 text-white p-2 rounded"><X size={20}/></button>
                        </>
                      ) : <span className="text-green-600 font-bold text-sm">PAGADO</span>}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}