import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const SkillPoints: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/skillpoints')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch skill points');
        return res.json();
      })
      .then(data => {
        setRows(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Group rows by Category
  type SkillRow = {
    SkillID: number;
    Category: string;
    CategoryDescription?: string;
    Action?: string;
    ActionDescription?: string;
    E?: number;
    P?: number;
    K?: number;
    TOTAL?: number;
  };
  const grouped: Record<string, SkillRow[]> = rows.reduce((acc: Record<string, SkillRow[]>, row: SkillRow) => {
    if (!acc[row.Category]) acc[row.Category] = [];
    acc[row.Category].push(row);
    return acc;
  }, {});

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

              {loading && <div className="my-8 text-center text-gray-500">Loading skill points...</div>}
              {error && <div className="my-8 text-center text-red-500">{error}</div>}
              {!loading && !error && Object.entries(grouped).map(([category, items]) => (
                <React.Fragment key={category}>
                  <h4 className="font-semibold mb-2 mt-6">{category}</h4>
                  {items[0]?.CategoryDescription && (
                    <p className="mb-2 text-gray-600">{items[0].CategoryDescription}</p>
                  )}
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
                      {items.map((row: SkillRow, idx: number) => (
                        <tr key={row.SkillID || idx}>
                          <td className="border border-gray-300 px-2 py-1">
                            {row.Action ? (
                              <>
                                <strong>{row.Action}</strong><br />
                                <span className="text-gray-600">{row.ActionDescription}</span>
                              </>
                            ) : (
                              <span className="text-gray-400 italic">{row.ActionDescription || <em>Coming soon...</em>}</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">{row.E ?? ''}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">{row.P ?? ''}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">{row.K ?? ''}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">{row.TOTAL ?? ''}</td>
                        </tr>
                      ))}
                      {/*
                        ...SkillPoints tables and sections commented out...
                      */}
                    </tbody>
                  </table>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillPoints;