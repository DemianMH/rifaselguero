import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  arrayUnion,
  arrayRemove,
  increment // <--- IMPORTANTE: Agregar esto
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Interfaces Actualizadas ---
export interface RaffleData {
  id?: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  endDate: string;
  status: 'active' | 'finished';
  ticketsSold: number;
  takenNumbers: string[];
  winnerNumber?: string; // Nuevo: Para guardar quién ganó
  winnerName?: string;   // Nuevo: Nombre del ganador
}

export interface TicketData {
  id?: string;
  raffleId: string;
  buyerName: string;
  buyerPhone: string;
  numbers: string[];
  total: number;
  status: 'reserved' | 'sold';
  createdAt: any;
}

// ... (Mantén las funciones de Storage, createRaffle, updateRaffle, getRaffles, getRaffleById, deleteRaffle IGUALES) ...
// SOLO PEGO LAS QUE NECESITAN CAMBIOS O SON NUEVAS:

// --- Storage ---
export const uploadRaffleImage = async (file: File): Promise<string> => {
  try {
    const storageRef = ref(storage, `raffles/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    throw error;
  }
};

// --- CRUD Rifas ---
export const createRaffle = async (data: RaffleData) => {
  try {
    const docRef = await addDoc(collection(db, "raffles"), {
      ...data,
      createdAt: new Date(),
      ticketsSold: 0,
      takenNumbers: []
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creando:", error);
    throw error;
  }
};

export const updateRaffle = async (id: string, data: Partial<RaffleData>) => {
  try {
    const docRef = doc(db, "raffles", id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error actualizando:", error);
    throw error;
  }
};

export const getRaffles = async () => {
  try {
    const q = query(collection(db, "raffles"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RaffleData[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getRaffleById = async (id: string) => {
  try {
    const docRef = doc(db, "raffles", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as RaffleData;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const deleteRaffle = async (id: string) => {
  await deleteDoc(doc(db, "raffles", id));
};


// --- Tickets y Compra (CORREGIDO) ---

export const reserveTickets = async (
  raffleId: string, 
  buyerName: string, 
  buyerPhone: string, 
  quantity: number, 
  price: number,
  currentTakenNumbers: string[]
) => {
  try {
    const newNumbers: string[] = [];
    while (newNumbers.length < quantity) {
      const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      if (!currentTakenNumbers.includes(num) && !newNumbers.includes(num)) {
        newNumbers.push(num);
      }
    }

    const ticketRef = await addDoc(collection(db, "tickets"), {
      raffleId,
      buyerName,
      buyerPhone,
      numbers: newNumbers,
      total: quantity * price,
      status: 'reserved',
      createdAt: new Date()
    });

    const raffleRef = doc(db, "raffles", raffleId);
    
    // CORRECCIÓN 1: Usamos 'increment' para asegurar que el contador suba
    await updateDoc(raffleRef, {
      takenNumbers: arrayUnion(...newNumbers),
      ticketsSold: increment(quantity) 
    });

    return { id: ticketRef.id, numbers: newNumbers };
  } catch (error) {
    console.error("Error reservando boletos:", error);
    throw error;
  }
};

// ... (Mantén getTickets, approveTicket igual) ...
export const getTickets = async () => {
  try {
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TicketData[];
  } catch (error) {
    return [];
  }
};

export const approveTicket = async (ticketId: string) => {
  const ticketRef = doc(db, "tickets", ticketId);
  await updateDoc(ticketRef, { status: 'sold' });
};

// CORRECCIÓN 2: Restar contador al cancelar
export const cancelTicket = async (ticketId: string, raffleId: string, numbers: string[]) => {
  await deleteDoc(doc(db, "tickets", ticketId));
  const raffleRef = doc(db, "raffles", raffleId);
  await updateDoc(raffleRef, {
    takenNumbers: arrayRemove(...numbers),
    ticketsSold: increment(-numbers.length) // Restamos
  });
};

// --- NUEVO: FINALIZAR RIFA Y ELEGIR GANADOR ---
export const pickWinner = async (raffleId: string) => {
  try {
    // 1. Obtener la rifa
    const raffleRef = doc(db, "raffles", raffleId);
    const raffleSnap = await getDoc(raffleRef);
    if(!raffleSnap.exists()) throw new Error("Rifa no encontrada");
    
    const data = raffleSnap.data() as RaffleData;
    const soldNumbers = data.takenNumbers;

    if(soldNumbers.length === 0) throw new Error("No hay boletos vendidos");

    // 2. Elegir número aleatorio de los vendidos
    const randomIndex = Math.floor(Math.random() * soldNumbers.length);
    const winningNumber = soldNumbers[randomIndex];

    // 3. Buscar quién compró ese boleto
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("numbers", "array-contains", winningNumber));
    const querySnapshot = await getDocs(q);
    
    let winnerName = "Desconocido";
    if(!querySnapshot.empty) {
      winnerName = querySnapshot.docs[0].data().buyerName;
    }

    // 4. Actualizar Rifa: Poner status finished y guardar ganador
    await updateDoc(raffleRef, {
      status: 'finished',
      winnerNumber: winningNumber,
      winnerName: winnerName
    });

    return { winningNumber, winnerName };

  } catch (error) {
    console.error(error);
    throw error;
  }
};