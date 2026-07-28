interface ScoreRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  className = ""
}: ScoreRingProps) {
  const displayScore = typeof score === "number" ? Math.round(score) : null;

  // Calculate SVG values
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dashoffset = displayScore !== null
    ? circumference - (displayScore / 100) * circumference
    : circumference;

  // Determine color based on score
  let colorClass = "text-muted"; // fallback
  if (displayScore !== null) {
    if (displayScore >= 90) colorClass = "text-emerald-500";
    else if (displayScore >= 70) colorClass = "text-yellow-500";
    else if (displayScore >= 50) colorClass = "text-orange-500";
    else colorClass = "text-destructive";
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg
          className="h-full w-full -rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            className="text-muted/20"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {displayScore !== null && (
            <circle
              className={`${colorClass} transition-all duration-1000 ease-out`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
          )}
        </svg>

        {/* Inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {displayScore !== null ? (
            <span className="text-3xl font-bold tracking-tighter">
              {displayScore}
            </span>
          ) : (
            <span className="text-xl font-medium text-muted-foreground">--</span>
          )}
        </div>
      </div>

      {label && (
        <span className="mt-3 text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
