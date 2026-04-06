import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-white/5 bg-dark-bg py-12 text-gray-500">
      <div className="container mx-auto px-6 xl:px-0">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-emerald-400 p-[1px]">
              <div className="flex h-full w-full items-center justify-center rounded-[5px] bg-dark-bg">
                <span className="text-xs font-bold text-white">C</span>
              </div>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              CalmText
            </span>
          </div>

          <div className="flex items-center gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="text-sm font-mono opacity-50">
            &copy; {new Date().getFullYear()} CalmText v1.2.0
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
