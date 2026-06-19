// aiController.js
const { retrieveContext } = require('../utils/k12Dataset');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { extractTextFromFile, clampText } = require('../utils/textExtract');

const { addMaterialBlock, verifyMaterialChain } = require("../utils/blockchainLedger");

// ✅ Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Use the model from .env file - FIXED MODEL NAMES
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// ===== K-12 VALIDATION CONSTANTS =====
const VALID_GRADES = ['7', '8', '9', '10', '11', '12'];

// Strong indicators of elementary level
const ELEMENTARY_INDICATORS = [
  'grade 1', 'grade 2', 'grade 3', 'grade 4', 'grade 5', 'grade 6',
  'elementary school', 'primary school', 'kindergarten', 'preschool',
  'makabayan', 'mtb-mle', 'mother tongue'
];

// Strong indicators of university level
const UNIVERSITY_INDICATORS = [
  'university', 'college', 'undergraduate', 'graduate', 'postgraduate',
  'bachelor', 'master\'s', 'phd', 'doctorate', 'tertiary',
  'thesis', 'dissertation', 'research paper', 'journal article',
  'professor', 'lecture notes', 'textbook chapter'
];

// Advanced terminology that suggests college level
const ADVANCED_TERMS = [
  'quantum mechanics', 'organic chemistry', 'biochemistry',
  'molecular biology', 'neuroscience', 'immunology',
  'thermodynamics', 'electromagnetism', 'calculus iii',
  'linear algebra', 'differential equations', 'abstract algebra',
  'corporate finance', 'business strategy', 'supply chain management',
  'system administration', 'network security', 'database management',
  'data structures', 'algorithms', 'operating systems',
  'software engineering', 'computer architecture'
];

// High school appropriate topics (Grades 7-12)
const HIGH_SCHOOL_TOPICS = [
  'photosynthesis', 'cell', 'ecosystem', 'force', 'motion', 'energy',
  'atom', 'molecule', 'compound', 'element', 'periodic table',
  'newton', 'gravity', 'electricity', 'magnetism', 'wave', 'sound', 'light',
  'digestive system', 'respiratory system', 'circulatory system', 'nervous system',
  'quadratic', 'linear equation', 'polynomial', 'geometry', 'trigonometry',
  'probability', 'statistics', 'mean', 'median', 'mode',
  'verb', 'noun', 'adjective', 'adverb', 'grammar', 'comprehension',
  'essay', 'paragraph', 'theme', 'character', 'plot',
  'history', 'government', 'constitution', 'economics', 'geography',
  'matter', 'mixture', 'solution', 'acid', 'base', 'chemical reaction',
  'volcano', 'earthquake', 'weather', 'climate', 'rock', 'mineral',
  'reproduction', 'heredity', 'genetics', 'evolution',
  'fraction', 'decimal', 'percentage', 'ratio', 'proportion',
  'function', 'graph', 'equation', 'inequality'
];

// Philippine context keywords
const PH_CONTEXT_KEYWORDS = [
  'philippine', 'filipino', 'tagalog', 'deped', 'k-12', 'k to 12',
  'junior high school', 'senior high school', 'jhs', 'shs',
  'barangay', 'pilipinas', 'philippines', 'manila', 'cebu', 'davao',
  'araling panlipunan', 'filipino subject', 'mother tongue', 'melc',
  'most essential learning competency', 'department of education'
];

