# CaptureFlow

An immersive digital memory space and cognitive engine that organizes, searches, and replays workflow context using semantically linked 3D knowledge graphs and AI.

## Features

- **3D Spatial Memory Space**: Instanced Mesh rendering with Web Worker force-directed graph physics ($O(N \log N)$ at 60+ FPS).
- **Ingestion & Embeddings**: Token chunking, vector embeddings, and UMAP 3D spatial coordinate projection.
- **Local-First & Resilient**: IndexedDB caching with append-only Write-Ahead Log (WAL) event queue and background server sync.
- **AI Cognitive Assistant**: Grounded semantic retrieval powered by Gemini 3.6-flash.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run locally:**
   ```bash
   npm dev
   ```

3. **Build Electron app:**
   ```bash
   npm run build
   ```
