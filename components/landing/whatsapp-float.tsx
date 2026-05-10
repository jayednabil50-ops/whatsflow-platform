"use client";

export function WhatsAppFloat() {
  const phone = "8801311751177";
  const message = encodeURIComponent("Hello! I'm interested in HotSape API.");
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <>
      <style>{`
        @keyframes wa-ripple {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
        @keyframes wa-ripple2 {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(2.8); opacity: 0;   }
        }
        @keyframes wa-bounce {
          0%, 100% { transform: translateY(0);   }
          20%       { transform: translateY(-8px); }
          40%       { transform: translateY(0);   }
          60%       { transform: translateY(-4px); }
          80%       { transform: translateY(0);   }
        }
        .wa-ring-1 {
          animation: wa-ripple 2s ease-out infinite;
        }
        .wa-ring-2 {
          animation: wa-ripple2 2s ease-out 0.6s infinite;
        }
        .wa-icon {
          animation: wa-bounce 3s ease-in-out infinite;
        }
      `}</style>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-7 right-7 z-50 flex items-center justify-center"
        style={{ width: 60, height: 60 }}
      >
        {/* Ripple rings */}
        <span
          className="wa-ring-1 absolute inset-0 rounded-full bg-[#25D366]"
          style={{ willChange: "transform, opacity" }}
        />
        <span
          className="wa-ring-2 absolute inset-0 rounded-full bg-[#25D366]"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Button circle */}
        <span className="relative flex items-center justify-center w-full h-full rounded-full bg-[#25D366] shadow-[0_4px_24px_rgba(37,211,102,0.5)] hover:bg-[#20c05a] transition-colors duration-200">
          {/* WhatsApp SVG icon with bounce */}
          <svg
            className="wa-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            fill="white"
          >
            <path d="M16 .5C7.439.5.5 7.44.5 16c0 2.795.727 5.417 1.998 7.696L.5 31.5l8.05-2.108A15.43 15.43 0 0016 31.5C24.561 31.5 31.5 24.56 31.5 16S24.561.5 16 .5zm0 28.4a12.82 12.82 0 01-6.532-1.784l-.47-.28-4.776 1.252 1.273-4.657-.307-.483A12.836 12.836 0 013.1 16C3.1 8.876 8.876 3.1 16 3.1S28.9 8.876 28.9 16 23.124 28.9 16 28.9zm7.05-9.607c-.386-.194-2.284-1.127-2.638-1.256-.354-.13-.612-.194-.87.193-.258.387-1.001 1.256-1.227 1.514-.225.258-.45.29-.837.097-.386-.194-1.63-.6-3.105-1.914-1.147-1.022-1.921-2.284-2.147-2.67-.225-.387-.024-.597.17-.79.173-.173.386-.45.58-.676.193-.225.258-.387.387-.645.13-.258.065-.484-.033-.677-.097-.194-.869-2.093-1.191-2.867-.313-.752-.631-.65-.869-.662l-.74-.013c-.258 0-.676.097-.87.484-.193.387-.74 1.224-.74 2.61s.58 2.996 1.805 4.38c1.226 1.385 3.34 4.12 8.09 5.648 1.131.388 2.013.619 2.7.793.904.228 1.726.195 2.377.118.725-.085 2.284-.934 2.606-1.836.322-.903.322-1.676.225-1.836-.096-.161-.354-.258-.74-.452z" />
          </svg>
        </span>
      </a>
    </>
  );
}
