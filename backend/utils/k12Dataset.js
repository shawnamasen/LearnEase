// k12Dataset.js
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

let _rows = null;

function loadDatasetOnce() {
  if (_rows) return _rows;
  
  try {
    // Look for the CSV file in the backend/data directory
    const filePath = path.join(__dirname, '..', 'data', 'DepEd_K12_Grades7-12_FULL_AI_QA_Dataset (1).csv');
    
    if (!fs.existsSync(filePath)) {
      console.warn('Dataset file not found at:', filePath);
      _rows = [];
      return _rows;
    }

    const results = [];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Simple CSV parsing (for production, use a proper CSV parser)
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= 5) {
        results.push({
          grade: values[0],
          subject: values[1],
          learningArea: values[2],
          question: values[3],
          answer: values[4]
        });
      }
    }
    
    console.log(`Loaded ${results.length} items from dataset`);
    _rows = results;
    return _rows;
    
  } catch (e) {
    console.error('Dataset load error:', e);
    _rows = [];
    return _rows;
  }
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Ignore very short words
}

function score(queryTokens, row) {
  const haystack = tokenize(`${row.subject} ${row.learningArea || ''} ${row.question} ${row.answer}`);
  if (!haystack.length) return 0;
  
  const set = new Set(haystack);
  let hits = 0;
  for (const token of queryTokens) {
    if (set.has(token)) hits++;
  }
  
  return hits / Math.max(queryTokens.length, 1);
}

function retrieveContext(query, k = 3) {
  const rows = loadDatasetOnce();
  if (!rows.length) return [];
  
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const scored = rows
    .map(row => ({
      row,
      score: score(queryTokens, row)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(item => ({
      grade: item.row.grade,
      subject: item.row.subject,
      learningArea: item.row.learningArea,
      question: item.row.question,
      answer: item.row.answer
    }));

  console.log(`Retrieved ${scored.length} context items for query: "${query.substring(0, 50)}..."`);
  return scored;
}

module.exports = {
  loadDatasetOnce,
  retrieveContext
};