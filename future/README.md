# Future Features - TypeScript/React Prototypes

## Overview

This directory contains prototype TypeScript and React code for future versions of the NaaS Calculator. These files are **not currently integrated** into the production v1.0 codebase and require additional setup to use.

## What's Here

### `/components` - React UI Components (140KB, ~4,500 lines)
React components for future UI features:
- **auth/** - Authentication forms (Login, Signup, Password Reset, Protected Routes)
- **errors/** - Error handling (Error Boundaries, Fallbacks, 404 pages)
- **feedback/** - UI feedback (Loading spinners, Skeletons, Toast notifications)
- **forms/** - Form utilities (FormField components, useForm hook with Zod validation)
- **agents/** - Task agent implementations

### `/lib` - Integration Clients (44KB, ~1,500 lines)
LLM and platform integration clients:
- **llm-providers/** - OpenAI and Anthropic API clients with token counting and cost tracking
- **platforms/** - Platform integration client
- **vector-databases/** - Vector database client for embeddings

### `/tools` - Development Tools (108KB, ~3,500 lines)
Utility tools for development:
- API caller, code analyzer, database query, embedding tool
- Filesystem operations, MCP client, test generator
- Vector search, web scraper

### `/scripts` - Build Scripts (68KB, ~1,400 lines)
Build and deployment automation:
- Database backup and migration scripts
- Deployment automation
- Test runner utilities

## Why These Files Are Archived

1. **Zero Integration**: None of these files are imported or used in the current v1.0 production code
2. **Missing Dependencies**: Requires React, TypeScript, Zod, OpenAI SDK, Anthropic SDK (not in package.json)
3. **No Build Pipeline**: No tsconfig.json, no React plugin for Vite
4. **Roadmap Alignment**: These appear to be v2.0 enterprise platform features (per PRD and roadmap)
5. **Current Architecture**: v1.0 uses Vanilla JS + Vite intentionally for simplicity

## When to Use These Files

These prototypes are intended for:
- **v2.0 Enterprise Platform** (Q3-Q4 2025) - Backend infrastructure, multi-tenant architecture
- **Future Authentication** - User login/signup when backend is ready
- **LLM Integrations** - AI-powered features requiring OpenAI/Anthropic APIs
- **Advanced Tooling** - Database operations, vector search, code analysis

## How to Integrate (Future)

When ready to use these files in a future version:

1. **Install Dependencies:**
   ```bash
   npm install react react-dom zod openai @anthropic-ai/sdk tiktoken
   npm install -D typescript @types/react @types/react-dom @vitejs/plugin-react
   ```

2. **Create TypeScript Config:**
   ```bash
   # Create tsconfig.json with React and ES2020 target
   ```

3. **Update Vite Config:**
   ```javascript
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react(), ...],
     // Add TypeScript support
   })
   ```

4. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "lint": "eslint src --ext .js,.ts,.tsx --fix"
     }
   }
   ```

5. **Migrate gradually** - Convert vanilla JS components to React incrementally

## Total Code Volume

- **Total Lines**: ~10,895 lines of TypeScript/React code
- **Total Size**: ~360KB of source code
- **Files**: 30 TypeScript/React files

## Related Documentation

- See `docs/PRD.md` for v2.0 feature specifications
- See `docs/DEVELOPMENT_ROADMAP.md` for v2.0 timeline (Q3-Q4 2025)
- Current v1.0 architecture: Vanilla JS + Vite (no React/TypeScript)

## Maintenance Note

These files represent exploration and prototyping work. When integrating:
1. Review dependencies for security updates
2. Test thoroughly with current architecture
3. Update TypeScript to latest stable version
4. Verify API client compatibility with latest SDK versions
5. Run full test suite after integration

---

**Status**: Archived prototype code for v2.0+
**Last Updated**: October 2025
**Action**: No action required for v1.x development
