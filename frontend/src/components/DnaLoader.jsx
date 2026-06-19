import React from "react";

const DnaLoader = () => {
  const dotsCount = 30;
  const duration = 2.8;

  return (
    <div className="fixed inset-0 bg-slate-50/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <style>{`
        @keyframes waveTop {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateY(-24px) scale(0.7);
            opacity: 0.5;
          }
          50% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          75% {
            transform: translateY(24px) scale(0.7);
            opacity: 0.5;
          }
          100% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
        }

        @keyframes waveBottom {
          0% {
            transform: translateY(0px) scale(0.7);
            opacity: 0.5;
          }
          25% {
            transform: translateY(24px) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(0px) scale(0.7);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-24px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(0px) scale(0.7);
            opacity: 0.5;
          }
        }

        @keyframes bridgeWave {
          0%,100% {
            height: 48px;
            opacity: 0.25;
          }
          25% {
            height: 20px;
            opacity: 0.9;
          }
          50% {
            height: 48px;
            opacity: 0.25;
          }
          75% {
            height: 20px;
            opacity: 0.9;
          }
        }
      `}</style>

      <div className="flex items-center justify-center gap-[6px]">
        {[...Array(dotsCount)].map((_, i) => {
          const delay = -(i * 0.08);

          return (
            <div
              key={i}
              className="relative flex flex-col items-center justify-center"
            >
              {/* Top Strand */}
              <div
                className="w-3 h-3 rounded-full bg-blue-600"
                style={{
                  animation: `waveTop ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                  boxShadow: "0 0 14px rgba(37,99,235,0.9)",
                  willChange: "transform",
                }}
              />

              {/* DNA Connector */}
              <div
                className="w-[2px] bg-gradient-to-b from-blue-600 via-blue-400 to-blue-600"
                style={{
                  animation: `bridgeWave ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                }}
              />

              {/* Bottom Strand */}
              <div
                className="w-3 h-3 rounded-full bg-blue-400"
                style={{
                  animation: `waveBottom ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                  boxShadow: "0 0 14px rgba(96,165,250,0.9)",
                  willChange: "transform",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DnaLoader;