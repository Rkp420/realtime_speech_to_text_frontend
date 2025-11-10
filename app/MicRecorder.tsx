"use client";

import { useEffect, useRef, useState } from "react";
import * as io from "socket.io-client";
import { Textarea } from "@/components/ui/textarea";

const sampleRate = 16000;

const getMediaStream = () =>
  navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: "default",
      sampleRate: sampleRate,
      sampleSize: 16,
      channelCount: 1,
    },
    video: false,
  });

interface WordRecognized {
  isFinal: boolean;
  text: string;
}

export default function Home() {
  const [connection, setConnection] = useState<io.Socket>();
  const [currentRecognition, setCurrentRecognition] = useState<string>();
  const [sessionTranscript, setSessionTranscript] = useState<string>("");
  const [recognitionHistory, setRecognitionHistory] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const processorRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const audioInputRef = useRef<any>(null);


  const speechRecognized = (data: WordRecognized) => {
    if (data.isFinal) {
      setSessionTranscript((prev) =>
        prev ? `${prev} ${data.text}` : data.text
      );
      setCurrentRecognition(""); 
    } else {
      setCurrentRecognition(data.text);
    }
  };

  const connect = () => {
    connection?.disconnect();
    const socket = io.connect("http://localhost:8081");
    socket.on("connect", () => {
      console.log("connected", socket.id);
      setConnection(socket);
    });

    socket.emit("startGoogleCloudStream");
    socket.on("receive_audio_text", (data) => speechRecognized(data));
  };

  const disconnect = () => {
    if (!connection) return;
    connection.emit("endGoogleCloudStream");
    connection.disconnect();

    if (sessionTranscript.trim()) {
      setRecognitionHistory((old) => [sessionTranscript.trim(), ...old]);
      setSessionTranscript("");
    }

    processorRef.current?.disconnect();
    audioInputRef.current?.disconnect();
    audioContextRef.current?.close();
    setConnection(undefined);
    setIsRecording(false);
  };

  useEffect(() => {
    (async () => {
      if (connection) {
        if (isRecording) return;
        const stream = await getMediaStream();
        audioContextRef.current = new window.AudioContext();

        await audioContextRef.current.audioWorklet.addModule(
          "/src/recorderWorkletProcessor.js"
        );

        audioInputRef.current =
          audioContextRef.current.createMediaStreamSource(stream);

        processorRef.current = new AudioWorkletNode(
          audioContextRef.current,
          "recorder.worklet"
        );

        processorRef.current.connect(audioContextRef.current.destination);
        audioInputRef.current.connect(processorRef.current);

        processorRef.current.port.onmessage = (event: any) => {
          const audioData = event.data;
          connection.emit("send_audio_data", { audio: audioData });
        };
        setIsRecording(true);
      }
    })();
    return () => {
      if (isRecording) {
        processorRef.current?.disconnect();
        audioInputRef.current?.disconnect();
        if (audioContextRef.current?.state !== "closed") {
          audioContextRef.current?.close();
        }
      }
    };
  }, [connection, isRecording]);

  const handleMicClick = () => {
    if (!isRecording) {
      connect();
    } else {
      disconnect();
    }
  };

  return (
    <div className="flex w-screen min-h-screen flex-col bg-black text-white">
      <main className="flex flex-col items-center gap-8 pt-20">
        <div className="mic-container my-5">
          <div
            className={`mic-icon ${isRecording ? "listening" : ""}`}
            onClick={handleMicClick}
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