async function validateK12Content(text) {
  const lowerText = text.toLowerCase();
  
  // Check if content is too short
  if (text.length < 100) {
    return {
      isValid: false,
      reason: 'Content is too short to validate. Please provide more substantial material.'
    };
  }
  
  // ===== STEP 1: Check for CLEAR elementary indicators =====
  for (const term of ELEMENTARY_INDICATORS) {
    if (lowerText.includes(term)) {
      return {
        isValid: false,
        reason: '⚠️ This appears to be Elementary level content. LearnEase AI is designed for Junior High School (Grades 7-10) and Senior High School (Grades 11-12) only. Please upload materials appropriate for Grades 7-12.'
      };
    }
  }
  
  // ===== STEP 2: FIXED - More nuanced university detection =====
  // Don't flag scientific terms that are actually taught in high school
  
  // Only flag if MULTIPLE strong university indicators appear together
  let universityIndicatorCount = 0;
  for (const term of UNIVERSITY_INDICATORS) {
    if (lowerText.includes(term)) {
      universityIndicatorCount++;
    }
  }
  
  // Require at least 3 university indicators to flag (not just 1)
  if (universityIndicatorCount >= 3) {
    return {
      isValid: false,
      reason: '⚠️ This appears to contain University/College level content. LearnEase AI is designed for Philippine K-12 curriculum (Grades 7-12 only). Please upload appropriate high school materials.'
    };
  }
  
  // ===== STEP 3: FIXED - Advanced terms that are actually taught in high school =====
  // Create a separate list of terms that are OK for high school
  const HIGH_SCHOOL_ADVANCED_TERMS = [
    'photosynthesis', 'chloroplast', 'chlorophyll', 'thylakoid', 'stroma',
    'calvin cycle', 'light dependent', 'light independent', 'atp', 'nadph',
    'glucose', 'carbon dioxide', 'oxygen', 'mitochondria', 'nucleus',
    'dna', 'rna', 'protein', 'enzyme', 'catalyst', 'acid', 'base',
    'chemical reaction', 'equation', 'velocity', 'acceleration',
    'newton', 'gravity', 'magnetic', 'electric', 'circuit'
  ];
  
  // Check advanced terms but exclude high school appropriate ones
  let advancedTermCount = 0;
  for (const term of ADVANCED_TERMS) {
    // Skip if it's actually a high school term
    if (HIGH_SCHOOL_ADVANCED_TERMS.includes(term)) {
      continue;
    }
    if (lowerText.includes(term)) {
      advancedTermCount++;
    }
  }
  
  // Increase threshold to 3 for advanced terms
  if (advancedTermCount >= 3) {
    return {
      isValid: false,
      reason: '⚠️ This content contains terminology typically taught at the university level. LearnEase AI is designed for Philippine K-12 curriculum (Grades 7-12 only).'
    };
  }
  
  // ===== STEP 4: Check for explicit grade indicators =====
  for (const grade of VALID_GRADES) {
    if (lowerText.includes(`grade ${grade}`)) {
      return { isValid: true }; // Explicitly identified as K-12
    }
  }
  
  // ===== STEP 5: Check for Philippine context =====
  for (const keyword of PH_CONTEXT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return { isValid: true }; // Has Philippine context
    }
  }
  
  // ===== STEP 6: Count high school topics - LOWER THE THRESHOLD =====
  let topicCount = 0;
  for (const topic of HIGH_SCHOOL_TOPICS) {
    if (lowerText.includes(topic)) {
      topicCount++;
    }
  }
  
  // If there are ANY high school topics, consider it valid
  if (topicCount >= 1) {
    return { 
      isValid: true,
      message: 'Content contains high school level topics.'
    };
  }
  
  // ===== STEP 7: Check vocabulary complexity - MAKE MORE LENIENT =====
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    const words = text.split(/\s+/);
    const longWords = words.filter(w => w.length > 8).length;
    const longWordRatio = longWords / words.length;
    
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    // Increase thresholds - high school students can handle some complexity
    if (avgSentenceLength > 30 && longWordRatio > 0.3) {
      return {
        isValid: false,
        reason: '📚 This content appears to use very advanced vocabulary and sentence structures. Please add "Grade [7-12]" at the top of your notes to help us validate it.'
      };
    }
  }
  
  // ===== STEP 8: If we're not sure, check word count and basic indicators =====
  const wordCount = text.split(/\s+/).length;
  
  // If it's a reasonable length and has educational content, assume it's fine
  if (wordCount > 200 && (lowerText.includes('define') || lowerText.includes('explain') || 
      lowerText.includes('what is') || lowerText.includes('example'))) {
    return { isValid: true };
  }
  
  // ===== STEP 9: Last resort - ask for clarification but be more helpful =====
  return {
    isValid: true, // CHANGE THIS TO TRUE BY DEFAULT
    message: '📚 Content accepted. For best results, consider adding "Grade [7-12]" at the top.'
  };
}

