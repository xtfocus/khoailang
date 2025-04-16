# Backend and Database Architecture

## Database Schema Details

### Core Tables

1. **users**
   - Primary storage for user accounts
   - Tracks admin status and authentication details
   - Links to user_settings for preferences

2. **flashcards**
   - Stores core flashcard content
   - Tracks ownership and language
   - Referenced by user_flashcards for learning progress

3. **user_flashcards**
   - Junction table tracking user progress
   - Memory strength scoring (0-100)
   - Review scheduling data

4. **catalogs**
   - Groups of flashcards for organized learning
   - Public/private visibility settings
   - Owner reference

5. **quiz_types**
   - Defines available quiz formats
   - Difficulty levels
   - Maps to quiz generation rules

### Learning System Tables

1. **quizzes**
   - Records of quiz attempts
   - Links to specific flashcards
   - Performance scoring
   - Quiz type reference

2. **user_settings**
   - User preferences storage
   - Language preferences
   - UI settings
   - Learning preferences

### Administrative Tables

1. **waitlist**
   - Pending user registrations
   - Approval status tracking
   - Registration metadata

## Backend API Structure

### Authentication Routes (/auth)
```
POST /login           - User authentication
POST /signup          - New user registration
GET  /me              - Current user profile
POST /waitlist        - Join waitlist
POST /waitlist/{id}/approve - Admin approve waitlist
GET  /users           - Admin list users
DELETE /users/{id}    - Admin delete user
```

### Flashcard Routes (/api/flashcards)
```
GET    /all           - List all accessible flashcards
POST   /              - Create new flashcard
GET    /stats         - User learning statistics
POST   /share         - Share flashcards with users
DELETE /{id}          - Delete flashcard
```

### Catalog Routes (/api/catalogs)
```
GET    /owned         - List user's catalogs
POST   /              - Create new catalog
GET    /{id}          - Get catalog details
PUT    /{id}          - Update catalog
DELETE /{id}          - Delete catalog
```

### Quiz Routes (/api/quizzes)
```
GET    /              - Get available quizzes
POST   /generate      - Generate new quiz
POST   /submit        - Submit quiz answers
GET    /history       - User quiz history
```

## Learning Algorithm Implementation

### Memory Strength Calculation
```python
def calculate_memory_strength(
    current_strength: float,
    quiz_score: float,
    time_since_review: timedelta
) -> float:
    decay = calculate_decay(current_strength, time_since_review)
    boost = calculate_boost(quiz_score)
    return min(100, decay + boost)
```

### Review Scheduling
- Based on memory strength
- Implements spaced repetition algorithm
- Adjusts to user performance
- Considers language difficulty

### Quiz Generation Rules
1. Word Recognition (Strength < 30)
2. Definition Matching (Strength 30-50)
3. Context Usage (Strength 50-70)
4. Advanced Applications (Strength > 70)

## Error Handling and Validation

### Request Validation
- Pydantic models for input validation
- Type checking and constraints
- Custom validators for business rules

### Error Responses
```json
{
  "detail": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "params": {}
  }
}
```

### Common Error Types
1. Authentication Errors (401, 403)
2. Validation Errors (422)
3. Not Found Errors (404)
4. Business Logic Errors (400)

## Database Migrations and Management

### Running Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Data Seeding
- Initial quiz types
- System languages
- Admin account
- Test data (development only)

## Performance Considerations

### Query Optimization
- Eager loading relationships
- Pagination for large datasets
- Indexed frequently queried fields
- Materialized views for statistics

### Caching Strategy
- Redis for session data
- Memory cache for static data
- Cache invalidation rules
- Cache warming procedures