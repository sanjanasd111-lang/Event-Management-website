import { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

const NumberCounter = ({ end, duration = 2, suffix = "", isCompact = false }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      let startTime;
      const animateCount = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / (duration * 1000);
        
        if (progress < 1) {
          setCount(Math.floor(end * progress));
          requestAnimationFrame(animateCount);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animateCount);
    }
  }, [inView, end, duration]);

  return (
    <motion.span ref={ref} className="font-mono">
      {isCompact 
        ? Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(count) 
        : count.toLocaleString()}
      {suffix}
    </motion.span>
  );
};

export default NumberCounter;
