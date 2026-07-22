import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define Memory Interfaces directly on the server to prevent ESM bundling discrepancy
interface MemoryRelationship {
  targetId: string;
  type: string;
  weight: number;
}

interface MemoryHistoryEvent {
  timestamp: string;
  action: string;
  details: string;
}

interface Memory {
  id: string;
  imageUrl: string;
  ocrText: string;
  timestamp: string;
  application: string;
  windowTitle: string;
  url?: string;
  summary: string;
  tags: string[];
  confidence: number;
  category: 'Work' | 'Design' | 'Dev' | 'Productivity' | 'Leisure';
  relationships: MemoryRelationship[];
  history: MemoryHistoryEvent[];
}

// Initial seed data
const initialMemories: Memory[] = [
  {
    id: "mem-1",
    imageUrl: "figma_canvas",
    application: "Figma",
    windowTitle: "CaptureFlow - High-Fidelity UI Screens (Design Workspace)",
    timestamp: "2026-07-20T09:15:00-07:00",
    category: "Design",
    confidence: 0.98,
    ocrText: `CaptureFlow Dashboard Drafts
Layers: [Header, Primary Sidebar, Canvas Stage, Time-Replay Scrubber, Inspector Panel]
Visual Palette: Cool Neutral, Deep Obsidian #0B0F19, Light Cream #FAFAF9, Slate Active Accent #38BDF8
Typography: display: 'Playfair Display', sans: 'Plus Jakarta Sans'
Nodes spacing constraints: Padding Math: Outer >= Inner. Outer: 24px, Inner: 16px.
Button states: normal, hover:bg-opacity-80, active, focus.
Border radius: 12px card, 24px pill, outer corners calculated: InnerR = OuterR - Padding.
Banned: No generic violet gradients, no arbitrary neon glow-shadows. Keep it luxury-premium slate and cream.`,
    summary: "Refining visual design specifications and mathematical spacing constraints for CaptureFlow in Figma.",
    tags: ["ui-design", "figma", "canvas", "design-system", "palette"],
    relationships: [
      { targetId: "mem-3", type: "semantic", weight: 0.9 },
      { targetId: "mem-2", type: "temporal", weight: 0.6 }
    ],
    history: [
      { timestamp: "2026-07-20T09:15:00-07:00", action: "capture", details: "Auto-captured via CaptureFlow global hotkey Ctrl+Shift+C." },
      { timestamp: "2026-07-20T09:30:00-07:00", action: "ai_analyze", details: "OCR and tags extracted successfully. Relationships calculated." }
    ]
  },
  {
    id: "mem-2",
    imageUrl: "vs_code_editor",
    application: "VS Code",
    windowTitle: "src/components/MemorySpace3D.tsx - captureflow-dashboard",
    timestamp: "2026-07-20T10:30:00-07:00",
    category: "Dev",
    confidence: 0.95,
    ocrText: `import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function KnowledgeGraph() {
  const meshRef = useRef<THREE.Group>(null);
  // Reconstruct historical states from stored events
  // Render nodes and edges inside a force-directed physics layout
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });
  return <group ref={meshRef}>...</group>;
}
// Force directed physics: attraction = -dist * k, repulsion = q / (dist^2)`,
    summary: "Implementing the core 3D knowledge graph and force-directed equations in React Three Fiber.",
    tags: ["react-three-fiber", "threejs", "physics", "knowledge-graph", "3d"],
    relationships: [
      { targetId: "mem-1", type: "semantic", weight: 0.8 },
      { targetId: "mem-4", type: "semantic", weight: 0.75 },
      { targetId: "mem-7", type: "temporal", weight: 0.5 }
    ],
    history: [
      { timestamp: "2026-07-20T10:30:00-07:00", action: "capture", details: "Captured VS Code window focus." }
    ]
  },
  {
    id: "mem-3",
    imageUrl: "notion_workspace",
    application: "Notion",
    windowTitle: "CaptureFlow Product Spec - Workspace & Backlog",
    timestamp: "2026-07-20T11:45:00-07:00",
    category: "Productivity",
    confidence: 0.99,
    ocrText: `CaptureFlow Specification v1.4
Status: In Progress
Objective: Eradicate cognitive friction during workspace information retrieval.
Core Persona Archetype:
- Capture Mode: Invisible, ultra-low latency, triggered by Ctrl+Shift+C. No modals, pure hotkey.
- Dashboard: Immersive, rich 3D visualization, spacious cream and deep obsidian panels.
Backlog Tasks:
- Task-102: Integrations using actual Google Workspace scopes (Drive, Docs, Sheets) via OAuth.
- Task-103: Dynamic timeline historical replay to observe cluster emergence and old knowledge fade.
- Task-104: Gemini cognitive chat proxy backend to keep keys secure on server.`,
    summary: "Checking the core specification roadmap and backlog requirements in Notion.",
    tags: ["product-spec", "roadmap", "ux-philosophy", "notion"],
    relationships: [
      { targetId: "mem-1", type: "semantic", weight: 0.92 },
      { targetId: "mem-5", type: "contextual", weight: 0.7 }
    ],
    history: [
      { timestamp: "2026-07-20T11:45:00-07:00", action: "capture", details: "Saved workspace spec overview." }
    ]
  },
  {
    id: "mem-4",
    imageUrl: "chrome_search",
    application: "Chrome",
    windowTitle: "custom force directed graph equations R3F - Google Search",
    timestamp: "2026-07-20T13:20:00-07:00",
    category: "Dev",
    confidence: 0.94,
    ocrText: `Google Search: custom force directed graph equations R3F
Results:
1. Coulomb's Law for Node Repulsion: Fr = kr / (d^2) where kr is electrostatic constant.
2. Hooke's Law for Edge Attraction: Fa = ka * (d - L) where L is natural spring length.
3. Friction / Damping: V = V * damping (e.g. 0.85) to prevent infinite oscillation.
StackOverflow: 'How to efficiently render 100k nodes in Three.js? Use InstancedMesh instead of spawning individual mesh components to avoid excessive webgl draw calls.'`,
    summary: "Researching mathematical formulations for force-directed graph physics and InstancedMesh rendering optimizations.",
    tags: ["math", "physics", "google-search", "threejs-optimization", "webgl"],
    relationships: [
      { targetId: "mem-2", type: "semantic", weight: 0.88 },
      { targetId: "mem-7", type: "temporal", weight: 0.4 }
    ],
    history: [
      { timestamp: "2026-07-20T13:20:00-07:00", action: "capture", details: "Captured Chrome tab containing force-directed graph formulas." }
    ]
  },
  {
    id: "mem-5",
    imageUrl: "slack_chat",
    application: "Slack",
    windowTitle: "Slack | #product-strategy | CaptureFlow Team",
    timestamp: "2026-07-20T14:40:00-07:00",
    category: "Work",
    confidence: 0.97,
    ocrText: `[14:38] Sarah: Hey guys, we need to make sure the time-evolution feature is extremely smooth. The user shouldn't just scrub a timeline; they should see nodes dynamically pop up, connection lines fade in and get thicker if they are revisited.
[14:40] David: Agreed. Replaying historical states makes the knowledge graph feel alive. Let's make sure 'old knowledge' that hasn't been searched or modified gently dims, while active nodes glow.
[14:42] Arnold: Working on the physics for that now. R3F matches our high-end design tool direction perfectly. I'll use orbit controls with automated focus transitions when nodes are selected!`,
    summary: "Slack team sync regarding UX for time-evolution timeline playback and graph visual cues.",
    tags: ["slack", "team-sync", "timeline-replay", "ux-direction"],
    relationships: [
      { targetId: "mem-3", type: "contextual", weight: 0.78 },
      { targetId: "mem-2", type: "contextual", weight: 0.65 }
    ],
    history: [
      { timestamp: "2026-07-20T14:40:00-07:00", action: "capture", details: "Auto-captured team strategy chat." }
    ]
  },
  {
    id: "mem-6",
    imageUrl: "spotify_player",
    application: "Spotify",
    windowTitle: "Spotify - Deep Focus Lofi Beats & Rain Ambience",
    timestamp: "2026-07-20T15:00:00-07:00",
    category: "Leisure",
    confidence: 0.99,
    ocrText: `Spotify Premium
Now Playing: 'Rainy Afternoons in Tokyo' by Lofi Coffee Shop
Playlist: Deep Focus Ambience (128 BPM, chill study vibes)
Next: 'Resonance' - Home
Controls: [Shuffle ON, Repeat OFF, Volume 45%]`,
    summary: "Streaming lo-fi focus soundtrack to preserve cognitive flow and momentum during coding sessions.",
    tags: ["spotify", "music", "lofi", "focus-mode"],
    relationships: [],
    history: [
      { timestamp: "2026-07-20T15:00:00-07:00", action: "capture", details: "Captured ambient audio context." }
    ]
  },
  {
    id: "mem-7",
    imageUrl: "terminal_output",
    application: "Terminal",
    windowTitle: "bash - npm run dev - captureflow-dashboard (port 3000)",
    timestamp: "2026-07-20T16:15:00-07:00",
    category: "Dev",
    confidence: 0.93,
    ocrText: `dashboard-app@0.0.0 dev /workspace
> tsx server.ts

[Vite] dev server running at:
  > Local: http://localhost:3000/
  > Network: http://10.240.0.4:3000/
[Vite] HMR connection established.
[Server] Express listening on port 3000.
[Server] Connected to local database cache.
[Server] Gemini API key detected in environment.
✓ built in 435ms.
Compiled successfully. No TypeScript compilation errors.`,
    summary: "Successfully starting up the custom full-stack dev server on Port 3000 with dynamic Gemini integrations.",
    tags: ["terminal", "bash", "vite", "server-startup", "port-3000"],
    relationships: [
      { targetId: "mem-2", type: "semantic", weight: 0.7 },
      { targetId: "mem-4", type: "temporal", weight: 0.5 }
    ],
    history: [
      { timestamp: "2026-07-20T16:15:00-07:00", action: "capture", details: "Captured successful development server boot logs." }
    ]
  },
  {
    id: "mem-8",
    imageUrl: "chrome_search",
    application: "Chrome",
    windowTitle: "OAuth 2.0 flow for Google Workspace APIs Express - Google Search",
    timestamp: "2026-07-21T09:30:00-07:00",
    category: "Productivity",
    confidence: 0.96,
    ocrText: `Google Search: OAuth 2.0 flow for Google Workspace APIs Express
Developer Docs:
1. Obtain client ID and client secret from Google Cloud Console.
2. Setup authorized redirect URI: http://localhost:3000/api/oauth/callback.
3. Call client.generateAuthUrl({ access_type: 'offline', scope: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/calendar.readonly'] }).
4. Handle callback, exchange authorization code for OAuth tokens, store tokens securely in server context.`,
    summary: "Researching integration steps for accessing Google Workspace APIs via OAuth 2.0 inside the Express backend.",
    tags: ["google-workspace", "oauth", "api-integration", "google-cloud"],
    relationships: [
      { targetId: "mem-3", type: "semantic", weight: 0.8 },
      { targetId: "mem-9", type: "temporal", weight: 0.7 }
    ],
    history: [
      { timestamp: "2026-07-21T09:30:00-07:00", action: "capture", details: "Saved browser OAuth authentication guidelines." }
    ]
  },
  {
    id: "mem-9",
    imageUrl: "vs_code_editor",
    application: "VS Code",
    windowTitle: "server/oauth.ts - captureflow-dashboard",
    timestamp: "2026-07-21T10:45:00-07:00",
    category: "Dev",
    confidence: 0.97,
    ocrText: `import express from 'express';
import { google } from 'googleapis';

const router = express.Router();
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.APP_URL + '/api/oauth/callback'
);

router.get('/api/oauth/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.metadata.readonly']
  });
  res.redirect(url);
});`,
    summary: "Writing Express API routes to trigger secure OAuth flows with Google Workspace APIs.",
    tags: ["vs-code", "oauth", "express", "backend-dev", "security"],
    relationships: [
      { targetId: "mem-8", type: "semantic", weight: 0.91 },
      { targetId: "mem-3", type: "contextual", weight: 0.75 }
    ],
    history: [
      { timestamp: "2026-07-21T10:45:00-07:00", action: "capture", details: "Auto-saved oauth.ts implementation." }
    ]
  },
  {
    id: "mem-10",
    imageUrl: "notion_workspace",
    application: "Notion",
    windowTitle: "Meeting Notes - Sprint 3 Review & Feedback",
    timestamp: "2026-07-21T13:10:00-07:00",
    category: "Work",
    confidence: 0.99,
    ocrText: `Sprint 3 Recap Notes
Attending: Sarah, David, Arnold, Larry (User)
Feedback points:
- The 3D graph has incredible fluid mechanics but needs a 'focus mode' where selecting a node centers the camera on it and orbits.
- The AI cognitive chat is extremely helpful! Can we make sure it has 'memory mapping' where the AI lists the relevant memories it looked at? Yes!
- Keep visual aesthetic minimal, dark premium mode works great but let's offer a balanced refined theme. Use Playfair Display for headers and Jakarta for buttons.`,
    summary: "Transcribing feedback from Sprint 3 Review regarding 3D camera focus mechanics and AI memory mapping.",
    tags: ["meeting-notes", "feedback", "sprint-review", "ux-improvements"],
    relationships: [
      { targetId: "mem-3", type: "semantic", weight: 0.85 },
      { targetId: "mem-5", type: "semantic", weight: 0.7 }
    ],
    history: [
      { timestamp: "2026-07-21T13:10:00-07:00", action: "capture", details: "Captured team sprint meeting notes." }
    ]
  },
  {
    id: "mem-11",
    imageUrl: "chrome_search",
    application: "Chrome",
    windowTitle: "react-three-fiber camera lookAt animated transition - Google Search",
    timestamp: "2026-07-21T14:50:00-07:00",
    category: "Dev",
    confidence: 0.95,
    ocrText: `Google Search: react-three-fiber camera lookAt animated transition
Best Solutions:
1. Use react-three-drei <CameraControls /> component, which has built-in fitToBox, setLookAt, and zoomTo methods that are fully interpolated out-of-the-box.
2. In a custom useFrame tick:
   state.camera.position.lerp(targetPosition, 0.1);
   state.camera.lookAt(targetLookAt);
   state.camera.updateProjectionMatrix();
This creates an elegant slide-to-focus animation without installing extra layout components.`,
    summary: "Finding interpolation math for implementing camera focus slide-transitions inside standard React Three Fiber loops.",
    tags: ["camera-lerp", "interpolation", "threejs-math", "r3f-canvas"],
    relationships: [
      { targetId: "mem-2", type: "semantic", weight: 0.83 },
      { targetId: "mem-10", type: "contextual", weight: 0.6 }
    ],
    history: [
      { timestamp: "2026-07-21T14:50:00-07:00", action: "capture", details: "Saved camera lookup animation tips." }
    ]
  },
  {
    id: "mem-12",
    imageUrl: "slack_chat",
    application: "Slack",
    windowTitle: "Slack | #dev-alerts | Build Succeeded",
    timestamp: "2026-07-21T16:30:00-07:00",
    category: "Dev",
    confidence: 0.98,
    ocrText: `[16:28] CI-CD BOT: Build #148 - SUCCESSFUL
Target: captureflow-dashboard:production
Environment: GCP Cloud Run Container
Trigger: Merge branch 'feature/3d-memory-space' into main
Details:
- Compiled chunks: dist/index.html (240kB), dist/assets/index.js (1.4MB)
- Docker image: gcr.io/captureflow/dashboard:v1.4.8
- Server status: Active, healthcheck passing on port 3000.`,
    summary: "Dynamic alert showing production build compilation passing cleanly for cloud deployment.",
    tags: ["ci-cd", "build-success", "gcp-cloud-run", "docker"],
    relationships: [
      { targetId: "mem-7", type: "temporal", weight: 0.65 }
    ],
    history: [
      { timestamp: "2026-07-21T16:30:00-07:00", action: "capture", details: "Saved bot notification." }
    ]
  }
];

