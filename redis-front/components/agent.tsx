'use client'

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'agent';
    content: string;
}

interface AgentChatbotProps {
    port: number;
    password: string;
}

const api_url = 'https://redis-api.saish.tech'

export default function AgentChatbot({ port, password }: AgentChatbotProps) {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    const [currentThought, setCurrentThought] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, currentThought]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isAgentTyping) return;

        const query = chatInput;
        setChatInput("");
        setChatMessages(prev => [...prev, { role: "user", content: query }]);
        setIsAgentTyping(true);
        setCurrentThought("Thinking...");

        try {
            const response = await fetch(`${api_url}/agent/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_query: query, port, userPass: password })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let buffer = "";

            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() || ""; 

                    for (const part of parts) {
                        if (part.startsWith('data: ')) {
                            const dataStr = part.replace('data: ', '');
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.type === 'thought') {
                                    console.log("Thoughts:- " + data.content)
                                    setCurrentThought(data.content);
                                } else if (data.type === 'result') {
                                    setChatMessages(prev => [...prev, { role: "agent", content: data.content }]);
                                    setCurrentThought("");
                                    setIsAgentTyping(false);
                                }
                            } catch (err) {
                                console.error("Error parsing SSE JSON chunk:", err);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            setChatMessages(prev => [...prev, { role: "agent", content: "Connection failed. Please try again." }]);
            setIsAgentTyping(false);
            setCurrentThought("");
        }
    };

    return (
        <div className="lg:col-span-1 bg-[#0A0A0A] border border-zinc-900 rounded-[2rem] flex flex-col h-[525px] overflow-hidden shadow-2xl">
            <div className="bg-[#080808] border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">QuickDB Agent</span>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono border border-zinc-800 px-2 py-1 rounded-md bg-black">
                    PORT {port}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 
                            [&::-webkit-scrollbar]:w-1.5 
                            [&::-webkit-scrollbar-track]:bg-transparent 
                            [&::-webkit-scrollbar-thumb]:bg-zinc-800 
                            [&::-webkit-scrollbar-thumb]:rounded-full 
                            hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700
                            transition-colors"
            >
                {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                        <span className="text-3xl">🤖</span>
                        <p className="text-xs text-zinc-400 font-mono max-w-[200px]">Ask me to search keys, check metadata, or fetch values from this instance.</p>
                    </div>
                ) : (
                    chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                msg.role === 'user' 
                                ? 'bg-white text-black font-medium rounded-br-sm' 
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm font-mono text-xs leading-relaxed overflow-x-auto'
                            }`}>
                                {msg.role === 'user' ? (
                                    msg.content
                                ) : (
                                    <div className="prose prose-invert prose-sm max-w-none 
                                                   prose-p:leading-relaxed prose-pre:bg-black 
                                                   prose-pre:border prose-pre:border-zinc-800 markdown-body">
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {isAgentTyping && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-black border border-zinc-800 px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-black">Agent Thinking</span>
                            </div>
                            <p className="text-xs text-zinc-500 italic font-mono">{currentThought}</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-[#080808] border-t border-zinc-900">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask the agent a question..."
                        className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        disabled={isAgentTyping}
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim() || isAgentTyping}
                        className={`px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            !chatInput.trim() || isAgentTyping
                            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        }`}
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}