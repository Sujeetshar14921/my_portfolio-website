interface RibbonProps {
  text?: string;
}

export default function Ribbon({
  text = "Available For Freelance",
}: RibbonProps) {
  return (
    <div className="flex justify-center px-4 py-8 md:py-12 mb-10">
      <div className="relative w-full max-w-fit">

        {/* Left Back */}
        <div
          className="
            absolute
            -left-6 md:-left-10 lg:-left-12
            top-3 md:top-4
            h-6 md:h-8 lg:h-10
            w-10 md:w-14 lg:w-20
            bg-blue-900
          "
          style={{
            clipPath: "polygon(100% 0,0 50%,100% 100%)",
          }}
        />

        {/* Right Back */}
        <div
          className="
            absolute
            -right-6 md:-right-10 lg:-right-12
            top-3 md:top-4
            h-6 md:h-8 lg:h-10
            w-10 md:w-14 lg:w-20
            bg-blue-900
          "
          style={{
            clipPath: "polygon(0 0,100% 50%,0 100%)",
          }}
        />

        {/* Left Fold */}
        <div
          className="
            absolute
            -bottom-3 md:-bottom-4
            left-0
            h-4 md:h-5
            w-6 md:w-8
            bg-sky-950
          "
          style={{
            clipPath: "polygon(0 0,100% 0,100% 100%)",
          }}
        />

        {/* Right Fold */}
        <div
          className="
            absolute
            -bottom-3 md:-bottom-4
            right-0
            h-4 md:h-5
            w-6 md:w-8
            bg-sky-950
          "
          style={{
            clipPath: "polygon(0 0,100% 0,0 100%)",
          }}
        />

        {/* Ribbon */}
        <div
          className="
            relative
            overflow-hidden
            rounded-sm
            bg-gradient-to-b
            from-sky-400
            via-blue-500
            to-blue-700

            px-6
            sm:px-8
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

            tracking-[0.08em]
            sm:tracking-[0.12em]
            md:tracking-[0.18em]

            whitespace-nowrap

            text-white

            border-y
            border-white/30

            shadow-[0_12px_30px_rgba(0,0,0,.35)]
          "
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/60" />

          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />

          <span className="relative z-10">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}