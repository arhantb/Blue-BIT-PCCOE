"use client";

import { motion } from "framer-motion";
import { FocusCards } from "@/components/ui/focus-cards";

export default function USPSection() {
  const cards = [
    {
      title: "Intent-Aware Traffic Control",
      description:
        "Our AI doesn't just react to traffic—it anticipates movement patterns before vehicles even start moving.",
      highlight: "Predict before vehicles move",
      metric: "10–20 minute early congestion prediction",
      src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      title: "Multi-Layer Data Fusion",
      description:
        "Seamlessly integrates metro schedules, ride-share patterns, curb activity, and real-time probe data into one predictive model.",
      highlight: "Metro + Ride + Curb + Probe",
      metric: "Higher prediction accuracy",
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      title: "Curb & Pickup Orchestration",
      description:
        "Treats the curb as a live, dynamic resource, coordinating pickups and drop-offs to maintain traffic flow continuity.",
      highlight: "Curb as a live resource",
      metric: "Prevents green-wave breaks",
      src: "https://images.unsplash.com/photo-1508614999368-9260051292e5?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      title: "Structural Choke-Point AI",
      description:
        "Goes beyond optimization to diagnose underlying infrastructure flaws that create bottlenecks and capacity constraints.",
      highlight: "Diagnoses infrastructure flaws",
      metric: "Identifies 20–30% capacity loss areas",
      src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      title: "Human-in-the-Loop Control",
      description:
        "Combines AI intelligence with operator expertise, ensuring every decision is validated and deployments remain safe and accountable.",
      highlight: "AI + Operator collaboration",
      metric: "Safer deployments",
      src: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      title: "Corridor-Level Green Wave Intelligence",
      description:
        "Synchronizes signals across entire corridors, not just individual intersections, creating seamless green waves that reduce stops.",
      highlight: "Coordinated, not isolated",
      metric: "Reduced average delay",
      src: "https://images.unsplash.com/photo-1494783367193-149034c05e8f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold tracking-wide uppercase text-orange-400">
              WHY WE ARE DIFFERENT
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            From Reactive Signals to
            <br />
            Predictive Urban Intelligence
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional traffic systems respond to congestion after it happens.
            Our AI anticipates, coordinates, and orchestrates traffic flow
            before bottlenecks form—transforming cities into intelligent
            networks.
          </p>
        </motion.div>

        {/* FocusCards Component */}
        <FocusCards cards={cards} />

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button
            className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            See How It Works
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
