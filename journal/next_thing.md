# 1. Database Schema Updates

## 1.1 Add Author and Visibility to Flashcards
```sql
ALTER TABLE flashcards ADD COLUMN author_id INTEGER REFERENCES users(id);
ALTER TABLE flashcards ADD COLUMN visibility VARCHAR(20) CHECK (visibility IN ('private', 'public', 'shared'));
ALTER TABLE flashcards ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
```

## 1.2 Create Flashcard Sharing Table
```sql
CREATE TABLE flashcard_shares (
    flashcard_id INTEGER REFERENCES flashcards(id) ON DELETE CASCADE,
    shared_with_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    can_modify BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (flashcard_id, shared_with_id)
);
```

## 1.3 Create Catalogs Tables
```sql
CREATE TABLE catalogs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    visibility VARCHAR(20) CHECK (visibility IN ('private', 'public', 'shared')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE catalog_flashcards (
    catalog_id INTEGER REFERENCES catalogs(id) ON DELETE CASCADE,
    flashcard_id INTEGER REFERENCES flashcards(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (catalog_id, flashcard_id)
);

CREATE TABLE catalog_shares (
    catalog_id INTEGER REFERENCES catalogs(id) ON DELETE CASCADE,
    shared_with_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    can_modify BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (catalog_id, shared_with_id)
);
```

## 1.4 Create User Settings Table
```sql
CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    allow_duplicates BOOLEAN DEFAULT false,
    default_visibility VARCHAR(20) DEFAULT 'private',
    preferred_languages TEXT[] DEFAULT '{}',
    ui_preferences JSONB DEFAULT '{}'
);
```

# 2. Implementation Plan

## Phase 1: Core Flashcard Management
1. Update flashcard creation endpoints to include author and visibility
2. Implement flashcard sharing functionality
3. Add endpoints for managing flashcard visibility and sharing
4. Create flashcard search/filter endpoints

## Phase 2: Catalog System
1. Create CRUD endpoints for catalogs
2. Implement catalog sharing functionality
3. Add endpoints for managing flashcards within catalogs
4. Ensure word uniqueness within catalogs
5. Implement catalog search/filter functionality

## Phase 3: Word Population Features
1. Implement single word entry endpoint
2. Create bulk import functionality
   - File upload processing
   - Duplicate detection
   - Preview generation
2. Develop intelligent extraction system
   - Document processing endpoint
   - Word extraction logic
   - Context preservation
3. Build word recommendation system
   - Integration with LLM for suggestions
   - Topic-based word generation

## Phase 4: User Settings & Preferences
1. Create user settings management endpoints
2. Implement global duplicate handling preferences
3. Add language preferences management
4. Build UI preferences storage system

# 3. API Endpoints to Create

## 3.1 Flashcard Management
```
POST /api/flashcards/create
POST /api/flashcards/bulk-create
PUT /api/flashcards/{id}
DELETE /api/flashcards/{id}
GET /api/flashcards/search
POST /api/flashcards/{id}/share
```

## 3.2 Catalog Management
```
POST /api/catalogs
GET /api/catalogs
PUT /api/catalogs/{id}
DELETE /api/catalogs/{id}
POST /api/catalogs/{id}/flashcards
DELETE /api/catalogs/{id}/flashcards/{flashcard_id}
POST /api/catalogs/{id}/share
```

## 3.3 Word Population
```
POST /api/words/extract
POST /api/words/suggest
POST /api/words/import
GET /api/words/check-duplicates
```

## 3.4 User Settings
```
GET /api/settings
PUT /api/settings
GET /api/settings/languages
PUT /api/settings/languages
```

# 4. Next Steps

1. **Start with Database Updates**
   - Create migration scripts for new tables
   - Update existing tables with new columns
   - Add necessary indexes

2. **Core Functionality**
   - Basic flashcard CRUD with author tracking
   - Simple catalog management
   - User settings storage

3. **Advanced Features**
   - Word extraction system
   - Sharing functionality
   - Duplicate management
   - Catalog word uniqueness enforcement

4. **Integration Features**
   - Quiz system integration
   - Progress tracking updates
   - Search and filter capabilities

Some of the things to be done will be dummy (things that require intelligent)
