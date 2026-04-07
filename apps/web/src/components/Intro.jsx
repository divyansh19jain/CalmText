import React from 'react';
import { motion } from 'framer-motion';

const Intro = () => {
  return (
    <section className="mb-20 px-6 xl:px-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="mb-6 font-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
          The Reflective Intent
        </h2>
        <div className="h-1 w-20 mx-auto mb-8 bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" />

        <p className="mb-8 text-lg leading-relaxed text-gray-400">
          CalmText is not a rewriter. It is a behavioral mirror. Inspired by the instinctive
          nature of a "Zen Dog," it nudges your communication back to center.
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="font-semibold text-white">Pax</div>
            <p className="text-sm text-gray-500">
              A one-line instinctive nudge. Sharp, brief, and metaphorical.
            </p>
          </div>
          <div className="space-y-3">
            <div className="font-semibold text-white">ClearText</div>
            <p className="text-sm text-gray-500">
              Analytical mirroring of tone, intent, and objective impact.
            </p>
          </div>
          <div className="space-y-3">
            <div className="font-semibold text-white">Pro/SubText</div>
            <p className="text-sm text-gray-500">
              Uncovering workplace power dynamics and hidden emotional needs.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Intro;
