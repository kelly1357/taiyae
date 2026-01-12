import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const SpiritSymbols: React.FC = () => {
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
          <span>Spirit Symbols</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Spirit Symbols</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="spirit-symbols"
              title="Spirit Symbols"
              userId={user?.id}
            >
            <div className="max-w-none text-gray-800 text-xs">
              <p className="mb-4">
                Spirit Symbols reflect a wolf's tendency toward certain behaviors and values. 
                They are similar to character alignments in other RPGs. They are not concrete, and 
                you may follow them as you wish. Your wolf may behave as a perfect example of 
                his Spirit Symbol, or he may deviate from specific characteristics of his Symbol.
              </p>
              
              <p className="mb-4">
                <strong><Link to="/wiki/spirit-symbol-quiz" className="text-[#2f3a2f] hover:underline">Take the Spirit Symbol quiz to determine your character's Symbol.</Link></strong>
              </p>
              
              <p className="mb-4">
                You may take the quiz as many times as you want, as your character's values and 
                tendencies are likely to change over time. However, keep in mind that the quiz 
                is meant to decide your character's symbol for you— not the other way around.
              </p>
              
              <p className="mb-6">
                There are nine possible Symbols:
              </p>

              {/* Hoof */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/hoof_d.png" 
                  alt="Hoof Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Hoof</h4>
                <p className="mb-2">
                  Committed to serving the greater good through order and loyalty, a Hoof is compassionate and fiercely loyal to those he serves.
                </p>
                <p className="mb-2">
                  He operates behind a strong moral compass or personal code of honor, and 
                  endeavors to protect those weaker than him. As a result, he will only kill out of 
                  loyalty, to defend those to whom he's sworn (whether it be his pack, his family, or 
                  the innocents of the world). He likely believes in justice where it is due. He 
                  will rarely, if ever, tell a lie.
                </p>
                <p className="mb-2">
                  He believes there is order to the world, and that upholding this order is 
                  necessary for there to be good in the world. Discipline and respect are musts for him. 
                  He accepts that to contribute to order, one has to sacrifice personal freedom.
                </p>
                <p className="mb-2">
                  He will likely flourish within a structured hierarchy, since he is cooperative 
                  by nature and values organization (for example, a poorly-planned hunt may 
                  irritate him).
                </p>
              </div>
              <div className="clear-both"></div>

              {/* Leaf */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/leaf_d.png" 
                  alt="Leaf Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Leaf</h4>
                <p className="mb-2">
                  A Leaf tries to do what he believes is right, and values both order and personal 
                  freedom, whichever is necessary to contribute to good and uphold the natural balance 
                  he sees in the world.
                </p>
                <p className="mb-2">
                  A Leaf appreciates life in all its forms (wolves and other creatures alike). He 
                  is happy to stand up for those weaker than him, but also realizes the importance 
                  of his own well-being, and so may face a dilemma if forced to choose between 
                  the two. He will only kill or harm others out of self defense, and never for 
                  pleasure. He will lie only if it's for a good reason.
                </p>
                <p className="mb-2">
                  He is not inherently for or against authority, as his loyalty and cooperation 
                  depend on the situation, and whether or not an organization supports his moral 
                  code. He typically defaults to helping and working with others, but may also thrive 
                  independently. As a result, he may be easily swayed.
                </p>
              </div>
              <div className="clear-both"></div>

              {/* Feather */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/feather_d.png" 
                  alt="Feather Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Feather</h4>
                <p className="mb-2">
                  Acting according to her conscience, a Feather is kind and benevolent, naturally independent, and makes her own way. She 
                  plans little and tends to follow her heart.
                </p>
                <p className="mb-2">
                  A Feather believes that true satisfaction and happiness are the reasons for 
                  living. She tries to do what is good, but may place her own wants and needs above 
                  those of another, depending on the situation. She may harm or kill if whatever 
                  good she values is at stake, but will rarely do so for no reason. By the same 
                  token, she may not always be truthful if lying is necessary for the goal at hand.
                </p>
                <p className="mb-2">
                  She is likely to believe that there is no natural order to the world, that chaos 
                  and chance govern life, and that planning is futile. As a result, she believes 
                  that rules are meant to be broken, and may disdain authority if it hinders her 
                  freedom. She respects individual life, resents confinement, and values personal 
                  liberty above all, believing it to be the path to self-realization.
                </p>
              </div>
              <div className="clear-both"></div>

              {/* Print */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/print_d.png" 
                  alt="Print Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Print</h4>
                <p className="mb-2">
                  A Print is an individualist first and foremost, and is not naturally inclined toward or 
                  against the greater good. He mostly follows his own whims.
                </p>
                <p className="mb-2">
                  While a Print is not committed to helping others, he may do so if the time is 
                  right. He is loyal to himself above all others, and may be either friendly or 
                  reclusive, depending on his personality. He may be swayed for or against a common 
                  cause, but may abandon it at any time. He may be susceptible to temptation. A 
                  Print may kill or harm others if his immediate freedom or happiness is at stake, if 
                  those he is close to are threatened, or if he feels it is best for him.
                </p>
                <p className="mb-2">
                  He likely believes in luck and chance instead of fate, and so tends to act on 
                  whims rather than according to any plan. He often takes actions just to see what 
                  happens. Because of this, he may not always be reliable. He avoids authority and 
                  restriction, respecting absolute freedom instead, and may not respect tradition. 
                  Overall, he values his own ability to have a choice in all matters.
                </p>
              </div>
              <div className="clear-both"></div>

              {/* Fang */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/fang_d.png" 
                  alt="Fang Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Fang</h4>
                <p className="mb-2">
                  Motivated by personal gain, a Fang cares primarily about fulfilling his own desires— chaos and disorder among 
                  them— in any way he can.
                </p>
                <p className="mb-2">
                  A Fang serves himself only, and rarely helps others without some ulterior motive 
                  behind his actions. He can be easily swayed by hatred or anger, and so may 
                  consider the suffering of those he hates as a personal goal. In the same vein, he 
                  may crave power and glory, and as a result may achieve it through any means 
                  possible. His conscience is grounded in his own motives. He will almost invariably lie 
                  to support his goals.
                </p>
                <p className="mb-2">
                  He is committed to disorder, whether because he is well-equipped to thrive amid 
                  chaos, or because he wants to watch the world unfold into chaos. He is 
                  opportunistic, valuing his own freedom above all else. He avoids authority unless he is 
                  the authority. Conversely, he may be manipulative, whether for personal gain or 
                  for amusement.
                </p>
              </div>
              <div className="clear-both"></div>

              {/* Bone */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/bone_d.png" 
                  alt="Bone Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Bone</h4>
                <p className="mb-2">
                  A Bone does whatever she can get away with to advance her own goals, and may choose 
                  either independence or cooperation, whichever suits her at the moment.
                </p>
                <p className="mb-2">
                  A Bone pursues her wants and needs without regard for others, and may help or 
                  harm them as she sees fit. If she makes friends, it is normally as a means to an 
                  end. She may harm or kill others because she enjoys watching them suffer, or 
                  because she has been put to the task by someone else. Alternatively, she may choose 
                  not to— in the end, the potential for personal gain is the deciding factor. She 
                  has no trouble lying or manipulating to get what she wants.
                </p>
                <p className="mb-2">
                  She is not inclined toward or against cooperation, and may blend in for 
                  self-serving reasons, or alternately, abandon a hierarchy if she must. She may view 
                  others as weak or stupid if they fall behind her. She may be eager for power, or may 
                  have disdain for it. She may act vengefully if she feels she herself has been 
                  wronged, or she may be swayed by others to join or oppose any given cause.
                </p>
              </div>
              <div className="clear-both"></div>

              {/* Antler */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/antler_d.png" 
                  alt="Antler Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Antler</h4>
                <p className="mb-2">
                  An Antler values order and authority, and is methodical rather than merciful or 
                  compassionate in serving those to whom he's sworn.
                </p>
                <p className="mb-2">
                  An Antler values his own life above the lives of others. He may have a strong 
                  personal code of ethics that deviates from the norm, or he may be interested in a 
                  well-ordered hierarchy because he can exploit it more easily. He has a tendency 
                  to cooperate with others if the task at hand supports order, but may do it 
                  begrudgingly if it does not support his own goals. He will harm or kill others for 
                  personal gain or allegiance, but will rarely lie unless it suits his goals.
                </p>
                <p className="mb-2">
                  He does not enjoy breaking rules or promises, but is also not above bending the 
                  rules if they work in his favor. He is comfortable in a hierarchy, and may be 
                  even more comfortable as a leader. He values discipline for himself and others. He 
                  may believe in a system of natural law, and so may perceive survival of the 
                  fittest as to be an ultimate truth.
                </p>
              </div>
              <div className="clear-both"></div>

              {/* Eye */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/eye_d.png" 
                  alt="Eye Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Eye</h4>
                <p className="mb-2">
                  An Eye acts according to law, tradition, or personal code. She is not naturally 
                  inclined toward helping or hurting others, and may do either if it supports whatever 
                  law she follows.
                </p>
                <p className="mb-2">
                  An Eye values both her own well-being and that of others, though when it comes 
                  to a choice, she will typically choose the well-being of those she serves. She 
                  may be tempted by the idea of power. She will kill or harm others only for 
                  loyalty, though anger or revenge may also control her actions. She will never tell a 
                  lie unless it supports the good of the order.
                </p>
                <p className="mb-2">
                  She disdains rebelliousness, as she likely believes all life must have order. 
                  She may not value freedom, and so may be seen as stiff— but reliable and honorable 
                  nonetheless. She believes that law and order trumps all. She may seek a station 
                  or purpose in life. She attempts to act according to plan, and values 
                  organization.
                </p>
              </div>
              <div className="clear-both"></div>

              {/* Stone */}
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/stone_d.png" 
                  alt="Stone Symbol" 
                  className="float-right ml-4 mb-2 mt-[52px] w-16"
                />
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 pb-1 mb-4 border-b border-gray-300">Stone</h4>
                <p className="mb-2">
                  A Stone has no bias toward helping others or hurting them, or toward order or 
                  independence. He follows his own path, and lets the situation at hand influence his 
                  actions.
                </p>
                <p className="mb-2">
                  A Stone does what he wants, and values acting naturally without prejudice for 
                  against anything. He may value having a choice between being helpful or 
                  self-serving, or he may simply be apathetic towards others in general. He is not inclined 
                  toward or against killing or harming others, and if he does so, it may be for 
                  personal gain, to serve his pack, or to protect others.
                </p>
                <p className="mb-2">
                  Depending on his personality, he may believe in either fate or chaos. He is not 
                  personally committed to any higher order of life. He may be seen as even-handed 
                  and fair, or aloof and detached. He may believe that his is the best way of 
                  living. He may be influenced toward or away from any cause, and may or may not be 
                  tempted by power.
                </p>
              </div>
              <div className="clear-both"></div>
            </div>
            </WikiInlineEditor>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            {/* Search Box */}
            <div className="bg-white border border-stone-300 mb-4">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Search the Wiki
              </div>
              <div className="p-4">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    className="flex-1 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-[#2f3a2f]"
                  />
                  <button
                    className="bg-[#2f3a2f] text-white px-4 py-2 text-sm hover:bg-[#3d4a3d] transition-colors"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>

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

export default SpiritSymbols;
