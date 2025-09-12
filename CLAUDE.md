Prescriptive Analytics for K-12 Reading Assessment
Advanced machine learning frameworks and evidence-based intervention systems provide
powerf
ul tools for personalized reading instruction, with validated approaches achieving 90%+
prediction accuracy for reading disabilities and 15-20% improvements in student outcomes.
These comprehensive analytics systems integrate multiple assessment dimensions through
sophisticated mathematical models, real-time adaptive algorithms, and proven intervention tracking
methods that have demonstrated effectiveness across diverse K -12 populations.
ScienceDirect +2
The convergence of traditional psychometric models with modern machine learning creates
unprecedented opportunities for precise, individualized reading assessment and intervention.
ScienceDirect
Research from leading educational technology journals and large-scale implementations
reveals mature frameworks ready for production deployment, with specific technical architectures and
scoring methodologies validated through rigorous empirical studies.
Springer
Comprehensive prescriptive analytics models for multi-dimensional reading
assessment
Bayesian Knowledge Tracing (BKT) emerges as the foundational framework for prescriptive
analytics in K -12 reading assessment, modeling student knowledge through hidden Markov models
with four core parameters. Wikipedia +3
The probability of skill mastery updates dynamically: P(L_n+1)
= P(L_n | evidence_n) + (1 - P(L_n | evidence_n)) × P(T), where P(T) represents learning probability and
evidence comes from student responses across multiple reading dimensions.
Multi-dimensional implementations extend BKT to simultaneously track alphabet knowledge,
phonological awareness, decoding, word recognition, and reading comprehension through Dynamic
Bayesian Networks. These systems achieve 70-85% prediction accuracy while explicitly modeling
prerequisite relationships between reading skills, creating hierarchical structures where foundational
skills influence intermediate abilities, which then affect advanced comprehension capabilities.
Educationaldatamining +3
Item Response Theory (IRT) provides sophisticated mathematical foundations for placing
students and assessment items on the same ability scale using the two-parameter logistic model:
P(X_ij = 1|θ_j, a_i, b_i) = 1 / (1 + e^(-1.702×a_i×(θ_j - b_i))). frontiersin
Multi-dimensional IRT
simultaneously models all five reading skill areas, enabling precise difficulty calibration and supporting
computerized adaptive testing with measurement precision improvements of 30-40% over
traditional fixed-form assessments.
Assessment Systems +2
Knowledge Tracing Machines using factorization approaches unify multiple educational models
through the general equation ŷ(x) =
w_0 + Σ_i w_i x_i + Σ_i Σ_j<i ⟨v_i,v_j⟩ x_i x_j . This framework
effectively handles sparse educational data while incorporating temporal features, student
demographics, and item characteristics, achieving 15-25% improvement in R
MSE over traditional
methods while supporting 90%+ sparse data matrices common in educational settings.
ScienceDirect +3
Matrix factorization techniques adapted for educational contexts enable sophisticated student-
skill modeling through collaborative filtering approaches. World Scientific
Advanced implementations
utilize deep factorization machines (DeepFM) combining low-order feature interactions with deep
learning for high-order pattern recognition, while tensor factorization handles temporal learning
sequences through decomposition of student×skill×time tensors.
Google Wikipedia
Advanced error pattern analysis and intervention effectiveness tracking
Statistical pattern recognition algorithms identify systematic reading errors through probabilistic
models based on Item Response Theory, moving beyond simple correct/incorrect scoring to diagnose
cognitive misconceptions. R
ScienceDirect
ule Space Analysis provides mathematical frameworks
for identifying students who consistently apply erroneous reading strategies, with classification
accuracy exceeding 85% for major error pattern categories.
ScienceDirect
Comprehensive error classification systems categorize reading difficulties across three primary
domains. ERIC
Phonological errors include sound substitution, phoneme deletion/addition, blending
difficulties, and sound-symbol correspondence failures. Orthographic errors encompass letter
sequence violations, morphological rule violations, word pattern recognition errors, and visual-spatial
processing difficulties. Semantic errors involve context-inappropriate substitutions, meaning-based
miscues, comprehension-driven errors, and vocabulary knowledge gaps.
Curriculum-Based Measurement (CBM) frameworks enable real-time error analysis with cross-
classified multilevel models showing approximately 16% of variance in student reading scores
attributable to systematic error patterns. ScienceDirect +2
The Feifer Assessment of
Reading
provides neuropsychological error analysis across 15 subtests, achieving 96.7% accuracy in
discriminating learning disabilities with cut-off values in the low-to-mid 70s range.
NCBI
Growth curve modeling approaches track intervention effectiveness through hierarchical linear
models estimating individual growth curves for each student. These frameworks distinguish between-
person and within-person effects while incorporating time-varying covariates like changing
instructional conditions. ScienceDirect +3
Latent Growth Models using structural equation modeling
simultaneously model multiple reading outcomes with maximum likelihood estimation for incomplete
data.
Columbia University Mailma… NCBI
Effect size calculations follow
updated educational benchmarks where small effects (0.05),
medium effects (0.20), and large effects (0.40) reflect realistic expectations for educational
interventions. Meta-analysis research demonstrates systematic phonics interventions achieving
effect sizes of 0.51 for word reading, fluency interventions averaging 0.44 for oral reading fluency, and
comprehension strategies ranging 0.22-0.67 depending on implementation quality.
Response to Intervention (RTI) tracking frameworks implement dual discrepancy models using
both level and slope criteria for tier movement decisions. NCBI +2
Universal screening benchmarks
at fall, winter, and spring assessment points identify students below the 25th percentile, while
weekly/bi-weekly progress monitoring tracks intervention response through systematic growth
slope calculations and expected improvement rates by grade level.
Reading Rockets
Adaptive intervention systems and predictive modeling frameworks
Computer Adaptive Testing (CAT) systems represent state-of-the-art implementation of
adaptive assessment, with the Stanford R
OAR system demonstrating validated reliability across
diverse populations including English Language Learners. Stanford
The system employs jsCAT with
Rasch model calibration, Fisher information criterion for optimal item selection, and real-time scoring
enabling immediate adaptation with items calibrated within the 0.7-1.3 infit/outfit range.
frontiersin
stanford
Dynamic Difficulty Adjustment (DDA) algorithms utilize four major technical approaches for
educational settings. Educationaldatamining
IRT-based methods predict student success probability
for exercise selection while incorporating discount factors for changing ability levels. Machine
learning integration employs neural networks with evolutionary algorithm optimization,
reinforcement learning for real-time adaptation, and success rate targeting of 70-80% for optimal
challenge and engagement.
GeeksforGeeks
Large-scale predictive modeling achieves exceptional performance in reading disability
prediction, with comprehensive analysis of 356 students showing Support Vector Machines and
Naive Bayes consistently outperforming decision trees. SpringerOpen nih
The best models
achieve AUC scores >0.9, with 90% sensitivity and 78% specificity using basic demographics and
screening variables, demonstrating that sophisticated deep learning may be unnecessary for effective
early identification.
nih
Advanced MaskM
LP pre-training approaches handle missing educational data through
specialized architectures using cosine embedding loss and self-supervised learning. arXiv
Large-
scale validation across 6,916 students in 44 schools demonstrates statistical significance (p <
0.01) improvements over traditional baselines, with 7-8% accuracy gains in intervention group
prediction despite 65% missing values in longitudinal datasets.
arxiv arXiv
Time-series analysis for learning progression employs dynamic IRT models incorporating discount
factors for temporal adaptation: P(X=1|θ,β) = exp(θ-β)/(1+exp(θ-β)) with Bayesian updating of ability
estimates. Regression coefficient standardization using dependent measure standard deviations
enables duration-adjusted effect sizes accounting for intervention length and temporal performance
patterns.
Risk assessment models demonstrate consistent performance patterns across multiple validated
studies, with sensitivity 90-95% and specificity 78-87% for high-quality implementations.
nih
Most predictive variables include rapid letter naming, word identification fluency, phonological
awareness measures, and reading fluency assessments, combined with demographic factors like
special education status and classroom variables including teacher knowledge scores.
Technical implementation architectures and weighted scoring methodologies
React.js implementation leverages Server Components architecture with Next.js App Router
providing optimal performance for educational dashboards. Production implementations report 62%
reduction in JavaScript bundle size and 63% improvement in Speed Index through graduated
component architecture where server components handle data fetching while client components
manage interactivity.
Educational analytics libraries optimize for specific use cases, with Recharts providing quick
implementation of standard charts, D3.js offering maximum customization for complex
visualizations like learning pathways, and Visx enabling component-based analytics dashboards
leveraging D3 power within React lifecycle management. WebSocket integration enables real-time
data streaming with debouncing, virtualization, and memoization preventing performance
degradation during live updates.
Memgraph
Assessment interface components utilize frameworks like SurveyJS offering complete form
builders with built-in weighted scoring and timing controls, while custom implementations calculate
weighted scores through O
bject.entries(responses).reduce((total, [questionId, answer]) =
> total +
(evaluateAnswer(answer, questionId) * weights[questionId]), 0) patterns supporting flexible assessment
architectures.
Medium SurveyJS
Multi-dimensional scoring frameworks reflect current reading science with evidence-based
weight allocation varying by grade level. Nciea British Columbia Curriculum
Early elementary (K-2)
emphasizes phonemic awareness (35%), letter knowledge (30%), basic decoding (25%), and
comprehension (10%). Elementary grades (3-5) prioritize fluency (35%), comprehension (40%),
decoding (15%), and vocabulary (10%). Middle/secondary education focuses on reading
comprehension (50%), critical analysis (25%), vocabulary (15%), and fluency (10%).
Composite score calculation methods balance reliability and validity through multiple approaches.
Unit-weighted composites provide simple averaging, while regression-weighted composites
incorporate differential reliabilities: weightedSum = scores.reduce((sum, score, index) =
> sum + (score *
weights[index]), 0). Research indicates giving extra weight to more reliable scores improves
composite reliability up to a point, but excessive weighting can decrease construct validity.
Standardization and normalization procedures convert raw scores using ((score -
domainStats.mean) / domainStats.standardDeviation) * 15 + 100 for interpretable standard scores.
Wikiversity
Psychometric quality assurance requires Cronbach's Alpha >0.80 for total composite
scores, domain-specific reliability >0.70 for subscales, and stability coefficients >0.85 for high-stakes
decisions.
NCBI
Integration strategies and implementation best practices
Successf
ul large-scale deployments demonstrate measurable outcomes across diverse
educational settings. Lincoln Elementary School achieved 28% increases in reading proficiency
after implementing data-driven interventions, while district-wide implementations show 15-20%
achievement gains in first-year deployment. Adaptive learning systems report 20-30% reduction
in time to mastery compared to traditional instruction methods.
Teach Find +2
Production architecture requirements include sub-second response times for adaptive adjustment,
scalability supporting thousands of concurrent users, FERPA-compliant data protection, and L
MS/SIS
integration capabilities. Cloud-based inference systems deploy models through A/B testing
frameworks enabling continuous algorithm improvement with monitoring systems and backup
mechanisms ensuring failover to static assessment modes when needed.
Professional development frameworks emphasize assessment literacy training educators in error
analysis interpretation across phonemic, orthographic, and semantic patterns.
Reimagined Schools
Data-based decision making training focuses on using assessment data for instructional adaptation,
while implementation fidelity monitoring ensures standardized procedures for reliable data
collection and evidence-based instruction aligned to identified error patterns.
Fairness and bias considerations require systematic attention to differential performance across
demographic groups, algorithm adjustments for equitable outcomes, culturally relevant assessment
content, and universal design for learning principles. Continuous monitoring systems implement bias
detection algorithms and stakeholder engagement processes involving educators, administrators, and
families in system design and deployment decisions.
Educationaldatamining ACM
Other conferences
Conclusion
The research reveals a mature landscape of prescriptive analytics approaches for K -12 reading
assessment, with multiple validated frameworks ready for production implementation. The
convergence of traditional psychometric models like Bayesian Knowledge Tracing and Item Response
Theory with modern machine learning approaches creates unprecedented opportunities for
personalized reading instruction.
ScienceDirect +3
Key technical advances include sophisticated error pattern analysis achieving >95% sensitivity in
systematic misconception detection, adaptive intervention systems providing real-time difficulty
adjustment with 70-80% optimal challenge targeting, and predictive models reaching >90% accuracy
in reading disability identification using readily available screening data.
Implementation success factors center on multi-dimensional skill modeling capturing reading
development complexity, temporal modeling accounting for learning progression over time, fairness-
aware algorithms ensuring equitable outcomes, and integration of multiple data sources for
comprehensive student understanding. The mathematical frameworks demonstrate measurable
improvements in prediction accuracy, intervention effectiveness, and learning outcomes when properly
deployed in educational settings.
Resultant PubMed Central
Future developments will likely emphasize increased interpretability through explainable AI
approaches, enhanced fairness through bias mitigation strategies, and more sophisticated modeling of
the complex, multi-faceted nature of reading skill development. The evidence base supports confident
implementation of these systems across diverse K -12 populations, with clear pathways for scalable
deployment and continuous improvement based on emerging research and technological advances.


