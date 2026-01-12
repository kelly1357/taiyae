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
    <div className="flex flex-wrap gap-1 p-2 bg-gray-100 border-b border-gray-300 rounded-t">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('bold') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('italic') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('underline') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        <u>U</u>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('strike') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        <s>S</s>
      </button>
      
      <div className="w-px bg-gray-300 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        H3
      </button>
      
      <div className="w-px bg-gray-300 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('bulletList') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('orderedList') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        1. List
      </button>
      
      <div className="w-px bg-gray-300 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('blockquote') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        Quote
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('codeBlock') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        Code
      </button>
      
      <div className="w-px bg-gray-300 mx-1" />
      
      <button
        type="button"
        onClick={addLink}
        className={`px-2 py-1 rounded text-sm border ${editor.isActive('link') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'}`}
      >
        Link
      </button>
      <button
        type="button"
        onClick={addImage}
        className="px-2 py-1 rounded text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-200"
      >
        Image
      </button>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
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
      }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="rich-text-editor border border-gray-300 rounded overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="bg-white text-gray-900 min-h-[150px] p-4 prose prose-slate max-w-none"
      />
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