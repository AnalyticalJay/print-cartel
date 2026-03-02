import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";

export function PromoBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3 sm:py-4 px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIiBmaWxsPSJ3aGl0ZSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')]" />

      <div className="relative max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        {/* Left: Lightning icon and offer text */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center sm:justify-start">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 animate-pulse" />
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm font-bold">FLASH SALE</p>
            <p className="text-sm sm:text-base font-black">25% OFF ALL ORDERS THIS WEEK</p>
          </div>
        </div>

        {/* Center: Promo code */}
        <div className="text-center">
          <p className="text-xs sm:text-sm font-semibold">Use code:</p>
          <p className="text-sm sm:text-base font-black bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
            PRINTFAST25
          </p>
        </div>

        {/* Right: Countdown timer */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold">ENDS IN</p>
            <div className="flex gap-1 sm:gap-2 text-xs sm:text-sm font-black">
              <span className="bg-red-500 px-2 py-1 rounded">{String(timeLeft.days).padStart(2, "0")}d</span>
              <span className="bg-red-500 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, "0")}h</span>
              <span className="bg-red-500 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, "0")}m</span>
              <span className="bg-red-500 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, "0")}s</span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close promo banner"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
