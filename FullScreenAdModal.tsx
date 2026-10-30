import React, { useState, useEffect } from 'react';
import { X, Film, Sparkles, Award, Volume2, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FullScreenAdModalProps {
  isOpen: boolean;
  type: 'rewarded' | 'interstitial';
  onClose: () => void;
  onRewardEarned?: () => void;
}

export const FullScreenAdModal: React.FC<FullScreenAdModalProps> = ({
  isOpen,
  type,
  onClose,
  onRewardEarned,
}) => {
  const [countdown, setCountdown] = useState(type === 'rewarded' ? 5 : 5);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setRewardClaimed(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (type === 'rewarded') {
            setRewardClaimed(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleAction = () => {
    if (type === 'rewarded') {
      if (onRewardEarned) onRewardEarned();
      onClose();
    } else {
      onClose();
    }
  };

  const AD_UNIT_ID =
    type === 'rewarded'
      ? 'ca-app-pub-3782024584018394/7279292930'
      : 'ca-app-pub-3782024584018394/5554101547';

  return (
    <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white select-none animate-fade-in">
      {/* Top Bar with Info & Skip/Close countdown */}
      <div className="flex items-center justify-between gap-3 max-w-2xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="bg-[#f59e0b] text-[#1e2329] text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs">
            Ad
          </span>
          <span className="text-xs font-semibold text-slate-300">
            {type === 'rewarded' ? 'Google AdMob Test • Video Premiato' : 'Google AdMob Test • Interstitial'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {countdown > 0 ? (
            <div className="px-3 py-1 bg-black/60 rounded-full border border-slate-700 text-xs font-mono text-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{type === 'rewarded' ? `Premio in ${countdown}s` : `Chiudi tra ${countdown}s`}</span>
            </div>
          ) : (
            <button
              onClick={handleAction}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-medium flex items-center gap-1 transition-all"
            >
              <span>{type === 'rewarded' ? 'Riscatta & Chiudi' : 'Chiudi'}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Fullscreen Video / Creative Canvas */}
      <div className="max-w-md w-full mx-auto my-auto p-6 bg-slate-900/90 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col items-center text-center space-y-4">
        {type === 'rewarded' ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg relative">
              <Film className="w-8 h-8 animate-pulse" />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white font-serif-book">
                Annuncio Video Premiato
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Guarda l'annuncio ufficiale di prova per sbloccare la ricerca online della copertina.
              </p>
            </div>

            {/* Simulated Video Player Screen */}
            <div className="w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-slate-400" /> Audio abilitato
                </span>
                <span>320×480 HD</span>
              </div>

              <div className="space-y-1">
                <div className="text-base font-bold text-amber-300 flex items-center justify-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Ricerca Copertina Online</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {countdown > 0
                    ? `Riproduzione video di prova in corso... (${countdown}s)`
                    : 'Visione completata! Premio sbloccato.'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
            </div>

            {rewardClaimed ? (
              <button
                type="button"
                onClick={handleAction}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 animate-bounce"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Riscatta e Cerca Copertina</span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Attendi il completamento per sbloccare la ricerca...</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white font-serif-book">
                Annuncio a Schermo Intero
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Annuncio interstitial programmato (intervallo di 5 minuti).
              </p>
            </div>

            {/* Simulated Interstitial Screen */}
            <div className="w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Google Mobile Ads</span>
                <span>Interstitial Test</span>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  ExLibris Diario di Lettura
                </p>
                <p className="text-[11px] text-slate-400">
                  Nessun tasto o lettura interrotta. Puoi chiudere l'annuncio in qualsiasi momento.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAction}
              disabled={countdown > 0}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                countdown === 0
                  ? 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {countdown === 0 ? 'Chiudi Annuncio' : `Chiudi tra ${countdown}s`}
            </button>
          </>
        )}

        <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-center gap-1 font-mono">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>ID di Prova: {AD_UNIT_ID.slice(0, 24)}...</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 max-w-md mx-auto">
        Parametri ufficiali di test Google AdMob. I tasti funzione dello smartphone rimangono sempre accessibili.
      </div>
    </div>
  );
};
