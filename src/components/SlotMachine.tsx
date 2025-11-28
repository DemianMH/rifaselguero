"use client";
import { useState, useEffect } from "react";
import { Dices, RefreshCw } from "lucide-react";

interface SlotMachineProps {
  quantity: number;
  digitCount: number;
  onGenerate: (numbers: string[]) => void;
  takenNumbers: string[];
}

export default function SlotMachine({ quantity, digitCount, onGenerate, takenNumbers }: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayNumbers, setDisplayNumbers] = useState<string[]>([]);

  // ESTE EFFECT ES EL QUE ARREGLA EL PROBLEMA VISUAL
  // Cada vez que cambia 'quantity', reseteamos los cuadros.
  useEffect(() => {
    setDisplayNumbers(Array(quantity).fill("0".repeat(digitCount)));
  }, [quantity, digitCount]);

  const generateRandom = () => {
    const nums: string[] = [];
    const limit = Math.pow(10, digitCount);
    // Límite de seguridad para evitar bucles infinitos si está casi lleno
    let attempts = 0;
    while (nums.length < quantity && attempts < 1000) {
      const n = Math.floor(Math.random() * limit).toString().padStart(digitCount, '0');
      if (!takenNumbers.includes(n) && !nums.includes(n)) nums.push(n);
      attempts++;
    }
    return nums;
  };

  const handleSpin = () => {
    setIsSpinning(true);
    const limit = Math.pow(10, digitCount);
    
    // Animación visual
    const interval = setInterval(() => {
      setDisplayNumbers(Array(quantity).fill("").map(() => 
        Math.floor(Math.random() * limit).toString().padStart(digitCount, '0')
      ));
    }, 50);

    // Detener animación y mostrar números reales
    setTimeout(() => {
      clearInterval(interval);
      const finals = generateRandom();
      setDisplayNumbers(finals);
      setIsSpinning(false);
      onGenerate(finals); // Pasamos los números al padre
    }, 1500);
  };

  return (
    <div className="bg-white border-2 border-red-600 rounded-2xl p-6 text-center shadow-xl">
      <h3 className="text-red-600 font-black uppercase text-xl mb-4 flex items-center justify-center gap-2">
        <Dices /> Maquinita de la Suerte
      </h3>
      
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {displayNumbers.map((num, i) => (
          <div key={i} className="bg-gray-100 border-b-4 border-gray-300 rounded-lg px-4 py-2 font-mono text-xl font-black text-gray-800 tracking-widest animate-in zoom-in duration-300">
            {num}
          </div>
        ))}
      </div>

      <button 
        onClick={handleSpin}
        disabled={isSpinning}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
      >
        {isSpinning ? <RefreshCw className="animate-spin" /> : "¡GIRAR MAQUINITA!"}
      </button>
      <p className="text-xs text-gray-400 mt-2">Genera {quantity} boletos de {digitCount} cifras al azar</p>
    </div>
  );
}