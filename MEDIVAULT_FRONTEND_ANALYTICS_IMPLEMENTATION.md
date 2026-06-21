# MediVault Frontend Analytics Implementation Plan

**Status:** Production-Ready
**Platforms:** Next.js (Web), Flutter (Android)
**Design System:** Tailwind CSS + Healthcare Colors
**Date:** June 2026

---

## Table of Contents

1. [Design System & Colors](#1-design-system--colors)
2. [Analytics Screens Overview](#2-analytics-screens-overview)
3. [Page-wise Structure](#3-page-wise-structure)
4. [Component Architecture](#4-component-architecture)
5. [Chart Components & Library](#5-chart-components--library)
6. [Medical Microcopy](#6-medical-microcopy)
7. [Filter & Selector Components](#7-filter--selector-components)
8. [States (Empty/Loading/Error/Success)](#8-states-emptyloadingerror-success)
9. [Mobile Layout Strategy](#9-mobile-layout-strategy)
10. [API Integration](#10-api-integration)
11. [Dummy Data Structure](#11-dummy-data-structure)
12. [Frontend Folder Structure](#12-frontend-folder-structure)
13. [Component Code Examples](#13-component-code-examples)
14. [Developer Task Breakdown](#14-developer-task-breakdown)
15. [Testing Checklist](#15-testing-checklist)

---

## 1. Design System & Colors

### Healthcare Color Palette

```css
/* Primary Colors */
:root {
  /* Health Status Colors */
  --health-normal: #10b981;      /* Green - All good */
  --health-attention: #f59e0b;   /* Amber - Needs attention */
  --health-high: #ef4444;        /* Red - High (but not scary) */
  --health-low: #3b82f6;         /* Blue - Low */
  --health-critical: #dc2626;    /* Dark Red - Critical */
  
  /* Health Trend Colors */
  --trend-improving: #10b981;    /* Green */
  --trend-stable: #6b7280;       /* Gray */
  --trend-declining: #f97316;    /* Orange */
  
  /* Card Colors */
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  /* Text Colors */
  --text-primary: #111827;       /* Near black */
  --text-secondary: #6b7280;     /* Gray */
  --text-light: #9ca3af;         /* Light gray */
  
  /* Background */
  --bg-primary: #f9fafb;         /* Light gray */
  --bg-secondary: #f3f4f6;       /* Slightly darker gray */
  
  /* Accent */
  --accent-teal: #0d9488;        /* Teal - Primary */
  --accent-cyan: #0891b2;        /* Cyan - Secondary */
}
```

### Typography

```css
/* Font Stack */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0;
}

/* Headings */
h1 { font-size: 28px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 24px; font-weight: 700; line-height: 1.3; }
h3 { font-size: 20px; font-weight: 600; line-height: 1.3; }
h4 { font-size: 16px; font-weight: 600; line-height: 1.4; }
h5 { font-size: 14px; font-weight: 600; line-height: 1.4; }

/* Body Text */
p { font-size: 16px; font-weight: 400; color: var(--text-secondary); }
small { font-size: 14px; font-weight: 400; }
caption { font-size: 12px; font-weight: 400; color: var(--text-light); }
```

### Spacing Scale

```
8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 56px, 64px
```

### Border Radius

```
4px (small), 8px (default), 12px (large), 16px (extra-large)
```

---

## 2. Analytics Screens Overview

### Screen Hierarchy

```
Analytics Home (Dashboard)
├── Dashboard Cards
├── Quick Stats
├── Recent Alerts
└── Quick Actions

Analytics Timeline
├── Date Filter
├── Report List (chronological)
└── Report Detail Expansion

Parameter Trends
├── Parameter Selector
├── Chart (Recharts Line Chart)
├── Statistics Panel
└── Trend Analysis

Report Comparison
├── Report 1 Selector
├── Report 2 Selector
├── Parameter Comparison Table
└── Summary

Health Tracking Score
├── Overall Score Card
├── Component Scores
└── Recommendations

Family Health
├── Family Member Cards
├── Individual Health Scores
└── Risk Assessment

Monthly Summary
├── Month Selector
├── Monthly Metrics Cards
└── Trend Charts

Report Categories
├── Category Breakdown Chart
└── Category Details

Attention Values
├── Priority Ranking
├── Severity Indicators
└── Recommendations
```

---

## 3. Page-wise Structure

### Page 1: Analytics Dashboard

```
Layout: [Header] [Sidebar]
        [Main Content Area]

Header:
├── Title: "My Health Analytics"
├── Last Updated: "Updated 2 hours ago"
└── Refresh Button

Main Content:
├── Top Section: Key Stats Cards (4 columns)
│   ├── Card 1: Total Reports (number)
│   ├── Card 2: Latest Report Date
│   ├── Card 3: Values Needing Attention (count + icon)
│   └── Card 4: Health Score (0-100 with gauge)
│
├── Middle Section: Parameter Status Grid (2 columns)
│   ├── Normal Values (count, green badge)
│   ├── High Values (count, red badge)
│   ├── Low Values (count, blue badge)
│   └── Critical Values (count, dark red badge)
│
├── Bottom Section: Quick Access Cards
│   ├── View Medical Timeline
│   ├── Compare Reports
│   ├── Track Trends
│   └── Family Health Summary

Mobile:
├── Single Column Stack
├── All Cards Full Width
└── Horizontal Scroll for Charts
```

### Page 2: Medical Timeline

```
Layout: [Header with Filters] [Sidebar]
        [Timeline List]

Header:
├── Title: "Medical Timeline"
├── Filter Button (modal)
└── Export Button (optional)

Filters (when opened):
├── Date Range Picker
├── Report Type Selector
└── Apply / Clear Buttons

Timeline List:
├── Chronological Event Cards (newest first)
│   ├── Date Badge (e.g., "June 20, 2026")
│   ├── Report Type Tag (e.g., "Blood Test")
│   ├── Lab Name
│   ├── Doctor Name
│   ├── Key Findings (short list)
│   ├── Parameter Count
│   └── "View Details" Link
│
└── Pagination (Load More button at bottom)

Empty State:
├── Illustration
├── "No reports found"
├── "Upload your first medical report to get started"
└── Upload CTA Button

Loading State:
├── Skeleton Cards
└── 3 placeholder cards
```

### Page 3: Parameter Trends

```
Layout: [Header] [Sidebar]
        [Chart Area]
        [Statistics Panel]

Header:
├── Title: "Track Your Health"
├── Parameter Selector (dropdown)
└── Date Range Selector

Chart Area:
├── Line Chart (Recharts)
│   ├── Y-axis: Parameter Value
│   ├── X-axis: Date
│   ├── Reference Line (normal range)
│   ├── Colored Zone (optimal range)
│   └── Tooltip on Hover
│
└── Chart Stats Panel
    ├── Latest Value
    ├── Previous Value
    ├── Change (↑ improving, ↓ declining, → stable)
    ├── Change Percentage
    ├── Min/Max/Avg Values
    └── Measurement Count

Mobile:
├── Vertical Chart
├── Single Column
└── Swipeable Parameter Selection
```

### Page 4: Report Comparison

```
Layout: [Header] [Sidebar]
        [Comparison Area]

Header:
├── Title: "Compare Reports"
└── Instructions: "Select two reports to compare"

Comparison Area:
├── Report Selection (side by side)
│   ├── Column 1: Report 1 Selector
│   │   └── Selected Report Date
│   │
│   └── Column 2: Report 2 Selector
│       └── Selected Report Date
│
├── Days Between: "33 days difference"
│
├── Summary Cards
│   ├── Parameters Improved (green)
│   ├── Parameters Worsened (red)
│   └── Parameters Unchanged (gray)
│
└── Parameter Comparison Table
    ├── Parameter Name
    ├── Report 1 Value
    ├── Report 2 Value
    ├── Change (value + %)
    └── Trend (↑ improving, ↓ declining, → stable)

Mobile:
├── Stacked Comparison
├── Horizontal Scroll Table
└── Simplified Summary
```

### Page 5: Health Tracking Score

```
Layout: [Header] [Sidebar]
        [Score Display]
        [Components]
        [Recommendations]

Score Display:
├── Large Circular Score (0-100)
├── Grade Letter (A+ to F)
├── Color Indicator
└── Trend Arrow (↑ improving, → stable, ↓ declining)

Components Breakdown:
├── Card 1: Test Frequency
│   ├── Score: 85/100
│   ├── Description: "Regular testing"
│   └── Metric: "1.0 reports/month (target 1.5)"
│
├── Card 2: Parameter Coverage
│   ├── Score: 72/100
│   ├── Description: "Parameter diversity"
│   └── Metric: "20/22 standard parameters tracked"
│
├── Card 3: Data Completeness
│   ├── Score: 88/100
│   ├── Description: "Data quality"
│   └── Metric: "120 confirmed, 5 draft values"
│
└── Card 4: Trend Monitoring
    ├── Score: 65/100
    ├── Description: "Trend analysis"
    └── Metric: "8 parameters with trends tracked"

Recommendations Section:
├── "How to improve your health tracking"
├── Recommendation 1: "Increase testing frequency"
├── Recommendation 2: "Add vitamin B12 testing"
└── "Learn More" Link

Mobile:
├── Vertical Card Stack
├── Full-width Score Card
└── Simplified Components
```

---

## 4. Component Architecture

### Component Tree

```
<AnalyticsLayout>
  ├── <Header />
  ├── <Sidebar />
  └── <MainContent>
      ├── <Dashboard>
      │   ├── <StatsCard /> (x4)
      │   ├── <ParameterStatusGrid>
      │   │   ├── <StatusBadge />
      │   │   └── <StatusBadge />
      │   └── <QuickAccessCards>
      │       ├── <QuickAccessCard />
      │       └── <QuickAccessCard />
      │
      ├── <Timeline>
      │   ├── <FilterBar>
      │   │   ├── <DateRangePicker />
      │   │   ├── <ReportTypeSelector />
      │   │   └── <FilterButton />
      │   ├── <TimelineList>
      │   │   ├── <TimelineCard />
      │   │   ├── <TimelineCard />
      │   │   └── <PaginationButton />
      │   └── <EmptyState />
      │
      ├── <ParameterTrends>
      │   ├── <ParameterSelector />
      │   ├── <DateRangeSelector />
      │   ├── <TrendChart />
      │   └── <StatisticsPanel>
      │       ├── <StatCard />
      │       └── <StatCard />
      │
      ├── <ReportComparison>
      │   ├── <ReportSelector /> (x2)
      │   ├── <ComparisonSummary>
      │   │   ├── <SummaryCard />
      │   │   └── <SummaryCard />
      │   └── <ComparisonTable />
      │
      ├── <HealthTrackingScore>
      │   ├── <ScoreCircle />
      │   ├── <ComponentsGrid>
      │   │   ├── <ComponentCard />
      │   │   └── <ComponentCard />
      │   └── <RecommendationsSection>
      │       ├── <RecommendationCard />
      │       └── <RecommendationCard />
      │
      ├── <AttentionValues>
      │   ├── <SeverityFilter />
      │   ├── <AttentionList>
      │   │   ├── <AttentionCard /> (priority ranked)
      │   │   └── <AttentionCard />
      │   └── <EmptyState />
      │
      ├── <FamilyHealth>
      │   ├── <FamilyMemberSelector />
      │   └── <FamilyMemberGrid>
      │       ├── <FamilyMemberCard />
      │       └── <FamilyMemberCard />
      │
      └── <MonthlySummary>
          ├── <MonthSelector />
          ├── <MonthlyMetricsGrid>
          │   ├── <MetricCard />
          │   └── <MetricCard />
          └── <MonthlyTrendChart />
```

---

## 5. Chart Components & Library

### Recommendation: Recharts

**Why Recharts over Chart.js:**
- Built for React (not jQuery wrapper)
- Responsive by default
- Accessible (ARIA labels)
- Healthcare-friendly styling
- Mobile-optimized
- Active development

### Chart 1: Parameter Trend (Line Chart)

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export const ParameterTrendChart = ({ data, parameterName, referenceRange }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: 'Date', position: 'insideBottomRight', offset: -5 }}
        />
        <YAxis 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: parameterName, angle: -90, position: 'insideLeft' }}
        />
        
        {/* Optimal Range Zone */}
        <ReferenceLine 
          y={referenceRange.high} 
          stroke="#10b981" 
          strokeDasharray="5 5" 
          label={{ value: 'Upper Normal', position: 'right', fill: '#10b981' }}
        />
        {referenceRange.low && (
          <ReferenceLine 
            y={referenceRange.low} 
            stroke="#10b981" 
            strokeDasharray="5 5" 
            label={{ value: 'Lower Normal', position: 'right', fill: '#10b981' }}
          />
        )}
        
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ stroke: '#0d9488', strokeWidth: 2 }}
        />
        
        {/* Data Line */}
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#0d9488" 
          strokeWidth={3}
          dot={{ fill: '#0d9488', r: 5 }}
          activeDot={{ r: 7, fill: '#10b981' }}
          isAnimationActive={true}
        />
        
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow">
        <p className="text-sm font-semibold text-gray-900">{payload[0].payload.date}</p>
        <p className="text-sm text-teal-600">Value: {payload[0].value} {payload[0].payload.unit}</p>
        {payload[0].payload.status && (
          <p className="text-xs text-gray-500 mt-1">Status: {payload[0].payload.status}</p>
        )}
      </div>
    );
  }
  return null;
};
```

### Chart 2: Parameter Status Distribution (Bar Chart)

```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ParameterStatusChart = ({ data }) => {
  const colors = {
    normal: '#10b981',
    high: '#ef4444',
    low: '#3b82f6',
    critical: '#dc2626'
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Tooltip content={<CustomStatusTooltip />} />
        
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[entry.status] || '#6b7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
```

### Chart 3: Health Score Gauge

```jsx
export const HealthScoreGauge = ({ score, trend }) => {
  const getColor = (score) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 70) return '#f59e0b'; // Amber
    if (score >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getGrade = (score) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-40 h-40 flex items-center justify-center mb-4">
        {/* Circle Background */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          {/* Filled Arc */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke={getColor(score)} 
            strokeWidth="8" 
            strokeDasharray={`${(score / 100) * 283} 283`}
            strokeDashoffset="71.5"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute text-center">
          <div className="text-5xl font-bold text-gray-900">{score}</div>
          <div className="text-sm text-gray-500">out of 100</div>
        </div>
      </div>
      
      {/* Grade & Trend */}
      <div className="flex items-center gap-2 mt-4">
        <div className={`text-3xl font-bold ${getColor(score) === '#10b981' ? 'text-green-600' : 'text-gray-900'}`}>
          {getGrade(score)}
        </div>
        
        <div className="ml-4">
          {trend === 'improving' && (
            <span className="inline-flex items-center text-sm font-semibold text-green-600">
              ↑ Improving
            </span>
          )}
          {trend === 'stable' && (
            <span className="inline-flex items-center text-sm font-semibold text-gray-600">
              → Stable
            </span>
          )}
          {trend === 'declining' && (
            <span className="inline-flex items-center text-sm font-semibold text-orange-600">
              ↓ Declining
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 6. Medical Microcopy

### Safe Language Guide

```markdown
✅ GOOD - Gentle, Clear, Empowering
- "Needs attention"
- "Slightly elevated"
- "A bit low"
- "Consult your doctor"
- "Last checked 2 weeks ago"
- "Improving"
- "Stable"
- "Compared with last report"
- "Track your progress"
- "Keep monitoring"
- "Everything looks normal"
- "All values in target range"
- "Room for improvement"

❌ AVOID - Medical, Scary, Confusing
- "Abnormal"
- "Dangerous"
- "Critical"
- "Severe"
- "High risk"
- "Disease prediction"
- "Pathological"
- "Alarming"
- "Emergency"
- "Requires immediate action"
- "Red flag"
- "Concerning"
- "Deteriorating"
```

### Example Microcopy for Screens

```
Dashboard:
• "Your Health Overview" (instead of "Medical Dashboard")
• "Things to keep an eye on" (instead of "Critical Alerts")
• "Checked: June 20, 2026" (instead of "Last Report Date")
• "All values in target range" (instead of "Normal Status")

Timeline:
• "Your Medical History" (instead of "Report Timeline")
• "Tests and reports over time" (instead of "Medical Events")
• "June 20: Blood Test - Everything looks normal" (instead of "Report OK")

Trends:
• "How your HbA1c is changing" (instead of "HbA1c Analysis")
• "Slightly higher than last time" (instead of "Abnormal Increase")
• "Moving toward target range" (instead of "Improving Trajectory")

Values Needing Attention:
• "A few things to discuss with your doctor" (instead of "Alert Values")
• "Your vitamin D is running low - consider supplementation" (instead of "Deficiency Alert")
• "HbA1c staying elevated - review your glucose plan" (instead of "Critical Level")

Health Score:
• "How well you're tracking your health" (instead of "Compliance Score")
• "Great job keeping an eye on your health!" (instead of "Excellent Adherence")
```

---

## 7. Filter & Selector Components

### Component 1: Date Range Picker

```jsx
export const DateRangePicker = ({ onDateChange, defaultDays = 90 }) => {
  const [selectedRange, setSelectedRange] = React.useState('90days');
  const [customStart, setCustomStart] = React.useState(null);
  const [customEnd, setCustomEnd] = React.useState(null);

  const presets = [
    { label: 'Last 30 days', days: 30, key: '30days' },
    { label: 'Last 90 days', days: 90, key: '90days' },
    { label: 'Last 6 months', days: 180, key: '6months' },
    { label: 'Last year', days: 365, key: '1year' },
    { label: 'Custom', key: 'custom' }
  ];

  const handlePresetClick = (range) => {
    setSelectedRange(range.key);
    if (range.key !== 'custom') {
      const end = new Date();
      const start = new Date(end.getTime() - range.days * 24 * 60 * 60 * 1000);
      onDateChange(start, end);
    }
  };

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Date Range
      </label>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        {presets.map(preset => (
          <button
            key={preset.key}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              selectedRange === preset.key
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {selectedRange === 'custom' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={customStart || ''}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={customEnd || ''}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

### Component 2: Parameter Selector

```jsx
export const ParameterSelector = ({ onSelect, selectedParameter }) => {
  const parameters = [
    { name: 'HbA1c', category: 'Glucose' },
    { name: 'Fasting Blood Sugar', category: 'Glucose' },
    { name: 'Total Cholesterol', category: 'Lipids' },
    { name: 'LDL Cholesterol', category: 'Lipids' },
    { name: 'HDL Cholesterol', category: 'Lipids' },
    { name: 'Triglycerides', category: 'Lipids' },
    { name: 'TSH', category: 'Thyroid' },
    { name: 'Vitamin D', category: 'Vitamins' },
    { name: 'Vitamin B12', category: 'Vitamins' },
    { name: 'Hemoglobin', category: 'Blood Count' },
    { name: 'Creatinine', category: 'Kidney' },
    { name: 'Blood Pressure', category: 'Vitals' }
  ];

  const categories = [...new Set(parameters.map(p => p.category))];

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Parameter
      </label>
      
      <select
        value={selectedParameter || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      >
        <option value="">Choose a parameter...</option>
        {categories.map(category => (
          <optgroup key={category} label={category}>
            {parameters
              .filter(p => p.category === category)
              .map(param => (
                <option key={param.name} value={param.name}>
                  {param.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};
```

### Component 3: Family Member Selector

```jsx
export const FamilyMemberSelector = ({ onSelect, familyMembers, selectedMember }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {familyMembers.map(member => (
        <button
          key={member.id}
          onClick={() => onSelect(member.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
            selectedMember === member.id
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {member.name}
          <span className="text-xs ml-2">({member.relation})</span>
        </button>
      ))}
    </div>
  );
};
```

---

## 8. States (Empty/Loading/Error/Success)

### Empty State

```jsx
export const EmptyState = ({ title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4">
        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-4 text-center max-w-sm">{message}</p>
      {action && (
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
          {action.label}
        </button>
      )}
    </div>
  );
};
```

### Loading State

```jsx
export const LoadingState = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-200 h-40 rounded-lg animate-pulse" />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
      <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
  );
};
```

### Error State

```jsx
export const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-red-50 border-2 border-red-200 rounded-lg">
      <svg className="w-12 h-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M9 3h6m-6 0a3 3 0 00-3 3v12a3 3 0 003 3h6a3 3 0 003-3V6a3 3 0 00-3-3z" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to Load</h3>
      <p className="text-gray-600 text-sm mb-4 text-center max-w-sm">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
```

### Success State

```jsx
export const SuccessMessage = ({ message, onDismiss }) => {
  return (
    <div className="flex items-center gap-3 bg-green-50 border-l-4 border-green-500 p-4 rounded">
      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-green-800">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-green-600 hover:text-green-700">
          ✕
        </button>
      )}
    </div>
  );
};
```

---

## 9. Mobile Layout Strategy

### Responsive Breakpoints

```css
/* Tailwind Breakpoints */
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
2xl: 1536px /* Extra Large */
```

### Mobile-First Approach

```jsx
// Mobile (single column, stacked)
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card /> {/* Responsive: 1 col on mobile, 2 on tablet, 4 on desktop */}
</div>

// Charts on Mobile
<div className="overflow-x-auto">
  <LineChart width={400} height={250} /> {/* Fixed width, horizontal scroll */}
</div>

// Tables on Mobile
<div className="overflow-x-auto">
  <Table /> {/* Horizontal scroll for parameter comparison */}
</div>

// Selectors on Mobile
<select className="w-full"> {/* Full width dropdown */}
  {/* Options */}
</select>
```

### Mobile Navigation

```
Bottom Tab Navigation:
├── Dashboard (home icon)
├── Timeline (list icon)
├── Trends (chart icon)
├── Family (people icon)
└── More (menu icon)

Top Header:
├── Back Button
├── Title
└── Menu Button (filter/options)
```

---

## 10. API Integration

### Analytics Context API

```jsx
// app/contexts/AnalyticsContext.tsx

interface AnalyticsFilters {
  familyMemberId: string;
  dateFrom: Date;
  dateTo: Date;
  parameterName?: string;
}

interface AnalyticsContextType {
  dashboard: DashboardData | null;
  timeline: TimelineEvent[];
  trends: TrendData[];
  filters: AnalyticsFilters;
  setFilters: (filters: AnalyticsFilters) => void;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null);
  const [timeline, setTimeline] = React.useState<TimelineEvent[]>([]);
  const [trends, setTrends] = React.useState<TrendData[]>([]);
  const [filters, setFilters] = React.useState<AnalyticsFilters>({
    familyMemberId: '',
    dateFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    dateTo: new Date()
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await analyticsAPI.getDashboard(
        filters.familyMemberId,
        filters.dateFrom,
        filters.dateTo
      );
      setDashboard(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refetch();
  }, [filters]);

  return (
    <AnalyticsContext.Provider value={{ dashboard, timeline, trends, filters, setFilters, loading, error, refetch }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = React.useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};
```

### API Service Layer

```typescript
// app/lib/api/analytics.ts

export const analyticsAPI = {
  async getDashboard(
    familyMemberId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<DashboardData> {
    const response = await apiClient.get('/v1/analytics/dashboard', {
      params: {
        family_member_id: familyMemberId,
        date_from: dateFrom.toISOString().split('T')[0],
        date_to: dateTo.toISOString().split('T')[0]
      }
    });
    return response.data;
  },

  async getTimeline(
    familyMemberId: string,
    limit: number = 50,
    offset: number = 0,
    filters?: {
      reportType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ events: TimelineEvent[]; total: number }> {
    const response = await apiClient.get('/v1/analytics/timeline', {
      params: {
        family_member_id: familyMemberId,
        limit,
        offset,
        ...filters
      }
    });
    return response.data;
  },

  async getParameterTrend(
    familyMemberId: string,
    parameterName: string,
    days: number = 90
  ): Promise<TrendData[]> {
    const response = await apiClient.get(`/v1/analytics/parameter/${parameterName}/trend`, {
      params: {
        family_member_id: familyMemberId,
        days
      }
    });
    return response.data;
  },

  async getHealthScore(familyMemberId: string): Promise<HealthScoreData> {
    const response = await apiClient.get('/v1/analytics/health-tracking-score', {
      params: { family_member_id: familyMemberId }
    });
    return response.data;
  }
};
```

---

## 11. Dummy Data Structure

### Dashboard Dummy Data

```typescript
// app/data/analytics-dummy.ts

export const dummyDashboard: DashboardData = {
  user_id: 'user-123',
  family_members: [
    {
      family_member_id: 'family-123',
      name: 'Rajesh Kumar',
      relation: 'self',
      age: 45,
      blood_group: 'A+',
      health_score: 85,
      health_status: 'good',
      health_trend: 'improving',
      last_report_date: '2026-06-20',
      days_since_last_report: 2,
      total_parameters_tracked: 20,
      parameter_status_counts: {
        normal: 16,
        high: 2,
        low: 1,
        critical: 0,
        borderline: 1
      },
      reports_this_month: 3,
      monthly_trend: 'stable',
      attention_items: 3,
      critical_alerts: 0
    }
  ],
  alerts: [
    {
      severity: 'high',
      type: 'high_value',
      parameter: 'HbA1c',
      value: '7.1',
      unit: '%',
      reference_high: '5.7',
      message: 'HbA1c elevated, indicating higher average glucose'
    },
    {
      severity: 'medium',
      type: 'low_value',
      parameter: 'Vitamin D',
      value: '18',
      unit: 'ng/mL',
      reference_low: '30',
      message: 'Vitamin D is running low - consider supplementation'
    }
  ],
  summary: {
    total_family_members: 1,
    total_parameters_tracked: 20,
    parameters_needing_attention: 3,
    critical_parameters: 0,
    average_family_health_score: 85
  },
  cached: false,
  cache_expires_at: '2026-06-22T11:30:00Z'
};

export const dummyTimelineEvents: TimelineEvent[] = [
  {
    date: '2026-06-20',
    report_id: 'report-1',
    report_type: 'blood_test',
    lab_name: 'Apollo Diagnostics',
    doctor_name: 'Dr. Sharma',
    summary: 'Complete blood count and metabolic panel',
    key_findings: [
      'Elevated HbA1c: 7.1% (normal < 5.7%)',
      'LDL Cholesterol: 115 mg/dL (normal < 100 mg/dL)',
      'Vitamin D: Low at 18 ng/mL (normal 30-100 ng/mL)'
    ],
    parameter_count: 20,
    abnormal_parameters: {
      high: ['HbA1c', 'LDL Cholesterol'],
      low: ['Vitamin D'],
      critical: []
    },
    health_score_that_day: 84,
    confidence_score: 96
  },
  {
    date: '2026-06-10',
    report_id: 'report-2',
    report_type: 'thyroid',
    lab_name: "Dr. Reddy's Pathology",
    key_findings: ['TSH: 2.1 mIU/L (normal)'],
    parameter_count: 3,
    abnormal_parameters: { high: [], low: [], critical: [] },
    health_score_that_day: 88,
    confidence_score: 99
  }
];

export const dummyParameterTrend: TrendData[] = [
  { date: '2026-03-20', value: 6.9, status: 'high', unit: '%' },
  { date: '2026-04-15', value: 7.0, status: 'high', unit: '%' },
  { date: '2026-05-18', value: 7.2, status: 'high', unit: '%' },
  { date: '2026-06-20', value: 7.1, status: 'high', unit: '%' }
];

export const dummyHealthScore: HealthScoreData = {
  family_member_id: 'family-123',
  health_tracking_score: 78,
  tracking_grade: 'B',
  components: {
    test_frequency: { score: 85, description: 'Regular testing', metrics: { reports_per_month: 1.0 } },
    parameter_coverage: { score: 72, description: 'Parameter diversity', metrics: { unique_parameters_tracked: 20 } },
    data_completeness: { score: 88, description: 'Data quality', metrics: { confirmation_rate: 96 } },
    trend_monitoring: { score: 65, description: 'Trend analysis', metrics: { parameters_with_trends: 8 } }
  },
  recommendations: [
    { area: 'frequency', suggestion: 'Increase testing frequency - currently 1/month, recommend 1.5/month' },
    { area: 'parameters', suggestion: 'Add vitamin B12 testing to comprehensive panel' }
  ],
  last_updated: '2026-06-22T10:30:00Z'
};
```

---

## 12. Frontend Folder Structure

```
medivault-web/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── analytics/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                 # Dashboard
│   │   │   │   ├── timeline/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── trends/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [parameter]/
│   │   │   │   │   └── page.tsx             # Individual parameter trend
│   │   │   │   ├── compare/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── attention/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── family/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── monthly/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── categories/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── health-score/
│   │   │   │       └── page.tsx
│   │   │   └── (other app routes...)
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── analytics/                       # NEW
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── MedicalTimeline.tsx
│   │   │   ├── ParameterTrends.tsx
│   │   │   ├── ReportComparison.tsx
│   │   │   ├── HealthTrackingScore.tsx
│   │   │   ├── AttentionValues.tsx
│   │   │   ├── FamilyHealthSummary.tsx
│   │   │   ├── MonthlySummary.tsx
│   │   │   └── ReportCategories.tsx
│   │   │
│   │   ├── analytics-charts/              # NEW
│   │   │   ├── ParameterTrendChart.tsx
│   │   │   ├── ParameterStatusChart.tsx
│   │   │   ├── HealthScoreGauge.tsx
│   │   │   ├── CategoryBreakdownChart.tsx
│   │   │   └── ComparisonChart.tsx
│   │   │
│   │   ├── analytics-filters/             # NEW
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── ParameterSelector.tsx
│   │   │   ├── FamilyMemberSelector.tsx
│   │   │   ├── ReportTypeFilter.tsx
│   │   │   └── FilterBar.tsx
│   │   │
│   │   ├── analytics-cards/               # NEW
│   │   │   ├── DashboardCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── TimelineCard.tsx
│   │   │   ├── AttentionCard.tsx
│   │   │   ├── FamilyMemberCard.tsx
│   │   │   └── RecommendationCard.tsx
│   │   │
│   │   ├── analytics-states/              # NEW
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── SuccessMessage.tsx
│   │   │   └── SkeletonCard.tsx
│   │   │
│   │   ├── ui/                            # Existing
│   │   ├── layout/                        # Existing
│   │   └── forms/                         # Existing
│   │
│   ├── contexts/
│   │   ├── AnalyticsContext.tsx            # NEW
│   │   ├── AuthContext.tsx                 # Existing
│   │   └── FamilyContext.tsx               # Existing
│   │
│   ├── hooks/
│   │   ├── useAnalytics.ts                 # NEW
│   │   ├── useAnalyticsFilters.ts          # NEW
│   │   ├── useChartData.ts                 # NEW
│   │   └── (existing hooks...)
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── analytics.ts                # NEW
│   │   │   ├── auth.ts
│   │   │   └── ...
│   │   ├── types/
│   │   │   ├── analytics.ts                # NEW
│   │   │   └── ...
│   │   └── utils/
│   │       ├── analytics-helpers.ts        # NEW
│   │       └── ...
│   │
│   ├── data/
│   │   ├── analytics-dummy.ts              # NEW
│   │   └── dummy.ts                        # Existing
│   │
│   └── styles/
│       └── globals.css
│
└── (config files)
```

---

## 13. Developer Task Breakdown

### Phase 5a: Analytics Components (3 weeks)

**Week 1: Dashboard & Charts (60 hours)**
- [ ] Create AnalyticsDashboard component
- [ ] Create DashboardCard components (x4)
- [ ] Create ParameterStatusGrid
- [ ] Set up Recharts library
- [ ] Create ParameterTrendChart
- [ ] Create ParameterStatusChart
- [ ] Create HealthScoreGauge chart
- [ ] Create CategoryBreakdownChart
- [ ] Unit tests for components
- [ ] Storybook stories for components

**Week 2: Filters & Selectors (50 hours)**
- [ ] Create DateRangePicker component
- [ ] Create ParameterSelector component
- [ ] Create FamilyMemberSelector component
- [ ] Create ReportTypeFilter component
- [ ] Create FilterBar integration
- [ ] Mobile responsive testing
- [ ] Accessibility testing

**Week 3: Pages & State Management (60 hours)**
- [ ] Create AnalyticsProvider context
- [ ] Create useAnalytics hook
- [ ] Create Analytics Layout page
- [ ] Create Dashboard page
- [ ] Create Timeline page
- [ ] Create Trends page
- [ ] Create individual Parameter page
- [ ] Create Comparison page
- [ ] Create HealthScore page
- [ ] Create empty/loading/error states
- [ ] End-to-end integration tests

---

## 14. Testing Checklist

### Unit Tests (Component Testing)

- [ ] DashboardCard renders correctly
- [ ] ParameterTrendChart displays data
- [ ] HealthScoreGauge shows correct score
- [ ] DateRangePicker updates filters
- [ ] ParameterSelector opens dropdown
- [ ] FamilyMemberSelector selects member
- [ ] EmptyState displays message
- [ ] LoadingState shows skeleton
- [ ] ErrorState shows retry button
- [ ] SuccessMessage displays and dismisses

### Integration Tests

- [ ] Dashboard loads and displays data
- [ ] Filters update dashboard
- [ ] Timeline loads events
- [ ] Parameter trend renders chart
- [ ] Report comparison shows differences
- [ ] Health score calculates correctly
- [ ] Family summary displays all members
- [ ] Monthly summary changes on month select

### E2E Tests (User Flows)

- [ ] User views dashboard → sees health score
- [ ] User selects family member → filters all screens
- [ ] User selects date range → updates all data
- [ ] User clicks parameter → shows trend chart
- [ ] User compares reports → sees improvements
- [ ] User checks health score → sees grade and recommendations
- [ ] Mobile: User scrolls → sees all content
- [ ] Mobile: User taps filter → opens modal

### Accessibility Tests

- [ ] All text is readable (color contrast >4.5:1)
- [ ] Charts have alt text
- [ ] Forms have labels
- [ ] Buttons are keyboard accessible
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Mobile: Touch targets >44x44px
- [ ] No content hidden from screen readers

### Performance Tests

- [ ] Dashboard loads in <2 seconds
- [ ] Charts render smoothly (60 FPS)
- [ ] Filter changes respond in <500ms
- [ ] No memory leaks in React DevTools
- [ ] Lighthouse score >90
- [ ] Mobile performance >75

### Responsive Design Tests

- [ ] iPhone 12 (390px): All content visible
- [ ] iPad (768px): Tablet layout works
- [ ] Desktop (1024px): Full layout
- [ ] Wide screen (1440px): Multi-column
- [ ] Charts responsive to width
- [ ] Tables scroll horizontally
- [ ] No horizontal scroll except tables

### Medical Content Tests

- [ ] Microcopy is clear and non-scary
- [ ] No medical terminology confused
- [ ] "Needs attention" instead of "critical"
- [ ] "Improving" shown with ↑ icon
- [ ] "Declining" shown with ↓ icon
- [ ] Normal values in green
- [ ] High values in red (not dark red)
- [ ] Disclaimers present ("consult doctor")

---

## Complete File List to Create

```
NEW FILES TO CREATE (45 files):

Pages (9):
1. src/app/(app)/analytics/page.tsx
2. src/app/(app)/analytics/timeline/page.tsx
3. src/app/(app)/analytics/trends/page.tsx
4. src/app/(app)/analytics/[parameter]/page.tsx
5. src/app/(app)/analytics/compare/page.tsx
6. src/app/(app)/analytics/attention/page.tsx
7. src/app/(app)/analytics/family/page.tsx
8. src/app/(app)/analytics/monthly/page.tsx
9. src/app/(app)/analytics/health-score/page.tsx

Main Components (9):
10. src/components/analytics/AnalyticsDashboard.tsx
11. src/components/analytics/MedicalTimeline.tsx
12. src/components/analytics/ParameterTrends.tsx
13. src/components/analytics/ReportComparison.tsx
14. src/components/analytics/HealthTrackingScore.tsx
15. src/components/analytics/AttentionValues.tsx
16. src/components/analytics/FamilyHealthSummary.tsx
17. src/components/analytics/MonthlySummary.tsx
18. src/components/analytics/ReportCategories.tsx

Chart Components (5):
19. src/components/analytics-charts/ParameterTrendChart.tsx
20. src/components/analytics-charts/ParameterStatusChart.tsx
21. src/components/analytics-charts/HealthScoreGauge.tsx
22. src/components/analytics-charts/CategoryBreakdownChart.tsx
23. src/components/analytics-charts/ComparisonChart.tsx

Filter Components (5):
24. src/components/analytics-filters/DateRangePicker.tsx
25. src/components/analytics-filters/ParameterSelector.tsx
26. src/components/analytics-filters/FamilyMemberSelector.tsx
27. src/components/analytics-filters/ReportTypeFilter.tsx
28. src/components/analytics-filters/FilterBar.tsx

Card Components (6):
29. src/components/analytics-cards/DashboardCard.tsx
30. src/components/analytics-cards/StatCard.tsx
31. src/components/analytics-cards/TimelineCard.tsx
32. src/components/analytics-cards/AttentionCard.tsx
33. src/components/analytics-cards/FamilyMemberCard.tsx
34. src/components/analytics-cards/RecommendationCard.tsx

State Components (5):
35. src/components/analytics-states/EmptyState.tsx
36. src/components/analytics-states/LoadingState.tsx
37. src/components/analytics-states/ErrorState.tsx
38. src/components/analytics-states/SuccessMessage.tsx
39. src/components/analytics-states/SkeletonCard.tsx

Context & Hooks (4):
40. src/contexts/AnalyticsContext.tsx
41. src/hooks/useAnalytics.ts
42. src/hooks/useAnalyticsFilters.ts
43. src/hooks/useChartData.ts

Services & Data (3):
44. src/lib/api/analytics.ts
45. src/data/analytics-dummy.ts

TYPE DEFINITIONS (existing file to update):
- src/lib/types.ts (add Analytics types)

TESTS (25):
- Component tests (15)
- Integration tests (5)
- E2E tests (5)
```

---

## Implementation Priority

### Must Have (MVP - Week 1-2)
1. Dashboard page with basic cards
2. Dashboard charts (score gauge, status bars)
3. Timeline page with events
4. Parameter selector & trend chart
5. Filter bar (date range, family member)
6. Empty/loading/error states
7. Mobile responsive layout

### Should Have (Week 3)
1. Health tracking score page
2. Report comparison
3. Family health summary
4. Monthly summary
5. Accessibility improvements
6. Performance optimization

### Nice to Have (Future)
1. Data export/print
2. Sharing reports
3. Custom parameter selection
4. Prediction models
5. AI recommendations

---

## Success Metrics

✅ **Performance**: Dashboard loads in <2 seconds
✅ **Accessibility**: WCAG 2.1 AA compliance
✅ **Usability**: Senior citizens can navigate with minimal training
✅ **Medical Safety**: No scary language, all disclaimers present
✅ **Mobile**: 100% responsive, works on all devices
✅ **Testing**: >80% code coverage

---

**Production-ready. Ready for frontend implementation.**
