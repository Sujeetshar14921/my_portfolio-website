interface RibbonProps {
  text?: string;
}

export default function Ribbon({
  text = "Available For Freelance",
}: RibbonProps) {
  return (
    <div className="flex justify-center px-4 py-8 md:py-12 mb-10">
      <div className="relative w-full max-w-fit [perspective:1200px]">
        <div className="absolute inset-x-8 top-2 h-8 rounded-full bg-blue-950/35 blur-xl" />

        {/* Left Back */}
        <div
          className="
            absolute
            -left-6 md:-left-10 lg:-left-12
            top-3 md:top-4
            h-7 md:h-9 lg:h-11
            w-11 md:w-16 lg:w-22
            bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800
            shadow-[0_10px_20px_rgba(15,23,42,.28)]
          "
          style={{
            clipPath: "polygon(100% 0,0 50%,100% 100%)",
            transform: "rotateY(14deg) skewY(-3deg)",
            transformOrigin: "right center",
          }}
        />

        {/* Right Back */}
        <div
          className="
            absolute
            -right-6 md:-right-10 lg:-right-12
            top-3 md:top-4
            h-7 md:h-9 lg:h-11
            w-11 md:w-16 lg:w-22
            bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800
            shadow-[0_10px_20px_rgba(15,23,42,.28)]
          "
          style={{
            clipPath: "polygon(0 0,100% 50%,0 100%)",
            transform: "rotateY(-14deg) skewY(3deg)",
            transformOrigin: "left center",
          }}
        />

        {/* Left Fold */}
        <div
          className="
            absolute
            -bottom-3 md:-bottom-4
            left-0
            h-5 md:h-6
            w-7 md:w-9
            bg-gradient-to-b from-sky-950 via-blue-950 to-blue-900
            shadow-[0_8px_14px_rgba(15,23,42,.25)]
          "
          style={{
            clipPath: "polygon(0 0,100% 0,100% 100%)",
            transform: "skewX(-14deg)",
          }}
        />

        {/* Right Fold */}
        <div
          className="
            absolute
            -bottom-3 md:-bottom-4
            right-0
            h-5 md:h-6
            w-7 md:w-9
            bg-gradient-to-b from-sky-950 via-blue-950 to-blue-900
            shadow-[0_8px_14px_rgba(15,23,42,.25)]
          "
          style={{
            clipPath: "polygon(0 0,100% 0,0 100%)",
            transform: "skewX(14deg)",
          }}
        />

        {/* Ribbon */}
        <div
          className="
            relative
            overflow-hidden
            rounded-[0.35rem]
            bg-gradient-to-b
            from-sky-300
            via-blue-500
            to-blue-800

            px-7
            sm:px-9
            md:px-12
            lg:px-14

            py-2.5
            sm:py-3
            md:py-4

            w-fit
            max-w-full

            text-center

            text-[11px]
            sm:text-sm
            md:text-base

            font-semibold
            uppercase

            tracking-[0.1em]
            sm:tracking-[0.14em]
            md:tracking-[0.18em]

            whitespace-nowrap

            text-white

            border-y
            border-white/35

            shadow-[0_18px_35px_rgba(0,0,0,.38)]
            transform-gpu
            rotate-[-0.5deg]
          "
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/70" />

          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/8 to-transparent" />
          <div className="absolute inset-x-4 top-1 h-px bg-white/45" />
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-b from-black/0 to-black/20" />

          <span className="relative z-10">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}