from pathlib import Path
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report

BASE = Path(__file__).resolve().parent.parent
model = joblib.load(BASE / "backend" / "loan_default_model.pkl")
df = pd.read_csv(BASE / "backend" / "Loan_default.csv")
features = [c for c in df.columns if c not in ["LoanID", "Default"]]
X = df[features]
y = df["Default"]

pred = model.predict(X)
prob = model.predict_proba(X)[:, 1]
print("Dataset rows:", len(df))
print("Accuracy:", round(accuracy_score(y, pred), 4))
print("Precision:", round(precision_score(y, pred, zero_division=0), 4))
print("Recall:", round(recall_score(y, pred, zero_division=0), 4))
print("F1:", round(f1_score(y, pred, zero_division=0), 4))
print("ROC-AUC:", round(roc_auc_score(y, prob), 4))
print("Confusion matrix:\n", confusion_matrix(y, pred))
print(classification_report(y, pred, zero_division=0))
