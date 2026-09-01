/**
 * Scientifically accurate weather facts, rotated one per day. Content is
 * reviewed against standard meteorology references (NOAA/WMO) and deliberately
 * avoids invented numbers.
 */
export const WEATHER_FACTS: string[] = [
  "Millions of tiny water droplets make up a single cloud; water vapour condenses on tiny particles called condensation nuclei.",
  "Lightning is hotter than the surface of the Sun — roughly 30,000 °C in the narrow channel of a strike.",
  "Thunder follows lightning because sound travels far more slowly through air than light does.",
  "Warm air can hold more water vapour than cold air, which is why humid air feels heavy in the summer.",
  "The wind moves from areas of higher pressure to lower pressure — the bigger the difference, the stronger the wind.",
  "Rain begins inside a cloud when condensed droplets grow heavy enough for gravity to pull them down.",
  "A 'feels like' temperature, such as wind chill or heat index, is a human comfort estimate, not an air measurement.",
  "Snowflakes form when water vapour freezes into ice crystals in sub-zero clouds; each crystal grows into a unique six-sided pattern.",
  "The UV index climbs when the Sun is higher — it peaks around midday and is strongest near the equator in summer.",
  "Barometric pressure is the weight of the air above you; falling pressure often signals unsettled weather moving in.",
  "Fog is simply a cloud that forms at ground level when air near the surface cools enough to condense.",
  "Dew forms overnight as the ground cools; when air touches a cool surface it can no longer hold all its water vapour.",
  "Monsoons are seasonal wind shifts in which prevailing winds flip direction and carry large amounts of moisture inland.",
  "A cloud can weigh hundreds of tonnes — it stays up because the air beneath it is denser and pushes upward.",
  "Cirrus clouds idle at high altitude and are made almost entirely of ice crystals, even in summer.",
  "Relative humidity is how much water vapour the air holds compared to the maximum it could hold at that temperature.",
  "Dry air at a high temperature can feel comfortable, while the same read-out with high humidity can feel oppressive.",
  "The odour people notice before rain mostly comes from plant oils released into air that becomes more humid.",
  "Wind speed is measured in metres per second or kilometres per hour by anemometers, and direction tells us where it comes from.",
  "Two identical-looking hours of rain can vary hugely in what's actually falling: drizzle vs heavy downpour is about drop size and rate.",
];

export function weatherFactOfTheDay(now: Date = new Date()): string {
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return WEATHER_FACTS[dayOfYear % WEATHER_FACTS.length] ?? WEATHER_FACTS[0] ?? "";
}