// Helper function to detect grade and subject from content
function detectGradeAndSubject(text) {
  const lowerText = text.toLowerCase();
  
  // Detect grade
  let detectedGrade = '';
  for (let g = 7; g <= 12; g++) {
    if (lowerText.includes(`grade ${g}`) || lowerText.includes(`gr. ${g}`)) {
      detectedGrade = g.toString();
      break;
    }
  }
  
  // If no explicit grade, infer from content complexity
  if (!detectedGrade) {
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 300) detectedGrade = '7-8';
    else if (wordCount < 800) detectedGrade = '9-10';
    else detectedGrade = '11-12';
  }
  
  // Detect subject
  const subjects = {
    'mathematics': ['math', 'algebra', 'geometry', 'calculus', 'equation', 'number', 'fraction', 'quadratic', 'polynomial', 'trigonometry'],
    'science': ['science', 'biology', 'chemistry', 'physics', 'cell', 'ecosystem', 'energy', 'force', 'motion', 'atom', 'molecule'],
    'english': ['english', 'grammar', 'verb', 'noun', 'essay', 'reading', 'comprehension', 'literature', 'simile', 'metaphor'],
    'filipino': ['filipino', 'tagalog', 'pangngalan', 'pandiwa', 'sanaysay', 'tayutay', 'pang-uri', 'pang-abay'],
    'araling panlipunan': ['panlipunan', 'history', 'heograpiya', 'kolonyalismo', 'imperyalismo', 'asean', 'kabihasnan', 'rebolusyon']
  };
  
  let detectedSubject = '';
  for (const [subject, keywords] of Object.entries(subjects)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detectedSubject = subject;
      break;
    }
  }
  
  // Detect main topic (first substantial sentence)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  let topic = sentences[0]?.substring(0, 60) + '...' || 'Study Material';
  
  return {
    grade: detectedGrade,
    subject: detectedSubject,
    topic
  };
}

function buildSystemPrompt({ grade, subject, contextItems }) {
  const base = [
    'You are LearnEase AI, a helpful tutor for Philippine Junior High School (JHS) and Senior High School (SHS) students.',
    'You MUST ONLY provide information appropriate for Grades 7-12 following the Philippine DepEd K-12 curriculum.',
    'If the user asks about topics outside Grades 7-12, politely explain it is beyond the K-12 curriculum.',
    'Explain in clear, step-by-step terms. Use simple English and avoid unnecessary jargon.',
    'When giving definitions, include examples relevant to Filipino students.',
    'Never claim you accessed the internet or school LMS. You only know what the user says and the provided dataset snippets.'
  ];

  if (grade) {
    if (VALID_GRADES.includes(grade)) {
      base.push(`Target grade level: Grade ${grade}.`);
    } else {
      base.push(`Note: Grade ${grade} is outside K-12. Focus on Grade 7-12 appropriate content.`);
    }
  }
  
  if (subject) base.push(`Subject focus: ${subject}.`);

  if (contextItems?.length) {
    base.push('Curriculum-aligned reference materials:');
    contextItems.forEach((c, i) => {
      base.push(`(${i + 1}) [Grade ${c.grade} - ${c.subject}] Q: ${c.question} A: ${c.answer}`);
    });
  }

  return base.join('\n');
}

