import { getCityHour } from "@/lib/weather";
import styles from "./TimeGradient.module.css";

const TIME_GRADIENTS: Record<string, string> = {
  dawn:      "linear-gradient(135deg, rgba(138,43,226,0.08) 0%, rgba(255,140,0,0.06) 50%, transparent 70%)",
  morning:   "linear-gradient(135deg, rgba(135,206,250,0.07) 0%, rgba(255,220,100,0.05) 50%, transparent 70%)",
  noon:      "linear-gradient(135deg, rgba(100,180,240,0.09) 0%, rgba(200,240,255,0.04) 50%, transparent 70%)",
  afternoon: "linear-gradient(135deg, rgba(255,165,0,0.07) 0%, rgba(255,120,50,0.04) 50%, transparent 70%)",
  evening:   "linear-gradient(135deg, rgba(255,80,30,0.09) 0%, rgba(200,60,100,0.06) 50%, transparent 70%)",
  night:     "linear-gradient(135deg, rgba(20,30,80,0.12) 0%, rgba(50,20,100,0.06) 50%, transparent 70%)",
};

function getTimePeriod(hour: number): string {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 16) return "noon";
  if (hour >= 16 && hour < 19) return "afternoon";
  if (hour >= 19 && hour < 22) return "evening";
  return "night";
}

export default function TimeGradient({
  className = "",
  timezone,
}: {
  className?: string;
  timezone?: string;
}) {
  const hour = getCityHour(timezone);
  const period = getTimePeriod(hour);
  const gradient = TIME_GRADIENTS[period];
  if (!gradient) return null;

  return (
    <div
      className={`${styles.overlay} ${className}`}
      style={{ background: gradient }}
      aria-hidden="true"
    />
  );
}