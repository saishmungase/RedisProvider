import React from 'react';
import { 
  Zap, 
  Clock, 
  ShieldCheck, 
  Cpu, 
  Play, 
  Layers,
  Terminal,
  Database,
  Github,
  Linkedin,
  Mail,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black selection:bg-red-500/30">
      
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/10 blur-[120px] rounded-full -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-zinc-400 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            V1.0 Is Live Now 🚀
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Instant Redis for <br />
            <span className="text-white">Your Next Big Idea</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop wasting time on infra setup. Spin up a high-performance Redis instance in 
            <span className="text-white font-medium"> &lt;2 seconds</span>. Active for 24 hours, perfect for testing and prototyping.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2">
              Start Automating <Zap size={18} fill="currentColor" />
            </Link>
            <button className="w-full sm:w-auto bg-zinc-900 border border-white/10 text-white px-8 py-4 rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
              <Play size={18} fill="currentColor" /> Watch Demo
            </button>
          </div>
          <div className="mt-20 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 grayscale opacity-60 text-white">
            <StatItem label="Uptime" value="99.9%" />
            <StatItem label="Provisioning" value="200ms" />
            <StatItem label="Encryption" value="TLS" />
            <StatItem label="Compatible" value="OSS" />
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Clock className="text-red-500" />}
            title="24hr Lifecycle"
            desc="Self-destructing instances designed for temporary workloads, hackathons, and sandboxed testing."
          />
          <FeatureCard 
            icon={<Cpu className="text-red-500" />}
            title="Dedicated Ports"
            desc="Real-time monitoring of available ports on our high-speed distributed nodes."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-red-500" />}
            title="Safe Isolation"
            desc="Docker-containerized environments ensure your data remains isolated and secure during the 24hr window."
          />
        </div>
      </section>

      <section className="py-20 px-6 bg-zinc-950/50 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-white">Built by Engineers, <br /> For Engineers.</h2>
            <ul className="space-y-4">
              {[
                "No Credit Card Required",
                "One-Click Provisioning",
                "Standard Redis-CLI Access",
                "Built with Node.js & Docker"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-400">
                  <div className="h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="bg-zinc-800/50 px-4 py-2 border-b border-white/5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              <span className="text-[10px] text-zinc-500 ml-2 font-mono underline">redis-cli -h snap.redis.io</span>
            </div>
            <div className="p-6 font-mono text-sm space-y-2">
              <div className="text-zinc-500">$ curl -X POST https://QuickDB.io/api/create</div>
              <div className="text-emerald-400">{"{"}</div>
              <div className="text-emerald-400 ml-4">"status": "active",</div>
              <div className="text-emerald-400 ml-4">"host": "snap-node-04.io",</div>
              <div className="text-emerald-400 ml-4">"port": 6379,</div>
              <div className="text-emerald-400 ml-4">"expires_in": "23h 59m"</div>
              <div className="text-emerald-400">{"}"}</div>
              <div className="text-zinc-500">$ redis-cli -h snap-node-04.io -p 6379</div>
              <div className="text-white animate-pulse">_</div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 px-6 bg-zinc-950/50 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 order-2 md:order-1">
              <div>
                <h2 className="text-xs font-bold text-red-500 uppercase tracking-[0.2em] mb-4">Built By</h2>
                <div className="mb-6">
                  <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-1">Saish Mungase</h3>
                  <p className="text-zinc-500 text-base">SDE | Backend & Algorithms</p>
                </div>

                <div className="space-y-4 text-zinc-400 leading-relaxed text-sm md:text-base max-w-md">
                  <p>
                    I built this because I have serious Project Commitment Issues. I love starting new apps, but I absolutely hate configuring the database. Now I can spin up a Redis instance, use it for 20 minutes, and abandon the project guilt-free.
                  </p>
                  <p>
                    {`Use these instances for your apps, your bots, or just to store the names of people who haven't texted you back.`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  <SkillBadge label="Node.js" />
                  <SkillBadge label="Docker" />
                  <SkillBadge label="System Design" />
                  <SkillBadge label="DSA" />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <SocialIcon icon={<Linkedin size={20} />} href="https://www.linkedin.com/in/saish-mungase/" />
                <SocialIcon icon={<Github size={20} />} href="https://github.com/saishmungase" />
                <SocialIcon icon={<Mail size={20} />} href="mailto:saishmungase@gmail.com" />
              </div>
            </div>

            <div className="order-1 md:order-2 flex justify-center md:justify-end">
              <div className="relative group w-full max-w-[300px]"> 
                <div className="absolute -inset-1 bg-red-600/10 rounded-[1.5rem] blur-xl group-hover:bg-red-600/20 transition"></div>
                <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] border border-white/10 shadow-2xl">
                  <img 
                    src="/saish.jpeg" 
                    alt="Saish Mungase" 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" 
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-red-600" />
            <span className="font-bold text-white">QuickDB</span>
          </div>
          <p className="text-zinc-600 text-xs tracking-wide uppercase font-medium">
            &copy; 2026 Crafted with precision in Pune.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-red-500/30 transition-all group text-white">
      <div className="mb-4 p-3 bg-zinc-900 rounded-2xl w-fit group-hover:scale-110 transition-transform border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{label}</span>
    </div>
  );
}

function SkillBadge({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-bold text-zinc-400">
      {label}
    </span>
  );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500/50 border border-white/5 transition-all">
      {icon}
    </a>
  );
}