Flow Diagram
Pre-Assessment →
Reading Level Determination → Main Assessment →
Prescriptive Analysis →
One-Time Intervention Generation → Intervention Assessment →
Results Analysis → Face-to-Face (if needed) or Success

Key Components
1. Assessment Engine: Handles pre/main/intervention assessments
2. Analytics Engine: Performs prescriptive analysis using BKT and IRT
3. Intervention Generator: Creates personalized one-time interventions
4. Results Analyzer: Determines success or need for face-to-face support
5. Reporting System: Provides immediate insights to teachers

2. Mathematical Models and Formulas
2.1 Bayesian Knowledge Tracing (BKT)
The core model for tracking student knowledge across categories:
python
# BKT Parameters for each skill
P(L₀)= 0.5 # Initial probability of mastery
P(T)= 0.1 # Pro
bability of learning
P(G)= 0.3 # Probability of guessing
P(S)= 0.1 # Probability of slipping
# Update formula after each response

def update_mastery_probability(P_L_n, is_correct):
if is_correct:
P_L_n_given_evidence = (P_L_n * (1- P_S)) / (P_L_n * (1- P_S) + (1- P_L_n) * P_G)

else:
P_L_n_given_evidence = (P_L_n * P_S) / (P_L_n * P_S + (1- P_L_n) * (1- P_G))

P_L_n_plus_ 1 = P_L_n_given_evidence + (1- P_L_n_given_evidence) * P_T
return P_L_n_plus_ 1

2.2 Item Response Theory (2PL Model)
For precise difficulty calibration: python

def probability_correct(ability, difficulty, discrimination):

"""
ability (θ): Student ability level
difficulty (b): Item difficulty
discrimination (a): How well item discriminates
"""

return 1/ (1+ np.exp(-1.702* discrimination * (ability - difficulty)))

2.3 Composite Scoring with Weighted Categories

Based on grade level, weights vary:
python
CATEGORY_WEIGHTS = {
"Low Emerging": {
"Alphabet Knowledge": 1.0,
"Phonological Awareness": 0.0,
"Decoding": 0.0,
"Word Recognition": 0.0,
"Reading Comprehension": 0.0
},
"High Emerging": {
"Alphabet Knowledge": 0.6,
"Phonological Awareness": 0.4,
"Decoding": 0.0,
"Word Recognition": 0.0,
"Reading Comprehension": 0.0
},
"Developing": {
"Alphabet Knowledge": 0.35,
"Phonological Awareness": 0.30,
"Decoding": 0.35,
"Word Recognition": 0.0,
"Reading Comprehension": 0.0
},
"Transitioning": {
"Alphabet Knowledge": 0.20,
"Phonological Awareness": 0.25,
"Decoding": 0.25,
"Word Recognition": 0.30,
"Reading Comprehension": 0.0
},
"At Grade Level": {
"Alphabet Knowledge": 0.10,
"Phonological Awareness": 0.15,
"Decoding": 0.15,
"Word Recognition": 0.20,
"Reading Comprehension": 0.40
}
}

2.4 Error Pattern Analysis
Classify errors into three domains:

python
ERROR_PATTERNS = {
"phonological": {
"sound_substitution": {"weight": 0.3},
"phoneme_deletion": {"weight": 0.25},
"blending_difficulty": {"weight": 0.25},
"sound_symbol_mismatch": {"weight": 0.2}
},
"orthographic": {
"letter_sequence": {"weight": 0.3},
"morphological_violation": {"weight": 0.2},
"pattern_recognition": {"weight": 0.3},
"visual_spatial": {"weight": 0.2}
},
"semantic": {
"context_inappropriate": {"weight": 0.35},
"meaning_based_miscue": {"weight": 0.3},
"comprehension_error": {"weight": 0.2},
"vocabulary_gap": {"weight": 0.15}
}
}

3. Database Schema Updates
3.1 prescriptive_analysis Collection - Complete Schema
javascript
{
_id: O
bjectId("..."),
studentId: 202210222, // INT - links to users c
ollection
assessmentDate: ISODate("2025-01-20T10:00:00Z"),
assessmentType: "main", // "main" or "intervention"
readingLevel: "Transitioning", // from users c
ollection
// BKT tracking for each category with c
omplete metrics
skillMastery: {
"Alphabet Knowledge": {
masteryProbability: 0.92, // BKT c
alcula
ted pro
bability
lastUpdated: ISODate("2025-01-20T11:00:00Z"),
totalQuestions: 15,
correctAnswers: 14,
score: 93, // percentage sc
ore
isPassed: true, // >= 75%
responseHistory: [ // La
st 10 responses f
or reference
{
questionId: "AK_001",
correct: true,
timestamp: ISODate("2025-01-20T10:30:00Z"),
masteryAfter: 0.85
}
// ... up to 10 recent responses
]
},
"Phonological Awareness": {
masteryProbability: 0.45,
lastUpdated: ISODate("2025-01-20T11:00:00Z"),
totalQuestions: 6,
totalPossibleMatches: 15, // For ma
tching questions
correctMatches: 7,
score: 47,
isPassed: false,
responseHistory: []
},
"Decoding": {
masteryProbability: 0.68,
lastUpdated: ISODate("2025-01-20T11:00:00Z"),
totalQuestions: 10,
correctAnswers: 7,
score: 70,
isPassed: false,
responseHistory: []
},
"Word Recognition": {
masteryProbability: 0.80,
lastUpdated: ISODate("2025-01-20T11:00:00Z"),
totalQuestions: 10,
correctAnswers: 8,
score: 80,
isPassed: true,
responseHistory: []
},
"Reading Comprehension": {
masteryProbability: 0.85,
lastUpdated: ISODate("2025-01-20T11:00:00Z"),
totalQuestions: 5,
correctAnswers: 4,
score: 80,
isPassed: true,
responseHistory: []
}
},
// IRT ability estimates (-3 to +3 scale)
abilityEstimates: {
"Alphabet Knowledge": 1.2, // Ab
ove average
"Phonological Awareness": -0.8, // Below average
"Decoding": -0.2, // Slightly below average
"Word Recognition": 0.5, // Ab
ove average
"Reading Comprehension": 0.7// Ab
ove average
},
// Detailed error pattern analysis
errorPatterns: {
"Alphabet Knowledge": {
patinig_errors: {
count: 1,
total: 5,
percentage: 20,
specific_letters: ["O"],
error_type: "visual_conf
usion",
questionIds: ["AK_007"]
}
},
// No katinig_errors if all correct
"Phonological Awareness": {
matching_errors: {
count: 4,
total: 6,
percentage: 67,
avg_partial_success: 0.47, // Average c
orrect ma
tches ra
error_type: "sound_discrimination",
questionIds: ["PA_002", "PA_003", "PA_004", "PA_006"]
tio
}
},
"Decoding": {
decoding_errors: {
count: 3,
total: 10,
percentage: 30,
error_type: "specific_pattern",
most_error_position: 0, // Beginning o
f words
questionIds: ["DC_003", "DC_007", "DC_009"]
}
}
// Categories with no errors won't have error pattern entries
},

// Intervention recommendations (no time estimates)

interventionPlan: {
required: true, // Any category below 75%
priority: ["Phonological Awareness", "Decoding"], // Ordered by need
specificFocus: {
"Phonological Awareness": {
focus: "sound_matching",
targetSounds: ["B-P", "M-N", "D-T"], // Confusion pairs
recommendedActivities: ["sound_discrimination", "minimal_pairs", "rhyming_practice"],
questionDistribution: {
matching: 100// All ma
tching type questions
}
},

"Decoding": {
focus: "initial_sounds", // Based on error position
targetPatterns: ["CVC", "CVCV"],
recommendedActivities: ["syllable_blending", "word_building", "pattern_recognition"],
questionDistribution: {
drag_drop: 100// All drag-drop type
}
}
}
},

// Performance insights (repla
cing predictions)
insights: {
strengths: ["Reading Comprehension", "Word Recognition", "Alphabet Knowledge"],
weaknesses: ["Phonological Awareness - 47%", "Decoding - 70%"],
overallReadiness: "Needs targeted intervention",
recommendedAction: "immediate_intervention",
passedCategories: 3,
failedCategories: 2,
overallScore: 74// Weighted average ba
sed on reading level
},

