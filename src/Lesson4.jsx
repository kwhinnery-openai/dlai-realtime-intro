import React from "react";

export default function Lesson4({ apiKey }) {
  return (
    <div className="text-gray-700">
      Lesson 4 Demo Placeholder
      <br />
      Ephemeral Token:{" "}
      <span className="font-mono text-xs">{apiKey || "Not set"}</span>
    </div>
  );
}
