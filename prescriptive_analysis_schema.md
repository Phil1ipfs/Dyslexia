# Database Schema & How Prescriptive Analytics Works
## A Simple, Step-by-Step Explanation

---

## Part 1: Understanding the Collections (Database Tables)

Think of collections as filing cabinets where we store different types of information about students and their assessments.

### 1. The `prescriptive_analysis` Collection
**What it stores:** The complete analysis of how a student performed

```javascript
{
  _id: "unique_id_12345",                    // Unique identifier for this analysis
  studentId: 202210222,                       // Which student this is for
  assessmentDate: "2025-01-20T10:00:00Z",    // When they took the test
  assessmentType: "main",                     // "main" or "intervention"
  readingLevel: "Transitioning",              // Their current reading level
  
  // SKILL MASTERY - How well they know each category
  skillMastery: {
    "Alphabet Knowledge": {
      masteryProbability: 0.92,             // 92% chance they know this skill
      score: 93,                            // They got 93% correct
      isPassed: true,                       // They passed (above 75%)
      totalQuestions: 15,                   // They answered 15 questions
      correctAnswers: 14,                   // Got 14 right
      lastUpdated: "2025-01-20T11:00:00Z",  // When we last calculated this
      responseHistory: [                    // Their last 10 answers for tracking
        {
          questionId: "AK_001",
          correct: true,
          timestamp: "2025-01-20T10:30:00Z",
          masteryAfter: 0.85               // Their mastery level after this answer
        }
      ]
    },
    // ... same structure for other categories
  },
  
  // ABILITY ESTIMATES - How skilled they are (-3 to +3 scale)
  abilityEstimates: {
    "Alphabet Knowledge": 1.2,              // Above average (positive number)
    "Phonological Awareness": -0.8,         // Below average (negative number)
    "Decoding": -0.2,                      // Slightly below average
    "Word Recognition": 0.5,                // Above average
    "Reading Comprehension": 0.7            // Above average
  },
  
  // ERROR PATTERNS - What mistakes they're making
  errorPatterns: {
    "Alphabet Knowledge": {
      patinig_errors: {                    // Vowel errors
        count: 1,                          // Got 1 wrong
        total: 5,                          // Out of 5 questions
        percentage: 20,                    // 20% error rate
        specific_letters: ["O"],           // Had trouble with letter O
        error_type: "visual_confusion",    // They're confusing similar-looking letters
        questionIds: ["AK_007"]            // Which questions they got wrong
      }
    },
    // ... error patterns for other categories
  },
  
  // INTERVENTION PLAN - What help they need
  interventionPlan: {
    required: true,                        // Do they need intervention? Yes
    priority: ["Phonological Awareness", "Decoding"],  // Help with these first
    specificFocus: {
      "Phonological Awareness": {
        focus: "sound_matching",          // Work on matching sounds
        targetSounds: ["B-P", "M-N"],     // Focus on these sound pairs
        recommendedActivities: [           // Activities to help
          "sound_discrimination",
          "minimal_pairs"
        ],
        questionDistribution: {
          matching: 100                    // All questions should be matching type
        }
      }
    }
  },
  
  // INSIGHTS - Summary of performance
  insights: {
    strengths: ["Reading Comprehension", "Word Recognition"],  // What they're good at
    weaknesses: ["Phonological Awareness - 47%"],             // What needs work
    overallReadiness: "Needs targeted intervention",          // Overall status
    recommendedAction: "immediate_intervention",              // What to do next
    passedCategories: 3,                                     // Passed 3 categories
    failedCategories: 2,                                     // Failed 2 categories
    overallScore: 74                                         // Overall weighted score
  },
  
  // INTERVENTION HISTORY - Previous intervention attempts
  interventionHistory: [
    {
      category: "Phonological Awareness",
      interventionId: "intervention_123",
      dateTaken: "2025-01-21T09:00:00Z",
      passed: false,                      // They didn't pass
      score: 60                            // Got 60% (needed 75%)
    }
  ],
  
  createdAt: "2025-01-20T11:00:00Z",
  updatedAt: "2025-01-20T11:00:00Z"
}
```

### 2. The `intervention_assessment` Collection
**What it stores:** The personalized 10-question intervention test