// POST /api/ai/chat
async function chat(req, res) {
  try {
    console.log('='.repeat(50));
    console.log('CHAT REQUEST RECEIVED');
    console.log('='.repeat(50));
    
    const { message, history = [], grade = null, subject = null } = req.body || {};

    const userMessage = String(message || '').trim();
    if (!userMessage) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    // Validate grade if provided
    if (grade && !VALID_GRADES.includes(grade)) {
      return res.status(400).json({
        success: false,
        error: `Grade ${grade} is not within the Philippine K-12 curriculum. Please specify a grade between 7-12.`
      });
    }

    // Get context from dataset
    const contextItems = retrieveContext(userMessage, 3);
    const system = buildSystemPrompt({ grade, subject, contextItems });

    try {
      const modelName = DEFAULT_MODEL.replace('models/', '');
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        }
      });

      // Prepare conversation
      const conversationHistory = [];
      
      conversationHistory.push({
        role: "user",
        parts: [{ text: `System context: ${system}` }]
      });
      conversationHistory.push({
        role: "model",
        parts: [{ text: "I understand. I'll help with K-12 appropriate content." }]
      });

      if (history && history.length > 0) {
        history.forEach((msg) => {
          if (msg.role === 'user') {
            conversationHistory.push({
              role: "user",
              parts: [{ text: msg.content || msg.text || '' }]
            });
          } else if (msg.role === 'assistant' || msg.role === 'model') {
            conversationHistory.push({
              role: "model",
              parts: [{ text: msg.content || msg.text || '' }]
            });
          }
        });
      }

      conversationHistory.push({
        role: "user",
        parts: [{ text: userMessage }]
      });

      const result = await model.generateContent({
        contents: conversationHistory
      });

      const response = result.response;
      const text = response.text();

      return res.json({
        success: true,
        data: {
          reply: text,
          usedDataset: Boolean(contextItems.length),
          context: contextItems
        }
      });

    } catch (geminiError) {
      console.error('❌ Gemini API error:', geminiError);
      return res.status(500).json({
        success: false,
        error: 'AI service temporarily unavailable. Please try again.'
      });
    }

  } catch (err) {
    console.error('❌ AI chat error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'AI service error'
    });
  }
}

// POST /api/ai/quiz
async function quiz(req, res) {
  try {
    const { topic, grade = null, subject = null, count = 10, difficulty = 'intermediate', types = ['multiple-choice'] } = req.body || {};

    if (!topic) {
      return res.status(400).json({ success: false, error: 'topic is required' });
    }

    // Validate grade if provided
    if (grade && !VALID_GRADES.includes(grade)) {
      return res.status(400).json({
        success: false,
        error: `Grade ${grade} is not within the Philippine K-12 curriculum. Please specify a grade between 7-12.`
      });
    }

    const contextItems = retrieveContext(topic, 3);
    
    const prompt = [
      `Create a ${count}-item quiz about: "${topic}".`,
      `Difficulty: ${difficulty}.`,
      `Target grade level: ${grade || '7-12'}.`,
      `Question types: ${types.join(', ')}.`,
      'IMPORTANT: This quiz must be appropriate for Philippine K-12 curriculum (Grades 7-12).',
      '',
      'Return ONLY valid JSON with this structure:',
      '{',
      '  "title": "Quiz Title",',
      '  "items": [',
      '    {',
      '      "type": "multiple-choice",',
      '      "question": "Question text?",',
      '      "choices": ["A", "B", "C", "D"],',
      '      "answer": "A",',
      '      "explanation": "Explanation"',
      '    }',
      '  ]',
      '}',
    ].join('\n');

    try {
      const modelName = DEFAULT_MODEL.replace('models/', '');
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      if (!parsed || !parsed.items) {
        return res.status(502).json({ success: false, error: 'Failed to generate valid quiz format' });
      }

      return res.json({
        success: true,
        data: {
          quiz: parsed,
          usedDataset: Boolean(contextItems.length),
          context: contextItems
        }
      });

    } catch (geminiError) {
      console.error('❌ Gemini quiz error:', geminiError);
      return res.status(500).json({ success: false, error: 'Quiz generation temporarily unavailable' });
    }

  } catch (err) {
    console.error('❌ AI quiz error:', err);
    return res.status(500).json({ success: false, error: err.message || 'AI quiz failed' });
  }
}

