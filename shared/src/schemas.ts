import { z } from "zod";

export const coordinatesSchema = z.object({
  lat: z.number().finite(),
  lon: z.number().finite(),
});

export const currentWeatherSchema = z.object({
  city: z.string().min(1),
  country: z.string(),
  condition: z.string(),
  description: z.string(),
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number().int().min(0).max(100),
  windSpeed: z.number(),
  windDirection: z.number().int().min(0).max(360),
  pressure: z.number(),
  visibility: z.number(),
  precipitation: z.number(),
  uvIndex: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
  icon: z.string(),
  // Optional enrichment when the provider offers it.
  clouds: z.number().int().min(0).max(100).optional(),
  localTime: z.string().optional(),
});

export const hourlyForecastSchema = z.object({
  time: z.string(),
  icon: z.string(),
  temperature: z.number(),
  precipitationProbability: z.number().int().min(0).max(100),
});

export const dailyForecastSchema = z.object({
  day: z.string(),
  icon: z.string(),
  high: z.number(),
  low: z.number(),
  precipitationProbability: z.number().int().min(0).max(100),
});

export const weatherQuerySchema = z
  .object({
    city: z.string().trim().min(1).max(100).optional(),
    lat: z.coerce.number().finite().min(-90).max(90).optional(),
    lon: z.coerce.number().finite().min(-180).max(180).optional(),
  })
  .refine((query) => Boolean(query.city) || (query.lat !== undefined && query.lon !== undefined), {
    message: "Provide either city= or lat= and lon=.",
  });

export const weatherResponseSchema = z.object({
  location: coordinatesSchema,
  current: currentWeatherSchema,
  hourly: z.array(hourlyForecastSchema),
  daily: z.array(dailyForecastSchema),
  // Official alerts delivered by the weather provider (never invented by us).
  alerts: z.array(
    z.object({
      event: z.string(),
      description: z.string(),
      source: z.string(),
      start: z.number(),
      end: z.number(),
      tags: z.array(z.string()),
    }),
  ),
});

export const geocodeMatchSchema = z.object({
  name: z.string().min(1),
  lat: z.number().finite(),
  lon: z.number().finite(),
  country: z.string(),
  state: z.string(),
  localName: z.string(),
  locality: z.string(),
});

export const airQualitySchema = z.object({
  aqi: z.number().int().min(0).max(5),
  pollutant: z.string(),
  pm25: z.number(),
  pm10: z.number(),
});

export const AIR_QUALITY_OPTIONAL_CODE = "AIR_QUALITY_UNAVAILABLE";

export const weatherRequestSchema = z.object({
  lat: z.number().finite(),
  lon: z.number().finite(),
});

export const aiStatusSchema = z.object({
  configured: z.boolean(),
  provider: z.string(),
  model: z.string(),
  imageSupported: z.boolean().optional(),
});

/**
 * The conversational style the AI should reply in. `auto` lets the model infer
 * the user's language/style from the message itself (Hinglish, Banglish, etc).
 */
export const chatStyleEnum = z.enum([
  "auto",
  "english",
  "simple-english",
  "hindi",
  "bengali",
  "hinglish",
  "banglish",
  "tanglish",
  "tamil",
  "telugu",
  "kannada",
  "malayalam",
  "gujarati",
  "punjabi",
  "odia",
  "marathi",
  "urdu",
]);

export type ChatStyle = z.infer<typeof chatStyleEnum>;

export const chatContextSchema = z.object({
  activeLabel: z.string().trim().min(1).max(120).optional(),
  destinationLabel: z.string().trim().min(1).max(120).optional(),
  mode: z
    .enum(["ai", "general", "education", "health", "farmers", "travellers"])
    .optional(),
  units: z.enum(["metric", "imperial"]).optional(),
}).optional();

/** An optional image attached to a chat message (multimodal). */
export const chatImageAttachmentSchema = z.object({
  dataUrl: z.string().min(8).max(8_000_000),
  mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
}).optional();

export const aiWeatherRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  current: currentWeatherSchema.optional(),
  hourly: z.array(hourlyForecastSchema).optional(),
  daily: z.array(dailyForecastSchema).optional(),
  location: coordinatesSchema.optional(),
  language: z.string().trim().min(1).max(40).optional(),
  chatStyle: chatStyleEnum.optional(),
  chatContext: chatContextSchema,
  imageAttachment: chatImageAttachmentSchema,
});

export const aiWeatherResponseSchema = z.object({
  answer: z.string(),
  provider: z.string(),
  model: z.string(),
});

export const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const aiGeneralRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  history: z.array(chatTurnSchema).max(20).optional(),
  language: z.string().trim().min(1).max(40).optional(),
  chatStyle: chatStyleEnum.optional(),
  chatContext: chatContextSchema,
  imageAttachment: chatImageAttachmentSchema,
  /** Compact weather snapshot so weather-aware sections get real context. */
  weatherSummary: z.string().trim().max(2000).optional(),
});

export const aiGeneralResponseSchema = z.object({
  answer: z.string(),
  provider: z.string(),
  model: z.string(),
});

export const aiImageRequestSchema = z.object({
  // data: URL (base64) produced by the camera / file picker on the client.
  dataUrl: z.string().min(8).max(8_000_000),
  mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  question: z.string().trim().min(1).max(500),
  language: z.string().trim().min(1).max(40).optional(),
});

export const aiImageResponseSchema = z.object({
  supported: z.boolean(),
  answer: z.string(),
  provider: z.string().optional(),
  model: z.string().optional(),
  reason: z.string().optional(),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type WeatherQuery = z.infer<typeof weatherQuerySchema>;
export type CurrentWeather = z.infer<typeof currentWeatherSchema>;
export type HourlyForecast = z.infer<typeof hourlyForecastSchema>;
export type DailyForecast = z.infer<typeof dailyForecastSchema>;
export type WeatherResponse = z.infer<typeof weatherResponseSchema>;
export type WeatherAlert = WeatherResponse["alerts"][number];
export type GeocodeMatch = z.infer<typeof geocodeMatchSchema>;
export type AirQuality = z.infer<typeof airQualitySchema>;
export type AiStatus = z.infer<typeof aiStatusSchema>;
export type ChatContext = z.infer<typeof chatContextSchema>;
export type AiWeatherRequest = z.infer<typeof aiWeatherRequestSchema>;
export type AiWeatherResponse = z.infer<typeof aiWeatherResponseSchema>;
export type AiGeneralRequest = z.infer<typeof aiGeneralRequestSchema>;
export type AiGeneralResponse = z.infer<typeof aiGeneralResponseSchema>;
export type AiImageRequest = z.infer<typeof aiImageRequestSchema>;
export type AiImageResponse = z.infer<typeof aiImageResponseSchema>;