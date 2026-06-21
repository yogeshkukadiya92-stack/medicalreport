# MediVault Phase 10 — Advanced Analytics

**Status:** Implementation Ready
**Duration:** 3-4 weeks
**Team Size:** 2-3 data engineers + ML engineers
**Focus:** Predictive analytics, trend analysis, risk assessment

---

## 1. Predictive Analytics

### Health Score Prediction

```python
# app/services/ml/health_score_predictor.py

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import numpy as np
from datetime import datetime, timedelta

class HealthScorePredictor:
    def __init__(self):
        self.model = joblib.load('models/health_score_model.pkl')
        self.scaler = joblib.load('models/scaler.pkl')
    
    def predict_future_health_score(self, user_id: str, days_ahead: int = 30):
        """Predict health score X days in the future"""
        
        # Get historical data
        historical_data = self._get_historical_data(user_id, days=90)
        
        # Feature engineering
        features = self._engineer_features(historical_data)
        
        # Scale features
        scaled_features = self.scaler.transform([features])
        
        # Make prediction
        predicted_score = self.model.predict(scaled_features)[0]
        
        # Generate recommendation
        recommendation = self._generate_recommendation(predicted_score, historical_data)
        
        return {
            "predicted_score": float(predicted_score),
            "confidence": 0.85,
            "prediction_date": (datetime.now() + timedelta(days=days_ahead)).isoformat(),
            "trend": self._calculate_trend(historical_data),
            "recommendation": recommendation,
            "factors": self._get_contributing_factors(historical_data)
        }
    
    def _engineer_features(self, data):
        """Feature engineering for prediction"""
        return [
            data['avg_glucose'],
            data['avg_cholesterol'],
            data['avg_hemoglobin'],
            data['glucose_trend'],
            data['cholesterol_trend'],
            data['days_since_last_report'],
            data['medication_count'],
            data['age']
        ]
    
    def _calculate_trend(self, data):
        """Calculate trend direction"""
        if data['avg_health_score'][-1] > data['avg_health_score'][-10]:
            return "improving"
        elif data['avg_health_score'][-1] < data['avg_health_score'][-10]:
            return "declining"
        else:
            return "stable"
    
    def _generate_recommendation(self, score, data):
        """Generate health recommendation"""
        if score < 50:
            return {
                "priority": "high",
                "message": "Focus on glucose and cholesterol management",
                "actions": ["Schedule doctor visit", "Increase exercise", "Review diet"]
            }
        elif score < 70:
            return {
                "priority": "medium",
                "message": "Monitor key parameters closely",
                "actions": ["Regular monitoring", "Follow-up tests"]
            }
        else:
            return {
                "priority": "low",
                "message": "Maintain current healthy lifestyle",
                "actions": ["Continue current routine", "Annual checkups"]
            }
```

### Risk Assessment Model

