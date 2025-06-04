import React from "react";

export default function Lesson6({ apiKey }) {
  return (
    <div className="text-gray-700">
      Lesson 6 Demo Placeholder
      <br />
      Ephemeral Token:{" "}
      <span className="font-mono text-xs">{apiKey || "Not set"}</span>
    </div>
  );
}
