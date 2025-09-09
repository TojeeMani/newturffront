import React from 'react';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-16">
        {children}
      </main>
      {/* Footer can be extracted here */}
    </div>
  );
};

export default Layout;