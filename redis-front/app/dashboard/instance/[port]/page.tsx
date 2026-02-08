'use client'

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import fetchInstance, { InstanceResponse, RedisMetrics } from '@/app/actions/fetchinstance';
import { redirect, useParams, useRouter } from 'next/navigation';
import deleteInstance from '@/app/actions/deleteInstance';

interface LanguageConfig {
    install: string;
    language: string;
    fileName: string;
    code: string;
}

interface InstanceDetailProps {
    onBack: () => void;
}

const parseBytes = (memStr: string) => {
    if (!memStr) return 0;
    const match = memStr.match(/([\d.]+)\s*([A-Za-z]+)/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const multipliers: Record<string, number> = {
        'B': 1, 'KB': 1024, 'MB': 1024 ** 2, 'GB': 1024 ** 3, 'TB': 1024 ** 4
    };
    return value * (multipliers[unit] || 1);
};

const getBarColor = (percentage: number) => {
    if (percentage > 75) return 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]';
    if (percentage > 50) return 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
};

const InstanceDetail = ({ onBack }: InstanceDetailProps) => {
    const router = useRouter();
    const params = useParams<{ port: string }>();
    const port = Number(params.port);

    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("....");
    const [status, setStatus] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [metrics, setMetrics] = useState<RedisMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('NODEJS');
    const [showPassword, setShowPassword] = useState(false);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteInput, setDeleteInput] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("AuthToken");
            
            if(!token || token.length <= 5){
              redirect("/auth/login")
            }

            const response: InstanceResponse | null = await fetchInstance(port, token);
            if(response?.status != "200"){
                redirect("/live")
            }
            if (response) {
                setUserName(response.username);
                setPassword(response.password);
                setStatus(response.status);
                if (response.data) setMetrics(response.data);
                if (response.createdat) startTimer(response.createdat);
            }
            setLoading(false)
        };
        fetchData();
    }, [port]);

    const startTimer = (createdAt: string) => {
        const expiryTime = new Date(createdAt).getTime() + (24 * 60 * 60 * 1000);
        const update = () => {
            const now = new Date().getTime();
            const distance = expiryTime - now;
            if (distance < 0) { setTimeLeft("EXPIRED"); return true; }
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
            return false;
        };
        if (!update()) {
            const interval = setInterval(() => { if (update()) clearInterval(interval); }, 1000);
            return () => clearInterval(interval);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(id);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleDelete = async () => {
        if (deleteInput !== `delete ${username}`) return;
        setIsDeleting(true);
        
        try {
            const token = localStorage.getItem("AuthToken") || "";
            const res = await deleteInstance(token, port)

            if (res.ok) {
                router.push("/dashboard"); 
            } else {
                alert("Failed to delete instance");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting instance");
        } finally {
            setIsDeleting(false);
        }
    };

    const usedBytes = metrics ? parseBytes(metrics.used_memory) : 0;
    const maxBytes = metrics ? parseBytes(metrics.maxmemory) : 1;
    const usagePercent = Math.min((usedBytes / maxBytes) * 100, 100);
    const barColorClass = getBarColor(usagePercent);

    const LANGUAGE_DATA: Record<string, LanguageConfig> = {
        NODEJS: {
            install: "npm i redis",
            language: "javascript",
            fileName: "nodejs_client.js",
            code: `import { createClient } from 'redis';\n\nconst client = createClient({\n    socket: { \n        host: "redis.saish.tech", \n        port: ${port} \n    },\n    username: "${username}",\n    password: "${password}"\n});\n\nasync function handleRedis() {\n    await client.connect();\n    await client.set('key', 'Hello QuickDB!');\n    return await client.get('key');\n}\n\nhandleRedis();`
        },
        SPRING: {
            install: 'implementation "org.springframework.boot:spring-boot-starter-data-redis"',
            language: "java",
            fileName: "RedisConfig.java",
            code: `spring.data.redis.host=redis.saish.tech\nspring.data.redis.port=${port}\nspring.data.redis.username=${username}\nspring.data.redis.password=${password}\n\n@Autowired\nprivate StringRedisTemplate redisTemplate;\n\npublic void saveData(String key, String value) {\n    redisTemplate.opsForValue().set(key, value);\n}`
        },
        PYTHON: {
            install: "pip install redis",
            language: "python",
            fileName: "app.py",
            code: `import redis\n\nr = redis.Redis(\n    host='redis.saish.tech',\n    port=${port},\n    username='${username}',\n    password='${password}',\n    decode_responses=True\n)\n\nr.set('foo', 'bar')\nprint(r.get('foo'))`
        },
        GO: {
            install: "go get github.com/redis/go-redis/v9",
            language: "go",
            fileName: "main.go",
            code: `rdb := redis.NewClient(&redis.Options{\n    Addr:     "redis.saish.tech:${port}",\n    Username: "${username}",\n    Password: "${password}",\n})`
        },
        RUST: {
            install: 'redis = "0.24.0"',
            language: "rust",
            fileName: "main.rs",
            code: `let client = redis::Client::open("redis://${username}:${password}@redis.saish.tech:${port}")?;`
        }
    };

    if (!isMounted) return null;
    if(loading){
        return <div className='w-full h-screen flex justify-center items-center'>
            <h1>Loading......</h1>
        </div>
    }
    return (
        <div className="min-h-screen bg-[#050505] mt-20 text-white p-6 sm:p-12 font-sans overflow-x-hidden relative">
            
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0A0A0A] border border-rose-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(225,29,72,0.15)] transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-rose-500 mb-2">Delete Instance?</h3>
                        <p className="text-zinc-400 text-sm mb-6">
                            This action is irreversible. All data in this Redis instance will be permanently lost.
                        </p>
                        
                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">
                                Type <span className="text-white select-all">delete {username}</span> to confirm
                            </label>
                            <input 
                                type="text" 
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors font-mono"
                                placeholder={`delete ${username}`}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-zinc-900 text-zinc-400 hover:bg-zinc-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDelete}
                                disabled={deleteInput !== `delete ${username}` || isDeleting}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                    deleteInput === `delete ${username}`
                                    ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/20'
                                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                }`}
                            >
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <button onClick={onBack} className="text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                        ← Back to Dashboard
                    </button>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-500/70 hover:text-rose-500 transition-colors px-4 py-2 border border-rose-500/20 rounded-full hover:bg-rose-500/10"
                        >
                            Delete Instance
                        </button>
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${status === 'RUNNING' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-red-500 border-red-500/30 bg-red-500/10'}`}>
                                    {status || 'INITIALIZING'}
                                </span>
                            </div>
                            <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                                Time Left: <span className="text-white">{timeLeft || '--'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2 bg-[#080808]/60 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-20" />
                        
                        <h1 className="text-[60px] sm:text-[100px] font-mono font-bold leading-none tracking-tighter text-white mb-6">
                            {port}
                        </h1>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group">
                                <span className="text-zinc-600 italic font-mono text-sm w-20">user</span>
                                <span className="text-emerald-400 font-bold text-lg">{username}</span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <span className="text-zinc-600 italic font-mono text-sm w-20">pass</span>
                                <span className="font-mono text-lg text-zinc-300">{showPassword ? password : '••••••••••••'}</span>
                                <button 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="ml-2 text-[10px] bg-zinc-900 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400"
                                >
                                    {showPassword ? 'HIDE' : 'SHOW'}
                                </button>
                                <button 
                                    onClick={() => handleCopy(password, 'pass')} 
                                    className="text-[10px] text-zinc-400 hover:text-white"
                                >
                                    {copyStatus === 'pass' ? '✓' : 'COPY'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 bg-[#0A0A0A] border border-zinc-900 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex justify-between">
                            <span>Memory Allocation</span>
                            <span className="text-white">{metrics?.maxmemory}</span>
                        </h3>

                        <div className="flex-1 flex gap-6 items-end justify-center relative min-h-[160px]">
                            <div className="relative w-24 h-full bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800/50">
                                <div 
                                    className={`absolute bottom-0 w-full transition-all duration-1000 ease-out ${barColorClass}`}
                                    style={{ height: `${usagePercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-4 mb-2 w-full lg:w-auto">
                                <div>
                                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Used</div>
                                    <div className="text-xl font-mono text-white">{metrics?.used_memory || '0B'}</div>
                                </div>
                                <div className="w-full h-px bg-zinc-900" />
                                <div>
                                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Free</div>
                                    <div className="text-lg font-mono text-zinc-400">{metrics?.remain_memory || '0B'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-between items-center mb-4">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${usagePercent > 90 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                <span className="text-xs font-mono text-zinc-400">
                                    {usagePercent.toFixed(1)}% Load
                                </span>
                            </div>
                        </div>

                        <div className="bg-zinc-900/30 border border-zinc-800/50 p-3 rounded-xl flex items-start gap-2">
                             <span className="text-amber-500 font-bold text-[10px] mt-0.5">NOTE:</span>
                             <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                                 Auto-deletion of least recently used (LRU) keys occurs when the memory limit is reached.
                             </p>
                        </div>

                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {(Object.keys(LANGUAGE_DATA) as string[]).map((lang) => (
                        <button 
                            key={lang} 
                            onClick={() => setActiveTab(lang)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                                activeTab === lang 
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                                : 'text-zinc-600 border-zinc-900 hover:border-zinc-700 bg-[#0A0A0A]'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-[#0A0A0A] border border-zinc-900 rounded-2xl p-5 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                        <code className="font-mono text-sm text-zinc-400">
                            <span className="text-emerald-500 mr-3 select-none">$</span>
                            {LANGUAGE_DATA[activeTab].install}
                        </code>
                        <button 
                            onClick={() => handleCopy(LANGUAGE_DATA[activeTab].install, 'install')}
                            className="text-zinc-600 hover:text-white transition-colors"
                        >
                            {copyStatus === 'install' ? 'COPIED' : 'COPY'}
                        </button>
                    </div>

                    <div className="bg-[#020202] border border-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl relative group">
                        <div className="absolute top-0 right-0 p-4 z-10">
                            <button 
                                onClick={() => handleCopy(LANGUAGE_DATA[activeTab].code, 'code')}
                                className="text-[10px] font-black uppercase bg-white/5 text-zinc-400 px-4 py-2 rounded-lg backdrop-blur-md hover:bg-white hover:text-black transition-all border border-white/5"
                            >
                                {copyStatus === 'code' ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                        <div className="bg-[#0A0A0A] px-6 py-3 border-b border-zinc-900 flex items-center gap-2">
                            <div className="flex gap-2 mr-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                            </div>
                            <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                                {LANGUAGE_DATA[activeTab].fileName}
                            </span>
                        </div>
                        <div className="p-2">
                            <Editor
                                height="400px"
                                theme="vs-dark"
                                path={LANGUAGE_DATA[activeTab].fileName}
                                defaultLanguage={LANGUAGE_DATA[activeTab].language}
                                value={LANGUAGE_DATA[activeTab].code}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    lineHeight: 22,
                                    scrollBeyondLastLine: false,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    padding: { top: 20, bottom: 20 },
                                    renderLineHighlight: 'none',
                                    scrollbar: { vertical: 'hidden' }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstanceDetail;