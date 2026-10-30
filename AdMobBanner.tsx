import React, { useState } from 'react';
import { Info, ExternalLink, X, ShieldAlert } from 'lucide-react';

interface AdMobBannerProps {
  // Option to hide banner if dismissed by user for preview session
  allowDismiss?: boolean;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({ allowDismiss = false }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Google AdMob Real IDs
  const ADMOB_TEST_BANNER_ID = 'ca-app-pub-3782024584018394/4565499684';
  const ADMOB_SAMPLE_APP_ID = 'ca-app-pub-3782024584018394~4628032685';

  if (dismissed) return null;

  return (
    <>
      {/* 
        AdMob Banner Container anchored at the very bottom ("Sotto a tutto").
        Uses env(safe-area-inset-bottom) and safe padding so smartphone function keys 
        (Back, Home, Recents, and gesture pill) are NEVER covered or obstructed.
      */}
      <aside
        role="complementary"
        aria-label="Banner pubblicitario AdMob di test"
        className="w-full bg-[#1e2329] text-white border-t border-[#333d47] select-none"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 4px)',
          paddingTop: '2px',
        }}
      >
        <div className="max-w-screen-md mx-auto px-2 flex items-center justify-between min-h-[46px] h-[48px]">
          {/* AdMob Test Tag & Info Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="bg-[#f59e0b] text-[#1e2329] text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow-xs">
              Ad
            </span>
            <span className="hidden sm:inline text-[11px] font-semibold text-slate-300">
              Test AdMob
            </span>
          </div>

          {/* Banner Creative Simulation (320x50 standard responsive format) */}
          <div className="flex-1 px-2 flex items-center justify-center text-center overflow-hidden">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="text-xs text-slate-200 truncate font-medium">
                <strong className="text-white font-semibold">Google AdMob Test</strong> • Banner 320×50 Adaptive
              </p>
              <span className="hidden md:inline-block text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                Unit: {ADMOB_TEST_BANNER_ID.slice(0, 16)}...
              </span>
            </div>
          </div>

          {/* Action / Info Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              title="Dettagli parametri AdMob"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              aria-label="Info parametri AdMob di test"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {allowDismiss && (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                title="Nascondi per questa sessione"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                aria-label="Chiudi banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Info Modal on AdMob Test Parameters & Safe Insets */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fffefc] text-[#2c2724] rounded-2xl max-w-md w-full p-5 border border-[#ebdcd0] shadow-2xl relative">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#f3ebe4] text-[#8c7f73] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                Ad
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2c2724]">Parametri Google AdMob di Prova</h3>
                <p className="text-xs text-[#8c7f73]">Parametri ufficiali Google per test e build nativa</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#524943]">
              <div className="p-3 bg-[#faf4ec] rounded-xl border border-[#ebdcd0]/70 space-y-1.5 font-mono">
                <div>
                  <span className="text-[#8c7f73] block text-[10px] uppercase font-sans font-semibold">Test Ad Unit ID (Banner):</span>
                  <span className="text-[#8b5e34] font-bold select-all break-all">{ADMOB_TEST_BANNER_ID}</span>
                </div>
                <div className="pt-1 border-t border-[#ebdcd0]/60">
                  <span className="text-[#8c7f73] block text-[10px] uppercase font-sans font-semibold">Sample App ID:</span>
                  <span className="text-slate-700 select-all break-all">{ADMOB_SAMPLE_APP_ID}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <p className="font-semibold flex items-center gap-1.5 text-xs text-emerald-800">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                  Protezione Tasti Funzione Smartphone
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-950">
                  Il banner è configurato con gestione automatica degli <strong>insets di sistema</strong> (<code className="bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">env(safe-area-inset-bottom)</code> sul Web e <code className="bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">WindowInsetsCompat.Type.navigationBars()</code> nel codice nativo Android), evitando qualsiasi sovrapposizione con i pulsanti funzione o la gesture bar dello smartphone.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="mt-4 w-full py-2.5 bg-[#8b5e34] hover:bg-[#724b27] text-white font-medium rounded-xl text-xs transition-colors"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
};