```python
# app/services/ml/risk_assessment.py

class RiskAssessmentModel:
    def __init__(self):
        self.risk_thresholds = {
            "glucose": {"critical": 300, "high": 200, "moderate": 140},
            "cholesterol": {"critical": 300, "high": 240, "moderate": 200},
            "blood_pressure": {"critical": "180/120", "high": "140/90"},
            "hemoglobin": {"critical": 7, "low": 10}
        }
    
    def assess_disease_risk(self, user_id: str):
        """Assess risk of various diseases"""
        parameters = self._get_latest_parameters(user_id)
        
        risks = {
            "diabetes_risk": self._assess_diabetes_risk(parameters),
            "heart_disease_risk": self._assess_cvd_risk(parameters),
            "anemia_risk": self._assess_anemia_risk(parameters),
            "kidney_disease_risk": self._assess_kidney_disease_risk(parameters),
            "thyroid_disorder_risk": self._assess_thyroid_risk(parameters)
        }
        
        # Sort by risk level
        sorted_risks = sorted(
            risks.items(),
            key=lambda x: x[1]['risk_score'],
            reverse=True
        )
        
        return {
            "overall_risk_level": self._calculate_overall_risk(risks),
            "individual_risks": dict(sorted_risks),
            "primary_concerns": [k for k, v in sorted_risks[:3] if v['risk_score'] > 0.5],
            "recommended_tests": self._recommend_tests(risks),
            "follow_up_urgency": self._calculate_urgency(risks)
        }
    
    def _assess_diabetes_risk(self, params):
        """Assess diabetes risk"""
        score = 0
        
        if params.get('fasting_glucose', 0) > 126:
            score += 0.4
        elif params.get('fasting_glucose', 0) > 100:
            score += 0.2
        
        if params.get('hba1c', 0) > 6.5:
            score += 0.3
        elif params.get('hba1c', 0) > 5.7:
            score += 0.15
        
        if params.get('bmi', 25) > 30:
            score += 0.2
        
        return {
            "risk_score": min(score, 1.0),
            "risk_level": self._score_to_level(score),
            "key_indicators": self._get_key_indicators('diabetes', params),
            "recommended_action": "Increase exercise, reduce sugar intake, consult doctor"
        }
    
    def _assess_cvd_risk(self, params):
        """Assess cardiovascular disease risk using Framingham score"""
        # Framingham CVD risk algorithm
        score = 0
        
        # Cholesterol factor
        if params.get('cholesterol', 0) > 240:
            score += 0.3
        
        # LDL factor
        if params.get('ldl', 0) > 160:
            score += 0.25
        
        # Triglycerides
        if params.get('triglycerides', 0) > 200:
            score += 0.2
        
        # Blood pressure
        if params.get('systolic_bp', 0) > 140:
            score += 0.25
        
        return {
            "risk_score": min(score, 1.0),
            "risk_level": self._score_to_level(score),
            "key_indicators": self._get_key_indicators('cvd', params),
            "recommended_action": "Reduce salt, manage cholesterol, monitor BP regularly"
        }
    
    def _score_to_level(self, score):
        """Convert score to risk level"""
        if score > 0.7:
            return "critical"
        elif score > 0.5:
            return "high"
        elif score > 0.3:
            return "moderate"
        else:
            return "low"
```

---

## 2. Trend Analysis

### Time Series Analysis

```python
# app/services/analytics/trend_analyzer.py

from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import pandas as pd
import numpy as np

class TrendAnalyzer:
    def analyze_parameter_trends(self, user_id: str, parameter: str, days: int = 90):
        """Analyze trends for a specific parameter"""
        
        # Get historical data
        data = self._get_parameter_history(user_id, parameter, days)
        df = pd.DataFrame(data)
        
        # Time series decomposition
        if len(df) > 13:  # Need at least 2 weeks of data
            decomposition = seasonal_decompose(df['value'], model='additive', period=7)
            trend = decomposition.trend
            seasonal = decomposition.seasonal
        else:
            trend = None
            seasonal = None
        
        # Exponential smoothing for forecast
        if len(df) > 1:
            model = ExponentialSmoothing(df['value'], trend='add', seasonal='add', seasonal_periods=7)
            fitted = model.fit()
            forecast = fitted.forecast(steps=30)  # 30-day forecast
        else:
            forecast = None
        
        # Calculate statistics
        stats = {
            "mean": float(df['value'].mean()),
            "median": float(df['value'].median()),
            "std_dev": float(df['value'].std()),
            "min": float(df['value'].min()),
            "max": float(df['value'].max()),
            "current": float(df['value'].iloc[-1]),
            "change_7d": self._calculate_change(df, 7),
            "change_30d": self._calculate_change(df, 30)
        }
        
        # Trend direction
        trend_direction = self._determine_trend_direction(df)
        
        return {
            "parameter": parameter,
            "statistics": stats,
            "trend": {
                "direction": trend_direction,
                "velocity": self._calculate_velocity(df),
                "acceleration": self._calculate_acceleration(df)
            },
            "forecast": {
                "next_7_days": forecast[:7].tolist() if forecast is not None else [],
                "next_30_days": forecast.tolist() if forecast is not None else [],
                "confidence_interval": 0.95
            },
            "insights": self._generate_insights(parameter, stats, trend_direction)
        }
    
    def _determine_trend_direction(self, df):
        """Determine if trend is improving/declining/stable"""
        recent = df['value'].tail(14).mean()
        older = df['value'].head(14).mean()
        
        change_percent = ((recent - older) / older) * 100
        
        if abs(change_percent) < 5:
            return "stable"
        elif change_percent > 0:
            if "glucose" in str(df.columns).lower() or "cholesterol" in str(df.columns).lower():
                return "declining"  # For health metrics, increase is bad
            else:
                return "improving"
        else:
            if "glucose" in str(df.columns).lower() or "cholesterol" in str(df.columns).lower():
                return "improving"
            else:
                return "declining"
    
    def _generate_insights(self, parameter, stats, trend):
        """Generate insights from trend data"""
        insights = []
        
        if trend == "improving":
            insights.append(f"{parameter.title()} is improving - continue current approach")
        elif trend == "declining":
            insights.append(f"{parameter.title()} is declining - consider intervention")
        
        if stats['current'] > stats['mean']:
            insights.append(f"Current {parameter} is above your average")
        
        return insights
```

