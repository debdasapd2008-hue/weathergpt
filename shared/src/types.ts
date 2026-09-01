/**
 * Contract shared between server and client.
 *
 * The server is the only place that talks to upstream providers. The client
 * calls the REST API (defined in server/routes) and consumes these types.
 */
export type {
  Coordinates,
  WeatherQuery,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherResponse,
  AiStatus,
  AiWeatherRequest,
  AiWeatherResponse,
  ChatStyle,
  ChatContext,
} from "./schemas";