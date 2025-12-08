"use client";
import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { getRaffles, getHomeSections, getGlobalSettings, RaffleData, HomeSection, GlobalSettings } from "@/services/raffleService";
import { Timer, Flag, MessageCircle, HelpCircle, Calendar, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import TicketVerifier from "@/components/TicketVerifier";
import EventCalendar from "@/components/EventCalendar"; 

const FAQAccordionItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full text-left py-4 md:py-6 flex justify-between items-center focus:outline-none group"
      >
        <h4 className={`text-lg md:text-xl font-bold transition-colors ${isOpen ? 'text-blue-900' : 'text-gray-700 group-hover:text-blue-600'}`}>
          {question}
        </h4>
        <div className={`p-1 md:p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50'}`}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-4 md:pb-8' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-base md:text-lg text-gray-600 leading-relaxed pl-2 border-l-4 border-yellow-400">
          {answer}
        </p>
      </div>
    </div>
  );
};

const BankCard = ({ bank, name, number }: { bank: string, name: string, number: string }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between h-full">
      <div>
        <p className="font-black text-blue-900 uppercase text-sm mb-1">{bank}</p>
        <p className="text-xs text-gray-500 mb-2">{name}</p>
      </div>
      <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-300">
        <span className="font-mono font-bold text-gray-800 text-sm md:text-base flex-1 truncate">{number}</span>
        <button onClick={copyToClipboard} className="text-gray-500 hover:text-blue-600">
          {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
        </button>
      </div>
    </div>
  );
};

