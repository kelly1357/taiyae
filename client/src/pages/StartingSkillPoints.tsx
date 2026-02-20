import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { User, Character } from '../types';

interface StartingSpInfo {
  characterId: number;
  name: string;
  surname?: string;
  monthsAge: number;
  totalAllowed: number;
  hasClaimed: boolean;
  experience: number;
  physical: number;
  knowledge: number;
}

const StartingSkillPoints: React.FC = () => {
  const { user, activeCharacter, userCharacters } = useOutletContext<{
    user?: User;
    activeCharacter?: Character;
    userCharacters?: Character[];
  }>();

  const [info, setInfo] = useState<StartingSpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Allocation state
  const [experience, setExperience] = useState(0);
  const [physical, setPhysical] = useState(0);
  const [knowledge, setKnowledge] = useState(0);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const totalAllocated = experience + physical + knowledge;
  const totalAllowed = info?.totalAllowed || 100;
  const remaining = totalAllowed - totalAllocated;

  // Fetch starting SP info for active character
  useEffect(() => {
    if (!activeCharacter) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const token = localStorage.getItem('token');
    fetch(`/api/starting-skill-points/${activeCharacter.id}`, {
      headers: { 'X-Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch starting SP info');
        return res.json();
      })
      .then((data: StartingSpInfo) => {
        setInfo(data);
        // Reset allocation
        setExperience(0);
        setPhysical(0);
        setKnowledge(0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeCharacter?.id]);

  const handleSliderChange = (category: 'experience' | 'physical' | 'knowledge', value: number) => {
    const setters = { experience: setExperience, physical: setPhysical, knowledge: setKnowledge };
    const values = { experience, physical, knowledge };
    
    // Calculate what the other two categories currently use
    const otherTotal = Object.entries(values)
      .filter(([key]) => key !== category)
      .reduce((sum, [, val]) => sum + val, 0);
    
    // Clamp to not exceed total
    const maxForThis = totalAllowed - otherTotal;
    const clamped = Math.min(value, maxForThis);
    setters[category](Math.max(0, clamped));
  };

  const handleSubmit = async () => {
    if (!activeCharacter || !info || remaining !== 0) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/starting-skill-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: activeCharacter.id,
          experience,
          physical,
          knowledge
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ success: true, message: data.message });
        setShowConfirm(false);
        // Update local info to reflect claimed status
        setInfo(prev => prev ? { ...prev, hasClaimed: true } : null);
      } else {
        const errText = await response.text();
        setResult({ success: false, message: errText || 'Failed to submit' });
        setShowConfirm(false);
      }
    } catch (err) {
      setResult({ success: false, message: 'An error occurred' });
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter to characters that haven't claimed yet
  const unclaimedCharacters = (userCharacters || []).filter(
    c => !c.hasClaimedStartingSP && c.status === 'Active'
  );

  if (!user) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Starting Skill Points</h2>
        </div>
        <div className="px-6 py-6 text-center text-gray-600 text-sm">
          Please log in to claim starting skill points.
        </div>
      </section>
    );
  }

  if (!activeCharacter) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Starting Skill Points</h2>
        </div>
        <div className="px-6 py-6 text-center text-gray-600 text-sm">
          You need a character to claim starting skill points. Create one in <Link to="/my-characters" className="text-[#2f3a2f] hover:underline font-medium">Character Management</Link>.
        </div>
      </section>
    );
  }

  const isPup = info ? info.monthsAge < 12 : (activeCharacter.monthsAge || 0) < 12;

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Starting Skill Points</h2>
      </div>

      <div className="px-6 py-6">
        {/* Intro text */}
        <div className="mb-6 text-sm text-gray-700 space-y-2">
          <p>
            Each adult wolf starts with <strong>100 skill points</strong> to distribute between Experience, Physical, and Knowledge.
            Pups (under 12 months) start with <strong>50 skill points</strong>.
          </p>
          <p className="text-red-600 font-medium text-xs">
            ⚠ This claim is <strong>permanent</strong> and cannot be changed once submitted. Choose carefully!
          </p>
        </div>

        {/* Unclaimed characters notice */}
        {unclaimedCharacters.length > 1 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
            You have {unclaimedCharacters.length} characters that haven't claimed starting SP yet.
            Use the character selector in the header to switch between them.
          </div>
        )}

        {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}
        {error && <div className="text-center py-8 text-red-500">{error}</div>}

        {info && (
          <div>
            {/* Character info header */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 border border-gray-200">
              {activeCharacter.imageUrl && (
                <img
                  src={activeCharacter.imageUrl}
                  alt={activeCharacter.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div>
                <div className="font-semibold text-gray-900 capitalize">
                  {activeCharacter.name}{activeCharacter.surname ? ` ${activeCharacter.surname}` : ''}
                </div>
                <div className="text-xs text-gray-500">
                  {activeCharacter.age} • {isPup ? 'Pup' : 'Adult'} • {totalAllowed} SP to claim
                </div>
              </div>
              {info.hasClaimed && (
                <span className="ml-auto px-2 py-1 text-xs font-bold uppercase bg-green-100 text-green-700 border border-green-300">
                  ✓ Claimed
                </span>
              )}
            </div>

            {info.hasClaimed ? (
              /* Already claimed — show locked status */
              <div className="text-center py-6">
                <div className="text-green-600 text-lg mb-2">✓</div>
                <p className="text-sm text-gray-700 mb-4">
                  Starting skill points have already been claimed for this character.
                </p>
                <div className="inline-flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xs uppercase text-gray-500 font-semibold">Experience</div>
                    <div className="text-lg font-bold text-gray-900">{info.experience}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs uppercase text-gray-500 font-semibold">Physical</div>
                    <div className="text-lg font-bold text-gray-900">{info.physical}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs uppercase text-gray-500 font-semibold">Knowledge</div>
                    <div className="text-lg font-bold text-gray-900">{info.knowledge}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">This cannot be changed.</p>
              </div>
            ) : (
              /* Allocation UI */
              <div>
                {/* Remaining counter */}
                <div className={`text-center mb-6 p-3 border ${remaining === 0 ? 'bg-green-50 border-green-200 text-green-700' : remaining < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <span className="text-2xl font-bold">{remaining}</span>
                  <span className="text-sm ml-1">points remaining</span>
                </div>

                {/* Sliders */}
                <div className="space-y-6 mb-8">
                  {/* Experience */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Experience</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSliderChange('experience', experience - 5)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded"
                          disabled={experience <= 0}
                        >−</button>
                        <input
                          type="number"
                          min={0}
                          max={totalAllowed}
                          value={experience}
                          onChange={(e) => handleSliderChange('experience', parseInt(e.target.value) || 0)}
                          className="w-16 text-center border border-gray-300 text-sm py-1 text-black"
                        />
                        <button
                          type="button"
                          onClick={() => handleSliderChange('experience', experience + 5)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded"
                          disabled={remaining <= 0}
                        >+</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Meeting new wolves, exploring new areas
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={totalAllowed}
                      value={experience}
                      onChange={(e) => handleSliderChange('experience', parseInt(e.target.value))}
                      className="w-full accent-[#2f3a2f]"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0</span>
                      <span>{totalAllowed}</span>
                    </div>
                  </div>

                  {/* Physical */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Physical</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSliderChange('physical', physical - 5)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded"
                          disabled={physical <= 0}
                        >−</button>
                        <input
                          type="number"
                          min={0}
                          max={totalAllowed}
                          value={physical}
                          onChange={(e) => handleSliderChange('physical', parseInt(e.target.value) || 0)}
                          className="w-16 text-center border border-gray-300 text-sm py-1 text-black"
                        />
                        <button
                          type="button"
                          onClick={() => handleSliderChange('physical', physical + 5)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded"
                          disabled={remaining <= 0}
                        >+</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Hunting, fighting, sparring, performing difficult physical tasks
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={totalAllowed}
                      value={physical}
                      onChange={(e) => handleSliderChange('physical', parseInt(e.target.value))}
                      className="w-full accent-[#2f3a2f]"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0</span>
                      <span>{totalAllowed}</span>
                    </div>
                  </div>

                  {/* Knowledge */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Knowledge</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSliderChange('knowledge', knowledge - 5)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded"
                          disabled={knowledge <= 0}
                        >−</button>
                        <input
                          type="number"
                          min={0}
                          max={totalAllowed}
                          value={knowledge}
                          onChange={(e) => handleSliderChange('knowledge', parseInt(e.target.value) || 0)}
                          className="w-16 text-center border border-gray-300 text-sm py-1 text-black"
                        />
                        <button
                          type="button"
                          onClick={() => handleSliderChange('knowledge', knowledge + 5)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded"
                          disabled={remaining <= 0}
                        >+</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Healing, training for non-fighting roles, learning information
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={totalAllowed}
                      value={knowledge}
                      onChange={(e) => handleSliderChange('knowledge', parseInt(e.target.value))}
                      className="w-full accent-[#2f3a2f]"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0</span>
                      <span>{totalAllowed}</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="border border-gray-200 mb-6">
                  <div className="bg-gray-100 px-4 py-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">Claim Summary</h3>
                  </div>
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Experience</td>
                          <td className="py-2 text-right font-semibold text-gray-900">{experience}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Physical</td>
                          <td className="py-2 text-right font-semibold text-gray-900">{physical}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Knowledge</td>
                          <td className="py-2 text-right font-semibold text-gray-900">{knowledge}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-900 font-bold">Total</td>
                          <td className={`py-2 text-right font-bold ${totalAllocated === totalAllowed ? 'text-green-600' : 'text-red-600'}`}>
                            {totalAllocated} / {totalAllowed}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={remaining !== 0 || totalAllocated === 0}
                    className="px-6 py-2 bg-[#2f3a2f] text-white hover:bg-[#3a4a3a] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lock In Skill Points
                  </button>
                </div>

                {/* Result message */}
                {result && (
                  <div className={`mt-4 p-3 text-sm ${result.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {result.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg max-w-md w-full">
            <div className="bg-[#2f3a2f] px-4 py-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Confirm Claim</h4>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to lock in these skill points? <strong className="text-red-600">This cannot be undone.</strong>
              </p>
              <div className="bg-gray-50 border border-gray-200 p-3 mb-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-semibold">{experience}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Physical:</span>
                  <span className="font-semibold">{physical}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Knowledge:</span>
                  <span className="font-semibold">{knowledge}</span>
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t border-gray-300">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">{totalAllocated}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-[#2f3a2f] text-white hover:bg-[#3a4a3a] text-sm disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Yes, Lock It In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StartingSkillPoints;
