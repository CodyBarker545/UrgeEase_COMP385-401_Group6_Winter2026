from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class TriggerSignal:
    key: str
    label: str
    recommendation: str
    score: float


class TriggerService:
    """Derive practical trigger patterns from assessment answers."""

    @staticmethod
    def _to_float(raw_value: Any, default: float = 0.0) -> float:
        try:
            return float(raw_value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _is_yes(raw_value: Any) -> bool:
        return str(raw_value).strip().lower() in {"yes", "true", "1"}

    @classmethod
    def analyze(cls, answers: dict[str, Any], *, max_triggers: int = 4) -> dict[str, list[str]]:
        signals = cls._build_signals(answers)
        ranked = sorted(signals, key=lambda signal: signal.score, reverse=True)

        # Keep only strong signals so the plan focuses on the biggest problems.
        selected = [signal for signal in ranked if signal.score >= 3][:max_triggers]

        if not selected and ranked:
            # Still return one focus area so new users get a useful starting point.
            selected = ranked[:1]

        return {
            "topTriggers": [signal.label for signal in selected],
            "recommendations": [signal.recommendation for signal in selected],
        }

    @classmethod
    def _build_signals(cls, answers: dict[str, Any]) -> list[TriggerSignal]:
        mindless_use = cls._to_float(answers.get("Mindless_Use"))
        distraction_when_busy = cls._to_float(answers.get("Distraction_When_Busy"))
        restless_without_sm = cls._to_float(answers.get("Restless_Without_SM"))
        distractibility = cls._to_float(answers.get("Distractibility_Score"))
        worry = cls._to_float(answers.get("Worry_Score"))
        concentration = cls._to_float(answers.get("Concentration_Difficulty"))
        social_comparison = cls._to_float(answers.get("Social_Comparison"))
        validation = cls._to_float(answers.get("Validation_Seeking"))
        depression = cls._to_float(answers.get("Depression_Frequency"))
        interest_fluctuation = cls._to_float(answers.get("Interest_Fluctuation"))
        sleep_issues = cls._to_float(answers.get("Sleep_Issues"))
        daily_usage = max(
            cls._to_float(answers.get("Daily_Usage_Hours")),
            cls._to_float(answers.get("Avg_Daily_Usage_Hours")),
        )
        platform_count = cls._to_float(answers.get("Platform_Count"))
        sleep_hours = cls._to_float(answers.get("Sleep_Hours_Per_Night"), default=8)
        mental_health = cls._to_float(answers.get("Mental_Health_Score"), default=10)
        conflicts = cls._to_float(answers.get("Conflicts_Over_Social_Media"))
        academic_impact = 1.0 if cls._is_yes(answers.get("Affects_Academic_Performance")) else 0.0

        # These derived values let low sleep or low mental health affect triggers.
        sleep_debt = max(0.0, 7.0 - sleep_hours)
        mental_health_strain = max(0.0, 6.0 - mental_health)

        return [
            TriggerSignal(
                key="task_distraction",
                label="Distraction during work or study",
                recommendation="Use one 20-minute phone-free focus block with your phone out of reach.",
                score=max(distraction_when_busy, distractibility, concentration) + academic_impact,
            ),
            TriggerSignal(
                key="mindless_checking",
                label="Automatic checking without a clear purpose",
                recommendation="Before opening an app, pause for 10 minutes and name what you were about to avoid or seek.",
                score=max(mindless_use, restless_without_sm),
            ),
            TriggerSignal(
                key="sleep_disruption",
                label="Night-time use and sleep disruption",
                recommendation="Protect the last 30 minutes before bed by keeping social media off and charging your phone away from bed.",
                score=max(sleep_issues, sleep_debt + 2.0),
            ),
            TriggerSignal(
                key="validation_seeking",
                label="Validation seeking and comparison",
                recommendation="Mute one account that reliably triggers comparison and replace checking for reactions with a grounding activity.",
                score=max(validation, social_comparison),
            ),
            TriggerSignal(
                key="emotional_scroll",
                label="Low mood or worry-driven scrolling",
                recommendation="When worry or low mood shows up, try a 2-minute reset before opening social media: breathe, stand up, or message someone supportive.",
                score=max(worry, depression, interest_fluctuation, mental_health_strain + 2.0),
            ),
            TriggerSignal(
                key="heavy_usage",
                label="Long daily usage windows",
                recommendation="Choose one high-use time window today and replace the first 15 minutes with a planned offline activity.",
                score=max(daily_usage, platform_count),
            ),
            TriggerSignal(
                key="relationship_conflict",
                label="Conflict around social media use",
                recommendation="Set one clear boundary for social media during shared time, such as no scrolling during meals or conversations.",
                score=conflicts,
            ),
        ]
