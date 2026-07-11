"use client";

import React from "react";
import { motion } from "framer-motion";

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function SecondaryButton({
  children,
  onClick,
  className = "",
  disabled = false,
}: SecondaryButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`btn-secondary ${className}`}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}
