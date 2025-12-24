import { useState } from "react"
import type { PlasmoCSConfig } from "plasmo"

import { DetectionPipeline } from "./lib/email/detection/Pipeline"
import type { DetectionResult } from "./lib/email/detection/Detector"

import "../style.css"

function IndexPopup() {
  const [pipeline] = useState(() => new DetectionPipeline())
  const [status, setStatus] = useState("Ready")
  const [results, setResults] = useState<DetectionResult[]>([])

  const testScan = async () => {
    setStatus("Scanning...")
    try {
      // Mock Context for basic connectivity test
      const context: any = {
        header: {
          hops: [],
          auth: { spf: { status: "pass" }, dkim: { status: "pass" }, dmarc: { status: "pass" } },
          headers: { "From": "admin@google.com" } // Safe
        },
        signals: {
          fromDomain: "google.com",
          fromDisplayName: "Admin",
          replyToDomain: null,
          returnPathDomain: "google.com"
        },
        options: { checkBody: false, checkAttachments: false }
      }

      const { results: scanResults } = await pipeline.run(context)
      setResults(scanResults)
      setStatus(scanResults.length === 0 ? "Clean" : "Threats Found")
    } catch (e) {
      console.error(e)
      setStatus("Error: " + e.message)
    }
  }

  return (
    <div className="w-[300px] h-[400px] bg-slate-950 text-slate-200 p-4 font-sans flex flex-col items-center justify-center">
      <h1 className="text-xl font-bold text-cyan-400 mb-4 tracking-wider">MXLENS PRO</h1>

      <div className="flex flex-col gap-4 w-full">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-center">
          <p className="text-xs uppercase text-slate-500 mb-1">Status</p>
          <p className="text-lg font-mono text-white">{status}</p>
        </div>

        <button
          onClick={testScan}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all"
        >
          RUN SYSTEM CHECK
        </button>

        {results.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/50 p-2 rounded text-xs">
            {results.map((r, i) => (
              <div key={i} className="text-red-400">{r.name}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
