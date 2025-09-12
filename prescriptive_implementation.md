# Complete Prescriptive Analytics Implementation Guide for K-12 Reading Assessment

## Executive Overview
This guide provides everything needed to implement prescriptive analytics for your reading assessment system. The system analyzes student performance, identifies weaknesses, generates one-time interventions, and recommends face-to-face support when needed.

## System Architecture

### Core Flow Sequence
```
1. Pre-Assessment → Determines Reading Level
2. Main Assessment → Student takes assessment based on reading level
3. Prescriptive Analysis → System analyzes performance using BKT & IRT models
4. Intervention Generation → Creates 10-question targeted intervention (if needed)
5. Intervention Assessment → Student takes one-time intervention
6. Results Analysis → Pass (≥75%) or Face-to-Face recommendation (<75%)
```

## Mathematical Models and Formulas

### 1. Bayesian Knowledge Tracing (BKT) Model
**Purpose:** Tracks how well a student knows each skill over time

```python
# Core BKT Parameters
P(L₀) = 0.5  # Initial probability student knows the skill (50%)
P(T) = 0.1   # Probability of learning from one question (10%)
P(G) = 0.3   # Probability of guessing correctly (30%)
P(S) = 0.1   # Probability of slipping (knowing but answering wrong) (10%)

# Update Formula - Run after each student answer
def update_mastery_probability(current_mastery, is_correct):
    if is_correct:
        # Student got it right - update belief they know it
        evidence = (current_mastery * (1 - P_S)) / 
                  (current_mastery * (1 - P_S) + (1 - current_mastery) * P_G)
    else:
        # Student got it wrong - update belief they don't know it
        evidence = (current_mastery * P_S) / 
                  (current_mastery * P_S + (1 - current_mastery) * (1 - P_G))
    
    # Apply learning factor
    new_mastery = evidence + (1 - evidence) * P_T
    return new_mastery
```

### 2. Item Response Theory (IRT) Model
**Purpose:** Estimates student ability and question difficulty on same scale

```python
def probability_correct(student_ability, question_difficulty, discrimination=1.0):
    """
    student_ability: -3 to +3 scale (0 is average)
    question_difficulty: -3 to +3 scale (0 is average)
    discrimination: How well question separates high/low performers
    """
    return 1 / (1 + np.exp(-1.702 * discrimination * (student_ability - question_difficulty)))
```

### 3. Category Weights by Reading Level
**Purpose:** Different skills matter more at different reading levels

```python
CATEGORY_WEIGHTS = {
    "Low Emerging": {
        "Alphabet Knowledge": 1.0,        # 100% weight - only this matters
        "Phonological Awareness": 0.0,
        "Decoding": 0.0,
        "Word Recognition": 0.0,
        "Reading Comprehension": 0.0
    },
    "High Emerging": {
        "Alphabet Knowledge": 0.6,        # 60% weight
        "Phonological Awareness": 0.4,    # 40% weight
        "Decoding": 0.0,
        "Word Recognition": 0.0,
        "Reading Comprehension": 0.0
    },
    "Developing": {
        "Alphabet Knowledge": 0.35,       # 35% weight
        "Phonological Awareness": 0.30,   # 30% weight
        "Decoding": 0.35,                # 35% weight
        "Word Recognition": 0.0,
        "Reading Comprehension": 0.0
    },
    "Transitioning": {
        "Alphabet Knowledge": 0.20,       # 20% weight
        "Phonological Awareness": 0.25,   # 25% weight
        "Decoding": 0.25,                # 25% weight
        "Word Recognition": 0.30,         # 30% weight
        "Reading Comprehension": 0.0
    },
    "At Grade Level": {
        "Alphabet Knowledge": 0.10,       # 10% weight
        "Phonological Awareness": 0.15,   # 15% weight
        "Decoding": 0.15,                # 15% weight
        "Word Recognition": 0.20,         # 20% weight
        "Reading Comprehension": 0.40     # 40% weight - most important
    }
}
```

