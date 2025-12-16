# 🧠 AI-Driven Prescriptive Analytics: Strategy & Architecture

**Prepared For:** Literexia Panel Review
**Date:** December 16, 2025
**Document Type:** Strategic Assessment & Implementation Plan

---

## 1. Executive Summary

This document outlines the strategy for upgrading the Literexia Prescriptive Analytics system from a static rule-based engine to a dynamic **AI-Driven "Doctor" Model**. This evolution aligns with the "Doctor-Teacher-Student" methodology defined in `CLAUDE.md`, leveraging **GPT-4o (Omni)** as the sophisticated reasoning engine to interpret student data and prescribe personalized interventions.

---

## 2. Model Selection: Why GPT-4o?

After scanning the codebase and "Business AI" requirements, **OpenAI's GPT-4o (Omni)** was selected as the **Critically Based AI** for this implementation.

### Key Justifications:
1.  **"Not Our Own Data" Compliance**:
    *   The panel correctly advised against training a custom model (requires millions of data points).
    *   GPT-4o provides "Zero-Shot Reasoning" — it acts as a pre-trained educational psychologist without needing a custom dataset.
2.  **Speed & Efficiency**:
    *   GPT-4o is **2x faster** and **50% cheaper** than previous models (GPT-4 Turbo).
    *   Supports real-time "Doctor" diagnosis in <2 seconds.
3.  **Architectural Fit**:
    *   The backend (`backend/package.json`) already integrates the `openai` SDK.
    *   No new infrastructure (like Amazon Bedrock) is required, simplifying deployment and security.

---

## 3. The "Hybrid Analytics" Architecture

To maximize both **Accuracy** (Math) and **Insight** (AI), we are implementing a **Hybrid Diagnostic Flow**.

### Phase 1: The "Lab Tests" (Mathematical Precision)
*   **Engine**: Existing Code (`mathematicalModelsService.js`)
*   **Method**: Bayesian Knowledge Tracing (BKT) & Item Response Theory (IRT)
*   **Role**: Instantly calculates raw performance metrics.
    *   *Result*: "Phonological Awareness: 42%", "Error Pattern: B-P Confusion (High)"
*   **Why**: AI is prone to calculation errors; code is not. We trust code for the numbers.

### Phase 2: The "Doctor's Visit" (AI Interpretation)
*   **Engine**: New Service (`AIPrescriptiveAnalysisService.js`)
*   **Method**: GPT-4o Reasoning
*   **Role**: Interprets the "Lab Tests" to create a human-centered prescription.
    *   *Prompt*: "Act as a Dyslexia Specialist. Analyze this student's lab results. Prescribe a specific intervention."
*   **Why**: Code cannot write empathetic, nuanced, and varying advice. AI excels at this.

---

## 4. Implementation Strategy

### New Service: `AIPrescriptiveAnalysisService.js`
A dedicated micro-service that:
1.  **Ingests**: Student Profile + Category Scores + Error Patterns.
2.  **Contextualizes**: Injecting the "Dyslexia Specialist" system prompt.
3.  **Generates**: A JSON-structured prescription matching our database schema.
4.  **Validates**: Ensures the AI output is safe and properly formatted.

### Codebase Integration
*   The `generatePrescriptionOnly` function in the main service will be upgraded to route data through this new AI service.
*   **Fallback Safety**: If the AI API is unavailable, the system will automatically revert to the legacy rule-based system (`prescriptionOnlyService.js`) to ensure zero downtime.

---

## 5. Security & Safety Verification

Per `SAFETY_VERIFICATION.md` standards:
*   **Data Privacy**: Only anonymized scores and error patterns are sent to OpenAI (no PII like full names/addresses needed for diagnosis).
*   **Compliance**: `openai` is a secure, standard dependency.
*   **Network Security**: API calls are made securely from the EC2 backend, never exposed to the client/frontend.

---

## 6. Future-Proofing

*   **Model Agnostic**: The system is designed to easily switch AI providers (e.g., to Anthropic Claude or Google Gemini) if business needs change, by modifying only the interface layer in `AIPrescriptiveAnalysisService.js`.
*   **Scalability**: The "Hybrid" approach keeps costs low by performing heavy processing locally (Math phase) and only using expensive AI compute for the high-value "Doctor" phase.
