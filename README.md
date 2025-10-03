# 🎨 Vibe Editor - Modern Web Development Environment

![Vibe Editor Thumbnail](public/vibe-code-editor-thumbnail.svg)

**Vibe Editor** is a modern, feature-rich web-based development environment built with Next.js 15 (App Router) and TypeScript. It provides a seamless coding experience with a beautiful UI powered by TailwindCSS and ShadCN UI components, offering a perfect blend of functionality and aesthetics for modern web development.

---

## Features

### Core Features
- **Modern UI** - Built with TailwindCSS and ShadCN UI components
- **Theme Support** - Light and dark mode theming with `next-themes`
- **Responsive Design** - Works seamlessly across all device sizes
- **Fast Refresh** - Built with Next.js 15 and Turbopack for lightning-fast development

### Development Environment
- **Monaco Editor** - Feature-rich code editor with syntax highlighting
- **File Explorer** - Intuitive file and folder management
- **Terminal** - Integrated terminal using xterm.js
- **Code Search** - Powerful search functionality across your project

### Project Management
- **Dashboard** - Central hub for all your projects
- **Project Templates** - Quick start with various project templates
- **Real-time Collaboration** - Work together with your team in real-time
- **Dependency Management** - Built-in package management

---

## Tech Stack

### Core Technologies
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + ShadCN UI
- **State Management**: Zustand + React Hooks
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Prisma ORM
- **UI Components**: Radix UI + ShadCN
- **Code Editor**: Monaco Editor
- **Terminal**: xterm.js

### Key Dependencies
- **Form Handling**: React Hook Form + Zod
- **Date/Time**: date-fns
- **Charts**: Recharts
- **Markdown**: react-markdown
- **UI Utilities**: class-variance-authority, clsx, tailwind-merge
- **Icons**: Lucide React
- **Notifications**: Sonner              |

---

## Getting Started

```
.
├── app/                     # App Router-based pages & routes
├── components/              # UI components
├── editor/                 # Monaco, File Explorer, Terminal
├── lib/                     # Utility functions
├── public/                  # Static files (incl. thumbnail)
├── utils/                   # AI helpers, WebContainer logic
├── .env.example             # Example env vars
└── README.md
```

---

## 🎯 Keyboard Shortcuts

- `Ctrl + Space` or `Double Enter`: Trigger AI suggestions
- `Tab`: Accept AI suggestion
- `/`: Open Command Palette (if implemented)

---

## ✅ Roadmap

- [x] Google & GitHub Auth via NextAuth
- [x] Multiple stack templates
- [x] Monaco Editor + AI
- [x] WebContainers + terminal  
- [x] AI chat for code assistance
- [ ] GitHub repo import/export
- [ ] Save/load playground from DB
- [ ] Real-time collaboration
- [ ] Plugin system for templates/tools
- [ ] One-click deploy via Vercel/Netlify

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Ollama](https://ollama.com/) – for offline LLMs
- [WebContainers](https://webcontainers.io/)
- [xterm.js](https://xtermjs.org/)
- [NextAuth.js](https://next-auth.js.org/)

```
