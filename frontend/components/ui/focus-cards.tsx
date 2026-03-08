"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface Card {
  title: string;
  description: string;
  highlight: string;
  metric: string;
  src: string;
}

interface FocusCardsProps {
  cards: Card[];
}

export function FocusCards({ cards }: FocusCardsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className="relative h-80 rounded-xl overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl transition-shadow duration-300"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          whileHover={{ y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={card.src}
              alt={card.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>

          {/* Title - Always Visible at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10 transform transition-transform duration-300 group-hover:translate-y-full">
            <h3 className="text-2xl font-bold text-white">{card.title}</h3>
          </div>

          {/* Hover Overlay - Slides Up from Bottom */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-black/95 p-6 flex flex-col justify-end"
            initial={{ y: "100%" }}
            animate={{ y: hoveredIndex === index ? 0 : "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">{card.title}</h3>

              <p className="text-gray-200 text-sm leading-relaxed">
                {card.description}
              </p>

              <div className="pt-2 space-y-2 border-t border-gray-700">
                {/* Highlight */}
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 text-base flex-shrink-0">
                    ✦
                  </span>
                  <span className="text-orange-400 font-semibold text-sm">
                    {card.highlight}
                  </span>
                </div>

                {/* Metric */}
                <div className="flex items-start gap-2">
                  <span className="text-green-400 text-base flex-shrink-0">
                    →
                  </span>
                  <span className="text-green-400 font-semibold text-sm">
                    {card.metric}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