// POST /api/ai/validate-content
async function validateContent(req, res) {
  let tempPath = null;

  try {
    console.log('='.repeat(50));
    console.log('VALIDATE CONTENT REQUEST RECEIVED');
    console.log('='.repeat(50));
    
    let extracted = '';

    if (req.file && req.file.path) {
      tempPath = req.file.path;
      console.log('📄 File uploaded:', req.file.originalname);
      extracted = await extractTextFromFile(req.file.path, req.file.originalname);
    }

    extracted = clampText(extracted, 18000);

    if (!extracted || extracted.length < 30) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a file with sufficient content (at least ~30 characters).'
      });
    }

    // Validate content against K-12 curriculum
    const validation = await validateK12Content(extracted);
    
    // Detect grade and subject from content
    const detection = detectGradeAndSubject(extracted);

    return res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        message: validation.isValid ? '✅ This content is appropriate for K-12 learning!' : validation.reason,
        extractedText: extracted.substring(0, 500), // Send preview only
        detectedGrade: detection.grade,
        detectedSubject: detection.subject,
        topic: detection.topic
      }
    });

  } catch (err) {
    console.error('❌ Validate content error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Validation failed'
    });
  } finally {
    if (tempPath) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
  }
}

// POST /api/ai/quiz-from-file
async function quizFromFile(req, res) {
  let tempPath = null;

  try {
    const { count = 10, difficulty = 'intermediate', types = '[]', timeLimit, extractedText } = req.body;
    const questionTypes = JSON.parse(types);
    
    let extracted = extractedText || '';

    if (req.file && req.file.path) {
      tempPath = req.file.path;
      extracted = await extractTextFromFile(req.file.path, req.file.originalname);
    }

    extracted = clampText(extracted, 18000);

    if (!extracted || extracted.length < 30) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a file with sufficient content.'
      });
    }

    // Validate content
    const validation = await validateK12Content(extracted);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.reason
      });
    }

    const detection = detectGradeAndSubject(extracted);

    const prompt = [
      'Create a quiz based on the following study material.',
      `Number of questions: ${count}`,
      `Difficulty: ${difficulty}`,
      `Question types: ${questionTypes.join(', ')}`,
      `${timeLimit ? `Time limit: ${timeLimit} minutes` : 'No time limit'}`,
      'IMPORTANT: This quiz must be appropriate for Philippine K-12 curriculum (Grades 7-12).',
      '',
      'Return ONLY valid JSON with this structure:',
      '{',
      '  "title": "Quiz Title",',
      '  "items": [',
      '    {',
      '      "type": "multiple-choice",',
      '      "question": "Question text?",',
      '      "choices": ["A", "B", "C", "D"],',
      '      "answer": "A",',
      '      "explanation": "Explanation"',
      '    }',
      '  ]',
      '}',
      '',
      'STUDY MATERIAL:',
      extracted
    ].join('\n');

    const modelName = DEFAULT_MODEL.replace('models/', '');
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {}
      }
    }

    if (!parsed || !parsed.items) {
      return res.status(502).json({
        success: false,
        error: 'Failed to generate valid quiz format'
      });
    }

    return res.json({
      success: true,
      data: {
        quiz: {
          ...parsed,
          grade: detection.grade,
          subject: detection.subject,
          sourceFile: req.file?.originalname || 'uploaded file'
        }
      }
    });

  } catch (err) {
    console.error('❌ Quiz from file error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Quiz generation failed'
    });
  } finally {
    if (tempPath) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
  }
}

