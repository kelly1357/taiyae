import React from 'react';
import { Link } from 'react-router-dom';

const ThreeStrikeRule: React.FC = () => {
  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
      </div>
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Three Strike Rule</h1>
        
        <div className="text-xs text-gray-800 space-y-4">
          {/* THREE-STRIKE RULE */}
          <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Three-Strike Rule</h3>
          
          <p>
            The Three-Strike Rule is fairly straightforward and involves disciplinary actions towards members on 
            Horizon who break established rules as outlined in the Wiki pages. Strikes are 
            cumulative for each member, and cover each character the member plays. Staff will 
            keep track of each members' strikes in private. You will always be notified by 
            a Moderator if your actions constitute a strike. If notified, you are expected 
            to correct or modify your actions to avoid further strikes.
          </p>
          
          <p>
            Please note that the staff as a whole have the right to make a determination if 
            your actions constitute as a strike, regardless of whether or not the action 
            itself is included in the list below. Staff will always discuss concerning behavior 
            before proceeding with any disciplinary action.
          </p>

          {/* What counts as a strike? */}
          <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-6">What counts as a strike?</h4>
          
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Breaking any OOC or IC rule found in the Wiki</li>
            <li>Breaking <Link to="/wiki/rules-general" className="font-bold">the Golden Rule</Link> by disrespecting or berating individuals and/or groups in the community—staff and members both included</li>
            <li>Continuing to break OOC or IC rules despite warnings and/or corrections by staff members</li>
          </ul>

          {/* What happens if you get three strikes? */}
          <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-6">What happens if you get three strikes?</h4>
          
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Staff will ultimately make the decision on a case by case basis, but three strikes will typically result in a permanent ban from Horizon for the member and all of his or her characters</li>
          </ul>

          {/* Questions? */}
          <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-6">Questions?</h4>
          
          <p>
            Please PM a staff member for clarification regarding any of the items above.
          </p>

          {/* Categories */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 mb-2">Categories:</h4>
            <p className="text-xs">
              • <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Handbook</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreeStrikeRule;
