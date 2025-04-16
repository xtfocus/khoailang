# **Database Design**

This document outlines the database schema for the **Khoai Lang** language learning app. It includes the design for all key tables discussed so far.

---

## **0. Users Table**

The `users` table stores core user data and authentication information.

### **Schema**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) UNIQUE,
    hashed_password TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the user.
- **`email`**: User's email address (unique).
- **`username`**: Optional username (unique if provided).
- **`hashed_password`**: Bcrypt-hashed password.
- **`is_admin`**: Whether the user has admin privileges.
- **`created_at`**: When the user account was created.
- **`updated_at`**: When the user account was last updated.

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
    memory_strength FLOAT DEFAULT 0.0, -- A float between 0.0 (forgotten) and 1.0 (fully retained)
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the record.
- **`user_id`**: References the user interacting with the flashcard.
- **`flashcard_id`**: References the flashcard being tracked.
- **`memory_strength`**: A float between 0.0 (forgotten) and 1.0 (fully retained).
- **`last_reviewed`**: The last time the user reviewed the flashcard (with timezone).
- **`next_review`**: The next scheduled review time for the flashcard (with timezone).

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
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
    quiz_type_id INTEGER NOT NULL REFERENCES quiz_types(id) ON DELETE RESTRICT,
    score FLOAT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for each quiz attempt.
- **`user_id`**: Links the quiz to the user who took it.
- **`flashcard_id`**: Links the quiz to the specific flashcard being tested.
- **`language_id`**: References the language in which the quiz was taken.
- **`quiz_type_id`**: References the `quiz_types` table to identify the quiz format.
- **`score`**: Stores the user's performance score for the quiz as a floating point number.
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
    code VARCHAR(10) NOT NULL  -- The language code (e.g., 'en', 'es', 'ja')
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the language.
- **`name`**: The name of the language (e.g., Spanish, Japanese).
- **`code`**: ISO language code for the language.

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
    approved BOOLEAN DEFAULT FALSE, -- Whether the user has been approved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- When the entry was created
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the waitlist entry.
- **`email`**: Email of the user on the waitlist.
- **`name`**: Optional name of the user.
- **`reason`**: Reason for joining the waitlist.
- **`approved`**: Whether the user has been approved.
- **`created_at`**: When the waitlist entry was created.

---

## **8. Catalogs Table**

The `catalogs` table manages collections of flashcards.

### **Schema**
```sql
CREATE TABLE catalogs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Name of the catalog
    description TEXT, -- Description of the catalog
    visibility VARCHAR(7) NOT NULL DEFAULT 'private', -- Visibility of the catalog ('public' or 'private')
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Owner of the catalog
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- When the catalog was created
);
```

### **Column Descriptions**
- **`id`**: Unique identifier for the catalog.
- **`name`**: Name of the catalog.
- **`description`**: Description of the catalog.
- **`visibility`**: Visibility of the catalog:
  - 'private': Only accessible by owner and explicitly shared users
  - 'public': Accessible by all users
- **`owner_id`**: References the user who owns the catalog.
- **`created_at`**: When the catalog was created.

### **Access Control**
- Public catalogs:
  - Can be viewed by all users
  - Can only be modified by the owner (who created it)
  - Modifications include: adding/removing words, changing visibility, or deleting the catalog
- Private catalogs:
  - Can only be viewed by:
    - The owner of the catalog
    - Users with whom the catalog has been explicitly shared via catalog_shares
  - Can only be modified by the owner
- When a catalog is shared:
  - Shared users gain read-only access to view all flashcards in the catalog
  - Only the owner can modify the catalog or its contents
  - Individual flashcard sharing is not supported - sharing is done at the catalog level

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

## **10. Catalog Shares Table**

The `catalog_shares` table manages sharing of catalogs.

### **Schema**
```sql
CREATE TABLE catalog_shares (
    catalog_id INTEGER NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
    shared_with_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (catalog_id, shared_with_id)
);
```

### **Column Descriptions**
- **`catalog_id`**: References the catalog being shared (part of composite primary key)
- **`shared_with_id`**: References the user with whom the catalog is shared (part of composite primary key)
- **`created_at`**: Logs the timestamp when the catalog was shared

### **Sharing Rules**
- Sharing a catalog gives access to all flashcards within that catalog
- When a catalog is made public, no explicit sharing entries are needed
- When a catalog is private, only users with explicit sharing entries can access it
- Deleting a sharing entry immediately revokes access (unless the catalog is public)

---

## **11. User Settings Table**

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
  - `catalog_shares` (manages sharing of catalogs)
  - `user_settings` (stores user preferences)

### **Flashcards Table**
- The `flashcards` table is referenced by:
  - `user_flashcards` (tracks user-specific progress for each flashcard)
  - `quizzes` (tracks quiz attempts for specific flashcards)
  - `catalog_flashcards` (links flashcards to catalogs)