// POST /api/ai/reviewer
async function reviewer(req, res) {
  let tempPath = null;

  try {
    const { text, grade = null, subject = null, mode = "reviewer" } =
      req.body || {};

    if (req.file) {
      tempPath = req.file.path;
    }

    let content = "";

    if (tempPath) {
      content = await extractTextFromFile(tempPath, req.file?.originalname);
    } else {
      content = String(text || "");
    }

    content = clampText(content, 20000);

    if (!content.trim()) {
      return res.status(400).json({
        success: false,
        error:
          "Content Not Suitable. Please provide a file with sufficient content."
      });
    }

    // -------------------------
    // VALIDATE CONTENT
    // -------------------------
    const validation = await validateK12Content(content);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.reason
      });
    }

    const detected = detectGradeAndSubject(content);
    const finalGrade = grade || detected.grade || null;
    const finalSubject = subject || detected.subject || null;

    const contextItems = retrieveContext(content.slice(0, 800), 3);
    const system = buildSystemPrompt({
      grade: finalGrade,
      subject: finalSubject,
      contextItems
    });

    const prompt = [
      `System context: ${system}`,
      "",
      "Create a structured reviewer from the content below.",
      "Return ONLY valid JSON. No markdown. No extra explanation.",
      "",
      "Schema:",
      "{",
      '  "title": "string",',
      '  "summary": "string",',
      '  "keyConcepts": ["string"],',
      '  "sections": [',
      "    {",
      '      "title": "string",',
      '      "bullets": ["string"]',
      "    }",
      "  ],",
      '  "flashcards": [',
      "    {",
      '      "q": "string",',
      '      "a": "string"',
      "    }",
      "  ]",
      "}",
      "",
      "Rules:",
      "- summary: 3–5 sentences",
      "- keyConcepts: 5–10 items",
      "- sections: 3–6 sections",
      "- each section: 3–6 bullets",
      "- flashcards: 5–10 items",
      "- explanation must be appropriate for Philippine Grades 7–12",
      "",
      "CONTENT:",
      content
    ].join("\n");

    const modelName = DEFAULT_MODEL.replace("models/", "");

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 4096
      }
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    let parsed = null;

    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {}
      }
    }

    if (!parsed || !parsed.title) {
      return res.status(502).json({
        success: false,
        error: "Failed to generate valid reviewer format"
      });
    }

    // -------------------------
    // CREATE BLOCKCHAIN RECORD
    // ONLY AFTER reviewer is successfully generated
    // THEN automatically verify the chain
    // -------------------------
    let blockchainRecord = null;
    let blockchainVerification = null;

    try {
      const fileName = req.file ? req.file.originalname : "text-input";

      // record the final reviewer content
      const finalizedReviewerContent = JSON.stringify(parsed);

      blockchainRecord = addMaterialBlock(
        fileName,
        finalizedReviewerContent
      );

      // automatic tamper verification right after block creation
      blockchainVerification = verifyMaterialChain();

      console.log("Blockchain record created:", blockchainRecord);

      if (blockchainVerification.valid) {
        console.log("✅ Blockchain integrity verified.");
      } else {
        console.log("⚠️ BLOCKCHAIN TAMPERING DETECTED!");
        console.log(blockchainVerification.message);
      }

    } catch (blockErr) {
      console.warn("Blockchain failed:", blockErr.message);
    }

    // -------------------------

    return res.json({
      success: true,
      data: {
        reviewer: parsed,
        usedDataset: Boolean(contextItems.length),
        context: contextItems,
        blockchain: blockchainRecord,
        blockchainVerification,
        detectedGrade: detected.grade,
        detectedSubject: detected.subject,
        topic: detected.topic
      }
    });

  } catch (err) {
    console.error("AI reviewer error:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "AI reviewer failed"
    });

  } finally {
    if (tempPath) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
  }
}

module.exports = { 
  chat, 
  quiz, 
  reviewer,
  validateContent,
  quizFromFile 
};