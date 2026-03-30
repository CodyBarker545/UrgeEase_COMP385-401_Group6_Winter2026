from pathlib import Path

import joblib
import pandas as pd
import pytest


MODELS_DIR = Path(__file__).resolve().parents[1] / "ml_model" / "models"


@pytest.fixture(scope="module")
def addiction_model():
    model_path = MODELS_DIR / "social_media_addiction_rf.joblib"
    assert model_path.exists(), f"Missing model file: {model_path}"
    return joblib.load(model_path)


@pytest.fixture(scope="module")
def users_model():
    model_path = MODELS_DIR / "social_media_users_rf.joblib"
    assert model_path.exists(), f"Missing model file: {model_path}"
    return joblib.load(model_path)


@pytest.fixture
def addiction_sample():
    return pd.DataFrame(
        [
            {
                "Age": 21,
                "Gender": "Female",
                "Avg_Daily_Usage_Hours": 5.5,
                "Sleep_Hours_Per_Night": 6,
                "Mental_Health_Score": 5,
                "Relationship_Status": "Single",
                "Conflicts_Over_Social_Media": 3,
                "Affects_Academic_Performance": 4,
            }
        ]
    )


@pytest.fixture
def users_sample():
    # These must match the features in X after load_and_prepare_data()
    return pd.DataFrame(
        [
            {
                "Age": 22,
                "Gender": "Female",
                "Relationship_Status": "Single",
                "Occupation_Status": "Student",
                "Mindless_Use": 4,
                "Distraction_When_Busy": 4,
                "Restless_Without_SM": 3,
                "Distractibility_Score": 4,
                "Worry_Score": 3,
                "Concentration_Difficulty": 4,
                "Social_Comparison": 3,
                "Validation_Seeking": 4,
                "Depression_Frequency": 2,
                "Interest_Fluctuation": 3,
                "Sleep_Issues": 4,
                "Daily_Usage_Hours": 4.5,
                "Platform_Count": 3,
            }
        ]
    )


def test_addiction_model_loads(addiction_model):
    assert addiction_model is not None
    assert hasattr(addiction_model, "predict")


def test_users_model_loads(users_model):
    assert users_model is not None
    assert hasattr(users_model, "predict")


def test_addiction_model_predicts_valid_class(addiction_model, addiction_sample):
    pred = addiction_model.predict(addiction_sample)

    assert len(pred) == 1
    assert 2 <= int(pred[0]) <= 9


def test_users_model_predicts_valid_class(users_model, users_sample):
    pred = users_model.predict(users_sample)

    assert len(pred) == 1
    assert int(pred[0]) in {0, 1, 2}


def test_addiction_model_predict_proba(addiction_model, addiction_sample):
    assert hasattr(addiction_model, "predict_proba")

    probs = addiction_model.predict_proba(addiction_sample)

    assert probs.shape[0] == 1
    assert probs.shape[1] == len(addiction_model.classes_)
    assert abs(probs[0].sum() - 1.0) < 1e-6

def test_users_model_predict_proba(users_model, users_sample):
    assert hasattr(users_model, "predict_proba")

    probs = users_model.predict_proba(users_sample)

    assert probs.shape == (1, 3)
    assert abs(probs[0].sum() - 1.0) < 1e-6


def test_addiction_model_prediction_is_deterministic(addiction_model, addiction_sample):
    pred1 = addiction_model.predict(addiction_sample)
    pred2 = addiction_model.predict(addiction_sample)

    assert pred1[0] == pred2[0]


def test_users_model_prediction_is_deterministic(users_model, users_sample):
    pred1 = users_model.predict(users_sample)
    pred2 = users_model.predict(users_sample)

    assert pred1[0] == pred2[0]


def test_addiction_model_rejects_missing_columns(addiction_model, addiction_sample):
    bad_sample = addiction_sample.drop(columns=["Age"])

    with pytest.raises(Exception):
        addiction_model.predict(bad_sample)


def test_users_model_rejects_missing_columns(users_model, users_sample):
    bad_sample = users_sample.drop(columns=["Age"])

    with pytest.raises(Exception):
        users_model.predict(bad_sample)
        
def test_addiction_model_classes(addiction_model):
    valid_scores = {2, 3, 4, 5, 6, 7, 8, 9}
    assert set(addiction_model.classes_).issubset(valid_scores)
    assert len(addiction_model.classes_) >= 2