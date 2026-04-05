# UrgeEase Machine Learning Models

## Overview

The UrgeEase application uses machine learning models to detect and track **social media addiction severity** based on behavioral and survey data.

Two datasets were used:

1. Social Media Addiction vs Relationships Dataset
2. Social Media Users Behavioral Survey Dataset

Two machine learning algorithms were evaluated:

- Random Forest
- XGBoost

---

# Updated Design (IMPORTANT)

Originally, models classified users into 3 risk levels:

0 = Low  
1 = Moderate  
2 = High

### Current Approach

The system now predicts a **raw addiction score (2–9)** instead of only categories.

This allows:

- finer-grained feedback
- progress tracking over time
- better personalization

The score is still mapped to risk levels for interpretation:

| Score Range | Risk Level |
| ----------- | ---------- |
| 2–4         | Low        |
| 5–6         | Moderate   |
| 7–9         | High       |

---

# Dataset 1 – Social Media Addiction vs Relationships

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

- Addiction_Level (0–2)

Now:

- **Addicted_Score (2–9)** is used directly

---

# Dataset 2 – Social Media Users Behavioral Survey

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

---

# Behavioral Dependence Score

Since Dataset 2 had no labels, a **weighted behavioral score** was created.

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
| 2.5 – 3.5 | Moderate   |
| > 3.5     | High       |

---

# Machine Learning Pipeline

### Preprocessing

Numeric:

- Median imputation
- Standard scaling

Categorical:

- Most frequent imputation
- One-Hot Encoding

### Train/Test Split

- 80% Training
- 20% Testing

Note:

- Stratification removed for score model due to class imbalance

---

# Models

## Random Forest

- Robust to noisy behavioral data
- Handles mixed feature types
- Stable performance

## XGBoost

- Strong performance on structured datasets
- Captures complex relationships

---

# Model Results (Updated)

## Addiction Score Model (1–9)

Accuracy: **94.33%**

### Key Observations

- Model performs well on common scores (5–8)
- Rare scores (e.g., 2) are poorly learned due to imbalance
- Most errors occur between **adjacent scores** (e.g., 6 → 5 or 7)

This indicates the model captures **relative severity effectively**.

---

# Testing (NEW)

Pytest-based validation was implemented.

### Tests include:

- Model loading
- Prediction correctness
- Probability output validation
- Deterministic predictions
- Input schema validation

This ensures:

- reliability
- consistent outputs
- protection against invalid inputs

---

# Model Comparison

| Dataset               | Model         | Accuracy |
| --------------------- | ------------- | -------- |
| Relationships (Score) | Random Forest | 94.33%   |
| Users Survey          | Random Forest | 85.42%   |
| Users Survey          | XGBoost       | 83.33%   |

---

# Final Model Choice

For UrgeEase:

### Primary Model

- Random Forest (Users Behavioral Dataset)

### Secondary Model

- Random Forest (Score-based Addiction Model)

---

# Integration with UrgeEase

### Step 1 – User Input

Users provide:

- usage patterns
- emotional indicators
- behavioral responses

---

### Step 2 – Prediction

Model outputs:

---

### Step 3 – AI Intervention

Based on score:

| Score Range | Response                          |
| ----------- | --------------------------------- |
| Low         | Healthy usage feedback            |
| Moderate    | Behavior improvement strategies   |
| High        | AI-generated recovery plans (RAG) |

---

# Key Design Decision

The system uses a **continuous addiction score (2–9)** rather than only categories.

This enables:

- tracking user progress over time
- detecting gradual improvement
- more personalized AI responses

---

# Model Files

Stored in:

Examples:

- social_media_addiction_rf.joblib
- social_media_addiction_rf_score.joblib
- social_media_users_rf.joblib
- social_media_users_xgb.joblib

---
