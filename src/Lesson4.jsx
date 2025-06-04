import React, { useState, useRef, useEffect } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";

export default function Lesson4({ apiKey }) {
  const [status, setStatus] = useState("Not connected");
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [lastGuardrailTrip, setLastGuardrailTrip] = useState(null);
  const audioRef = useRef(null);
  const sessionRef = useRef(null);
  const logContainerRef = useRef(null);

  // Scroll to bottom when logs change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Do not talk about baseball
  const guardrails = [
    {
      name: "No mention of baseball",
      async execute({ agentOutput }) {
        const baseballInOutput = agentOutput.includes("baseball");
        return {
          tripwireTriggered: baseballInOutput,
          outputInfo: { baseballInOutput },
        };
      },
    },
  ];

  const handleConnect = async () => {
    setStatus("Connecting...");
    setError(null);
    setLogs([]);
    setLastGuardrailTrip(null);
    try {
      if (!apiKey) {
        setError("Ephemeral API key is required.");
        setStatus("Not connected");
        return;
      }
      // Create the agent
      const agent = new RealtimeAgent({
        name: "Guarded Voice Agent",
        instructions:
          "Greet the user and answer questions. Do not mention baseball under any circumstances.",
      });

      // Create the session with guardrails
      const session = new RealtimeSession(agent, {
        model: "gpt-4o-realtime-preview-2025-06-03",
        outputGuardrails: guardrails,
      });
      sessionRef.current = session;

      // Connect the session
      await session.connect({ apiKey });
      setStatus("Connected");
      setLogs((prev) => [...prev, "Realtime session established."]);

      // Log all raw events
      session.transport.on("*", (event) => {
        setLogs((prev) => [...prev, { type: "raw", event }]);
      });
      // Handle errors (keep for connection errors)
      session.on("error", (err) => {
        setError(typeof err === "string" ? err : JSON.stringify(err, null, 2));
        setLogs((prev) => [...prev, { type: "error", event: err }]);
        setStatus("Error");
      });
    } catch (err) {
      setError(err.message);
      setStatus("Error");
      setLogs((prev) => [...prev, { type: "error", event: err }]);
    }
  };

  const handleDisconnect = () => {
    if (
      sessionRef.current &&
      typeof sessionRef.current.disconnect === "function"
    ) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setStatus("Disconnected");
    setLogs((prev) => [...prev, "Disconnected from session."]);
    setLastGuardrailTrip(null);
  };

  const toggleExpand = (idx) => {
    setExpandedLogs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="text-gray-700">
      <h3 className="mb-2 text-lg font-semibold">
        Lesson 4: Voice Agent with Guardrails
      </h3>
      <button
        className="bg-[#10a37f] hover:bg-[#0e8c6c] transition text-white px-3 py-1 rounded-lg font-medium shadow-sm cursor-pointer mb-2"
        onClick={handleConnect}
        disabled={
          !apiKey || status === "Connecting..." || status === "Connected"
        }
      >
        {status === "Connected" ? "Connected" : "Connect to Voice Agent"}
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
      {lastGuardrailTrip && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          <strong>Guardrail tripped!</strong>
          <div>
            {lastGuardrailTrip.guardrailName
              ? `Rule: ${lastGuardrailTrip.guardrailName}`
              : ""}
          </div>
          <div>
            {lastGuardrailTrip.outputInfo
              ? `Details: ${JSON.stringify(lastGuardrailTrip.outputInfo)}`
              : ""}
          </div>
        </div>
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
              // If log is a string, just show it
              if (typeof log === "string") {
                return (
                  <div key={i} className="mb-1">
                    <span>{log}</span>
                  </div>
                );
              }
              // If log is an object, show expandable details
              if (log.type === "raw") {
                return (
                  <div key={i} className="mb-1">
                    <button
                      className="text-[#10a37f] underline bg-white rounded p-1 border border-gray-200 text-left w-full hover:bg-green-50 transition"
                      onClick={() => toggleExpand(i)}
                      style={{ fontFamily: "inherit" }}
                    >
                      {expandedLogs[i] ? "▼ " : "▶ "}
                      {log.event?.type || "Event"}
                    </button>
                    {expandedLogs[i] && (
                      <pre className="whitespace-pre-wrap text-left bg-white rounded p-1 border border-gray-200 overflow-x-auto mt-1">
                        {JSON.stringify(log.event, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
      {/* Hidden audio element for remote audio playback */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
}
