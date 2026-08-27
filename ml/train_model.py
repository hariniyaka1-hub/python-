from pathlib import Path
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "backend" / "Loan_default.csv"
OUT = BASE / "backend" / "loan_default_model.pkl"

df = pd.read_csv(DATA)
features = [c for c in df.columns if c not in ["LoanID", "Default"]]
X = df[features]
y = df["Default"]

categorical = X.select_dtypes(include="object").columns.tolist()
numerical = [c for c in features if c not in categorical]

preprocessor = ColumnTransformer([
    ("categorical", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), categorical),
    ("numerical", "passthrough", numerical),
], verbose_feature_names_out=False)

classifier = RandomForestClassifier(
    n_estimators=50,
    max_depth=10,
    random_state=42,
    class_weight="balanced_subsample",
    n_jobs=-1,
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("model", classifier),
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
pipeline.fit(X_train, y_train)

pred = pipeline.predict(X_test)
prob = pipeline.predict_proba(X_test)[:, 1]

print("Accuracy :", round(accuracy_score(y_test, pred), 4))
print("Precision:", round(precision_score(y_test, pred, zero_division=0), 4))
print("Recall   :", round(recall_score(y_test, pred, zero_division=0), 4))
print("F1 Score :", round(f1_score(y_test, pred, zero_division=0), 4))
print("ROC-AUC  :", round(roc_auc_score(y_test, prob), 4))

joblib.dump(pipeline, OUT, compress=3)
print(f"Saved: {OUT}")
