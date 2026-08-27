 import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";

const API_URL = "http://127.0.0.1:5000";

const NUMERIC_FIELDS = [
  "Age",
  "Income",
  "LoanAmount",
  "CreditScore",
  "MonthsEmployed",
  "NumCreditLines",
  "InterestRate",
  "LoanTerm",
  "DTIRatio",
];

const FALLBACK_CATEGORIES = {
  Education: ["High School", "Bachelor's", "Master's", "PhD"],
  EmploymentType: [
    "Full-time",
    "Part-time",
    "Self-employed",
    "Unemployed",
  ],
  MaritalStatus: ["Single", "Married", "Divorced"],
  HasMortgage: ["Yes", "No"],
  HasDependents: ["Yes", "No"],
  LoanPurpose: ["Auto", "Business", "Education", "Home", "Other"],
  HasCoSigner: ["Yes", "No"],
};

const INITIAL_FORM = {
  Age: "",
  Income: "",
  LoanAmount: "",
  CreditScore: "",
  MonthsEmployed: "",
  NumCreditLines: "",
  InterestRate: "",
  LoanTerm: "",
  DTIRatio: "",
  Education: "",
  EmploymentType: "",
  MaritalStatus: "",
  HasMortgage: "",
  HasDependents: "",
  LoanPurpose: "",
  HasCoSigner: "",
};

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ApplicationPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<ApplicationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

/* =========================================================
   APPLICATION PAGE
========================================================= */

function ApplicationPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categoryValues, setCategoryValues] =
    useState(FALLBACK_CATEGORIES);

  const [ranges, setRanges] = useState({
    Age: [18, 69],
    Income: [15000, 149999],
    LoanAmount: [5000, 249999],
    CreditScore: [300, 849],
    MonthsEmployed: [0, 119],
    NumCreditLines: [1, 4],
    InterestRate: [2, 25],
    LoanTerm: [12, 60],
    DTIRatio: [0.1, 0.9],
  });

  /* Get exact category values from Flask.
     This prevents frontend/backend category mismatch. */
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const response = await fetch(`${API_URL}/metadata`);

        if (!response.ok) {
          throw new Error("Metadata unavailable");
        }

        const data = await response.json();

        if (data.category_values) {
          setCategoryValues(data.category_values);
        }

        if (data.ranges) {
          setRanges(data.ranges);
        }
      } catch (err) {
        console.log(
          "Using default form options because metadata could not be loaded."
        );
      }
    };

    loadMetadata();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const emptyField = Object.entries(formData).find(
      ([, value]) => value === ""
    );

    if (emptyField) {
      setError(
        "Please fill all the fields before predicting."
      );
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,

        Age: Number(formData.Age),
        Income: Number(formData.Income),
        LoanAmount: Number(formData.LoanAmount),
        CreditScore: Number(formData.CreditScore),
        MonthsEmployed: Number(formData.MonthsEmployed),
        NumCreditLines: Number(formData.NumCreditLines),
        InterestRate: Number(formData.InterestRate),
        LoanTerm: Number(formData.LoanTerm),
        DTIRatio: Number(formData.DTIRatio),
      };

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.error || "Prediction failed."
        );
      }

      /*
        Send the applicant data and prediction result
        to the second page.
      */
      navigate("/result", {
        state: {
          formData: data,
          result: responseData,
          categoryValues,
          ranges,
        },
      });
    } catch (err) {
      console.error("Prediction error:", err);

      setError(
        err.message ||
          "Unable to connect to the backend. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="top-header">
        <div className="brand-area">
          <div className="brand-icon">₹</div>

          <div>
            <h1>LOAN DEFAULT PREDICTION</h1>
            <p>AI-Assisted Credit Risk Assessment</p>
          </div>
        </div>

        <div className="header-status">
          <span className="status-dot"></span>
          ML Risk Engine
        </div>
      </header>

      <main className="page-container">
        {/* PROGRESS */}
        <div className="progress-container">
          <div className="progress-step active">
            <span>1</span>
            <div>
              <strong>Application</strong>
              <small>Enter details</small>
            </div>
          </div>

          <div className="progress-line"></div>

          <div className="progress-step">
            <span>2</span>
            <div>
              <strong>Risk Assessment</strong>
              <small>View prediction</small>
            </div>
          </div>
        </div>

        {/* HERO */}
        <section className="hero-section">
          <div>
            <div className="eyebrow">SMART CREDIT ANALYSIS</div>

            <h2>
              Assess loan risk with
              <span> Machine Learning</span>
            </h2>

            <p>
              Enter the applicant information below. Our trained
              Random Forest model will evaluate the default risk
              and generate an explainable assessment.
            </p>
          </div>

          <div className="hero-mini-card">
            <div className="mini-icon">AI</div>
            <div>
              <strong>Predict • Explain • Compare</strong>
              <span>AI-assisted risk assessment</span>
            </div>
          </div>
        </section>

        {/* FORM CARD */}
        <section className="form-card">
          <div className="form-card-header">
            <div>
              <span className="section-number">01</span>
              <div>
                <h3>Applicant Information</h3>
                <p>
                  Provide accurate information for better risk
                  assessment.
                </p>
              </div>
            </div>

            <span className="required-note">
              * All fields required
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* PERSONAL INFORMATION */}
            <div className="form-section">
              <div className="subsection-title">
                <span>👤</span>
                <div>
                  <h4>Personal Information</h4>
                  <p>Basic applicant profile</p>
                </div>
              </div>

              <div className="form-grid">
                <FormInput
                  label="Age"
                  name="Age"
                  value={formData.Age}
                  onChange={handleChange}
                  placeholder="Enter age"
                  type="number"
                  min={ranges.Age[0]}
                  max={ranges.Age[1]}
                />

                <FormSelect
                  label="Education"
                  name="Education"
                  value={formData.Education}
                  onChange={handleChange}
                  options={categoryValues.Education}
                  placeholder="Select education"
                />

                <FormSelect
                  label="Employment Type"
                  name="EmploymentType"
                  value={formData.EmploymentType}
                  onChange={handleChange}
                  options={categoryValues.EmploymentType}
                  placeholder="Select employment"
                />

                <FormSelect
                  label="Marital Status"
                  name="MaritalStatus"
                  value={formData.MaritalStatus}
                  onChange={handleChange}
                  options={categoryValues.MaritalStatus}
                  placeholder="Select marital status"
                />
              </div>
            </div>

            {/* FINANCIAL INFORMATION */}
            <div className="form-section">
              <div className="subsection-title">
                <span>💰</span>
                <div>
                  <h4>Financial Information</h4>
                  <p>Applicant financial profile</p>
                </div>
              </div>

              <div className="form-grid">
                <FormInput
                  label="Annual Income"
                  name="Income"
                  value={formData.Income}
                  onChange={handleChange}
                  placeholder="Enter annual income"
                  type="number"
                  min={ranges.Income[0]}
                  max={ranges.Income[1]}
                />

                <FormInput
                  label="Credit Score"
                  name="CreditScore"
                  value={formData.CreditScore}
                  onChange={handleChange}
                  placeholder="300 - 849"
                  type="number"
                  min={ranges.CreditScore[0]}
                  max={ranges.CreditScore[1]}
                />

                <FormInput
                  label="Months Employed"
                  name="MonthsEmployed"
                  value={formData.MonthsEmployed}
                  onChange={handleChange}
                  placeholder="Enter months"
                  type="number"
                  min={ranges.MonthsEmployed[0]}
                  max={ranges.MonthsEmployed[1]}
                />

                <FormInput
                  label="Debt-to-Income Ratio"
                  name="DTIRatio"
                  value={formData.DTIRatio}
                  onChange={handleChange}
                  placeholder="Example: 0.30"
                  type="number"
                  step="0.01"
                  min={ranges.DTIRatio[0]}
                  max={ranges.DTIRatio[1]}
                />

                <FormInput
                  label="Number of Credit Lines"
                  name="NumCreditLines"
                  value={formData.NumCreditLines}
                  onChange={handleChange}
                  placeholder="1 - 4"
                  type="number"
                  min={ranges.NumCreditLines[0]}
                  max={ranges.NumCreditLines[1]}
                />
              </div>
            </div>

            {/* LOAN INFORMATION */}
            <div className="form-section">
              <div className="subsection-title">
                <span>🏦</span>
                <div>
                  <h4>Loan Information</h4>
                  <p>Details about the requested loan</p>
                </div>
              </div>

              <div className="form-grid">
                <FormInput
                  label="Loan Amount"
                  name="LoanAmount"
                  value={formData.LoanAmount}
                  onChange={handleChange}
                  placeholder="Enter loan amount"
                  type="number"
                  min={ranges.LoanAmount[0]}
                  max={ranges.LoanAmount[1]}
                />

                <FormInput
                  label="Interest Rate (%)"
                  name="InterestRate"
                  value={formData.InterestRate}
                  onChange={handleChange}
                  placeholder="Example: 8.5"
                  type="number"
                  step="0.01"
                  min={ranges.InterestRate[0]}
                  max={ranges.InterestRate[1]}
                />

                <FormInput
                  label="Loan Term (Months)"
                  name="LoanTerm"
                  value={formData.LoanTerm}
                  onChange={handleChange}
                  placeholder="12 - 60"
                  type="number"
                  min={ranges.LoanTerm[0]}
                  max={ranges.LoanTerm[1]}
                />

                <FormSelect
                  label="Loan Purpose"
                  name="LoanPurpose"
                  value={formData.LoanPurpose}
                  onChange={handleChange}
                  options={categoryValues.LoanPurpose}
                  placeholder="Select loan purpose"
                />
              </div>
            </div>

            {/* ADDITIONAL INFORMATION */}
            <div className="form-section">
              <div className="subsection-title">
                <span>📋</span>
                <div>
                  <h4>Additional Information</h4>
                  <p>Additional financial indicators</p>
                </div>
              </div>

              <div className="form-grid">
                <FormSelect
                  label="Has Mortgage"
                  name="HasMortgage"
                  value={formData.HasMortgage}
                  onChange={handleChange}
                  options={categoryValues.HasMortgage}
                  placeholder="Select"
                />

                <FormSelect
                  label="Has Dependents"
                  name="HasDependents"
                  value={formData.HasDependents}
                  onChange={handleChange}
                  options={categoryValues.HasDependents}
                  placeholder="Select"
                />

                <FormSelect
                  label="Has Co-Signer"
                  name="HasCoSigner"
                  value={formData.HasCoSigner}
                  onChange={handleChange}
                  options={categoryValues.HasCoSigner}
                  placeholder="Select"
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="error-message">
                <span>!</span>
                <div>
                  <strong>Unable to continue</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* BUTTON */}
            <div className="submit-area">
              <div className="secure-note">
                <span>🔒</span>
                <div>
                  <strong>AI-Assisted Assessment</strong>
                  <small>
                    Results are estimates and support human
                    decision-making.
                  </small>
                </div>
              </div>

              <button
                type="submit"
                className="predict-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Analyzing Application...
                  </>
                ) : (
                  <>
                    Predict Loan Risk
                    <span className="button-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">
        Loan Default Prediction • Machine Learning • Explainable AI
      </footer>
    </div>
  );
}

