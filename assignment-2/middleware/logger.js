// Custom request logger middleware.
// Logs the method, path, final status code and how long the request took.
// No third-party logging library is used.

const supportsColour = process.stdout.isTTY;

const paint = (code, text) => (supportsColour ? `\u001b[${code}m${text}\u001b[0m` : text);

const statusColour = (status) => {
  if (status >= 500) return "31"; // red
  if (status >= 400) return "33"; // yellow
  if (status >= 300) return "36"; // cyan
  return "32"; // green
};

const timestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const logger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const method = req.method.padEnd(6);
    const path = req.originalUrl.padEnd(28);
    const status = paint(statusColour(res.statusCode), String(res.statusCode).padEnd(4));
    const duration = `${durationMs.toFixed(1)} ms`.padStart(9);

    console.log(`${paint("90", timestamp())}  ${method} ${path} ${status} ${duration}`);

    if (["POST", "PUT"].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      console.log(`${" ".repeat(10)}body ${paint("90", JSON.stringify(req.body))}`);
    }
  });

  next();
};

module.exports = logger;
