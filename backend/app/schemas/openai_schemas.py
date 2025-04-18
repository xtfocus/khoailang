"""Schemas for OpenAI API requests"""

# Schema for word validation
VALIDATE_SCHEMA = {
    "type": "object",
    "properties": {"valid_words": {"type": "array", "items": {"type": "string"}}},
    "required": ["valid_words"],
    "additionalProperties": False,
}

# Schema for flashcard generation
FLASHCARD_SCHEMA = {
    "type": "object",
    "properties": {
        "flashcards": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "front": {"type": "string"},
                    "back": {"type": "string"},
                },
                "required": ["front", "back"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["flashcards"],
    "additionalProperties": False,
}

# Schema for word type detection
WORD_TYPE_SCHEMA = {
    "type": "object",
    "properties": {
        "type": {"type": "string", "enum": ["word", "phrase"]},
    },
    "required": ["type"],
    "additionalProperties": False,
}

# Schema for word relations (synonyms/antonyms)
WORD_RELATIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "synonyms": {"type": "array", "items": {"type": "string"}},
        "antonyms": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["synonyms", "antonyms"],
    "additionalProperties": False,
}

# Schema for related phrases
RELATED_PHRASES_SCHEMA = {
    "type": "object",
    "properties": {
        "phrases": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["phrases"],
    "additionalProperties": False,
}

# Schemas for different quiz types
QUIZ_TYPE_SCHEMAS = {
    "Definition-to-Word (Multiple-Choice)": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {"type": "array", "items": {"type": "string"}},
            "correct_answer": {"type": "string"},
        },
        "required": ["question", "choices", "correct_answer"],
        "additionalProperties": False,
    },
    "Word-to-Definition (Multiple-Choice)": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {"type": "array", "items": {"type": "string"}},
            "correct_answer": {"type": "string"},
        },
        "required": ["question", "choices", "correct_answer"],
        "additionalProperties": False,
    },
    "Synonym Selection (Multiple-Choice)": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {"type": "array", "items": {"type": "string"}},
            "correct_answer": {"type": "string"},
        },
        "required": ["question", "choices", "correct_answer"],
        "additionalProperties": False,
    },
    "Antonym Selection (Multiple-Choice)": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {"type": "array", "items": {"type": "string"}},
            "correct_answer": {"type": "string"},
        },
        "required": ["question", "choices", "correct_answer"],
        "additionalProperties": False,
    },
    "Open-Ended Cloze (Cloze)": {
        "type": "object",
        "properties": {
            "sentence": {"type": "string"},
            "correct_answer": {"type": "string"},
            "hint": {"type": "string"},
        },
        "required": ["sentence", "correct_answer", "hint"],
        "additionalProperties": False,
    },
    "Multiple-Choice Cloze (Multiple-Choice)": {
        "type": "object",
        "properties": {
            "sentence": {"type": "string"},
            "choices": {"type": "array", "items": {"type": "string"}},
            "correct_answer": {"type": "string"},
        },
        "required": ["sentence", "choices", "correct_answer"],
        "additionalProperties": False,
    },
    "Scenario Identification (Multiple-Choice)": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {"type": "array", "items": {"type": "string"}},
            "correct_answer": {"type": "string"},
        },
        "required": ["question", "choices", "correct_answer"],
        "additionalProperties": False,
    },
    "Word to Proverb (Multiple-Choice)": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {"type": "array", "items": {"type": "string"}},
            "correct_answer": {"type": "string"},
        },
        "required": ["question", "choices", "correct_answer"],
        "additionalProperties": False,
    },
    "Proverb to Word (Multiple-Choice)": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {"type": "array", "items": {"type": "string"}},
            "correct_answer": {"type": "string"},
        },
        "required": ["question", "choices", "correct_answer"],
        "additionalProperties": False,
    },
    "Proverb to Word (Cloze)": {
        "type": "object",
        "properties": {
            "proverb": {"type": "string"},
            "correct_answer": {"type": "string"},
            "hint": {"type": "string"},
        },
        "required": ["proverb", "correct_answer", "hint"],
        "additionalProperties": False,
    },
    "Meaning Validation (True/False)": {
        "type": "object",
        "properties": {
            "statement": {"type": "string"},
            "correct_answer": {"type": "boolean"},
        },
        "required": ["statement", "correct_answer"],
        "additionalProperties": False,
    },
    "Usage Validation (True/False)": {
        "type": "object",
        "properties": {
            "statement": {"type": "string"},
            "correct_answer": {"type": "boolean"},
        },
        "required": ["statement", "correct_answer"],
        "additionalProperties": False,
    },
}