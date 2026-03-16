from pathlib import Path
import pandas as pd
import joblib
    
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from transformers import pipeline


DATA_DIR = Path(__file__).resolve().parent / "data"
FILE_PATH = DATA_DIR / "social_media_addiction_relationships.csv"


def map_addiction_level(score: int) -> int:
    """Map Addicted_Score to 3 classes:
    0 = low (2-4)
    1 = mid (5-6)
    2 = high (7-9)
    """
    if 2 <= score <= 4:
        return 0
    elif 5 <= score <= 6:
        return 1
    elif 7 <= score <= 9:
        return 2
    else:
        raise ValueError(f"Unexpected Addicted_Score: {score}")


def load_and_prepare_data() -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(FILE_PATH)

    # Drop columns that won't be used as features
    df = df.drop(columns=[
        "Student_ID",
        "Academic_Level",
        "Country",
        "Most_Used_Platform",
    ])

    # Create target from Addicted_Score
    df["Addiction_Level"] = df["Addicted_Score"].apply(map_addiction_level)

    # Features and target
    X = df.drop(columns=["Addicted_Score", "Addiction_Level"])
    y = df["Addiction_Level"]

    return X, y


def build_pipeline(X: pd.DataFrame) -> Pipeline:
    numeric_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_features = X.select_dtypes(include=["object", "bool"]).columns.tolist()

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        random_state=42,
        class_weight="balanced"
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", model),
    ])

    return pipeline


def main() -> None:
    X, y = load_and_prepare_data()

    print("Feature columns:")
    print(X.columns.tolist())
    print("\nTarget distribution:")
    print(y.value_counts().sort_index())

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    pipeline = build_pipeline(X)

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    print("\nAccuracy:")
    print(f"{accuracy_score(y_test, y_pred):.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, digits=4))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    

    MODEL_DIR = Path(__file__).resolve().parent / "models"
    MODEL_DIR.mkdir(exist_ok=True)

    MODEL_PATH = MODEL_DIR / "social_media_addiction_rf.joblib"

    joblib.dump(pipeline, MODEL_PATH)   

    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()