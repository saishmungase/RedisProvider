'use client'

import { useEffect, useState, useMemo } from "react";
import { liveFetch } from "../actions/instancefetch";

interface BackendInstance {
    createdat: string;
    port: number;
}

interface Instance {
    port: number;
    isTaken: boolean;
    expiresAt: number;
}

const Live = () => {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'free' | 'occupied'>('all');
    const [now, setNow] = useState(Date.now());

    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let skeleton: Instance[] = [];
                for (let port = 7000; port <= 7012; port++) {
                    skeleton.push({ port, isTaken: false, expiresAt: 0 });
                }

                const instances = await liveFetch()
                const activeList: BackendInstance[] = instances || [];

                const mergedData = skeleton.map(skel => {
                    const match = activeList.find(item => item.port === skel.port);
                    if (match) {
                        const creationTime = new Date(match.createdat).getTime();
                        return {
                            ...skel,
                            isTaken: true,
                            expiresAt: creationTime + TWENTY_FOUR_HOURS
                        };
                    }
                    return skel;
                });

                setInstances(mergedData);
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const poll = setInterval(fetchData, 15000);
        return () => clearInterval(poll);
    }, []);

    const filteredInstances = useMemo(() => {
        return instances
            .filter(inst => {
                if (filter === 'free') return !inst.isTaken;
                if (filter === 'occupied') return inst.isTaken;
                return true;
            })
            .sort((a, b) => {
                return Number(a.isTaken) - Number(b.isTaken);
            });
    }, [instances, filter]);

    const formatTimeLeft = (expiresAt: number) => {
        const diff = expiresAt - now;
        if (diff <= 0) return "00:00:00";
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
        return `${h}h ${m}m ${s}s`;
    };

    if (isLoading) return <div className="bg-black min-h-screen flex items-center justify-center text-zinc-500 font-mono">LOADING_INSTANCES...</div>;

    return (
        <div className="min-h-screen bg-black mt-[100px] text-white p-4 sm:p-10 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Live Instances</h1>
                    <div className="flex bg-[#111] p-1 rounded-xl border border-zinc-800">
                        {['all', 'free', 'occupied'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                    filter === f ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {filteredInstances.map((instance) => (
                        <div 
                            key={instance.port}
                            className="group flex flex-col sm:flex-row items-center justify-between bg-[#080808] border border-zinc-800/60 p-4 sm:p-6 rounded-2xl hover:border-zinc-600 transition-all"
                        >
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Port</span>
                                    <span className="text-2xl font-mono font-bold">{instance.port}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                    instance.isTaken 
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                }`}>
                                    {instance.isTaken ? 'Occupied' : 'Available'}
                                </span>
                            </div>

                            {instance.isTaken && (
                                <div className="flex flex-col w-full sm:w-48 gap-1 my-4 sm:my-0">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                                        <span>Time Left</span>
                                        <span className="text-orange-500 font-mono">{formatTimeLeft(instance.expiresAt)}</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-orange-500 h-full transition-all duration-1000"
                                            style={{ width: `${Math.max(0, ((instance.expiresAt - now) / TWENTY_FOUR_HOURS) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="w-full sm:w-auto">
                                {!instance.isTaken ? (
                                    <button className="w-full sm:w-32 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20">
                                        Get Instance
                                    </button>
                                ) : (
                                    <button className="w-full sm:w-32 py-2.5 rounded-xl bg-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                        In Use
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Live;