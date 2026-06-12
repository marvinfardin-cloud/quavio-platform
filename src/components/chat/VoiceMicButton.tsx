'use client'

export default function VoiceMicButton({
  disabled,
}: {
  onTranscript: (t: string) => void
  onAutoSend: (t: string) => void
  disabled?: boolean
}) {
  function test() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => alert('Micro OK'))
      .catch((e: Error) => alert('Erreur: ' + e.message))
  }

  return (
    <button
      type="button"
      onClick={test}
      disabled={disabled}
      className="flex items-center justify-center rounded-xl disabled:opacity-40"
      style={{ backgroundColor: '#27272a', color: '#888', width: '48px', height: '48px', minWidth: '48px' }}
      title="Tester le micro"
    >
      🎤
    </button>
  )
}
