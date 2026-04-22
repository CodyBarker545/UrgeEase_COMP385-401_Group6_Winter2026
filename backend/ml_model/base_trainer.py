from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


class BaseRandomForestTrainer(ABC):
    # Sets up the service with the helpers it needs.
    def __init__(
        self,
        data_file: Path,
        model_file: Path,
        random_state: int = 42,
        test_size: float = 0.2,
    ) -> None:
        self.data_file = data_file
        self.model_file = model_file
        self.random_state = random_state
        self.test_size = test_size
        self.pipeline: Pipeline | None = None

    # Loads data and prepares features and labels.
    @abstractmethod
    def load_and_prepare_data(self) -> tuple[pd.DataFrame, pd.Series]:
        """Load raw CSV and return X, y."""
        raise NotImplementedError

    # Builds the machine learning training pipeline.
    def build_pipeline(self, X: pd.DataFrame) -> Pipeline:
        numeric_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
        categorical_features = X.select_dtypes(include=["object", "bool"]).columns.tolist()

        numeric_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )

        categorical_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore")),
            ]
        )

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", numeric_transformer, numeric_features),
                ("cat", categorical_transformer, categorical_features),
            ]
        )

        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            random_state=self.random_state,
            class_weight="balanced",
        )

        return Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("classifier", model),
            ]
        )

    # Trains the model and returns the split data.
    def train(self) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
        X, y = self.load_and_prepare_data()

        print("Feature columns:")
        print(X.columns.tolist())
        print("\nTarget distribution:")
        print(y.value_counts().sort_index())

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=self.test_size,
            random_state=self.random_state,
        )

        self.pipeline = self.build_pipeline(X)
        self.pipeline.fit(X_train, y_train)

        return X_test, y_test

    # Prints model evaluation results.
    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> None:
        if self.pipeline is None:
            raise ValueError("Pipeline has not been trained yet.")

        y_pred = self.pipeline.predict(X_test)

        print("\nAccuracy:")
        print(f"{accuracy_score(y_test, y_pred):.4f}")

        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, digits=4))

        print("\nConfusion Matrix:")
        print(confusion_matrix(y_test, y_pred))

    # Saves the trained model to disk.
    def save_model(self) -> None:
        if self.pipeline is None:
            raise ValueError("No trained pipeline to save.")

        self.model_file.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.pipeline, self.model_file)
        print(f"\nModel saved to {self.model_file}")

    # Runs the full training flow.
    def run(self) -> None:
        X_test, y_test = self.train()
        self.evaluate(X_test, y_test)
        self.save_model()
