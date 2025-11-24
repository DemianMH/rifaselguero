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
  increment 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface RaffleData {
  id?: string;
  title: string;
  description: string; // Guardará HTML del editor
  price: number;
  images: string[];
  endDate: string;
  status: 'active' | 'finished';
  ticketsSold: number;
  takenNumbers: string[];
  winnerNumber?: string;
  winnerName?: string;
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

// --- Tickets y Compra (6 DÍGITOS) ---

export const reserveTickets = async (
  raffleId: string, 
  buyerName: string, 
  buyerPhone: string, 
  quantity: number, 
  price: number,
  currentTakenNumbers: string[],
  manualNumbers?: string[] 
) => {
  try {
    let finalNumbers: string[] = [];

    if (manualNumbers && manualNumbers.length > 0) {
      // Opción A: Números manuales
      finalNumbers = manualNumbers;
      const collision = finalNumbers.some(n => currentTakenNumbers.includes(n));
      if (collision) throw new Error("Uno de los números seleccionados ya fue ganado.");
    } else {
      // Opción B: Máquina Aleatoria (6 DÍGITOS)
      while (finalNumbers.length < quantity) {
        // 0 a 999999 -> padStart(6, '0') -> "000123"
        const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        if (!currentTakenNumbers.includes(num) && !finalNumbers.includes(num)) {
          finalNumbers.push(num);
        }
      }
    }

    const ticketRef = await addDoc(collection(db, "tickets"), {
      raffleId,
      buyerName,
      buyerPhone,
      numbers: finalNumbers,
      total: finalNumbers.length * price,
      status: 'reserved',
      createdAt: new Date()
    });

    const raffleRef = doc(db, "raffles", raffleId);
    
    await updateDoc(raffleRef, {
      takenNumbers: arrayUnion(...finalNumbers),
      ticketsSold: increment(finalNumbers.length) 
    });

    return { id: ticketRef.id, numbers: finalNumbers };
  } catch (error) {
    console.error("Error reservando:", error);
    throw error;
  }
};

// --- Verificador de Boletos (Por teléfono) ---
export const getMyTickets = async (phone: string) => {
  try {
    // Buscamos tickets que coincidan con el teléfono
    const q = query(collection(db, "tickets"), where("buyerPhone", "==", phone));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as TicketData);
  } catch (error) {
    return [];
  }
};

// ... Admin functions ...
export const getTickets = async () => {
  try {
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TicketData[];
  } catch (error) { return []; }
};

export const approveTicket = async (ticketId: string) => {
  const ticketRef = doc(db, "tickets", ticketId);
  await updateDoc(ticketRef, { status: 'sold' });
};

export const cancelTicket = async (ticketId: string, raffleId: string, numbers: string[]) => {
  await deleteDoc(doc(db, "tickets", ticketId));
  const raffleRef = doc(db, "raffles", raffleId);
  await updateDoc(raffleRef, {
    takenNumbers: arrayRemove(...numbers),
    ticketsSold: increment(-numbers.length)
  });
};

export const pickWinner = async (raffleId: string) => {
  try {
    const raffleRef = doc(db, "raffles", raffleId);
    const raffleSnap = await getDoc(raffleRef);
    if(!raffleSnap.exists()) throw new Error("Rifa no encontrada");
    const data = raffleSnap.data() as RaffleData;
    const soldNumbers = data.takenNumbers;
    if(soldNumbers.length === 0) throw new Error("No hay boletos vendidos");
    const randomIndex = Math.floor(Math.random() * soldNumbers.length);
    const winningNumber = soldNumbers[randomIndex];
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("numbers", "array-contains", winningNumber));
    const querySnapshot = await getDocs(q);
    let winnerName = "Desconocido";
    if(!querySnapshot.empty) {
      winnerName = querySnapshot.docs[0].data().buyerName;
    }
    await updateDoc(raffleRef, {
      status: 'finished',
      winnerNumber: winningNumber,
      winnerName: winnerName
    });
    return { winningNumber, winnerName };
  } catch (error) { throw error; }
};