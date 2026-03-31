import { useState, useEffect, useRef } from 'react'
import { Terminal, Mail, Phone, MapPin, ExternalLink, Code2 } from 'lucide-react'

const codeLines = [
  "// Iniciando conexão...",
  "import { Developer } from 'world-class-talent';",
  "",
  "const dev = {",
  '  name: "mizesko",',
  '  role: "Fullstack Developer",',
  '  skills: ["vibe-coder", "Supabase", "AI Engineering"],',
  '  status: "disponível_para_projetos"',
  "};",
  "",
  "const contato = {",
  '  email: "mizeskowork16@gmail.com",',
  '  whatsapp: "11986671095",',
  '  location: "Brasil"',
  "};",
  "",
  "function falarComMizesko() {",
  '  return "Vamos transformar sua ideia em realidade!";',
  "}",
  "",
  "// Digitação concluída."
]

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const characters = "01$+-*/=%'\"#&_(),.;:?!"
    const fontSize = 16
    const columns = Math.floor(width / fontSize)
    const drops = new Array(columns).fill(1)

    let hue = 140 // Starting emerald/green hue
    let lastTime = 0
    const fps = 20 // Slower FPS for stability and better look
    const interval = 1000 / fps

    const draw = (time: number) => {
      const delta = time - lastTime
      if (delta < interval) {
        requestAnimationFrame(draw)
        return
      }
      lastTime = time

      // Fade out effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      // Slowly shift color
      hue = (hue + 0.5) % 360
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length))
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
      requestAnimationFrame(draw)
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const frameId = requestAnimationFrame(draw)
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0" 
      style={{ opacity: 0.25 }}
    />
  )
}

export default function DevPage() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [isDone, setIsDone] = useState(false)
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    if (lineIdx >= codeLines.length) {
      setIsDone(true)
      return
    }

    const timer = setTimeout(() => {
      if (charIdx < codeLines[lineIdx].length) {
        setDisplayedLines(prev => {
          const next = [...prev]
          next[lineIdx] = codeLines[lineIdx].slice(0, charIdx + 1)
          return next
        })
        setCharIdx(prev => prev + 1)
      } else {
        setLineIdx(prev => prev + 1)
        setCharIdx(0)
      }
    }, codeLines[lineIdx].length === 0 ? 30 : 15)

    return () => clearTimeout(timer)
  }, [lineIdx, charIdx])

  const reset = () => {
    setDisplayedLines([])
    setLineIdx(0)
    setCharIdx(0)
    setIsDone(false)
  }

  return (
    <div className="relative min-h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-[#09090b]">
      <MatrixRain />
      
      <div className="max-w-4xl w-full space-y-6 z-10 relative">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-emerald)]">
            DEV CONNECT
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Vamos transformar sua ideia em realidade.
          </p>
        </div>

        <div className="card !p-0 bg-black border-[var(--color-border)] shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">mizesko — dev</span>
            <Code2 size={12} className="text-zinc-600" />
          </div>

          <div className="p-4 sm:p-6 font-mono text-[13px] sm:text-sm leading-relaxed min-h-[350px] bg-black text-emerald-500/90 overflow-x-auto">
             {displayedLines.map((line, idx) => (
               <div key={idx} className="whitespace-pre">
                 {line || " "}
               </div>
             ))}
             {!isDone && <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1 align-middle" />}
          </div>
        </div>

        {isDone && (
          <div className="flex flex-col md:flex-row items-center gap-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Profile Image */}
            <div className="shrink-0 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-1 rounded-2xl bg-zinc-900 border border-white/10">
                <img 
                  src="/pixel_art_character_animated_gif.gif" 
                  alt="Mizesko Profile" 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <a
                href="mailto:mizeskowork16@gmail.com"
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group"
              >
                <Mail className="text-emerald-500 shrink-0" />
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Email Me</p>
                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 truncate">mizeskowork16@gmail.com</p>
                </div>
              </a>

              <a
                href="https://wa.me/5511986671095"
                target="_blank"
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group"
              >
                <Phone className="text-emerald-500 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">WhatsApp</p>
                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-400">+55 11 98667-1095</p>
                </div>
              </a>
            </div>
          </div>
        )}

        {isDone && (
          <button onClick={reset} className="mx-auto block text-[9px] uppercase tracking-[0.2em] text-zinc-700 hover:text-emerald-500 transition-colors pt-4">
            Reiniciar Interface
          </button>
        )}
      </div>
    </div>
  )
}
