#codebase 
1. Generate quizzes: Probably we should do this right after importing words from UI --> save quiz to 'quizzes' table (so they can be reused later)
Details:
In backend, after generate flashcards, we also need to generate quizzes.
For each flashcard, we:
- detect if the flashcard is a phrase or a word (using LLM)
- if it's a word, use LLM to generate up to 5 synonyms and upto 5 antonyms
- if it's a word, use LLM to generate up to 3 phrases/proverbs that share meaning with the flashcard

(LLM usage is demonstrated in words.py)

(Then we need to think of how we store these derivative data! For now, for simplicity, we don't store them, only store quizzes)

Then we generate quizzes using the information above (also using LLM).
About quiz types that we can generate, check out #file:quizzes_design.md  (Ignore the types marked as "REMOVED")

Input to create quizzes: target language (language_id in flashcards table) target word and its definition (front and back in `flashcards` table) +  quiz types (quiz_type table) ).



2. Quiz session:

Allow user to pick catalog to start a quiz session from the dashboard

You can choose to learn from certain scope:
- learn now: learn cards recommended by the system
- learn due cards: learn cards that has <0.3 memory_strength
- learn from catalog: learn within catalog

If no card available within the selected scope, tell user oops, no card available

Otherwise, sample 10 words with lowest memory_strength value (user_flashcards table), within the scope, for a quiz session. 

Quiz sampling:
  - use a ruling function to map memory_strength to suitable quiz format (stronger memory means user is ready for more challenging quiz). Currently, quizzes have difficulty ranging from 1-5. memory_strength is 0-100.

  - while whe have 10 words only, we will test user on 20 quizzes.

If user fail on a flashcard, we de-escalate difficulty: we re-test user on that same flashcard but with the next difficult quiz.
In contrast, if user pass on a flashcard, we escalate difficulty

After each quiz:
- record user performance in 'quizzes' table
- update user performance in user_flashcards table (Need to come up with a formula on how we aggregate this)

At any time user can end the session (by closing the browser or clicking an exit button). Then only performance on answered quizzes will be recorded.

3. formula
For spaced repetition apps like Cerego **memory strength** is critical to optimizing when and what to review.


### 🔁 **Core Idea: Spaced Repetition + Memory Model**
We model **memory strength** as a function that decays over time, and we update it based on how well a learner remembers a word during a quiz or review.

---

### 🧠 **1. Memory Strength Representation**
For each row in user_flashcards , we track:

- `last_reviewed: timestamp
- `memory_strength`: a float between 0.0 (forgotten) and 1.0 (fully retained)
- `success_streak`: how many times it's been answered correctly in a row
- `next_review`: when this item should be shown again

---

### 📉 **2. Memory Decay Model**
Use exponential decay with a constant rate for all words:

```python
from math import exp

def get_memory_strength(last_reviewed_at, now, base_decay=0.2):
    delta_days = (now - last_reviewed_at).days
    return exp(-base_decay * delta_days)
````

base_decay can be tuned — e.g., 0.1 for slower decay, 0.3 for faster.

🔄 3. Updating After Review

When a student reviews a word:

def update_memory_state(memory_strength, correct, success_streak):
    if correct:
        success_streak += 1
        memory_strength = min(1.0, memory_strength + 0.15 + 0.05 * success_streak)
        interval = 1 * (2 ** success_streak)  # Space further apart
    else:
        success_streak = 0
        memory_strength = max(0.1, memory_strength * 0.5)
        interval = 1  # Show again tomorrow

    next_review_at = today + timedelta(days=interval)
    return memory_strength, success_streak, next_review_at

This creates an adaptive spaced repetition effect:

    More corrects → higher memory strength and longer intervals.

    A mistake → drops memory strength and shows the word sooner.---



Things we haven't covered: Catalog word uniqueness enforcement. Need to check this quick if it has been implemented. See if we import word and add them to catalog at the same time, and duplication happens, we might need to warn user that duplicates x,z,y will not be added to catalog.
Catalog_flashcards doesn't have "front" column so if we want to check uniqueness we need to join it with flashcard table.
Also we need to make sure each catalog belongs to a single language. So, if user choose English language during import step , we can only suggest English catalogs in that step.
So far we havnt' cover create catalogs. We should allow user to create their catalog from cards they have access to (shared or own). To create a catalog, simply enter a form:
- Catalog's name: type in
- Target Language: drop down select
- Add flashcards to it. Here they can use a dropdown to browse accessible flashcards (cards they have access to and belong to the target language). They can also use a magic button to select suitable flashcards from the accessible ones. Then clicking confirm.

Must Enforce word uniqueness in catalog. If violated, warning user and recommend deselecting that word/flashcard.
Each catalog might have a lot of flashcards (up to 250), so the UI design must takes this into consideration.

