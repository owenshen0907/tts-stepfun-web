declare module 'wavesurfer.js' {
  export interface WaveSurferOptions {
    container: string | HTMLElement
    waveColor?: string
    progressColor?: string
    cursorColor?: string
    autoCenter?: boolean
    backend?: string
    // 你可以根据需要添加更多选项
  }

  export interface WaveSurferInstance {
    load(url: string | Blob): Promise<void> | void
    play(): Promise<void> | void
    pause(): void
    setTime(seconds: number): void
    setPlayEnd(seconds: number): void
    destroy(): void
    getDuration(): number
    on(eventName: string, callback: (...args: any[]) => void): void
    addRegion(params: any): any
    addPlugin(plugin: any): void
    initPlugin(name: string): void
    // 根据需要添加更多方法
  }

  interface WaveSurferFactory {
    create(options: WaveSurferOptions): WaveSurferInstance
  }

  const WaveSurfer: WaveSurferFactory
  export default WaveSurfer
}

declare module 'wavesurfer.js/dist/plugins/regions.js' {
  export interface RegionsPluginOptions {
    dragSelection?: boolean
    // 根据需要添加更多选项
  }

  export interface RegionsPluginInstance {
    // 定义插件实例的方法和属性（如果需要）
  }

  const RegionsPlugin: {
    create(options?: RegionsPluginOptions): RegionsPluginInstance
  }

  export default RegionsPlugin
}
