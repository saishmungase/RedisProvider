'use client'

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import fetchInstance from '@/app/actions/fetchinstance';

interface LanguageConfig {
    install: string;
    language: string;
    fileName: string;
    code: string;
}

interface InstanceDetailProps {
    port?: number;
    username?: string;
    onBack: () => void;
}

const InstanceDetail = ({ port = 7009, onBack }: InstanceDetailProps) => {
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("....")
    const [status, setStatus] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState<string>("");

    const startTimer = (createdAt: string) => {
        const expiryTime = new Date(createdAt).getTime() + (24 * 60 * 60 * 1000);
        
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = expiryTime - now;

            if (distance < 0) {
                setTimeLeft("EXPIRED");
                clearInterval(interval);
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    };

    const LANGUAGE_DATA: Record<string, LanguageConfig> = {
        NODEJS: {
            install: "npm i redis",
            language: "javascript",
            fileName: "nodejs_client.js",
            code: `import { createClient } from 'redis';\n\nconst client = createClient({\n    socket: { \n        host: "redis.saish.tech", \n        port: ${port} \n    },\n    username: "${username}",\n    password: "${password}"\n});\n\nasync function handleRedis() {\n    await client.connect();\n    \n    // Set a value\n    await client.set('key', 'Hello QuickDB!');\n    \n    // Get and return the data\n    const data = await client.get('key');\n    return data;\n}\n\nhandleRedis();`
        },
        SPRING: {
            install: 'implementation "org.springframework.boot:spring-boot-starter-data-redis"',
            language: "java",
            fileName: "RedisConfig.java",
            code: `// application.properties\nspring.data.redis.host=redis.saish.tech\nspring.data.redis.port=${port}\nspring.data.redis.username=${username}\nspring.data.redis.password=${password}\n\n// Usage in Service\n@Autowired\nprivate StringRedisTemplate redisTemplate;\n\npublic void saveData(String key, String value) {\n    redisTemplate.opsForValue().set(key, value);\n}\n\npublic String getData(String key) {\n    return redisTemplate.opsForValue().get(key);\n}`
        },
        RUST: {
            install: 'redis = "0.24.0"',
            language: "rust",
            fileName: "main.rs",
            code: `use redis::Commands;\n\nfn main() -> redis::RedisResult<()> {\n    // Connection URI pattern\n    let uri = "redis://${username}:${password}@redis.saish.tech:${port}";\n    let client = redis::Client::open(uri)?;\n    let mut con = client.get_connection()?;\n\n    // Basic usage\n    con.set("my_key", 42)?;\n    let val: i32 = con.get("my_key")?;\n    \n    println!("Value: {}", val);\n    Ok(())\n}`
        },
        PYTHON: {
            install: "pip install redis",
            language: "python",
            fileName: "app.py",
            code: `import redis\n\n# Initialize Client\nr = redis.Redis(\n    host='redis.saish.tech',\n    port=${port},\n    username='${username}',\n    password='${password}',\n    decode_responses=True\n)\n\n# Implementation\ndef handle_data():\n    r.set('session_id', '12345')\n    return r.get('session_id')\n\nprint(handle_data())`
        },
        GO: {
            install: "go get github.com/redis/go-redis/v9",
            language: "go",
            fileName: "main.go",
            code: `package main\n\nimport (\n    "context"\n    "github.com/redis/go-redis/v9"\n)\n\nvar ctx = context.Background()\n\nfunc main() {\n    rdb := redis.NewClient(&redis.Options{\n        Addr:     "redis.saish.tech:${port}",\n        Username: "${username}",\n        Password: "${password}",\n    })\n\n    // Usage\n    err := rdb.Set(ctx, "key", "value", 0).Err()\n    val, err := rdb.Get(ctx, "key").Result()\n}`
        }
    };

    type LanguageKey = keyof typeof LANGUAGE_DATA;
    const [activeTab, setActiveTab] = useState<LanguageKey>('NODEJS');
    
    const [showPassword, setShowPassword] = useState(false);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("AuthToken");
            console.log("Token:", token);
            
            if (!token) return;

            const data = await fetchInstance(port, token);
            console.log("Data:", data);

            if (data) {
                setUserName(data.username);
                setPassword(data.password);
                setStatus(data.status);
                
                if (data.createdat) {
                    startTimer(data.createdat);
                }
            }
        };

        fetchData();

    }, [port]);

    const handleCopy = (text: string, id: string) => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(text);
            setCopyStatus(id);
            setTimeout(() => setCopyStatus(null), 2000);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-[#050505] mt-20 text-white p-6 sm:p-12 font-sans overflow-x-hidden">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <button onClick={onBack} className="text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                        ← Back to Dashboard
                    </button>

                    {/* Timer and Status UI */}
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${status === 'RUNNING' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-red-500 border-red-500/30 bg-red-500/10'}`}>
                                {status || 'INITIALIZING'}
                            </span>
                        </div>
                        <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                            Time Remaining: <span className="text-white">{timeLeft || 'calculating...'}</span>
                        </div>
                    </div>
                </div>
                
                <h1 className="text-[80px] sm:text-[120px] font-mono font-bold text-center mb-12 leading-none tracking-tighter">
                    {port}
                </h1>

                {/* Credentials Bar */}
                <div className="flex flex-col sm:flex-row justify-center gap-6 py-10 border-y border-zinc-900 mb-12 bg-[#080808]/60 rounded-[2.5rem] px-10">
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-600 italic font-mono text-sm">name:-</span>
                        <span className="text-emerald-400 font-bold text-lg">{username}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-600 italic font-mono text-sm">password:-</span>
                        <span className="font-mono text-lg">{showPassword ? password : '••••••'}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="text-[10px] bg-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-800 font-black border border-zinc-800"
                            >
                                {showPassword ? 'HIDE' : 'SHOW'}
                            </button>
                            <button 
                                onClick={() => handleCopy(password, 'pass')} 
                                className="text-[10px] bg-white text-black px-3 py-1.5 rounded-lg font-black hover:bg-emerald-400 transition-all"
                            >
                                {copyStatus === 'pass' ? 'COPIED!' : 'COPY'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navbar Navigation */}
                <div className="flex flex-wrap gap-3 mb-12 justify-center">
                    {(Object.keys(LANGUAGE_DATA) as LanguageKey[]).map((lang) => (
                        <button 
                            key={lang} 
                            onClick={() => setActiveTab(lang)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                                activeTab === lang 
                                ? 'bg-white text-black border-white' 
                                : 'text-zinc-600 border-zinc-900 hover:border-zinc-700'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>

                {/* Integration Steps */}
                <div className="space-y-12">
                    <section>
                        <h2 className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Step-1: Install</h2>
                        <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-zinc-900 flex justify-between items-center group">
                            <code className="font-mono text-sm text-zinc-300 tracking-tight">
                                <span className="text-emerald-500 mr-2">$</span>
                                {LANGUAGE_DATA[activeTab].install}
                            </code>
                            <button 
                                onClick={() => handleCopy(LANGUAGE_DATA[activeTab].install, 'step1')}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                {copyStatus === 'step1' ? '✓' : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                )}
                            </button>
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h2 className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Step-2: Code Implementation</h2>
                            <button 
                                onClick={() => handleCopy(LANGUAGE_DATA[activeTab].code, 'step2')}
                                className="text-[10px] font-black uppercase bg-zinc-900 text-zinc-400 px-5 py-2 rounded-xl border border-zinc-800 hover:bg-white hover:text-black transition-all"
                            >
                                {copyStatus === 'step2' ? 'COPIED TO CLIPBOARD' : 'COPY SNIPPET'}
                            </button>
                        </div>
                        <div className="bg-[#020202] border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="bg-[#0A0A0A] px-6 py-4 border-b border-zinc-900 flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                                <span className="ml-4 text-zinc-700 text-[10px] font-mono uppercase tracking-widest">
                                    {LANGUAGE_DATA[activeTab].fileName}
                                </span>
                            </div>
                            
                            <div className="p-4 bg-[#020202]">
                                <Editor
                                    height="400px"
                                    theme="vs-dark"
                                    path={LANGUAGE_DATA[activeTab].fileName}
                                    defaultLanguage={LANGUAGE_DATA[activeTab].language}
                                    value={LANGUAGE_DATA[activeTab].code}
                                    loading={<div className="text-zinc-700 font-mono text-xs p-10 uppercase tracking-widest animate-pulse">Initializing Environment...</div>}
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        scrollBeyondLastLine: false,
                                        lineNumbers: 'on',
                                        fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                                        padding: { top: 20, bottom: 20 },
                                        scrollbar: {
                                            vertical: 'hidden',
                                            horizontal: 'hidden'
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default InstanceDetail;