### **Languages Table**
- The `languages` table is referenced by:
  - `flashcards` (defines the language of each flashcard)
  - `quizzes` (tracks quiz language settings)
  - Referenced in user preferences through `user_settings.preferred_languages`

### **Quiz Types Table**
- The `quiz_types` table is referenced by the `quizzes` table to define what type of quiz is being administered.

### **Catalogs Table**
- The `catalogs` table is referenced by:
  - `catalog_flashcards` (links flashcards to catalogs)
  - `catalog_shares` (manages sharing of catalogs)

---

## **Example Data**

### Users Table
| id  | email              | username | is_admin | created_at                | updated_at                |
|-----|-------------------|----------|----------|---------------------------|---------------------------|
| 1   | quang@example.com | quang    | false    | 2025-04-08T09:00:00+00:00 | 2025-04-08T09:00:00+00:00 |
| 2   | thuy@example.com  | thuy     | false    | 2025-04-08T09:30:00+00:00 | 2025-04-08T09:30:00+00:00 |
| 3   | lan@example.com   | lan      | false    | 2025-04-08T10:00:00+00:00 | 2025-04-08T10:00:00+00:00 |

### Flashcards Table
| id  | front     | back                                        | language_id | owner_id | created_at                |
|-----|-----------|---------------------------------------------|-------------|----------|---------------------------|
| 1   | rain      | Precipitation in the form of water droplets | 1           | 1        | 2025-04-08T10:00:00+00:00 |
| 2   | sunny     | Bright with sunlight                        | 1           | 1        | 2025-04-08T10:10:00+00:00 |
| 3   | desk      | A piece of furniture with a flat surface    | 1           | 1        | 2025-04-08T10:20:00+00:00 |
| 4   | computer  | An electronic device for data processing    | 1           | 1        | 2025-04-08T10:30:00+00:00 |

### User Flashcards Table
| id  | user_id | flashcard_id | memory_strength | last_reviewed              | next_review                 |
|-----|---------|--------------|-----------------|---------------------------|----------------------------|
| 1   | 1       | 1            | 0.8             | 2025-04-08T10:00:00+00:00 | 2025-04-15T10:00:00+00:00 |

### Quiz Types Table
| id  | name                    |
|-----|------------------------|
| 1   | Definition Recognition |
| 2   | Synonyms & Antonyms    |
| 3   | Fill-in-the-Blank     |
| 4   | Multiple-Choice Context|
| 5   | True/False Judgments   |

### Quizzes Table
| id  | user_id | flashcard_id | language_id | quiz_type_id | score | completed_at              |
|-----|---------|--------------|-------------|--------------|-------|---------------------------|
| 1   | 1       | 1            | 1           | 2            | 90.0  | 2025-04-08T10:30:00+00:00 |

### Chatbot Interactions Table
| id  | user_id | content               | timestamp                |
|-----|---------|-----------------------|--------------------------|
| 1   | 1       | "What does Hola mean?"| 2025-04-08T11:00:00+00:00 |

### Languages Table
| id  | name     | code |
|-----|----------|------|
| 1   | Spanish  | es   |
| 2   | Japanese | ja   |

### Catalogs Table
| id  | name                | description                                | visibility | owner_id | created_at                |
|-----|---------------------|--------------------------------------------|------------|----------|---------------------------|
| 1   | Weather Vocabulary  | Common weather-related terms and expressions | public     | 1        | 2025-04-08T12:00:00+00:00 |
| 2   | Office Vocabulary   | Essential office and workplace terminology | private    | 2        | 2025-04-08T12:30:00+00:00 |
| 3   | Interview Vocabulary| Key terms for job interviews and professional settings | private | 3        | 2025-04-08T13:00:00+00:00 |

### Catalog Flashcards Table
| id  | catalog_id | flashcard_id |
|-----|------------|--------------|
| 1   | 1          | 1            |
| 2   | 1          | 2            |
| 3   | 2          | 3            |
| 4   | 2          | 4            |

### Catalog Shares Table
| catalog_id | shared_with_id | created_at                |
|------------|----------------|---------------------------|
| 1          | 2              | 2025-04-08T12:00:00+00:00 |
| 2          | 1              | 2025-04-08T12:30:00+00:00 |
| 3          | 2              | false      | 2025-04-08T13:00:00+00:00 |

### User Settings Table
| user_id | allow_duplicates | default_visibility | preferred_languages | ui_preferences                    |
|---------|-----------------|-------------------|-------------------|----------------------------------|
| 1       | false           | private           | "es,ja"           | {"theme": "light", "layout": "grid"} |
| 2       | true            | public            | "es"              | {"theme": "dark"}                    |