```javascript
{
  _id: "intervention_id_456",
  studentId: 202210222,                     // Which student
  prescriptiveAnalysisId: "analysis_123",   // Links to their analysis
  category: "Phonological Awareness",       // Which skill we're helping with
  readingLevel: "Transitioning",            // Student's level
  passThreshold: 75,                        // Must get 75% to pass
  
  // HOW WE PICK QUESTIONS
  questionSelectionStrategy: {
    method: "error_focused",               // Focus on their specific errors
    targetDifficulty: 0.7,                 // 70% chance they'll get it right
    focusAreas: {
      "sound_matching": 70,                // 70% of questions (7 questions)
      "general_practice": 30               // 30% of questions (3 questions)
    },
    totalQuestions: 10                    // Always exactly 10 questions
  },
  
  // THE 10 QUESTIONS
  questions: [
    {
      questionId: "q_int_pa_001",
      source: "custom",                    // We created this for them
      questionType: "malapantig",          // Type of question
      questionText: "Match the sounds",    // What we ask them
      
      // Question details (varies by category)
      questionSet: {
        audioTexts: ["B", "M", "P"],      // Sounds to play
        matchingOptions: ["Bb", "Mm", "Pp", "Nn"],  // Options to match
        correctPairs: [                   // Right answers
          { audio: "B", match: "Bb" },
          { audio: "M", match: "Mm" },
          { audio: "P", match: "Pp" }
        ]
      },
      
      // Difficulty settings
      difficulty: -0.3,                    // Easier than average
      discrimination: 1.1,                 // Good at separating skill levels
      targetSkill: "sound_discrimination", // What we're testing
      targetElement: "B-P confusion"       // Specific problem we're addressing
    },
    // ... 9 more questions
  ],
  
  // INTERVENTION SETTINGS
  interventionParameters: {
    fixedQuestions: 10,                   // Always 10 questions
    allowSkip: false,                     // Can't skip questions
    showProgress: true,                   // Show question 1/10, 2/10, etc.
    immediateFeeback: false               // Don't show right/wrong until end
  },
  
  status: "active",                        // Ready to take
  createdBy: "teacher_id_789",            // Which teacher triggered this
  createdAt: "2025-01-21T08:00:00Z",
  
  // COMPLETION TRACKING
  startedAt: null,                        // When student starts
  completedAt: null,                      // When student finishes
  interventionResultsId: null             // Links to results when done
}
```

---

## Part 2: How the System Works - Step by Step

### Step 1: Student Takes Main Assessment
**What happens:** Student answers questions in 1-5 categories based on their reading level

**Example:** Maria (Transitioning level) answers:
- 15 Alphabet Knowledge questions → Gets 14 right (93%)
- 6 Phonological Awareness questions → Gets 3 right (50%)
- 10 Decoding questions → Gets 7 right (70%)
- 10 Word Recognition questions → Gets 8 right (80%)

### Step 2: System Analyzes Performance
**What happens:** The system uses two smart formulas to understand the student

#### Formula 1: BKT (Bayesian Knowledge Tracing)
**In simple terms:** "How likely is it that the student really knows this skill?"

```
Starting belief: 50% (we're not sure)
Student gets one RIGHT → Belief goes up (maybe to 65%)
Student gets one WRONG → Belief goes down (maybe to 35%)

But we're smart about it:
- If a hard question is right → Belief goes up MORE
- If an easy question is wrong → Belief goes down MORE
```

**Real example for Maria:**
- Started at 50% mastery for Phonological Awareness
- Got first question wrong → Down to 35%
- Got second question wrong → Down to 25%
- Got third question right → Up to 30%
- Final mastery: 45% (below passing)

#### Formula 2: IRT (Item Response Theory)
**In simple terms:** "How skilled is the student compared to average?"

```
Scale: -3 (very low) to 0 (average) to +3 (very high)

If student gets 80% right → Ability = +0.9 (above average)
If student gets 50% right → Ability = 0.0 (average)
If student gets 20% right → Ability = -0.9 (below average)
```

**Maria's abilities:**
- Alphabet Knowledge: +1.2 (well above average)
- Phonological Awareness: -0.8 (below average)
- Decoding: -0.2 (slightly below average)
- Word Recognition: +0.5 (above average)

### Step 3: System Identifies Error Patterns
**What happens:** The system looks at WHAT the student got wrong

**Maria's errors in Phonological Awareness:**
```
Total questions: 6
Wrong answers: 3
Error pattern detected: "sound_discrimination"
Specific problem: Confusing B/P and M/N sounds
Error rate: 50%
```

### Step 4: System Creates Intervention Plan
**What happens:** The system decides what help is needed

**Decision process:**
1. Which categories are below 75%? → Phonological Awareness (50%), Decoding (70%)
2. Which is worse? → Phonological Awareness
3. What's the specific problem? → Sound discrimination
4. What should we focus on? → B/P and M/N sound pairs

