import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import RichTextEditor from './RichTextEditor';

export interface WikiInlineEditorRef {
  startEditing: () => void;
}

interface WikiInlineEditorProps {
  slug: string;
  title: string;
  userId?: number | string;
  isModerator?: boolean;
  children: React.ReactNode;
}

const WikiInlineEditor = forwardRef<WikiInlineEditorRef, WikiInlineEditorProps>(({
  slug,
  title,
  userId,
  isModerator,
  children,
}, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const [content, setContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [dbContent, setDbContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Expose startEditing method to parent
  useImperativeHandle(ref, () => ({
    startEditing: () => {
      // Capture current static HTML content
      if (!dbContent && contentRef.current) {
        const staticHtml = contentRef.current.innerHTML;
        setContent(staticHtml);
        setCodeContent(staticHtml);
      } else if (dbContent) {
        setContent(dbContent);
        setCodeContent(dbContent);
      }
      setIsEditing(true);
    }
  }));

  // Fetch existing content from database
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/wiki/${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.Content) {
            setDbContent(data.Content);
            setContent(data.Content);
            setCodeContent(data.Content);
          }
        }
      } catch (error) {
        console.error('Error fetching wiki content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [slug]);

  // Sync content between modes when switching
  const handleModeSwitch = (mode: 'visual' | 'code') => {
    if (mode === 'code' && editMode === 'visual') {
      setCodeContent(content);
    } else if (mode === 'visual' && editMode === 'code') {
      setContent(codeContent);
    }
    setEditMode(mode);
  };

  const handleCancel = () => {
    setContent(dbContent || '');
    setCodeContent(dbContent || '');
    setIsEditing(false);
    setEditMode('visual');
  };

  const handleSave = async () => {
    setSaving(true);
    const finalContent = editMode === 'code' ? codeContent : content;
    try {
      const response = await fetch(`/api/wiki/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: finalContent,
          userId,
          isModerator
        }),
      });

      if (response.ok) {
        setDbContent(finalContent);
        setContent(finalContent);
        setCodeContent(finalContent);
        setIsEditing(false);
        setEditMode('visual');
      } else {
        alert('Failed to save wiki page');
      }
    } catch (error) {
      console.error('Error saving wiki content:', error);
      alert('Error saving wiki page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  // Editing mode - show rich text editor inline with wiki styling
  if (isEditing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleModeSwitch('visual')}
              className={`px-3 py-1 text-xs rounded ${
                editMode === 'visual' 
                  ? 'bg-[#2f3a2f] text-white' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => handleModeSwitch('code')}
              className={`px-3 py-1 text-xs rounded ${
                editMode === 'code' 
                  ? 'bg-[#2f3a2f] text-white' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Code
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 hover:bg-gray-400 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-xs bg-[#2f3a2f] text-white hover:bg-[#3d4a3d] rounded"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {editMode === 'visual' ? (
          <div className="wiki-editor-container">
            <style>{`
              .wiki-editor-container .ProseMirror {
                min-height: 400px;
                padding: 1rem;
              }
              .wiki-editor-container .ProseMirror h2,
              .wiki-editor-container .ProseMirror h3 {
                font-size: 0.75rem;
                font-weight: normal;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #6b7280;
                border-bottom: 1px solid #d1d5db;
                padding-bottom: 0.25rem;
                margin-bottom: 1rem;
                margin-top: 1.5rem;
              }
              .wiki-editor-container .ProseMirror h2:first-child,
              .wiki-editor-container .ProseMirror h3:first-child {
                margin-top: 0;
              }
              .wiki-editor-container .ProseMirror h4 {
                font-size: 0.75rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
                margin-top: 1rem;
              }
              .wiki-editor-container .ProseMirror p {
                font-size: 0.75rem;
                color: #1f2937;
                margin-bottom: 1rem;
              }
              .wiki-editor-container .ProseMirror ul {
                font-size: 0.75rem;
                list-style-type: disc;
                list-style-position: inside;
                margin-bottom: 1.5rem;
              }
              .wiki-editor-container .ProseMirror ol {
                font-size: 0.75rem;
                list-style-type: decimal;
                list-style-position: inside;
                margin-bottom: 1.5rem;
              }
              .wiki-editor-container .ProseMirror li {
                margin-bottom: 0.25rem;
              }
              .wiki-editor-container .ProseMirror a {
                color: #2f3a2f;
                text-decoration: none;
              }
              .wiki-editor-container .ProseMirror a:hover {
                text-decoration: underline;
              }
              .wiki-editor-container .ProseMirror blockquote {
                background: #f9fafb;
                padding: 1rem;
                border-left: 4px solid #d1d5db;
                margin-bottom: 1rem;
                font-size: 0.75rem;
              }
            `}</style>
            <div className="border border-gray-300 rounded">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Edit wiki content..."
              />
            </div>
          </div>
        ) : (
          <textarea
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            className="w-full h-96 p-4 font-mono text-xs text-gray-900 border border-gray-300 rounded bg-white"
            placeholder="Edit HTML code..."
          />
        )}
      </div>
    );
  }

  // View mode - show DB content or static children
  return dbContent ? (
    <div 
      className="wiki-content text-xs text-gray-800"
      dangerouslySetInnerHTML={{ __html: dbContent }}
    />
  ) : (
    <div ref={contentRef}>
      {children}
    </div>
  );
});

WikiInlineEditor.displayName = 'WikiInlineEditor';

export default WikiInlineEditor;
