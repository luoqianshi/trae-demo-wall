import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ShakeWrapperProps {
  shake: boolean;
  children: ReactNode;
}

export function ShakeWrapper({ shake, children }: ShakeWrapperProps) {
  return (
    <motion.div
      animate={
        shake
          ? {
              x: [0, -6, 6, -4, 4, -2, 2, 0],
              y: [0, -3, 3, -2, 2, -1, 1, 0],
            }
          : { x: 0, y: 0 }
      }
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
