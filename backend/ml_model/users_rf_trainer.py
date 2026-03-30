from __future__ import annotations

from pathlib import Path
import pandas as pd

from base_trainer import BaseRandomForestTrainer


class SocialMediaUsersTrainer(BaseRandomForestTrainer):
    def map_dependence_risk(self, score: float) -> int:
        if score < 2.5:
            return 0
        elif score < 3.5:
            return 1
        else:
            return 2

    @staticmethod
    def count_platforms(value: str) -> int:
        if pd.isna(value):
            return 0
        return len([p.strip() for p in str(value).split(",") if p.strip()])

    def load_and_prepare_data(self) -> tuple[pd.DataFrame, pd.Series]:
        df = pd.read_csv(self.data_file)

        df = df.rename(
            columns={
                "1. What is your age?": "Age",
                "2. Gender": "Gender",
                "3. Relationship Status": "Relationship_Status",
                "4. Occupation Status": "Occupation_Status",
                "5. What type of organizations are you affiliated with?": "Organization_Type",
                "6. Do you use social media?": "Uses_Social_Media",
                "7. What social media platforms do you commonly use?": "Platforms_Used",
                "8. What is the average time you spend on social media every day?": "Daily_Usage_Time",
                "9. How often do you find yourself using Social media without a specific purpose?": "Mindless_Use",
                "10. How often do you get distracted by Social media when you are busy doing something?": "Distraction_When_Busy",
                "11. Do you feel restless if you haven't used Social media in a while?": "Restless_Without_SM",
                "12. On a scale of 1 to 5, how easily distracted are you?": "Distractibility_Score",
                "13. On a scale of 1 to 5, how much are you bothered by worries?": "Worry_Score",
                "14. Do you find it difficult to concentrate on things?": "Concentration_Difficulty",
                "15. On a scale of 1-5, how often do you compare yourself to other successful people through the use of social media?": "Social_Comparison",
                "16. Following the previous question, how do you feel about these comparisons, generally speaking?": "Comparison_Feeling",
                "17. How often do you look to seek validation from features of social media?": "Validation_Seeking",
                "18. How often do you feel depressed or down?": "Depression_Frequency",
                "19. On a scale of 1 to 5, how frequently does your interest in daily activities fluctuate?": "Interest_Fluctuation",
                "20. On a scale of 1 to 5, how often do you face issues regarding sleep?": "Sleep_Issues",
            }
        )

        df = df.drop(columns=["Timestamp"])

        if "Uses_Social_Media" in df.columns:
            df = df[
                df["Uses_Social_Media"].astype(str).str.strip().str.lower() == "yes"
            ].copy()

        df["Age"] = pd.to_numeric(df["Age"], errors="coerce")

        usage_map = {
            "Less than an Hour": 0.5,
            "Less than 1 hour": 0.5,
            "Between 1 and 2 hours": 1.5,
            "1-2 hours": 1.5,
            "Between 2 and 3 hours": 2.5,
            "2-3 hours": 2.5,
            "Between 3 and 4 hours": 3.5,
            "3-4 hours": 3.5,
            "Between 4 and 5 hours": 4.5,
            "4-5 hours": 4.5,
            "More than 5 hours": 6.0,
            "5+ hours": 6.0,
        }

        df["Daily_Usage_Hours"] = df["Daily_Usage_Time"].map(usage_map)
        df["Platform_Count"] = df["Platforms_Used"].apply(self.count_platforms)

        freq_map = {
            "Never": 1,
            "Rarely": 2,
            "Sometimes": 3,
            "Often": 4,
            "Very Often": 5,
            "Always": 5,
        }

        ordinal_columns = [
            "Mindless_Use",
            "Distraction_When_Busy",
            "Restless_Without_SM",
            "Concentration_Difficulty",
            "Comparison_Feeling",
            "Validation_Seeking",
            "Depression_Frequency",
        ]

        for col in ordinal_columns:
            if col in df.columns:
                df[col] = df[col].replace(freq_map)
                df[col] = pd.to_numeric(df[col], errors="coerce")

        numeric_like_columns = [
            "Distractibility_Score",
            "Worry_Score",
            "Social_Comparison",
            "Interest_Fluctuation",
            "Sleep_Issues",
        ]

        for col in numeric_like_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        weights = {
            "Mindless_Use": 1.2,
            "Distraction_When_Busy": 1.1,
            "Restless_Without_SM": 1.3,
            "Distractibility_Score": 1.0,
            "Worry_Score": 0.9,
            "Concentration_Difficulty": 1.2,
            "Social_Comparison": 0.9,
            "Validation_Seeking": 1.0,
            "Depression_Frequency": 1.2,
            "Interest_Fluctuation": 1.0,
            "Sleep_Issues": 1.1,
        }

        weighted_sum = 0
        total_weight = 0

        for feature, weight in weights.items():
            weighted_sum += df[feature] * weight
            total_weight += weight

        df["Behavioral_Dependence_Score"] = weighted_sum / total_weight
        df["Dependence_Risk"] = df["Behavioral_Dependence_Score"].apply(
            self.map_dependence_risk
        )

        df = df.drop(
            columns=[
                "Daily_Usage_Time",
                "Platforms_Used",
                "Uses_Social_Media",
                "Organization_Type",
                "Comparison_Feeling",
                "Behavioral_Dependence_Score",
            ],
            errors="ignore",
        )

        X = df.drop(columns=["Dependence_Risk"])
        y = df["Dependence_Risk"]

        return X, y


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent

    trainer = SocialMediaUsersTrainer(
        data_file=base_dir / "data" / "social_media_users.csv",
        model_file=base_dir / "models" / "social_media_users_rf.joblib",
    )
    trainer.run()