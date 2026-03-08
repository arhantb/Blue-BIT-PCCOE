"use client";

import { motion, type Variants } from "framer-motion";

export default function SystemLimitationsSection() {
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      // Framer Motion's TS types expect a cubic-bezier array (not a string like "easeOut")
      transition: { duration: 0.6, ease: [0, 0, 0.58, 1] },
    },
  };

  const limitations = [
    {
      title: "Data-Limited or Single-Source Reliance",
      description:
        "Most systems depend only on loops or cameras without multi-source intelligence.",
      highlight: "single-source",
    },
    {
      title: "Assumes Orderly, Lane-Disciplined Traffic",
      description:
        "Models perform poorly in mixed, chaotic, non-lane-based conditions.",
      highlight: "lane-disciplined",
    },
    {
      title: "Limited Behavior and Curb Modeling",
      description:
        "No understanding of illegal parking, pickup spillover, or human non-compliance.",
      highlight: "No understanding",
    },
    {
      title: "Poor Inter-Modal Integration",
      description:
        "No integration of metro discharge, ride-hailing demand, or first-mile impact.",
      highlight: "No integration",
    },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Top Label */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="uppercase text-sm tracking-wide text-orange-400 font-semibold">
            CURRENT SYSTEM LIMITATIONS
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-12 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Why Traditional Traffic Systems
          <br />
          Struggle in Modern Cities
        </motion.h2>

        {/* Gap List */}
        <motion.div
          className="space-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {limitations.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="relative bg-gray-50 rounded-xl p-6 border-l-4 border-orange-400"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {item.title.split(item.highlight).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="text-orange-400 font-semibold">
                        {item.highlight}
                      </span>
                    )}
                  </span>
                ))}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
