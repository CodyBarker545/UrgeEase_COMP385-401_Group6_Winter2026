# UrgeEase Machine Learning Models

## Overview

UrgeEase uses machine learning models to estimate social media addiction severity and behavioral dependence risk from assessment answers.

Two datasets were used:

1. Social Media Addiction vs Relationships Dataset
2. Social Media Users Behavioral Survey Dataset

Two machine learning algorithms were evaluated:

- Random Forest
- XGBoost

## Current Design

The system predicts a raw addiction score instead of only a broad category.

This allows:

- finer-grained feedback
- progress tracking over time
- better personalization for plans and chat context

The score is still mapped to risk levels for interpretation:

| Score Range | Risk Level |
| ----------- | ---------- |
| 2-4         | Low        |
| 5-6         | Moderate   |
| 7-9         | High       |

## Dataset 1 - Social Media Addiction vs Relationships

This dataset contains structured information about students and their social media usage patterns.

### Features Used

- Age
- Gender
- Avg_Daily_Usage_Hours
- Affects_Academic_Performance
- Sleep_Hours_Per_Night
- Mental_Health_Score
- Relationship_Status
- Conflicts_Over_Social_Media

### Removed Columns

- Student_ID
- Academic_Level
- Country
- Most_Used_Platform

### Target Variable

Previously:

- Addiction_Level (0-2)

Now:

- Addicted_Score is used directly

## Dataset 2 - Social Media Users Behavioral Survey

This dataset contains behavioral and psychological indicators.

### Features

Behavior indicators:

- Mindless_Use
- Distraction_When_Busy
- Restless_Without_SM
- Concentration_Difficulty
- Validation_Seeking
- Depression_Frequency
- Sleep_Issues
- Social_Comparison
- Interest_Fluctuation

Usage indicators:

- Daily_Usage_Hours
- Platform_Count

Demographics:

- Age
- Gender
- Relationship_Status
- Occupation_Status

## Behavioral Dependence Score

Since Dataset 2 had no labels, a weighted behavioral score was created.

### Weighted Features

| Feature                  | Weight |
| ------------------------ | ------ |
| Mindless_Use             | 1.2    |
| Distraction_When_Busy    | 1.1    |
| Restless_Without_SM      | 1.3    |
| Concentration_Difficulty | 1.2    |
| Depression_Frequency     | 1.2    |
| Sleep_Issues             | 1.1    |
| Distractibility_Score    | 1.0    |
| Validation_Seeking       | 1.0    |
| Interest_Fluctuation     | 1.0    |
| Social_Comparison        | 0.9    |
| Worry_Score              | 0.9    |

### Risk Mapping

| Score     | Risk Level |
| --------- | ---------- |
| < 2.5     | Low        |
| 2.5-3.5   | Moderate   |
| > 3.5     | High       |

## Machine Learning Pipeline

Preprocessing:

- numeric values use median imputation and standard scaling
- categorical values use most-frequent imputation and one-hot encoding

Train/test split:

- 80% training
- 20% testing

Stratification was removed for the score model due to class imbalance.

## Models

### Random Forest

- robust to noisy behavioral data
- handles mixed feature types
- stable performance

### XGBoost

- strong performance on structured datasets
- captures complex relationships

## Model Results

### Addiction Score Model

Accuracy: 94.33%

Key observations:

- Model performs well on common scores.
- Rare scores are harder to learn due to imbalance.
- Most errors occur between adjacent scores, which still preserves relative severity.

## Model Comparison

| Dataset               | Model         | Accuracy |
| --------------------- | ------------- | -------- |
| Relationships (Score) | Random Forest | 94.33%   |
| Users Survey          | Random Forest | 85.42%   |
| Users Survey          | XGBoost       | 83.33%   |

## Final Model Choice

For UrgeEase:

- Primary model: Random Forest for behavioral dependence risk
- Secondary model: Random Forest for score-based addiction severity

## Integration with UrgeEase

### Step 1 - User Input

Users provide usage patterns, emotional indicators, and behavioral responses through the assessment page.

### Step 2 - Prediction

The backend runs both model services and stores derived outputs in the `results` collection.

### Step 3 - Plan, Analytics, and Chat Context

The backend uses model outputs to:

- map the result to a risk level
- identify top triggers
- create a recovery plan
- show trends over time
- guide local RAG chat responses

## Testing

Pytest-based validation covers:

- model loading
- prediction correctness
- probability output validation
- deterministic predictions
- input schema validation

Run tests from `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -p no:cacheprovider
```

## Model Files

Model files are stored in this folder.

Examples:

- `social_media_addiction_rf.joblib`
- `social_media_addiction_rf_score.joblib`
- `social_media_users_rf.joblib`
- `social_media_users_xgb.joblib`
