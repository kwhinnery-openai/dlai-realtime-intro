import React, { useState, useRef } from "react";
import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents/realtime";
import { z } from "zod";

// Define the addNumbers tool
const addNumbersParams = z.object({
  a: z.number(),
  b: z.number(),
});

const addNumbersTool = tool({
  name: "addNumbers",
  description: "Adds two numbers together.",
  parameters: addNumbersParams,
  execute: async ({ a, b }) => {
    console.log("Adding numbers:", a, b);
    return { result: a + b };
  },
});

export default function Lesson5({ apiKey }) {
  const [status, setStatus] = useState("Not connected");
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState("");
  const sessionRef = useRef(null);
  const logContainerRef = useRef(null);
  const [expandedLogs, setExpandedLogs] = useState({});

  // Scroll to bottom when logs change
  React.useEffect(() => {
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
      // Create the agent with the addNumbers tool
      const agent = new RealtimeAgent({
        name: "Math Assistant",
        instructions: "You can add numbers using the addNumbers tool.",
        tools: [addNumbersTool],
      });
      const session = new RealtimeSession(agent, {
        model: "gpt-4o-realtime-preview-2025-06-03",
      });
      sessionRef.current = session;
      await session.connect({ apiKey });
      setStatus("Connected");
      setLogs((prev) => [...prev, "Realtime session established."]);
      session.transport.on("*", (event) => {
        setLogs((prev) => [...prev, { type: "raw", event }]);
      });
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
    setStatus("Disconnected");
    setLogs((prev) => [...prev, "Disconnected from session."]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!sessionRef.current || !input.trim()) return;
    sessionRef.current.sendMessage(input);
    setLogs((prev) => [...prev, { type: "user", content: input }]);
    setInput("");
  };

  const toggleExpand = (index) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="text-gray-700">
      <h3 className="mb-2 text-lg font-semibold">
        Lesson 5: Function Calling with Custom Tool
      </h3>
      <button
        className="bg-[#10a37f] hover:bg-[#0e8c6c] transition text-white px-3 py-1 rounded-lg font-medium shadow-sm cursor-pointer mb-2"
        onClick={handleConnect}
        disabled={
          !apiKey || status === "Connecting..." || status === "Connected"
        }
      >
        {status === "Connected" ? "Connected" : "Connect to Agent"}
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
      {status === "Connected" && (
        <form className="mb-2 flex gap-2" onSubmit={handleSend}>
          <input
            className="flex-1 border rounded px-2 py-1"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent to add two numbers (e.g. What is 2 plus 3?)"
            disabled={status !== "Connected"}
          />
          <button
            className="bg-[#10a37f] hover:bg-[#0e8c6c] text-white px-3 py-1 rounded"
            type="submit"
            disabled={!input.trim() || status !== "Connected"}
          >
            Send
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
              if (typeof log === "string") {
                return (
                  <div key={i} className="mb-1">
                    <span>{log}</span>
                  </div>
                );
              }
              if (log.type === "user") {
                return (
                  <div key={i} className="mb-1 text-blue-700">
                    <strong>User:</strong> {log.content}
                  </div>
                );
              }
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
              if (log.type === "error") {
                return (
                  <div key={i} className="mb-1 text-red-700">
                    <strong>Error:</strong>{" "}
                    {typeof log.event === "string"
                      ? log.event
                      : JSON.stringify(log.event, null, 2)}
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
      </div>
    </div>
  );
}
