// app/[lang]/ui/components/voice-clone/FileUploader.tsx
import React, { ChangeEvent } from 'react'
import { FiUpload } from 'react-icons/fi' // 需安装 react-icons 或你使用其他图标

interface FileUploaderProps {
  accept?: string
  onFileUpload: (file: File) => void
}

const FileUploader: React.FC<FileUploaderProps> = ({ accept, onFileUpload }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    onFileUpload(file)
  }

  return (
    <div className="w-full flex justify-center">
      <label
        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded
                   cursor-pointer flex items-center justify-center space-x-2"
      >
        <FiUpload size={20} />
        <span>上传音频</span>
        <input type="file" accept={accept} className="hidden" onChange={handleChange} />
      </label>
    </div>
  )
}

export default FileUploader
