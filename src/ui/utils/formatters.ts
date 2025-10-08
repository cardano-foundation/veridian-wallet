const formatShortDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
};

const formatLongDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatShortTime = (date: string) => {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimeToSec = (date: string) => {
  return new Date(date).toLocaleTimeString("en-GB");
};

const timeDifference = (timestamp: string) => {
  const startDate = new Date(timestamp);
  const endDate = new Date(); // Current date and time in local time zone
  const startDateUTC = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
    startDate.getUTCHours(),
    startDate.getUTCMinutes(),
    startDate.getUTCSeconds()
  ); // Convert start time to UTC in milliseconds
  const endDateUTC = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
    endDate.getUTCHours(),
    endDate.getUTCMinutes(),
    endDate.getUTCSeconds()
  ); // Convert current time to UTC in milliseconds
  const timeDifferenceMS = endDateUTC - startDateUTC;
  const timeDifferenceMins = Math.floor(timeDifferenceMS / 60000);
  const timeDifferenceHours = Math.floor(timeDifferenceMS / 3600000);
  const timeDifferenceDays = Math.floor(timeDifferenceMS / 86400000);
  const timeDifferenceWeeks = Math.floor(timeDifferenceMS / 604800000);
  // Approximate calculation for years based on average days in a year
  const timeDifferenceYears = Math.floor(timeDifferenceDays / 365.25);

  if (timeDifferenceHours < 1) {
    return [timeDifferenceMins, "m"];
  } else if (timeDifferenceHours < 24) {
    return [timeDifferenceHours, "h"];
  } else if (timeDifferenceDays < 7) {
    return [timeDifferenceDays, "d"];
  } else if (timeDifferenceDays < 365) {
    return [timeDifferenceWeeks, "w"];
  } else return [timeDifferenceYears, "y"];
};

const formatCurrencyUSD = (amount: number) => {
  const currencyFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  return currencyFormat.format(amount);
};

const ellipsisText = (raw: string, length: number, suffix = "...") => {
  return raw.substring(0, length || raw.length) + suffix;
};

function getUTCOffset(value?: Date | string | number) {
  if (!value) return "";

  const date = new Date(value);
  let result = "";

  result += date.getTimezoneOffset() > 0 ? "-" : "+";
  const offset = Math.abs(date.getTimezoneOffset());
  result += Math.floor(offset / 60);
  const minutes = offset % 60;
  if (minutes > 0) {
    result += ":" + minutes;
  }

  return "UTC " + result;
}

export {
  formatShortDate,
  formatLongDate,
  formatShortTime,
  formatTimeToSec,
  timeDifference,
  formatCurrencyUSD,
  ellipsisText,
  getUTCOffset,
};
