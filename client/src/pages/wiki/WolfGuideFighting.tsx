import { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import WikiSearchBox from '../../components/WikiSearchBox';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

export default function WolfGuideFighting() {
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
          <span>Wolf Guide: Fighting</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Wolf Guide: Fighting</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="wolf-guide-fighting"
              title="Wolf Guide: Fighting"
              userId={user?.id}
              isModerator={isModerator}
            >
            <div className="max-w-none text-gray-800">

          {/* Overview */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Overview</h3>
          
          <p className="text-xs mb-4">
            Fighting in Horizon is virtually inevitable - as anything can happen In 
            Character, your character will likely take part in multiple fights during his lifetime, 
            depending on his lifestyle, pack, personality, and sheer luck. Within Horizon, 
            you will be expected to deal with fights between characters accordingly, without 
            powerplaying, godmoding, and so on. Any unfair, illogical, or otherwise cheating 
            moves will be reviewed by staff and dealt with accordingly if the players 
            involved request such.
          </p>
          
          <p className="text-xs mb-4">
            <strong>Permission is not needed to start a fight or kill a character as long as all actions are handled fairly 
            in character.</strong>
          </p>
          
          <p className="text-xs mb-4">
            Fighting takes place turn-by-turn, with each post being one turn. In each turn, 
            the roleplayer is required to respond to each aspect of the attack his opponent 
            has mentioned in the previous turn before making his own attack. All posts 
            should contain:
          </p>
          
          <ol className="list-decimal list-inside space-y-2 ml-4 bg-gray-50 p-4 border-l-4 border-gray-300 text-xs mb-4">
            <li>A detailed response to your opponent's attack, if any, including any attempts to 
            dodge and the resulting damage taken.</li>
            <li>A detailed description of your character's attempted attack, if any.</li>
            <li>A description of the defensive posturing your character may be using during this 
            turn, if any.</li>
          </ol>
          
          <p className="text-xs mb-4">For example:</p>
          
          <div className="bg-gray-50 p-4 border-l-4 border-gray-300 space-y-4 text-xs mb-4">
            <p><strong>Steve's turn (starting the fight)</strong></p>
            <p className="italic">
              "After Bob's heated words, Steve could take no more. He ran forward and lunged 
              for Bob's throat, lowering his head to protect his own throat and to try to get a 
              better angle on Bob's."
            </p>
            
            <p><strong>Bob's turn</strong></p>
            <p className="italic">
              "As Steve lunged for Bob's throat, Bob turned sharply to the side to try to 
              dodge. While Bob managed to protect his neck from the attack, Steve's teeth struck 
              fiercely into Bob's right shoulder, and Bob winced as they dug into the thick fur 
              there. Feeling the heat of teeth in his shoulder, Bob reached over to try to 
              grab the left side of Steve's neck, just behind the ear. He narrowed his eyes and 
              flattened his ears to try to keep them safe from injury."
            </p>
          </div>
          
          <p className="text-xs mb-4">
            Only one totally successful evasive move (called a "full dodge") is allowed per 
            opponent, and should only be used where a full dodge would not be powerplaying 
            or godmoding.
          </p>
          
          <p className="text-xs mb-4">
            <strong>Powerplaying</strong> is controlling another character's body or reactions. For example—
          </p>
          
          <div className="bg-gray-50 p-4 border-l-4 border-gray-300 space-y-4 text-xs mb-4">
            <p><span className="text-red-600 font-bold">Bad:</span> Uther knew that Aegon would not react in time, and he lunged for the other 
            wolf's leg, grabbing it tight in his teeth and yanking the appendage out from under 
            him.</p>
            
            <p><span className="text-green-600 font-bold">Good:</span> Uther hoped that Aegon would not react in time, and he lunged for the other 
            wolf's leg, wanting to grab it in his teeth.</p>
          </div>
          
          <p className="text-xs mb-4">
            It is also considered powerplaying when a wolf's first post states they have been watching an encounter, undetected, as this gives other 
            players no opportunity to IC detect the other wolf.
          </p>
          
          <p className="text-xs mb-4">
            <strong>Godmoding</strong> is having your character act in an unrealistically strong or resilient way, or 
            otherwise avoiding damage in a manner that defies logic. Godmoding can also 
            include taking damage (such as heavily bleeding wounds, a limb injury, or eye 
            injury) but not suffering any ill effects from it during a fight. It may be easier to 
            think of akin to acting in a godlike manner. For example—
          </p>
          
          <div className="bg-gray-50 p-4 border-l-4 border-gray-300 space-y-4 text-xs mb-4">
            <p><span className="text-red-600 font-bold">Bad:</span> Uther was pinned underneath Aegon, belly up, bleeding heavily from earlier 
            bite wounds, but he did not feel them because of all the adrenaline he had. Even 
            as Aegon tried to bite him on the face, perhaps to pierce his eyes, Uther moved 
            his head, and Aegon's teeth missed their mark completely.</p>
            
            <p><span className="text-green-600 font-bold">Good:</span> Uther was pinned underneath Aegon, belly up, bleeding heavily from earlier 
            bite wounds, and he was beginning to feel it, his energy flagging and his reactions 
            slowed. As Aegon tried to bite him on the face, perhaps to pierce his eyes, 
            Uther shifted as best he could to avoid the blinding blow, and took the teeth hard 
            across his muzzle instead, wincing as the teeth gouged the skin there.</p>
          </div>
          
          <p className="text-xs mb-6">
            Please avoid both powerplaying and godmoding, and if any of them occur in a 
            fight you are in and you wish to have them addressed by Staff, please don't hesitate 
            to reach out to us via PM. Anyone found guilty of powerplaying or godmoding 
            runs the risk of having a strike added to their account.
          </p>

          {/* Types of Fights */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Types of Fights</h3>
          
          <p className="text-xs mb-4">
            <strong>Sparring</strong> occurs when two or more wolves decide to practice their fighting skills. If a 
            wolf with a higher Physical SP level coaches another wolf with a lower Physical 
            SP level, this is considered training. Sparring is more or less considered 
            friendly, and major injuries rarely occur, except by accident.
          </p>
          
          <p className="text-xs mb-4">
            <strong>Fighting</strong> is a high-stakes event that normally results from some type of conflict. In 
            some other roleplays, different types of fights (such as Mercy Fights or Death 
            Fights) are recognized and put actively into roleplay. In Horizon, however, there 
            are no set types of fights. So, fights go on until a character decides to quit 
            fighting or dies—depending on how far the characters take it.
          </p>
          
          <p className="text-xs mb-4">
            Characters may verbally set the terms of a fight however they please, but they 
            are not required to do so and are not bound to the terms they promise in 
            dialogue. A spar could turn into a serious fight if tempers flare!
          </p>
          
          <p className="text-xs mb-6">
            A number of factors may play into a wolf's likelihood of doing well in fights, 
            such as physical size, special status, learned fighting experience, fighting 
            style, and overall physical skill points.
          </p>

          {/* General */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">General</h3>
          
          <p className="text-xs mb-4">
            Each round of a fight will realistically only last several seconds at most, as wolves attack quickly and in a flurry. If you wish to use dialogue while 
            fighting, it's wise to keep this in mind so that you don't accidentally awkwardly 
            monologue, forcing a wolf trying to fight your wolf to just stand there and 
            listen when they would otherwise be inclined to bite, as that is a type of 
            powerplaying.
          </p>
          
          <p className="text-xs mb-6">
            This is also worth keeping in mind when entering a fight that is ongoing, as 
            arriving on scene and diving into the fray is unlikely to happen all in the same 
            round. Pacing is important, and it may take several rounds for a wolf to hear a 
            fray, run there, and enter the fight. Wolves should not appear out of nowhere and attack in the first post without any 
            progress being made towards the wolf they are attacking IC.
          </p>

          {/* Offense */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Offense</h3>
          
          <p className="text-xs mb-4">
            Vulnerable places to attack include the eyes, throat, and underside. Offensive 
            moves should be kept realistic. The effectiveness of an attack is determined by 
            the wolf on whom the attack is being attempted. Denying damage or escaping from 
            a latch already held is considered a full dodge, and there is one full dodge per 
            opponent in each fight. Exceeding the one-dodge limit will result in immediate, 
            automatic loss of the fight. No damage should be assumed by the attacker 
            except for in the case of forfeits.
          </p>
          
          <p className="text-xs mb-6">
            Wolves attack with their mouths foremost. Please note that wolf claws are not sharp and will not leave slices or gashes 
            like a cat would. Wolves generally do not attack with their claws as they would be very 
            ineffectual, especially through another wolf's fur. Another thing to keep in mind while 
            fighting is that while a wolf's jaw is strong enough to break through bone, it 
            will usually take several chomps to fracture even leg bones. Wolves also cannot 
            generally crush spinal columns or skulls on animals close to their size or 
            larger, as they lack the bite strength, especially when their mouths are wide enough 
            to close on the skull. Skull crushing is not a viable tactic in a fight.
          </p>

          {/* Defense */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Defense</h3>
          
          <p className="text-xs mb-4">
            There are many techniques to maintaining a strong, defensive fighting style. 
            During each turn (post), defenses should be stated or restated by the roleplayer. 
            Failure to mention defenses again means that the character has stopped the 
            aforementioned defensive maneuvers - as in, it isn't just assumed that Bob's ears are 
            pinned because you mentioned it in the first post, it must be repeated in order 
            to stay in play. Examples of defensive maneuvers include:
          </p>
          
          <ul className="list-none space-y-1 ml-4 text-xs mb-6">
            <li>• <strong>Claws digging</strong> — keeps the defensive wolf rooted to the ground.</li>
            <li>• <strong>Tail tucked</strong> — protects tail and reproductive organs from attack. (Causes slower and clumsier running.)</li>
            <li>• <strong>Eyes narrowed</strong> — decreases likelihood of being blinded.</li>
            <li>• <strong>Ears lowered</strong> — protects ears from being ripped off in an attack.</li>
            <li>• <strong>Shoulders hunched</strong> — Protects neck. (Limits maneuverability and shortens potential lunging distance.)</li>
            <li>• <strong>Head lowered</strong> — protects throat and upper chest area.</li>
            <li>• <strong>Body lowered</strong> — protects underbelly and improves balance.</li>
            <li>• <strong>Stance squared</strong> — decreases likelihood of being knocked off balance.</li>
          </ul>

          {/* Skill Points and Fights */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Skill Points and Fights</h3>
          
          <p className="text-xs mb-4">
            Skill Points are the least important of all factors in a fight, and should be 
            taken largely into account when cooperative writing and other factors have failed 
            to produce a clear victor. At no point should anyone with a higher Physical 
            Skill Point pressure someone with the lower number into losing, as the writing 
            matters far more than the numbers.
          </p>
          
          <p className="text-xs mb-4">
            There is no quantitative system such as die rolling for fights, so players are 
            responsible for taking their characters' and their opponents' Physical SP scores 
            into account when fighting to some degree, as it is indicative of training and 
            lifestyle. As with all RPing at Horizon, you should be willing to write an 
            unfavorable outcome for your character if he is losing a fight, and take damage 
            fairly.
          </p>
          
          <p className="text-xs mb-6">
            Sparring and fighting can earn a wolf Skill Points — see the <Link to="/wiki/skill-points" className="text-[#2f3a2f] font-bold hover:underline">Skill Points</Link> handbook page for more information.
          </p>

          {/* Fights and Special Status */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Fights and Special Status</h3>
          
          <p className="text-xs mb-6">
            If a wolf is ill, injured, starving, or pregnant, they may be less likely to 
            hold their own in a fight and that should be taken into account when posting.
          </p>

          {/* Forfeits */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Forfeits</h3>
          
          <p className="text-xs mb-4">
            As fights are thread-locking (aka, preventing players from moving on to other 
            threads and continuing their timeline until the fight is over), all fights should 
            be attended to as quickly as possible. As with all other threads, there is a 
            three-day-skip rule in place, meaning that if you do not post for a full 72 hours 
            when your turn arises, you may be skipped, forfeiting the fight, and the 
            attacker(s) may call damage upon your wolf as seems reasonable per the state of the 
            fight. This may result in death if the fight has reached such a point, so it is 
            advised to avoid it. If you will be absent from the fight or need a little more time for whatever 
            reason, messaging the others involved in the fight may be a way to avoid this 
            outcome. As always, PM Staff if there are concerns.
          </p>
          
          <p className="text-xs mb-6">
            Exceeding the single full dodge limit (per opponent) will also forfeit the 
            fight. Any other cheating in general may result in a ruled forfeit by Staff if deemed 
            necessary.
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
}
