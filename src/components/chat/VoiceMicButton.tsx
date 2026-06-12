'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void
  onAutoSend: (text: string) => void
  disabled?: boolean
}

export default function VoiceMicButton({ onTranscript, onAutoSend, disabled }: VoiceMicButtonProps) {
  const [supported, setSupported] = useState(false)
  const [recording, setRecording] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const autoSendTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in (window as any))
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setRecording(false)
  }, [])

  const start = useCallback(async () => {
    if (autoSendTimer.current) clearTimeout(autoSendTimer.current)

    // Request mic permission explicitly — required on mobile browsers
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Release the stream immediately; we only needed the permission grant
        stream.getTracks().forEach((t) => t.stop())
      } catch {
        toast.error('Veuillez autoriser le microphone dans les réglages de votre navigateur')
        return
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SRClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SRClass()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onstart = () => setRecording(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string
      onTranscript(transcript)
      setRecording(false)
      autoSendTimer.current = setTimeout(() => onAutoSend(transcript), 1500)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setRecording(false)
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          toast.error('Veuillez autoriser le microphone dans les réglages de votre navigateur')
          break
        case 'no-speech':
        case 'aborted':
          break
        case 'network':
          toast.error('Erreur réseau — vérifiez votre connexion')
          break
        default:
          toast.error('Micro non disponible')
      }
    }

    recognition.onend = () => setRecording(false)

    try {
      recognition.start()
    } catch {
      toast.error('Micro non disponible')
      setRecording(false)
    }
  }, [onTranscript, onAutoSend])

  const toggle = () => {
    if (recording) {
      stop()
    } else {
      start()
    }
  }

  if (!supported) return null

  return (
    <div className="relative flex items-center justify-center flex-shrink-0">
      {recording && (
        <span
          className="absolute inset-0 rounded-xl animate-ping"
          style={{ backgroundColor: '#C4607A', opacity: 0.35 }}
        />
      )}
      <button
        type="button"
        onClick={toggle}
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

      {recording && (
        <span
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-md"
          style={{ backgroundColor: '#1a1a1a', color: '#C4607A', border: '1px solid #3a1f28' }}
        >
          Je vous écoute…
        </span>
      )}
    </div>
  )
}
