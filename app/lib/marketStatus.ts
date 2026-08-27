function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return { weekday, minutesOfDay: hour * 60 + minute };
}

function isWeekday(weekday: string) {
  return !["Sat", "Sun"].includes(weekday);
}

/** Approximate local-exchange trading hours. Good enough for a personal dashboard, not exact to the minute. */
export function isMarketOpen(symbol: string, now: Date = new Date()): boolean {
  switch (symbol) {
    case "^KS11": {
      const { weekday, minutesOfDay } = localParts(now, "Asia/Seoul");
      return isWeekday(weekday) && minutesOfDay >= 9 * 60 && minutesOfDay <= 15 * 60 + 30;
    }
    case "^GSPC":
    case "^IXIC":
    case "^DJI":
    case "^SOX":
    case "^TNX": {
      const { weekday, minutesOfDay } = localParts(now, "America/New_York");
      return isWeekday(weekday) && minutesOfDay >= 9 * 60 + 30 && minutesOfDay <= 16 * 60;
    }
    case "KRW=X":
    case "CL=F":
    case "GC=F": {
      // Near round-the-clock weekday trading with a short daily break; approximate as "open on weekdays".
      const { weekday } = localParts(now, "America/New_York");
      return isWeekday(weekday);
    }
    case "BTC-USD":
      return true;
    default:
      return true;
  }
}
