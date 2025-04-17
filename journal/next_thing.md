#codebase 
1. Quiz population:

Quiz population: Currently, we let user select language after import txt files. This should be reversed: 

- 1st step: User must select the language 
- 2nd step: User must select the file to upload
- 3rd step: Processing: This can takes quite sometimes depends on the file size, so let's refuse if the file is over 1000 lines or any lines is over 30 characterse, notice user reason of refusal.

    After the txt file is uploaded: We populate flashcards and quizzes for words that dont yet exist. By checking in the "flashcards" table, using "front" and "language_id" and "owner_id" After checking duplicates and stuff, for non-duplicates (words that user doesn't own), we:

    - generate cards (generate-flashcards), and 
    - save to database generate quizzes and save to database. Otherwise, if it's a duplciate, we simply retrieve the existing flashcard of the word so we can generate quizzes for it. Unless, there are already at least 1 quiz for that flashcard, then we let user decide if they want to select, deselect that word for import.
    
    How generate quizzes works: Will be performed after generate-flashcards is called
    
    For each flashcard, we:
    
    - detect if the flashcard is a phrase or a word (using LLM).
    - 
    - if it's a word, use LLM to generate up to 5 synonyms and upto 5 antonyms
    - 
    - if it's a word, use LLM to generate up to 3 phrases/proverbs that share meaning with the flashcard
    - 
    - generate quiz: For each quiz types, we use a prompt and structured output format (LLM). See words.py for how to use LLM. Basically you must provide a schema that suits the task, and use the `responses.create` api:
    ```python
    VALIDATE_SCHEMA = {
        "type": "object",
        "properties": {"valid_words": {"type": "array", "items": {"type": "string"}}},
        "required": ["valid_words"],
        "additionalProperties": False,
    }
    
    response = await clients["openai"].responses.create(
                model=configs["app_config"].OPENAI_MODEL,
                input=[
                    {
                        "role": "system",
                        "content": "You are a word validation assistant. Filter out any invalid entries that are not words or meaningful phrases.",
                    },
                    {"role": "user", "content": "\n".join(words)},
                ],
                text={
                    "format": {#  all following keys are required by OpenAI
                        "type": "json_schema",
                        "name": "valid_words",
                        "schema": VALIDATE_SCHEMA,
                        "strict": True,
                    }
                },
            )
            result = json.loads(response.output[0].content[0].text)
    ```
    
    we will store quiz content as a json string in the `content` table (and at user test time, we render them differently based on their type, but that's a later story). 

    When you generate quizzes, must also consider the meaning of the word, demonstrated in the 'back' text of the word 

    If the word is a duplicate, and user selected it, we still generate quizzes for it, otherwise we do not.
    
    About quiz types that we can generate, check out #file:quizzes_design.md (Ignore the types marked as "REMOVED")
    
    Finally, After populating new quizzes and flashcards --> save to 'quizzes' and 'flashcards' tables.

Notes: 
- Use loguru and put logs so I know what happening in the backend 
- During generating flashcards and quizzes we should use websocket connections to keep the connection alive, otherwise we will be met with timeout error, yuck. With websocket you must also handle authentication properly

- Keep all the quiz-generating code in app/utils



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



# Organized view of catalogs (needed when the number of catalogs grows)
 - There should be a table to represent user's collection. Then we allow user to discover public catalog, and add to their current collection.
 - Technically we can use `shared_with_id`  in catalog_shares to monitor such thing but it wouldn't be very clear if user actively finds that catalog of is shared with.
- Public categories should 
