import React, { useState, useRef, useEffect } from "react";

export default function Lesson2({ apiKey }) {
  const [status, setStatus] = useState("Not connected");
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [instructions, setInstructions] = useState("");
  const [inputInstructions, setInputInstructions] = useState("");
  const audioRef = useRef(null);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const logContainerRef = useRef(null);
  const [expandedLogs, setExpandedLogs] = useState({});

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleConnect = async () => {
    setStatus("Connecting...");
    setError(null);
    setLogs([]);
    try {
      if (!apiKey) {
        setError("Ephemeral API key is required.");
        setStatus("Not connected");
        return;
      }
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      let audioEl = audioRef.current;
      if (!audioEl) {
        audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioRef.current = audioEl;
      }
      pc.ontrack = (e) => {
        setLogs((prev) => [...prev, "Received remote audio track."]);
        audioEl.srcObject = e.streams[0];
        audioEl.play().catch((err) => {
          setLogs((prev) => [...prev, `Audio play() error: ${err.message}`]);
        });
      };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("message", (e) => {
        setLogs((prev) => [...prev, `Received: ${e.data}`]);
        try {
          const evt = JSON.parse(e.data);
          if (evt.type === "session.updated" && evt.session?.instructions) {
            setInstructions(evt.session.instructions);
          }
        } catch {}
      });
      dc.addEventListener("open", () => {
        setLogs((prev) => [...prev, "Data channel open"]);
      });
      dc.addEventListener("close", () => {
        setLogs((prev) => [...prev, "Data channel closed"]);
      });
      dc.addEventListener("error", (e) => {
        setLogs((prev) => [...prev, `Data channel error: ${e.message}`]);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2025-06-03";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(
          `SDP response error: ${sdpResponse.status} ${sdpResponse.statusText}`
        );
      }

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
      setStatus("Connected");
      setLogs((prev) => [...prev, "WebRTC connection established."]);
    } catch (err) {
      setError(err.message);
      setStatus("Error");
      setLogs((prev) => [...prev, `Error: ${err.message}`]);
    }
  };

  const handleDisconnect = () => {
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setStatus("Disconnected");
    setLogs((prev) => [...prev, "Disconnected from peer and ended session."]);
  };

  const handleUpdateInstructions = (e) => {
    e.preventDefault();
    if (!dcRef.current || !inputInstructions.trim()) return;
    const event = {
      type: "session.update",
      session: {
        instructions: inputInstructions,
      },
    };
    dcRef.current.send(JSON.stringify(event));
    setLogs((prev) => [...prev, `Sent session.update: ${inputInstructions}`]);
    setInputInstructions("");
  };

  const toggleExpand = (idx) => {
    setExpandedLogs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="text-gray-700">
      <h3 className="mb-2 text-lg font-semibold">
        Lesson 2: Prompting and steering
      </h3>
      <button
        className="bg-[#10a37f] hover:bg-[#0e8c6c] transition text-white px-3 py-1 rounded-lg font-medium shadow-sm cursor-pointer mb-2"
        onClick={handleConnect}
        disabled={
          !apiKey || status === "Connecting..." || status === "Connected"
        }
      >
        {status === "Connected" ? "Connected" : "Connect to Realtime API"}
      </button>
      {(status === "Connected" || status === "Connecting...") && (
        <button
          className="ml-2 bg-red-500 hover:bg-red-600 transition text-white px-3 py-1 rounded-lg font-medium shadow-sm cursor-pointer mb-2"
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
      )}
      <div className="mb-2">
        Status: <span className="font-mono text-xs">{status}</span>
      </div>
      {error && <div className="text-red-600 text-xs mb-2">Error: {error}</div>}
      <div className="mb-2">
        <strong>Current instructions:</strong>
        <div className="bg-gray-100 p-2 rounded text-xs mt-1 min-h-[2em]">
          {instructions || <span className="text-gray-400">(none set)</span>}
        </div>
      </div>
      {status === "Connected" && (
        <form className="mb-2 flex gap-2" onSubmit={handleUpdateInstructions}>
          <input
            className="flex-1 border rounded px-2 py-1"
            type="text"
            value={inputInstructions}
            onChange={(e) => setInputInstructions(e.target.value)}
            placeholder="Set new instructions (e.g. Talk like a pirate!)"
            disabled={status !== "Connected"}
          />
          <button
            className="bg-[#10a37f] hover:bg-[#0e8c6c] text-white px-3 py-1 rounded"
            type="submit"
            disabled={!inputInstructions.trim() || status !== "Connected"}
          >
            Update
          </button>
        </form>
      )}
      <div className="mb-2">
        <strong>Event Log:</strong>
        <div
          ref={logContainerRef}
          className="bg-gray-100 p-2 rounded text-xs h-64 overflow-y-auto mt-1"
        >
          {logs.length === 0 ? (
            <div>No events yet.</div>
          ) : (
            logs.map((log, i) => {
              let parsed;
              try {
                parsed = JSON.parse(log.replace(/^Received: /, ""));
              } catch {
                parsed = null;
              }
              if (parsed && typeof parsed === "object" && parsed.type) {
                return (
                  <div key={i} className="mb-1">
                    <button
                      className="text-[#10a37f] underline bg-white rounded p-1 border border-gray-200 text-left w-full hover:bg-green-50 transition"
                      onClick={() => toggleExpand(i)}
                      style={{ fontFamily: "inherit" }}
                    >
                      {expandedLogs[i] ? "▼ " : "▶ "}
                      {parsed.type}
                    </button>
                    {expandedLogs[i] && (
                      <pre className="whitespace-pre-wrap text-left bg-white rounded p-1 border border-gray-200 overflow-x-auto mt-1">
                        {JSON.stringify(parsed, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              }
              return (
                <div key={i} className="mb-1">
                  <span>{log}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
}
