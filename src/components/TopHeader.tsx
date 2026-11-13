import { Loader2, Zap } from 'lucide-react';
import type { ActiveView } from '../types/ats';

interface TopHeaderProps {
  activeView: ActiveView;
  onSwitchView: (view: ActiveView) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const NAV_ITEMS: { id: ActiveView; label: string }[] = [
  { id: 'input', label: 'Match Input' },
  { id: 'report', label: 'Score Diagnostic' },
  { id: 'builder', label: 'ATS Builder' },
];

export function TopHeader({
  activeView,
  onSwitchView,
  onAnalyze,
  isAnalyzing,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => onSwitchView('input')}
          className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-md px-1"
        >
          ATSPulse
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary sections"
          className="flex items-center gap-1 sm:gap-6 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSwitchView(item.id)}
                className={`px-2.5 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  isActive
                    ? 'text-indigo-700 border-indigo-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Analyze Match</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
