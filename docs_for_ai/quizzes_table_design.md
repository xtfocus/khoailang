# **Database Design: Quizzes Table**

## **Overview**
The `quizzes` table is designed to store metadata and results for quizzes that test a single flashcard. This table directly references the `flashcards` table, ensuring a simple and efficient relationship between quizzes and the flashcards they test.

---

## **Table Schema**

### **Schema Updates**
The quiz system uses a dedicated table for quiz types:

```sql
CREATE TABLE quiz_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE -- e.g., Definition Recognition, Synonyms & Antonyms, etc.
);

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

---

## **Column Descriptions**
- **`id`**: Unique identifier for each quiz attempt.
- **`user_id`**: Links the quiz to the user who took it. This references the `users` table.
- **`flashcard_id`**: Links the quiz to the specific flashcard being tested. This references the `flashcards` table.
- **`target_language`**: Specifies the language of the flashcard being tested (e.g., Spanish, Japanese).
- **`quiz_type_id`**: References the type of quiz being administered (e.g., Definition Recognition, Synonyms & Antonyms).
- **`score`**: Stores the user's performance score for the quiz (e.g., percentage or points).
- **`completed_at`**: Logs the timestamp when the quiz was completed.

---

## **Relationships**
The `quizzes` table has the following relationships:
1. **Users Table**:
   - Each quiz is associated with a specific user (`user_id`).
   - This allows tracking of individual user performance and progress.

2. **Flashcards Table**:
   - Each quiz tests a single flashcard (`flashcard_id`).
   - This allows tracking of performance for specific flashcards.

3. **Quiz Types Table**:
   - Each quiz is associated with a specific quiz type (`quiz_type_id`).
   - This allows categorization and analysis of quiz performance by type.

---

## **Example Data**
Here’s an example of how data might look in the `quizzes` table:

| id  | user_id | flashcard_id | target_language | quiz_type_id | score | completed_at        |
|-----|---------|--------------|-----------------|--------------|-------|---------------------|
| 1   | 1       | 101          | Spanish         | 1            | 90    | 2025-04-08 10:30:00 |
| 2   | 2       | 102          | Japanese        | 2            | 80    | 2025-04-08 11:00:00 |
| 3   | 1       | 103          | Spanish         | 3            | 100   | 2025-04-08 12:15:00 |

---

## **Quiz Types**

Below are the five fundamental quiz types and their implementation details:

### **Quiz Types**

1. Definition Recognition  
2. Synonyms & Antonyms  
3. Fill-in-the-Blank Usage  
4. Multiple-Choice Context  
5. True/False Judgments  

For detailed descriptions and examples, refer to the "quizzes_design.md" document.

## **Use Cases**
1. **Track Quiz Attempts**:
   - Log each quiz attempt, including the flashcard tested, user performance, and quiz type.

2. **Adaptivity**:
   - Use quiz results to adjust the difficulty of future quizzes or review schedules for specific flashcards.

3. **Progress Tracking**:
   - Aggregate quiz results to show user progress for specific flashcards, categories, or languages.

4. **Analytics**:
   - Analyze user performance across different quiz types, interaction formats, or languages.

---

## **Advantages**
1. **Simplified Design**:
   - Directly links quizzes to flashcards, avoiding the need for a separate mapping table.
2. **Efficient Tracking**:
   - Makes it easy to track performance for individual flashcards and users.
3. **Scalability**:
   - Supports a wide range of quiz types and interaction formats.

---

## **Future Considerations**
If the app evolves to include quizzes that test multiple flashcards simultaneously, a junction table (e.g., `quiz_flashcards`) may be required to map quizzes to multiple flashcards.

---

This design ensures a clean and efficient structure for managing quizzes and their relationship with flashcards.