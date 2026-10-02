'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const socials = [
  { label: 'GitHub', icon: '⌂', href: '#' },
  { label: 'Twitter', icon: '◎', href: '#' },
  { label: 'Discord', icon: '◈', href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#0a0a0f] border-t border-[rgba(255,255,255,0.05)]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-8"
        >
          <div>
            <div className="mono text-xs text-[#52525b] tracking-widest mb-2">
              ANONLINK
            </div>
            <p className="text-[#a1a1aa] text-sm max-w-md">
              The premium anonymous network. No trackers. No traces. Just connection.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {socials.map(({ label, icon }) => (
              <Link
                key={label}
                href="#"
                className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#52525b] hover:text-[#22d3ee] hover:border-[#22d3ee] transition-all duration-200 text-lg"
              >
                {icon}
              </Link>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#6366f1] text-white text-sm font-semibold hover:bg-[#818cf8] transition-all duration-200"
            >
              The network is waiting. Connect now.
              <span>→</span>
            </Link>
          </motion.div>

          <div className="mono text-xs text-[#52525b]">
            &copy; {new Date().getFullYear()} AnonLink. All rights reserved. Zero logs.
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