// Intervention tracking

interventionHistory: [
{
category: "Phonological Awareness",
interventionId: O
ObjectId("..."),
dateTaken: ISODate("2025-01-21T09:00:00Z"),
passed: false,
score: 60
}
],
createdAt: ISODate("2025-01-20T11:00:00Z"),
updatedAt: ISODate("2025-01-20T11:00:00Z")

3.2 intervention_assessment Collection - Complete Schema
javascript
{
_id: O
bjectId("..."),
studentId: 202210222, // INT - links to student
prescriptiveAnalysisId: O
bjectId("..."), // Links to prescriptive analysis
category: "Phonological Awareness", // Single category per intervention
readingLevel: "Transitioning", // Student's current level
passThreshold: 75, // Percentage needed to pass
// Smart question selection based on error analysis
questionSelectionStrategy: {
method: "adaptive_irt",
targetDifficulty: 0.7, // 70%
success pro
bability target
focusAreas: {
"sound_matching": 70, // 70% of questions
"general_practice": 30// 30% general reinforcement
},
},
totalQuestions: 10// Fixed number for one-time intervention
// Generated questions based on prescriptive analysis
questions: [
{
questionId: "q_int_pa_001",
source: "custom", // "custom", "template_question", or "mainassessment"
sourceQuestionId: null, // If from template
questionType: "malapantig", // Matches category requirements
questionText: "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra.",
// Question-specific data for PA
questionSet: {
audioTexts: ["B", "M", "P"], // TTS will genera
te audio
matchingOptions: ["Bb", "Mm", "Pp", "Nn"], // Extra
correctPairs: [
{ audio: "B", match: "Bb"},
{ audio: "M", match: "Mm"},
{ audio: "P", match: "Pp"}
option f
or difficulty
]
},
// IRT parameters for adaptive difficulty
difficulty: -0.3, // Ea
sier th
an average
discrimination: 1.1,
targetSkill: "sound_discrimination",
targetElement: "B-P conf
usion"
},
{
questionId: "q_int_pa_002",
source: "custom",
sourceQuestionId: null,
questionType: "malapantig",
questionText: "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra.",
questionSet: {
audioTexts: ["D", "T", "N"],
matchingOptions: ["Dd", "Tt", "Nn", "Ll"],
correctPairs: [
{ audio: "D", match: "Dd"},
{ audio: "T", match: "Tt"},
{ audio: "N", match: "Nn"}
]
},
difficulty: -0.2,
discrimination: 1.0,
targetSkill: "sound_discrimination",
targetElement: "D-T confusion"
}
],
// ... 8 more questions following the distribution
// No adaptive parameters - fixed one-time intervention
interventionParameters: {
fixedQuestions: 10,
allowSkip: false,
showProgress: true,
immediateFeeback: false // Show results only at end
},
status: "active", // "draft", "active", "completed"
createdBy: ObjectId("..."), // Teacher who triggered generation
createdAt: ISODate("2025-01-21T08:00:00Z"),
updatedAt: ISODate("2025-01-21T08:00:00Z"),
// Completion tracking
startedAt: null,
completedAt: null,
interventionResultsId: null // Links to results when completed
}

