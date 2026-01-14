// =============================================================================
// NEW CAMPAIGN WIZARD
// /app/dashboard/campaigns/new/page.tsx
// Multi-step wizard: Upload CSV → Analyze → Configure → Launch
// =============================================================================

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  Zap,
  CheckCircle,
  AlertTriangle,
  Users,
  DollarSign,
  Calendar,
  Rocket,
  Loader2,
  X,
} from 'lucide-react'

type Step = 'upload' | 'analyze' | 'configure' | 'launch'

interface Lead {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  source: string
  firstContact: string
}

interface AnalysisResult {
  segments: {
    ghost: Lead[]
    nearMiss: Lead[]
    vip: Lead[]
  }
  tcpaCompliant: Lead[]
  tcpaNonCompliant: Lead[]
  projectedROI: {
    expectedBookings: number
    expectedRevenue: number
    roi: number
  }
  recommendedScript: string
}

interface CampaignConfig {
  name: string
  segment: 'ghost' | 'near_miss' | 'vip' | 'all'
  scriptVariant: 'direct-inquiry' | 'file-closure' | 'gift' | 'breakup'
  scheduledStart: 'now' | 'scheduled'
  scheduledDate?: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data across steps
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedLeads, setParsedLeads] = useState<Lead[]>([])
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [config, setConfig] = useState<CampaignConfig>({
    name: '',
    segment: 'all',
    scriptVariant: 'direct-inquiry',
    scheduledStart: 'now',
  })

  // Step 1: File Upload
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file)
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/reactivation/parse', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to parse file')

      const data = await res.json()
      setParsedLeads(data.leads)
      setStep('analyze')
    } catch (err) {
      setError('Failed to parse the file. Please check the format and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Step 2: Analyze Leads
  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reactivation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: parsedLeads }),
      })

      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setAnalysis(data)

      // Auto-generate campaign name
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      setConfig(prev => ({
        ...prev,
        name: `Reactivation ${date}`,
        scriptVariant: data.recommendedScript || 'direct-inquiry',
      }))

      setStep('configure')
    } catch (err) {
      setError('Failed to analyze leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Launch Campaign
  const handleLaunch = async () => {
    if (!analysis) return

    setLoading(true)
    setError(null)

    try {
      // Get leads for selected segment
      let selectedLeads: Lead[] = []
      if (config.segment === 'all') {
        selectedLeads = analysis.tcpaCompliant
      } else if (config.segment === 'ghost') {
        selectedLeads = analysis.segments.ghost.filter(l => 
          analysis.tcpaCompliant.some(tc => tc.id === l.id)
        )
      } else if (config.segment === 'near_miss') {
        selectedLeads = analysis.segments.nearMiss.filter(l => 
          analysis.tcpaCompliant.some(tc => tc.id === l.id)
        )
      } else if (config.segment === 'vip') {
        selectedLeads = analysis.segments.vip.filter(l => 
          analysis.tcpaCompliant.some(tc => tc.id === l.id)
        )
      }

      const res = await fetch('/api/reactivation/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          segment: config.segment,
          scriptVariant: config.scriptVariant,
          leads: selectedLeads,
          scheduledStart: config.scheduledStart === 'now' ? null : config.scheduledDate,
        }),
      })

      if (!res.ok) throw new Error('Failed to launch campaign')

      const data = await res.json()
      setStep('launch')

      // Redirect to campaign dashboard after brief delay
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${data.campaignId}`)
      }, 2000)
    } catch (err) {
      setError('Failed to launch campaign. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">New Campaign</h1>
              <p className="text-sm text-zinc-400">
                Create a lead reactivation campaign
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {(['upload', 'analyze', 'configure', 'launch'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-emerald-500 text-white'
                    : ['analyze', 'configure', 'launch'].indexOf(step) > ['upload', 'analyze', 'configure', 'launch'].indexOf(s)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {['analyze', 'configure', 'launch'].indexOf(step) > i ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={`w-16 sm:w-24 h-0.5 mx-2 ${
                    ['analyze', 'configure', 'launch'].indexOf(step) > i
                      ? 'bg-emerald-500'
                      : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <UploadStep
              loading={loading}
              onFileSelect={handleFileUpload}
              uploadedFile={uploadedFile}
            />
          )}

          {/* Step 2: Analyze */}
          {step === 'analyze' && (
            <AnalyzeStep
              leads={parsedLeads}
              loading={loading}
              onAnalyze={handleAnalyze}
              onBack={() => setStep('upload')}
            />
          )}

          {/* Step 3: Configure */}
          {step === 'configure' && analysis && (
            <ConfigureStep
              analysis={analysis}
              config={config}
              setConfig={setConfig}
              loading={loading}
              onLaunch={handleLaunch}
              onBack={() => setStep('analyze')}
            />
          )}

          {/* Step 4: Launch Success */}
          {step === 'launch' && (
            <LaunchSuccessStep campaignName={config.name} />
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STEP COMPONENTS
// =============================================================================

function UploadStep({
  loading,
  onFileSelect,
  uploadedFile,
}: {
  loading: boolean
  onFileSelect: (file: File) => void
  uploadedFile: File | null
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <div>
      <div className="text-center mb-6">
        <Upload className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
        <h2 className="text-xl font-semibold mb-2">Upload Your Contact List</h2>
        <p className="text-zinc-400">
          Upload a CSV, Excel, or vCard file with your leads
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-zinc-600 transition cursor-pointer"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Processing file...</span>
          </div>
        ) : uploadedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>{uploadedFile.name}</span>
          </div>
        ) : (
          <>
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
            <p className="text-zinc-400 mb-3">
              Drag and drop your file here, or click to browse
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition cursor-pointer">
              <Upload className="w-4 h-4" />
              Choose File
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.vcf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Supported formats:</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• CSV exports from Google LSA, StyleSeat, Square, etc.</li>
          <li>• Excel files (.xlsx, .xls)</li>
          <li>• vCard files (.vcf)</li>
        </ul>
      </div>
    </div>
  )
}

function AnalyzeStep({
  leads,
  loading,
  onAnalyze,
  onBack,
}: {
  leads: Lead[]
  loading: boolean
  onAnalyze: () => void
  onBack: () => void
}) {
  return (
    <div>
      <div className="text-center mb-6">
        <Zap className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
        <h2 className="text-xl font-semibold mb-2">Ready to Analyze</h2>
        <p className="text-zinc-400">
          We found <span className="text-white font-medium">{leads.length} contacts</span> in your file
        </p>
      </div>

      {/* Preview */}
      <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium mb-3">Preview (first 5 contacts):</h3>
        <div className="space-y-2">
          {leads.slice(0, 5).map((lead, i) => (
            <div key={i} className="flex items-center gap-4 text-sm">
              <span className="text-zinc-400 w-6">{i + 1}.</span>
              <span className="flex-1">
                {lead.firstName} {lead.lastName}
              </span>
              <span className="text-zinc-500">{lead.phone}</span>
            </div>
          ))}
          {leads.length > 5 && (
            <p className="text-xs text-zinc-500 mt-2">
              ...and {leads.length - 5} more
            </p>
          )}
        </div>
      </div>

      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-6">
        <h3 className="text-sm font-medium text-emerald-400 mb-2">What happens next:</h3>
        <ul className="text-sm text-zinc-300 space-y-1">
          <li>• Segment leads into Ghost, Near-Miss, and VIP categories</li>
          <li>• Check TCPA compliance for each contact</li>
          <li>• Calculate expected ROI based on segment conversion rates</li>
          <li>• Recommend the best script variant</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Leads
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function ConfigureStep({
  analysis,
  config,
  setConfig,
  loading,
  onLaunch,
  onBack,
}: {
  analysis: AnalysisResult
  config: CampaignConfig
  setConfig: React.Dispatch<React.SetStateAction<CampaignConfig>>
  loading: boolean
  onLaunch: () => void
  onBack: () => void
}) {
  const segmentCounts = {
    all: analysis.tcpaCompliant.length,
    ghost: analysis.segments.ghost.filter(l => 
      analysis.tcpaCompliant.some(tc => tc.id === l.id)
    ).length,
    near_miss: analysis.segments.nearMiss.filter(l => 
      analysis.tcpaCompliant.some(tc => tc.id === l.id)
    ).length,
    vip: analysis.segments.vip.filter(l => 
      analysis.tcpaCompliant.some(tc => tc.id === l.id)
    ).length,
  }

  return (
    <div>
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
        <h2 className="text-xl font-semibold mb-2">Analysis Complete</h2>
        <p className="text-zinc-400">
          Configure your campaign settings
        </p>
      </div>

      {/* Analysis Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{analysis.tcpaCompliant.length}</p>
          <p className="text-xs text-zinc-500">TCPA Compliant</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{analysis.projectedROI.expectedBookings}</p>
          <p className="text-xs text-zinc-500">Expected Bookings</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">${analysis.projectedROI.expectedRevenue.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">Expected Revenue</p>
        </div>
      </div>

      {/* TCPA Warning */}
      {analysis.tcpaNonCompliant.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">
                {analysis.tcpaNonCompliant.length} leads excluded (TCPA)
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                These contacts are outside the compliant window and won't be contacted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="space-y-4 mb-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Campaign Name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            placeholder="e.g., January Reactivation"
          />
        </div>

        {/* Segment Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Segment</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 'all', label: 'All Leads' },
              { value: 'ghost', label: 'Ghost (6mo+)' },
              { value: 'near_miss', label: 'Near-Miss (30-90d)' },
              { value: 'vip', label: 'VIP (<30d)' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setConfig(prev => ({ ...prev, segment: option.value as CampaignConfig['segment'] }))}
                className={`p-3 rounded-lg border text-sm font-medium transition ${
                  config.segment === option.value
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <span className="block">{option.label}</span>
                <span className="text-xs opacity-75">
                  {segmentCounts[option.value as keyof typeof segmentCounts]} leads
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Script Variant */}
        <div>
          <label className="block text-sm font-medium mb-2">Message Script</label>
          <select
            value={config.scriptVariant}
            onChange={(e) => setConfig(prev => ({ ...prev, scriptVariant: e.target.value as CampaignConfig['scriptVariant'] }))}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="direct-inquiry">Direct Inquiry - "Are you still looking to get [service] done?"</option>
            <option value="file-closure">File Closure - "Should I close your file?"</option>
            <option value="gift">Gift Offer - "Complimentary [addon] if you book this week"</option>
            <option value="breakup">Breakup - "This is my last reach out..."</option>
          </select>
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium mb-2">When to Start</label>
          <div className="flex gap-2">
            <button
              onClick={() => setConfig(prev => ({ ...prev, scheduledStart: 'now' }))}
              className={`flex-1 p-3 rounded-lg border text-sm font-medium transition ${
                config.scheduledStart === 'now'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <Zap className="w-4 h-4 mx-auto mb-1" />
              Start Immediately
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, scheduledStart: 'scheduled' }))}
              className={`flex-1 p-3 rounded-lg border text-sm font-medium transition ${
                config.scheduledStart === 'scheduled'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <Calendar className="w-4 h-4 mx-auto mb-1" />
              Schedule
            </button>
          </div>
          {config.scheduledStart === 'scheduled' && (
            <input
              type="datetime-local"
              value={config.scheduledDate || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="w-full mt-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onLaunch}
          disabled={loading || !config.name}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Launching...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Launch Campaign
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function LaunchSuccessStep({ campaignName }: { campaignName: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 rounded-full flex items-center justify-center">
        <Rocket className="w-8 h-8 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Campaign Launched! 🚀</h2>
      <p className="text-zinc-400 mb-4">
        "{campaignName}" is now active and sending messages
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Redirecting to dashboard...
      </div>
    </div>
  )
}
