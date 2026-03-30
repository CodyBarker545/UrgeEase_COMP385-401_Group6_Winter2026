from pathlib import Path
import pandas as pd
import joblib
    
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier


DATA_DIR = Path(__file__).resolve().parent / "data"
FILE_PATH = DATA_DIR / "social_media_users.csv"


def load_and_prepare_data() -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(FILE_PATH)

    # Rename columns to match notebook preprocessing
    df = df.rename(columns={
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
        "20. On a scale of 1 to 5, how often do you face issues regarding sleep?": "Sleep_Issues"
    })

    # Drop timestamp
    df = df.drop(columns=["Timestamp"])

    # Keep only rows where social media is used
    if "Uses_Social_Media" in df.columns:
        df = df[df["Uses_Social_Media"].astype(str).str.strip().str.lower() == "yes"].copy()

    # Convert age to numeric
    df["Age"] = pd.to_numeric(df["Age"], errors="coerce")

    # Map usage time text to approximate numeric hours
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
        "5+ hours": 6.0
    }

    df["Daily_Usage_Hours"] = df["Daily_Usage_Time"].map(usage_map)

    # Count number of platforms used
    def count_platforms(x: str) -> int:
        if pd.isna(x):
            return 0
        return len([p.strip() for p in str(x).split(",") if p.strip()])

    df["Platform_Count"] = df["Platforms_Used"].apply(count_platforms)

    # Standard response mapping for frequency questions
    freq_map = {
        "Never": 1,
        "Rarely": 2,
        "Sometimes": 3,
        "Often": 4,
        "Very Often": 5,
        "Always": 5
    }

    # Map ordinal survey fields where needed
    ordinal_columns = [
        "Mindless_Use",
        "Distraction_When_Busy",
        "Restless_Without_SM",
        "Concentration_Difficulty",
        "Comparison_Feeling",
        "Validation_Seeking",
        "Depression_Frequency"
    ]

    for col in ordinal_columns:
        if col in df.columns:
            # only map text values; numeric values will remain as-is where possible
            df[col] = df[col].replace(freq_map)
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Convert already numeric-looking columns
    numeric_like_columns = [
        "Distractibility_Score",
        "Worry_Score",
        "Social_Comparison",
        "Interest_Fluctuation",
        "Sleep_Issues"
    ]

    for col in numeric_like_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Create behavioral dependence score like in notebook
    dependence_features = [
        "Mindless_Use",
        "Distraction_When_Busy",
        "Restless_Without_SM",
        "Distractibility_Score",
        "Worry_Score",
        "Concentration_Difficulty",
        "Social_Comparison",
        "Validation_Seeking",
        "Depression_Frequency",
        "Interest_Fluctuation",
        "Sleep_Issues"
    ]

    # Average score across dependence-related features
    df["Behavioral_Dependence_Score"] = df[dependence_features].mean(axis=1)

    # Convert dependence score to class labels
    def map_dependence_risk(score: float) -> int:
        if score < 2.5:
            return 0   # low
        elif score < 3.5:
            return 1   # moderate
        else:
            return 2   # high

    df["Dependence_Risk"] = df["Behavioral_Dependence_Score"].apply(map_dependence_risk)

    # Drop columns that should not be features
    df = df.drop(columns=[
        "Daily_Usage_Time",
        "Platforms_Used",
        "Uses_Social_Media",
        "Organization_Type",
        "Comparison_Feeling",
        "Behavioral_Dependence_Score"
    ], errors="ignore")

    # Features and target
    X = df.drop(columns=["Dependence_Risk"])
    y = df["Dependence_Risk"]

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

    model = model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        random_state=42
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

    MODEL_PATH = MODEL_DIR / "social_media_users_xgb.joblib"
    joblib.dump(pipeline, MODEL_PATH)

    print(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()
from xgboost import XGBClassifier