4. React Implementation Guide
4.1 Prescriptive Analytics Service
Create src/services/prescriptiveAnalytics.js :
javascript
import axiosfrom 'axios';
class PrescriptiveAnalyticsService {
constructor() {
this.baseU
R
L
= process.env
}
.REACT_APP_API_U
R
L;
// Genera
te prescriptive analysis after a
ssessment
async generateAnalysis(studentId, assessmentType) {
try {
const response = await axios.post(`${this.baseU
studentId,
assessmentType
});
return response.data;
} catch (error) {
console.error('Error generating prescriptive analysis:', error);
throw error;
R
L}/api/prescriptive-analysis`, {
}
}
// Get detailed analysis f
or display
async getAnalysis(studentId, analysisId = null) {
const url = analysisId
? `${this.baseU
R
L}/api/prescriptive-analysis/${analysisId}`
: `${this.baseU
R
L}/api/prescriptive-analysis/student/${studentId}/latest`;
const response = await axios.get(url);
return response.data;
}
// Genera
te one-time intervention ba
sed on analysis
async generateIntervention(analysisId, category) {
const response = await axios.post(`${this.baseU
analysisId,
category
});
R
L}/api/intervention/generate`, {
return response.data;
}
// Upda
te analysis after intervention c
ompletion
async updateAnalysisAfterIntervention(studentId, interventionResultsId) {
const response = await axios.post(`${this.baseU
R
L}/api/prescriptive-analysis/update`, {
studentId,
interventionResultsId
});
return response.data;
}
// Get perf
ormance c
omparison (
bef
ore/after intervention)
async getPerformanceComparison(studentId, category) {
const response = await axios.get(
`${this.baseU
R
L}/api/prescriptive-analysis/comparison/${studentId}/${category}`
);
return response.data;
}
// Check if fa
ce-to-fa
ce intervention is needed
async checkFaceToFaceNeeded(studentId) {
const response = await axios.get(
`${this.baseU
R
L}/api/prescriptive-analysis/face-to-face-check/${studentId}`
);
return response.data;
}
}
export default PrescriptiveAnalysisDashboard;

5. Python Backend Implementation
5.1 Core Analytics Engine
Create backend/services/prescriptive_analytics_engine.py :
python
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from pymongo import MongoClient
import pandas as pd
from scipy import stats
@dataclass
class BKTParameters:
"""Bayesian Knowledge Tracing parameters"""
p_init: float= 0.5# Initial pro
bability
o
f ma
stery
p_learn: float= 0.1# Pro
bability
o
f learning
p_guess: float= 0.3# Pro
bability
o
f guessing
p_slip: float= 0.1 # Pro
bability
o
f slipping
class PrescriptiveAnalyticsEngine:
def __init__(self, db_connection):
self.db = db_connection
self.bkt_params = BKTParameters()
def generate_analysis(self, student_id: int, assessment_type: str = 'main') -> Dict:
"""Generate comprehensive prescriptive analysis"""
# Fetch student da
ta
student_data = self._fetch_student_assessment_data(student_id, assessment_type)
# Calcula
te skill ma
stery using BKT
skill_mastery = self._calculate_skill_mastery(student_data)
# Estima
te ability using IRT
ability_estimates = self._estimate_abilities(student_data)
# Analyze error pa
tterns
error_patterns = self._analyze_error_patterns(student_data)
# Genera
te intervention plan
intervention_plan = self._generate_intervention_plan(
skill_mastery,
ability_estimates,
error_patterns
)
# Genera
te insights (not predictions)
insights = self._generate_insights(skill_mastery, ability_estimates)
# Get intervention history
intervention_history = self._get_intervention_history(student_id)
# Compile analysis
analysis = {
'studentId': student_id,
'assessmentDate': datetime.now(),
'assessmentType': assessment_type,
'readingLevel': student_data['readingLevel'],
'skillMastery': skill_mastery,
'abilityEstimates': ability_estimates,
'errorPatterns': error_patterns,
'interventionPlan': intervention_plan,
'insights': insights,
'interventionHistory': intervention_history,
'createdAt': datetime.now(),
'updatedAt': datetime.now()
}
# Save to da
taba
se
result = self.db.prescriptive_analysis.insert_one(analysis)
analysis['_id']= result.inserted_id
return analysis
def _calculate_skill_mastery(self, student_data: Dict) -> Dict:
"""Calculate skill mastery using Bayesian Knowledge Tracing"""
mastery = {}
for category, responses in student_data['responses'].items():
if not responses:
continue
# Initialize ma
stery pro
bability
p_mastery = self.bkt_params.p_init
response_history = []
# Count c
orrect answers
correct_count = 0
total_count = len(responses)
# Special h
andling f
or Ph
onologic
al Awareness
if category == "Phonological Awareness":
total_matches = sum(r.get('totalMatches', 0) for r in responses)
correct_matches = sum(r.get('correctMatches', 0) for r in responses)
if total_matches > 0:
score = round((correct_matches / total_matches) * 100)
else:
score = 0
else:
# Pro
cess ea
ch response chronologic
ally
for response in sorted(responses, key=lambda x: x['answeredAt']):
is_correct = response['isCorrect']
if is_correct:
correct_count += 1
# Upda
te ma
stery pro
bability
if is_correct:
p_correct = (p_mastery * (1- self.bkt_params.p_slip) +
(1- p_mastery) * self.bkt_params.p_guess)
p_mastery_given_obs = (p_mastery * (1- self.bkt_params.p_slip)) / p_correct
else:
p_incorrect = (p_mastery * self.bkt_params.p_slip +
(1- p_mastery) * (1- self.bkt_params.p_guess))
p_mastery_given_obs = (p_mastery * self.bkt_params.p_slip) / p_incorrect
# Apply learning
p_mastery = p_mastery_given_obs + (1- p_mastery_given_obs) * self.bkt_params.p_learn
response_history.append({
'questionId': response['questionId'],
'correct': is_correct,
'timestamp': response['answeredAt'],
'masteryAfter': p_mastery
})
score = round((correct_count / total_count) * 100) if total_count > 0else 0
mastery[category]= {
'masteryProbability': p_mastery,
'lastUpdated': datetime.now(),
'totalQuestions': total_count,
'correctAnswers': correct_count if category != "Phonological Awareness"else None,
'correctMatches': correct_matches if category == "Phonological Awareness"else None,
'totalPossibleMatches': total_matches if category == "Phonological Awareness"else None,
'score': score,
'isPassed': score >
= 75,
'responseHistory': response_history[-10:] # Keep la
st 10
}
return mastery
def _estimate_abilities(self, student_data: Dict) -> Dict:
"""Estimate student abilities using IRT"""
abilities = {}
for category, responses in student_data['responses'].items():
if not responses:
abilities[category]= 0.0
continue
# Calcula
te proportion c
orrect
if category == "Phonological Awareness":
total_matches = sum(r.get('totalMatches', 0) for r in responses)
correct_matches = sum(r.get('correctMatches', 0) for r in responses)
p = correct_matches / total_matches if total_matches > 0else 0.5
else:
correct_count = sum(1for r in responses if r['isCorrect'])
total_count = len(responses)
p = correct_count / total_count if total_count > 0else 0.5
# Convert to logit sc
ale (IRT theta
)
if p == 0:
theta = -2.0# Floor value
elif p == 1:
theta = 2.0 # Ceiling value
else:
# Logit transf
orma
tion
theta = np.log(p / (1- p))
# Bound between -3 and 3
theta = max(-3, min(3, theta))
abilities[category]= round(theta,2)
return abilities
def _analyze_error_patterns(self, student_data: Dict) -> Dict:
"""Analyze error patterns to identify specific weaknesses"""
patterns = {}
for category, responses in student_data['responses'].items():
error_analysis = {}
if category == "Alphabet Knowledge":
# Analyze vowel vs c
onsonant errors
patinig_errors = [r for r in responses if r.get('questionType')== 'patinig'and not r['isCorrect']]
katinig_errors = [r for r in responses if r.get('questionType')== 'katinig'and not r['isCorrect']]
patinig_total = len([r for r in responses if r.get('questionType')== 'patinig'])
katinig_total = len([r for r in responses if r.get('questionType')== 'katinig'])
if patinig_errors and patinig_total > 0:
error_letters = [r.get('questionValue', '') for r in patinig_errors]
error_analysis['patinig_errors']= {
'count': len(patinig_errors),
'total': patinig_total,
'percentage': round((len(patinig_errors) / patinig_total) * 100),
'specific_letters': list(set(error_letters)),
'error_type': 'visual_conf
usion'if len(set(error_letters))> 2else 'specific_letter_difficulty',
'questionIds': [r['questionId'] for r in patinig_errors]
}
if katinig_errors and katinig_total > 0:
error_letters = [r.get('questionValue', '') for r in katinig_errors]
error_analysis['katinig_errors']= {
'count': len(katinig_errors),
'total': katinig_total,
'percentage': round((len(katinig_errors) / katinig_total) * 100),
'specific_letters': list(set(error_letters)),
'error_type': 'sound_substitution'if any(l in ['B', 'P', 'D'] for l in error_letters) else 'general_difficulty',
'questionIds': [r['questionId'] for r in katinig_errors]
}
elif category == "Phonological Awareness":
incorrect_matches = [r for r in responses if not r['isCorrect']]
total_matches = len(responses)
if incorrect_matches and total_matches > 0:
avg_correct_matches = np.mean([
r.get('correctMatches', 0) / r.get('totalMatches', 1)
for r in incorrect_matches
])
error_analysis['matching_errors']= {
'count': len(incorrect_matches),
'total': total_matches,
'percentage': round((len(incorrect_matches) / total_matches) * 100),
'avg_partial_success': round(avg_correct_matches,2),
'error_type': 'sound_discrimination'if avg_correct_matches < 0.5else 'sequencing',
'questionIds': [r['questionId'] for r in incorrect_matches]
}
elif category == "Decoding":
incorrect_decoding = [r for r in responses if not r['isCorrect']]
total_decoding = len(responses)
if incorrect_decoding and total_decoding > 0:
blank_positions = [r.get('blankPosition', -1) for r in incorrect_decoding if 'blankPosition'in r]
most_error_position = max(set(blank_positions), key=blank_positions.count) if
blank_positions else -1
error_analysis['decoding_errors']= {
'count': len(incorrect_decoding),
'total': total_decoding,
'percentage': round((len(incorrect_decoding) / total_decoding) * 100),
'error_type': 'letter_sequence'if len(incorrect_decoding)> total_decoding * 0.5else 'specific_patte
'most_error_position': most_error_position,
'questionIds': [r['questionId'] for r in incorrect_decoding]
}
elif category == "Word Recognition":
incorrect_wr = [r for r in responses if not r['isCorrect']]
total_wr = len(responses)
if incorrect_wr and total_wr > 0:
sentence_errors = [r for r in incorrect_wr if 'pangungusap'in r.get('questionText', '').lower()]
rhyme_errors = [r for r in incorrect_wr if 'kasing tunog'in r.get('questionText', '').lower()]
error_analysis['word_errors']= {
'count': len(incorrect_wr),
'total': total_wr,
'percentage': round((len(incorrect_wr) / total_wr) * 100),
'sentence_completion_errors': len(sentence_errors),
'rhyming_errors': len(rhyme_errors),
'error_type': 'context_clues'if len(sentence_errors)> len(rhyme_errors) else 'phonological_awarene
'questionIds': [r['questionId'] for r in incorrect_wr]
}
elif category == "Reading Comprehension":
incorrect_rc = [r for r in responses if not r['isCorrect']]
total_rc = len(responses)
if incorrect_rc and total_rc > 0:
error_analysis['comprehension_errors']= {
'count': len(incorrect_rc),
'total': total_rc,
'percentage': round((len(incorrect_rc) / total_rc) * 100),
'error_type': 'literal_comprehension',
'questionIds': [r['questionId'] for r in incorrect_rc]
}
if error_analysis:
patterns[category]= error_analysis
return patterns
def _generate_intervention_plan(self, skill_mastery: Dict, abilities: Dict, error_patterns: Dict) -> Dict:
"""Generate personalized intervention plan based on analysis"""
# Identify c
a
tegories th
a
t need intervention (
below 75%
needs_intervention = {}
for category, data in skill_mastery.items():
if data.get('score', 0) < 75:
needs_intervention[category]= data.get('score', 0)
)
if not needs_intervention:
return {
'required': False,
'priority': [],
'specificFocus': {}
}
# S
ort by lowest sc
ore first
priority_categories = sorted(needs_intervention.keys(), key=lambda x: needs_intervention[x])
specific_focus = {}
for category in priority_categories[:2]: focus_plan = {}
# Fo
cus on top 2 priorities
if category == "Alphabet Knowledge":
errors = error_patterns.get(category, {})
# Determine f
o
cus ba
sed on error pa
tterns
patinig_error_rate = errors.get('patinig_errors', {}).get('percentage', 0)
katinig_error_rate = errors.get('katinig_errors', {}).get('percentage', 0)
if patinig_error_rate > katinig_error_rate:
focus_plan.update({
'focus': 'patinig_recognition',
'targetLetters': errors['patinig_errors']['specific_letters'][:3],
'recommendedActivities': ['visual_discrimination', 'letter_tracing', 'letter_sound_association'],
'questionDistribution': {'patinig': 70, 'katinig': 30}
})
else:
focus_plan.update({
'focus': 'katinig_recognition',
'targetLetters': errors.get('katinig_errors', {}).get('specific_letters', [])[:3],
'recommendedActivities': ['consonant_practice', 'letter_formation', 'sound_production'],
'questionDistribution': {'katinig': 70, 'patinig': 30}
})
elif category == "Phonological Awareness":
error_type = error_patterns.get(category, {}).get('matching_errors', {}).get('error_type', 'sound_discrimin
focus_plan.update({
'focus': 'sound_matching'if error_type == 'sound_discrimination'else 'sequence_practice',
'targetSounds': ['B-P', 'M-N', 'D-T'],
'recommendedActivities': ['sound_discrimination', 'minimal_pairs', 'rhyming_practice'],
'questionDistribution': {'matching': 100}
})
elif category == "Decoding":
most_error_pos = error_patterns.get(category, {}).get('decoding_errors', {}).get('most_error_position', -1
focus_plan.update({
'focus': 'initial_sounds'if most_error_pos == 0else 'medial_sounds'if most_error_pos == 1else 'endin
'targetPatterns': ['CVC', 'CVCV'],
'recommendedActivities': ['syllable_blending', 'word_building', 'pattern_recognition'],
'questionDistribution': {'drag_drop': 100}
})
elif category == "Word Recognition":
error_type = error_patterns.get(category, {}).get('word_errors', {}).get('error_type', 'context_clues')
focus_plan.update({
'focus': 'sentence_context'if error_type == 'context_clues'else 'rhyming_words',
'recommendedActivities': ['context_clues', 'sight_word_practice', 'word_families'],
'questionDistribution': {'sentence_completion': 60, 'rhyming': 40}
})
elif category == "Reading Comprehension":
focus_plan.update({
'focus': 'literal_comprehension',
'targetSkills': ['main_idea', 'sequencing', 'detail_recall'],
'recommendedActivities': ['guided_reading', 'question_answering', 'story_retelling'],
'questionDistribution': {'passages': 100}
})
specific_focus[category]=
return {
'required': True,
'priority': priority_categories[:2],
'specificFocus': specific_focus
focus_plan
}
def _generate_insights(self, skill_mastery: Dict, abilities: Dict) -> Dict:
"""Generate insights and recommendations (no time predictions)"""
strengths = []
weaknesses = []
passed_categories = 0
failed_categories = 0
total_score = 0
total_weight = 0
# Get student's reading level f
or weighted sc
oring
reading_level = self._get_student_reading_level(skill_mastery)
weights = CATEGO
RY_WEIGHTS.get(reading_level, CATEGO
RY_WEIGHTS["At Grade Level"])
for category, data in skill_mastery.items():
score = data.get('score', 0)
weight =
weights.get(category, 0)
if weight > 0:
total_score += score * weight
total_weight +=
weight
if score >
= 85:
strengths.append(category)
if score >
= 75:
passed_categories += 1
else:
failed_categories += 1
weaknesses.append(f"{category} - {score}%")
# Calcula
te overall weighted sc
ore
overall_score = round(total_score / total_weight) if total_weight > 0else 0
# Determine overall readiness
if failed_categories == 0:
overall_readiness = "Ready for next level"
recommended_action = "continue_regular_curriculum"
elif failed_categories <= 2:
overall_readiness = "Needs targeted intervention"
recommended_action = "immediate_intervention"
else:
overall_readiness = "Requires comprehensive support"
recommended_action = "intensive_intervention"
return {
'strengths': strengths,
'weaknesses': weaknesses,
'overallReadiness': overall_readiness,
'recommendedAction': recommended_action,
'passedCategories': passed_categories,
'failedCategories': failed_categories,
'overallScore': overall_score
}
def _get_intervention_history(self, student_id: int) ->
List[Dict]:
"""Get history of interventions for this student"""
intervention_results = list(self.db.intervention_results.find(
{'studentId': student_id},
{'category': 1, 'score': 1, 'isPassed': 1, 'completedAt': 1, '_id': 1}
).sort('completedAt', -1))
history = []
for result in intervention_results:
history.append({
'category': result['category'],
'interventionId': result['_id'],
'dateTaken': result.get('completedAt'),
'passed': result.get('isPassed', False),
'score': result.get('score', 0)
})
return history
def _get_student_reading_level(self, skill_mastery: Dict) -> str:
"""Determine reading level from assessment"""
# This would typic
ally c
ome from the student rec
ord
# For now, inferring from available c
a
tegories
if "Reading Comprehension"in skill_mastery:
return "At Grade Level"
elif "Word Recognition"in skill_mastery:
return "Transitioning"
elif "Decoding"in skill_mastery:
return "Developing"
elif "Phonological Awareness"in skill_mastery:
return "High Emerging"
else:
return "Low Emerging"
def _fetch_student_assessment_data(self, student_id: int, assessment_type: str) -> Dict:
"""Fetch and organize student assessment data"""
# Get student reading level
student = self.db.users.find_one({'studentId': student_id})
reading_level = student.get('readingLevel', 'Low Emerging')
# Get responses based on assessment type
if assessment_type == 'main':
responses = list(self.db.student_responses.find({'studentId': student_id}))
else: # intervention
responses = list(self.db.intervention_responses.find({'studentId': student_id}))
# Organize by category
organized_responses = {}
for response in responses:
category = response['category']
if category not in organized_responses:
organized_responses[category]= []
organized_responses[category].append(response)
return {
'studentId': student_id,
'readingLevel': reading_level,
'responses': organized_responses
}
class InterventionGenerator:
"""Generate adaptive interventions based on prescriptive analysis"""
def __init__(self, db_connection):
self.db = db_connection
def generate_intervention(self, analysis_id: str, category: str) -> Dict:
"""Generate one-time intervention assessment based on analysis"""
# Fetch prescriptive analysis
analysis = self.db.prescriptive_analysis.find_one({'_id': analysis_id})
if not analysis:
raise ValueError(f"Analysis {analysis_id} not found")
# Check if intervention already a
ttempted
existing_intervention = analysis.get('interventionHistory', [])
if any(h['category']== category for h in existing_intervention):
raise ValueError(f"Intervention already attempted for {category}. Face-to-face support recommended.")
# Get student inf
o
student_id = analysis['studentId']
reading_level = analysis['readingLevel']
# Get error pa
tterns and f
o
cus area
s
error_patterns = analysis['errorPatterns'].get(category, {})
focus_plan = analysis['interventionPlan']['specificFocus'].get(category, {})
# Genera
te exa
ctly 10 questions ba
sed on f
o
questions = self._generate_adaptive_questions(
category,
reading_level,
error_patterns,
focus_plan,
analysis['abilityEstimates'].get(category, 0)
cus area
s
)
# Crea
te intervention a
ssessment
intervention = {
'studentId': student_id,
'prescriptiveAnalysisId': analysis_id,
'category': category,
'readingLevel': reading_level,
'passThreshold': 75,
'questionSelectionStrategy': {
'method': 'error_focused'if error_patterns else 'general_practice',
'targetDifficulty': 0.7,
'focusAreas': focus_plan.get('questionDistribution', {'general': 100}),
'totalQuestions': 10
},
'questions': questions,
'interventionParameters': {
'fixedQuestions': 10,
'allowSkip': False,
'showProgress': True,
'immediateFeeback': False
},
'status': 'active',
'createdBy': analysis.get('createdBy'),
'createdAt': datetime.now(),
'updatedAt': datetime.now()
}
# Save to da
taba
se
result = self.db.intervention_assessment.insert_one(intervention)
intervention['_id']= result.inserted_id
return intervention
def _generate_adaptive_questions(self, category: str, reading_level: str,
error_patterns: Dict, focus_plan: Dict,
ability_estimate: float) ->
List[Dict]:
"""Generate exactly 10 questions adapted to student's needs"""
questions = []
if category == "Alphabet Knowledge":
questions = self._generate_alphabet_questions(
error_patterns,
focus_plan,
ability_estimate
)
elif category == "Phonological Awareness":
questions = self._generate_phonological_questions(
error_patterns,
focus_plan,
ability_estimate
)
elif category == "Decoding":
questions = self._generate_decoding_questions(
error_patterns,
focus_plan,
ability_estimate
)
elif category == "Word Recognition":
questions = self._generate_word_recognition_questions(
error_patterns,
focus_plan,
ability_estimate
)
elif category == "Reading Comprehension":
questions = self._generate_comprehension_questions(
reading_level,
focus_plan,
ability_estimate
)
return questions[:10] # Ensure exa
ctly 10 questions
def _generate_alphabet_questions(self, error_patterns: Dict, focus_plan: Dict, ability: float) ->
"""Generate alphabet knowledge questions"""
questions = []
List[Dict]:
# Get distribution
distribution =
focus_plan.get('questionDistribution', {'patinig': 50, new PrescriptiveAnalyticsService();

Express Router Implementation
Create backend/routes/prescriptiveAnalytics.js :
javascript
const express = require('express');
const router = express.Router();
const { O
bjectId }= require('mongodb');
const PrescriptiveAnalyticsController = require('../controllers/prescriptiveAnalyticsController');
// Genera
te prescriptive analysis
router.post('/prescriptive-analysis', async (req, res)=
> {
try {
const { studentId, assessmentType }= req.body;
const result = await PrescriptiveAnalyticsController.generateAnalysis(
studentId,
assessmentType
);
res.json(result);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
// Get analysis by ID or la
test f
or student
router.get('/prescriptive-analysis/:id', async (req, res)=
> {
try {
const { id }= req.params;
const result = await PrescriptiveAnalyticsController.getAnalysis(id);
res.json(result);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
// Get la
test analysis f
or student
router.get('/prescriptive-analysis/student/:studentId/latest', async (req, res)=
> {
try {
const { studentId }= req.params;
const result = await PrescriptiveAnalyticsController.getLatestAnalysis(
parseInt(studentId)
);
res.json(result);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
// Genera
te intervention
router.post('/intervention/generate', async (req, res)=
> {
try {
const { analysisId, category }= req.body;
const result = await PrescriptiveAnalyticsController.generateIntervention(
analysisId,
category
);
res.json(result);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
// Upda
te analysis after intervention
router.post('/prescriptive-analysis/update', async (req, res)=
> {
try {
const { studentId, interventionResultsId }= req.body;
const result = await PrescriptiveAnalyticsController.updateAfterIntervention(
studentId,
interventionResultsId
);
res.json(result);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
// Get learning progression
router.get('/prescriptive-analysis/progression/:studentId', async (req, res)=
> {
try {
const { studentId }= req.params;
const { category }= req.query;
const result = await PrescriptiveAnalyticsController.getLearningProgression(
parseInt(studentId),
category
);
res.json(result);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
// Get intervention effectiveness report
router.get('/prescriptive-analysis/effectiveness/:studentId', async (req, res)=
> {
try {
const { studentId }= req.params;
const result = await PrescriptiveAnalyticsController.getEffectivenessReport(
parseInt(studentId)
);
res.json(result);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
module.exports= router;


7.2 Controller Implementation
Create backend/controllers/prescriptiveAnalyticsController.js :
javascript
const { PrescriptiveAnalyticsEngine, InterventionGenerator, ProgressTracker }= require('../services/prescriptiveAn
const db = require('../config/database');
class PrescriptiveAnalyticsController {
constructor() {
this.analyticsEngine= new PrescriptiveAnalyticsEngine(db);
this.interventionGenerator = new InterventionGenerator(db);
this.progressTracker = new ProgressTracker(db, this.analyticsEngine);
async generateAnalysis(studentId, assessmentType) {
return await this.analyticsEngine.generateAnalysis(studentId, assessmentType);
async getAnalysis(analysisId) {
return await db.prescriptive_analysis.findOne({ _id: O
bjectId(analysisId) });
}
}
}
async getLatestAnalysis(studentId) {
return await db.prescriptive_analysis
.findOne({ studentId })
.sort({ createdAt: -1});
async generateIntervention(analysisId, category) {
return await this.interventionGenerator.generateIntervention(analysisId, category);
async updateAfterIntervention(studentId, interventionResultsId) {
return await this.progressTracker.updateAfterIntervention(studentId, interventionResultsId);
async getLearningProgression(studentId, category) {
return await this.progressTracker.getLearningProgression(studentId, category);
}
}
}
}
async getEffectivenessReport(studentId) {
// Genera
te c
omprehensive effectiveness report
const analyses = await db.prescriptive_analysis
.find({ studentId })
.sort({ createdAt: 1})
.toArray();
const interventions = await db.intervention_results
.find({ studentId })
.toArray();
return {
totalInterventions: interventions.length,
successf
ulInterventions: interventions.filter(i=
> i.isPassed).length,
averageImprovement: this._calculateAverageImprovement(analyses),
categoryBreakdown: this._getCategoryBreakdown(analyses, interventions),
recommendedNextSteps: this._getRecommendedNextSteps(analyses[analyses.length - 1])
};
}
_calculateAverageImprovement(analyses) {
if (analyses.length < 2) return 0;
const first = analyses[0];
const last = analyses[analyses.length - 1];
let totalImprovement = 0;
let categories = 0;
for (const category in first.skillMastery) {
if (last.skillMastery[category]) {
const improvement = last.skillMastery[category].masteryProbability -
first.skillMastery[category].masteryProbability;
totalImprovement += improvement;
categories++;
}
}
return categories > 0? (totalImprovement / categories * 100).toFixed(1) : 0;
}
_getCategoryBreakdown(analyses, interventions) {
const breakdown = {};
const categories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding',
'Word Recognition', 'Reading Comprehension'];
for (const category of categories) {
const categoryInterventions = interventions.filter(i=
> i.category === category);
const latestAnalysis = analyses[analyses.length - 1];
breakdown[category]= {
currentMastery: latestAnalysis?.skillMastery?.[category]?.masteryProbability || 0,
interventionCount: categoryInterventions.length,
successRate: categoryInterventions.length> 0
? (categoryInterventions.filter(i=
> i.isPassed).length / categoryInterventions.length * 100).toFixed(1)
: 0,
needsIntervention: (latestAnalysis?.skillMastery?.[category]?.masteryProbability || 0) < 0.75
};
}
return breakdown;
}
_getRecommendedNextSteps(latestAnalysis) {
if (!latestAnalysis) return [];
const recommendations = [];
for (const [category, data] of O
bject.entries(latestAnalysis.skillMastery)) {
if (data.masteryProbability < 0.75) {
recommendations.push({
category,
priority: data.masteryProbability < 0.5? 'high': 'medium',
action: `Continue intervention in ${category}`,
estimatedSessions: Math.ceil((0.75- data.masteryProbability) / 0.05)
});
}
return recommendations.sort((a, b)=
>
a.priority === 'high'&& b.priority !== 'high'? -1: 1
}
);
}
}
module.exports= new PrescriptiveAnalyticsController();



8. Testing and Validation
8.1 Unit Tests
Create backend/tests/prescriptiveAnalytics.test.js :
javascript
const { expect }= require('chai');
const sinon = require('sinon');
const { PrescriptiveAnalyticsEngine }= require('../services/prescriptiveAnalyticsEngine');
describe('Prescriptive Analytics Engine', ()=
> {
let analyticsEngine;
let mockDb;
beforeEach(()=
> {
mockDb = {
users: { findOne: sinon.stub() },
student_responses: { find: sinon.stub() },
prescriptive_analysis: { insertOne: sinon.stub() }
};
analyticsEngine = new PrescriptiveAnalyticsEngine(mockDb);
});
describe('BKT Calculations', ()=
> {
it('should update mastery probability correctly for correct answer', ()=
> {
const result = analyticsEngine._updateMasteryProbability(0.5, true);
expect(result).to.be.above(0.5);
expect(result).to.be.below(1.0);
});
it('should update mastery probability correctly for incorrect answer', ()=
> {
const result = analyticsEngine._updateMasteryProbability(0.5,false);
expect(result).to.be.above(0.0);
expect(result).to.be.below(0.5);
});
});
describe('IRT Calculations', ()=
> {
it('should calculate probability correct with appropriate bounds', ()=
> {
const prob = analyticsEngine._probabilityCorrect(0, 0, 1.0);
expect(prob).to.be.closeTo(0.5, 0.01);
});
it('should increase probability for higher ability', ()=
> {
const prob
Low
= analyticsEngine._probabilityCorrect(-1, 0, 1.0);
const probHigh = analyticsEngine._probabilityCorrect(1, 0, 1.0);
expect(probHigh).to.be.above(prob
Low);
});
});
describe('Error Pattern Analysis', ()=
> {
it('should identify
vowel vs consonant errors correctly', ()=
> {
const responses = [
{ questionType: 'patinig', isCorrect: false, questionValue: 'E'},
{ questionType: 'patinig', isCorrect: false, questionValue: 'O'},
{ questionType: 'katinig', isCorrect: true, questionValue: 'B'}
];
const patterns = analyticsEngine._analyzeErrorPatterns({
'Alphabet Knowledge': responses
});
expect(patterns['Alphabet Knowledge']).to.have.property('patinig_errors');
expect(patterns['Alphabet Knowledge'].patinig_errors.count).to.equal(2);
expect(patterns['Alphabet Knowledge'].patinig_errors.specific_letters).to.include('E', 'O');
});
});
describe('Intervention Planning', ()=
> {
it('should prioritize categories with lowest mastery', ()=
> {
const skillMastery = {
'Alphabet Knowledge': { masteryProbability: 0.8},
'Phonological Awareness': { masteryProbability: 0.3},
'Decoding': { masteryProbability: 0.6}
};
);
const plan = analyticsEngine._generateInterventionPlan(
skillMastery, {}, {}
expect(plan.priority[0]).to.equal('Phonological Awareness');
expect(plan.priority[1]).to.equal('Decoding');
});
it('should estimate appropriate session counts', ()=
> {
const sessions = analyticsEngine._estimateSessionsNeeded(0.5);
expect(sessions).to.equal(4);
});
});
});
8.2 Integration Tests
Create backend/tests/integration/prescriptiveAnalytics.integration.test.js :
javascript
const request = require('supertest');
const app = require('../../server');
const { expect }= require('chai');
describe('Prescriptive Analytics API Integration', ()=
> {
let studentId = 202210222;
let analysisId;
it('should generate prescriptive analysis after assessment', async ()=
> {
const res = await request(app)
.post('/api/prescriptive-analysis')
.send({
studentId,
assessmentType: 'main'
})
.expect(200);
expect(res.body).to.have.property('_id');
expect(res.body).to.have.property('skillMastery');
expect(res.body).to.have.property('interventionPlan');
analysisId = res.body._id;
});
it('should generate intervention based on analysis', async ()=
> {
const res = await request(app)
.post('/api/intervention/generate')
.send({
analysisId,
category: 'Alphabet Knowledge'
})
.expect(200);
expect(res.body).to.have.property('questions');
expect(res.body.questions).to.have.lengthOf.at.least(5);
expect(res.body).to.have.property('adaptiveParameters');
});
it('should track learning progression', async ()=
> {
const res = await request(app)
.get(`/api/prescriptive-analysis/progression/${studentId}`)
.expect(200);
expect(res.body).to.be.an('array');
if (res.body.length> 0) {
expect(res.body[0]).to.have.property('date');
expect(res.body[0]).to.have.any.keys(
'Alphabet Knowledge',
'Phonological Awareness'
);
}
});
});

8.4 Data Validation
Create backend/utils/dataValidation.js :
javascript
const Joi= require('joi');
const schemas = {
prescriptiveAnalysis: Joi.object({
studentId: Joi.number().integer().required(),
assessmentDate: Joi.date().required(),
readingLevel: Joi.string().
valid(
'Low Emerging', 'High Emerging', 'Developing',
'Transitioning', 'At Grade Level'
).required(),
skillMastery: Joi.object().pattern(
Joi.string(),
Joi.object({
masteryProbability: Joi.number().min(0).max(1).required(),
lastUpdated: Joi.date().required(),
responseHistory: Joi.array()
})
).required(),
abilityEstimates: Joi.object().pattern(
Joi.string(),
Joi.number().min(-3).max(3)
).required(),
errorPatterns: Joi.object().required(),
interventionPlan: Joi.object().required(),
predictions: Joi.object().required()
}),
interventionRequest: Joi.object({
analysisId: Joi.string().required(),
category: Joi.string().
valid(
'Alphabet Knowledge', 'Phonological Awareness',
'Decoding', 'Word Recognition', 'Reading Comprehension'
).required()
})
};
module.exports= {
validate: (schema, data)=
> {
const result = schemas[schema].
validate(data);
if (result.error) {
throw new Error(`Validation error: ${result.error.message}`);
}
return result.
value;
}
};


References
1. Bayesian Knowledge Tracing: Corbett, A. T., & Anderson, J. R. (1994). Knowledge tracing:
Modeling the acquisition of procedural knowledge. User modeling and user-adapted interaction,
4(4), 253-278.
2. Item Response Theory: Baker, F. B., & Kim, S. H. (2017). The basics of item response theory using
R. Springer.
3. Adaptive Learning Systems: Klinkenberg, S., Straatemeier, M., & van der Maas, H. L. (2011).
Computer adaptive practice of
Maths ability using a new item response model for on the fly ability
and difficulty estimation. Computers & Education, 57(2), 1813-1824.
4. Response to Intervention: Fuchs, D., & Fuchs, L. S. (2006). Introduction to response to
intervention: What, why, and how
valid is it? Reading research quarterly, 41(1), 93-99.
5. Educational Data Mining: Romero, C., & Ventura, S. (2020). Educational data mining and learning
analytics: An updated survey. Wiley Interdisciplinary Reviews: Data Mining and Knowledge
Discovery, 10(3), e1355.






Sample record of main_assessment 

{
  "_id": {
    "$oid": "68bcbfaae32d5718169f6bc6"
  },
  "readingLevel": "Low Emerging",
  "category": "Alphabet Knowledge",
  "questionType": "multiple_choice",
  "questions": [
    {
      "questionText": "Anong ang katumbas na maliit na letra?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/alphabet-knowledge/1757199268667-big-E.png",
      "questionValue": "E",
      "questionId": "AK_001",
      "choiceOptions": [
        {
          "optionId": "1",
          "optionText": "e",
          "isCorrect": true
        },
        {
          "optionId": "2",
          "optionText": "a",
          "isCorrect": false
        },
        {
          "optionId": "3",
          "optionText": "c",
          "isCorrect": false
        }
      ]
    },
    {
      "questionText": "Anong katumbas na maliit na letra?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/alphabet-knowledge/1757199289161-big-O.png",
      "questionValue": "O",
      "questionId": "AK_002",
      "choiceOptions": [
        {
          "optionId": "1",
          "optionText": "u",
          "isCorrect": false
        },
        {
          "optionId": "2",
          "optionText": "o",
          "isCorrect": true
        },
        {
          "optionId": "3",
          "optionText": "j",
          "isCorrect": false
        }
      ]
    },

    [{
  "_id": {
    "$oid": "68bb9e66e4c854c11d631622"
  },
  "readingLevel": "High Emerging",
  "category": "Phonological Awareness",
  "questionType": "matching",
  "questions": [
    {
      "questionText": "Pakinggan ang audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "PA_001",
      "questionSet": [
        {
          "audioTexts": [
            "H",
            "T",
            "N"
          ],
          "matchingOptions": [
            "Hh",
            "Tt",
            "Nn"
          ],
          "correctPairs": [
            {
              "H": "Hh"
            },
            {
              "T": "Tt"
            },
            {
              "N": "Nn"
            }
          ]
        }
      ]
    },
    {
      "questionText": "Pakinggan ang audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "PA_002",
      "questionSet": [
        {
          "audioTexts": [
            "L",
            "P"
          ],
          "matchingOptions": [
            "Ll",
            "Pp"
          ],
          "correctPairs": [
            {
              "L": "Ll"
            },
            {
              "P": "Pp"
            }
          ]
        }
      ]
    },


    {
  "_id": {
    "$oid": "68bba9b3e4c854c11d63162f"
  },
  "readingLevel": "Transitioning",
  "category": "Word Recognition",
  "questionType": "fill_blank",
  "questions": [
    {
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_001",
      "displayWord": "Naglalaro siya ng _____ sa parke",
      "blankOptions": [
        "Papel",
        "Kutsara",
        "Bola",
        "Damit"
      ],
      "correctAnswer": [
        "bola"
      ]
    },
    {
      "questionText": "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
      "questionImage": null,
      "questionValue": null,
      "questionId": "WR_002",
      "displayWord": "Malaki ang _____ sa zoo.",
      "blankOptions": [
        "Elepante",
        "Lamesa",
        "Nanay",
        "Manok"
      ],
      "correctAnswer": [
        "Elepante"
      ]
    },

     {
      "questionType": "fill_blank",
      "questionText": "Anong kasing tunog ng salitang nakikita?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/word-recognition/1757217628205-SUMBRERO.png",
      "questionValue": null,
      "questionId": "WR_009",
      "displayWord": "SUMBRERO",
      "blankOptions": [
        "LIB",
        "RO",
        "ME",
        "SA"
      ],
      "correctAnswer": [
        "LIB",
        "RO"
      ]
    },


    Decoding main assessment 

    {
  "_id": {
    "$oid": "68bcf37ce32d5718169f6ea0"
  },
  "readingLevel": "Developing",
  "category": "Decoding",
  "questionType": "drag_drop",
  "questions": [
    {
      "questionText": "Tukuyin ang nasa larawan?",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757213559198-YELO.png",
      "questionValue": null,
      "questionId": "DC_001",
      "displaySequence": null,
      "blankPosition": null,
      "dragElements": [
        "Y",
        "E",
        "L",
        "O",
        "A",
        "E"
      ],
      "correctSequence": [
        "Y",
        "E",
        "L",
        "O"
      ]
    },

     {
      "questionType": "drag_drop",
      "questionText": "Buoin ang salita",
      "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/decoding/1757214590096-TINAPAY.png",
      "questionValue": null,
      "questionId": "DC_009",
      "displaySequence": [
        "_",
        "i",
        "n",
        "a",
        "p",
        "a",
        "y"
      ],
      "dragElements": [
        "T",
        "M",
        "K",
        "L"
      ],
      "correctSequence": [
        "T"
      ],
      "blankPosition": 0
    },


    {
  "_id": {
    "$oid": "68be35c466224f27838e0a42"
  },
  "readingLevel": "At Grade Level",
  "category": "Reading Comprehension",
  "questionType": "text_input",
  "isActive": true,
  "status": "active",
  "questions": [
    {
      "questionId": "RC_001",
      "storyTitle": "Si Juan at ang Aso",
      "passages": [
        {
          "pageNumber": 1,
          "pageText": "Tuwing umaga, si Juan at ang kaniyang aso na si Max ay naglalaro sa Parke.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757295881174-Si-Juan-at-ang-Aso.png"
        },
        {
          "pageNumber": 2,
          "pageText": "Paboritong habulin ni Max ang bola na inihahagis ni Juan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757295883337-Si-Juan-at-ang-Aso.png"
        },
        {
          "pageNumber": 3,
          "pageText": "Silang dalawa ay masayang uuwi ng tahanan.",
          "pageImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/main-assessment/reading-comprehension/1757295884374-Si-Juan-at-ang-Aso.png"
        }
      ],
      "sentenceQuestions": [
        {
          "questionText": "Sino ang may aso?",
          "correctAnswer": "Juan",
          "acceptableAnswers": [
            "juan",
            "si Juan",
            "Juan"
          ]
        },
        {
          "questionText": "Saan naglaro si Juan at Max?",
          "correctAnswer": "Parke",
          "acceptableAnswers": [
            "parke",
            "sa parke"
          ]
        },
        {
          "questionText": "Ano ang ginagawa ni Juan at Max?",
          "correctAnswer": "Naglalaro",
          "acceptableAnswers": [
            "naglalaro",
            "nag-lalaro"
          ]
        }
      ],
      "questionValue": null
    },


    student_responses table for the main_assessment part

    PASSED)
[
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60016"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "PA_001",
    "category": "Phonological Awareness",
    "response": [
      {"H": "Hh"},
      {"T": "Tt"},
      {"N": "Nn"},
      {"L": "Ll"},
      {"P": "Pp"}
    ],
    "correctMatches": 5,
    "totalMatches": 5,
    "isCorrect": true,
    "responseTime": 32.4,
    "answeredAt": {"$date": "2025-09-08T10:15:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:15:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60017"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "PA_002",
    "category": "Phonological Awareness",
    "response": [
      {"L": "Ll"},
      {"P": "Pp"},
      {"B": "Bb"}
    ],
    "correctMatches": 3,
    "totalMatches": 3,
    "isCorrect": true,
    "responseTime": 26.8,
    "answeredAt": {"$date": "2025-09-08T10:16:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:16:00.000Z"},
    "readingLevel": "High Emerging"
  }
]


 {
    "_id": {"$oid": "67000004a1b2c3d4e5f60011"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_011",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.0,
    "answeredAt": {"$date": "2025-09-08T10:07:30.000Z"},
    "createdAt": {"$date": "2025-09-08T10:07:30.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60012"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_012",
    "category": "Alphabet Knowledge",
    "response": ["2"],
    "isCorrect": true,
    "responseTime": 4.3,
    "answeredAt": {"$date": "2025-09-08T10:07:45.000Z"},
    "createdAt": {"$date": "2025-09-08T10:07:45.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60013"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_013",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.8,
    "answeredAt": {"$date": "2025-09-08T10:08:00.000Z"},
    "createdAt": {"$date": "2025-09-08T10:08:00.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60014"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_014",
    "category": "Alphabet Knowledge",
    "response": ["1"],
    "isCorrect": true,
    "responseTime": 3.5,
    "answeredAt": {"$date": "2025-09-08T10:08:15.000Z"},
    "createdAt": {"$date": "2025-09-08T10:08:15.000Z"},
    "readingLevel": "High Emerging"
  },
  {
    "_id": {"$oid": "67000004a1b2c3d4e5f60015"},
    "studentId": 202533333,
    "categoryId": {"$oid": "67000003a1b2c3d4e5f60001"},
    "questionId": "AK_015",
    "category": "Alphabet Knowledge",
    "response": ["3"],
    "isCorrect": false,
    "responseTime": 5.8,
    "answeredAt": {"$date": "2025-09-08T10:08:30.000Z"},
    "createdAt": {"$date": "2025-09-08T10:08:30.000Z"},
    "readingLevel": "High Emerging"
  }
]

intervention_responses in case they have the intervention 

[{
  "_id": {
    "$oid": "68b1b123ba86bff3eee1ae01"
  },
  "studentId": 202511111,
  "interventionResultsId": {
    "$oid": "68b1a123ba86bff3eee1ad01"
  },
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb900"
  },
  "categoryId": {
    "$oid": "683e948a9b13d43b098eb801"
  },
  "questionId": "q_ak_intervention_001",
  "category": "Alphabet Knowledge",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 8.5,
  "answeredAt": {
    "$date": "2025-06-11T15:25:12.123Z"
  },
  "createdAt": {
    "$date": "2025-06-11T15:25:12.123Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68b1b124ba86bff3eee1ae02"
  },
  "studentId": 202511111,
  "interventionResultsId": {
    "$oid": "68b1a123ba86bff3eee1ad01"
  },
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb900"
  },
  "categoryId": {
    "$oid": "683e948a9b13d43b098eb801"
  },
  "questionId": "q_ak_intervention_002",
  "category": "Alphabet Knowledge",
  "response": [
    "1"
  ],
  "isCorrect": true,
  "responseTime": 6.8,
  "answeredAt": {
    "$date": "2025-06-11T15:25:19.200Z"
  },
  "createdAt": {
    "$date": "2025-06-11T15:25:19.200Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68b1b125ba86bff3eee1ae03"
  },
  "studentId": 202511111,
  "interventionResultsId": {
    "$oid": "68b1a124ba86bff3eee1ad02"
  },
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb910"
  },
  "categoryId": {
    "$oid": "683e948a9b13d43b098eb801"
  },
  "questionId": "q_pa_intervention_001",
  "category": "Phonological Awareness",
  "response": [
    {
      "audio": "B",
      "selectedMatch": "Bb"
    },
    {
      "audio": "D",
      "selectedMatch": "Dd"
    },
    {
      "audio": "M",
      "selectedMatch": "Mm"
    }
  ],
  "correctMatches": 3,
  "totalMatches": 3,
  "isCorrect": true,
  "responseTime": 35.4,
  "answeredAt": {
    "$date": "2025-06-12T14:15:45.500Z"
  },
  "createdAt": {
    "$date": "2025-06-12T14:15:45.500Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68b1b126ba86bff3eee1ae04"
  },
  "studentId": 202511111,
  "interventionResultsId": {
    "$oid": "68b1a124ba86bff3eee1ad02"
  },
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb910"
  },
  "categoryId": {
    "$oid": "683e948a9b13d43b098eb801"
  },
  "questionId": "q_pa_intervention_002",
  "category": "Phonological Awareness",
  "response": [
    {
      "audio": "BATA",
      "selectedMatch": "BATA"
    },
    {
      "audio": "MESA",
      "selectedMatch": "MESA"
    },
    {
      "audio": "LAPIS",
      "selectedMatch": "Libro"
    }
  ],
  "correctMatches": 2,
  "totalMatches": 3,
  "isCorrect": false,
  "responseTime": 42.7,
  "answeredAt": {
    "$date": "2025-06-12T14:16:28.200Z"
  },
  "createdAt": {
    "$date": "2025-06-12T14:16:28.200Z"
  },
  "readingLevel": "High Emerging"
},
{
  "_id": {
    "$oid": "68b1b127ba86bff3eee1ae05"
  },
  "studentId": 2025121,
  "interventionResultsId": {
    "$oid": "68b1a789ba86bff3eee1ad03"
  },
  "interventionAssessmentId": {
    "$oid": "684f948a9b13d43b098eb950"
  },
  "categoryId": {
    "$oid": "684e948a9b13d43b098eb850"
  },
  "questionId": "q_dc_intervention_001",
  "category": "Decoding",
  "response": [
    "Y",
    "E",
    "L",
    "O"
  ],
  "isCorrect": true,
  "responseTime": 28.3,
  "answeredAt": {
    "$date": "2025-08-19T13:22:15.400Z"
  },
  "createdAt": {
    "$date": "2025-08-19T13:22:15.400Z"
  },
  "readingLevel": "Developing"
},
{
  "_id": {
    "$oid": "68b1b128ba86bff3eee1ae06"
  },
  "studentId": 2025121,
  "interventionResultsId": {
    "$oid": "68b1a789ba86bff3eee1ad03"
  },
  "interventionAssessmentId": {
    "$oid": "684f948a9b13d43b098eb950"
  },
  "categoryId": {
    "$oid": "684e948a9b13d43b098eb850"
  },
  "questionId": "q_dc_intervention_002",
  "category": "Decoding",
  "response": [
    "A"
  ],
  "isCorrect": false,
  "responseTime": 35.8,
  "answeredAt": {
    "$date": "2025-08-19T13:22:51.200Z"
  },
  "createdAt": {
    "$date": "2025-08-19T13:22:51.200Z"
  },
  "readingLevel": "Developing"
},
{
  "_id": {
    "$oid": "68b1b129ba86bff3eee1ae07"
  },
  "studentId": 202522233,
  "interventionResultsId": {
    "$oid": "68b1b789ba86bff3eee1ad04"
  },
  "interventionAssessmentId": {
    "$oid": "685f948a9b13d43b098eb970"
  },
  "categoryId": {
    "$oid": "685e948a9b13d43b098eb870"
  },
  "questionId": "q_wr_intervention_001",
  "category": "Word Recognition",
  "response": [
    "BOLA"
  ],
  "isCorrect": true,
  "responseTime": 15.6,
  "answeredAt": {
    "$date": "2025-08-20T09:25:30.100Z"
  },
  "createdAt": {
    "$date": "2025-08-20T09:25:30.100Z"
  },
  "readingLevel": "Transitioning"
},
{
  "_id": {
    "$oid": "68b1b12aba86bff3eee1ae08"
  },
  "studentId": 202522233,
  "interventionResultsId": {
    "$oid": "68b1b789ba86bff3eee1ad04"
  },
  "interventionAssessmentId": {
    "$oid": "685f948a9b13d43b098eb970"
  },
  "categoryId": {
    "$oid": "685e948a9b13d43b098eb870"
  },
  "questionId": "q_wr_intervention_002",
  "category": "Word Recognition",
  "response": [
    "LIB",
    "RO"
  ],
  "isCorrect": true,
  "responseTime": 22.4,
  "answeredAt": {
    "$date": "2025-08-20T09:25:52.500Z"
  },
  "createdAt": {
    "$date": "2025-08-20T09:25:52.500Z"
  },
  "readingLevel": "Transitioning"
},
{
  "_id": {
    "$oid": "68b1b12bba86bff3eee1ae09"
  },
  "studentId": 202522233,
  "interventionResultsId": {
    "$oid": "68b1b889ba86bff3eee1ad05"
  },
  "interventionAssessmentId": {
    "$oid": "686f948a9b13d43b098eb990"
  },
  "categoryId": {
    "$oid": "686e948a9b13d43b098eb890"
  },
  "questionId": "q_rc_intervention_001",
  "category": "Reading Comprehension",
  "response": [
    "Juan"
  ],
  "isCorrect": true,
  "responseTime": 38.7,
  "answeredAt": {
    "$date": "2025-08-20T10:35:15.200Z"
  },
  "createdAt": {
    "$date": "2025-08-20T10:35:15.200Z"
  },
  "readingLevel": "At Grade Level"
},
{
  "_id": {
    "$oid": "68b1b12cba86bff3eee1ae10"
  },
  "studentId": 202522233,
  "interventionResultsId": {
    "$oid": "68b1b889ba86bff3eee1ad05"
  },
  "interventionAssessmentId": {
    "$oid": "686f948a9b13d43b098eb990"
  },
  "categoryId": {
    "$oid": "686e948a9b13d43b098eb890"
  },
  "questionId": "q_rc_intervention_002",
  "category": "Reading Comprehension",
  "response": [
    "Sa tabi ng ilog"
  ],
  "isCorrect": true,
  "responseTime": 45.2,
  "answeredAt": {
    "$date": "2025-08-20T10:36:00.400Z"
  },
  "createdAt": {
    "$date": "2025-08-20T10:36:00.400Z"
  },
  "readingLevel": "At Grade Level"
}]

intervention_results TABLE

[{
  "_id": {
    "$oid": "68b1a123ba86bff3eee1ad01"
  },
  "studentId": 202511111,
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb900"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 2,
  "score": 67,
  "isPassed": false,
  "isCompleted": true,
  "lastQuestionAnswered": "q_ak_intervention_003",
  "category": "Alphabet Knowledge",
  "readingLevel": "High Emerging",
  "startedAt": {
    "$date": "2025-06-11T15:20:00.000Z"
  },
  "completedAt": {
    "$date": "2025-06-11T15:25:30.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1a124ba86bff3eee1ad02"
  },
  "studentId": 202511111,
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb910"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 2,
  "score": 67,
  "isPassed": false,
  "isCompleted": true,
  "lastQuestionAnswered": "q_pa_intervention_003",
  "category": "Phonological Awareness",
  "readingLevel": "High Emerging",
  "startedAt": {
    "$date": "2025-06-12T14:10:00.000Z"
  },
  "completedAt": {
    "$date": "2025-06-12T14:17:00.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1a789ba86bff3eee1ad03"
  },
  "studentId": 2025121,
  "interventionAssessmentId": {
    "$oid": "684f948a9b13d43b098eb950"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 2,
  "score": 67,
  "isPassed": false,
  "isCompleted": true,
  "lastQuestionAnswered": "q_dc_intervention_003",
  "category": "Decoding",
  "readingLevel": "Developing",
  "startedAt": {
    "$date": "2025-08-19T13:20:00.000Z"
  },
  "completedAt": {
    "$date": "2025-08-19T13:25:00.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1b789ba86bff3eee1ad04"
  },
  "studentId": 202522233,
  "interventionAssessmentId": {
    "$oid": "685f948a9b13d43b098eb970"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 3,
  "score": 100,
  "isPassed": true,
  "isCompleted": true,
  "lastQuestionAnswered": "q_wr_intervention_003",
  "category": "Word Recognition",
  "readingLevel": "Transitioning",
  "startedAt": {
    "$date": "2025-08-20T09:20:00.000Z"
  },
  "completedAt": {
    "$date": "2025-08-20T09:26:00.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1b889ba86bff3eee1ad05"
  },
  "studentId": 202522233,
  "interventionAssessmentId": {
    "$oid": "686f948a9b13d43b098eb990"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 3,
  "score": 100,
  "isPassed": true,
  "isCompleted": true,
  "lastQuestionAnswered": "q_rc_intervention_003",
  "category": "Reading Comprehension",
  "readingLevel": "At Grade Level",
  "startedAt": {
    "$date": "2025-08-20T10:30:00.000Z"
  },
  "completedAt": {
    "$date": "2025-08-20T10:37:00.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1a125ba86bff3eee1ad06"
  },
  "studentId": 202511111,
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb900"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 3,
  "score": 100,
  "isPassed": true,
  "isCompleted": true,
  "lastQuestionAnswered": "q_ak_intervention_003",
  "category": "Alphabet Knowledge",
  "readingLevel": "High Emerging",
  "startedAt": {
    "$date": "2025-06-13T10:15:00.000Z"
  },
  "completedAt": {
    "$date": "2025-06-13T10:22:00.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1a126ba86bff3eee1ad07"
  },
  "studentId": 202511111,
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb910"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 2,
  "score": 67,
  "isPassed": false,
  "isCompleted": true,
  "lastQuestionAnswered": "q_pa_intervention_003",
  "category": "Phonological Awareness",
  "readingLevel": "High Emerging",
  "startedAt": {
    "$date": "2025-06-14T09:30:00.000Z"
  },
  "completedAt": {
    "$date": "2025-06-14T09:38:00.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1a127ba86bff3eee1ad08"
  },
  "studentId": 202511111,
  "interventionAssessmentId": {
    "$oid": "683f948a9b13d43b098eb910"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 3,
  "score": 100,
  "isPassed": true,
  "isCompleted": true,
  "lastQuestionAnswered": "q_pa_intervention_003",
  "category": "Phonological Awareness",
  "readingLevel": "High Emerging",
  "startedAt": {
    "$date": "2025-06-15T14:00:00.000Z"
  },
  "completedAt": {
    "$date": "2025-06-15T14:08:00.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1a788ba86bff3eee1ad09"
  },
  "studentId": 2025121,
  "interventionAssessmentId": {
    "$oid": "684f948a9b13d43b098eb950"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 2,
  "score": 67,
  "isPassed": false,
  "isCompleted": true,
  "lastQuestionAnswered": "q_dc_intervention_003",
  "category": "Decoding",
  "readingLevel": "Developing",
  "startedAt": {
    "$date": "2025-08-20T15:10:00.000Z"
  },
  "completedAt": {
    "$date": "2025-08-20T15:18:00.000Z"
  }
},
{
  "_id": {
    "$oid": "68b1a787ba86bff3eee1ad10"
  },
  "studentId": 2025121,
  "interventionAssessmentId": {
    "$oid": "684f948a9b13d43b098eb950"
  },
  "questionsAnswered": 3,
  "totalQuestions": 3,
  "correctCount": 3,
  "score": 100,
  "isPassed": true,
  "isCompleted": true,
  "lastQuestionAnswered": "q_dc_intervention_003",
  "category": "Decoding",
  "readingLevel": "Developing",
  "startedAt": {
    "$date": "2025-08-21T11:20:00.000Z"
  },
  "completedAt": {
    "$date": "2025-08-21T11:28:00.000Z"
  }
}]

Here is the flow that we have and the variables that we have for the responses
made by the student. So first of all we will use the pre assessment right and it
would be colluded or in cooperation with the user_responses that is done in the
mobile application.
and secondly when that he have done the pre assessment, the reading percentage
and reading level would be updated in the test.users table and the pre assessment
done. and secondly after he have done that he would now go to the
main
_assessment part whereas what they have gotten on the pre assessment it
would determine their reading level like for example, Low Emerging, it is alphabet
knowledge only, and for High Emerging they have alphabet knowledge and
phonological awareness, and if they are Developing they have category of
Alphabet knowledge, phonological and decoding. and if they are transitioning they
have alphabet knowledge, phonological, decoding and word recognition and if
they are at grade level for the reading level based on the pre assessment they
have all the 5 categories to be answer they have categories alphabet knowledge,
phonological awareness, decoding, word recognition, and reading comprehension
which consists of passages and such
and thirdly it would be putted up to the student_responses in the test collection,
and it woud e also putted up to the category_results, which consists of the totals
scores and if they have intervention and such, see the intervention_assessment,
result, responses.txts that we ave so you can have the better project knowledge
based on this.
now after that they have answered the main_assessment or what we call the (post
assessment) they should be able to get its prescriptive analytics whether they
have failed or passed the 75%, so meaning if they have passed the 75% score,
they woudl see their prescriptive analsysis at the same time if they havent passed
the 75% score in certain category they should see the prescriptive analysis in that
area right, and have the intervention maded for them by the teachers and give the
appropriate intervention based on the prescriptive analytics that we have. you get
it? so that's why we have the json and txt files of the templates and intervention
because of the prescriptive analysis and based from that analysis, the teacher
would be able to get what is really needed for that certain child/student and have
its appropriate intervention questions, options and such
and next is that if the student has done the intervention, the teacher should also
be able to see the prescriptive analysis afterwards also, wheter they have passed
the 75% score or not but if they STILL havent passed the 75% score in that
category and then, we should be able to have intervention again for them BASED
ON THE PRESCRIPTIVE ANALYSIS THAT WE HAVE and if they have passed then
show just the prescriptive analysis based on the intervention they have answered
and no creating more additional intervention for them it should be conducted face
to face
So that is basically the flow that we have for here.
and the variables that we have you can see it in the sample records that we have
for all across 5 categories student_responses for main assessment and the
intervention
_responses for the intervention_
assessment.
having their response and if its correct or not, the response time, answered at and
etc



# So the flow is this also !this is important 

For Low Emerging, they onyl have category of Alphabet Knowledge,
For High Emerhging they only have category of Alphabet Knowledge and Phonological Awareness
For Developing they have Alphabet Knowledge and Phonological Awareness, and Decoding
For Transitioning they have Alphabet Knowledge and Phonological Awareness, and Decoding, and Word Recognition
For At Grade Level they have Alphabet Knowledge and Phonological Awareness, and Decoding, and Word Recognition and Reading Comprehension 

Complete Implementation Checklist

 Backend Setup

 Create /backend/services/prescriptiveAnalyticsEngine.js
 Create /backend/services/interventionGenerator.js
 Create /backend/routes/prescriptiveAnalytics.js
 Update /backend/server.js to include routes
 Create MongoDB collections

  Testing

 Test BKT formula calculations
 Test IRT ability estimations
 Test intervention generation
 Test face-to-face detection
 End-to-end flow testing