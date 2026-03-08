"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TimelineItem {
  title: string | React.ReactNode;
  content: React.ReactNode;
}

interface TimelineProps {
  data: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const isLast = (idx: number) => idx === data.length - 1;

  return (
    <div className="w-full bg-white dark:bg-neutral-950 font-sans md:px-10">
      <div
        ref={containerRef}
        className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10"
      >
        <div ref={ref} className="relative w-full">
          {data.map((item, idx) => (
            <div key={idx} className="mb-50 md:mb-40 relative w-full">
              {/* Timeline dot and line */}
              <motion.div
                initial={{
                  opacity: 0,
                }}
                whileInView={{
                  opacity: 1,
                }}
                transition={{
                  duration: 1,
                }}
                className="flex gap-10 pt-10 md:pt-40 md:gap-10"
              >
                {/* Timeline marker */}
                <div className="relative md:pl-20">
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.5,
                    }}
                    whileInView={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.8,
                    }}
                    className="absolute left-3 md:left-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-black border-4 border-green-500"
                  >
                    <div className="h-4 w-4 rounded-full bg-green-500" />
                  </motion.div>

                  {!isLast(idx) && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      whileInView={{
                        opacity: 1,
                        height: 200,
                      }}
                      transition={{
                        duration: 1,
                      }}
                      className="absolute left-[26px] md:left-[8px] top-20 w-1 origin-top rounded-full bg-gradient-to-b from-green-500 to-transparent"
                    />
                  )}
                </div>

                {/* Content */}
                <motion.div
                  initial={{
                    opacity: 0,
                    x: -100,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2,
                  }}
                  className="relative pt-4 md:pt-0 w-full"
                >
                  <h3 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {item.title}
                  </h3>
                  <div className="text-base md:text-lg prose prose-sm dark:prose-invert max-w-2xl">
                    {item.content}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
