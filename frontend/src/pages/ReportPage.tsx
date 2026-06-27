import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Camera, Mic, MapPin, Brain, Upload, X, CheckCircle2,
  AlertTriangle, Loader2, MicOff, Volume2, Info, Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { Textarea, Label, Badge } from '@/components/ui/index'
import { AQIBadge } from '@/components/ui/AQIBadge'
import { useStore } from '@/store'
import { useTranslation } from '@/lib/i18n'
import { getCurrentLocation, reverseGeocode, fileToBase64, POLLUTION_LABELS, generateId } from '@/lib/utils'
import type { PollutionType, SeverityLevel, Report, GeoLocation, AIAnalysis } from '@/types'
import { cn } from '@/lib/utils'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
const API_URL = import.meta.env.VITE_API_URL || '/api'

type Step = 'media' | 'details' | 'ai_result' | 'submitted'

export default function ReportPage() {
  const [searchParams] = useSearchParams()
  const isAnonymous = searchParams.get('anonymous') === 'true'
  const navigate = useNavigate()
  const { language, user, addReport, addOfflineDraft } = useStore()
  const { t } = useTranslation(language)

  // Step state
  const [step, setStep] = useState<Step>('media')

  // Media
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'voice'>('photo')

  // Voice recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Location
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // Form fields
  const [pollutionType, setPollutionType] = useState<PollutionType>('unknown')
  const [severity, setSeverity] = useState<SeverityLevel>('medium')
  const [description, setDescription] = useState('')

  // Speech to text
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // AI Analysis
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)

  // Auto-fetch location on mount
  useEffect(() => {
    fetchLocation()
  }, [])

  const fetchLocation = async () => {
    setLocationLoading(true)
    try {
      const pos = await getCurrentLocation()
      const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude, GOOGLE_MAPS_KEY)
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        ...geo,
      })
    } catch (e) {
      // Fallback to Bengaluru center
      setLocation({ lat: 12.9716, lng: 77.5946, address: 'Bengaluru (approximate)', ward: 'Unknown', district: 'Bengaluru Urban' })
    } finally {
      setLocationLoading(false)
    }
  }

  // File input handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    const preview = URL.createObjectURL(file)
    setMediaPreview(preview)
    setMediaType(file.type.startsWith('video') ? 'video' : 'photo')
  }

  // Drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaType(file.type.startsWith('video') ? 'video' : 'photo')
  }, [])

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], 'voice-report.webm', { type: 'audio/webm' })
        setMediaFile(file)
        setMediaPreview(URL.createObjectURL(blob))
        setMediaType('voice')
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingDuration(0)
      recordingTimerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000)
    } catch (e) {
      alert('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    setIsRecording(false)
  }

  // Speech to text for description
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map((r: SpeechRecognitionResult) => r[0].transcript).join(' ')
      setDescription((d) => d + ' ' + transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  // AI Analysis using Gemini via backend
  const analyzeWithAI = async () => {
    if (!mediaFile && !description) {
      setStep('details')
      return
    }

    setAnalyzing(true)
    setAnalysisError(null)

    try {
      let result: AIAnalysis | null = null

      if (mediaFile && mediaFile.type.startsWith('image')) {
        // Send to AI analysis endpoint
        const base64 = await fileToBase64(mediaFile)
        try {
          const res = await fetch(`${API_URL}/ai/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, mime_type: mediaFile.type }),
          })
          if (res.ok) {
            result = await res.json()
          }
        } catch {
          // Backend not available — use mock result
        }
      }

      // Mock AI result for demo/offline
      if (!result) {
        result = generateMockAIResult(pollutionType, severity, description)
      }

      setAiResult(result)
      // Auto-fill form from AI
      if (result.pollutionType !== 'unknown') setPollutionType(result.pollutionType)
      setSeverity(result.estimatedSeverity)
      setStep('ai_result')
    } catch (e) {
      setAnalysisError('Analysis failed. You can still submit the report manually.')
      setStep('details')
    } finally {
      setAnalyzing(false)
    }
  }

  // Submit report
  const handleSubmit = async () => {
    if (!location) return
    setSubmitting(true)

    const id = generateId()
    const report: Report = {
      id,
      userId: isAnonymous ? null : user?.uid || null,
      userDisplayName: isAnonymous ? null : user?.displayName || null,
      isAnonymous,
      location,
      pollutionType,
      severity,
      description,
      imageUrl: mediaPreview && mediaType === 'photo' ? mediaPreview : undefined,
      status: 'pending',
      upvotes: 0,
      aiAnalysis: aiResult || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      // Try to submit to backend
      await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.updatedAt.toISOString(),
        }),
      })
    } catch {
      // Offline: save draft
      addOfflineDraft(report)
    }

    // Always add to local store for immediate UI feedback
    addReport(report)
    setReportId(id)
    setSubmitted(true)
    setStep('submitted')
    setSubmitting(false)
  }

  const saveAsDraft = () => {
    addOfflineDraft({ pollutionType, severity, description, location: location || undefined })
    navigate('/')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('report_pollution')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAnonymous ? '🔒 Reporting anonymously — your identity will not be shared.' : 'Help make your city cleaner.'}
          </p>
        </div>

        {/* Progress steps */}
        {step !== 'submitted' && (
          <div className="flex items-center gap-2 mb-8">
            {(['media', 'details', 'ai_result'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  step === s ? 'bg-primary text-primary-foreground' :
                  ['details', 'ai_result'].indexOf(step) > i ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {['details', 'ai_result'].indexOf(step) > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">
                  {s === 'media' ? 'Upload' : s === 'details' ? 'Details' : 'AI Analysis'}
                </span>
                {i < 2 && <div className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Media Upload ─────────────────────────────────────────── */}
        {step === 'media' && (
          <div className="space-y-4 animate-fade-in">
            {/* Drop zone */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                {!mediaPreview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border p-10 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('media-input')?.click()}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Drop photo or video here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <input
                      id="media-input"
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                      capture="environment"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} controls className="w-full rounded-lg max-h-64 object-contain" />
                    ) : mediaType === 'voice' ? (
                      <div className="flex flex-col items-center gap-3 rounded-lg bg-muted p-6">
                        <Volume2 className="h-12 w-12 text-primary" />
                        <audio src={mediaPreview} controls className="w-full" />
                      </div>
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full rounded-lg max-h-64 object-contain" />
                    )}
                    <button
                      onClick={() => { setMediaFile(null); setMediaPreview(null) }}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="Remove media"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick action buttons */}
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted transition-colors text-center">
                <Camera className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">Take Photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
              </label>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-center',
                  isRecording ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border hover:bg-muted'
                )}
              >
                {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6 text-primary" />}
                <span className="text-xs font-medium">
                  {isRecording ? `${recordingDuration}s Recording...` : 'Voice Report'}
                </span>
              </button>

              <label className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted transition-colors text-center">
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">Upload Video</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>

            {/* Location */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className={cn('h-4 w-4 shrink-0', location ? 'text-primary' : 'text-muted-foreground')} />
                  {locationLoading ? (
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> {t('detecting_location')}
                    </span>
                  ) : location ? (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{location.address}</p>
                      <p className="text-xs text-muted-foreground">{location.ward} • {location.district}</p>
                    </div>
                  ) : (
                    <button onClick={fetchLocation} className="text-sm text-primary underline">
                      Detect my location
                    </button>
                  )}
                  {location && (
                    <button onClick={fetchLocation} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
                      Refresh
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => setStep('details')} variant="outline" className="flex-1">
                Skip Photo
              </Button>
              <Button
                onClick={analyzeWithAI}
                className="flex-1"
                disabled={analyzing}
                loading={analyzing}
              >
                {analyzing ? t('analyzing') : mediaFile ? (
                  <><Brain className="h-4 w-4" /> Analyse with AI</>
                ) : 'Next →'}
              </Button>
            </div>

            <button onClick={saveAsDraft} className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
              <Save className="h-3.5 w-3.5" /> Save draft for later
            </button>
          </div>
        )}

        {/* ── Step 2: Details Form ──────────────────────────────────────────── */}
        {step === 'details' && (
          <div className="space-y-4 animate-fade-in">
            <Card>
              <CardContent className="p-5 space-y-5">
                {/* Pollution Type */}
                <div>
                  <Label htmlFor="pollution-type">{t('pollution_type')}</Label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.entries({
                      garbage_fire: '🔥 Garbage Fire',
                      smoke: '💨 Smoke / Haze',
                      construction_dust: '🏗️ Construction Dust',
                      industrial: '🏭 Industrial',
                      vehicle: '🚗 Vehicle',
                      burning_waste: '♻️ Burning Waste',
                      unknown: '❓ Unknown',
                    }) as [PollutionType, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPollutionType(key)}
                        className={cn(
                          'rounded-lg border p-2.5 text-left text-sm transition-all',
                          pollutionType === key
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border hover:border-primary/40 hover:bg-muted'
                        )}
                        aria-pressed={pollutionType === key}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity slider */}
                <div>
                  <Label>{t('severity')}</Label>
                  <div className="mt-2 flex gap-2">
                    {(['low', 'medium', 'high'] as SeverityLevel[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSeverity(s)}
                        className={cn(
                          'flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-all',
                          severity === s ? (
                            s === 'low' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' :
                            s === 'medium' ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          ) : 'border-border hover:border-primary/40'
                        )}
                      >
                        {t(s)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description with voice input */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">{t('description')}</Label>
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                        isListening ? 'bg-destructive/10 text-destructive' : 'hover:bg-muted text-muted-foreground'
                      )}
                      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    >
                      <Mic className="h-3 w-3" />
                      {isListening ? 'Listening...' : 'Speak'}
                    </button>
                  </div>
                  <Textarea
                    id="description"
                    className="mt-1"
                    rows={4}
                    placeholder="Describe what you see: location details, intensity, nearby landmarks..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{description.length}/500 characters</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('media')}>← Back</Button>
              <Button onClick={handleSubmit} loading={submitting} className="flex-1">
                {t('submit')}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: AI Result ─────────────────────────────────────────────── */}
        {step === 'ai_result' && aiResult && (
          <div className="space-y-4 animate-fade-in">
            {/* AI Result Card */}
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Gemini Vision Analysis</CardTitle>
                  <Badge variant="success" className="ml-auto">
                    {Math.round(aiResult.confidence * 100)}% confident
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview thumbnail */}
                {mediaPreview && mediaType === 'photo' && (
                  <img src={mediaPreview} alt="Analysed image" className="w-full h-40 object-cover rounded-lg" />
                )}

                {/* Key findings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Pollution Type</p>
                    <p className="font-semibold text-sm mt-0.5">{POLLUTION_LABELS[aiResult.pollutionType]}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Estimated AQI</p>
                    <div className="mt-0.5">
                      <AQIBadge value={aiResult.estimatedAQI} size="sm" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Possible Source</p>
                    <p className="font-semibold text-sm mt-0.5 line-clamp-2">{aiResult.possibleSource}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Health Risk</p>
                    <p className={cn('font-semibold text-sm mt-0.5 capitalize', {
                      'text-green-600': aiResult.healthRisk === 'low',
                      'text-amber-600': aiResult.healthRisk === 'moderate',
                      'text-red-600': aiResult.healthRisk === 'high' || aiResult.healthRisk === 'severe',
                    })}>
                      {aiResult.healthRisk}
                    </p>
                  </div>
                </div>

                {/* Detections */}
                <div className="flex flex-wrap gap-2">
                  {aiResult.smokeDetected && <Badge variant="warning">🌫️ Smoke Detected</Badge>}
                  {aiResult.dustDetected && <Badge variant="warning">💨 Dust Detected</Badge>}
                  {aiResult.fireDetected && <Badge variant="destructive">🔥 Fire Detected</Badge>}
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-primary" /> AI Summary
                  </p>
                  <p className="text-muted-foreground">{aiResult.summary}</p>
                </div>

                {/* Recommendation */}
                <div className={cn('rounded-lg border p-3 text-sm', aiResult.healthRisk === 'severe' ? 'border-destructive/30 bg-destructive/10' : 'border-amber-300/30 bg-amber-50/30 dark:bg-amber-950/10')}>
                  <p className="font-medium mb-1">Recommended Action</p>
                  <p className="text-muted-foreground">{aiResult.recommendedAction}</p>
                </div>
              </CardContent>
            </Card>

            {/* Edit detected values */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Confirm or adjust before submitting
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Pollution Type</Label>
                    <select
                      className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                      value={pollutionType}
                      onChange={(e) => setPollutionType(e.target.value as PollutionType)}
                    >
                      {Object.entries(POLLUTION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Severity</Label>
                    <select
                      className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                {!description && (
                  <Textarea
                    placeholder="Add any additional details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                )}
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} loading={submitting} className="w-full" size="lg">
              Submit Report
            </Button>
          </div>
        )}

        {/* ── Step 4: Success ───────────────────────────────────────────────── */}
        {step === 'submitted' && (
          <div className="flex flex-col items-center text-center gap-6 py-10 animate-fade-in">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-30" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">Report Submitted!</h2>
              <p className="text-muted-foreground">
                {isAnonymous ? 'Your anonymous report has been received.' : 'Thank you for making your city cleaner.'}
              </p>
              {reportId && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">Report ID: {reportId}</p>
              )}
            </div>

            {aiResult?.healthRisk === 'severe' || aiResult?.healthRisk === 'high' ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 max-w-sm text-sm text-left">
                <p className="font-semibold text-destructive mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Authorities Alerted
                </p>
                <p className="text-muted-foreground">
                  Due to the high severity detected, BBMP and KSPCB have been automatically notified. A team will be assigned within 2 hours.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-green-300/30 bg-green-50/30 dark:bg-green-950/20 p-4 max-w-sm text-sm">
                <p className="text-muted-foreground">Your report will be reviewed. Municipal teams are notified and will act within 24 hours.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Button onClick={() => { setStep('media'); setMediaFile(null); setMediaPreview(null); setAiResult(null); setDescription('') }} variant="outline" className="flex-1">
                Report Another
              </Button>
              <Button onClick={() => navigate('/map')} className="flex-1">
                View Heatmap
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Generate a mock AI result for demo
function generateMockAIResult(type: PollutionType, severity: SeverityLevel, desc: string): AIAnalysis {
  const aqiMap: Record<SeverityLevel, number> = { low: 65, medium: 145, high: 280 }
  return {
    pollutionType: type === 'unknown' ? 'smoke' : type,
    confidence: 0.87,
    smokeDetected: type === 'smoke' || type === 'garbage_fire' || type === 'burning_waste',
    dustDetected: type === 'construction_dust',
    fireDetected: type === 'garbage_fire' || type === 'burning_waste',
    possibleSource: {
      garbage_fire: 'Municipal solid waste burning',
      smoke: 'Combined vehicle and industrial emissions',
      construction_dust: 'Ongoing construction or demolition',
      industrial: 'Factory or industrial plant emissions',
      vehicle: 'Heavy traffic and diesel vehicles',
      burning_waste: 'Agricultural or residential waste burning',
      unknown: 'Unknown pollution source',
    }[type],
    estimatedSeverity: severity,
    healthRisk: severity === 'high' ? 'severe' : severity === 'medium' ? 'high' : 'moderate',
    recommendedAction: 'Contact local BBMP/municipal office. Residents with respiratory conditions should stay indoors.',
    estimatedAQI: aqiMap[severity],
    summary: desc
      ? `Based on your description: ${desc.slice(0, 100)}. This appears to be ${POLLUTION_LABELS[type]} with ${severity} severity.`
      : `${POLLUTION_LABELS[type]} detected with ${severity} severity. Immediate monitoring recommended.`,
    analyzedAt: new Date(),
  }
}
