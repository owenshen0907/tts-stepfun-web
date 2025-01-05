// app/[lang]/ui/components/voice-clone/AudioPlayer.tsx
'use client'

import React, { useEffect, useRef } from 'react'

interface CustomWaveformProps {
  audioUrl: string
  currentTime: number
  duration: number
  trimStart: number
  trimEnd: number
  onTrimStartChange: (newStart: number) => void
  onTrimEndChange: (newEnd: number) => void
}

const CustomWaveform: React.FC<CustomWaveformProps> = ({
  audioUrl,
  currentTime,
  duration,
  trimStart,
  trimEnd,
  onTrimStartChange,
  onTrimEndChange,
}) => {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null)
  const playbackCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isDraggingStart = useRef<boolean>(false)
  const isDraggingEnd = useRef<boolean>(false)

  // ==============================
  // First useEffect: Draw waveform
  // ==============================

  useEffect(() => {
    if (!audioUrl) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const waveformCanvas = waveformCanvasRef.current
    const waveformCtx = waveformCanvas?.getContext('2d')

    if (!waveformCanvas || !waveformCtx) {
      console.error('无法获取 Waveform Canvas 或其上下文')
      return
    }

    let waveformData: number[] = []

    // 处理设备像素比
    const setupCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    // 调整 Canvas 尺寸以匹配容器
    const resizeCanvas = () => {
      if (!waveformCanvas || !containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      waveformCanvas.style.width = `${width}px`
      waveformCanvas.style.height = `${height}px`
      setupCanvas(waveformCanvas, waveformCtx)
      drawWaveform()
    }

    // 绘制波形和裁切线（仅绘制一次）
    const drawWaveform = () => {
      if (!waveformCtx || !audioUrl || !duration) return

      fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const rawData = audioBuffer.getChannelData(0) // 获取单声道数据
          const samples = waveformCanvas.width / (window.devicePixelRatio || 1) // 根据 Canvas 宽度调整样本数
          const blockSize = Math.floor(rawData.length / samples)
          const filteredData: number[] = []
          for (let i = 0; i < samples; i++) {
            let sum = 0
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(rawData[i * blockSize + j])
            }
            filteredData.push(sum / blockSize)
          }

          const max = Math.max(...filteredData)
          waveformData = filteredData.map(n => (max === 0 ? 0 : n / max)) // 归一化

          // 清空 Canvas
          waveformCtx.clearRect(
            0,
            0,
            waveformCanvas.width / (window.devicePixelRatio || 1),
            waveformCanvas.height / (window.devicePixelRatio || 1),
          )

          // 绘制波形
          waveformCtx.fillStyle = '#A8DBA8'
          const barWidth = waveformCanvas.width / (window.devicePixelRatio || 1) / waveformData.length
          waveformData.forEach((value, index) => {
            const barHeight = value * (waveformCanvas.height / (window.devicePixelRatio || 1))
            waveformCtx.fillRect(
              index * barWidth,
              (waveformCanvas.height / (window.devicePixelRatio || 1) - barHeight) / 2,
              barWidth,
              barHeight,
            )
          })

          // 绘制裁切区域高亮
          const startProgress = trimStart / duration
          const endProgress = trimEnd / duration
          waveformCtx.fillStyle = 'rgba(0, 123, 255, 0.1)' // 半透明蓝色
          waveformCtx.fillRect(
            startProgress * (waveformCanvas.width / (window.devicePixelRatio || 1)),
            0,
            (endProgress - startProgress) * (waveformCanvas.width / (window.devicePixelRatio || 1)),
            waveformCanvas.height / (window.devicePixelRatio || 1),
          )

          // 绘制开始裁切线
          waveformCtx.strokeStyle = '#007BFF'
          waveformCtx.lineWidth = 2
          waveformCtx.beginPath()
          waveformCtx.moveTo(startProgress * (waveformCanvas.width / (window.devicePixelRatio || 1)), 0)
          waveformCtx.lineTo(
            startProgress * (waveformCanvas.width / (window.devicePixelRatio || 1)),
            waveformCanvas.height / (window.devicePixelRatio || 1),
          )
          waveformCtx.stroke()

          // 绘制结束裁切线
          waveformCtx.beginPath()
          waveformCtx.moveTo(endProgress * (waveformCanvas.width / (window.devicePixelRatio || 1)), 0)
          waveformCtx.lineTo(
            endProgress * (waveformCanvas.width / (window.devicePixelRatio || 1)),
            waveformCanvas.height / (window.devicePixelRatio || 1),
          )
          waveformCtx.stroke()
        })
        .catch(error => {
          console.error('加载音频或绘制波形时出错:', error)
        })
    }

    // 初始化
    resizeCanvas()

    window.addEventListener('resize', resizeCanvas)

    return () => {
      audioContext.close()
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [audioUrl, duration, trimStart, trimEnd])

  // ==========================================
  // Second useEffect: Update playback position
  // ==========================================

  useEffect(() => {
    let animationFrameId: number

    const playbackCanvas = playbackCanvasRef.current
    const playbackCtx = playbackCanvas?.getContext('2d')

    if (!playbackCanvas || !playbackCtx) {
      console.error('无法获取 Playback Canvas 或其上下文')
      return
    }

    // 处理设备像素比
    const setupCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    // 调整 Canvas 尺寸以匹配容器
    const resizeCanvas = () => {
      if (!playbackCanvas || !containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      playbackCanvas.style.width = `${width}px`
      playbackCanvas.style.height = `${height}px`
      setupCanvas(playbackCanvas, playbackCtx)
    }

    resizeCanvas()

    // 绘制播放位置线（每帧绘制）
    const drawPlaybackLine = () => {
      if (!playbackCtx || !playbackCanvasRef.current) return

      // 清空 Canvas
      playbackCtx.clearRect(0, 0, playbackCanvas.width, playbackCanvas.height)

      // 绘制播放位置线
      const progress = currentTime / duration
      if (progress < 0 || progress > 1) return

      playbackCtx.strokeStyle = '#FF0000'
      playbackCtx.lineWidth = 2
      playbackCtx.beginPath()
      playbackCtx.moveTo(progress * playbackCanvas.width, 0)
      playbackCtx.lineTo(progress * playbackCanvas.width, playbackCanvas.height)
      playbackCtx.stroke()
    }

    // 动画循环
    const animate = () => {
      drawPlaybackLine()
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener('resize', resizeCanvas)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [currentTime, duration]) // 注意，这里依赖于 currentTime 和 duration

  // ==========================================
  // Handle drag events for trimming
  // ==========================================

  // 处理拖动开始裁切线（鼠标）
  const handleMouseDownStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingStart.current = true
    document.addEventListener('mousemove', handleMouseMoveStart)
    document.addEventListener('mouseup', handleMouseUpStart)
  }

  const handleMouseMoveStart = (e: MouseEvent) => {
    if (!isDraggingStart.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(x / rect.width, 1))
    let newStart = ratio * duration
    newStart = Math.max(0, Math.min(newStart, trimEnd - 0.1))
    onTrimStartChange(newStart)
  }

  const handleMouseUpStart = () => {
    isDraggingStart.current = false
    document.removeEventListener('mousemove', handleMouseMoveStart)
    document.removeEventListener('mouseup', handleMouseUpStart)
  }

  // 处理拖动结束裁切线（鼠标）
  const handleMouseDownEnd = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingEnd.current = true
    document.addEventListener('mousemove', handleMouseMoveEnd)
    document.addEventListener('mouseup', handleMouseUpEnd)
  }

  const handleMouseMoveEnd = (e: MouseEvent) => {
    if (!isDraggingEnd.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(x / rect.width, 1))
    let newEnd = ratio * duration
    newEnd = Math.min(duration, Math.max(newEnd, trimStart + 0.1))
    onTrimEndChange(newEnd)
  }

  const handleMouseUpEnd = () => {
    isDraggingEnd.current = false
    document.removeEventListener('mousemove', handleMouseMoveEnd)
    document.removeEventListener('mouseup', handleMouseUpEnd)
  }

  // 处理触摸开始裁切线（触摸）
  const handleTouchStartStart = (e: React.TouchEvent) => {
    e.preventDefault()
    isDraggingStart.current = true
    document.addEventListener('touchmove', handleTouchMoveStart)
    document.addEventListener('touchend', handleTouchUpStart)
  }

  const handleTouchMoveStart = (e: TouchEvent) => {
    if (!isDraggingStart.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const ratio = Math.max(0, Math.min(x / rect.width, 1))
    let newStart = ratio * duration
    newStart = Math.max(0, Math.min(newStart, trimEnd - 0.1))
    onTrimStartChange(newStart)
  }

  const handleTouchUpStart = () => {
    isDraggingStart.current = false
    document.removeEventListener('touchmove', handleTouchMoveStart)
    document.removeEventListener('touchend', handleTouchUpStart)
  }

  // 处理触摸结束裁切线（触摸）
  const handleTouchStartEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    isDraggingEnd.current = true
    document.addEventListener('touchmove', handleTouchMoveEnd)
    document.addEventListener('touchend', handleTouchUpEnd)
  }

  const handleTouchMoveEnd = (e: TouchEvent) => {
    if (!isDraggingEnd.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const ratio = Math.max(0, Math.min(x / rect.width, 1))
    let newEnd = ratio * duration
    newEnd = Math.min(duration, Math.max(newEnd, trimStart + 0.1))
    onTrimEndChange(newEnd)
  }

  const handleTouchUpEnd = () => {
    isDraggingEnd.current = false
    document.removeEventListener('touchmove', handleTouchMoveEnd)
    document.removeEventListener('touchend', handleTouchUpEnd)
  }

  return (
    <div ref={containerRef} className="relative w-full h-24">
      {/* 静态波形和裁切线 Canvas */}
      <canvas ref={waveformCanvasRef} className="absolute top-0 left-0 w-full h-full" />

      {/* 动态播放位置线 Canvas */}
      <canvas ref={playbackCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" />

      {/* 开始裁切线的拖动手柄 */}
      <div
        className="absolute top-0 bottom-0 w-4 cursor-ew-resize flex flex-col items-center z-20"
        style={{
          left: `${(trimStart / duration) * 100}%`,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={handleMouseDownStart}
        onTouchStart={handleTouchStartStart}
      >
        <div className="w-4 h-4 bg-blue-700 rounded-full -mt-2"></div>
      </div>

      {/* 结束裁切线的拖动手柄 */}
      <div
        className="absolute top-0 bottom-0 w-4 cursor-ew-resize flex flex-col items-center z-20"
        style={{
          left: `${(trimEnd / duration) * 100}%`,
          transform: 'translateX(-50%)',
        }}
        onMouseDown={handleMouseDownEnd}
        onTouchStart={handleTouchStartEnd}
      >
        <div className="w-4 h-4 bg-blue-700 rounded-full -mt-2"></div>
      </div>
    </div>
  )
}

export default CustomWaveform
