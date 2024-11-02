// pages/index.js
import { useState, useEffect } from 'react';
import { RoomProvider, useUpdateMyPresence, useOthers } from "@liveblocks/react";
import { createClient } from "@liveblocks/client";

const client = createClient({
  publicApiKey: "YOUR_LIVEBLOCKS_PUBLIC_KEY",
});

function Editor() {
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tasks, setTasks] = useState([]);
  const [contentSource, setContentSource] = useState({
    aiGenerated: 0,
    humanEdited: 0
  });
  const [editHistory, setEditHistory] = useState([]);
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();

  // Calculate content percentages
  const calculateContentPercentages = (newContent, source) => {
    const totalWords = newContent.trim().split(/\s+/).length;
    if (totalWords === 0) return { aiGenerated: 0, humanEdited: 0 };

    let aiWords = 0;
    let humanWords = 0;

    // Track words based on their source
    const words = newContent.trim().split(/\s+/);
    words.forEach(word => {
      // Check edit history to determine source
      const lastEdit = editHistory.find(edit => edit.word === word);
      if (lastEdit) {
        if (lastEdit.source === 'ai') aiWords++;
        else humanWords++;
      } else {
        // New words are attributed to current source
        if (source === 'ai') aiWords++;
        else humanWords++;
      }
    });

    return {
      aiGenerated: Math.round((aiWords / totalWords) * 100),
      humanEdited: Math.round((humanWords / totalWords) * 100)
    };
  };

  // Handle text changes with source tracking
  const handleContentChange = (e, source = 'human') => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Track edit in history
    const words = newContent.trim().split(/\s+/);
    const newHistory = words.map(word => ({
      word,
      source,
      timestamp: Date.now()
    }));
    setEditHistory(newHistory);

    // Calculate new percentages
    const percentages = calculateContentPercentages(newContent, source);
    setContentSource(percentages);
    
    updateMyPresence({ content: newContent, contentSource: percentages });
  };

  // Simulate AI content generation
  const generateAIContent = async () => {
    // This is a mock AI generation - replace with actual AI API call
    const aiGeneratedText = "This is simulated AI generated content for demonstration.";
    const newContent = content + (content ? " " : "") + aiGeneratedText;
    
    // Handle the AI-generated content
    handleContentChange({ target: { value: newContent } }, 'ai');
  };

  // Content source indicator component
  const ContentSourceIndicator = ({ percentages }) => (
    <div className="flex items-center space-x-4 mb-4">
      <div className="flex-1 bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-500 h-4 rounded-full"
          style={{ width: `${percentages.aiGenerated}%` }}
        />
      </div>
      <div className="text-sm">
        <span className="text-blue-500">{percentages.aiGenerated}% AI</span>
        {' / '}
        <span className="text-green-500">{percentages.humanEdited}% Human</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Collaborative Task Editor</h1>
      
      {/* Content Source Indicator */}
      <ContentSourceIndicator percentages={contentSource} />
      
      {/* Text Editor */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={generateAIContent}
            className="bg-blue-500 text-white px-6 py-2 rounded"
          >
            Generate AI Content
          </button>
        </div>
        
        <textarea
          className="w-full p-4 border rounded-lg mb-4"
          rows="6"
          value={content}
          onChange={(e) => handleContentChange(e, 'human')}
          placeholder="Enter your task details..."
        />

        {/* Word Source Indicators */}
        <div className="text-sm mb-4">
          {content.split(/\s+/).map((word, index) => {
            const source = editHistory.find(edit => edit.word === word)?.source || 'human';
            return (
              <span
                key={index}
                className={`inline-block mr-1 px-1 rounded ${
                  source === 'ai' ? 'bg-blue-100' : 'bg-green-100'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
        
        <div className="flex gap-4 mb-4">
          <input
            type="datetime-local"
            className="border rounded px-4 py-2"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <button
            onClick={() => {
              if (!content || !deadline) return;
              const newTask = {
                id: Date.now(),
                content,
                contentSource,
                deadline: new Date(deadline),
                completed: false
              };
              setTasks([...tasks, newTask]);
              setContent("");
              setDeadline("");
              setContentSource({ aiGenerated: 0, humanEdited: 0 });
              setEditHistory([]);
            }}
            className="bg-green-500 text-white px-6 py-2 rounded"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Task List with Source Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tasks & Deadlines</h2>
        {tasks.map(task => (
          <div
            key={task.id}
            className="border p-4 rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p>{task.content}</p>
                <p className="text-sm text-gray-600">
                  Deadline: {new Date(task.deadline).toLocaleString()}
                </p>
                <div className="text-xs text-gray-500">
                  Content: {task.contentSource.aiGenerated}% AI / {task.contentSource.humanEdited}% Human
                </div>
              </div>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => {
                  setTasks(tasks.map(t =>
                    t.id === task.id ? { ...t, completed: !t.completed } : t
                  ));
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Online Users */}
      <div className="mt-6">
        <p className="text-sm text-gray-600">
          {others.count} other user(s) online
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <RoomProvider
      id="my-room"
      initialPresence={{ content: "", contentSource: { aiGenerated: 0, humanEdited: 0 } }}
      client={client}
    >
      <Editor />
    </RoomProvider>
  );
}
