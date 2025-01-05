// app/[lang]/ui/components/voice-clone/TextOutput.tsx

import React from 'react'

interface TextOutputProps {
  text: string
  onTextChange?: (newText: string) => void
}

const TextOutput: React.FC<TextOutputProps> = ({ text, onTextChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange?.(e.target.value)
  }

  return (
    <textarea
      className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded"
      rows={5}
      value={text}
      onChange={handleChange}
    />
  )
}

export default TextOutput
