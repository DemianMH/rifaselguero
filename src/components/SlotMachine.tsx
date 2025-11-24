"use client";
import { useState, useEffect } from "react";
import { Dices, RefreshCw } from "lucide-react";

interface SlotMachineProps {
  quantity: number;
  onGenerate: (numbers: string[]) => void;
  takenNumbers: string[];
}

export default function SlotMachine({ quantity, onGenerate, takenNumbers }: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayNumbers, setDisplayNumbers] = useState<string[]>(Array(quantity).fill("000000"));

  const generateRandom = () => {
    const nums: string[] = [];
    while (nums.length < quantity) {
      const n = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      if (!takenNumbers.includes(n) && !nums.includes(n)) nums.push(n);
    }
    return nums;
  };

  const handleSpin = () => {
    setIsSpinning(true);
    let interval = setInterval(() => {
      setDisplayNumbers(displayNumbers.map(() => Math.floor(Math.random() * 1000000).toString().padStart(6, '0')));
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      const finals = generateRandom();
      setDisplayNumbers(finals);
      setIsSpinning(false);
      onGenerate(finals);
    }, 1500);
  };

  return (
    <div className="bg-white border-2 border-red-600 rounded-2xl p-6 text-center shadow-xl">
      <h3 className="text-red-600 font-black uppercase text-xl mb-4 flex items-center justify-center gap-2">
        <Dices /> Maquinita de la Suerte
      </h3>
      
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {displayNumbers.map((num, i) => (
          <div key={i} className="bg-gray-100 border-b-4 border-gray-300 rounded-lg px-4 py-2 font-mono text-2xl font-black text-gray-800 tracking-widest">
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
      <p className="text-xs text-gray-400 mt-2">Haz click para generar tus boletos al azar</p>
    </div>
  );
}