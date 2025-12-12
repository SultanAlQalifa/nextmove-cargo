import React, { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Type,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import DOMPurify from "dompurify";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichEditor({
  value,
  onChange,
  placeholder,
  className = "",
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isLocked = useRef(false);

  useEffect(() => {
    // Initial sync or specific external updates (careful not to loop)
    if (
      editorRef.current &&
      value !== editorRef.current.innerHTML &&
      !isLocked.current
    ) {
      editorRef.current.innerHTML = DOMPurify.sanitize(value);
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isLocked.current = true;
      onChange(editorRef.current.innerHTML);
      isLocked.current = false;
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const ToolbarButton = ({
    icon: Icon,
    command,
    arg,
    title,
    active = false,
  }: any) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        exec(command, arg);
      }}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 ${active ? "bg-gray-200 dark:bg-gray-600" : ""}`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const [inputMode, setInputMode] = React.useState<{ type: 'link' | 'image', value: string } | null>(null);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode && inputMode.value) {
      if (inputMode.type === 'link') exec("createLink", inputMode.value);
      if (inputMode.type === 'image') exec("insertImage", inputMode.value);
    }
    setInputMode(null);
  };

  return (
    <div
      className={`flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 relative ${className}`}
    >
      {/* Input Overlay */}
      {inputMode && (
        <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 animate-in slide-in-from-top-2">
          <input
            type="text"
            value={inputMode.value}
            onChange={(e) => setInputMode({ ...inputMode, value: e.target.value })}
            placeholder={inputMode.type === 'link' ? "URL du lien..." : "URL de l'image..."}
            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          <button onClick={handleInputSubmit} className="px-3 py-1 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90">
            OK
          </button>
          <button onClick={() => setInputMode(null)} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300">
            Annuler
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-2 mr-1">
          <ToolbarButton icon={Undo} command="undo" title="Annuler" />
          <ToolbarButton icon={Redo} command="redo" title="Rétablir" />
        </div>

        <div className="flex items-center gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-2 mr-1">
          <ToolbarButton
            icon={Heading1}
            command="formatBlock"
            arg="H2"
            title="Grand Titre"
          />
          <ToolbarButton
            icon={Heading2}
            command="formatBlock"
            arg="H3"
            title="Petit Titre"
          />
          <ToolbarButton
            icon={Type}
            command="formatBlock"
            arg="P"
            title="Paragraphe"
          />
        </div>

        <div className="flex items-center gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-2 mr-1">
          <ToolbarButton icon={Bold} command="bold" title="Gras" />
          <ToolbarButton icon={Italic} command="italic" title="Italique" />
          <ToolbarButton
            icon={Underline}
            command="underline"
            title="Souligné"
          />
        </div>

        <div className="flex items-center gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-2 mr-1">
          <ToolbarButton
            icon={AlignLeft}
            command="justifyLeft"
            title="Aligner à gauche"
          />
          <ToolbarButton
            icon={AlignCenter}
            command="justifyCenter"
            title="Centrer"
          />
          <ToolbarButton
            icon={AlignRight}
            command="justifyRight"
            title="Aligner à droite"
          />
        </div>

        <div className="flex items-center gap-0.5 pr-2 mr-1">
          <ToolbarButton
            icon={List}
            command="insertUnorderedList"
            title="Liste à puces"
          />
          <ToolbarButton
            icon={ListOrdered}
            command="insertOrderedList"
            title="Liste numérotée"
          />
        </div>

        <div className="flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            onClick={() => setInputMode({ type: 'link', value: '' })}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 ${inputMode?.type === 'link' ? 'bg-gray-200' : ''}`}
            title="Insérer un lien"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setInputMode({ type: 'image', value: '' })}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 ${inputMode?.type === 'image' ? 'bg-gray-200' : ''}`}
            title="Insérer une image web"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 cursor-text group"
        onClick={() => {
          if (!inputMode) editorRef.current?.focus();
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[400px] p-6 outline-none prose dark:prose-invert max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}
