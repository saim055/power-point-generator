import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import Groq from 'groq-sdk';
import PptxGenJS from 'pptxgenjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
let GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ || 'dummy-key';
try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const line = envContent.split('\n')
      .find(l => l.trim().startsWith('GROQ_API_KEY=') || l.trim().startsWith('GROQ='));
    if (line) {
      const value = line.split('=')[1]?.trim();
      if (value) {
        GROQ_API_KEY = value;
      }
    }
  }
} catch (e) {
  console.log('Error reading .env file:', e.message);
}
console.log('Using GROQ API key dummy:', GROQ_API_KEY === 'dummy-key');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const isProd = process.env.NODE_ENV === 'production';

// Initialize Groq for AI
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Middleware
app.use(cors(
  isProd
    ? { origin: true, credentials: true }
    : { origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'], credentials: true }
));
app.options('*', cors());
app.use(express.json());

// File upload setup
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('word') || file.originalname.match(/\.(doc|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Word documents (.doc, .docx) are allowed'));
    }
  }
});

// Ensure directories exist
['uploads', 'downloads'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Base44 API Endpoints
app.post('/api/apps/public/prod/public-settings/by-id/:appId', (req, res) => {
  res.json({ id: req.params.appId, public_settings: { require_auth: false, app_name: "Power Base" } });
});

app.post('/api/auth/me', (req, res) => {
  res.json({ id: 'demo-user', name: 'Demo User', email: 'demo@powerbase.com' });
});

app.get('/api/integrations/core/test-groq', async (req, res) => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'dummy-key') {
    return res.status(400).json({ ok: false, reason: 'no-valid-key' });
  }
  try {
    const result = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a minimal health check.' },
        { role: 'user', content: 'Reply with OK only.' }
      ],
      max_tokens: 5
    });
    const content = result.choices?.[0]?.message?.content || '';
    res.json({ ok: true, content });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error.message || error) });
  }
});

app.post('/api/integrations/core/upload-file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ file_url: `/uploads/${req.file.filename}` });
});