## Component Locations and Structure

### Backend Python Files

#### 1. `/backend/services/prescriptive_analytics_engine.py`
Main analytics engine containing:
- `PrescriptiveAnalyticsEngine` class
  - `generate_analysis()` - Creates full prescriptive analysis
  - `_calculate_skill_mastery()` - BKT calculations
  - `_estimate_abilities()` - IRT ability estimates
  - `_analyze_error_patterns()` - Identifies specific weaknesses
  - `_generate_intervention_plan()` - Creates intervention strategy
  - `_generate_insights()` - Overall performance summary

#### 2. `/backend/services/intervention_generator.py`
Intervention creation system:
- `InterventionGenerator` class
  - `generate_intervention()` - Creates 10-question intervention
  - `_generate_adaptive_questions()` - Selects questions based on errors
  - `_calculate_question_distribution()` - 70% targeted, 30% general

#### 3. `/backend/services/progress_tracker.py`
Tracks student progress:
- `ProgressTracker` class
  - `update_after_intervention()` - Updates analysis post-intervention
  - `get_performance_comparison()` - Before/after comparison
  - `check_face_to_face_needed()` - Determines if F2F required

### Frontend React Files

#### 1. `/src/services/prescriptiveAnalytics.js`
API service layer for frontend:
```javascript
class PrescriptiveAnalyticsService {
    generateAnalysis(studentId, assessmentType)
    getAnalysis(studentId, analysisId)
    generateIntervention(analysisId, category)
    updateAnalysisAfterIntervention(studentId, interventionResultsId)
    getPerformanceComparison(studentId, category)
    checkFaceToFaceNeeded(studentId)
}
```

#### 2. `/src/components/PrescriptiveAnalysisDashboard.jsx`
Main dashboard showing:
- Overall performance insights
- Category-wise mastery levels
- Error analysis details
- Intervention recommendations
- Face-to-face alerts

#### 3. `/src/components/InterventionGenerator.jsx`
Intervention creation interface:
- Preview of 10 questions
- Focus area display
- Pass threshold warning
- One-time intervention notice

### API Endpoints

#### 1. `/backend/routes/prescriptiveAnalytics.js`
```javascript
POST   /api/prescriptive-analysis           // Generate new analysis
GET    /api/prescriptive-analysis/:id       // Get specific analysis
GET    /api/prescriptive-analysis/student/:studentId/latest  // Latest analysis
POST   /api/intervention/generate           // Create intervention
POST   /api/prescriptive-analysis/update    // Update after intervention
GET    /api/prescriptive-analysis/comparison/:studentId/:category  // Compare
GET    /api/prescriptive-analysis/face-to-face-check/:studentId    // F2F check
```

## Error Pattern Analysis

### Alphabet Knowledge
```python
error_patterns = {
    'patinig_errors': {
        'count': 2,           # Number wrong
        'total': 10,          # Total questions
        'percentage': 20,     # Error rate
        'specific_letters': ['E', 'O'],  # Which letters
        'error_type': 'visual_confusion'  # Type of error
    },
    'katinig_errors': {
        'count': 5,
        'total': 15,
        'percentage': 33,
        'specific_letters': ['B', 'D', 'P'],
        'error_type': 'sound_substitution'
    }
}
```

### Phonological Awareness
```python
error_patterns = {
    'matching_errors': {
        'count': 4,
        'total': 6,
        'percentage': 67,
        'avg_partial_success': 0.47,  # Got 47% of matches right
        'error_type': 'sound_discrimination'
    }
}
```

### Decoding
```python
error_patterns = {
    'decoding_errors': {
        'count': 3,
        'total': 10,
        'percentage': 30,
        'most_error_position': 0,  # 0=beginning, 1=middle, 2=end
        'error_type': 'specific_pattern'
    }
}
```

## Intervention Generation Algorithm

