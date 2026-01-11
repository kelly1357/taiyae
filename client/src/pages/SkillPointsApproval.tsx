import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { User } from '../types';

interface SkillPointAssignment {
  AssignmentID: number;
  CharacterID: number;
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border-b border-gray-300 font-semibold text-gray-700">Character</th>
                  <th className="px-3 py-2 text-left border-b border-gray-300 font-semibold text-gray-700">Action</th>
                  <th className="px-3 py-2 text-center border-b border-gray-300 font-semibold text-gray-700 w-12">E</th>
                  <th className="px-3 py-2 text-center border-b border-gray-300 font-semibold text-gray-700 w-12">P</th>
                  <th className="px-3 py-2 text-center border-b border-gray-300 font-semibold text-gray-700 w-12">K</th>
                  <th className="px-3 py-2 text-left border-b border-gray-300 font-semibold text-gray-700">Thread</th>
                  <th className="px-3 py-2 text-center border-b border-gray-300 font-semibold text-gray-700 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.AssignmentID} className="hover:bg-gray-50 border-b border-gray-200">
                    {/* Character with avatar */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img 
                          src={assignment.AvatarImage} 
                          alt={assignment.CharacterName}
                          className="w-10 h-10 object-cover border border-gray-300"
                        />
                        <Link 
                          to={`/character/${assignment.CharacterID}`}
                          className="text-gray-900 hover:underline font-medium"
                        >
                          {assignment.CharacterName}
                          {assignment.CharacterSurname ? ` ${assignment.CharacterSurname}` : ''}
                        </Link>
                      </div>
                    </td>
                    
                    {/* Skill Action */}
                    <td className="px-3 py-2 text-gray-700">
                      {assignment.SkillAction}
                      {assignment.IsDuplicate === 1 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-bold uppercase bg-red-600 text-white rounded">
                          Duplicate
                        </span>
                      )}
                    </td>
                    
                    {/* E P K values */}
                    <td className="px-3 py-2 text-center text-gray-700">{assignment.E || 0}</td>
                    <td className="px-3 py-2 text-center text-gray-700">{assignment.P || 0}</td>
                    <td className="px-3 py-2 text-center text-gray-700">{assignment.K || 0}</td>
                    
                    {/* Thread link */}
                    <td className="px-3 py-2">
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