// In-memory Database Store
let databaseMemories: Memory[] = [...initialMemories];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware with increased limit for potential base64 uploads
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini Client
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("[Server] Gemini Client initialized successfully with API key.");
    } catch (err) {
      console.error("[Server] Error initializing Gemini Client:", err);
    }
  } else {
    console.warn("[Server] No valid GEMINI_API_KEY found in process.env. Running in AI fallback mode.");
  }

  // API: Get all memories
  app.get("/api/memories", (req, res) => {
    try {
      res.json(databaseMemories);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  // API: Get single memory details
  app.get("/api/memories/:id", (req, res) => {
    try {
      const memory = databaseMemories.find(m => m.id === req.params.id);
      if (memory) {
        res.json(memory);
      } else {
        res.status(404).json({ error: "Memory not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // API: Trigger dynamic capture (simulating Global Hotkey 'Ctrl + Shift + C')
  app.post("/api/memories/capture", (req, res) => {
    try {
      const { application, windowTitle, ocrText, summary, category, tags } = req.body;
      
      if (!application || !windowTitle) {
        return res.status(400).json({ error: "Application and Window Title are required" });
      }

      // Automatically construct a memory with relationships based on tags
      const newId = `mem-${databaseMemories.length + 1}`;
      const newTimestamp = new Date().toISOString();
      
      const newMemory: Memory = {
        id: newId,
        imageUrl: application.toLowerCase().replace(/[^a-z]/g, '_') || 'chrome_search',
        application,
        windowTitle,
        timestamp: newTimestamp,
        category: category || "Productivity",
        confidence: 0.90 + Math.random() * 0.1,
        ocrText: ocrText || `Captured terminal or application state for ${windowTitle}`,
        summary: summary || `Analyzed capture of ${application} window title "${windowTitle}".`,
        tags: tags && Array.isArray(tags) ? tags : ["captured", application.toLowerCase()],
        relationships: [],
        history: [
          { timestamp: newTimestamp, action: "capture", details: "Manual capture simulated via Dashboard playground panel." },
          { timestamp: newTimestamp, action: "ai_analyze", details: "OCR complete. Relationships mapped automatically." }
        ]
      };

      // Form some basic relationships with existing memories sharing similar tags
      databaseMemories.forEach(existing => {
        const intersection = existing.tags.filter(t => newMemory.tags.includes(t));
        if (intersection.length > 0) {
          const weight = Math.min(0.3 + intersection.length * 0.15, 0.95);
          newMemory.relationships.push({ targetId: existing.id, type: "semantic", weight });
          existing.relationships.push({ targetId: newMemory.id, type: "semantic", weight });
        }
      });

      databaseMemories.push(newMemory);
      res.status(201).json(newMemory);
    } catch (err) {
      res.status(500).json({ error: "Failed to capture memory" });
    }
  });

  // API: Cognitive Assistant Chat Route using Server-Side Gemini API
  app.post("/api/ai/chat", async (req, res) => {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request payload. 'messages' array required." });
    }

    const lastUserMessage = messages[messages.length - 1]?.text;
    if (!lastUserMessage) {
      return res.status(400).json({ error: "User message text is missing." });
    }

    // Context preparation: feed the available memories into the system prompt
    // This makes Gemini incredibly smart: it can inspect the entire OCR text and metadata of everything the user has done!
    const memoriesContextString = databaseMemories.map(m => {
      return `[ID: ${m.id}]
App: ${m.application}
Title: ${m.windowTitle}
Category: ${m.category}
Time: ${m.timestamp}
Summary: ${m.summary}
Tags: ${m.tags.join(', ')}
OCR Text:
"""
${m.ocrText}
"""
--------------------------------------------------`;
    }).join('\n');

    const systemInstruction = `You are the core cognitive engine of CaptureFlow. CaptureFlow is an external mind that records OCR, applications, window titles, and web visits to reduce the user's cognitive load.
Your task is to answer questions, find information, summarize sessions, explain relationships, and guide the user.

Refer to the user's real memories provided below to answer their questions accurately.

Real User Memories:
${memoriesContextString}

When responding, follow these rules:
1. Ground your answers strictly in the provided memories. Be highly specific about window titles, times, and applications.
2. If the user asks you to find a particular memory or task, perform a semantic query against the OCR texts, identify which memory IDs are relevant, and format them at the end of your message in a specialized structured block, like so:
[RELEVANT_MEMORIES: mem-1, mem-2]
This allows our visual interface to automatically highlight and zoom into those memories on the 3D map! Always output this block if you refer to specific memories.
3. Keep your tone helpful, professional, minimal, and premium.
4. If a memory isn't relevant or you can't find anything matching the query, state so clearly, and offer a helpful tip.`;

    if (!ai) {
      // Offline fallback when no API key is specified, parsing client side queries gracefully with simple keyword matching
      console.warn("[Server] Gemini not available. Using local semantic indexing algorithm.");
      
      const queryLower = lastUserMessage.toLowerCase();
      const matchedMemories = databaseMemories.filter(m => 
        m.ocrText.toLowerCase().includes(queryLower) || 
        m.application.toLowerCase().includes(queryLower) || 
        m.windowTitle.toLowerCase().includes(queryLower) || 
        m.tags.some(t => t.toLowerCase().includes(queryLower)) ||
        m.summary.toLowerCase().includes(queryLower)
      );

      let responseText = `I am currently operating in **Local Cognitive Indexing Mode** (no Gemini API Key configured in your Secrets). I've run a keyword matching algorithm on your OCR logs:\n\n`;
      
      if (matchedMemories.length > 0) {
        responseText += `I found **${matchedMemories.length} relevant memories** matching your query:\n\n`;
        matchedMemories.forEach(m => {
          responseText += `- **${m.application}** ("${m.windowTitle}") captured at *${new Date(m.timestamp).toLocaleTimeString()}*:\n  *${m.summary}*\n\n`;
        });
        
        responseText += `\n[RELEVANT_MEMORIES: ${matchedMemories.map(m => m.id).join(', ')}]`;
      } else {
        responseText += `I couldn't find any direct matches in your OCR text logs for "${lastUserMessage}". Try searching for words like 'Figma', 'physics', 'Sprint', or 'OAuth'.`;
      }

      return res.json({ text: responseText, linkedMemories: matchedMemories.map(m => m.id) });
    }

    try {
      // Run genuine Gemini 3.6-flash generation
      // Prepare Chat history for conversational context
      const chatContents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          { role: 'user', parts: [{ text: `System Instruction Context: ${systemInstruction}` }] },
          ...chatContents
        ],
        config: {
          temperature: 0.2, // low temperature for precise factual retrieval of OCR contents
        }
      });

      const responseText = response.text || "No response received from model.";
      
      // Parse out [RELEVANT_MEMORIES: mem-1, mem-2]
      const regex = /\[RELEVANT_MEMORIES:\s*([^\]]+)\]/i;
      const match = responseText.match(regex);
      let linkedMemories: string[] = [];
      if (match && match[1]) {
        linkedMemories = match[1].split(',').map(s => s.trim());
      }

      res.json({ text: responseText, linkedMemories });
    } catch (err: any) {
      console.error("[Server] Gemini API error:", err);
      res.status(500).json({ error: "Gemini API failed to generate content", details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] CaptureFlow Dashboard server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
