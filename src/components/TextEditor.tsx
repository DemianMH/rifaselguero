"use client";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css'; // <--- OJO: Importación nueva

// Cargamos la versión compatible con React 19
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface TextEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function TextEditor({ value, onChange }: TextEditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  return (
    <div className="bg-white text-black">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
        className="h-64 mb-12" 
      />
    </div>
  );
}