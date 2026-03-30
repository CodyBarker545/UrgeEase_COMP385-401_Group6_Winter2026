
# UrgeEase Machine Learning Models

## Overview
The UrgeEase application uses machine learning models to detect potential **social media addiction risk** based on behavioral and survey data.

Two datasets were used to train and evaluate classification models:

1. Social Media Addiction vs Relationships Dataset
2. Social Media Users Behavioral Survey Dataset

Two machine learning algorithms were evaluated:

- Random Forest
- XGBoost (Extreme Gradient Boosting)

The models classify users into three addiction risk levels:

0 = Low Risk  
1 = Moderate Risk  
2 = High Risk  

These predictions are then used by the UrgeEase system to trigger AI-based behavioral recommendations.

---

# Dataset 1 – Social Media Addiction vs Relationships

This dataset contains structured information about students and their social media usage patterns, including mental health indicators and academic impacts.

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

Student_ID  
Academic_Level  
Country  
Most_Used_Platform  

### Target Variable

The dataset contains an **Addicted_Score (2–9)** which was mapped into classification labels.

Score Range | Addiction Level
----------- | ---------------
2–4 | Low
5–6 | Moderate
7–9 | High

---

# Dataset 2 – Social Media Users Behavioral Survey

This dataset contains survey responses about social media behavior and mental health indicators.

Survey responses were converted into numerical features representing behavioral indicators of social media addiction.

### Example Features

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

The behavioral survey dataset did **not contain an addiction label**.

To train a machine learning model, a **Behavioral Dependence Score** was created using weighted behavioral indicators commonly associated with social media addiction.

These indicators reflect behavioral addiction characteristics such as:

- compulsive usage
- withdrawal symptoms
- emotional dependence
- sleep disruption
- concentration difficulty

### Weighted Behavioral Indicators

Each behavioral feature was assigned a weight based on its relative importance.

| Feature | Weight |
|-------|-------|
| Mindless_Use | 1.2 |
| Distraction_When_Busy | 1.1 |
| Restless_Without_SM | 1.3 |
| Concentration_Difficulty | 1.2 |
| Depression_Frequency | 1.2 |
| Sleep_Issues | 1.1 |
| Distractibility_Score | 1.0 |
| Validation_Seeking | 1.0 |
| Interest_Fluctuation | 1.0 |
| Social_Comparison | 0.9 |
| Worry_Score | 0.9 |

The final score is calculated using a **weighted average** of these behavioral features.

### Risk Mapping

Score | Risk Level
----- | ----------
< 2.5 | Low
2.5 – 3.5 | Moderate
> 3.5 | High

This generated the **Dependence_Risk** classification label used to train the model.

---

# Machine Learning Pipeline

Both models use a Scikit-Learn pipeline consisting of the following stages.

### Data Preprocessing

Numeric features:
- Median imputation
- Standard scaling

Categorical features:
- Most frequent imputation
- One-Hot Encoding

### Train/Test Split

80% Training  
20% Testing  

Stratified sampling preserves class balance.

---

# Models Evaluated

## Random Forest

Random Forest builds multiple decision trees and aggregates their predictions.

Advantages:

- Handles noisy survey data well
- Robust against overfitting
- Works well with mixed feature types
- Performs well on behavioral datasets

---

## XGBoost

XGBoost builds trees sequentially to reduce prediction errors.

Advantages:

- High performance on structured datasets
- Efficient and scalable
- Captures complex nonlinear relationships

---

# Model Results

## Dataset: Social Media Addiction vs Relationships

### Random Forest
Accuracy: **94.33%**

Confusion Matrix:

[[17 3 0]  
 [3 35 1]  
 [0 1 81]]

### XGBoost
Accuracy: **94.33%**

Confusion Matrix:

[[17 3 0]  
 [3 35 1]  
 [0 1 81]]

Both models performed almost identically.

---

## Dataset: Social Media Users Behavioral Survey

### Random Forest (Weighted Behavioral Score)
Accuracy: **85.42%**

Confusion Matrix:

[[13 7 0]  
 [0 39 0]  
 [0 7 30]]

### XGBoost
Accuracy: **83.33%**

Confusion Matrix:

[[15 5 0]  
 [3 33 4]  
 [0 4 32]]

---

# Model Comparison

Dataset | Model | Accuracy
------- | ----- | --------
Relationships | Random Forest | 94.33%
Relationships | XGBoost | 94.33%
Users Survey (Weighted) | Random Forest | 85.42%
Users Survey | XGBoost | 83.33%

Key observations:

- Both algorithms perform equally well on the structured dataset.
- Random Forest performs better on behavioral survey data.
- Survey datasets contain more noise and Random Forest handles this effectively.

---

# Final Model Choice

For the UrgeEase application, the **Random Forest model trained on the Social Media Users dataset** is used.

Reasons:

- Matches the questionnaire used in the app
- Handles noisy behavioral data well
- Provides stable predictions across risk levels

---

# Integration with UrgeEase

The ML model is the first step in the behavioral support pipeline.

### Step 1 – User Questionnaire

Users answer questions about:

- daily social media usage
- distraction levels
- sleep patterns
- emotional state

### Step 2 – Addiction Risk Prediction

The trained model predicts:

Low Risk  
Moderate Risk  
High Risk  

### Step 3 – AI Behavioral Support

Based on prediction:

Risk Level | Response
---------- | --------
Low | Healthy usage insights
Moderate | Habit improvement suggestions
High | AI-generated recovery strategies via RAG

The RAG system retrieves recovery guidance documents and generates personalized advice.

---

# Model Files

Stored in:

backend/ml_model/data/models/

Example files:

social_media_addiction_rf.joblib  
social_media_addiction_xgb.joblib  
social_media_users_rf.joblib  
social_media_users_xgb.joblib  
