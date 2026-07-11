"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const testimonials = [
  {
    name: "Alex Rivera",
    role: "Regular User",
    avatar: "AR",
    quote: "I have met some amazing people on AnonLink. The anonymity makes it easy to be yourself and have genuine conversations.",
    color: "from-[var(--brand)] to-purple-500",
  },
  {
    name: "Sarah Chen",
    role: "Premium User",
    avatar: "SC",
    quote: "The video chat quality is incredible. It feels like talking to someone in the same room. Highly recommended!",
    color: "from-[var(--accent)] to-emerald-400",
  },
  {
    name: "Marcus Johnson",
    role: "Community Member",
    avatar: "MJ",
    quote: "Best anonymous chat platform I have used. The moderation system keeps things safe while maintaining free speech.",
    color: "from-amber-500 to-orange-500",
  },
  {
    name: "Priya Patel",
    role: "Regular User",
    avatar: "PP",
    quote: "The interest-based matching is amazing. I have found people who share my hobbies and passions from across the world.",
    color: "from-[var(--cyan)] to-blue-500",
  },
  {
    name: "James Wilson",
    role: "Premium User",
    avatar: "JW",
    quote: "Switching to premium was the best decision. Voice chat with strangers who share your interests is an incredible experience.",
    color: "from-[var(--lavender)] to-pink-400",
  },
];

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <div className="glass-lift rounded-2xl p-6 sm:p-8 min-w-[340px] md:min-w-[400px] snap-start">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white text-xs font-bold`}>
          {testimonial.avatar}
        </div>
        <div>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">{testimonial.name}</h4>
          <p className="text-xs text-[var(--text-muted)]">{testimonial.role}</p>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
    </div>
  );
}

export default function Testimonials() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !isInView || isPaused) return;

    let animationId: number;
    const step = () => {
      if (scrollEl.scrollLeft >= scrollEl.scrollWidth / 2) {
        scrollEl.scrollLeft = 0;
      } else {
        scrollEl.scrollLeft += 0.5;
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [isInView, isPaused]);

  return (
    <section className="py-20 lg:py-28 border-y border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-14"
        >
          <h2 className="heading-section text-3xl sm:text-4xl mb-4">
            Loved by Our Community
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Here is what our users have to say about their experience.
          </p>
        </motion.div>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-6 overflow-x-auto px-4 md:px-8 pb-4 snap-x snap-mandatory scrollbar-hide"
      >
        {[...testimonials, ...testimonials].map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} testimonial={t} />
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]/40"
          />
        ))}
      </div>
    </section>
  );
}
