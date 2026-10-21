import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { BRAND } from '../../lib/colors';

// Magic UI — Border Beam
// https://magicui.design/docs/components/border-beam
// Adapted from the v4 registry syntax to Tailwind v3 arbitrary classes;
// default colors recolored to the deep-navy blue palette (the registry
// default "#9c40ff" violet is intentionally never used).

function BorderBeam({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = BRAND.blueBeamFrom,
  colorTo = BRAND.blueBeamTo,
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-transparent"
      style={{
        borderWidth: 'var(--border-beam-width, 1.5px)',
        borderStyle: 'solid',
        WebkitMask:
          'linear-gradient(transparent,transparent), linear-gradient(#000,#000)',
        WebkitMaskComposite: 'intersect',
        maskImage:
          'linear-gradient(transparent,transparent), linear-gradient(#000,#000)',
        maskComposite: 'intersect',
        maskClip: 'padding-box,border-box',
      }}
    >
      <motion.div
        className={cn(
          'absolute aspect-square',
          'bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent',
          className
        )}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          ...style,
        }}
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  );
}

export { BorderBeam };
