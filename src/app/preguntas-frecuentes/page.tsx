import Navbar from "@/components/Navbar";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-blue-900 mb-8 uppercase italic text-center">Preguntas Frecuentes</h1>
        <div className="space-y-4">
          {[
            {q: "¿Cómo compro mis boletos?", a: "1. Elige tu sorteo. 2. Selecciona tus números (Manual o Maquinita). 3. Llena tus datos. 4. Envía tu comprobante por WhatsApp."},
            {q: "¿Cómo sé si gané?", a: "Los ganadores se eligen en base a los últimos 6 dígitos del Premio Mayor de la Lotería Nacional."},
            {q: "¿Qué pasa si el boleto ganador no se vendió?", a: "Se reprograma el sorteo para una fecha cercana. ¡Tu boleto sigue participando!"},
            {q: "¿Es seguro?", a: "Totalmente. Nos basamos en sorteos oficiales para garantizar transparencia total."},
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{item.q}</h3>
              <p className="text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}