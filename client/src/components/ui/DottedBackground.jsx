import React from 'react';
import { motion } from 'framer-motion';

const DottedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated dotted background */}
      <div 
        className="absolute inset-0 bg-dotted-pattern bg-dotted opacity-20 dark:opacity-10"
        style={{
          backgroundSize: '20px 20px',
          animation: 'float 20s ease-in-out infinite',
        }}
      />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-blue-50/30 dark:from-emerald-900/20 dark:via-transparent dark:to-blue-900/20" />
      
      {/* Floating elements */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 bg-emerald-200/20 dark:bg-emerald-800/20 rounded-full blur-xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-40 right-32 w-24 h-24 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      <motion.div
        className="absolute bottom-32 left-1/3 w-40 h-40 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-xl"
        animate={{
          x: [0, 25, 0],
          y: [0, -25, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/5 dark:via-emerald-900/5 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-100/5 dark:via-emerald-900/5 to-transparent" />
    </div>
  );
};

export default DottedBackground;
