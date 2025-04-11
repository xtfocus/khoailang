# **Database Design**

This document outlines the database schema for the **Khoai Lang** language learning app. It includes the design for all key tables discussed so far.

---

## **1. Flashcards Table**

The `flashcards` table stores the core data for individual flashcards.

### **Schema**
```sql
CREATE TABLE flashcards (
    id SERIAL PRIMARY KEY,
    front TEXT NOT NULL, -- The word/phrase in the target language
    back TEXT NOT NULL,  -- The translation or meaning
    language VARCHAR(50) NOT NULL -- The language of the flashcard (e.g., Spanish, Japanese)
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the flashcard.
- **`front`**: The word/phrase in the target language.
- **`back`**: The translation or meaning.
- **`language`**: The language of the flashcard (e.g., Spanish, Japanese).

---

## **2. User Flashcards Table**

The `user_flashcards` table tracks user-specific progress for each flashcard, including review schedules and memory strength.

### **Schema**
```sql
CREATE TABLE user_flashcards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    memory_strength FLOAT DEFAULT 0.0, -- A score representing how well the user remembers the flashcard
    last_reviewed TIMESTAMP, -- The last time the user reviewed the flashcard
    next_review TIMESTAMP -- The next scheduled review time for the flashcard
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the record.
- **`user_id`**: References the user interacting with the flashcard.
- **`flashcard_id`**: References the flashcard being tracked.
- **`memory_strength`**: A score representing how well the user remembers the flashcard.
- **`last_reviewed`**: The last time the user reviewed the flashcard.
- **`next_review`**: The next scheduled review time for the flashcard.

---

## **3. Quiz Types Table**

The `quiz_types` table defines the available quiz formats in the system.

### **Schema**
```sql
CREATE TABLE quiz_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);
```

### **Example Data**
| id  | name                    |
|-----|------------------------|
| 1   | Definition Recognition |
| 2   | Synonyms & Antonyms    |
| 3   | Fill-in-the-Blank     |
| 4   | Multiple-Choice Context|
| 5   | True/False Judgments   |

---

## **4. Quizzes Table**

The `quizzes` table tracks individual quiz attempts, including the user who took the quiz, the flashcard being tested, and the quiz results.

### **Updated Schema**
```sql
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    target_language VARCHAR(50) NOT NULL,
    quiz_type_id INTEGER NOT NULL REFERENCES quiz_types(id) ON DELETE RESTRICT,
    score FLOAT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for each quiz attempt.
- **`user_id`**: Links the quiz to the user who took it.
- **`flashcard_id`**: Links the quiz to the specific flashcard being tested.
- **`target_language`**: Specifies the language of the flashcard being tested.
- **`quiz_type_id`**: References the `quiz_types` table to identify the quiz format.
- **`score`**: Stores the user's performance score for the quiz.
- **`completed_at`**: Logs the timestamp when the quiz was completed.

---

## **5. Chatbot Interactions Table**

The `chatbot_interactions` table logs user interactions with the chatbot.

### **Schema**
```sql
CREATE TABLE chatbot_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- The text or data exchanged during the interaction
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- When the interaction occurred
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the interaction.
- **`user_id`**: References the user who interacted with the chatbot.
- **`content`**: The text or data exchanged during the interaction.
- **`timestamp`**: When the interaction occurred.

---

## **6. Languages Table**

The `languages` table stores supported languages for flashcards and user preferences.

### **Schema**
```sql
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- The name of the language (e.g., Spanish, Japanese)
    code VARCHAR(10) NOT NULL -- The language code (e.g., "es", "ja")
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the language.
- **`name`**: The name of the language (e.g., Spanish, Japanese).
- **`code`**: The language code (e.g., "es", "ja").

---

## **Relationships**

### **Users Table**
- The `users` table is referenced by:
  - `user_flashcards` (tracks user-specific flashcard progress)
  - `quizzes` (tracks quiz attempts by users)
  - `chatbot_interactions` (logs user interactions with the chatbot)

### **Flashcards Table**
- The `flashcards` table is referenced by:
  - `user_flashcards` (tracks user-specific progress for each flashcard)
  - `quizzes` (tracks quiz attempts for specific flashcards)

### **Quiz Types Table**
- The `quiz_types` table is referenced by the `quizzes` table to define what type of quiz is being administered

---

## **Example Data**

### Flashcards Table
| id  | front  | back   | language  |
|-----|--------|--------|-----------|
| 1   | Hola   | Hello  | Spanish   |
| 2   | ありがとう | Thank you | Japanese  |

### User Flashcards Table
| id  | user_id | flashcard_id | memory_strength | last_reviewed       | next_review         |
|-----|---------|--------------|-----------------|---------------------|---------------------|
| 1   | 1       | 1            | 0.8             | 2025-04-08 10:00:00 | 2025-04-15 10:00:00 |

### Quiz Types Table
| id  | name                    |
|-----|------------------------|
| 1   | Definition Recognition |
| 2   | Synonyms & Antonyms    |
| 3   | Fill-in-the-Blank     |
| 4   | Multiple-Choice Context|
| 5   | True/False Judgments   |

### Quizzes Table
| id  | user_id | flashcard_id | target_language | quiz_type_id | score | completed_at        |
|-----|---------|--------------|-----------------|--------------|-------|---------------------|
| 1   | 1       | 1            | Spanish         | 2            | 90    | 2025-04-08 10:30:00 |

### Chatbot Interactions Table
| id  | user_id | content               | timestamp           |
|-----|---------|-----------------------|---------------------|
| 1   | 1       | "What does Hola mean?"| 2025-04-08 11:00:00 |

### Languages Table
| id  | name     | code |
|-----|----------|------|
| 1   | Spanish  | es   |
| 2   | Japanese | ja   |

---

This design ensures a clean, scalable, and efficient database structure for the **Khoai Lang** app.
