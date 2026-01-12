import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const UsingTags: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const isModerator = user?.isModerator || user?.isAdmin;
  const editorRef = useRef<WikiInlineEditorRef>(null);

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex items-center justify-between">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
        {isModerator && (
          <button
            onClick={() => editorRef.current?.startEditing()}
            className="text-xs text-white/70 hover:text-white"
          >
            Edit Page
          </button>
        )}
      </div>
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Using Tags</h1>
        
        <WikiInlineEditor
          ref={editorRef}
          slug="using-tags"
          title="Using Tags"
          userId={user?.id}
        >
        <div className="text-xs text-gray-800 space-y-4">
          {/* IC THREAD TAGS */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">IC Thread Tags</h3>
          
          {/* Types of Tags */}
          <h4 className="font-bold mb-2 mt-4">Types of Tags</h4>
          
          <p>
            All threads are presumed "All Welcome," or open for anyone to join. We encourage you to bring your characters into threads, as well as create new 
            threads, wherever it makes sense according to their timelines.
          </p>
          
          <p>
            That said, tags (requests for threads with certain characters) are allowed in a 
            few cases, but are completely optional:
          </p>
          
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>[SUMMONS]</strong> — If your character is summoning another character, or has come to find them (e.g. howling)</li>
            <li><strong>[CONTINUATION]</strong> — If the thread is a continuation of a thread in which your character was already with the other character</li>
            <li><strong>[PRIVATE]</strong> — If the thread has progressed beyond a sensible point of entry for a new character to join in (10+ posts only). This tag can also be optionally used to mark birthing threads private before the 10 post minimum. The private tag should be used fairly, realistically, and should not be a way to "game the system"</li>
          </ul>
          
          <p>
            Please note— there is no need to tag your threads [AW], since all threads 
            without a tag are considered open.
          </p>

          {/* Regarding the Summons Tag */}
          <h4 className="font-bold mb-2 mt-4">Regarding the Summons Tag</h4>
          
          <p>
            Your character should not have a summoning thread for a character they have not 
            met or learned about IC.
          </p>
          
          <p>
            Some other key points to keep in mind:
          </p>
          
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>There must be a physical summons such as howling or explicit knowledge of a meeting place or den, etc., or the wolf must be tracking a scent trail within reason.</li>
            <li>It may take a few posts for a wolf to reach the source of the howl, depending on proximity</li>
            <li>It's reasonable for characters (including wolves not targeted in the summons) to show up after a few posts</li>
          </ul>

          {/* USING TAGS */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">Using Tags</h3>
          
          {/* How to add tags */}
          <h4 className="font-bold mb-2 mt-4">How to add tags</h4>
          
          <p>
            To add a tag to your thread, check the appropriate box when submitting a new 
            thread, or editing an existing one.
          </p>
          
          <p>
            If you need to add details to a tag, like whom a Summons is for, use the 
            Subtitle field to specify details.
          </p>
        </div>
        </WikiInlineEditor>
      </div>
    </section>
  );
};

export default UsingTags;
