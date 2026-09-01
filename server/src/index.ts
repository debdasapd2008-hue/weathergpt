import { corsOrigins, loadConfig } from "./config";
import { createApp } from "./app";

const config = loadConfig();
const app = createApp(config);

app.listen(config.PORT, () => {
  console.log(
    `[server] WeatherGPT listening on http://localhost:${config.PORT} (env=${config.NODE_ENV})`,
  );
  const origins = corsOrigins(config);
  console.log(
    `[server] CORS origins: ${origins.length > 0 ? origins.join(", ") : "same-origin only"}`,
  );
});