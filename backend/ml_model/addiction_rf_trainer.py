from __future__ import annotations

from pathlib import Path
import pandas as pd

from base_trainer import BaseRandomForestTrainer


class AddictionRelationshipsTrainer(BaseRandomForestTrainer):
    # def map_addiction_level(self, score: int) -> int:
    #    if 2 <= score <= 4:
    #       return 0
    #    elif 5 <= score <= 6:
    #        return 1
    #    elif 7 <= score <= 9:
    #        return 2
    #    else:
    #        raise ValueError(f"Unexpected Addicted_Score: {score}")

    def load_and_prepare_data(self) -> tuple[pd.DataFrame, pd.Series]:
        df = pd.read_csv(self.data_file)

        df = df.drop(
            columns=[
                "Student_ID",
                "Academic_Level",
                "Country",
                "Most_Used_Platform",
            ]
        )

        #df["Addiction_Level"] = df["Addicted_Score"].apply(self.map_addiction_level)

        X = df.drop(columns=["Addicted_Score"])
        y = df["Addicted_Score"]

        return X, y


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent

    trainer = AddictionRelationshipsTrainer(
        data_file=base_dir / "data" / "social_media_addiction_relationships.csv",
        model_file=base_dir / "models" / "social_media_addiction_rf.joblib",
    )
    trainer.run()