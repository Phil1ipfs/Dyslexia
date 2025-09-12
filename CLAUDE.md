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