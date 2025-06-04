import "./App.css";
import { useState, useEffect } from "react";
import Lesson1 from "./Lesson1";
import Lesson2 from "./Lesson2";
import Lesson3 from "./Lesson3";
import Lesson4 from "./Lesson4";
import Lesson5 from "./Lesson5";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(1);
  const [showTokenSet, setShowTokenSet] = useState(false);
  const lessons = [
    { name: "Lesson 1", component: (apiKey) => <Lesson1 apiKey={apiKey} /> },
    { name: "Lesson 2", component: (apiKey) => <Lesson2 apiKey={apiKey} /> },
    { name: "Lesson 3", component: (apiKey) => <Lesson3 apiKey={apiKey} /> },
    { name: "Lesson 4", component: (apiKey) => <Lesson4 apiKey={apiKey} /> },
    { name: "Lesson 5", component: (apiKey) => <Lesson5 apiKey={apiKey} /> },
  ];

  const handleSetKey = () => {
    setApiKey(inputKey);
    setShowTokenSet(true);
  };

  useEffect(() => {
    if (showTokenSet) {
      const timer = setTimeout(() => setShowTokenSet(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showTokenSet]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl flex flex-col items-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">
          deeplearning.ai - OpenAI Realtime API Demos
        </h1>
        <div className="w-full">
          <div className="flex border-b border-gray-200 mb-4 justify-center">
            {lessons.map((lesson, idx) => (
              <button
                key={lesson.name}
                onClick={() => setSelectedLesson(idx + 1)}
                className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-200 focus:outline-none cursor-pointer ${
                  selectedLesson === idx + 1
                    ? "border-[#10a37f] text-[#10a37f] bg-gray-50"
                    : "border-transparent text-gray-500 hover:text-[#10a37f]"
                }`}
              >
                {lesson.name}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {lessons[selectedLesson - 1].component(apiKey)}
          </div>
        </div>
        <div className="w-full flex-col items-center text-center gap-2 mt-4 border-t border-gray-200 pt-4">
          <small className="block text-gray-500 text-xs mb-2">
            Generate a free-to-use ephemeral API token using the notebook on
            deeplearning.ai - <br /> Tokens expire after ten minutes.
          </small>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter OpenAI Ephemeral API Key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="flex-1 border border-gray-300 focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] p-1 rounded-lg bg-gray-100 text-gray-900 transition outline-none"
            />
            <button
              onClick={handleSetKey}
              className="bg-[#10a37f] hover:bg-[#0e8c6c] transition text-white px-3 py-1 rounded-lg font-medium shadow-sm cursor-pointer"
            >
              Set Token
            </button>
          </div>
        </div>
        {showTokenSet && (
          <div className="text-green-600 text-sm mt-2">API token set!</div>
        )}
      </div>
    </div>
  );
}

export default App;
