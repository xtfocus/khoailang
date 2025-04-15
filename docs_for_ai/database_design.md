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
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE RESTRICT, -- Reference to the languages table
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE -- The user who owns the flashcard
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the flashcard.
- **`front`**: The word/phrase in the target language.
- **`back`**: The translation or meaning.
- **`language_id`**: References the language in the `languages` table.
- **`owner_id`**: References the user who owns the flashcard.

---

## **2. User Flashcards Table**

The `user_flashcards` table tracks user-specific progress for each flashcard, including review schedules and memory strength.

### **Schema**
```sql
CREATE TABLE user_flashcards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    memory_strength INTEGER DEFAULT 0 CHECK (memory_strength >= 0 AND memory_strength <= 100), -- A score representing how well the user remembers the flashcard
    last_reviewed TIMESTAMP, -- The last time the user reviewed the flashcard
    next_review TIMESTAMP -- The next scheduled review time for the flashcard
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the record.
- **`user_id`**: References the user interacting with the flashcard.
- **`flashcard_id`**: References the flashcard being tracked.
- **`memory_strength`**: An integer score (0-100) representing how well the user remembers the flashcard.
- **`last_reviewed`**: The last time the user reviewed the flashcard.
- **`next_review`**: The next scheduled review time for the flashcard.

---

## **3. Quiz Types Table**

The `quiz_types` table defines the available quiz formats in the system.

### **Schema**
```sql
CREATE TABLE quiz_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE -- e.g., Definition Recognition, Synonyms & Antonyms, etc.
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the quiz type.
- **`name`**: The name of the quiz type (e.g., Definition Recognition, Synonyms & Antonyms).

---

## **4. Quizzes Table**

The `quizzes` table tracks individual quiz attempts, including the user who took the quiz, the flashcard being tested, and the quiz results.

### **Schema**
```sql
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    target_language VARCHAR(50) NOT NULL, -- The language of the flashcard being tested
    quiz_type_id INTEGER NOT NULL REFERENCES quiz_types(id) ON DELETE RESTRICT, -- The type of quiz
    score INTEGER CHECK (score >= 0 AND score <= 100), -- The user's performance score for the quiz
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- When the quiz was completed
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for each quiz attempt.
- **`user_id`**: Links the quiz to the user who took it.
- **`flashcard_id`**: Links the quiz to the specific flashcard being tested.
- **`target_language`**: Specifies the language of the flashcard being tested.
- **`quiz_type_id`**: References the `quiz_types` table to identify the quiz format.
- **`score`**: Stores the user's performance score for the quiz (0-100).
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
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the language.
- **`name`**: The name of the language (e.g., Spanish, Japanese).

---

## **7. Waitlist Table**

The `waitlist` table tracks users who are waiting for access to the application.

### **Schema**
```sql
CREATE TABLE waitlist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE, -- Email of the user on the waitlist
    name VARCHAR(255), -- Optional name of the user
    reason TEXT, -- Reason for joining the waitlist
    approved BOOLEAN DEFAULT FALSE -- Whether the user has been approved
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the waitlist entry.
- **`email`**: Email of the user on the waitlist.
- **`name`**: Optional name of the user.
- **`reason`**: Reason for joining the waitlist.
- **`approved`**: Whether the user has been approved.

---

## **8. Catalogs Table**

The `catalogs` table manages collections of flashcards.

