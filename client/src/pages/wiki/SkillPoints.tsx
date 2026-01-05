import React from 'react';
import { Link } from 'react-router-dom';

const SkillPoints: React.FC = () => {
  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
      </div>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/wiki/handbook" className="hover:underline">Wiki</Link>
          <span className="mx-2">›</span>
          <span>Skill Points</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Skill Points</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-none text-gray-800 text-xs">
              <p className="mb-4">
                Skill Points are divided into categories: physical (gained from hunting, 
                fighting, sparring, or performing difficult tasks), experience (meeting new wolves, 
                exploring new areas, performing pack-related duties), and knowledge (healing, 
                training for non-fighting roles). A wolf's points in these categories determine 
                his/her respective skills in each category.
              </p>

              {/* How to Claim Skill Points */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                How to Claim Skill Points
              </h3>
              
              <p className="mb-4">
                Each adult wolf starts out with 100 skill points (pups start with 50). You can divide these points up based on where your wolf's 
                strengths lie. To claim initial skill points, use the link in the sidebar, or 
                visit the <strong>Starting SP Claim</strong> form directly.
              </p>
              
              <p className="mb-2">To claim skill points for a thread:</p>
              
              <ol className="list-decimal list-inside mb-4 space-y-2">
                <li>
                  <strong>Make sure the thread is finished.</strong> Skill points cannot be claimed for dead or in-progress threads.
                </li>
                <li>
                  <strong>Archive the thread.</strong> Use the "Archive" button at the top of a thread to close it and move it to the 
                  IC Archives. You must be the thread creator to do this— if you're not, ask the 
                  person who created the thread (or staff) to do it for you.
                </li>
                <li>
                  <strong>Claim your skill points.</strong> Visit the <strong>Points Claim page</strong> and fill out the form. Use the drop-down boxes to add a row to the table for 
                  each point-worthy action your wolf performed in the thread. You also get 20 
                  Experience skill points just for completing the thread.
                </li>
                <li>
                  <strong>Wait for your request to be reviewed.</strong> Points Claim requests are moderated by staff. Someone will approve your request 
                  if everything looks in order, or contact you if something's wrong.
                </li>
                <li>
                  <strong>Review your request/bask in the glow of your new points.</strong> Check your <strong>Threadlog</strong> (which lists the skill points you earned in each thread) to make sure 
                  everything worked okay, and that your totals look right. If there's been an error, PM 
                  Admin!
                </li>
              </ol>

              {/* Skill Point Descriptions and Breakdown */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Skill Point Descriptions and Breakdown
              </h3>

              {/* Complete Threads */}
              <h4 className="font-semibold mb-2 mt-6">COMPLETE THREADS</h4>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Complete a thread</strong><br />
                      <span className="text-gray-600">Finished threads only (dead threads don't count!). Must be at least 10 posts in length.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                </tbody>
              </table>

              {/* Exploring */}
              <h4 className="font-semibold mb-2 mt-6">EXPLORING</h4>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Visit a new area</strong><br />
                      <span className="text-gray-600">Finish your wolf's first thread in a new area.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Discover a new area</strong><br />
                      <span className="text-gray-600">Finish a thread that takes place in an as-yet undiscovered territory. To achieve this, be descriptive and thorough in describing the terrain, location, etc. These points will be awarded once the territory is officially created. More about discovering and creating areas</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">40</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">40</td>
                  </tr>
                </tbody>
              </table>

              {/* Meeting Someone New */}
              <h4 className="font-semibold mb-2 mt-6">MEETING SOMEONE NEW</h4>
              <p className="mb-2 text-gray-600">Finish a thread with a wolf your character has met for the first time.</p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Meet a new wolf</strong><br />
                      <span className="text-gray-600">Any interaction where names or dialogue are exchanged counts as a meeting. Add one additional instance of this for each new wolf met in the thread.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                </tbody>
              </table>

              {/* Learning Information */}
              <h4 className="font-semibold mb-2 mt-6">LEARNING INFORMATION</h4>
              <p className="mb-2 text-gray-600">
                As the plot thickens, your wolf will likely learn at least one or two new 
                tidbits of information in each thread. Mentions of offscreen wolves, territories, or 
                plot events count for points in this category, as does regional or setting 
                information and healing or hunting-related knowledge.
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Gain important knowledge</strong><br />
                      <span className="text-gray-600">Add one instance for each new thing learned.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                  </tr>
                </tbody>
              </table>

              {/* Performing Duties */}
              <h4 className="font-semibold mb-2 mt-6">PERFORMING DUTIES</h4>
              <p className="mb-2 text-gray-600">For pack wolves only.</p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Perform a pack duty</strong><br />
                      <span className="text-gray-600">This can be hunting, protecting the borders, or whatever else your wolf's role in the pack entails. For wolves with clearly defined roles (e.g. hunter), this should be specific to the role, but any action that benefits the pack (e.g. adding to the pack's cache even if you aren't a hunter) can also be included.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                </tbody>
              </table>

              {/* Training */}
              <h4 className="font-semibold mb-2 mt-6">TRAINING</h4>
              <p className="mb-2 text-gray-600">
                Receive training (verbal instruction or physical demonstration) from a wolf. 
                Training must involve two or more wolves (solo training doesn't count).
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Receive fight training</strong><br />
                      <span className="text-gray-600">If the training session involves a spar, also claim points from the sparring section. Each wolf receiving training should only claim one instance of this per session.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Train someone in fighting</strong><br />
                      <span className="text-gray-600">If the training session involves a spar, also claim points from the sparring section. Claim one instance of this for each wolf your character trains during the session.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Receive healing training</strong><br />
                      <span className="text-gray-600">If the training involves healing work, also claim points from the healing section. Each wolf receiving training should only claim one instance of this per session.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Train someone in healing</strong><br />
                      <span className="text-gray-600">If the training session involves healing work, also claim points from the healing section. Claim one instance of this for each wolf your character trains during the session.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Receive hunt training</strong><br />
                      <span className="text-gray-600">If the training involves an actual hunt, also claim points from the hunting section. Each wolf receiving training should only claim one instance of this per session.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Train someone in hunting</strong><br />
                      <span className="text-gray-600">If the training session involves an actual hunt, also claim points from the hunting section. Claim one instance of this for each wolf your character trains during the session.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                  </tr>
                </tbody>
              </table>

              {/* Sparring */}
              <h4 className="font-semibold mb-2 mt-6">SPARRING</h4>
              <p className="mb-2 text-gray-600">
                Participate in a spar (must be at least 6 posts per wolf of sparring activity). 
                Add one instance per wolf your character actively spars. Forfeiture counts as a 
                loss.
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Win a spar vs. a higher-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a higher Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">30</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Win a spar vs. a lower-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a lower Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Lose a spar vs. a higher-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a higher Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">25</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Lose a spar vs. a lower-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a lower Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Draw in a spar vs. a higher-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a higher Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Draw in a spar vs. a lower-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a lower Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                  </tr>
                </tbody>
              </table>

              {/* Fighting */}
              <h4 className="font-semibold mb-2 mt-6">FIGHTING</h4>
              <p className="mb-2 text-gray-600">
                Participate in a fight. In one vs one fights, each wolf must post at least four 
                times. In multi-opponent fights, each wolf must post at least three times, per opponent. Add one claim per wolf your character actively fights. Forfeiture counts as a 
                loss.
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Win a fight vs. a higher-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a higher Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">30</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">45</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Win a fight vs. a lower-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a lower Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">30</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">40</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Lose a fight vs. a higher-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a higher Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">25</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Lose a fight vs. a lower-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a lower Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Draw in a fight vs. a higher-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a higher Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Draw in a fight vs. a lower-skilled opponent</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each opponent with a lower Physical skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                </tbody>
              </table>

              {/* Killing */}
              <h4 className="font-semibold mb-2 mt-6">KILLING</h4>
              <p className="mb-2 text-gray-600">
                Kill another wolf, whether during a fight or not. The character must officially 
                die for this to count. For kills that take place during a fight, also claim 
                points from the fighting section.
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Kill a higher-skilled wolf</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each victim with a higher overall skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">25</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">25</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Kill a lower-skilled wolf</strong><br />
                      <span className="text-gray-600">Claim one instance of this per each victim with a lower overall skill level than your wolf.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                </tbody>
              </table>

              {/* Tracking */}
              <h4 className="font-semibold mb-2 mt-6">TRACKING</h4>
              <p className="mb-2 text-gray-600">
                Use your wolf's tracking skills to locate prey, herbs, or other wolves.
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Track a prey animal</strong><br />
                      <span className="text-gray-600">Your wolf needs to actually find the prey animal for this to count. Must include three posts of actual tracking activity. If this takes place as part of a hunt, also claim points in the hunting section.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Track another wolf</strong><br />
                      <span className="text-gray-600">Your wolf does not need to actually find the other wolf for this to count, but should find them eventually in another thread. Must include five posts per thread of actual tracking activity.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">25</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Track down an herb</strong><br />
                      <span className="text-gray-600">Your wolf does need to actually find the plant in question for this to count. Must include three posts per thread of actual tracking activity.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                </tbody>
              </table>

              {/* Hunting */}
              <h4 className="font-semibold mb-2 mt-6">HUNTING</h4>
              <p className="mb-2 text-gray-600">
                Hunts do not have to be successful to count, but need to meet post minimums per 
                prey animal (see below). If the hunt includes tracking, also claim points from 
                the tracking section. A group hunt is two or more wolves. Claim one instance per 
                prey animal that your wolf personally helped hunt.
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Solo hunt: small prey</strong><br />
                      <span className="text-gray-600">Does not count for prey caught before a thread starts. 5 post minimum per prey animal.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Participate in group hunt: small prey</strong><br />
                      <span className="text-gray-600">Does not count for prey caught before a thread starts. 5 post minimum total per prey animal (so if there are two wolves hunting one rabbit, they need to make 5 hunting posts between the two of them).</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Lead group hunt: small prey</strong><br />
                      <span className="text-gray-600">If your wolf led the hunt, claim one instance of this in addition to "Participate in group hunt: small prey."</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Participate in group hunt: large prey</strong><br />
                      <span className="text-gray-600">Deer and larger. 10 posts minimum total per prey animal (so, in a pack hunt for example, three wolves may collectively make 10 posts to bring down a large prey animal). For pups, observing counts as hunt training (see Training section above).</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">25</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">35</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Lead group hunt: large prey</strong><br />
                      <span className="text-gray-600">If your wolf led the hunt, claim one instance of this in addition to "Participate in group hunt: large prey."</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">25</td>
                  </tr>
                </tbody>
              </table>

              {/* Healing */}
              <h4 className="font-semibold mb-2 mt-6">HEALING</h4>
              <p className="mb-2 text-gray-600">
                Must involve at least five posts of healing activity. Treatments with no 
                noticeable difference in outcome count as failing (there is only success or failure, no 
                in-between). If your wolf learns important information during healing (such as 
                the effects of certain herbs), claim an instance of "Gain important knowledge" 
                for each thing learned. If the healing is part of training, also claim points 
                from the training section.
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Successfully treat major injury</strong><br />
                      <span className="text-gray-600">Major injuries are urgent or potentially life-threatening (e.g. broken limbs). Successful treatment involves a noticeable improvement in the well-being of the patient.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">30</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">45</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Fail in treating major injury</strong><br />
                      <span className="text-gray-600">Failing includes treatments with no noticeable improvement, or making the injury or related symptoms worse. If the wolf dies due to this failure, still claim points for this section, and also claim points from the Killing section.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">30</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Successfully treat minor injury</strong><br />
                      <span className="text-gray-600">Minor injuries are not immediately life-threatening and may heal on their own (e.g. cuts or sprains). Success includes speeding up recovery or reducing pain.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">30</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Fail in treating minor injury</strong><br />
                      <span className="text-gray-600">Failure includes treatments with no noticeable improvement, or making the injury or related symptoms worse. If the minor injury turns into a major injury due to this failure, still claim an instance of this.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">5</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Successfully treat illness</strong><br />
                      <span className="text-gray-600">Major and minor illnesses both count in this category. Success involves a noticeable improvement in the patient's well-being. If the illness is a symptom of a major injury, claim points for treating a major injury instead.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">15</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">35</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Fail in treating illness</strong><br />
                      <span className="text-gray-600">Failure includes treatments with no noticeable improvement, or making the symptoms worse. If the illness becomes life threatening due to this failure, still claim an instance of this.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">10</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">20</td>
                  </tr>
                </tbody>
              </table>

              {/* Saving a Life */}
              <h4 className="font-semibold mb-2 mt-6">SAVING A LIFE</h4>
              <p className="mb-2 text-gray-600">
                This category is currently broken :( In the future, you will be able to claim an 
                additional 50E for saving a life.
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1 text-center text-gray-400" colSpan={5}>
                      <em>Coming soon...</em>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Major Life Events */}
              <h4 className="font-semibold mb-2 mt-6">MAJOR LIFE EVENTS (MLES)</h4>
              <p className="mb-2 text-gray-600">
                The big things that happen in your character's life, something that changes the 
                course of his personal story. <strong>PM Admin</strong> if your wolf experiences a MLE that isn't on this list!
              </p>
              <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ACTION</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">E</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">P</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">K</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Give birth/have puppies</strong><br />
                      <span className="text-gray-600">Claim one instance of this for each litter for which your wolf was a progenitor.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Personal trauma</strong><br />
                      <span className="text-gray-600">Claim one instance of this for each personal trauma your wolf experiences (in-game only). Personal traumas are events likely to have long term, character-shaping effects!</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Death of a friend or a close relation</strong><br />
                      <span className="text-gray-600">Claim one instance of this for the death of any friend, relative, or other relation your wolf learns of (in-game characters only).</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">
                      <strong>Joining or starting a pack</strong><br />
                      <span className="text-gray-600">Claim one instance of this anytime your character joins a pack. For wolves who successfully start a pack, claim one additional instance of this.</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">0</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">50</td>
                  </tr>
                </tbody>
              </table>

              {/* Categories */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 mb-2">Categories:</h4>
                <p className="text-xs">
                  • <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Handbook</Link>
                </p>
              </div>
            </div>
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

export default SkillPoints;
