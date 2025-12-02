import { db, storage } from "@/lib/firebase";
import { 
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, 
  query, orderBy, where, arrayUnion, arrayRemove, increment 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface Promotion { buy: number; get: number; }

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
  digitCount: number;
  promotions: Promotion[];
  imageFit: 'cover' | 'contain';
  highVolumeBuyersCount?: number;
}

export interface TicketData {
  id?: string;
  raffleId: string;
  buyerName: string;
  buyerPhone: string;
  buyerState: string;
  numbers: string[];
  paidCount: number;
  total: number;
  status: 'reserved' | 'sold';
  createdAt: any;
}

export interface HomeSection {
  id: string;
  type: 'html' | 'calendar' | 'faq';
  content?: string;
  data?: any;
  order: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PaymentMethod {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions?: string;
}

export interface GlobalSettings {
  backgroundColor: string;
  backgroundImage?: string;
  whatsapp: string;
  terms: string;
  paymentMethods: PaymentMethod[];
  contactInfo: string;
  faqs: FAQItem[];
  maintenanceMode: boolean;
}

export const uploadImage = async (file: File, path: string = 'raffles'): Promise<string> => {
  try {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) { throw error; }
};

export const getGlobalSettings = async (): Promise<GlobalSettings> => {
  try {
    const docRef = doc(db, "settings", "global");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let safePaymentMethods: PaymentMethod[] = [];
      if (Array.isArray(data.paymentMethods)) {
        safePaymentMethods = data.paymentMethods;
      }
      return { ...data, paymentMethods: safePaymentMethods } as GlobalSettings;
    }
    return { 
      backgroundColor: "#f3f4f6", whatsapp: "3326269409", terms: "", paymentMethods: [], contactInfo: "", faqs: [], maintenanceMode: false 
    };
  } catch (error) { 
    return { 
      backgroundColor: "#f3f4f6", whatsapp: "3326269409", terms: "", paymentMethods: [], contactInfo: "", faqs: [], maintenanceMode: false 
    }; 
  }
};

export const updateGlobalSettings = async (data: GlobalSettings) => {
  await setDoc(doc(db, "settings", "global"), data);
};

export const getHomeSections = async (): Promise<HomeSection[]> => {
  try {
    const docRef = doc(db, "settings", "home_sections");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return (docSnap.data().sections as HomeSection[]).sort((a, b) => a.order - b.order);
    return [];
  } catch (error) { return []; }
};

export const updateHomeSections = async (sections: HomeSection[]) => {
  await setDoc(doc(db, "settings", "home_sections"), { sections });
};

export const createRaffle = async (data: RaffleData) => { const docRef = await addDoc(collection(db, "raffles"), { ...data, createdAt: new Date(), ticketsSold: 0, takenNumbers: [], highVolumeBuyersCount: 0 }); return docRef.id; };
export const updateRaffle = async (id: string, data: Partial<RaffleData>) => { const docRef = doc(db, "raffles", id); await updateDoc(docRef, data); };
export const getRaffles = async () => { const q = query(collection(db, "raffles"), orderBy("createdAt", "desc")); const snap = await getDocs(q); return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RaffleData[]; };
export const getRaffleById = async (id: string) => { const docRef = doc(db, "raffles", id); const snap = await getDoc(docRef); return snap.exists() ? { id: snap.id, ...snap.data() } as RaffleData : null; };
export const deleteRaffle = async (id: string) => { await deleteDoc(doc(db, "raffles", id)); };
export const getTickets = async () => { const q = query(collection(db, "tickets"), orderBy("createdAt", "desc")); const snap = await getDocs(q); return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TicketData[]; };
export const approveTicket = async (id: string) => updateDoc(doc(db, "tickets", id), { status: 'sold' });
export const cancelTicket = async (id: string, rId: string, nums: string[]) => { await deleteDoc(doc(db, "tickets", id)); await updateDoc(doc(db, "raffles", rId), { takenNumbers: arrayRemove(...nums), ticketsSold: increment(-nums.length) }); };
export const setLotteryWinner = async (raffleId: string, winningNumber: string) => { const q = query(collection(db, "tickets"), where("raffleId", "==", raffleId), where("numbers", "array-contains", winningNumber)); const snap = await getDocs(q); if (snap.empty) return null; const winner = snap.docs[0].data() as TicketData; await updateDoc(doc(db, "raffles", raffleId), { status: 'finished', winnerNumber: winningNumber, winnerName: winner.buyerName }); return { winningNumber, winnerName: winner.buyerName }; };
export const pickWinner = async () => { return null; };
export const uploadRaffleImage = uploadImage;

export const reserveTickets = async (
  raffleId: string, 
  buyerName: string, 
  buyerPhone: string, 
  buyerState: string,
  quantityPaid: number, 
  price: number, 
  currentTakenNumbers: string[], 
  digitCount: number, 
  manualNumbers?: string[], 
  promotions?: Promotion[]
) => {
  let finalNumbers: string[] = manualNumbers ? [...manualNumbers] : [];
  
  // Generar números pagados si no son manuales
  if (!manualNumbers || manualNumbers.length === 0) {
    const limit = Math.pow(10, digitCount);
    while (finalNumbers.length < quantityPaid) {
      const num = Math.floor(Math.random() * limit).toString().padStart(digitCount, '0');
      if (!currentTakenNumbers.includes(num) && !finalNumbers.includes(num)) {
        finalNumbers.push(num);
      }
    }
  }

  // Lógica de Promoción (+10 de regalo a los primeros 50 que compren >=10)
  const raffleRef = doc(db, "raffles", raffleId);
  const raffleSnap = await getDoc(raffleRef);
  
  if (raffleSnap.exists()) {
    const raffleData = raffleSnap.data() as RaffleData;
    const currentPromoCount = raffleData.highVolumeBuyersCount || 0;

    if (quantityPaid >= 10 && currentPromoCount < 50) {
      let bonusTickets: string[] = [];
      const limit = Math.pow(10, digitCount);
      const allBusy = [...currentTakenNumbers, ...finalNumbers];
      
      let attempts = 0;
      while (bonusTickets.length < 10 && attempts < 500) {
         const num = Math.floor(Math.random() * limit).toString().padStart(digitCount, '0'); 
         if (!allBusy.includes(num) && !bonusTickets.includes(num)) { 
           bonusTickets.push(num); 
         }
         attempts++;
      }
      finalNumbers = [...finalNumbers, ...bonusTickets];
      await updateDoc(raffleRef, { highVolumeBuyersCount: increment(1) });
    }
  }

  const ticketRef = await addDoc(collection(db, "tickets"), { 
    raffleId, 
    buyerName, 
    buyerPhone, 
    buyerState,
    numbers: finalNumbers, 
    paidCount: quantityPaid, 
    total: quantityPaid * price, 
    status: 'reserved', 
    createdAt: new Date() 
  });

  await updateDoc(raffleRef, { 
    takenNumbers: arrayUnion(...finalNumbers), 
    ticketsSold: increment(finalNumbers.length) 
  });

  // Retornamos el desglose exacto
  return { 
    id: ticketRef.id, 
    numbers: finalNumbers, 
    total: quantityPaid * price,
    paidCount: quantityPaid,
    bonusCount: finalNumbers.length - quantityPaid
  };
};

export const getMyTickets = async (phone: string) => { const q = query(collection(db, "tickets"), where("buyerPhone", "==", phone)); const snap = await getDocs(q); return snap.docs.map(doc => doc.data() as TicketData); };