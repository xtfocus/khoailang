# 🥔 **Khoai Lang** – Your Smart Language Learning Companion

**Platform:** Web  
**Target Audience:** Language learners  
**Inspired by:** *Cerego*  

## 🧠 **Overview**

**Khoai Lang** is an intelligent language learning app that helps users build fluency and long-term memory through AI-personalized study plans, conversation-based practice, and adaptive review. Powered by memory science and LLM-generated content, the app offers a modern, interactive way to learn new languages through dynamic flashcards, quizzes, and chatbot interactions.

---

## 👤 **User Roles & Experiences**

### 1. **Learner Experience**

#### 🔍 Getting Started
- **Onboarding**:
  - Users choose their **mother tongue or preferred interface language**.
  - Users then select one or more **target languages** they want to learn.
  - The app will adjust instructions, chatbot conversations, and content based on this setup.

#### 🧭 Personalized Dashboard
- Shows progress and memory health per target language.
- Includes quick access to lessons, chatbot scenarios, and reviews.
- **Language Switcher**: Easily toggle between learning languages (e.g., switch from Spanish to Japanese).
- **Filters**: Sort or filter learning items by strength (weak/moderate/strong), type (vocab, grammar), or category (e.g. food, travel).

#### 🧩 Learning Modules
- **LLM-Powered Content Generation**: Vocabulary, grammar, and cultural notes are dynamically generated around the item being learned.
- **Adaptive Flashcards**: Cards include visuals, pronunciation, sample sentences, and explanations in the display language.
- **Smart Contrastive Tips**: For users learning from a specific mother tongue, the system highlights common mistakes or cross-linguistic differences.

---

## 🌍 **Multi-Language Learning & Interface**

| Feature | Description |
|--------|-------------|
| **Multiple Target Languages** | Learn more than one language in parallel, with separate learning paths. |
| **Display Language (UI)** | Choose your mother tongue or any preferred language for navigating the app. |
| **Language Switcher** | Quickly change between active learning languages via the dashboard. |

---

## ✅ **Quiz Types**

Quiz Types is detailed under `docs_for_ai/quizzes_design.md`

---

## 🧠 **Adaptivity Layer**

The **adaptivity layer** is the intelligence engine behind personalized learning. It continuously analyzes learner behavior and adjusts both **what** is presented and **how** it’s presented across three dimensions:

---

### 1. **Memory Model — *When to Review***  
A spaced repetition engine optimized to boost retention.

| Feature | Function |
|--------|----------|
| **Memory Strength Score** | Tracks how well you’ve retained an item |
| **Decay Curve** | Predicts forgetting based on time and interaction |
| **Smart Review Scheduling** | Reviews triggered just before expected forgetting |
| **Item Reintroduction** | Mastered items come back after longer intervals |

> 🧠 Based on cognitive science, items are reviewed *just in time* — improving recall and reducing overload.

---

### 2. **Cognitive Escalation — *How Deep to Test***  
Adapts the **complexity** of tasks for each concept based on performance.

| Level | Quiz Type | Cognitive Process | Format |
|-------|-----------|-------------------|--------|
| 1 | Identify “comer” (to eat) from images | Recognition | MCQ |
| 2 | Match “comer” ↔ “to eat” | Association | Matching |
| 3 | Fill in: “Yo ___ arroz.” | Recall | Text input |
| 4 | Conjugate “comer” (past tense) | Production | Typed |

**Adaptivity Logic:**
- ✅ *Correct answers* → escalate difficulty (more depth, less support)  
- ❌ *Mistakes* → simplify content (more cues, less complexity)  
- 🔁 *Inconsistent performance* → mix formats and review frequencies to reinforce learning

---

### 3. **Behavioral Signals — *What Content to Emphasize***  
Learner behavior feeds back into content prioritization.

| Signal | System Response |
|--------|------------------|
| Fast correct answers | Less frequent review |
| Hesitation | Schedule earlier review |
| Mistake on strong item | Reintroduce with varied format |
| Repeated struggle with grammar | Increase grammar drills |
| High chatbot use in specific topics | Recommend related vocabulary |

> 📊 This layer helps personalize based on not just *performance*, but *engagement and interest* too.

---

## 🔄 **Summary Learning Loop**

1. Learner completes a quiz, flashcard, or chatbot interaction  
2. System logs response time, accuracy, and engagement  
3. Memory strength and cognitive level are updated  
4. Scheduler selects the next best review or escalation  
5. Chatbot/content adjusts to reflect current goals and struggles

---

## 🤖 **Chatbot Companion**

Your AI conversation partner:
- **Practice Mode**: Roleplay real-life scenarios (e.g. at the airport, in a restaurant)
- **Grammar Assistant**: Ask about conjugations, sentence structure, or vocabulary
- **Navigation Helper**: Use natural language to schedule reviews, find content, or set reminders

---

## 🎯 **Daily Learning & Motivation**

- **Spaced Repetition Engine**: Powers personalized review scheduling
- **Mini Missions**: e.g., *“Master 5 travel phrases”*, or *“Order coffee like a local”*
- **Progress Tracker**: Vocabulary count, memory health, daily streaks

---

## 🔄 Summary Flow

1. Learner interacts with a concept (in one target language)
2. Adaptivity layer logs response time, accuracy, behavior, etc.
3. Updates memory strength and cognitive level for that concept in that language
4. Schedules future reviews or escalates challenge
5. Content across multiple languages adapts **independently but simultaneously**
6. Review activities in Dashboard

---
