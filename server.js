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

// Read .env file manually
const envPath = path.join(__dirname, '.env');
let GROQ_API_KEY = 'dummy-key';
try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    GROQ_API_KEY = envContent.split('\n')
      .find(line => line.trim().startsWith('GROQ_API_KEY='))
      ?.split('=')[1]?.trim() || 'dummy-key';
  }
} catch (e) {
  console.log('Error reading .env file:', e.message);
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const isProd = process.env.NODE_ENV === 'production';

// Initialize Groq for AI
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Middleware
app.use(cors(
  isProd
    ? { 
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Range', 'X-Content-Range']
      }
    : { 
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'], 
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Range', 'X-Content-Range']
      }
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
      'Evaluate', 'Assessment', 'Plenary', 'Review', 'UAE'
    ];

    const extractedData = {
      topic: extractSection(text, ['topic', 'subject', 'title'], stopHeaders) || 'Lesson Topic',
      subject: extractSection(text, ['subject', 'course'], stopHeaders) || 'General',
      grade: extractSection(text, ['grade', 'level'], stopHeaders) || 'Grade 10',
      objectives: extractSection(text, ['objectives', 'learning objectives', 'aims'], stopHeaders),
      success_criteria: extractSection(text, ['success criteria', 'learning outcomes', 'checklist'], stopHeaders),
      keywords: extractSection(text, ['keywords', 'vocabulary'], stopHeaders),
      skills: extractSection(text, ['skills', 'competencies'], stopHeaders),
      links_subjects: extractSection(text, ['links', 'connections', 'subjects'], stopHeaders),
      uae_link: extractSection(text, ['uae', 'local context'], stopHeaders),
      engage_content: extractSection(text, ['starter', 'engage', 'introduction'], stopHeaders),
      explore_content: extractSection(text, ['explore', 'investigation'], stopHeaders),
      explain_content: extractSection(text, ['teaching', 'explain', 'instruction'], stopHeaders),
      elaborate_content: extractSection(text, ['elaborate', 'extend', 'application'], stopHeaders),
      evaluate_content: extractSection(text, ['evaluate', 'assessment', 'check'], stopHeaders),
      plenary_content: extractSection(text, ['plenary', 'review', 'conclusion'], stopHeaders)
    };
    
    // AI enhancement if available
    let finalData = extractedData;
    if (GROQ_API_KEY && GROQ_API_KEY !== 'dummy-key') {
      try {
        finalData = await enhanceWithAI(text, extractedData);
      } catch (aiError) {
        console.log('AI enhancement failed, using base data');
      }
    }
    
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
      const content = d[`${p.id}_content`];
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

        const dense = ['elaborate', 'evaluate'].includes(p.id) && String(content).length > 500;
        const contentFontSize = dense ? 12 : 14;
        const contentLineSpacing = dense ? 18 : 22;
        const contentHeight = dense ? 4.6 : 4.4;
        slide.addShape(pptx.ShapeType.roundRect, { x: 2.8, y: 1.0, w: 6.8, h: contentHeight, fill: { color: COLOR_WHITE }, line: { color: 'E5E7EB', width: 1 }, rectRadius: 0.2 });
        slide.addText(String(content), { x: 3.0, y: 1.2, w: 6.4, h: contentHeight - 0.2, fontSize: contentFontSize, color: COLOR_TEXT, valign: 'top', lineSpacing: contentLineSpacing, autoFit: true, wrap: true, margin: 0.08 });
        
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

function extractSection(text, keywords, stopHeaders) {
  for (const kw of keywords) {
    // Escape keywords for regex
    const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Improved regex: look for keyword, then capture everything until a stop header OR a significant block of uppercase text
    const stopPattern = stopHeaders.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`${escapedKw}[:\\s\\n]+(.*?)(?=\\n(?:${stopPattern})|$)`, 'is');
    const match = text.match(regex);
    if (match && match[1] && match[1].trim().length > 5) {
      return match[1].trim();
    }
  }
  return null;
}

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
  "skills": "comma-separated list",
  "links_subjects": "Cross-curricular connections (subject names)",
  "uae_link": "Relevant UAE context (local examples, culture, or environment)",

  "engage_content": "\\n• Hook description (e.g., 'Show image/video of...')\\n• Think-Pair-Share sequence:\\n  - Individual think (1 min): [prompt]\\n  - Pair discussion (2 min): [prompt]\\n  - Share out (2 min): [prompt]\\n• Questions (each on new line):\\n  • Question 1\\n  • Question 2\\n  • Question 3\\n• Expected misconception to address",
  
  "explore_content": "\\nMaterials: [list]\\nProcedure:\\nStep 1: [action]\\nStep 2: [action]\\nGuiding questions with model answers:\\n• Question text\\n  → Expected answer/observation\\n• Next question\\n  → Expected answer\\nDifferentiation: [notes if present]",
  
  "explain_content": "\\nStep 1: [Introduce key concept with concrete example]\\nStep 2: [Demonstration/modeling with think-aloud]\\nStep 3: [Guided practice example with solution]\\nStep 4: [Address common misconception]\\nWorked example: [Full demonstration]\\nMisconception check:\\n• 'Student might think...' → Correction with evidence",
  
  "elaborate_content": "DETAILED cooperative tasks \\nUPPER ABILITY:\\n[Full task description]\\n• Requirements:\\n  - Requirement 1\\n  - Requirement 2\\n\\nMIDDLE ABILITY:\\n[Full task description]\\n• Guidance:\\n  Step 1: [action]\\n  Step 2: [action]\\n\\nLOWER ABILITY:\\n[Scaffolded task]\\n• Steps:\\n  1. [Action]\\n  2. [Action]",
  
  "evaluate_content": "DETAILED independent assessment \\nUPPER ABILITY:\\n[Synthesis task]\\n• Success criteria:\\n  - Criterion 1\\n  - Criterion 2\\n\\nMIDDLE ABILITY:\\n[Practice problems]\\n• Problem 1: [full question]\\n• Problem 2: [full question]\\n\\nLOWER ABILITY:\\n[Scaffolded task]\\n• Step 1: [instruction]\\n• Step 2: [instruction]",
  
  "plenary_content": "\\n• Question 1 (DOK2)\\n• Question 2 (DOK3)\\n• Question 3 (DOK4)\\n\\nKey discussion point: [brief note]"
}

IMPORTANT:
- DO NOT invent content not implied by the original plan
- Preserve ALL original examples, questions, and activities
- UAE link must reflect subject relevance (e.g., Science: UAE environment; History: UAE heritage; Math: UAE architecture proportions)
- Keep language practical and teacher-ready
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    let result = JSON.parse(response.choices[0].message.content);
    
    // Sanitize: flatten objects/arrays + clean line breaks
    Object.keys(result).forEach(key => {
      if (result[key] && typeof result[key] === 'object') {
        if (Array.isArray(result[key])) {
          result[key] = result[key].join(', ');
        } else {
          result[key] = Object.entries(result[key])
            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
            .join('\\n');
        }
      }
      if (typeof result[key] === 'string') {
        result[key] = result[key]
          .replace(/\n{3,}/g, '\\n\\n')
          .replace(/\\n/g, '\n')
          .trim();
      }
    });

    return result;
  } catch (error) {
    console.log('AI enhancement failed:', error.message);
    return basicData; // Fallback to extracted data
  }
}

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Base44 Local API running on http://localhost:${PORT}`));
