import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import WikiSearchBox from '../../components/WikiSearchBox';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const ProfileHelp: React.FC = () => {
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
        <div className="text-xs text-gray-500 mb-4">
          <Link to="/" className="text-[#2f3a2f] hover:underline">Home</Link>
          {' > '}
          <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Wiki</Link>
          {' > '}
          <span>Profile Help</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Help</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="profile-help"
              title="Profile Help"
              userId={user?.id}
              isModerator={isModerator}
            >
            {/* Guidelines */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Guidelines</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">Photo Guidelines</h4>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li><strong>Avatars:</strong> 526 x 364. Avatars should be photos or photo manipulations only (no illustrations, please!) with no text. Please no glowing eyes, "glow lines" in fur, or fully painted over fur. Fur color may be changed, but the original texture should be visible/not completely painted or smoothed over.</li>
                <li><strong>Large (slideshow) Photos:</strong> For best results, use photos 520x435px or larger. You may include whatever you want here, including fan art and illustrations.</li>
              </ul>
              <p>You may also include photos in other fields of your profile, such as the Brief Description.</p>
            </div>

            {/* Creating a Custom Profile Theme with CSS */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Creating a Custom Profile Theme with CSS</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">What is CSS and how do I use it?</h4>
              <p className="mb-3">CSS stands for Cascading Style Sheets. It's a coding language that web developers use to style text and other elements of a web page. It's a little too broad to get into here, but here are a few resources to help you get started with the basics of CSS:</p>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-1">
                <li><a href="https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_started" target="_blank" rel="noopener noreferrer" className="text-[#2f3a2f] hover:underline">Getting started with CSS (Mozilla Developer Network)</a></li>
                <li><a href="http://www.codecademy.com/courses/css-coding-with-style/0/1" target="_blank" rel="noopener noreferrer" className="text-[#2f3a2f] hover:underline">Codeacademy's online course "CSS: Coding with Style"</a></li>
              </ul>

              <h4 className="font-semibold mb-2">Example CSS</h4>
              <p className="mb-3">And here's some example CSS for customizing the main parts of your profile:</p>
              <pre className="bg-gray-100 p-4 overflow-x-auto text-xs mb-4 border border-gray-300">
{`body { /* to change font color and background image */
  color: #______;
  background-image: url('______');
}

a { /* all links */
  color: #______;
}

a:hover, /* hover states for links */
a:visited,
a:active {
  color: #______;
}

.heading { /* heading bars above each box */
  background-color: #______;
}

.title-container a { /* site title and links */
  color: #______;
}`}
              </pre>
            </div>

            {/* Adding Custom Rows to Your IC Profile Table */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Adding Custom Rows to Your IC Profile Table</h3>
            
            <div className="text-xs text-gray-800">
              <p className="mb-3">You may want to add custom rows to the table in your profile, and you can do this by adding new table rows to either the "Pups," "Siblings," or "Other Relationships" fields. First, add the following at the end of the field, to close the table cell and row:</p>
              <pre className="bg-gray-100 p-4 overflow-x-auto text-xs mb-4 border border-gray-300">
{`</td></tr>`}
              </pre>
              <p className="mb-3">Then, add whatever new table headings and rows you prefer, for example:</p>
              <pre className="bg-gray-100 p-4 overflow-x-auto text-xs border border-gray-300">
{`<tr><th>Friends</th><th>Enemies</th></tr>
<tr><td>Bob, {Joe}, Crazy Sue</td>
<td>{George}</td></tr>
<tr><th colspan="2">Something Else</th></tr>
<tr><td colspan="2">Cell content here</td></tr>`}
              </pre>
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

export default ProfileHelp;