### **Schema**
```sql
CREATE TABLE catalogs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Name of the catalog
    description TEXT, -- Description of the catalog
    visibility VARCHAR(50) DEFAULT 'private', -- Visibility of the catalog (public/private)
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE -- Owner of the catalog
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the catalog.
- **`name`**: Name of the catalog.
- **`description`**: Description of the catalog.
- **`visibility`**: Visibility of the catalog (public/private).
- **`owner_id`**: References the user who owns the catalog.

---

## **9. Catalog Flashcards Table**

The `catalog_flashcards` table links flashcards to catalogs.

### **Schema**
```sql
CREATE TABLE catalog_flashcards (
    id SERIAL PRIMARY KEY,
    catalog_id INTEGER NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the record.
- **`catalog_id`**: References the catalog.
- **`flashcard_id`**: References the flashcard.

---

## **10. Flashcard Shares Table**

The `flashcard_shares` table manages sharing of individual flashcards.

### **Schema**
```sql
CREATE TABLE flashcard_shares (
    id SERIAL PRIMARY KEY,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    shared_with_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- When the flashcard was shared
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the record.
- **`flashcard_id`**: References the flashcard being shared.
- **`shared_with_id`**: References the user with whom the flashcard is shared.
- **`shared_at`**: Logs the timestamp when the flashcard was shared.

---

## **11. Catalog Shares Table**

The `catalog_shares` table manages sharing of catalogs.

### **Schema**
```sql
CREATE TABLE catalog_shares (
    id SERIAL PRIMARY KEY,
    catalog_id INTEGER NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
    shared_with_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- When the catalog was shared
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the record.
- **`catalog_id`**: References the catalog being shared.
- **`shared_with_id`**: References the user with whom the catalog is shared.
- **`shared_at`**: Logs the timestamp when the catalog was shared.

---

## **12. User Settings Table**

The `user_settings` table stores user preferences.

### **Schema**
```sql
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allow_duplicates BOOLEAN DEFAULT FALSE, -- Whether the user allows duplicate flashcards
    default_visibility VARCHAR(50) DEFAULT 'private', -- Default visibility for new flashcards/catalogs
    preferred_languages VARCHAR(255), -- Comma-separated list of preferred languages
    ui_preferences JSON -- JSON object for UI preferences (e.g., theme, layout)
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the record.
- **`user_id`**: References the user.
- **`allow_duplicates`**: Whether the user allows duplicate flashcards.
- **`default_visibility`**: Default visibility for new flashcards/catalogs.
- **`preferred_languages`**: Comma-separated list of preferred languages.
- **`ui_preferences`**: JSON object for UI preferences (e.g., theme, layout).

---

## **Relationships**

### **Users Table**
- The `users` table is referenced by:
  - `user_flashcards` (tracks user-specific flashcard progress)
  - `quizzes` (tracks quiz attempts by users)
  - `chatbot_interactions` (logs user interactions with the chatbot)
  - `catalogs` (manages collections of flashcards)
  - `flashcard_shares` (manages sharing of individual flashcards)
  - `catalog_shares` (manages sharing of catalogs)
  - `user_settings` (stores user preferences)

### **Flashcards Table**
- The `flashcards` table is referenced by:
  - `user_flashcards` (tracks user-specific progress for each flashcard)
  - `quizzes` (tracks quiz attempts for specific flashcards)
  - `catalog_flashcards` (links flashcards to catalogs)
  - `flashcard_shares` (manages sharing of individual flashcards)

### **Quiz Types Table**
- The `quiz_types` table is referenced by the `quizzes` table to define what type of quiz is being administered.

### **Catalogs Table**
- The `catalogs` table is referenced by:
  - `catalog_flashcards` (links flashcards to catalogs)
  - `catalog_shares` (manages sharing of catalogs)

---

## **Example Data**

### Flashcards Table
| id  | front  | back                                   | language_id | owner_id |
|-----|--------|----------------------------------------|-------------|----------|
| 1   | rain   | Precipitation in the form of water droplets. | 1           | 1        |
| 2   | sunny  | Bright with sunlight.                 | 1           | 1        |
| 3   | desk   | A piece of furniture with a flat surface for working. | 1           | 1        |
| 4   | computer | An electronic device for storing and processing data. | 1           | 1        |

### User Flashcards Table
| id  | user_id | flashcard_id | memory_strength | last_reviewed       | next_review         |
|-----|---------|--------------|-----------------|---------------------|---------------------|
| 1   | 1       | 1            | 80              | 2025-04-08 10:00:00 | 2025-04-15 10:00:00 |

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
| id  | name     
|-----|----------
| 1   | Spanish  
| 2   | Japanese 

### Catalogs Table
| id  | name                | description                                | visibility | owner_id |
|-----|---------------------|--------------------------------------------|------------|----------|
| 1   | Weather Vocabulary  | Common weather-related terms and expressions | public     | 1        |
| 2   | Office Vocabulary   | Essential office and workplace terminology | private    | 2        |
| 3   | Interview Vocabulary| Key terms for job interviews and professional settings | private | 3        |

### Catalog Flashcards Table
| id  | catalog_id | flashcard_id |
|-----|------------|--------------|
| 1   | 1          | 1            |
| 2   | 1          | 2            |
| 3   | 2          | 3            |
| 4   | 2          | 4            |

### Catalog Shares Table
| id  | catalog_id | shared_with_id | shared_at           |
|-----|------------|----------------|---------------------|
| 1   | 1          | 2              | 2025-04-08 12:00:00 |
| 2   | 2          | 1              | 2025-04-08 12:30:00 |
| 3   | 3          | 2              | 2025-04-08 13:00:00 |


