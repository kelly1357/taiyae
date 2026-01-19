import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { User } from '../types';

interface SkillPointAssignment {
  AssignmentID: number;
  CharacterID: number;
  CharacterSlug?: string;
  SkillPointID: number;
  ThreadID: number;
  CharacterName: string;
  CharacterSurname?: string;
  AvatarImage: string;
  SkillAction: string;
  E: number;
  P: number;
  K: number;
  ThreadTitle: string;
  IsDuplicate: number;
}

const SkillPointsApproval: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const [assignments, setAssignments] = useState<SkillPointAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/skill-points-approval');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleApprove = async (assignmentId: number) => {
    setApproving(assignmentId);
    try {
      const response = await fetch('/api/skill-points-approval/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId })
      });
      
      if (response.ok) {
        // Remove from list
        setAssignments(prev => prev.filter(a => a.AssignmentID !== assignmentId));
      } else {
        alert('Failed to approve');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (assignmentId: number) => {
    setRejecting(assignmentId);
    try {
      const response = await fetch(`/api/skill-points-approval/${assignmentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setAssignments(prev => prev.filter(a => a.AssignmentID !== assignmentId));
        setShowRejectConfirm(null);
      } else {
        alert('Failed to reject');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject');
    } finally {
      setRejecting(null);
    }
  };

  // Check if user is moderator/admin
  if (!user || (!user.isModerator && !user.isAdmin)) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Access Denied</h2>
        </div>
        <div className="p-6 text-center text-gray-600">
          You do not have permission to view this page.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Skill Points Approval</h2>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No pending skill point claims to review.</div>
        ) : (
          <div className="border border-gray-300">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                  <th className="px-3 py-2 text-left border-r border-gray-300 w-[20%] font-semibold">Character</th>
                  <th className="px-3 py-2 text-left border-r border-gray-300 font-semibold">Action</th>
                  <th className="px-3 py-2 text-center border-r border-gray-300 font-semibold w-12">E</th>
                  <th className="px-3 py-2 text-center border-r border-gray-300 font-semibold w-12">P</th>
                  <th className="px-3 py-2 text-center border-r border-gray-300 font-semibold w-12">K</th>
                  <th className="px-3 py-2 text-left border-r border-gray-300 font-semibold">Thread</th>
                  <th className="px-3 py-2 text-center font-semibold w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.AssignmentID} className="hover:bg-gray-50 border-t border-gray-300 align-top">
                    {/* Character with large avatar and overlaid name */}
                    <td className="p-0 w-[20%] border-r border-gray-300 relative">
                      <Link to={`/character/${assignment.CharacterSlug || assignment.CharacterID}`} className="block">
                        {assignment.AvatarImage && assignment.AvatarImage.trim() !== '' && !imageErrors.has(assignment.CharacterID) ? (
                          <img 
                            src={assignment.AvatarImage} 
                            alt={assignment.CharacterName}
                            className="w-full object-cover block"
                            style={{ aspectRatio: '16/9' }}
                            onError={() => setImageErrors(prev => new Set(prev).add(assignment.CharacterID))}
                          />
                        ) : (
                          <div 
                            className="w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                            style={{ aspectRatio: '16/9' }}
                          >
                            <img 
                              src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                              alt="Placeholder" 
                              className="w-12 h-12 opacity-40"
                            />
                          </div>
                        )}
                      </Link>
                      <Link 
                        to={`/character/${assignment.CharacterSlug || assignment.CharacterID}`} 
                        className="absolute top-0 left-0 text-white px-2 py-1 text-xs font-bold capitalize hover:underline" 
                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)' }}
                      >
                        {assignment.CharacterName}
                        {assignment.CharacterSurname ? ` ${assignment.CharacterSurname}` : ''}
                      </Link>
                    </td>
                    
                    {/* Skill Action */}
                    <td className="px-3 py-2 text-gray-700 border-r border-gray-300">
                      {assignment.SkillAction}
                      {assignment.IsDuplicate === 1 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-bold uppercase bg-red-600 text-white rounded">
                          Duplicate
                        </span>
                      )}
                    </td>
                    
                    {/* E P K values */}
                    <td className="px-3 py-2 text-center text-gray-700 border-r border-gray-300">{assignment.E || 0}</td>
                    <td className="px-3 py-2 text-center text-gray-700 border-r border-gray-300">{assignment.P || 0}</td>
                    <td className="px-3 py-2 text-center text-gray-700 border-r border-gray-300">{assignment.K || 0}</td>
                    
                    {/* Thread link */}
                    <td className="px-3 py-2 border-r border-gray-300">
                      <Link 
                        to={`/thread/${assignment.ThreadID}`}
                        className="text-blue-600 hover:underline"
                      >
                        {assignment.ThreadTitle}
                      </Link>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleApprove(assignment.AssignmentID)}
                          disabled={approving === assignment.AssignmentID || rejecting === assignment.AssignmentID}
                          className="px-2 py-1 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {approving === assignment.AssignmentID ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setShowRejectConfirm(assignment.AssignmentID)}
                          disabled={approving === assignment.AssignmentID || rejecting === assignment.AssignmentID}
                          className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {rejecting === assignment.AssignmentID ? '...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-300">
              {assignments.map((assignment) => (
                <div key={assignment.AssignmentID} className="p-3 hover:bg-gray-50">
                  <div className="flex gap-3">
                    {/* Character Image */}
                    <Link to={`/character/${assignment.CharacterSlug || assignment.CharacterID}`} className="flex-shrink-0 w-20 relative">
                      {assignment.AvatarImage && assignment.AvatarImage.trim() !== '' && !imageErrors.has(assignment.CharacterID) ? (
                        <img 
                          src={assignment.AvatarImage} 
                          alt={assignment.CharacterName}
                          className="w-full object-cover rounded"
                          style={{ aspectRatio: '1/1' }}
                          onError={() => setImageErrors(prev => new Set(prev).add(assignment.CharacterID))}
                        />
                      ) : (
                        <div 
                          className="w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded"
                          style={{ aspectRatio: '1/1' }}
                        >
                          <img 
                            src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                            alt="Placeholder" 
                            className="w-8 h-8 opacity-40"
                          />
                        </div>
                      )}
                      {assignment.IsDuplicate === 1 && (
                        <span className="absolute top-0 right-0 px-1 py-0.5 text-[10px] font-bold uppercase bg-red-600 text-white">
                          Dup
                        </span>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/character/${assignment.CharacterSlug || assignment.CharacterID}`}
                        className="font-semibold text-gray-900 hover:underline"
                      >
                        {assignment.CharacterName}
                        {assignment.CharacterSurname ? ` ${assignment.CharacterSurname}` : ''}
                      </Link>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">{assignment.SkillAction}</span>
                      </div>
                      <div className="text-xs text-gray-700 mt-1 flex items-center gap-1">
                        <span className="font-medium">E:</span>{assignment.E || 0}
                        <span className="mx-1 text-gray-400">·</span>
                        <span className="font-medium">P:</span>{assignment.P || 0}
                        <span className="mx-1 text-gray-400">·</span>
                        <span className="font-medium">K:</span>{assignment.K || 0}
                      </div>
                      <Link 
                        to={`/thread/${assignment.ThreadID}`}
                        className="text-xs text-blue-600 hover:underline mt-1 block truncate"
                      >
                        {assignment.ThreadTitle}
                      </Link>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => handleApprove(assignment.AssignmentID)}
                          disabled={approving === assignment.AssignmentID || rejecting === assignment.AssignmentID}
                          className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {approving === assignment.AssignmentID ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setShowRejectConfirm(assignment.AssignmentID)}
                          disabled={approving === assignment.AssignmentID || rejecting === assignment.AssignmentID}
                          className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {rejecting === assignment.AssignmentID ? '...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md">
            <h4 className="text-lg font-semibold mb-4 text-gray-900">Reject Claim</h4>
            <p className="text-gray-700 mb-4">Are you sure you want to reject this skill point claim?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectConfirm(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={rejecting !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectConfirm)}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
                disabled={rejecting !== null}
              >
                {rejecting !== null ? 'Rejecting...' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SkillPointsApproval;
