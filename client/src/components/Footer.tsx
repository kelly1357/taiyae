import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2f3a2f] text-gray-300 py-8 mt-12 border-t border-gray-600 relative z-10">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} Horizon. All rights reserved.</p>
        <div className="mt-4 space-x-4">
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Contact Staff</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
