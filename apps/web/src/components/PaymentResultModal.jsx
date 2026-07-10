import React from 'react';
import { motion } from 'framer-motion';
import { LuCircleCheck, LuClock, LuCircleX } from 'react-icons/lu';

// Shows the outcome after returning from Stripe Checkout.
// status: 'success' | 'pending' | 'cancel'
const CONTENT = {
  success: {
    Icon: LuCircleCheck,
    color: 'text-green-500',
    ring: 'bg-green-50',
    title: 'Payment successful',
    message: 'Your subscription is active — you now have unlimited access.',
    button: 'Start using Pax',
  },
  pending: {
    Icon: LuClock,
    color: 'text-amber-500',
    ring: 'bg-amber-50',
    title: 'Payment not yet completed',
    message:
      "We haven't received confirmation for this payment yet. If you were charged, your access will unlock automatically once Stripe confirms it.",
    button: 'Got it',
  },
  cancel: {
    Icon: LuCircleX,
    color: 'text-gray-400',
    ring: 'bg-gray-100',
    title: 'Payment cancelled',
    message: 'No charge was made. You can upgrade any time to continue using Pax.',
    button: 'Close',
  },
};

const PaymentResultModal = ({ isOpen, status, onClose }) => {
  if (!isOpen || !status) return null;
  const c = CONTENT[status] || CONTENT.pending;
  const { Icon } = c;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${c.ring}`}>
            <Icon className={`w-9 h-9 ${c.color}`} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{c.title}</h2>
          <p className="text-gray-600">{c.message}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 mt-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors"
          >
            {c.button}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PaymentResultModal;
