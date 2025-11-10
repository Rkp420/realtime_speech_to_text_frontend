
⸻

🎙️ Real-Time Speech Transcription (Next.js Frontend)

This is a Next.js 14 project built with the App Router and shadcn/ui, providing a real-time speech-to-text interface that connects to a backend speech recognition service (e.g. Google Cloud Speech-to-Text) via Socket.IO.

⸻

🚀 Features
	•	🎤 Live microphone input using MediaStream and AudioWorklet
	•	🔊 Real-time transcription displayed as you speak
	•	🧠 Google Cloud Speech recognition via Socket.IO streaming
	•	🪶 Clean UI with shadcn/ui and framer-motion
	•	🌗 Dark theme support with responsive design
	•	🧾 Session transcript history tracking all recognized speech

⸻

🛠️ Tech Stack
	•	Next.js 14 (App Router)
	•	TypeScript
	•	Socket.IO client
	•	AudioWorklet API
	•	TailwindCSS + shadcn/ui
	•	Framer Motion

⸻

⚙️ Getting Started

1️⃣ Clone the repository

git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

2️⃣ Install dependencies

npm install
# or
yarn install
# or
pnpm install
# or
bun install

3️⃣ Start the development server

npm run dev

The app will be available at 👉 http://localhost:3000￼

⸻

🧩 Backend Setup (Required)

This frontend connects to a backend WebSocket server (Node.js + Socket.IO) for real-time speech recognition.

Update the connection URL in your component if your backend runs elsewhere:

const socket = io("http://localhost:8081");

Ensure your backend emits:
	•	receive_audio_text → with { isFinal: boolean; text: string } payloads
	•	Handles:
	•	startGoogleCloudStream
	•	endGoogleCloudStream
	•	send_audio_data

⸻

📁 File Structure

📦 project-root
 ┣ 📂 app
 ┃ ┣ 📜 page.tsx              # Main UI
 ┃ ┣ 📜 layout.tsx            # Root layout
 ┣ 📂 public
 ┃ ┗ 📂 worklets
 ┃    ┗ 📜 recorderWorkletProcessor.js  # AudioWorklet processor
 ┣ 📂 components/ui           # shadcn components
 ┣ 📜 package.json
 ┣ 📜 README.md
 ┗ 📜 tsconfig.json


⸻

🧠 Common Issues

❌ Transcript not updating?

Check your browser console for:
	•	404 error for /worklets/recorderWorkletProcessor.js
	•	Missing receive_audio_text logs

✅ Fix:
Move recorderWorkletProcessor.js to /public/worklets/ and reference it like:

await audioContext.audioWorklet.addModule("/worklets/recorderWorkletProcessor.js");


⸻

🌍 Deployment

Deploy easily using Vercel (recommended for Next.js apps):

Deploy on Vercel￼

Or build locally:

npm run build
npm start


⸻

📚 Learn More
	•	Next.js Documentation￼
	•	Socket.IO Client Docs￼
	•	Web Audio API￼

⸻

💡 Author

Developed by Rahul Kumar Patel
💻 GitHub: @Rkp420￼

⸻