'use client'

import { useEffect, useState } from "react";
import fetchUser from "../actions/fetchprofile";
import { redirect } from "next/navigation";
import RandomInstance from "../actions/randomInstace";
import PopUp from "@/components/customPopup";
import { liveFetch } from "../actions/instancefetch";
import { Instance, BackendInstance } from "../live/page";

interface Inst {
    port: number;
    status: string;
    createdat: string;
}

interface ProfileData {
    name: string;
    userOnPlatform: string;
    activeInstance: Inst | null;
    history: Instance[];
}

const UserDashboard = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [customPort, setCustomPort] = useState(false);
    const [randomPort, setRandomPort] = useState(false);
    const [instances, setInstances] = useState<Instance[]>([]);
    
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const skeleton: Instance[] = [];
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
        const poll = setInterval(fetchData, 30000);
        return () => clearInterval(poll);
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('AuthToken') || "d"
                const data = await fetchUser(token);

                if (data) {
                    setProfile(data);
                }

            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const closePopUp = () => {
        setCustomPort(false)
    }

    const submitPopUp = () => {
        console.log("Pop Up Success !")
        setCustomPort(false);
    }

    const randomInstance = async () => {
        setRandomPort(true)
        const token = localStorage.getItem("AuthToken") || ""
        const data = await RandomInstance(token)
        const { port } = data;
        setRandomPort(false)
        redirect(`/dashboard/instance/${port}`)
    }

    const customInstance = () => {
        setCustomPort(true);
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center">
                <div className="animate-pulse text-zinc-500 font-mono tracking-widest">LOADING_PROFILE...</div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-black text-white p-8 mt-20 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-zinc-500 text-xs uppercase tracking-[0.3em] font-black mb-2">Welcome Back</h1>
                        <h2 className="text-4xl font-bold tracking-tighter">{profile.name}</h2>
                        <p className="text-zinc-600 text-xs mt-1 font-mono">
                            User Since: {new Date(profile.userOnPlatform).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="bg-zinc-900/50 px-4 py-2 rounded-2xl border border-zinc-800">
                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center">
                            Account Status: Pro
                        </span>
                    </div>
                </div>

                <section className="mb-12">
                    <h3 className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest mb-4">Current Session</h3>
                    
                    { customPort && <PopUp data={instances} onClose={closePopUp} onSubmit={submitPopUp} />}

                    {profile.activeInstance ? (
                        <div 
                            onClick={() =>{
                                redirect("/dashboard/instance/"+profile.activeInstance?.port)
                            } }
                            className="group bg-[#0A0A0A] border border-zinc-800 p-8 rounded-[2.5rem] cursor-pointer hover:border-emerald-500/50 transition-all flex flex-col md:flex-row justify-between items-center"
                        >
                            <div className="flex items-center gap-8">
                                <div className="bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20">
                                    <span className="text-3xl font-mono font-bold text-emerald-400">{profile.activeInstance.port}</span>
                                </div>
                                <div>
                                    <p className="text-zinc-400 font-medium">Instance Active</p>
                                    <p className="text-zinc-600 text-sm">
                                        Started: {new Date(profile.activeInstance.createdat).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <button className="mt-6 md:mt-0 bg-white text-black px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest group-hover:bg-emerald-400 transition-colors">
                                Manage Instance
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 flex flex-col items-center">
                            <div className="bg-[#0A0A0A] w-3/4 border border-dashed border-zinc-800 p-8 rounded-[2.5rem] text-center">
                                <p className="text-zinc-500 text-sm italic">No running instances found.</p>
                            </div>
                            
                            <span className="flex p-4 gap-8">
                                <button disabled={randomPort} onClick={customInstance} className="w-full sm:w-32 p-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20">
                                    Custom Instance
                                </button>
                                <button disabled={randomPort} onClick={randomInstance} className="w-full sm:w-32 p-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20">
                                    { randomPort ? "...." : "Random Instance" }
                                </button>
                            </span>
                        </div>
                    )}
                </section>

                <section>
                    <h3 className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest mb-4">Session History</h3>
                    <div className="bg-[#080808] border border-zinc-900 rounded-[2rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-900">
                                    <th className="p-6 text-zinc-500 text-[10px] uppercase font-black">Port</th>
                                    <th className="p-6 text-zinc-500 text-[10px] uppercase font-black">Date</th>
                                    <th className="p-6 text-zinc-500 text-[10px] uppercase font-black text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/50">
                                {profile.history.length > 0 ? (
                                    profile.history.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-900/20 transition-colors">
                                            <td className="p-6 font-mono font-bold text-zinc-300">{item.port}</td>
                                            <td className="p-6 text-sm text-zinc-500">
                                                {new Date(item.createdat).toLocaleDateString()}
                                            </td>
                                            <td className="p-6 text-[10px] font-black uppercase text-zinc-600 text-right">
                                                {item.status}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="p-10 text-center text-zinc-700 text-sm italic">
                                            History empty.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default UserDashboard;