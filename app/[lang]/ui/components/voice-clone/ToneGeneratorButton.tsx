// app/[lang]/ui/components/voice-clone/ToneGeneratorButton.tsx

import React from 'react'

interface ToneGeneratorButtonProps {
  onGenerateTone: () => void
}

const ToneGeneratorButton: React.FC<ToneGeneratorButtonProps> = ({ onGenerateTone }) => {
  return (
    <button onClick={onGenerateTone} className="px-4 py-2 bg-purple-500 text-white rounded">
      生成音色
    </button>
  )
}

export default ToneGeneratorButton
