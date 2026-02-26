const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center p-12 relative w-full h-full z-10 bg-transparent">
      <div className="max-w-md text-center">
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-3xl bg-[#6764f2]/20 shadow-inner border border-[#6764f2]/10 ${i % 2 === 0 ? "animate-pulse shadow-[#6764f2]/10" : "opacity-80"
                }`}
            />
          ))}
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">{title}</h2>
        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">{subtitle}</p>
      </div>

      {/* Decorative Blur Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6764f2]/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
    </div>
  );
};

export default AuthImagePattern;
