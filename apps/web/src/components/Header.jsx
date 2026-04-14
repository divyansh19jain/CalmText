import React from 'react';

const Header = ({ provider, setProvider }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/70 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 xl:px-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-white">
              <span className="text-xl font-bold text-gray-900 leading-none">C</span>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            CalmText
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">How it Works</a>
          <a href="#" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Philosophy</a>
          <a href="#" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="p-1 rounded-full bg-gray-100 border border-black/5 flex items-center">
            <button
              onClick={() => setProvider('openai')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${provider === 'openai' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
            >
              OpenAI
            </button>
            <button
              onClick={() => setProvider('claude')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${provider === 'claude' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
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
