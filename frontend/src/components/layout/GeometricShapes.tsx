export function GeometricShapes() {
  return (
    <div className="relative w-full h-full min-h-[400px]" aria-hidden="true">
      {/* Large orange triangle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float">
        <svg width="280" height="240" viewBox="0 0 280 240" fill="none">
          <polygon points="140,10 270,230 10,230" fill="#fb923c" />
        </svg>
      </div>

      {/* Large blue circle */}
      <div className="absolute top-[30%] left-[45%] animate-float-delayed">
        <div className="w-44 h-44 rounded-full bg-primary-600" />
      </div>

      {/* Blue circle outline */}
      <div className="absolute top-[15%] left-[25%] animate-float-slow">
        <div className="w-20 h-20 rounded-full border-[3px] border-primary-600" />
      </div>

      {/* Small blue circle outline */}
      <div className="absolute top-[55%] right-[10%] animate-float">
        <div className="w-14 h-14 rounded-full border-[3px] border-primary-600" />
      </div>

      {/* Orange square */}
      <div className="absolute bottom-[15%] right-[25%] animate-float-delayed">
        <div className="w-24 h-24 bg-accent-400 rounded-sm" />
      </div>

      {/* Small blue diamond */}
      <div className="absolute top-[60%] left-[30%] animate-float-slow">
        <div className="w-8 h-8 bg-primary-600 rotate-45" />
      </div>

      {/* Dot grid pattern */}
      <div className="absolute top-[10%] right-[5%]">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          {Array.from({ length: 10 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={col * 12 + 6}
                cy={row * 12 + 6}
                r="2"
                fill="#818cf8"
                opacity="0.6"
              />
            ))
          )}
        </svg>
      </div>

      {/* Second dot grid */}
      <div className="absolute bottom-[5%] left-[15%]">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          {Array.from({ length: 7 }).map((_, row) =>
            Array.from({ length: 7 }).map((_, col) => (
              <circle
                key={`b-${row}-${col}`}
                cx={col * 12 + 6}
                cy={row * 12 + 6}
                r="2"
                fill="#fb923c"
                opacity="0.4"
              />
            ))
          )}
        </svg>
      </div>
    </div>
  );
}
