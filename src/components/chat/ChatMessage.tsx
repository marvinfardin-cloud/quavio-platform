import Image from 'next/image'
import { Message } from '@/types'

interface ChatMessageProps {
  message: Message
  primaryColor: string
  agentName: string
  agentPhoto?: string
}

export default function ChatMessage({ message, primaryColor, agentName, agentPhoto }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 mt-1 overflow-hidden relative"
          style={agentPhoto ? {} : { backgroundColor: primaryColor }}
        >
          {agentPhoto ? (
            <Image
              src={agentPhoto}
              alt={agentName}
              fill
              className="object-cover object-top"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
              {agentName.charAt(0)}
            </span>
          )}
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-zinc-700 text-white rounded-tr-sm'
            : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