**Intervention plan for Maria:**
```
Priority 1: Phonological Awareness
- Focus: Sound discrimination
- Target: B/P and M/N confusion
- Activities: Minimal pairs practice

Priority 2: Decoding
- Focus: Initial sounds
- Target: Beginning of words
- Activities: Word building
```

### Step 5: System Generates 10-Question Intervention
**What happens:** Creates exactly 10 personalized questions

**Question distribution formula:**
```
Total questions = 10
Targeted questions = 70% = 7 questions
General practice = 30% = 3 questions
```

**Maria's intervention questions:**
- 7 questions focusing on B/P and M/N sounds (her specific problem)
- 3 questions on general sound matching (reinforcement)
- Difficulty set slightly below her ability (70% success target)

### Step 6: Student Takes Intervention
**What happens:** Student answers all 10 questions

**Maria's intervention results:**
- Questions answered: 10
- Correct answers: 6
- Score: 60%
- Pass threshold: 75%
- Result: FAILED

### Step 7: System Makes Final Recommendation
**What happens:** Based on intervention results, system decides next step

**If PASSED (≥75%):**
```
- Mark category as improved
- Update prescriptive analysis
- Continue regular curriculum
- No more interventions needed
```

**If FAILED (<75%) - Maria's case:**
```
- Mark intervention as attempted
- Flag for face-to-face support
- Alert teacher
- Prevent more digital interventions
- Recommendation: "Maria needs one-on-one help with sound discrimination"
```

---

## Part 3: The Complete Flow with Real Numbers

### Example: Complete Journey for Student Maria

#### 1. Pre-Assessment Results
- Reading Level Determined: **Transitioning**
- Categories to assess: 4 (AK, PA, Decoding, WR)

#### 2. Main Assessment Performance
| Category | Questions | Correct | Score | Pass? |
|----------|-----------|---------|-------|-------|
| Alphabet Knowledge | 15 | 14 | 93% | ✓ |
| Phonological Awareness | 6 | 3 | 50% | ✗ |
| Decoding | 10 | 7 | 70% | ✗ |
| Word Recognition | 10 | 8 | 80% | ✓ |

#### 3. Weighted Overall Score
Using Transitioning weights:
- AK: 93% × 0.20 = 18.6
- PA: 50% × 0.25 = 12.5
- Decoding: 70% × 0.25 = 17.5
- WR: 80% × 0.30 = 24.0
- **Total: 72.6%** (Below 75% overall)

#### 4. Intervention Generation
**For Phonological Awareness:**
- Error rate: 50%
- Questions needed: 10
- Distribution: 7 sound discrimination + 3 general

#### 5. Intervention Results
- Score: 60% (6/10 correct)
- Status: FAILED
- Next step: Face-to-face tutoring required

#### 6. Teacher Dashboard Shows
```
Maria - Transitioning Level
Overall: 72.6%
✓ Alphabet Knowledge: 93%
✗ Phonological Awareness: 50% → Intervention Failed (60%)
✗ Decoding: 70% → Intervention Available
✓ Word Recognition: 80%

ALERT: Face-to-face support needed for Phonological Awareness
```

---

## Part 4: Key Rules and Constraints

### The 75% Rule
- **Pass:** Score ≥ 75% (no intervention needed)
- **Fail:** Score < 75% (intervention required)

### One-Shot Rule
- Each category gets **ONE** intervention attempt only
- If failed, must do face-to-face tutoring
- No second chances in the system

### 10-Question Rule
- Every intervention has **EXACTLY** 10 questions
- No more, no less
- Cannot skip questions

### 70/30 Distribution Rule
- 70% of questions target specific errors
- 30% are general practice
- Ensures balanced assessment

### Face-to-Face Escalation
- Digital intervention failed → Human teacher required
- System blocks further digital attempts
- Teacher gets detailed error report for targeted help

---

## Summary: The Simple Version

1. **Test** → Student takes assessment
2. **Analyze** → System finds what they don't know
3. **Plan** → System creates help strategy
4. **Intervene** → Student gets 10 personalized questions
5. **Evaluate** → Pass (≥75%) = Success, Fail (<75%) = Need teacher
6. **Support** → Either continue learning or get face-to-face help

The system is like a smart tutor that:
- Watches what mistakes students make
- Figures out why they're making them
- Creates a personalized mini-test to help
- Knows when human help is needed

All data is stored in two main places:
- **prescriptive_analysis**: The full report card
- **intervention_assessment**: The personalized help test