// IMPROVED EXTRACTION LOGIC
app.post('/api/integrations/core/extract-data', async (req, res) => {
  try {
    const { file_url } = req.body;
    const filePath = path.join(__dirname, file_url);
    const dataBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    const text = result.value;
    
    // Define headers to stop at
    const stopHeaders = [
      'Learning Objectives', 'Objectives', 'Success Criteria', 'Keywords', 'Vocabulary', 
      'Skills', 'Links', 'Engage', 'Starter', 'Explore', 'Explain', 'Elaborate', 
      'Evaluate', 'Assessment', 'Plenary', 'Review', 'UAE',
      'RESOURCES REQUIRED', 'Resources Required', 'Resources',
      'Moral Education', 'My Identity', 'Environment/Sustainability',
      'ALN', 'ALP', 'ALN (ALP)'
    ];

    const extractedData = {
      // Keep topic short: first line/sentence only
      topic: extractSection(text, ['topic', 'subject', 'title'], stopHeaders, {
        maxLength: 150,
        firstLineOnly: true
      }) || 'Lesson Topic',
      // Subject/grade are better edited manually
      subject: extractSection(text, ['subject', 'course'], stopHeaders, {
        maxLength: 80,
        firstLineOnly: true
      }),
      grade: extractSection(text, ['grade', 'level'], stopHeaders, {
        maxLength: 40,
        firstLineOnly: true
      }),
      objectives: extractSection(text, ['objectives', 'learning objectives', 'aims'], stopHeaders, {
        maxLength: 800
      }),
      success_criteria: extractSection(text, ['success criteria', 'learning outcomes', 'checklist'], stopHeaders, {
        maxLength: 800
      }),
      keywords: extractSection(text, ['keywords', 'vocabulary'], stopHeaders, {
        maxLength: 400
      }),
      skills: extractSection(text, ['skills', 'competencies'], stopHeaders, {
        maxLength: 400
      }),
      links_subjects: extractSection(text, ['links', 'connections', 'subjects'], stopHeaders, {
        maxLength: 400
      }),
      uae_link: extractSection(text, ['uae', 'local context'], stopHeaders, {
        maxLength: 600
      }),
      engage_content: extractSection(text, ['starter', 'engage', 'introduction'], stopHeaders, {
        maxLength: 1200
      }),
      explore_content: extractSection(text, ['explore', 'investigation'], stopHeaders, {
        maxLength: 1200
      }),
      explain_content: extractSection(text, ['teaching', 'explain', 'instruction'], stopHeaders, {
        maxLength: 1200
      }),
      elaborate_content: extractSection(text, ['elaborate', 'extend', 'application'], stopHeaders, {
        maxLength: 1600
      }),
      evaluate_content: extractSection(text, ['evaluate', 'assessment', 'check'], stopHeaders, {
        maxLength: 1600
      }),
      plenary_content: extractSection(text, ['plenary', 'review', 'conclusion'], stopHeaders, {
        maxLength: 1000
      })
    };

    // Fallbacks: ensure Engage slide has content if possible
    if (!extractedData.engage_content && extractedData.objectives) {
      const firstBlock = extractedData.objectives.split(/\n{2,}/)[0] || extractedData.objectives;
      extractedData.engage_content = firstBlock.slice(0, 800).trim();
    }
    // AI enhancement if available (but clamp its output so it cannot copy whole lesson)
    let finalData = extractedData;
    if (GROQ_API_KEY && GROQ_API_KEY !== 'dummy-key') {
      try {
        const enhanced = await enhanceWithAI(text, extractedData);
        finalData = { ...extractedData };
        const richKeys = [
          'objectives',
          'success_criteria',
          'keywords',
          'skills',
          'links_subjects',
          'uae_link',
          'engage_content',
          'explore_content',
          'explain_content',
          'elaborate_content',
          'evaluate_content',
          'plenary_content'
        ];
        const limits = {
          objectives: 800,
          success_criteria: 800,
          keywords: 400,
          skills: 400,
          links_subjects: 400,
          uae_link: 600,
          engage_content: 1200,
          explore_content: 1200,
          explain_content: 1200,
          elaborate_content: 1600,
          evaluate_content: 1600,
          plenary_content: 1000
        };
        richKeys.forEach((key) => {
          const val = enhanced && typeof enhanced[key] === 'string' ? enhanced[key].trim() : '';
          if (val) {
            const maxLen = limits[key] || 800;
            finalData[key] = val.length > maxLen ? val.slice(0, maxLen).trim() : val;
          }
        });
        // Topic: allow AI to refine only if short and single-line
        if (enhanced && typeof enhanced.topic === 'string') {
          const t = enhanced.topic.trim();
          if (t && t.length <= 150 && !t.includes('\n')) {
            finalData.topic = t;
          }
        }
      } catch (aiError) {
        console.log('AI enhancement failed, using base data');
      }
    }
    
    // Normalize objectives/success criteria/keywords etc. to keep structure clean
    finalData = normalizeLessonData(finalData);

    res.json({ status: 'success', output: finalData });
    fs.unlinkSync(filePath);
  } catch (error) {
    res.status(500).json({ status: 'error', details: error.message });
  }
});

