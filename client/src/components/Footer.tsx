import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-12 border-t border-gray-700">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} Horizon. All rights reserved.</p>
        <div className="mt-4 space-x-4">
          <a href="#" className="hover:text-white">Terms of Service</a>
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Contact Staff</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
