"use client";

import { motion } from "framer-motion";

export default function AboutSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Label */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="uppercase text-sm tracking-wide text-orange-400 font-semibold">
            BUILT FOR INDIA
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-10 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Engineering Intelligent Traffic Infrastructure
          <br />
          for a Self-Reliant Nation
        </motion.h2>

        {/* About Paragraph */}
        <motion.div
          className="text-lg text-gray-600 leading-relaxed space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p>
            We are building{" "}
            <span className="text-orange-400 font-semibold">indigenous</span>{" "}
            AI-driven traffic coordination systems engineered specifically for{" "}
            <span className="text-orange-400 font-semibold">India's</span>{" "}
            mixed, non-lane-based traffic realities. Our platform integrates
            multi-layer data fusion—metro schedules, mobility patterns, curb
            activity, and probe feeds—to enable{" "}
            <span className="text-orange-400 font-semibold">predictive</span>{" "}
            corridor synchronization that anticipates congestion before it
            forms.
          </p>
          <p>
            By combining{" "}
            <span className="text-orange-400 font-semibold">
              infrastructure intelligence
            </span>{" "}
            with behavior-aware modeling, we deliver{" "}
            <span className="text-green-700 font-semibold">reduced delay</span>,{" "}
            <span className="text-green-700 font-semibold">
              faster emergency response
            </span>
            , and{" "}
            <span className="text-green-700 font-semibold">
              data-driven governance
            </span>{" "}
            for{" "}
            <span className="text-orange-400 font-semibold">
              coordinated urban mobility
            </span>
            . Our systems diagnose structural bottlenecks, orchestrate curb
            resources, and maintain{" "}
            <span className="text-green-700 font-semibold">
              optimized corridor flow
            </span>{" "}
            across entire networks.
          </p>
        </motion.div>

        {/* Closing Statement */}
        <motion.div
          className="text-center mt-10 pt-8 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-2xl font-bold text-gray-900">
            Designed in India. Built for India's traffic realities.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
