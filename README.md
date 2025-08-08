# AI Medical Consultation Platform - Frontend

Next.js web application for testing voice-powered medical consultations with AI doctor simulation.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account for authentication
- LiveKit credentials (shared with backend)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create `.env.local` file:
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3005
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open the application:**
Navigate to [http://localhost:3005](http://localhost:3005) (Note: Port 3005 in Docker, 3000 locally)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js 14 App Router pages
│   ├── components/           # React components
│   │   ├── playground/       # LiveKit voice interface
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   └── styles/              # Global styles
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

## 🎯 Key Features

### Voice Interface
- **Real-time Voice Chat**: Powered by LiveKit WebRTC
- **Live Transcriptions**: See what you and the AI doctor are saying
- **Visual Feedback**: Audio visualizers and state indicators
- **Connection Management**: Easy connect/disconnect controls

### Dashboard
- **Appointment Overview**: View scheduled appointments
- **Client Management**: Track patient information
- **Staff Directory**: Manage healthcare providers
- **Calendar Integration**: Visual appointment scheduling

### Authentication
- **Supabase Auth**: Secure user authentication
- **Protected Routes**: Role-based access control
- **Session Management**: Persistent login state

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Key Components

#### Playground Component
The main voice interface located in `src/components/playground/`:
- Handles LiveKit room connections
- Manages voice assistant state
- Displays real-time transcriptions
- Controls audio input/output

#### Connection Hook
`src/hooks/useConnection.tsx`:
- Manages LiveKit connection state
- Handles authentication tokens
- Provides connection utilities

## 🎨 Styling

- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Custom Theme**: Configurable color schemes
- **Dark Mode**: Built-in dark theme support

## 🚀 Deployment

### Vercel Deployment
The app auto-deploys via Vercel:
- **Production**: Push to `main` branch
- **Staging**: Push to `staging` branch
- **Development**: Push to `dev` branch

### Environment Variables
Set these in Vercel dashboard:
- All `NEXT_PUBLIC_*` variables
- `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`

## 🚨 Important Notes

1. **Port Configuration**: Runs on port 3005 in Docker, 3000 locally
2. **Mobile Support**: Currently not optimized for mobile devices
3. **Browser Support**: Best experience in Chrome/Edge
4. **WebRTC Requirements**: Requires secure context (HTTPS/localhost)

## 🐛 Troubleshooting

### Connection Issues
- Verify LiveKit credentials match backend
- Check browser console for WebRTC errors
- Ensure microphone permissions are granted

### Authentication Problems
- Verify Supabase URL and anon key
- Check network tab for auth errors
- Clear local storage and retry

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run dev
```

## 📄 License

See parent repository for license information.