// ULTIMATE PPT GENERATION FIX (CONTENT + NO CORRUPTION)
app.post('/api/generate-ppt', async (req, res) => {
  try {
    const d = req.body;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    
    // COLORS FROM FRONTEND
    const COLOR_PRIMARY = '1E3A5F';   // Dark Blue
    const COLOR_SECONDARY = '00B4A0'; // Teal
    const COLOR_ACCENT = 'F5A623';    // Orange
    const COLOR_TEXT = '363636';
    const COLOR_WHITE = 'FFFFFF';
    const COLOR_BG = 'F3F4F6';

    // Helper for Logo (Fixed at extreme left top)
    const addLogo = (slide, size = 0.8) => {
      // Use the permanent school logo PNG if it exists in the public folder, otherwise use user provided logo URL
      const permanentPng = path.join(process.cwd(), 'public', 'school_logo.png');
      const logoPath = fs.existsSync(permanentPng) ? permanentPng : d.school_logo_url;
      
      if (logoPath) {
        try {
          // If it's a local file path, we can read it as base64 for better compatibility
          if (fs.existsSync(logoPath)) {
            const imageBuffer = fs.readFileSync(logoPath);
            const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
            slide.addImage({ data: base64Image, x: 0.1, y: 0.1, w: size, h: size });
          } else {
            slide.addImage({ path: logoPath, x: 0.1, y: 0.1, w: size, h: size });
          }
        } catch (e) {
          console.error('Logo add failed:', e);
          slide.addShape(pptx.ShapeType.ellipse, { x: 0.1, y: 0.1, w: size, h: size, fill: { color: COLOR_PRIMARY } });
          slide.addText('S', { x: 0.1, y: 0.1, w: size, h: size, fontSize: size * 30, color: COLOR_WHITE, align: 'center', valign: 'middle', bold: true });
        }
      } else {
        slide.addShape(pptx.ShapeType.ellipse, { x: 0.1, y: 0.1, w: size, h: size, fill: { color: COLOR_PRIMARY } });
        slide.addText('S', { x: 0.1, y: 0.1, w: size, h: size, fontSize: size * 30, color: COLOR_WHITE, align: 'center', valign: 'middle', bold: true });
      }
    };

    // 1. SLIDE OVERVIEW (Matches SlideOverview.jsx)
    let s1 = pptx.addSlide();
    s1.background = { color: COLOR_BG };
    
    // Header Bar
    s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: COLOR_PRIMARY } });
    addLogo(s1);
    s1.addText(String(d.topic || 'TOPIC'), { x: 1.1, y: 0.2, w: 6, h: 0.6, fontSize: 32, color: COLOR_WHITE, bold: true, valign: 'middle' });
    s1.addText('Lesson Overview', { x: 7.5, y: 0.2, w: 2, h: 0.6, fontSize: 20, color: COLOR_SECONDARY, align: 'right', valign: 'middle' });

    // Grid Layout - ROUNDED BOXES
    // Learning Objectives (Col 1-2, Row 1)
    s1.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.2, w: 6.2, h: 1.8, fill: { color: COLOR_WHITE }, line: { color: COLOR_SECONDARY, width: 2 }, rectRadius: 0.2 });
    s1.addText('Learning Objectives', { x: 0.6, y: 1.3, w: 3, h: 0.3, fontSize: 16, color: COLOR_SECONDARY, bold: true });
    s1.addText(String(d.objectives || 'Add here'), { x: 0.6, y: 1.7, w: 5.9, h: 1.22, fontSize: 11, color: COLOR_TEXT, valign: 'top', autoFit: true, wrap: true, margin: 0.08, lineSpacing: 18 });

    // Success Criteria (Col 3, Row 1)
    s1.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 1.2, w: 2.8, h: 1.8, fill: { color: COLOR_WHITE }, line: { color: COLOR_ACCENT, width: 2 }, rectRadius: 0.2 });
    s1.addText('Success Criteria', { x: 7.0, y: 1.3, w: 2.5, h: 0.3, fontSize: 16, color: COLOR_ACCENT, bold: true });
    s1.addText(String(d.success_criteria || 'Add here'), { x: 7.0, y: 1.7, w: 2.5, h: 1.22, fontSize: 11, color: COLOR_TEXT, valign: 'top', autoFit: true, wrap: true, margin: 0.08, lineSpacing: 18 });

    // Keywords (Col 1, Row 2)
    s1.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 3.2, w: 2.8, h: 1.2, fill: { color: COLOR_WHITE }, line: { color: COLOR_SECONDARY, width: 2 }, rectRadius: 0.2 });
    s1.addText('Keywords', { x: 0.6, y: 3.3, w: 2.5, h: 0.3, fontSize: 16, color: COLOR_SECONDARY, bold: true });
    s1.addText(String(d.keywords || 'Add here'), { x: 0.6, y: 3.7, w: 2.5, h: 0.62, fontSize: 11, color: COLOR_TEXT, valign: 'top', autoFit: true, wrap: true, margin: 0.08, lineSpacing: 18 });

    // Skills (Col 2, Row 2)
    s1.addShape(pptx.ShapeType.roundRect, { x: 3.6, y: 3.2, w: 2.8, h: 1.2, fill: { color: COLOR_WHITE }, line: { color: COLOR_ACCENT, width: 2 }, rectRadius: 0.2 });
    s1.addText('Skills', { x: 3.8, y: 3.3, w: 2.5, h: 0.3, fontSize: 16, color: COLOR_ACCENT, bold: true });
    s1.addText(String(d.skills || 'Add here'), { x: 3.8, y: 3.7, w: 2.5, h: 0.62, fontSize: 11, color: COLOR_TEXT, valign: 'top', autoFit: true, wrap: true, margin: 0.08, lineSpacing: 18 });

    // Links to other subjects (Col 3, Row 2)
    s1.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 3.2, w: 2.8, h: 1.2, fill: { color: COLOR_WHITE }, line: { color: COLOR_ACCENT, width: 2 }, rectRadius: 0.2 });
    s1.addText('Links to other subjects', { x: 7.0, y: 3.3, w: 2.5, h: 0.3, fontSize: 16, color: COLOR_ACCENT, bold: true });
    s1.addText(String(d.links_subjects || 'Add here'), { x: 7.0, y: 3.7, w: 2.5, h: 0.62, fontSize: 11, color: COLOR_TEXT, valign: 'top', autoFit: true, wrap: true, margin: 0.08, lineSpacing: 18 });

    // UAE Link (Full width bottom box)
    s1.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 4.8, w: 9.2, h: 1.2, fill: { color: COLOR_WHITE }, line: { color: COLOR_ACCENT, width: 2 }, rectRadius: 0.2 });
    s1.addText('UAE LINK', { x: 0.4, y: 4.9, w: 9.2, h: 0.3, fontSize: 16, color: COLOR_ACCENT, bold: true, align: 'center' });
    s1.addText(String(d.uae_link || 'Add here'), { x: 0.6, y: 5.2, w: 8.8, h: 0.7, fontSize: 11, color: COLOR_TEXT, valign: 'top', autoFit: true, wrap: true, margin: 0.08, lineSpacing: 18 });

    // 2. 5E PHASES (Matches SlidePhase.jsx)
    const phases = [
      { id: 'engage', t: 'Engage', time: '5 min' },
      { id: 'explore', t: 'Explore', time: '5 min' },
      { id: 'explain', t: 'Explain', time: '5 min' },
      { id: 'elaborate', t: 'Elaborate', time: '15 min' },
      { id: 'evaluate', t: 'Evaluate', time: '15 min' },
      { id: 'plenary', t: 'Plenary', time: '5 min' }
    ];

    phases.forEach(p => {
      let content = d[`${p.id}_content`];
      if ((!content || String(content).trim().length <= 5) && p.id === 'engage') {
        content = d.engage_content || d.objectives || d.success_criteria;
      }
      if (content && String(content).trim().length > 5) {
        const slide = pptx.addSlide();
        slide.background = { color: COLOR_BG };

        // Left Sidebar
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 2.5, h: '100%', fill: { color: COLOR_PRIMARY } });
        
        // Logo fixed at extreme left top of sidebar
        addLogo(slide, 1.0);

        // Sidebar Items
        const sidebarItems = [
          { label: 'Learning Objectives', val: d.objectives, color: COLOR_ACCENT },
          { label: 'Success Criteria', val: d.success_criteria, color: COLOR_SECONDARY },
          { label: 'Keywords', val: d.keywords, color: COLOR_ACCENT },
          { label: 'Skills', val: d.skills, color: COLOR_SECONDARY },
          { label: 'UAE Link', val: d.uae_link, color: COLOR_ACCENT }
        ];

        let currentY = 1.5;
        sidebarItems.forEach(item => {
          slide.addText(item.label, { x: 0.2, y: currentY, w: 2.1, h: 0.2, fontSize: 10, color: item.color, bold: true });
          slide.addText(String(item.val || '').substring(0, 120), { x: 0.2, y: currentY + 0.22, w: 2.1, h: 0.6, fontSize: 8, color: 'CCCCCC', valign: 'top' });
          currentY += 0.82;
        });

        // Main Content Header
        slide.addShape(pptx.ShapeType.rect, { x: 2.5, y: 0, w: 7.5, h: 0.8, fill: { color: COLOR_SECONDARY } });
        slide.addText(`${p.t}: ${String(d.topic || 'TOPIC')}`, { x: 2.7, y: 0.1, w: 5, h: 0.6, fontSize: 22, color: COLOR_WHITE, bold: true, valign: 'middle' });
        
        // Time Badge
        slide.addShape(pptx.ShapeType.roundRect, { x: 8.0, y: 0.2, w: 1.3, h: 0.4, fill: { color: COLOR_WHITE }, line: { color: COLOR_PRIMARY, width: 1 }, rectRadius: 0.15 });
        slide.addText(`Time: ${p.time}`, { x: 8.0, y: 0.2, w: 1.3, h: 0.4, fontSize: 12, color: COLOR_PRIMARY, bold: true, align: 'center', valign: 'middle' });

        // Content Box
        slide.addShape(pptx.ShapeType.roundRect, { x: 2.8, y: 1.0, w: 6.8, h: 4.4, fill: { color: COLOR_WHITE }, line: { color: 'E5E7EB', width: 1 }, rectRadius: 0.2 });
        slide.addText(String(content), { x: 3.0, y: 1.2, w: 6.4, h: 4.0, fontSize: 14, color: COLOR_TEXT, valign: 'top', lineSpacing: 22 });
        
        // Topic Image (if exists)
        if (d.topic_image_url) {
          slide.addImage({ path: d.topic_image_url, x: 8.0, y: 1.2, w: 1.5, h: 1.5 });
        }
      }
    });

    const fileName = `lesson_${Date.now()}.pptx`;
    const filePath = path.join(__dirname, 'downloads', fileName);
    await pptx.writeFile({ fileName: filePath });
    
    const baseUrl = `${req.protocol}://${req.headers.host}`;
    res.json({ success: true, filename: fileName, downloadUrl: `${baseUrl}/downloads/${fileName}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/downloads', express.static('downloads'));

// Serve built frontend in production if available
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    // Avoid intercepting API routes
    if (req.path.startsWith('/api/')) return res.status(404).end();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// HELPER FUNCTION: Normalize extracted/AI data into clean structure
function normalizeLessonData(data) {
  const out = { ...data };

  // 1) Split objectives vs success criteria if they are mixed together
  if (out.objectives) {
    const objText = String(out.objectives);
    const diffMatch = objText.match(/Differentiated lesson outcomes?:/i);
    if (diffMatch) {
      const idx = diffMatch.index;
      const before = objText.slice(0, idx).trim();
      const after = objText.slice(idx).trim();
      if (!out.success_criteria || String(out.success_criteria).trim().length < 10) {
        out.success_criteria = after;
      }
      out.objectives = before || out.objectives;
    } else if (!out.success_criteria) {
      const allIdx = objText.toLowerCase().indexOf('all students will');
      if (allIdx > 50) {
        const before = objText.slice(0, allIdx).trim();
        const after = objText.slice(allIdx).trim();
        out.objectives = before || out.objectives;
        out.success_criteria = after;
      }
    }

    // Keep objectives as a single clear statement (first sentence)
    if (out.objectives) {
      const parts = String(out.objectives).split(/(?<=[.!?])\s+/);
      if (parts.length > 0) {
        out.objectives = parts[0].trim();
      }
    }
  }

  // 2) Clean keywords: cut off resources/links and URLs
  if (out.keywords) {
    let kw = String(out.keywords);
    const resIdx = kw.search(/RESOURCES REQUIRED|Resources Required|RESOURCES:/i);
    if (resIdx >= 0) {
      kw = kw.slice(0, resIdx);
    }
    kw = kw.replace(/https?:\/\/\S+/gi, ' ');
    kw = kw.replace(/`/g, ' ');
    kw = kw.replace(/\s{2,}/g, ' ').trim();
    out.keywords = kw;
  }

  return out;
}

