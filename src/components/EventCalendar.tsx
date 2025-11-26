"use client";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface EventCalendarProps {
  dates: string[];
}

export default function EventCalendar({ dates }: EventCalendarProps) {
  
  // Función corregida para comparar fechas sin errores de zona horaria
  const hasEvent = (date: Date) => {
    // Convertimos la fecha del calendario a formato YYYY-MM-DD local
    const dateStr = date.toLocaleDateString('en-CA'); // 'en-CA' siempre devuelve YYYY-MM-DD
    return dates.includes(dateStr);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <style jsx global>{`
        .react-calendar { 
          border: none !important; 
          border-radius: 1rem; 
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          width: 100% !important;
          max-width: 400px;
          font-family: inherit;
          background: white;
          padding: 1.5rem;
        }
        
        .react-calendar__navigation button {
          font-weight: 900;
          font-size: 1.1rem;
          color: #1e3a8a;
        }

        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 0.7rem;
          font-weight: 800;
          color: #9ca3af;
          margin-bottom: 10px;
        }

        /* Estilo base de cada día */
        .react-calendar__tile {
          height: 45px; /* Altura fija para alineación */
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          position: relative;
          padding-top: 6px !important;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* Día seleccionado (Azul) */
        .react-calendar__tile--active {
          background: #0f2c90 !important;
          color: white !important;
        }

        /* Día de hoy (Gris claro) */
        .react-calendar__tile--now {
          background: #f3f4f6;
          color: black;
        }

        /* Hover */
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #e5e7eb;
        }

        /* EL PUNTITO ROJO */
        .event-dot {
          height: 6px;
          width: 6px;
          background-color: #dc2626; /* Rojo intenso */
          border-radius: 50%;
          margin-top: 4px;
          box-shadow: 0 0 4px rgba(220, 38, 38, 0.5);
        }

        /* Si el día está seleccionado, el puntito se vuelve amarillo para resaltar */
        .react-calendar__tile--active .event-dot {
          background-color: #facc15;
        }
      `}</style>
      
      <Calendar 
        // Usamos tileContent para inyectar el DIV del puntito visualmente
        tileContent={({ date, view }) => 
          view === 'month' && hasEvent(date) ? (
            <div className="event-dot animate-in zoom-in duration-300"/> 
          ) : null
        }
      />
      
      <div className="mt-6 flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full shadow-sm border border-gray-100">
        <div className="w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fechas de Sorteo</p>
      </div>
    </div>
  );
}