### Comparative Analysis

```python
# app/services/analytics/comparative_analyzer.py

class ComparativeAnalyzer:
    def compare_reports(self, report1_id: str, report2_id: str):
        """Compare two medical reports"""
        
        report1 = self._get_report_with_values(report1_id)
        report2 = self._get_report_with_values(report2_id)
        
        comparison = {
            "report1_date": report1['date'],
            "report2_date": report2['date'],
            "days_between": (report2['date'] - report1['date']).days,
            "parameters": self._compare_parameters(report1, report2),
            "changes": self._analyze_changes(report1, report2),
            "summary": self._generate_comparison_summary(report1, report2)
        }
        
        return comparison
    
    def _compare_parameters(self, report1, report2):
        """Compare each parameter"""
        comparison = []
        
        for param_name in report1['parameters']:
            if param_name not in report2['parameters']:
                continue
            
            val1 = report1['parameters'][param_name]['value']
            val2 = report2['parameters'][param_name]['value']
            
            change = val2 - val1
            change_percent = (change / val1) * 100 if val1 != 0 else 0
            
            comparison.append({
                "parameter": param_name,
                "value1": val1,
                "value2": val2,
                "absolute_change": change,
                "percent_change": change_percent,
                "direction": "increased" if change > 0 else "decreased",
                "status1": report1['parameters'][param_name]['status'],
                "status2": report2['parameters'][param_name]['status'],
                "improvement": self._is_improvement(param_name, change)
            })
        
        return sorted(comparison, key=lambda x: abs(x['percent_change']), reverse=True)
    
    def compare_with_population(self, user_id: str, parameter: str):
        """Compare user's values with population averages"""
        
        user_values = self._get_user_values(user_id, parameter)
        population_stats = self._get_population_stats(parameter)
        
        user_mean = np.mean(user_values)
        population_mean = population_stats['mean']
        
        percentile = self._calculate_percentile(user_mean, population_stats)
        
        return {
            "parameter": parameter,
            "user_mean": user_mean,
            "population_mean": population_mean,
            "user_std_dev": np.std(user_values),
            "population_std_dev": population_stats['std_dev'],
            "z_score": (user_mean - population_mean) / population_stats['std_dev'],
            "percentile": percentile,
            "interpretation": self._interpret_percentile(percentile)
        }
```

---

## 3. Family Health Insights

### Family Dynamics

```python
# app/services/analytics/family_analyzer.py

class FamilyAnalyzer:
    def analyze_family_health_patterns(self, user_id: str):
        """Analyze health patterns across family members"""
        
        family_members = self._get_family_members(user_id)
        
        patterns = {
            "common_conditions": self._find_common_conditions(family_members),
            "genetic_risks": self._assess_genetic_risks(family_members),
            "lifestyle_comparison": self._compare_lifestyles(family_members),
            "health_trends": self._analyze_family_trends(family_members),
            "recommendations": self._generate_family_recommendations(family_members)
        }
        
        return patterns
    
    def _find_common_conditions(self, family_members):
        """Find conditions appearing in multiple family members"""
        conditions = {}
        
        for member in family_members:
            member_conditions = self._get_conditions(member['id'])
            for condition in member_conditions:
                if condition not in conditions:
                    conditions[condition] = []
                conditions[condition].append(member['relation'])
        
        # Filter to only conditions appearing in 2+ members
        common = {k: v for k, v in conditions.items() if len(v) >= 2}
        
        return common
    
    def _assess_genetic_risks(self, family_members):
        """Assess genetic/hereditary disease risks"""
        
        genetic_conditions = {
            'diabetes': self._assess_family_diabetes_risk(family_members),
            'heart_disease': self._assess_family_cvd_risk(family_members),
            'hypertension': self._assess_family_hypertension_risk(family_members),
            'cancer': self._assess_family_cancer_risk(family_members),
            'thyroid': self._assess_family_thyroid_risk(family_members)
        }
        
        return {k: v for k, v in genetic_conditions.items() if v['risk_score'] > 0.3}
    
    def _assess_family_diabetes_risk(self, family_members):
        """Assess diabetes risk based on family history"""
        
        affected_members = [m for m in family_members if self._has_diabetes(m['id'])]
        
        risk_score = 0
        if len(affected_members) == 0:
            risk_score = 0.1
        elif len(affected_members) == 1:
            risk_score = 0.4
        else:  # 2+ members
            risk_score = 0.7
        
        # Age of onset affects risk
        early_onset_count = len([m for m in affected_members if m['age_at_diagnosis'] < 55])
        if early_onset_count > 0:
            risk_score += 0.2
        
        return {
            "risk_score": min(risk_score, 1.0),
            "affected_family_members": len(affected_members),
            "early_onsets": early_onset_count,
            "recommendation": "Regular glucose monitoring, healthy lifestyle, screening tests"
        }
```

