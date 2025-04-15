# Text to Database Ingestion Process

## Overview
This document outlines the process of ingesting words from a text file into the database as flashcards. The process includes validation using OpenAI's LLM capabilities and batched processing with concurrency control.

## Prerequisites
- OpenAI API key configured in environment variables
- Database connection established
- User authentication completed

## Environment Variables
```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini  # Default model
OPENAI_CONCURRENT_REQUESTS=5  # Default concurrent request limit
```

## Ingestion Steps

### 1. Text File Upload and Extraction
**Endpoint**: `POST /api/words/txt/extract`
- Accepts a `.txt` file upload
- Reads and processes the file content
- Extracts unique words/phrases
- Removes duplicates and empty lines
- Returns list of extracted words

### 2. Word Validation
**Endpoint**: `POST /api/words/validate`
- Takes the list of extracted words
- Processes words in batches of 10
- Uses OpenAI LLM to validate words/phrases
- Concurrent processing with semaphore control
- Returns list of valid words

### 3. Flashcard Generation
**Endpoint**: `POST /api/words/generate-flashcards`
- Takes the list of valid words
- Processes words in batches of 10
- Uses OpenAI LLM to generate definitions
- Concurrent processing with semaphore control
- Returns flashcards with front (word) and back (definition)

### 4. Duplicate Check
**Endpoint**: `POST /api/words/check-duplicates`
- Takes the list of words
- Checks against user's existing flashcards
- Returns list of duplicates if any exist
- Helps prevent duplicate entries

### 5. Database Import
**Endpoint**: `POST /api/words/import`
- Takes list of words and optional catalog IDs
- Creates flashcard entries in database
- Associates flashcards with specified catalogs
- Associates flashcards with current user
- Returns import status and count

## Concurrency Control
- Semaphore limits concurrent OpenAI API requests
- Default limit: 5 concurrent requests
- Configurable via environment variable
- Prevents API rate limit issues
- Ensures efficient batch processing

## Error Handling
- File format validation (.txt only)
- OpenAI API error handling
- Database transaction rollback on error
- Duplicate entry prevention
- User authentication validation

## Example Flow
1. User uploads words.txt
2. System extracts unique words
3. System validates words through OpenAI
4. System generates flashcard definitions
5. System checks for duplicates
6. User confirms import
7. System saves to database

## API Response Formats

### Extract Response
```json
{
    "words": ["word1", "word2", "word3"]
}
```

### Validation Response
```json
{
    "valid_words": ["word1", "word2"]
}
```

### Flashcard Generation Response
```json
{
    "flashcards": [
        {
            "front": "word1",
            "back": "definition1"
        },
        {
            "front": "word2",
            "back": "definition2"
        }
    ]
}
```

### Duplicate Check Response
```json
{
    "duplicates": ["word1"],
    "has_duplicates": true
}
```

### Import Response
```json
{
    "status": "success",
    "imported_count": 2,
    "imported_words": ["word1", "word2"]
}
```

## Performance Considerations
- Batch processing of 10 words per API call
- Concurrent processing with semaphore control
- Deduplication before processing
- Database transaction management
- Rate limit awareness

## Security
- User authentication required
- Owner-based access control
- Environment variable configuration
- Input validation and sanitization
- Secure API key handling