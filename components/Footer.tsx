import React from 'react';

export default function Footer() {
  const kolomSatu = [
    { text: "Jasa Aqiqah", url: "https://jasaqiqah.my.id" },
    { text: "Media Islam", url: "https://onislam.web.id" },
    { text: "Contact", url: "/p/contact" },
  ];

  const kolomDua = [
    { text: "Kesehatan", url: "https://herbanos.id" },
    { text: "About Us", url: "/p/about-us" },
    { text: "Disclaimer", url: "/p/disclaimer" },
  ];

  const kolomTiga = [
    { text: "Sosial", url: "https://amina.or.id" },
    { text: "Privacy Policy", url: "/p/privacy-policy" },
  ];

  return (
    <footer className="w-full bg-[#f8f9fa] border-t border-gray-200/70 mt-16 text-[#4b5461] font-sans antialiased">
      
      {/* ================= BARIS UTAMA FOOTER ================= */}
      <div className="max-w-[1000px] mx-auto px-5 py-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-10">
        
        {/* SISI 1: BRANDING LOGO */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-start mb-2 lg:mb-0">
          <img 
            src="/logo-senyum.png" 
            alt="Logo Senyum" 
            className="h-9 w-auto object-contain"
          />
        </div>

        {/* SISI 2: MULTI-COLUMN LINK NAVIGASI */}
        <div className="w-full lg:flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm font-bold border-t lg:border-t-0 lg:border-l border-gray-200/70 pt-6 lg:pt-0 lg:pl-10">
          
          <ul className="space-y-3">
            {kolomSatu.map((link, idx) => (
              <li key={idx} className="cursor-pointer">
                <a href={link.url} className="text-[#4b5461] hover:text-orange-600 transition duration-150 block py-0.5">
                  {link.text}
                </a>
              </li>
            ))}
          </ul>

          <ul className="space-y-3">
            {kolomDua.map((link, idx) => (
              <li key={idx} className="cursor-pointer">
                <a href={link.url} className="text-[#4b5461] hover:text-orange-600 transition duration-150 block py-0.5">
                  {link.text}
                </a>
              </li>
            ))}
          </ul>

          <ul className="space-y-3 col-span-2 sm:col-span-1">
            {kolomTiga.map((link, idx) => (
              <li key={idx} className="cursor-pointer">
                <a href={link.url} className="text-[#4b5461] hover:text-orange-600 transition duration-150 block py-0.5">
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* SISI 3: HUB SOCIAL MEDIA LENGKAP */}
        <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-3 border-t lg:border-t-0 lg:border-l border-gray-200/70 pt-6 lg:pt-0 lg:pl-8">
          <div className="flex flex-wrap justify-center lg:justify-end gap-2">
            
            {/* Facebook */}
            <a href="https://www.facebook.com/guruonlinewebid" className="w-9 h-9 bg-gray-400 hover:bg-[#3b5998] text-white flex items-center justify-center rounded-sm transition duration-200 font-bold text-sm shadow-sm">f</a>
            
            {/* X (Twitter) */}
            <a href="https://www.x.com/guruonlineweb" className="w-9 h-9 bg-gray-400 hover:bg-black text-white flex items-center justify-center rounded-sm transition duration-200 p-2 shadow-sm">
              <svg viewBox="0 0 1200 1227" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/></svg>
            </a>
            
            {/* Instagram */}
            <a href="https://www.instagram.com/dah_liazahra/" className="w-9 h-9 bg-gray-400 hover:bg-[#e1306c] text-white flex items-center justify-center rounded-sm transition duration-200 p-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.13.052 1.954.237 2.648.514.717.278 1.312.65 1.905 1.243.593.593.966 1.188 1.244 1.905.277.694.462 1.518.514 2.648.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.052 1.13-.237 1.954-.514 2.648-.278.717-.65 1.312-1.243 1.905-.593.593-1.188.966-1.905 1.244-.694.277-1.518.462-2.648.514-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.13-.052-1.954-.237-2.648-.514-.717-.278-1.312-.65-1.905-1.243-.593-.593-.966-1.188-1.244-1.905-.277-.694-.462-1.518-.514-2.648-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.052-1.13.237-1.954.514-2.648.278-.717.65-1.312 1.243-1.905.593-.593 1.188-.966 1.905-1.244.694-.277 1.518-.462 2.648-.514 1.266-.058 1.646-.07 4.85-.07zm0 1.815c-3.14 0-3.515.012-4.757.068-1.026.047-1.58.212-1.952.355-.49.19-.838.416-1.205.783-.367.367-.593.715-.783 1.205-.143.372-.308.926-.355 1.952-.056 1.242-.068 1.617-.068 4.757s.012 3.515.068 4.757c.047 1.026.212 1.58.355 1.952.19.49.416.838.783 1.205.367.367.715.593 1.205.783.372.143.926.308 1.952.355 1.242.056 1.617.068 4.757.068s3.515-.012 4.757-.068c1.026-.047 1.58-.212 1.952-.355.49-.19.838-.416 1.205-.783.367-.367.593-.715.783-1.205.143-.372.308-.926.355-1.952.056-1.242.068-1.617.068-4.757s-.012-3.515-.068-4.757c-.047-1.026-.212-1.58-.355-1.952-.19-.49-.416-.838-.783-1.205-.367-.367-.715-.593-1.205-.783-.372-.143-.926-.308-1.952-.355-1.242-.056-1.617-.068-4.757-.068zm0 3.655a4.368 4.368 0 1 0 0 8.736 4.368 4.368 0 0 0 0-8.736zm0 1.815a2.553 2.553 0 1 1 0 5.106 2.553 2.553 0 0 1 0-5.106zm5.358-4.576a1.02 1.02 0 1 0 0 2.04 1.02 1.02 0 0 0 0-2.04z"/></svg>
            </a>
            
            {/* YouTube */}
            <a href="https://www.youtube.com/@hawaripro" className="w-9 h-9 bg-gray-400 hover:bg-[#ff0000] text-white flex items-center justify-center rounded-sm transition duration-200 p-1 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            
            {/* Pinterest */}
            <a href="https://id.pinterest.com/thehomecareproduct/" className="w-9 h-9 bg-gray-400 hover:bg-[#bd081c] text-white flex items-center justify-center rounded-sm transition duration-200 font-bold shadow-sm">P</a>
            
            {/* RSS */}
            <a href="/feed.xml" className="w-9 h-9 bg-gray-400 hover:bg-[#f26522] text-white flex items-center justify-center rounded-sm transition duration-200 p-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M6.18 15.64a2.18 2.18 0 1 1-2.18 2.18 2.18 2.18 0 0 1 2.18-2.18zM4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93z"/></svg>
            </a>
            
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-5 border-t border-gray-200/60 py-5">
        <p className="text-center text-xs font-semibold text-gray-400 tracking-wide">
          Copyright © 2026 Guru Online
        </p>
      </div>
    </footer>
  );
}