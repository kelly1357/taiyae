import React, { useState, useRef, useEffect } from 'react';
import { Link, useOutletContext, useLocation } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import WikiSearchBox from '../../components/WikiSearchBox';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const WolfGuide: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const isModerator = user?.isModerator || user?.isAdmin;
  const [showMaternityModal, setShowMaternityModal] = useState(false);
  const editorRef = useRef<WikiInlineEditorRef>(null);
  const location = useLocation();

  // Scroll to hash on page load
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.hash]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Wolf Guide</h1>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="wolf-guide"
              title="Wolf Guide"
              userId={user?.id}
              isModerator={isModerator}
            >
            <div className="text-xs text-gray-800 space-y-4">
              {/* PHYSIOLOGY */}
              <h3 id="physiology" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">Physiology</h3>
              
              {/* Species */}
              <h4 className="font-bold mb-2 mt-4">Species</h4>
              
              <p>
                Horizon focuses upon one particular species of wolf: the gray wolf, Canis lupus. 
                In the real world, gray wolves can be found in the northwest United States and 
                Canada. Given the setting of our story (the Pacific Northwest), the gray wolf is 
                the only species of wolf that would realistically inhabit the area.
              </p>
              
              <p>
                The species lupus (wolves) includes many known subspecies, eleven of which are 
                playable at Horizon:
              </p>
              
              {/* Subspecies Table */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-xs border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top w-48 border-r border-gray-300 bg-gray-50">EASTERN TIMBER WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus lycaon</em> — Most common. Timber wolves are generally large in size and can come in a variation of colors ranging from black to off-white (for roleplay purposes this color range has been expanded). "Timber" is a common coloring for these wolves (gray or dark brown with white on the chest, muzzle, and underside).</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">GREAT PLAINS WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus nubilus</em> — Common. Inhabit a wide range of areas. Great Plains wolves are large in size and come in various colors.</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">ROCKY MOUNTAIN WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus occidentalis</em> — Slightly common. Rocky Mountain wolves (also commonly known as Mackenzie Valley wolves) stand at medium to large heights and vary diversely in color.</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">NORTHERN ROCKY MOUNTAIN WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus irremotus</em> — Slightly common. This wolf is generally "timber" colored, though a bit lighter, and of medium to small size.</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">MEXICAN WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus baileyi</em> — Slightly common. Mexican wolves are smaller than those of other subspecies. They have dark brown or reddish fur and generally have large manes.</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">MONGOLLON MOUNTAIN WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus mogollonensis</em> — Less common. Hailing from the southwest US, their coloration is usually dark with some white.</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">CASCADE MOUNTAINS WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus fuscus</em> — Less common. Cascade Mountains wolves are usually dark brown or chocolate colored with black masks on their faces.</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">SOUTHERN ROCKY MOUNTAIN WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus youngi</em> — Less common. Smaller in size with light colored fur.</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">BRITISH COLUMBIAN WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus columbianus</em> — Uncommon. These wolves are medium size, and always dark gray or black.</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">BANKS ISLAND TUNDRA WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus bernardi</em> — Uncommon. These medium-sized wolves are white with black stripes on their backs and dark tail tips. They hail from the Northwest Territories.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold align-top border-r border-gray-300 bg-gray-50">ARCTIC WOLF</td>
                      <td className="py-2 px-3"><em>Canis lupus arctos</em> — Uncommon. Quite large and almost always pure white or cream, Arctic Wolves are rare due to the extremity of their far-northern heritage.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p>
                Subspecies not listed here require permission from staff. Please also note that 
                your wolf's subspecies is not a required field while editing your profile; it's 
                just for reference and flavor purposes. Note that in present times, many of 
                these subspecies are extinct, and would not be found in the wild. However, Horizon 
                is set during the human decade of the 1900s, so species like the Great Plains 
                wolf become playable to us.
              </p>

              {/* Lifespan */}
              <h4 className="font-bold mb-2 mt-6">Lifespan</h4>
              
              <p>
                Healthy wolves in Horizon have an average lifespan of 6-9 years. In the real 
                world, wolves have been found to live as old as 11, but it is rare that wolves in 
                this roleplay will reach or exceed this age. The maximum age for characters on 
                this site is 9 years, 11 months.
              </p>
              
              {/* Lifespan Table */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-xs text-center border border-gray-300">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-50">
                      <th className="py-2 px-2 border-r border-gray-300">0 yrs.</th>
                      <th className="py-2 px-2 border-r border-gray-300">1 yrs.</th>
                      <th className="py-2 px-2 border-r border-gray-300">2 yrs.</th>
                      <th className="py-2 px-2 border-r border-gray-300">3 yrs.</th>
                      <th className="py-2 px-2 border-r border-gray-300">4 yrs.</th>
                      <th className="py-2 px-2 border-r border-gray-300">5 yrs.</th>
                      <th className="py-2 px-2 border-r border-gray-300">6 yrs.</th>
                      <th className="py-2 px-2 border-r border-gray-300">7 yrs.</th>
                      <th className="py-2 px-2 border-r border-gray-300">8 yrs.</th>
                      <th className="py-2 px-2">9 yrs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-2 bg-gray-100 border-r border-gray-300" colSpan={1}>Pup</td>
                      <td className="py-2 px-2 bg-gray-200 border-r border-gray-300" colSpan={1}>Yearling</td>
                      <td className="py-2 px-2 bg-gray-100 border-r border-gray-300" colSpan={2}>Young Adult</td>
                      <td className="py-2 px-2 bg-gray-200 border-r border-gray-300" colSpan={2}>Adult</td>
                      <td className="py-2 px-2 bg-gray-100" colSpan={4}>Elder</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p>
                Note: characters in Horizon age automatically. You do not need to manually update 
                your character's age.
              </p>

              {/* Size */}
              <h4 className="font-bold mb-2 mt-6">Size</h4>
              
              <p>
                On average, adult gray wolves reach a weight of 80-120 pounds (about 36-54 kg) 
                with males being larger than females, and sizes differing between subspecies. 
                Wolves can reach heights (from ground to shoulder) of up to around 33 inches (85 
                cm) and lengths (from nose to tip of tail) of around 6 feet (183 cm). Below is a 
                scale of wolf lengths, heights, and weights, and their size classifications:
              </p>
              
              {/* Size Tables */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-xs text-center mb-4 border border-gray-300">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-100">
                      <th className="py-2 px-2 border-r border-gray-300">MALES</th>
                      <th className="py-2 px-2 border-r border-gray-300">PETITE</th>
                      <th className="py-2 px-2 border-r border-gray-300">SMALL</th>
                      <th className="py-2 px-2 border-r border-gray-300">AVERAGE</th>
                      <th className="py-2 px-2 border-r border-gray-300">LARGE</th>
                      <th className="py-2 px-2">VERY LARGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-2 font-bold border-r border-gray-300 bg-gray-50">WEIGHT</td>
                      <td className="py-2 px-2 border-r border-gray-300">71-81 lbs</td>
                      <td className="py-2 px-2 border-r border-gray-300">82-92 lbs</td>
                      <td className="py-2 px-2 border-r border-gray-300">93-103 lbs</td>
                      <td className="py-2 px-2 border-r border-gray-300">104-114 lbs</td>
                      <td className="py-2 px-2">115-125 lbs</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-2 font-bold border-r border-gray-300 bg-gray-50">HEIGHT</td>
                      <td className="py-2 px-2 border-r border-gray-300">22-23 in</td>
                      <td className="py-2 px-2 border-r border-gray-300">24-26 in</td>
                      <td className="py-2 px-2 border-r border-gray-300">27-30 in</td>
                      <td className="py-2 px-2 border-r border-gray-300">31-33 in</td>
                      <td className="py-2 px-2">34-36 in</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-bold border-r border-gray-300 bg-gray-50">LENGTH</td>
                      <td className="py-2 px-2 border-r border-gray-300">5.0-5.1 ft</td>
                      <td className="py-2 px-2 border-r border-gray-300">5.2-5.3 ft</td>
                      <td className="py-2 px-2 border-r border-gray-300">5.4-5.8 ft</td>
                      <td className="py-2 px-2 border-r border-gray-300">5.9-6.2 ft</td>
                      <td className="py-2 px-2">6.3-6.5 ft</td>
                    </tr>
                  </tbody>
                </table>
                
                <table className="w-full text-xs text-center border border-gray-300">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-100">
                      <th className="py-2 px-2 border-r border-gray-300">FEMALES</th>
                      <th className="py-2 px-2 border-r border-gray-300">PETITE</th>
                      <th className="py-2 px-2 border-r border-gray-300">SMALL</th>
                      <th className="py-2 px-2 border-r border-gray-300">AVERAGE</th>
                      <th className="py-2 px-2 border-r border-gray-300">LARGE</th>
                      <th className="py-2 px-2">VERY LARGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-2 font-bold border-r border-gray-300 bg-gray-50">WEIGHT</td>
                      <td className="py-2 px-2 border-r border-gray-300">50-60 lbs</td>
                      <td className="py-2 px-2 border-r border-gray-300">61-78 lbs</td>
                      <td className="py-2 px-2 border-r border-gray-300">79-88 lbs</td>
                      <td className="py-2 px-2 border-r border-gray-300">89-99 lbs</td>
                      <td className="py-2 px-2">100-110 lbs</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-2 px-2 font-bold border-r border-gray-300 bg-gray-50">HEIGHT</td>
                      <td className="py-2 px-2 border-r border-gray-300">20-21 in</td>
                      <td className="py-2 px-2 border-r border-gray-300">22-23 in</td>
                      <td className="py-2 px-2 border-r border-gray-300">24-26 in</td>
                      <td className="py-2 px-2 border-r border-gray-300">27-30 in</td>
                      <td className="py-2 px-2">31-33 in</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-bold border-r border-gray-300 bg-gray-50">LENGTH</td>
                      <td className="py-2 px-2 border-r border-gray-300">4.3-4.4 ft</td>
                      <td className="py-2 px-2 border-r border-gray-300">4.5-4.9 ft</td>
                      <td className="py-2 px-2 border-r border-gray-300">5.0-5.5 ft</td>
                      <td className="py-2 px-2 border-r border-gray-300">5.6-5.8 ft</td>
                      <td className="py-2 px-2">5.9-6.0 ft</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Coloration */}
              <h4 id="coloration" className="font-bold mb-2 mt-6 scroll-mt-4">Coloration</h4>
              
              <p>
                Despite the name, gray wolves aren't just gray - they can be found in a wide 
                variety of fur colors. Some wolves' coats are just one solid color, while others' 
                contain blends of colors with markings. A wide spectrum of colors is available 
                for wolves' coats, though any variation of these should be kept as realistic 
                looking as possible.
              </p>
              
              <p>
                Note: Copper and ginger colors featuring orange hues should be desaturated or 
                contain enough brown to look natural. If you are uncertain about your wolf's 
                intended colors, please reach out to Staff!
              </p>
              
              <div className="my-4">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/coatcolors2.jpg" 
                  alt="Wolf Coat Colors" 
                  className="w-full max-w-2xl mx-auto"
                />
              </div>
              
              <p>
                In the real world, wolves have amber eyes, but some have gray, green, or even 
                blue eyes. Blue and green eyes are rarer - green are hardly encountered in the 
                real world - but for the sake of our roleplay, we allow these colors of eyes to 
                increase diversity*. Besides, it's more fun to have a wolf with cool-colored eyes. 
                Thus, your character's eyes may be a unique mix of two of the following colors 
                if you're feeling fancy:
              </p>
              
              <div className="my-4">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/eyecolors.jpg" 
                  alt="Wolf Eye Colors" 
                  className="w-full max-w-2xl mx-auto"
                />
              </div>
              
              <p>
                Major manipulation of wolf photos into unnatural or jarring markings is no 
                longer permitted on Horizon. While color changes that do not move into unnatural territory (see above), 
                natural markings, and minor or subtle unique markings are still allowed, anything 
                that drastically takes the wolf outside of what might be found in nature will be 
                declined. Staff will take edits into consideration on a case-by-case basis, in 
                which the quality of the manipulation and how natural it appears may affect the 
                final decision. Any wolves with extreme markings previously in play as of January 10th, 2018 are exempt from this rule, though future offspring of these exempt wolves will 
                be required to follow the new standard.
              </p>
              
              <p>
                *In order to try to preserve realism, we don't allow characters with pink, 
                purple, or red eyes.
              </p>
              
              <p>
                *We no longer accept albino wolves due to rarity and no known instance of albino 
                wolves in real life.
              </p>
              
              <p>
                If you have any questions about character design, feel free to bring it up with 
                staff.
              </p>

          {/* PACKS */}
          <h3 id="packs" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8 scroll-mt-4">Packs</h3>
          
          {/* Overview */}
          <h4 className="font-bold mb-2 mt-4">Overview</h4>
          
          <p>
            In Horizon, packs are created in character. There are currently ten <Link to="/wiki/pack-creation" className="font-bold">packs in Horizon</Link>. For information about how packs are created, check out the <Link to="/wiki/pack-creation" className="font-bold">Pack Creation</Link> wiki page.
          </p>
          
          <p>
            A pack must have at least four members, but there is no upper limit to the 
            amount of wolves a pack can have. They start out with one subarea, which they can 
            either claim or create themselves, and are limited to as many subareas as they can 
            control. For example, a pack with four members will likely not be able to 
            reliably defend more than one subarea if their claim to it is challenged.
          </p>
          
          {/* Ranks */}
          <h4 className="font-bold mb-2 mt-6">Ranks</h4>
          
          <p>
            Ranks in Horizon are comprised of two parts: position (a Roman numeral) and title (like "leader" or "hunter"). Example: "I. Alpha" or "III. Hunter"
          </p>
          
          <p>
            <strong>Positions</strong>— Wolves in packs are ranked according to numerical order in Roman numerals. The 
            highest-ranked wolf or wolves will hold a rank of "I," the next lowest "II," and 
            so on. These position rankings typically convey the order of 
            dominance/leadership within the pack, though they may carry other connotations based on each pack's 
            unique hierarchial structure.
          </p>
          
          <p>
            <strong>Titles</strong>— In addition to position in the pack, ranks also carry titles, such as "leader" 
            or "pupsitter." Titles often carry meaning based on that wolf's role in the pack. 
            Titles can be descriptive (such as "ambassador"), but they may also carry 
            abstract names. Pack founders/leaders are free to change their pack's titles as they 
            see fit, and may determine structure as necessary.
          </p>
          
          {/* Challenges */}
          <h4 className="font-bold mb-2 mt-6">Challenges</h4>
          
          <p>
            Challenges occur when a wolf wishes to rise in his pack's ranks. A challenge can 
            be anything from a verbal conversation to a full-blown fight— the terms depend 
            on any pack policies regarding challenges, as well as the 
            challenger/challengee's individual personalities. As per <Link to="/wiki/rules-general" className="font-bold">Horizon rules</Link>, all rank challenges must be responded to within three OOC days unless the 
            character being challenged has already been placed on absence. Any rank (including 
            leadership) in any pack may be challenged.
          </p>
          
          {/* Borders */}
          <h4 className="font-bold mb-2 mt-6">Borders, marking, and pack etiquette</h4>
          
          <p>
            A wolf pack marks the boundaries of its territory by spraying scent (urine) on 
            trees, rocks, or other objects of interest. In this roleplay, it is to be assumed 
            that all pack territories have already been marked by their respective leaders, 
            so marking in posts is encouraged, but not required. In Horizon, as in most 
            other wolf roleplays, the scent of a pack is descriptive of that pack's numbers, 
            setting, and other traits.
          </p>
          
          <p>
            Most wolves in the real world try to avoid venturing into other packs' territory 
            as much as possible - instinct tells them that they'll probably be killed for 
            straying into terrain owned by someone else. However, in this roleplay, our 
            wolves are personified as creatures who harbor emotion and have complex histories. 
            Since our wolves will have grudges, vengeful thoughts, or, on the other hand, 
            alliances or other positive bonds, interpack relations will depend on the motives of 
            our characters. This does not mean our characters will completely abandon 
            respect, though.
          </p>
          
          <p>
            To respect your neighboring pack, wait at the border until you are greeted. Be 
            respectful to your greeter, for once you are standing even an inch within their 
            territory boundaries, you are in their jaws. Wandering in others' territory is 
            not a wise idea - however, some characters may make exceptions: for example, a 
            pack leader who finds his sister wandering through his woods might welcome her 
            warmly instead of tearing her limb from limb. However, you are free to try your luck 
            wandering in a pack territory if you are willing to risk your character's life! 
            In our roleplay, some packs are more peaceful than others, and may treat 
            trespassers differently.
          </p>

          {/* REPRODUCTION */}
          <h3 id="reproduction" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8 scroll-mt-4">Reproduction</h3>
          
          {/* Forming pairs */}
          <h4 className="font-bold mb-2 mt-4">Forming pairs</h4>
          
          <p>
            Instincts drive real wild wolves to form pairs and mate; in this roleplay, our 
            characters have more complex emotions and drives as if they are humans falling in 
            love. That said, although wolves have long been considered monogamous (as in, 
            they mate for life), this is not always the case. Wolves are about as monogamous 
            (or, in some cases, non-monogamous) as humans are. Sometimes, a pair will mate 
            for life, where other times, a male may breed with two or three different females 
            over the course of his lifetime.
          </p>
          
          <p>
            Before wolves mate, they pair up with a partner of the opposite sex in whom they 
            have begun to take interest. The two wolves, a male and a female, will, night 
            by night, sleep closer together and begin to show loving signs of affection such 
            as nuzzles, cuddling, and so on. This may occur before the wolves reach sexual 
            maturity.
          </p>
          
          <p>
            Although this is different in all wolves, some are physically capable of 
            reproduction by 1.5 years (1 year, 6 months) of age at the absolute earliest.
          </p>
          
          {/* Mating */}
          <h4 className="font-bold mb-2 mt-6">Mating</h4>
          
          <p>
            Mating season begins in Early Winter and ends in Late Winter.
          </p>
          
          <p>
            If she has reached sexual maturity, the female will go into heat for 
            approximately 2 weeks between Early Winter and Late Winter. During this time she often 
            travels with her mate nearby, and when they are alone, mating occurs.* Pairs about 
            to mate will often run off into a secluded area to avoid harassment from other 
            pack members. Mating in wolves occurs as it does in dogs.
          </p>
          
          <p>
            *Don't roleplay this out - you can just sort of "time warp" to after it has 
            happened.
          </p>
          
          {/* Dens */}
          <h4 className="font-bold mb-2 mt-6">Dens</h4>
          
          <p>
            Contrary to popular belief, wolves do not reside in dens year round. A family 
            will begin preparing a den (or multiple dens in case one is flooded or otherwise 
            becomes unusable) as soon as a mother begins expecting pups. When her litter is 
            born, she and the pups live in the den for eight weeks - after this, the den is 
            abandoned.
          </p>

          {/* MATERNITY */}
          <h3 id="maternity" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8 scroll-mt-4">Maternity</h3>
          
          <div className="my-4">
            <a 
              href="https://taiyaefiles.blob.core.windows.net/web/nnOO3iw.jpg" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                setShowMaternityModal(true);
              }}
              className="cursor-pointer"
            >
              <img 
                src="https://taiyaefiles.blob.core.windows.net/web/nnOO3iw.jpg" 
                alt="Maternity Timeline - Click to enlarge" 
                className="w-full max-w-2xl mx-auto hover:opacity-90 transition-opacity"
              />
            </a>
            <p className="text-center text-gray-500 text-xs mt-1">Click image to enlarge</p>
          </div>
          
          <p>
            After the heat ends and the female has successfully conceived, she will undergo 
            several bodily changes, especially beginning in her third week. (It's virtually 
            impossible for wolves to detect pregnancy before this point!)
          </p>
          
          <p>
            The gestation period in wolves is about 63 days (two months). Pups are born any 
            time from Early Spring to Late Spring, with the exception of litters dangerously 
            conceived before or after mating season officially began.
          </p>
          
          <p>
            Following early pup care, wolves generally exist in a low hormonal state from 
            summer to late autumn and cannot conceive a litter until the next winter.
          </p>
          
          <p>
            <strong>Important:</strong> Wolves may only become pregnant in-character. You may not join Horizon with a 
            pregnant wolf.
          </p>

          {/* PUP DEVELOPMENT */}
          <h3 id="pup-development" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8 scroll-mt-4">Pup Development</h3>
          
          <p>
            See the <Link to="/wiki/wolf-guide-pup-development" className="font-bold">Pup Development Guide</Link> for guidelines for playing pup characters as they age.
          </p>
          
          <p>
            Litters usually consist of 4-6 pups - this is quite a large number of pups to 
            play out, so for the purpose of our roleplay, wolves in Horizon will usually birth 
            litters of 2-4 pups. The size of the litter is randomized by staff, who will 
            perform a die roll to determine the number and gender of pups. Health of the 
            parents and other factors may affect litter size.
          </p>
          
          <p>
            Wolves may not reach full physical and emotional maturity - comparable to a 25 
            or 30 year old human - until about four or five years of age. However, they may 
            reach sexual maturity much earlier, at one or two years of age.
          </p>
          
          <p>
            <strong>Important:</strong> Pups 6 months or younger cannot enter horizon. Characters not born in Horizon 
            in-character must be 7 months or older. Since young pups wouldn't realistically 
            be able to survive a journey through, say, Eastern Wasteland, this ensures a 
            logical chance of having survived to get here.
          </p>
          
          <p>
            Think the Wolf Guide is missing some information, or do you have any questions? 
            PM Staff about it! We'd love to expand the wolf guide based on your suggestions.
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

      {/* Maternity Modal */}
      {showMaternityModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowMaternityModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowMaternityModal(false)}
              className="absolute -top-10 right-0 text-white text-xl hover:text-gray-300"
            >
              ✕ Close
            </button>
            <img 
              src="https://taiyaefiles.blob.core.windows.net/web/nnOO3iw.jpg" 
              alt="Maternity Timeline" 
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default WolfGuide;
