import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuCheck, LuX, LuSparkles, LuCrown, LuRocket } from 'react-icons/lu';

// UI-only pricing tiers. Edit prices/features here as needed.
// `payments` are not wired yet — selecting a plan just unlocks the demo locally.
const PLANS = [
  {
    id: 'medium',
    name: 'Medium',
    price: '$5',
    period: '/mo',
    Icon: LuSparkles,
    tagline: 'For occasional clarity',
    features: ['50 analyses / month', 'Search history', 'ClearText mode'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$10',
    period: '/mo',
    Icon: LuRocket,
    tagline: 'For everyday conversations',
    features: ['Unlimited analyses', 'Own Voice mode', 'Priority responses', 'Everything in Medium'],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$20',
    period: '/mo',
    Icon: LuCrown,
    tagline: 'For power users & teams',
    features: ['Everything in Pro', 'Early access to new features', 'Premium support', 'Team sharing'],
    highlight: false,
  },
];

const UpgradeModal = ({ isOpen, onClose }) => {
  // Payments aren't wired up yet — picking a plan just shows a notice.
  const [notice, setNotice] = useState('');
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <LuX className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-500">
            You've used your 3 free Pax takes
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Upgrade to keep going
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose a plan to continue using Pax without limits.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const { Icon } = plan;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                  plan.highlight
                    ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-5 h-5 ${plan.highlight ? 'text-blue-600' : 'text-gray-500'}`} />
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">{plan.tagline}</p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-400">{plan.period}</span>
                </div>

                <ul className="flex flex-col gap-2 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <LuCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setNotice(`${plan.name} plan — payments are coming soon. You can't subscribe just yet.`)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>
            );
          })}
        </div>

        {/* "Coming soon" notice shown when a plan is tapped */}
        {notice && (
          <p className="text-center text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-5">
            {notice}
          </p>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Plans are placeholders — payments are not active yet.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default UpgradeModal;
