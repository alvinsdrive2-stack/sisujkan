export default function BackgroundPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 -z-10" />

      {/* Floating decorative circles */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      {/* CSS-only decoration shapes — no image requests */}
      <div className="absolute top-[5%] left-[8%] w-8 h-8 border-2 border-primary/10 rounded-lg rotate-45 animate-float opacity-60" style={{ animationDelay: "0.5s" }} />
      <div className="absolute top-[15%] right-[5%] w-12 h-12 border-2 border-primary/10 rounded-full animate-float opacity-50" style={{ animationDelay: "1.2s" }} />
      <div className="absolute top-[45%] left-[5%] w-10 h-10 bg-primary/[0.03] rounded-xl rotate-12 animate-float opacity-40" style={{ animationDelay: "0.8s" }} />
      <div className="absolute bottom-[5%] right-[50%] w-9 h-9 border-2 border-primary/10 rounded-lg -rotate-12 animate-float opacity-55" style={{ animationDelay: "1.5s" }} />
      <div className="absolute bottom-[15%] left-[15%] w-11 h-11 bg-primary/[0.03] rounded-full animate-float opacity-45" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-[25%] right-[20%] w-7 h-7 border-2 border-primary/10 rounded-lg rotate-45 animate-float opacity-35" style={{ animationDelay: "0.3s" }} />
      <div className="absolute top-[30%] left-[20%] w-8 h-8 bg-primary/[0.03] rounded-xl animate-float opacity-65" style={{ animationDelay: "1.8s" }} />
      <div className="absolute top-[15%] left-[40%] w-6 h-6 border-2 border-primary/10 rounded-full animate-float opacity-40" style={{ animationDelay: "0.7s" }} />
      <div className="absolute top-[85%] right-[5%] w-10 h-10 bg-primary/[0.03] rounded-lg rotate-45 animate-float opacity-50" style={{ animationDelay: "1.3s" }} />
    </div>
  )
}
