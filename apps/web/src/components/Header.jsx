import React from 'react';

const Header = ({ provider, setProvider }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-dark-bg/60 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 xl:px-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-dark-bg">
              <span className="text-xl font-bold text-white leading-none">C</span>
            </div>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            CalmText
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it Works</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Philosophy</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="p-1 rounded-full bg-white/5 border border-white/10 flex items-center">
            <button
              onClick={() => setProvider('openai')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${provider === 'openai' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              OpenAI
            </button>
            <button
              onClick={() => setProvider('claude')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${provider === 'claude' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Claude
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
