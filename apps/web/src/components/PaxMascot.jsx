import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

const SPARKLE_SPOTS = ["-top-1 -left-2", "-top-3 right-4", "top-8 -right-3"];

// Always-on ambient twinkles around the dog (QuillBot-style idle polish)
const AMBIENT_SPARKS = [
  { style: { top: "6%", left: "36%" }, delay: 0, size: "text-sm" },
  { style: { top: "48%", left: "1%" }, delay: 0.9, size: "text-xs" },
  { style: { top: "26%", left: "42%" }, delay: 1.7, size: "text-xs" },
];

const sparkleVariants = {
  hidden: { opacity: 0, scale: 0, transition: { duration: 0.2 } },
  twinkle: (i) => ({
    opacity: [0, 1, 0],
    scale: [0.4, 1.15, 0.4],
    rotate: [0, 20, 0],
    transition: { duration: 0.9, repeat: Infinity, delay: i * 0.25 },
  }),
};

// One cartoon eye (revealed when the sunglasses lift). Blinks on a loop.
// Tilted to follow the face angle; big iris keeps it from looking googly.
const Eye = ({ x, y, delay = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(-9)`}>
    <motion.g
      animate={{ scaleY: [1, 1, 0.12, 1] }}
      transition={{
        duration: 3.2,
        times: [0, 0.45, 0.52, 0.6],
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <ellipse rx="25" ry="29" fill="#fff" stroke="#C97A16" strokeWidth="2.5" />
      <circle cy="3" r="15" fill="#8B5A1F" />
      <circle cy="4" r="8.5" fill="#17181c" />
      <circle cx="-4" cy="-4" r="4.5" fill="#fff" />
      <circle cx="4" cy="9" r="2" fill="#fff" opacity="0.8" />
      {/* soft upper lid line */}
      <path
        d="M -22 -13 Q 0 -26 22 -13"
        fill="none"
        stroke="#B96A10"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
    </motion.g>
  </g>
);

// Duolingo-style living mascot.
//
// The dog moves ALONE — his blue circle and grass stay planted. Every
// whole-body move is anchored at his paws (bottom-anchored stretches),
// and his parts articulate via clipped copies of the art: head looks
// around, ears flick, tail wags, front paws march in alternating steps.
// On each 12s cycle Pax greets: speech bubble, excited bounces, and he
// lifts his sunglasses to blink at you. Typing also lifts the glasses;
// finishing a sentence triggers a squash-and-stretch with sparkles.
//
// The art is a flat PNG (1446 x 694) with the glasses baked in — a
// fur-toned patch (masked to the dog's alpha silhouette) hides them,
// and an SVG replica pair animates on top.
const PaxMascot = ({ src, text = "" }) => {
  const reactControls = useAnimationControls();
  const sparkleControls = useAnimationControls();
  const prevLen = useRef(text.length);
  const typingTimer = useRef(null);

  // Greeting window at the start of each 12s cycle: bubble shows and the
  // glasses lift so the eyes blink even when nobody is typing.
  const [greeting, setGreeting] = useState(true);
  useEffect(() => {
    let hideTimer = setTimeout(() => setGreeting(false), 3400);
    const cycle = setInterval(() => {
      setGreeting(true);
      hideTimer = setTimeout(() => setGreeting(false), 3400);
    }, 12000);
    return () => {
      clearInterval(cycle);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (text.length === prevLen.current) return undefined;
    const grew = text.length > prevLen.current;
    prevLen.current = text.length;

    // React only when a sentence is completed (. ! ? … or a new line),
    // not on every keystroke.
    if (!grew || !/[.!?…\n]\s*$/.test(text)) return undefined;

    // Sentence reaction: squash-and-stretch from the paws up
    reactControls.stop();
    reactControls.start({
      scaleY: [1, 0.94, 1.06, 1],
      scaleX: [1, 1.05, 0.97, 1],
      transition: { duration: 0.45, ease: "easeOut" },
    });

    // Sparkles stay on while keystrokes keep coming, fade shortly after
    sparkleControls.start("twinkle");
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => sparkleControls.start("hidden"),
      900,
    );
    return () => clearTimeout(typingTimer.current);
  }, [text, reactControls, sparkleControls]);

  const hasText = text.trim().length > 0;
  const glassesUp = hasText || greeting;
  const maskStyle = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  };

  return (
    <div className="relative">
      {SPARKLE_SPOTS.map((pos, i) => (
        <motion.span
          key={pos}
          custom={i}
          variants={sparkleVariants}
          initial="hidden"
          animate={sparkleControls}
          className={`absolute ${pos} z-20 text-lg select-none pointer-events-none`}
        >
          ✨
        </motion.span>
      ))}

      {/* Soft glow breathing behind the dog */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: "2%",
          top: "4%",
          width: "42%",
          height: "88%",
          background: "radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%)",
          filter: "blur(18px)",
        }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.06, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ambient twinkles that keep the dog feeling alive */}
      {AMBIENT_SPARKS.map(({ style, delay, size }) => (
        <motion.span
          key={delay}
          className={`absolute z-20 ${size} select-none pointer-events-none`}
          style={{ ...style, color: "#7cc0ff" }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.1, 0.5], rotate: [0, 25, 0] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            delay,
            repeatDelay: 1.2,
            ease: "easeInOut",
          }}
        >
          ✦
        </motion.span>
      ))}

      {/* Duolingo-style greeting bubble — pops up while Pax greets and
          blinks with his glasses up */}
      <motion.div
        className="absolute z-30 pointer-events-none"
        style={{ left: "2%", top: "-34px", transformOrigin: "25% 100%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 0, 0], scale: [0, 0, 1, 1, 0, 0] }}
        transition={{ duration: 12, times: [0, 0.02, 0.05, 0.2, 0.24, 1], repeat: Infinity }}
      >
        <div
          className="relative bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-2xl shadow-lg whitespace-nowrap"
          style={{ border: "2px solid #E5E7EB" }}
        >
          Hi there! I'm Pax! 🐾
          <div
            className="absolute left-8 -bottom-2 w-4 h-4 bg-white rotate-45"
            style={{ borderRight: "2px solid #E5E7EB", borderBottom: "2px solid #E5E7EB" }}
          />
        </div>
      </motion.div>

      {/* Static layer: the CalmText wordmark side of the art never moves */}
      <img
        src={src}
        alt="CalmText"
        className="w-[300px] h-auto block select-none pointer-events-none"
        style={{ clipPath: "inset(0 0 0 45%)" }}
      />

      {/* Animated layer: only the dog side of the art moves.
          ALL whole-body motion is anchored at the paws (22% 100%) so the
          grass and blue circle stay planted on the ground. */}
      <div className="absolute inset-0 z-10">
        {/* Breathing: gentle bottom-anchored stretch */}
        <motion.div
          className="w-full h-full"
          animate={{ scaleY: [1, 1.02, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "22% 100%" }}
        >
          {/* Greeting bounces at the start of each 12s cycle — excited
              stretches up from the paws while the bubble shows */}
          <motion.div
            className="w-full h-full"
            animate={{
              scaleY: [1, 1, 1.07, 1, 1.07, 1, 1, 1],
              scaleX: [1, 1, 0.985, 1, 0.985, 1, 1, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              times: [0, 0.04, 0.07, 0.1, 0.13, 0.16, 0.3, 1],
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "22% 100%" }}
          >
            {/* Sentence reaction layer — squash-and-stretch from the paws */}
            <motion.div
              className="w-full h-full"
              animate={reactControls}
              style={{ transformOrigin: "22% 100%" }}
            >
              <motion.div
                animate={{ scale: hasText ? 1.03 : 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative w-full h-full"
                style={{ transformOrigin: "22% 100%" }}
              >
                <img
                  src={src}
                  alt="Pax"
                  className="w-full h-full object-contain"
                  style={{ clipPath: "inset(0 55% 0 0)" }}
                />

                {/* Head layer — a clipped copy of the art that subtly looks
                    around, so the dog's own body articulates */}
                <motion.img
                  src={src}
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    clipPath: "polygon(13% 0%, 43% 0%, 43% 49%, 13% 49%)",
                    transformOrigin: "28% 46%",
                  }}
                  animate={{
                    rotate: [0, -2.5, 0, 0, 3, 0, 0],
                    y: [0, -2, 0, 0, -2, 0, 0],
                  }}
                  transition={{
                    duration: 6.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.12, 0.24, 0.5, 0.62, 0.74, 1],
                  }}
                />

                {/* Ear layer — occasional floppy ear flick */}
                <motion.img
                  src={src}
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    clipPath: "polygon(14% 12%, 22% 12%, 22% 38%, 14% 38%)",
                    transformOrigin: "18% 15%",
                  }}
                  animate={{ rotate: [0, 0, 5, -3, 0, 0] }}
                  transition={{
                    duration: 6.5,
                    repeat: Infinity,
                    times: [0, 0.4, 0.46, 0.52, 0.58, 1],
                    ease: "easeInOut",
                  }}
                />

                {/* Tail layer — constant gentle wag */}
                <motion.img
                  src={src}
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    clipPath: "polygon(2% 62%, 14% 62%, 14% 94%, 2% 94%)",
                    transformOrigin: "13% 86%",
                  }}
                  animate={{ rotate: [0, -5, 0, 5, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Front paws — alternating march: left, right, left, right,
                    each toe lifting from the heel. THIS is the walking motion;
                    the ground stays still, the dog steps on his toes. */}
                <motion.img
                  src={src}
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    clipPath: "polygon(15.5% 76%, 23% 76%, 23% 95.5%, 15.5% 95.5%)",
                    transformOrigin: "22.5% 93%",
                  }}
                  animate={{ rotate: [0, -12, 0, 0], y: [0, -4, 0, 0] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.22, 0.45, 1],
                  }}
                />
                <motion.img
                  src={src}
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    clipPath: "polygon(22.8% 76%, 29.5% 76%, 29.5% 95.5%, 22.8% 95.5%)",
                    transformOrigin: "23.5% 93%",
                  }}
                  animate={{ rotate: [0, 0, 12, 0], y: [0, 0, -4, 0] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 0.72, 1],
                  }}
                />

                {/* Fur patch + eyes, clipped to the dog silhouette so the
                    painted-on glasses stay hidden without spilling over */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={maskStyle}
                >
                  <svg
                    viewBox="0 0 1446 694"
                    className="w-full h-full"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="paxFur" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#FFCB4D" />
                        <stop offset="0.55" stopColor="#F9A01B" />
                        <stop offset="1" stopColor="#F08A05" />
                      </linearGradient>
                      {/* soft edges so the patch melts into the painted fur */}
                      <filter id="paxSoften" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="7" />
                      </filter>
                    </defs>
                    <g filter="url(#paxSoften)">
                      <rect
                        x="278"
                        y="55"
                        width="307"
                        height="150"
                        rx="48"
                        fill="url(#paxFur)"
                        transform="rotate(-9 430 132)"
                      />
                      {/* forehead light to echo the painterly shading */}
                      <ellipse
                        cx="430"
                        cy="95"
                        rx="110"
                        ry="42"
                        fill="#FFD764"
                        opacity="0.5"
                        transform="rotate(-9 430 95)"
                      />
                    </g>
                    <Eye x={372} y={158} />
                    <Eye x={496} y={140} delay={0.05} />
                  </svg>
                </div>

                {/* Sunglasses replica — slides up onto the forehead while
                    typing AND during each greeting, revealing blinking eyes */}
                <svg
                  viewBox="0 0 1446 694"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ overflow: "visible" }}
                  aria-hidden="true"
                >
                  <motion.g
                    animate={
                      glassesUp
                        ? { y: -80, rotate: 9, scale: 0.94 }
                        : { y: 0, rotate: 0, scale: 1 }
                    }
                    transition={{ type: "spring", stiffness: 260, damping: 19 }}
                  >
                    <g transform="rotate(-9 430 132)">
                      <rect x="290" y="84" width="128" height="104" rx="38" fill="#14161d" />
                      <rect x="442" y="84" width="128" height="104" rx="38" fill="#14161d" />
                      <ellipse
                        cx="330"
                        cy="112"
                        rx="23"
                        ry="11"
                        fill="#fff"
                        opacity="0.9"
                        transform="rotate(-12 330 112)"
                      />
                      <ellipse
                        cx="482"
                        cy="108"
                        rx="23"
                        ry="11"
                        fill="#fff"
                        opacity="0.9"
                        transform="rotate(-12 482 108)"
                      />
                      {/* periodic light glint sweeping across the lenses */}
                      <clipPath id="paxLensClip">
                        <rect x="290" y="84" width="128" height="104" rx="38" />
                        <rect x="442" y="84" width="128" height="104" rx="38" />
                      </clipPath>
                      <g clipPath="url(#paxLensClip)">
                        <motion.rect
                          y="70"
                          width="30"
                          height="130"
                          fill="#ffffff"
                          opacity="0.3"
                          animate={{ x: [250, 610] }}
                          transition={{
                            duration: 1.0,
                            repeat: Infinity,
                            repeatDelay: 3.2,
                            ease: "easeInOut",
                          }}
                        />
                      </g>
                      <rect x="282" y="74" width="296" height="30" rx="14" fill="#101218" />
                      <rect x="405" y="90" width="50" height="20" rx="9" fill="#101218" />
                    </g>
                  </motion.g>
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaxMascot;
