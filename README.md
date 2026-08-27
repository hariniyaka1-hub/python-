# Loan Default Prediction — Integrated Team Project

This version follows the requested flow:

Loan Applicant -> Input/Web Form -> Validation -> Preprocessing -> Feature Engineering -> ML Default Model -> Default Probability -> Risk Score -> Risk Category -> Explainability (SHAP) + What-if Engine -> Credit Risk Dashboard -> Human Review

## Team mapping
- Harini: ML training and model evaluation
- Akshaya: Flask backend/API and validation
- Kalyan: React frontend and dashboard UI
- Manideep: SHAP explainability, What-if, integration testing

## Important correction
The original notebook encoded `LoanID` and trained a separate Decision Tree, while the original frontend/backend used different field names. This integrated version removes `LoanID` from model inputs, uses the same 16 real applicant features everywhere, and uses one saved Random Forest pipeline for prediction, SHAP, What-if and dashboard calculations.

## Features used
Age, Income, LoanAmount, CreditScore, MonthsEmployed, NumCreditLines, InterestRate, LoanTerm, DTIRatio, Education, EmploymentType, MaritalStatus, HasMortgage, HasDependents, LoanPurpose, HasCoSigner.

## Backend
Open a terminal in `backend`:

```bash
python -m pip install -r requirements.txt
python app.py
```
Backend: http://127.0.0.1:5000

Useful endpoints:
- GET `/health`
- GET `/metadata`
- POST `/predict`
- POST `/what-if`
- GET `/dashboard`

## Frontend
Open another terminal in `frontend`:

```bash
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally http://localhost:5173).

## Retrain the model
The included model is already trained. If you want Harini to retrain it:

```bash
cd ml
python train_model.py
```

Then the new model is saved to `backend/loan_default_model.pkl`.

## Test the model

```bash
cd ml
python test_model.py
```

## Demo flow
1. Start backend.
2. Start frontend.
3. Fill the applicant form.
4. Click Predict Loan Risk.
5. Show default probability, risk score and risk category.
6. Explain the top SHAP factors.
7. Change a numeric field in What-if and run it again.
8. Show the dataset-level Credit Risk Dashboard.
9. Set the Human Review decision.