---

## 4. Dashboard Enhancements

### Custom Dashboards

```python
# app/api/v1/analytics.py

@router.get("/custom-dashboard")
async def get_custom_dashboard(
    family_member_id: str,
    date_range: str = "30d",  # 7d, 30d, 90d, 1y
    current_user: User = Depends(get_current_user)
):
    """Get customized analytics dashboard"""
    
    dashboard = {
        "health_score": {
            "current": 85,
            "trend": "improving",
            "forecast_30d": 87,
            "components": {
                "glucose_control": 80,
                "cholesterol_mgmt": 75,
                "weight_management": 90,
                "exercise": 85,
                "sleep_quality": 80
            }
        },
        "key_metrics": {
            "glucose": {
                "current": 120,
                "target": "<100",
                "status": "high",
                "trend": "stable"
            },
            "cholesterol": {
                "current": 200,
                "target": "<200",
                "status": "normal",
                "trend": "improving"
            },
            "blood_pressure": {
                "current": "120/80",
                "target": "<120/80",
                "status": "normal",
                "trend": "stable"
            }
        },
        "predictions": {
            "health_score_30d": {
                "predicted": 87,
                "confidence": 0.85,
                "factors": ["improving glucose", "stable cholesterol"]
            }
        },
        "risks": {
            "immediate": [],
            "high": ["pre-diabetes"],
            "moderate": []
        },
        "recommendations": [
            {
                "priority": "high",
                "category": "glucose",
                "action": "Increase water intake, reduce sugar"
            }
        ],
        "recent_events": {
            "abnormal_values": [
                {"parameter": "HbA1c", "date": "2026-06-20", "value": 7.1}
            ],
            "milestone_achievements": []
        }
    }
    
    return dashboard
```

---

## 5. Reporting

### Advanced Report Generation

```python
# app/services/reporting/report_generator.py

class AdvancedReportGenerator:
    def generate_health_summary_report(self, user_id: str, period: str = "30d"):
        """Generate comprehensive health summary"""
        
        report = {
            "title": "Health Summary Report",
            "period": period,
            "generated_at": datetime.now().isoformat(),
            "sections": {
                "executive_summary": self._generate_summary(user_id, period),
                "key_findings": self._generate_findings(user_id, period),
                "trends": self._generate_trends(user_id, period),
                "risk_assessment": self._generate_risk_assessment(user_id),
                "recommendations": self._generate_recommendations(user_id),
                "next_steps": self._generate_next_steps(user_id)
            }
        }
        
        return report
    
    def export_report_pdf(self, report: dict):
        """Export report as PDF"""
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
        
        # Create PDF
        pdf_path = f"/tmp/health_report_{datetime.now().timestamp()}.pdf"
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        
        elements = []
        
        # Add title
        title = Paragraph(report['title'], styles['Heading1'])
        elements.append(title)
        
        # Add sections
        for section_name, section_content in report['sections'].items():
            elements.append(Paragraph(section_name.replace('_', ' ').title(), styles['Heading2']))
            elements.append(Paragraph(str(section_content), styles['Normal']))
        
        doc.build(elements)
        
        return pdf_path
```

---

**Status:** Ready for Implementation ✅
**Estimated Duration:** 3-4 weeks
**Team Size:** 2-3 data engineers
