"use client";
import { useState } from 'react';
import { Editor, EditorProvider, Toolbar, BtnBold, BtnItalic, BtnUnderline, BtnBulletList, BtnNumberedList, BtnLink, BtnClearFormatting, BtnRedo, BtnUndo } from 'react-simple-wysiwyg';
import { Code, Eye } from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function TextEditor({ value, onChange, placeholder }: TextEditorProps) {
  const [showHtml, setShowHtml] = useState(false);

  // Aseguramos que value no sea undefined para evitar errores
  const safeValue = value || "";

  return (
    <div className="bg-white text-black rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
      {/* Barra Superior con Toggle */}
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase ml-2">
          {showHtml ? "Editando Código HTML" : "Editor Visual"}
        </span>
        <button 
          onClick={() => setShowHtml(!showHtml)}
          className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition ${showHtml ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          {showHtml ? <><Eye size={14}/> Ver Visual</> : <><Code size={14}/> Ver HTML</>}
        </button>
      </div>
      
      {/* Área de Edición */}
      {showHtml ? (
        <textarea 
          className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-green-400 focus:outline-none resize-none"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe tu código HTML aquí..."
        />
      ) : (
        <div className="h-64 overflow-y-auto">
           <EditorProvider>
            <Editor 
              value={safeValue} 
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "Escribe aquí..."}
              containerProps={{ style: { height: '100%', minHeight: '100%' } }}
            >
              <Toolbar>
                <BtnBold />
                <BtnItalic />
                <BtnUnderline />
                <BtnBulletList />
                <BtnNumberedList />
                <BtnLink />
                <BtnClearFormatting />
                <BtnUndo />
                <BtnRedo />
              </Toolbar>
            </Editor>
          </EditorProvider>
        </div>
      )}
    </div>
  );
}