### Question Distribution Calculation
```python
def calculate_question_distribution(error_patterns, total_questions=10):
    """
    Generates exactly 10 questions:
    - 70% (7 questions) target specific errors
    - 30% (3 questions) general reinforcement
    """
    distribution = {}
    
    # Calculate weights based on error rates
    for error_type, pattern in error_patterns.items():
        error_rate = pattern['percentage'] / 100.0
        distribution[error_type] = error_rate * 0.7  # 70% targeted
    
    # Add general practice
    distribution['general'] = 0.3  # 30% general
    
    # Convert to question counts
    question_counts = {}
    for type, weight in distribution.items():
        count = round(weight * total_questions)
        question_counts[type] = count
    
    return question_counts
```

### Example Distribution
For a student with 67% error rate in sound matching:
- 7 questions targeting sound discrimination
- 3 questions for general phonological practice
- Total: 10 questions

## Pass/Fail Logic

### Success Criteria
- **Pass:** Score ≥ 75% on intervention
- **Fail:** Score < 75% on intervention

### Actions Based on Results
```python
if intervention_score >= 75:
    # PASSED
    - Update prescriptive_analysis with success
    - Mark category as improved
    - No further intervention needed
    - Continue regular curriculum
else:
    # FAILED
    - Update prescriptive_analysis with failure
    - Flag for face-to-face intervention
    - Prevent additional digital interventions
    - Alert teacher for personal support
```

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create prescriptive_analysis collection
- [ ] Create intervention_assessment collection
- [ ] Add intervention_results collection
- [ ] Update existing collections with needed fields

### Phase 2: Backend Implementation
- [ ] Install required packages: numpy, scipy, pandas, pymongo
- [ ] Implement PrescriptiveAnalyticsEngine class
- [ ] Implement InterventionGenerator class
- [ ] Create API endpoints
- [ ] Add authentication/authorization

### Phase 3: Frontend Implementation
- [ ] Install required packages: recharts, axios
- [ ] Create prescriptiveAnalytics service
- [ ] Build PrescriptiveAnalysisDashboard component
- [ ] Build InterventionGenerator component
- [ ] Integrate with existing assessment flow

### Phase 4: Testing
- [ ] Unit tests for BKT calculations
- [ ] Unit tests for IRT calculations
- [ ] Integration tests for API endpoints
- [ ] End-to-end testing of full flow
- [ ] Performance testing with multiple students

### Phase 5: Deployment
- [ ] Deploy backend services
- [ ] Deploy frontend updates
- [ ] Monitor error rates
- [ ] Collect teacher feedback
- [ ] Iterate based on usage data

## Key Files Summary

### Python Backend
```
/backend/
├── services/
│   ├── prescriptive_analytics_engine.py  # Main analytics engine
│   ├── intervention_generator.py         # Question generation
│   └── progress_tracker.py              # Progress monitoring
├── routes/
│   └── prescriptiveAnalytics.js        # API endpoints
├── controllers/
│   └── prescriptiveAnalyticsController.js  # Request handling
└── utils/
    └── dataValidation.js               # Schema validation
```

### React Frontend
```
/src/
├── services/
│   └── prescriptiveAnalytics.js       # API service layer
├── components/
│   ├── PrescriptiveAnalysisDashboard.jsx  # Main dashboard
│   └── InterventionGenerator.jsx          # Intervention UI
└── utils/
    └── analysisHelpers.js              # Helper functions
```

## Important Notes

1. **One-Time Intervention:** Each category gets ONE intervention attempt only
2. **Fixed Questions:** Always exactly 10 questions per intervention
3. **No Time Predictions:** System focuses on immediate performance, not future predictions
4. **Face-to-Face Priority:** Failed interventions require human teacher support
5. **75% Pass Threshold:** Non-negotiable passing score for all interventions

## Research References
- Bayesian Knowledge Tracing (Corbett & Anderson, 1994)
- Item Response Theory (Baker & Kim, 2017)
- Response to Intervention (Fuchs & Fuchs, 2006)
- Educational Data Mining (Romero & Ventura, 2020)