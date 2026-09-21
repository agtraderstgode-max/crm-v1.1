import { useState, useRef } from 'react'
import {
  FileText,
  Printer,
  ExternalLink,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuotationsPage() {
  const iframeRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus()
      iframeRef.current.contentWindow.print()
    }
  }

  const handleReload = () => {
    setIframeKey(prev => prev + 1)
  }

  const handleOpenNewTab = () => {
    window.open('/quotation-planner/index.html', '_blank')
  }

  return (
    <div className={cn(
      "space-y-4 transition-all duration-200",
      isFullscreen && "fixed inset-0 z-50 bg-slate-950 p-4 flex flex-col space-y-3"
    )}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">Quotation & Box Planner</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <Sparkles className="h-3 w-3" /> AG TRADERS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tile Box Planning, Instant Quotation Calculation & Printing
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Print Quotation"
          >
            <Printer className="h-4 w-4" />
            <span>Print Quotation</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          <button
            onClick={handleOpenNewTab}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="Open standalone in new tab"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">New Tab</span>
          </button>

          <button
            onClick={handleReload}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Reload Planner"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Embedded Quotation Box Planner Frame */}
      <div className={cn(
        "w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 relative",
        isFullscreen ? "flex-1 h-full" : "h-[calc(100vh-190px)] min-h-[600px]"
      )}>
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src="/quotation-planner/index.html"
          title="Quotation Box Planner"
          className="w-full h-full border-none bg-slate-900"
        />
      </div>
    </div>
  )
}
