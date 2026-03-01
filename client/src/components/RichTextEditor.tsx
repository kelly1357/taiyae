import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Normalize HTML so that <br> tags inside <p> elements become separate paragraphs.
 * This ensures TipTap treats each visual "line" as its own block node,
 * so H2/bullet/etc apply only to the current line, not the entire chunk.
 */
function normalizeContent(html: string): string {
  if (!html) return html;
  return html.replace(/<p>([\s\S]*?)<\/p>/gi, (match, inner) => {
    // Split by <br>, <br/>, <br /> variants
    const parts = inner.split(/<br\s*\/?>/gi);
    if (parts.length <= 1) return match;
    return parts
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0)
      .map((p: string) => `<p>${p}</p>`)
      .join('');
  });
}

// Prevent mousedown from stealing focus away from the editor.
const preventFocusLoss = (e: React.MouseEvent) => e.preventDefault();

const MenuBar: React.FC<{ editor: any }> = ({ editor }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2">
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('bold') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('italic') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('underline') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        <u>U</u>
      </button>
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('strike') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        <s>S</s>
      </button>
      
      <div className="w-px bg-gray-300 mx-1" />
      
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        H2
      </button>
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        H3
      </button>
      
      <div className="w-px bg-gray-300 mx-1" />
      
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('bulletList') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        • List
      </button>
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('orderedList') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        1. List
      </button>
      
      <div className="w-px bg-gray-300 mx-1" />
      
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('blockquote') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        Quote
      </button>
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('codeBlock') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        Code
      </button>
      
      <div className="w-px bg-gray-300 mx-1" />
      
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={addLink}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('link') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        Link
      </button>
      <button
        type="button"
        onMouseDown={preventFocusLoss}
        onClick={addImage}
        className="px-2 py-1 rounded text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-200"
      >
        Image
      </button>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  
  const [editMode, setEditMode] = React.useState<'visual' | 'code'>('visual');
  const [codeContent, setCodeContent] = React.useState(value);
  
  // Track the last value we sent to the parent so we can detect truly external changes
  const lastEmittedValue = React.useRef(value);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,      // We configure Link separately below
        underline: false,  // We configure Underline separately below
      }),
      Underline,
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: null,
          rel: null,
        },
      }),
      Image,
    ],
    content: normalizeContent(value),
    editorProps: {
      // Strip <pre>/<code> formatting from pasted content so code blocks
      // don't accidentally end up in posts (e.g. copying from the banner code box)
      // Preserves line breaks as separate paragraphs
      transformPastedHTML(html: string) {
        // First strip <code> tags (keep inner content)
        html = html.replace(/<code[^>]*>/gi, '').replace(/<\/code>/gi, '');
        // Convert <pre> blocks: split inner content on newlines into separate <p> tags
        html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_match, inner) => {
          const lines = inner.split(/\n/);
          return lines
            .map((line: string) => `<p>${line || '<br>'}</p>`)
            .join('');
        });
        return html;
      },
    },
    onUpdate: ({ editor }: { editor: any }) => {
      const html = editor.getHTML();
      lastEmittedValue.current = html;
      onChangeRef.current(html);
    },
  }, []);  // Empty deps array - only create editor once

  // Only sync from parent when the value was changed externally
  // (i.e. not as a result of our own onUpdate callback).
  // This handles: clearing after post, loading different post for editing, etc.
  React.useEffect(() => {
    if (!editor) return;
    // If the new value matches what we last emitted, it's just our own update echoing back
    if (value === lastEmittedValue.current) return;
    // Truly external change — update the editor
    lastEmittedValue.current = value;
    editor.commands.setContent(normalizeContent(value));
    setCodeContent(value);
  }, [value, editor]);

  const handleModeSwitch = (mode: 'visual' | 'code') => {
    if (mode === 'code' && editMode === 'visual') {
      if (editor) {
        setCodeContent(editor.getHTML());
      }
    } else if (mode === 'visual' && editMode === 'code') {
      if (editor) {
        editor.commands.setContent(normalizeContent(codeContent));
        onChangeRef.current(editor.getHTML());
      }
    }
    setEditMode(mode);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodeContent(e.target.value);
    onChangeRef.current(e.target.value);
  };

  return (
    <div className="rich-text-editor border border-gray-300 rounded overflow-hidden">
      <div className="flex items-center justify-between bg-gray-100 border-b border-gray-300">
        {editMode === 'visual' && <MenuBar editor={editor} />}
        {editMode === 'code' && <div className="flex-1" />}
        <div className="flex gap-1 p-2 shrink-0">
          <button
            type="button"
            onClick={() => handleModeSwitch('visual')}
            className={`px-2 py-1 rounded text-xs border ${editMode === 'visual' ? 'bg-[#2f3a2f] text-white border-[#2f3a2f]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('code')}
            className={`px-2 py-1 rounded text-xs border ${editMode === 'code' ? 'bg-[#2f3a2f] text-white border-[#2f3a2f]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
          >
            Code
          </button>
        </div>
      </div>
      {editMode === 'visual' ? (
        <EditorContent 
          editor={editor} 
          className="bg-white text-gray-900 min-h-[150px] p-4 prose prose-slate max-w-none"
        />
      ) : (
        <textarea
          value={codeContent}
          onChange={handleCodeChange}
          className="w-full bg-white text-gray-900 min-h-[200px] p-4 font-mono text-xs border-none outline-none resize-y"
          placeholder="Edit HTML code..."
          spellCheck={false}
        />
      )}
      <style>{`
        .rich-text-editor .ProseMirror {
          outline: none;
          min-height: 150px;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #6B7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .rich-text-editor .ProseMirror p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .rich-text-editor .ProseMirror blockquote {
          border-left: 3px solid #D1D5DB;
          padding-left: 1rem;
          margin-left: 0;
          color: #4B5563;
        }
        .rich-text-editor .ProseMirror pre {
          background: #F3F4F6;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
        }
        .rich-text-editor .ProseMirror code {
          background: #F3F4F6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
        }
        .rich-text-editor .ProseMirror a {
          color: #2563EB;
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0 0.5rem;
          line-height: 1.2;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 0.75rem;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 0.25rem;
          margin: 1rem 0 1rem;
          line-height: 1.3;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 0.875rem;
          font-weight: normal;
          color: #6c6e29;
          margin: 0.75rem 0 0.5rem;
          line-height: 1.4;
          text-transform: none;
          letter-spacing: normal;
          border-bottom: none;
          padding-bottom: 0;
        }
        .rich-text-editor .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor .ProseMirror li {
          margin: 0.25rem 0;
        }
        .rich-text-editor .ProseMirror li p {
          margin: 0;
        }
        .rich-text-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
        .rich-text-editor .ProseMirror table {
          border-collapse: collapse;
          margin: 1rem 0;
          overflow: hidden;
          width: 100%;
        }
        .rich-text-editor .ProseMirror table td,
        .rich-text-editor .ProseMirror table th {
          border: 1px solid #d1d5db;
          box-sizing: border-box;
          min-width: 1em;
          padding: 0.5rem;
          position: relative;
          vertical-align: top;
        }
        .rich-text-editor .ProseMirror table th {
          background-color: #f9fafb;
          font-weight: bold;
        }
        .rich-text-editor .ProseMirror table .selectedCell:after {
          background: rgba(200, 200, 255, 0.4);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;