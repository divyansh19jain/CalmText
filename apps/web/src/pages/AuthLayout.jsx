import React from 'react';
import { LuMessageSquare, LuSparkles, LuSearch, LuQuote } from 'react-icons/lu';
import singleLogo from '../assets/single-logo.png';
import ThemeToggle from '../components/ThemeToggle';

const features = [
  { Icon: LuMessageSquare, title: 'Decode', desc: 'Understand hidden tone & intent' },
  { Icon: LuSparkles,      title: 'Refine', desc: 'Say exactly what you mean' },
  { Icon: LuSearch,        title: 'Clarity', desc: 'Cut through emotional noise' },
];

/**
 * Full-screen, edge-to-edge split layout for auth pages.
 * Left: immersive blue brand panel. Right: the page's form (passed as children).
 */
const AuthLayout = ({ children }) => {
  return (
    <div className="h-screen w-full flex overflow-hidden">

      {/* ─── Left brand panel (hidden on small screens) ─── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[46%] xl:w-[42%] p-8 xl:p-12 xxl:p-14 relative overflow-hidden"
        style={{
          background:
            'radial-gradient(120% 120% at 0% 0%, #60a5fa 0%, #3b82f6 38%, #2563EB 72%, #1e40af 100%)',
        }}
      >
        {/* floating orbs */}
        <div className="auth-orb" style={{ top: '-120px', right: '-80px', width: '320px', height: '320px', background: 'rgba(255,255,255,0.16)' }} />
        <div className="auth-orb" style={{ bottom: '-90px', left: '-70px', width: '240px', height: '240px', background: 'rgba(255,255,255,0.10)' }} />
        <div className="auth-orb" style={{ top: '40%', right: '8%', width: '120px', height: '120px', background: 'rgba(191,219,254,0.18)' }} />
        {/* fine grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        {/* top: brand + headline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6 xl:mb-10">
            <img src={singleLogo} alt="Pax" className="w-11 h-11 xl:w-14 xl:h-14 object-contain flex-shrink-0" />
            <span className="text-white font-extrabold text-xl xl:text-2xl tracking-tight">CalmText</span>
          </div>

          <h3 className="text-white text-3xl xl:text-4xl xxl:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Pause. Reflect.<br />
            <span className="text-blue-200">Communicate</span> with clarity.
          </h3>
          <p className="text-blue-100/90 text-sm xl:text-base mt-3 xl:mt-5 leading-relaxed max-w-sm">
            Pax helps you understand what people really mean — and say what you really feel.
          </p>
        </div>

        {/* middle: feature cards */}
        <div className="relative z-10 flex flex-col gap-2.5 xl:gap-3 my-5 xl:my-8">
          {features.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-3 xl:gap-4 rounded-2xl px-3.5 py-2.5 xl:px-4 xl:py-3 bg-white/10 backdrop-blur-md ring-1 ring-white/15 hover:bg-white/15 transition-colors"
            >
              <div className="w-9 h-9 xl:w-11 xl:h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm xl:text-[15px] font-bold leading-tight">{title}</span>
                <span className="text-blue-100/85 text-[11px] xl:text-xs leading-tight mt-0.5">{desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* bottom: testimonial */}
        <div className="relative z-10">
          <div className="rounded-2xl p-4 xl:p-5 bg-white/10 backdrop-blur-md ring-1 ring-white/15">
            <LuQuote className="w-4 h-4 xl:w-5 xl:h-5 text-blue-200 mb-2" />
            <p className="text-white/90 text-xs xl:text-sm leading-relaxed">
              “I finally say what I mean without the anxiety. Pax reads the room so I don't have to.”
            </p>
            <p className="text-blue-100/70 text-[11px] xl:text-xs mt-2 xl:mt-3 font-semibold">— Early CalmText user</p>
          </div>
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col justify-center items-center p-5 sm:p-8 relative">
        {/* Theme toggle */}
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        {/* Mobile logo (brand panel is hidden < lg) */}
        <div className="flex lg:hidden flex-col items-center gap-2 mb-6">
          <img src={singleLogo} alt="CalmText" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
          <span className="font-extrabold t-strong tracking-tight text-xl">CalmText</span>
        </div>

        <div className="w-full max-w-md flex flex-col gap-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
