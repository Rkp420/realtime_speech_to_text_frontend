"use client";

import { useRef, useState } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { Textarea } from "@/components/ui/textarea";

export default function HomePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecognition, setCurrentRecognition] = useState<string>();
  const [sessionTranscript, setSessionTranscript] = useState<string>("");
  const [recognitionHistory, setRecognitionHistory] = useState<string[]>([]);

  const deepgramConnRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    if (isRecording) return;

    const res = await fetch("/api/token");
    const { key } = await res.json();

    if (!key) {
      alert("Deepgram key not found");
      return;
    }

    const deepgram = createClient(key);
    const conn = deepgram.listen.live({
      model: "nova-2",
      language: "en-US",
      interim_results: true,
    });

    deepgramConnRef.current = conn;

    conn.on(LiveTranscriptionEvents.Open, async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0 && conn.getReadyState() === 1) {
          conn.send(await e.data.arrayBuffer());
        }
      };

      recorder.start(100);
      setIsRecording(true);

      conn.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcriptText = data.channel.alternatives[0]?.transcript || "";
        if (!transcriptText) return;

        if (data.is_final) {
          setSessionTranscript((prev) =>
            prev ? `${prev} ${transcriptText}` : transcriptText
          );
          setCurrentRecognition("");
        } else {
          setCurrentRecognition(transcriptText);
        }
      });

      conn.on(LiveTranscriptionEvents.Close, handleStop);
      conn.on(LiveTranscriptionEvents.Error, (err: any) => {
        console.error("Deepgram error:", err);
        handleStop();
      });
    });
  }

  function handleStop() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (deepgramConnRef.current) {
      deepgramConnRef.current.finish();
      deepgramConnRef.current = null;
    }

    if (sessionTranscript.trim()) {
      setRecognitionHistory((old) => [sessionTranscript.trim(), ...old]);
      setSessionTranscript("");
    }

    setCurrentRecognition("");
    setIsRecording(false);
  }

  function stopRecording() {
    if (!isRecording) return;
    handleStop();
  }

  return (
    <div className="flex w-screen min-h-screen flex-col bg-black text-white">
      <main className="flex flex-col items-center gap-8 pt-20">
        <div className="mic-container my-5">
          <div
            className={`mic-icon ${isRecording ? "listening" : ""}`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            <i className="bi bi-mic-fill"></i>
          </div>
          <p className="text-muted mt-3">
            {isRecording ? "Listening..." : "Tap the mic to start listening"}
          </p>
        </div>
        <Textarea
          className="min-h-[120px] px-4 py-2 w-100 text-lg text-left break-words whitespace-normal leading-relaxed"
          readOnly
          value={
            `${
              sessionTranscript ||
              (!isRecording ? "Tap the mic to start listening..." : "")
            }` + (currentRecognition ? ` ${currentRecognition}` : "")
          }
        />
        <h2 className="text-lg font-semibold mb-4">Transcript History</h2>
        <div className="flex flex-col gap-3 text-sm">
          {recognitionHistory.length === 0 ? (
            <p className="text-zinc-500">No transcripts yet</p>
          ) : (
            recognitionHistory.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
              >
                {item}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}