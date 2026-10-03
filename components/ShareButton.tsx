'use client';

import React, { useState } from 'react';

export default function ShareButton() {
  const [isOpenShare, setIsOpenShare] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const tanganiCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpenShare(!isOpenShare)}
        className="flex items-center space-x-1.5 text-gray-500 hover:text-orange-600 font-bold text-sm transition cursor-pointer select-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Share</span>
      </button>

      {isOpenShare && (
        <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-5 animate-in fade-in slide-in-from-top-2 duration-150">
          
          <div className="flex justify-between mb-6 text-gray-800 px-1">
            {/* Facebook */}
            <a href="#" className="hover:text-blue-700 transition"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
            
            {/* WhatsApp - Ikon WA yang benar */}
            <a href="#" className="hover:text-green-500 transition"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.395 0 0 5.395 0 12.031c0 2.127.556 4.204 1.615 6.039L0 24l6.104-1.602a12.054 12.054 0 005.927 1.603h.001c6.637 0 12.031-5.395 12.031-12.031C24.063 5.396 18.668 0 12.031 0zm0 21.848c-1.914 0-3.727-.517-5.334-1.423l-3.824 1.003 1.021-3.738a9.98 9.98 0 01-1.353-5.012c0-5.525 4.498-10.024 10.024-10.024 5.525 0 10.024 4.499 10.024 10.024 0 5.526-4.499 10.024-10.024 10.024z"/></svg></a>
            
            {/* X (Twitter) - Ikon X Resmi */}
            <a href="#" className="hover:text-black transition"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            
            {/* Telegram */}
            <a href="#" className="hover:text-sky-500 transition"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.022c.24-.216-.054-.334-.373-.121l-6.869 4.326-2.964-.924c-.643-.203-.657-.639.133-.946l11.564-4.457c.538-.196 1.006.128.832.941z"/></svg></a>
            
            {/* LinkedIn */}
            <a href="#" className="hover:text-blue-700 transition"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M22.23 0H1.77C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.77 24h20.46c.978 0 1.77-.774 1.77-1.729V1.729C24 .774 23.208 0 22.23 0zM7.12 20.452H3.56V9.022h3.56v11.43zM5.34 7.483a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM20.45 20.452h-3.56v-5.57c0-1.327-.026-3.037-1.85-3.037-1.85 0-2.134 1.446-2.134 2.937v5.67h-3.56V9.022h3.418v1.56h.047c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.265z"/></svg></a>
          </div>
          
          <button 
            onClick={tanganiCopyLink} 
            className="w-full border-2 border-orange-600 text-orange-600 font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-50 transition duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {isCopied ? 'Tersalin!' : 'Copy Link'}
          </button>
          
          <button 
            onClick={() => setIsOpenShare(false)} 
            className="w-full mt-4 text-sm font-bold text-gray-600 py-2 hover:text-gray-900 border-t border-gray-100 pt-3"
          >
            Batalkan
          </button>
        </div>
      )}
    </div>
  );
}