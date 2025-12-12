import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Cpu, Globe, Terminal, Zap, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-24 pb-20 px-4 text-center">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
          v1.0 Now Available
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-100">
          Vibe Code with <span className="text-gradient">Intelligence</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-200">
          The next-generation code editor powered by WebContainers. 
          Run Node.js directly in your browser with zero latency.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-300">
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-lg hover:shadow-primary/25 transition-all">
              Start Coding <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="https://github.com/Blazeiscoding/vibe-editor" target="_blank">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full glass hover:bg-white/10">
              <Github className="mr-2 w-4 h-4" /> View on GitHub
            </Button>
          </Link>
        </div>

        {/* Hero Image / Preview */}
        <div className="mt-20 relative w-full max-w-5xl mx-auto rounded-lg shadow-2xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both delay-500">
           {/* Fallback box if hero.svg isn't perfect, using glass-card style */}
          <div className="glass-card aspect-video w-full flex items-center justify-center relative group">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50" />
             <Image 
                src="/hero.svg" 
                alt="Vibe Editor Preview" 
                width={1200} 
                height={675}
                className="rounded-lg shadow-2xl transform transition-transform duration-700 group-hover:scale-[1.01]"
                priority
             />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to ship</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for speed, designed for comfort. Vibe Editor brings the full power of a local environment to the web.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Terminal className="w-8 h-8 text-blue-400" />}
              title="WebContainers"
              description="Run execution environments directly in your browser. No remote servers required."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Instant Preview"
              description="See your changes instantly as you type with our optimized dev server."
            />
            <FeatureCard 
              icon={<Code2 className="w-8 h-8 text-pink-400" />}
              title="Monaco Editor"
              description="The same editing experience as VS Code, with IntelliSense and shortcuts."
            />
            <FeatureCard 
              icon={<Cpu className="w-8 h-8 text-purple-400" />}
              title="AI Integration"
              description="Intelligent code completion and suggestions to help you write better code."
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-cyan-400" />}
              title="Shareable Links"
              description="Share your projects with a single link. Collaboration made easy."
            />
            <FeatureCard 
              icon={<Github className="w-8 h-8 text-white" />}
              title="GitHub Import"
              description="Import your existing repositories and start coding in seconds."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/10 mt-auto glass">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">V</div>
            <span className="font-semibold text-lg">Vibe Editor</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2024 Vibe Editor. Built with Next.js and WebContainers.
          </div>
          <div className="flex gap-4">
            <Link href="https://github.com/Blazeiscoding" className="text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </Link>
             <Link href="https://github.com/Blazeiscoding" className="text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-colors duration-300">
      <div className="mb-4 bg-white/5 w-14 h-14 rounded-xl flex items-center justify-center border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