/* =========================================================
   RESULT PAGE
========================================================= */

function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const pageState = location.state;

  const [whatIfField, setWhatIfField] = useState("");
  const [whatIfValue, setWhatIfValue] = useState("");
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfError, setWhatIfError] = useState("");

  /* If someone directly opens /result, send them back. */
  if (!pageState || !pageState.result || !pageState.formData) {
    return (
      <div className="empty-result-page">
        <div className="empty-result-card">
          <div className="empty-result-icon">📊</div>
          <h2>No Assessment Available</h2>
          <p>
            Please complete a loan application before viewing
            the risk assessment.
          </p>

          <button
            className="secondary-btn"
            onClick={() => navigate("/")}
          >
            ← Go to Application
          </button>
        </div>
      </div>
    );
  }

  const { formData, result } = pageState;

  const categoryValues =
    pageState.categoryValues || FALLBACK_CATEGORIES;

  const ranges =
    pageState.ranges || {
      Age: [18, 69],
      Income: [15000, 149999],
      LoanAmount: [5000, 249999],
      CreditScore: [300, 849],
      MonthsEmployed: [0, 119],
      NumCreditLines: [1, 4],
      InterestRate: [2, 25],
      LoanTerm: [12, 60],
      DTIRatio: [0.1, 0.9],
    };

  const riskScore = Number(result.risk_score || 0);

  const prediction =
    Number(result.default_prediction) === 1
      ? "Default"
      : "No Default";

  const riskCategory =
    result.risk_category || "Unknown Risk";

  const riskClass = getRiskClass(riskCategory);

  const handleWhatIf = async () => {
    setWhatIfError("");
    setWhatIfResult(null);

    if (!whatIfField) {
      setWhatIfError("Please select a feature to change.");
      return;
    }

    if (whatIfValue === "") {
      setWhatIfError("Please enter a new value.");
      return;
    }

    /* Validate numeric What-if input against backend ranges */
    if (
      NUMERIC_FIELDS.includes(whatIfField) &&
      ranges[whatIfField]
    ) {
      const numericValue = Number(whatIfValue);
      const [low, high] = ranges[whatIfField];

      if (
        Number.isNaN(numericValue) ||
        numericValue < low ||
        numericValue > high
      ) {
        setWhatIfError(
          `${getDisplayName(
            whatIfField
          )} must be between ${low} and ${high}.`
        );
        return;
      }
    }

    setWhatIfLoading(true);

    try {
      const originalData = {
        ...formData,

        Age: Number(formData.Age),
        Income: Number(formData.Income),
        LoanAmount: Number(formData.LoanAmount),
        CreditScore: Number(formData.CreditScore),
        MonthsEmployed: Number(formData.MonthsEmployed),
        NumCreditLines: Number(formData.NumCreditLines),
        InterestRate: Number(formData.InterestRate),
        LoanTerm: Number(formData.LoanTerm),
        DTIRatio: Number(formData.DTIRatio),
      };

      const changedData = {
        ...originalData,
      };

      if (NUMERIC_FIELDS.includes(whatIfField)) {
        changedData[whatIfField] = Number(whatIfValue);
      } else {
        changedData[whatIfField] = whatIfValue;
      }

      const response = await fetch(`${API_URL}/what-if`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original: originalData,
          changed: changedData,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.error || "What-if analysis failed."
        );
      }

      setWhatIfResult(responseData);
    } catch (err) {
      console.error("What-if error:", err);

      setWhatIfError(
        err.message ||
          "Unable to perform what-if analysis."
      );
    } finally {
      setWhatIfLoading(false);
    }
  };

  const handleNewAssessment = () => {
    navigate("/");
  };

  return (
    <div className="app result-page">
      <header className="top-header">
        <div className="brand-area">
          <div className="brand-icon">₹</div>

          <div>
            <h1>LOAN DEFAULT PREDICTION</h1>
            <p>AI-Assisted Credit Risk Assessment</p>
          </div>
        </div>

        <div className="header-status">
          <span className="status-dot"></span>
          Assessment Complete
        </div>
      </header>

      <main className="page-container">
        {/* PROGRESS */}
        <div className="progress-container">
          <div className="progress-step completed">
            <span>✓</span>
            <div>
              <strong>Application</strong>
              <small>Completed</small>
            </div>
          </div>

          <div className="progress-line completed-line"></div>

          <div className="progress-step active">
            <span>2</span>
            <div>
              <strong>Risk Assessment</strong>
              <small>Prediction generated</small>
            </div>
          </div>
        </div>

        {/* RESULT HEADER */}
        <section className="result-hero">
          <div>
            <div className="eyebrow">ASSESSMENT RESULT</div>

            <h2>Credit Risk Assessment</h2>

            <p>
              Your applicant data has been processed by the
              trained machine learning model.
            </p>
          </div>

          <div className={`main-risk-badge ${riskClass}`}>
            <span className="risk-badge-dot"></span>
            {riskCategory}
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="summary-grid">
          <div className="summary-card probability-card">
            <div className="summary-icon">%</div>

            <div>
              <span>Default Probability</span>
              <strong>
                {result.default_probability_percentage}%
              </strong>
              <small>Model estimated probability</small>
            </div>
          </div>

          <div className="summary-card score-card">
            <div className="summary-icon">◉</div>

            <div>
              <span>Risk Score</span>
              <strong>{riskScore.toFixed(2)}/100</strong>
              <small>Calculated from probability</small>
            </div>
          </div>

          <div className="summary-card prediction-card">
            <div className="summary-icon">✓</div>

            <div>
              <span>Prediction</span>
              <strong>{prediction}</strong>
              <small>Random Forest output</small>
            </div>
          </div>
        </section>

        {/* RISK METER */}
        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <span className="card-label">RISK PROFILE</span>
              <h3>Risk Score Analysis</h3>
              <p>
                A 0–100 score derived from the predicted
                probability of default.
              </p>
            </div>

            <div className={`score-number ${riskClass}`}>
              {riskScore.toFixed(2)}
              <small>/100</small>
            </div>
          </div>

          <div className="risk-meter-area">
            <div className="risk-meter">
              <div
                className={`risk-meter-fill ${riskClass}`}
                style={{
                  width: `${Math.min(
                    Math.max(riskScore, 0),
                    100
                  )}%`,
                }}
              ></div>

              <div
                className="risk-marker"
                style={{
                  left: `${Math.min(
                    Math.max(riskScore, 0),
                    100
                  )}%`,
                }}
              >
                <span></span>
              </div>
            </div>

            <div className="risk-scale">
              <span>0 Low</span>
              <span>30</span>
              <span>60</span>
              <span>80</span>
              <span>100 Critical</span>
            </div>
          </div>

          <div className="risk-levels">
            <span className="level low">
              <i></i> Low 0–30
            </span>

            <span className="level moderate">
              <i></i> Moderate 31–60
            </span>

            <span className="level high">
              <i></i> High 61–80
            </span>

            <span className="level critical">
              <i></i> Critical 81–100
            </span>
          </div>
        </section>

        {/* SHAP */}
        <section className="dashboard-card shap-card">
          <div className="card-heading">
            <div>
              <span className="card-label">
                EXPLAINABLE AI
              </span>

              <h3>Why did the model make this prediction?</h3>

              <p>
                SHAP identifies the features that influenced
                this individual prediction.
              </p>
            </div>

            <div className="shap-logo">SHAP</div>
          </div>

          {result.explanation &&
          result.explanation.length > 0 ? (
            <div className="shap-list">
              {result.explanation.map((item, index) => {
                const positive =
                  item.shap_value >= 0;

                return (
                  <div
                    className="shap-item"
                    key={index}
                  >
                    <div className="shap-rank">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="shap-info">
                      <strong>
                        {formatFeatureName(item.feature)}
                      </strong>

                      <span>
                        Value: {String(item.value)}
                      </span>
                    </div>

                    <div
                      className={`shap-impact ${
                        positive
                          ? "impact-up"
                          : "impact-down"
                      }`}
                    >
                      <span>
                        {positive ? "↑" : "↓"}
                      </span>

                      {item.impact}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-explanation">
              No SHAP explanation was returned.
            </div>
          )}
        </section>

        {/* WHAT IF */}
        <section className="dashboard-card what-if-card">
          <div className="card-heading">
            <div>
              <span className="card-label">
                SCENARIO SIMULATION
              </span>

              <h3>What-if Analysis</h3>

              <p>
                Change one applicant value and compare the
                resulting risk with the original assessment.
              </p>
            </div>

            <div className="what-if-logo">↔</div>
          </div>

          <div className="what-if-form">
            <div className="what-if-group">
              <label>Feature to Change</label>

              <select
                value={whatIfField}
                onChange={(e) => {
                  setWhatIfField(e.target.value);
                  setWhatIfValue("");
                  setWhatIfResult(null);
                  setWhatIfError("");
                }}
              >
                <option value="">
                  Select a feature
                </option>

                {NUMERIC_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {getDisplayName(field)}
                  </option>
                ))}

                {Object.keys(FALLBACK_CATEGORIES).map(
                  (field) => (
                    <option key={field} value={field}>
                      {getDisplayName(field)}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="what-if-group">
              <label>New Value</label>

              {whatIfField &&
              categoryValues[whatIfField] ? (
                <select
                  value={whatIfValue}
                  onChange={(e) =>
                    setWhatIfValue(e.target.value)
                  }
                >
                  <option value="">
                    Select new value
                  </option>

                  {categoryValues[whatIfField].map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </select>
              ) : (
                <input
                  type="number"
                  step="any"
                  value={whatIfValue}
                  onChange={(e) =>
                    setWhatIfValue(e.target.value)
                  }
                  disabled={!whatIfField}
                  min={
                    whatIfField && ranges[whatIfField]
                      ? ranges[whatIfField][0]
                      : undefined
                  }
                  max={
                    whatIfField && ranges[whatIfField]
                      ? ranges[whatIfField][1]
                      : undefined
                  }
                  placeholder={
                    whatIfField
                      ? "Enter new value"
                      : "Select a feature first"
                  }
                />
              )}
            </div>

            <button
              type="button"
              className="what-if-btn"
              onClick={handleWhatIf}
              disabled={whatIfLoading}
            >
              {whatIfLoading
                ? "Calculating..."
                : "Run What-if Analysis →"}
            </button>
          </div>

          {whatIfError && (
            <div className="what-if-error">
              <span>!</span>
              {whatIfError}
            </div>
          )}

          {whatIfResult && (
            <div className="what-if-result">
              <div className="scenario-title">
                <span>SCENARIO COMPARISON</span>
                <strong>Original vs Modified</strong>
              </div>

              <div className="scenario-grid">
                <div className="scenario-box">
                  <span>Original Risk</span>
                  <strong>
                    {whatIfResult.original_score}
                  </strong>
                  <small>
                    {whatIfResult.original_category}
                  </small>
                </div>

                <div className="scenario-arrow">
                  →
                </div>

                <div className="scenario-box">
                  <span>New Risk</span>
                  <strong>
                    {whatIfResult.new_score}
                  </strong>
                  <small>
                    {whatIfResult.new_category}
                  </small>
                </div>

                <div
                  className={`scenario-change ${
                    whatIfResult.score_change > 0
                      ? "change-up"
                      : whatIfResult.score_change < 0
                      ? "change-down"
                      : "change-neutral"
                  }`}
                >
                  <span>Risk Change</span>
                  <strong>
                    {whatIfResult.score_change > 0
                      ? "+"
                      : ""}
                    {whatIfResult.score_change}
                  </strong>
                  <small>
                    {whatIfResult.score_change < 0
                      ? "Risk decreased"
                      : whatIfResult.score_change > 0
                      ? "Risk increased"
                      : "No change"}
                  </small>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* HUMAN REVIEW */}
        <section className="human-review-card">
          <div className="human-review-icon">👤</div>

          <div>
            <span>DECISION SUPPORT</span>

            <h3>Human Review Required</h3>

            <p>
              This is an AI-assisted risk assessment. The
              prediction is an estimate and should support,
              not replace, an authorized human decision.
            </p>
          </div>
        </section>

        {/* ACTIONS */}
        <div className="result-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate("/")}
          >
            ← Back to Application
          </button>

          <button
            className="primary-outline-btn"
            onClick={handleNewAssessment}
          >
            + New Assessment
          </button>
        </div>
      </main>

      <footer className="footer">
        Loan Default Prediction • Machine Learning • Explainable AI
      </footer>
    </div>
  );
}

/* =========================================================
   FORM COMPONENTS
========================================================= */

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  step,
}) {
  return (
    <div className="form-group">
      <label>
        {label}
        <span>*</span>
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
}) {
  return (
    <div className="form-group">
      <label>
        {label}
        <span>*</span>
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getRiskClass(category) {
  if (!category) return "";

  return category
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getDisplayName(field) {
  const names = {
    Age: "Age",
    Income: "Annual Income",
    LoanAmount: "Loan Amount",
    CreditScore: "Credit Score",
    MonthsEmployed: "Months Employed",
    NumCreditLines: "Number of Credit Lines",
    InterestRate: "Interest Rate",
    LoanTerm: "Loan Term",
    DTIRatio: "Debt-to-Income Ratio",
    Education: "Education",
    EmploymentType: "Employment Type",
    MaritalStatus: "Marital Status",
    HasMortgage: "Mortgage",
    HasDependents: "Dependents",
    LoanPurpose: "Loan Purpose",
    HasCoSigner: "Co-Signer",
  };

  return names[field] || field;
}

function formatFeatureName(feature) {
  if (!feature) return "Feature";

  return feature
    .replace(/^num__/, "")
    .replace(/^cat__/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

export default App;