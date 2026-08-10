type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, fields?: Record<string, unknown>) {
  const line = { time: new Date().toISOString(), level, message, ...fields };
  const target = level === "error" ? console.error : console.log;
  target(JSON.stringify(line));
}

export const logger = {
  info: (message: string, fields?: Record<string, unknown>) => emit("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => emit("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => emit("error", message, fields),
};
