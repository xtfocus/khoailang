#!/bin/bash

# List of tables to check
tables=("flashcards" "user_flashcards" "quiz_types" "quizzes" "chatbot_interactions" "languages")

# Database credentials
DB_USER="postgres"
DB_NAME="cerego"

# Loop through each table
for table in "${tables[@]}"; do
  echo "Checking schema for table: $table"
  
  # Run the psql command to get the schema
  output=$(docker-compose exec db psql -U "$DB_USER" -d "$DB_NAME" -c "\d+ $table" 2>&1)
  
  # Check if the table exists
  if echo "$output" | grep -q "Did not find any relation"; then
    echo "Table $table does not exist."
  else
    echo "$output"
  fi
  
  echo "-----------------------------------"
done
