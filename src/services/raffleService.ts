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
  description: string;
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

// --- Tickets y Compra ---
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
      finalNumbers = manualNumbers;
      const collision = finalNumbers.some(n => currentTakenNumbers.includes(n));
      if (collision) throw new Error("Uno de los números seleccionados ya fue ganado.");
    } else {
      while (finalNumbers.length < quantity) {
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

export const getMyTickets = async (phone: string) => {
  try {
    const q = query(collection(db, "tickets"), where("buyerPhone", "==", phone));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as TicketData);
  } catch (error) {
    return [];
  }
};

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

// --- NUEVO: VALIDAR GANADOR DE LOTERÍA ---
export const setLotteryWinner = async (raffleId: string, winningNumber: string) => {
  try {
    // 1. Buscar si algún ticket tiene ese número
    const ticketsRef = collection(db, "tickets");
    // Ojo: Buscamos en TODOS los tickets de esa rifa que contengan el número
    const q = query(
      ticketsRef, 
      where("raffleId", "==", raffleId),
      where("numbers", "array-contains", winningNumber)
    );
    
    const querySnapshot = await getDocs(q);

    // 2. Si NO existe venta, retornamos null (Boleto no vendido)
    if (querySnapshot.empty) {
      return null; 
    }

    // 3. Si existe, obtenemos los datos del ganador
    // (Tomamos el primero, aunque por lógica solo debería haber uno)
    const winnerTicket = querySnapshot.docs[0].data() as TicketData;
    const winnerName = winnerTicket.buyerName;

    // 4. Finalizamos la rifa
    const raffleRef = doc(db, "raffles", raffleId);
    await updateDoc(raffleRef, {
      status: 'finished',
      winnerNumber: winningNumber,
      winnerName: winnerName
    });

    return { winningNumber, winnerName };

  } catch (error) {
    console.error("Error validando ganador:", error);
    throw error;
  }
};