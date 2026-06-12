'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void
  onAutoSend: (text: string) => void
  disabled?: boolean
}

export default function VoiceMicButton({ onTranscript, onAutoSend, disabled }: VoiceMicButtonProps) {
  const [supported, setSupported] = useState(false)
  const [recording, setRecording] = useState(false)
  const [used, setUsed] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const autoSendTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition))
  }, [])

  async function startVoice() {
    if (autoSendTimer.current) clearTimeout(autoSendTimer.current)
    setUsed(true)

    // HTTPS check
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert('La reconnaissance vocale nécessite HTTPS.')
      return
    }

    // Explicit mic permission — triggers native dialog on iOS Safari
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      alert('Veuillez autoriser le microphone dans Réglages > Safari > Microphone')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRec = w.webkitSpeechRecognition || w.SpeechRecognition

    if (!SpeechRec) {
      alert('Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome.')
      return
    }

    const recognition = new SpeechRec()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => setRecording(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string
      onTranscript(transcript)
      setRecording(false)
      autoSendTimer.current = setTimeout(() => onAutoSend(transcript), 1000)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error)
      setRecording(false)
      if (event.error === 'not-allowed') {
        alert('Micro refusé. Allez dans Réglages iPhone > Safari > Microphone > Autoriser')
      }
    }

    recognition.onend = () => setRecording(false)

    try {
      recognition.start()
    } catch (e) {
      console.error(e)
      setRecording(false)
    }
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  if (!supported) return null

  return (
    <div className="relative flex flex-col items-center gap-1 flex-shrink-0">
      {/* Pulse ring while recording */}
      {recording && (
        <span
          className="absolute inset-0 rounded-xl animate-ping pointer-events-none"
          style={{ backgroundColor: '#C4607A', opacity: 0.35 }}
        />
      )}

      {/* "Je vous écoute" banner */}
      {recording && (
        <span
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-md pointer-events-none"
          style={{ backgroundColor: '#1a1a1a', color: '#C4607A', border: '1px solid #3a1f28' }}
        >
          Je vous écoute…
        </span>
      )}

      <button
        type="button"
        onClick={recording ? stopVoice : startVoice}
        disabled={disabled}
        title={recording ? 'Arrêter' : 'Dicter'}
        className="relative flex items-center justify-center rounded-xl transition-colors disabled:opacity-40"
        style={{
          backgroundColor: recording ? '#C4607A' : '#27272a',
          color: recording ? '#fff' : '#888',
          width: '48px',
          height: '48px',
          minWidth: '48px',
        }}
      >
        {recording ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      {/* First-use hint */}
      {!recording && !used && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-zinc-600 pointer-events-none"
          style={{ fontSize: '10px' }}>
          Parlez en français
        </span>
      )}
    </div>
  )
}
