import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import WikiSearchBox from '../../components/WikiSearchBox';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const RulesMindReading: React.FC = () => {
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
        {/* Breadcrumb */}
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/wiki/handbook" className="hover:underline">Wiki</Link>
          <span className="mx-2">›</span>
          <span>Rules: Mind Reading</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Rules: Mind Reading</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="rules-mind-reading"
              title="Rules: Mind Reading"
              userId={user?.id}
              isModerator={isModerator}
            >
            <div className="max-w-none text-gray-800 text-xs">
              {/* What is Mind Reading? */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
                What is Mind Reading?
              </h3>
              
              <p className="mb-4">
                While the question seems to have an obvious reason, mind reading (or metagaming) 
                comes in many forms! It all comes down to your character knowing information 
                that hasn't been presented to them in any way IC.
              </p>

              {/* Picking Up on Unobvious Things */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Picking Up on Unobvious Things
              </h3>
              
              <p className="mb-4">
                A common occurrence is when one wolf senses, without any clear reasoning why, 
                that another wolf is lying or potentially dangerous/about to attack. Many 
                characters are naturally insightful, but no wolf is psychic.
              </p>
              
              <p className="mb-4">
                If, for example, your character senses that another is being dishonest, write 
                out how they came to that conclusion! Is the other character getting abnormally 
                close? Is he talking excessively or asking too many questions? Is she glancing 
                away frequently? Does he fit the description of a character yours was warned about 
                IC? Describing another character as simply "looking dishonest" without 
                explaining what makes them appear that way is not quite enough!
              </p>

              {/* Do Not Example */}
              <p className="font-semibold mb-2">DO NOT:</p>
              <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-4">
                <p className="mb-2 italic">Post One</p>
                <p className="mb-4">
                  Tyler looked at Bob. His posture remained casual as he spoke. "I was the one who 
                  brought the rabbit to the cache," he lied, his usual honest grin on his face.
                </p>
                <p className="mb-2 italic">Post Two</p>
                <p>
                  Bob looked at Tyler, skeptical. He knew Tyler hadn't brought or killed the 
                  rabbit in the cache, because he looked like he was lying. "No you didn't."
                </p>
              </div>

              {/* Do #1 Example */}
              <p className="font-semibold mb-2">DO #1:</p>
              <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-4">
                <p className="mb-2 italic">Post One</p>
                <p className="mb-4">
                  Tyler looked at Bob. His posture remained casual as he spoke. "I was the one who 
                  brought the rabbit to the cache," he lied, his usual honest grin on his face.
                </p>
                <p className="mb-2 italic">Post Two</p>
                <p>
                  Bob looked at Tyler. He was his usually cheerful self, huge grin on face. "Well 
                  then I have to thank you," Bob replied, smiling largely in return.
                </p>
              </div>

              {/* Do #2 Example */}
              <p className="font-semibold mb-2">DO #2:</p>
              <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-4">
                <p className="mb-2 italic">Post One</p>
                <p className="mb-4">
                  Tyler looked at Bob. His posture was tense, expression nervous. "I was the one 
                  who brought the rabbit to the cache," he lied, averting his gaze away from Bob 
                  and just past him.
                </p>
                <p className="mb-2 italic">Post Two</p>
                <p>
                  Bob furrowed his brows, dubious as he observed Tyler tense up. He usually held 
                  to a casual posture, so that was odd. As he noticed Tyler look away, he sighed 
                  slightly. "I'm not sure you did, Tyler," Bob said, realising his strange 
                  behaviour.
                </p>
              </div>

              <p className="mb-4">
                It's important to explain suspicions like these in writing to avoid mind reading 
                or meta gaming. If as you're writing you can't find any specific reason why 
                your character thinks another is dishonest or bad, consider that your OOC knowledge 
                may be affecting your IC knowledge.
              </p>
              
              <p className="mb-4">
                Mixing OOC and IC knowledge happens to the best of us, and keeping them separate 
                can be challenging, especially if we know our character is in danger or being 
                lied to. Use specific reasons and observations in your posts to help you make 
                sure the conclusions your characters come to are ICly fair!
              </p>
              
              <p className="mb-4">
                If staff note that your character is jumping to advantageous conclusions without 
                written reasons that make sense, you may be asked to edit your posts. If you 
                feel your character is being "mind read," don't hesitate to reach out to staff for 
                review!
              </p>

              {/* Other Forms of Mind Reading */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Other Forms of Mind Reading
              </h3>
              
              <p className="mb-4">
                Another common form of mind reading involves your character's thoughts (or 
                dialogue) responding to another character's unspoken thoughts or feelings.
              </p>
              
              <p className="font-semibold mb-2">For example:</p>
              <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-4">
                <p className="mb-2 italic">Post One</p>
                <p className="mb-4">
                  Tyler watched Bob eat the rabbit. Tyler had never seen Bob even once add food to 
                  the cache. He only ever seemed to take food, and it struck him as unfair. For 
                  now, though, he kept quiet on the topic. He'd bring it up to the leader later. 
                  "Liking the weather, Bob?" he greeted casually, smiling slightly.
                </p>
                <p className="mb-2 italic">Post Two</p>
                <p>
                  Bob always brought food to the cache. Even others didn't always see him do it, 
                  that didn't mean that he wasn't a regular hunter. He cared for his packmates and 
                  certainly never wanted them to starve. "I like it, though I can't wait until it 
                  cools off a little more so it's nicer for hunting!" he replied.
                </p>
              </div>

              <p className="mb-4">
                In this case, Bob's thoughts responded to Tyler's thoughts directly. Because 
                there's no clear justification for why Bob would happen to think an exact answer to 
                Tyler's unspoken concerns, this can be considered mindreading. It can be 
                tempting to want to defend your character from another's negative or incorrect 
                thoughts, but it's important to be wary of how this can easily turn into mind reading.
              </p>
              
              <p className="mb-4">
                Characters are often unreliable narrators, meaning what they say and think may 
                not be a 100% accurate reflection of reality. Avoid the temptation to correct 
                another character's thoughts, even if it means your character isn't being thought 
                of in a fair light. If you do think that a misunderstanding between writers has 
                happened, consider mentioning it in an OOC comment to clarify whether it was the 
                writer or character that pictured an event differently than you did!
              </p>

              {/* Conclusion */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Conclusion
              </h3>
              
              <p className="mb-4">
                While some forms of light mind reading can be generally harmless, we recommend 
                avoiding it entirely. Having characters respond only to what's presented to them 
                IC keeps the game fair, fun, and sometimes delightfully dramatic!
              </p>
              
              <p className="mb-4">
                If you have questions about what is considered mind reading, don't be afraid to 
                reach out to staff! We're happy to help with this sometimes tricky topic.
              </p>
            </div>
            </WikiInlineEditor>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            <WikiSearchBox />

            {/* Quick Links */}
            <div className="bg-white border border-stone-300">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Links
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li>
                    <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Index</Link>
                  </li>
                  <li>
                    <Link to="/wiki/game-overview" className="text-[#2f3a2f] hover:underline">Game Overview</Link>
                  </li>
                  <li>
                    <Link to="/wiki/getting-started" className="text-[#2f3a2f] hover:underline">Getting Started</Link>
                  </li>
                  <li>
                    <Link to="/wiki/rules-compilation" className="text-[#2f3a2f] hover:underline">Rules: Compilation</Link>
                  </li>
                  <li>
                    <Link to="/wiki/faq" className="text-[#2f3a2f] hover:underline">FAQ</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RulesMindReading;
