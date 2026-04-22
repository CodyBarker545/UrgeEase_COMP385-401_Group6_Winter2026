from __future__ import annotations

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.trigger_service import TriggerService


def test_trigger_service_prioritizes_highest_assessment_patterns():
    answers = {
        "Mindless_Use": "2",
        "Distraction_When_Busy": "5",
        "Restless_Without_SM": "2",
        "Distractibility_Score": "5",
        "Worry_Score": "2",
        "Concentration_Difficulty": "4",
        "Social_Comparison": "3",
        "Validation_Seeking": "2",
        "Depression_Frequency": "2",
        "Interest_Fluctuation": "2",
        "Sleep_Issues": "5",
        "Daily_Usage_Hours": "3.5",
        "Avg_Daily_Usage_Hours": "3.5",
        "Platform_Count": "2",
        "Affects_Academic_Performance": "Yes",
        "Sleep_Hours_Per_Night": "5",
        "Mental_Health_Score": "7",
        "Conflicts_Over_Social_Media": "1",
    }

    result = TriggerService.analyze(answers)

    assert result["topTriggers"][0] == "Distraction during work or study"
    assert "Night-time use and sleep disruption" in result["topTriggers"]
    assert len(result["recommendations"]) == len(result["topTriggers"])


def test_trigger_service_falls_back_to_one_pattern_for_low_scores():
    answers = {
        "Mindless_Use": "1",
        "Distraction_When_Busy": "1",
        "Restless_Without_SM": "1",
        "Distractibility_Score": "1",
        "Worry_Score": "1",
        "Concentration_Difficulty": "1",
        "Social_Comparison": "1",
        "Validation_Seeking": "1",
        "Depression_Frequency": "1",
        "Interest_Fluctuation": "1",
        "Sleep_Issues": "1",
        "Daily_Usage_Hours": "1.5",
        "Avg_Daily_Usage_Hours": "1.5",
        "Platform_Count": "1",
        "Affects_Academic_Performance": "No",
        "Sleep_Hours_Per_Night": "8",
        "Mental_Health_Score": "9",
        "Conflicts_Over_Social_Media": "1",
    }

    result = TriggerService.analyze(answers)

    assert len(result["topTriggers"]) == 1
    assert len(result["recommendations"]) == 1
