import { useState, useRef, useEffect } from "react";
import { Camera, Mic, Image as GalleryIcon, Send } from "lucide-react";

interface Message {
  type: "text" | "image" | "audio";
  content: string | File;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sendMessage = () => {
    if (input.trim() !== "") {
      setMessages((prev) => [...prev, { type: "text", content: input }]);
      setInput("");
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages((prev) => [
        ...prev,
        { type: "image", content: URL.createObjectURL(file) },
      ]);
    }
  };

  const handleCameraClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setMessages((prev) => [
        ...prev,
        { type: "text", content: `📷 Camera started` },
      ]);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "text", content: `❌ Camera access denied` },
      ]);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          setMessages((prev) => [
            ...prev,
            { type: "image", content: URL.createObjectURL(blob) },
          ]);
        }
      });
    }
  };

  const handleMicClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setMessages((prev) => [
          ...prev,
          { type: "audio", content: URL.createObjectURL(blob) },
        ]);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, 3000); // record for 3 seconds

      setMessages((prev) => [
        ...prev,
        { type: "text", content: `🎤 Recording started` },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "text", content: `❌ Microphone access denied` },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 bg-gray-50 p-4 rounded-xl shadow-inner">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className="text-left bg-white p-2 rounded-xl shadow max-w-xs"
          >
            {msg.type === "text" && <p>{msg.content}</p>}
            {msg.type === "image" && (
              <img
                src={msg.content as string}
                alt="Uploaded"
                className="rounded-md"
              />
            )}
            {msg.type === "audio" && (
              <audio controls>
                <source src={msg.content as string} type="audio/webm" />
              </audio>
            )}
          </div>
        ))}
        <div ref={endRef} />
        {cameraStream && (
          <div className="mt-4">
            <video
              ref={videoRef}
              className="rounded-lg w-full max-w-sm"
              autoPlay
              muted
            />
            <button
              onClick={capturePhoto}
              className="mt-2 bg-blue-500 text-white px-4 py-1 rounded-md"
            >
              Capture Photo
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button className="p-2" onClick={handleCameraClick}>
          <Camera className="w-5 h-5" />
        </button>
        <button className="p-2" onClick={handleMicClick}>
          <Mic className="w-5 h-5" />
        </button>
        <button className="p-2" onClick={handleGalleryClick}>
          <GalleryIcon className="w-5 h-5" />
        </button>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryChange}
        />

        <input
          type="text"
          className="flex-1 border p-2 rounded-md"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default App;
