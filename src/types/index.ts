export interface Ticket {
  number: string;
  isSold:boolean;
  ownerName?: string;
  ownerPhone?: string;
  status: 'available' | 'reserved' | 'sold';
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  pricePerTicket: number;
  totalTickets: number;
  endDate: string;
  status: 'active' | 'finished';
  winner?: string;
  tickets: Ticket[];
}