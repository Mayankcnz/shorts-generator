export function formatTimestamp(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    throw new RangeError("Timestamp must be a non-negative finite number.");
  }

  const roundedSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const seconds = roundedSeconds % 60;

  const minuteAndSecond = [minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");

  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minuteAndSecond}`
    : minuteAndSecond;
}