// HELPER FUNCTION: Extract section from text
function extractSection(text, keywords, stopHeaders, options = {}) {
  const maxLength = options.maxLength || 800;
  const firstLineOnly = !!options.firstLineOnly;
  
  for (const kw of keywords) {
    const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stopPattern = stopHeaders.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`${escapedKw}[:\\s\\n]+(.*?)(?=\\n(?:${stopPattern})|$)`, 'is');
    const match = text.match(regex);
    if (match && match[1] && match[1].trim().length > 5) {
      let section = match[1].trim();
      if (firstLineOnly) {
        section = section.split(/\r?\n|\./)[0].trim();
      }
      if (section.length > maxLength) {
        section = section.slice(0, maxLength).trim();
      }
      return section;
    }
  }
  return null;
}

// AI ENHANCEMENT FUNCTION: Transform extracted data into detailed, classroom-ready content
async function enhanceWithAI(text, basicData) {
  const prompt = `
You are an expert curriculum designer. Transform this lesson plan into a classroom-ready 5E PowerPoint with MAXIMUM instructional detail. NEVER summarize — preserve every teaching step, question, and example.

CRITICAL OUTPUT RULES:
1. Use \\n for line breaks (PowerPoint renders them correctly)
2. Questions MUST start on new lines with "• " prefix
3. For Explore: Include BOTH questions AND model answers (prefix answers with "  → ")
4. For Explain: Break into sequential teaching steps (Step 1:, Step 2:, etc.) with concrete examples
5. For Elaborate/Evaluate: Preserve ALL differentiation tiers (Lower/Middle/Upper) with full task descriptions
6. For Plenary: Include 3-5 reflection questions, each on new line

INPUT LESSON PLAN:
${text.substring(0, 6000)}

OUTPUT STRICT JSON (preserve this exact structure):

{
  "topic": "Lesson topic",
  "objectives": "ONE clear learning objective",
  "success_criteria": "\\nAll students will...\\nMost students will...",
  "keywords": "comma-separated list",
  "skills": "comma-separated list only skill names",
  "links_subjects": "Cross-curricular connections only subject names",
  "uae_link": "Relevant UAE context (local examples, culture, or environment)",

  "engage_content": "\\n• Hook description (e.g., 'Show image/video of...')\\n• Think-Pair-Share sequence:\\n  - Individual think (1 min): [prompt]\\n  - Pair discussion (2 min): [prompt]\\n  - Share out (2 min): [prompt]\\n• Questions (each on new line):\\n  • Question 1\\n  • Question 2\\n  • Question 3\\n• Expected misconception to address",  
  
  "explore_content": "\\nMaterials: [list]\\nProcedure:\\nStep 1: [action]\\nStep 2: [action]\\nGuiding questions with model answers:\\n• Question text\\n  → Expected answer/observation\\n• Next question\\n  → Expected answer\\nDifferentiation: [notes if present]",  
  
  "explain_content": "\\nStep 1: [Introduce key concept with concrete example]\\nStep 2: [Demonstration/modeling with think-aloud]\\nStep 3: [Guided practice example with solution]\\nStep 4: [Address common misconception]\\nWorked example: [Full demonstration]\\nMisconception check:\\n• 'Student might think...' → Correction with evidence",  
  
  "elaborate_content": "\\nUPPER ABILITY:\\n[Full task description]\\n• Requirements:\\n  - Requirement 1\\n  - Requirement 2\\n\\nMIDDLE ABILITY:\\n[Full task description]\\n• Guidance:\\n  Step 1: [action]\\n  Step 2: [action]\\n\\nLOWER ABILITY:\\n[Scaffolded task]\\n• Steps:\\n  1. [Action]\\n  2. [Action]",  
  
  "evaluate_content": "\\nAssessment tasks with mark scheme or success indicators\\n• Task 1: [description] (X marks)\\n• Task 2: [description]\\n\\nInclude self/peer assessment prompts if present",  
  
  "plenary_content": "\\nExit ticket or reflection:\\n• Question 1\\n• Question 2\\n• Question 3\\nIf present in the lesson, add '3-2-1' reflection or similar structure."
}

Use the JSON keys exactly as above and do not add new top-level keys.
`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are a precise JSON generator.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 2500
  });

  let jsonText = completion.choices[0]?.message?.content?.trim() || '';
  const jsonMatch = jsonText.match(/\{[\s\S]*\}$/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  let parsed = {};
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.log('Failed to parse AI JSON, falling back to basicData:', e.message);
    return basicData;
  }

  Object.keys(basicData).forEach(key => {
    if (parsed[key] === undefined || parsed[key] === null || parsed[key] === '') {
      parsed[key] = basicData[key];
    }
  });

  return parsed;
}

app.listen(PORT, () => {
  console.log(`🚀 Base44 Local API running on http://localhost:${PORT}`);
});
