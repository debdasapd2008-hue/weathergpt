import { BookOpen, Cloud, Droplets, GraduationCap, Sun, Wind, Zap } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/cn";
import { Card, CardGrid, PageHeader } from "@/components/Page";
import { ChatWindow } from "@/components/ChatWindow";
import {
  useEducationChat,
  type EducationActivity,
  type EducationDifficulty,
} from "@/hooks/useEducationChat";

const LESSONS = [
  {
    icon: Cloud,
    title: "Where weather comes from",
    body: "The Sun heats different parts of Earth unevenly. Warm air rises, cooler air flows in to replace it — and that movement is wind. As air rises it cools, and the water vapour inside it condenses into clouds and rain.",
  },
  {
    icon: Droplets,
    title: "Why it rains",
    body: "Clouds are made of millions of tiny water droplets. When droplets grow heavy enough, gravity pulls them down as rain. The precipitation chance in the forecast is our way of saying how likely that is.",
  },
  {
    icon: Sun,
    title: "UV light and your skin",
    body: "The UV index measures how strong the Sun's ultraviolet light is. It climbs toward midday and is stronger in summer and near the equator. Above 8, exposure times for sunburn become very short.",
  },
  {
    icon: Wind,
    title: "How wind chill works",
    body: "On a windy day your body loses heat faster than the thermometer would suggest. Wind chill is the 'feels like' temperature you get when wind and cold combine.",
  },
  {
    icon: Zap,
    title: "Thunderstorms explained",
    body: "Inside a tall cloud, ice and water bounce around and build up electric charge. When the charge gets large enough it discharges as lightning, and you hear the thunder later because sound travels slower than light.",
  },
];

const EDU_QUESTIONS = [
  "Explain humidity simply.",
  "What causes rain?",
  "Why do clouds form?",
  "What is atmospheric pressure?",
  "Explain monsoon.",
];

const DIFFICULTIES: { value: EducationDifficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const ACTIVITIES: { value: EducationActivity; label: string; hint: string }[] = [
  { value: "explain", label: "Explain", hint: "Clear, correct explanations" },
  { value: "quiz", label: "Quiz", hint: "Test yourself on weather" },
];

function SegmentedGroup<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-95",
            value === option.value
              ? "border-teal-500 bg-teal-600/15 text-teal-700 dark:border-teal-400/60 dark:text-teal-200"
              : "border-line text-ink-2 hover:border-teal-400 hover:text-teal-700 dark:border-white/10 dark:text-white/55 dark:hover:border-teal-400/40",
          )}
        >
          {option.label}
          {option.hint && (
            <span className="ml-1.5 hidden text-xs font-normal opacity-70 sm:inline">{option.hint}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function EducationPage() {
  const { t } = useI18n();
  const [difficulty, setDifficulty] = useState<EducationDifficulty>("beginner");
  const [activity, setActivity] = useState<EducationActivity>("explain");
  const chat = useEducationChat({ difficulty, activity });

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title={t("nav.education", "Education")}
        intro={t("education.intro", "Learn how weather works with short, illustrated lessons.")}
        index="08"
      />
      <CardGrid>
        {LESSONS.map((lesson, index) => (
          <Card key={lesson.title} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <lesson.icon size={20} aria-hidden="true" />
              </span>
              <span className="font-display text-2xl font-medium text-line-2 dark:text-white/10">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="font-display text-lg font-medium tracking-tight">{lesson.title}</h2>
            <p className="text-sm leading-relaxed text-ink-2 dark:text-white/60">{lesson.body}</p>
          </Card>
        ))}
      </CardGrid>

      <div className="panel mt-6 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
              <GraduationCap size={17} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink dark:text-white">Ask WeatherGPT</h2>
              <p className="text-xs text-ink-3 dark:text-white/40">
                Learn about any weather idea — set your level
              </p>
            </div>
          </div>
          <div className="ml-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <SegmentedGroup
              value={difficulty}
              onChange={setDifficulty}
              options={DIFFICULTIES}
              ariaLabel="Difficulty"
            />
            <SegmentedGroup
              value={activity}
              onChange={setActivity}
              options={ACTIVITIES}
              ariaLabel="Activity mode"
            />
          </div>
        </div>

        <div className="mt-4">
          <ChatWindow
            messages={chat.messages}
            input={chat.input}
            setInput={chat.setInput}
            loading={chat.loading}
            error={chat.error}
            onSend={chat.send}
            placeholder="Ask about weather science…"
            suggested={EDU_QUESTIONS}
            disabled={!chat.configured}
            disabledHint={t("ai.notConfiguredHint", "Ask an administrator to set AI_PROVIDER and AI_API_KEY.")}
            onClear={chat.clear}
            headerNote="Scientifically accurate answers from the Groq-powered WeatherGPT assistant."
          />
        </div>
      </div>
    </div>
  );
}