function HomeContent() {
  const [raffles, setRaffles] = useState<RaffleData[]>([]);
  const [featuredRaffle, setFeaturedRaffle] = useState<RaffleData | null>(null);
  const [sections, setSections] = useState<HomeSection[]>([]);
  
  const [settings, setSettings] = useState<GlobalSettings>({ 
    backgroundColor: "#f3f4f6", 
    whatsapp: "3326269409", 
    terms: "", 
    paymentMethods: [], 
    contactInfo: "", 
    faqs: [],
    maintenanceMode: false
  });
  
  const [bgStyle, setBgStyle] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r, s, g] = await Promise.all([getRaffles(), getHomeSections(), getGlobalSettings()]);
        setRaffles(r);
        setSections(s);
        setSettings(g);
        
        setBgStyle({ 
          backgroundColor: g.backgroundColor, 
          backgroundImage: g.backgroundImage ? `url(${g.backgroundImage})` : 'none', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed' 
        });
        
        const active = r.filter(x => x.status === 'active');
        if(active.length > 0) setFeaturedRaffle(active[0]);
      } catch (error) {
        console.error("Error cargando datos del home:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={bgStyle}>
      <Navbar />
      
      <section className="relative h-[50vh] md:h-[60vh] bg-black overflow-hidden flex-shrink-0">
        {featuredRaffle?.images?.[0] && <Image src={featuredRaffle.images[0]} alt="" fill className="object-cover opacity-50" priority />}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white text-center px-4">
          <h1 className="text-4xl md:text-7xl font-black italic uppercase mb-4 md:mb-6 drop-shadow-lg animate-in slide-in-from-bottom-10 duration-700 leading-tight">
            {featuredRaffle?.title || "RIFAS EL GÜERO"}
          </h1>
          {featuredRaffle && <Link href={`/rifa/${featuredRaffle.id}`} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 md:px-10 md:py-4 rounded-full font-bold text-sm md:text-xl shadow-2xl hover:scale-110 transition duration-300 animate-pulse">¡COMPRAR BOLETOS!</Link>}
        </div>
      </section>

      <div className="flex-grow max-w-6xl w-full mx-auto py-6 md:py-10 px-4 space-y-10 md:space-y-16">
        
        <div className="mt-4 md:mt-8 relative z-20 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-white">
          <TicketVerifier />
        </div>

        <div className="bg-white/90 backdrop-blur p-6 md:p-8 rounded-3xl shadow-xl border border-white/50">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <Flag className="text-red-600 w-6 h-6 md:w-8 md:h-8" />
            <h2 className="text-xl md:text-3xl font-black uppercase italic text-blue-900">Sorteos Disponibles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {raffles.map(r => (
              <Link key={r.id} href={r.status==='active' ? `/rifa/${r.id}` : '/ganadores'} className="block group h-full">
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col border border-gray-100">
                  <div className="relative h-48 md:h-56 bg-white border-b border-gray-100">
                    <Image src={r.images[0]||""} alt="" fill className="object-contain p-2"/>
                    {r.status==='active' && <div className="absolute top-3 right-3 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"><Timer size={12}/> EN CURSO</div>}
                  </div>
                  <div className="p-4 md:p-6 flex flex-col flex-1">
                    <h3 className="font-black text-lg md:text-xl uppercase line-clamp-1 mb-2 text-gray-800 group-hover:text-blue-600 transition">{r.title}</h3>
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <p>Boletos vendidos: <span className="font-bold text-black">{r.ticketsSold}</span></p>
                      <p>Disponibles: <span className="font-bold text-green-600">{Math.pow(10, r.digitCount) - r.ticketsSold}</span></p>
                    </div>
                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-2xl md:text-3xl font-black text-red-600">${r.price}</span>
                      <span className="bg-blue-900 text-white px-4 py-1 md:px-6 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow hover:bg-blue-800 transition">VER</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {sections.map((sec) => (
          <div key={sec.id} className="bg-white/90 backdrop-blur p-6 md:p-10 rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            {sec.type === 'html' && <div className="prose max-w-none text-gray-700 overflow-x-auto" dangerouslySetInnerHTML={{__html: sec.content || ""}} />}
            {sec.type === 'calendar' && (
              <div className="flex flex-col items-center w-full">
                <h3 className="text-2xl md:text-3xl font-black text-blue-900 mb-6 flex items-center gap-3 text-center"><Calendar className="text-red-500" size={28}/> Calendario</h3>
                <div className="w-full max-w-sm">
                  <EventCalendar dates={sec.data?.dates || []} />
                </div>
              </div>
            )}
            {sec.type === 'faq' && (
              <div id="preguntas-frecuentes">
                <h3 className="text-2xl md:text-3xl font-black text-blue-900 mb-8 flex items-center gap-3 justify-center"><HelpCircle className="text-yellow-500" size={28}/> Preguntas Frecuentes</h3>
                {settings.faqs && settings.faqs.length > 0 ? (
                  <div className="bg-white p-2 md:p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="divide-y divide-gray-100">
                      {settings.faqs.map((faq, i) => (
                        <FAQAccordionItem key={i} question={faq.question} answer={faq.answer} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-400 italic">No hay preguntas frecuentes configuradas en este momento.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div id="metodos-pago" className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 scroll-mt-28 overflow-hidden h-full">
            <h3 className="text-xl md:text-2xl font-black text-blue-900 mb-4 uppercase">Métodos de Pago</h3>
            
            {Array.isArray(settings.paymentMethods) && settings.paymentMethods.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {settings.paymentMethods.map((pm, i) => (
                     <BankCard key={i} bank={pm.bankName} name={pm.accountName} number={pm.accountNumber}/>
                  ))}
               </div>
            ) : (
              <p className="text-gray-500">No hay métodos de pago registrados.</p>
            )}
          </div>

          {settings?.contactInfo && (
            <div id="contacto" className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 scroll-mt-28 overflow-hidden h-full">
              <h3 className="text-xl md:text-2xl font-black text-blue-900 mb-4 uppercase">Contacto</h3>
              <div className="prose text-sm md:text-base text-gray-600 max-w-full overflow-x-auto" dangerouslySetInnerHTML={{__html: settings.contactInfo}} />
            </div>
          )}
        </div>

        {settings?.terms && (
          <div id="terminos" className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-200 text-xs md:text-sm text-gray-500 scroll-mt-28 overflow-hidden">
            <h3 className="font-bold text-gray-700 mb-2 uppercase">Términos y Condiciones</h3>
            <div className="prose max-w-none overflow-x-auto" dangerouslySetInnerHTML={{__html: settings.terms}} />
          </div>
        )}

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 md:p-10 text-center text-white shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl md:text-5xl font-black italic uppercase mb-4 relative z-10">¿Listo para ganar?</h2>
          <a href={`https://wa.me/52${settings?.whatsapp}`} target="_blank" className="inline-flex items-center gap-3 bg-white text-green-600 px-6 py-3 md:px-8 md:py-4 rounded-full font-black text-lg md:text-xl shadow-lg hover:bg-gray-100 transition animate-bounce relative z-10">
            <MessageCircle size={24} /> Mándanos WhatsApp
          </a>
        </div>
      </div>
      
      <footer className="bg-black text-center py-6 text-xs text-gray-600 mt-auto px-4">
        <div className="flex flex-wrap justify-center gap-4 mb-4 text-gray-400 font-bold">
          <button onClick={() => document.getElementById('terminos')?.scrollIntoView({behavior:'smooth'})}>Términos</button>
          <button onClick={() => document.getElementById('contacto')?.scrollIntoView({behavior:'smooth'})}>Contacto</button>
          <button onClick={() => document.getElementById('metodos-pago')?.scrollIntoView({behavior:'smooth'})}>Pagos</button>
        </div>
        © 2025 Rifas El Güero. Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default function Home() { 
  return (
    <main>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div>}>
        <HomeContent />
      </Suspense>
    </main>
  ); 
}