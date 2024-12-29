// app/lib/constants.ts
export const STEPFUN_API_KEY = process.env.STEPFUN_API_KEY || ''
export const STEPFUN_API_URL = process.env.STEPFUN_API_URL || ''

export const STEPFUN_VOICES = [
  //男声
  { value: 'cixingnansheng', label: '磁性男声', gender: 'male', previewUrl: '/audios/cixingnansheng.mp3' },
  { value: 'zhengpaiqingnian', label: '正派青年', gender: 'male', previewUrl: '/audios/zhengpaiqingnian.mp3' },
  { value: 'yuanqinansheng', label: '元气男声', gender: 'male', previewUrl: '/audios/yuanqinansheng.mp3' },
  { value: 'qingniandaxuesheng', label: '青年大学生', gender: 'male', previewUrl: '/audios/qingniandaxuesheng.mp3' },
  { value: 'boyinnansheng', label: '播音男声', gender: 'male', previewUrl: '/audios/boyinnansheng.mp3' },
  { value: 'ruyananshi', label: '儒雅男士', gender: 'male', previewUrl: '/audios/ruyananshi.mp3' },
  { value: 'shenchennanyin', label: '深沉男音', gender: 'male', previewUrl: '/audios/shenchennanyin.mp3' },
  //女声
  { value: 'qinqienvsheng', label: '亲切女声', gender: 'female', previewUrl: '/audios/qinqienvsheng.mp3' },
  { value: 'wenrounvsheng', label: '温柔女声', gender: 'female', previewUrl: '/audios/wenrounvsheng.mp3' },
  { value: 'jilingshaonv', label: '机灵少女', gender: 'female', previewUrl: '/audios/jilingshaonv.mp3' },
  { value: 'yuanqishaonv', label: '元气少女', gender: 'female', previewUrl: '/audios/yuanqishaonv.mp3' },
  { value: 'ruanmengnvsheng', label: '软萌女声', gender: 'female', previewUrl: '/audios/ruanmengnvsheng.mp3' },
  { value: 'youyanvsheng', label: '优雅女声', gender: 'female', previewUrl: '/audios/youyanvsheng.mp3' },
  { value: 'lengyanyujie', label: '冷艳御姐', gender: 'female', previewUrl: '/audios/lengyanyujie.mp3' },
  { value: 'shuangkuaijiejie', label: '爽快姐姐', gender: 'female', previewUrl: '/audios/shuangkuaijiejie.mp3' },
  { value: 'wenjingxuejie', label: '文静学姐', gender: 'female', previewUrl: '/audios/wenjingxuejie.mp3' },
  { value: 'linjiajiejie', label: '邻家姐姐', gender: 'female', previewUrl: '/audios/linjiajiejie.mp3' },
  { value: 'linjiameimei', label: '邻家妹妹', gender: 'female', previewUrl: '/audios/linjiameimei.mp3' },
  { value: 'zhixingjiejie', label: '知性姐姐', gender: 'female', previewUrl: '/audios/zhixingjiejie.mp3' },
] as const

// StepFun 最大输入长度
export const STEPFUN_MAX_INPUT_LENGTH = 1000

export const GITHUB_URL = 'https://github.com/owenshen0907/tts-stepfun-web'

export const DEFAULT_TEXT = {
  CN:
    '《将进酒》：李白； \n' +
    '君不见，黄河之水天上来，奔流到海不复回。\n' +
    '君不见，高堂明镜悲白发，朝如青丝暮成雪。\n',
  EN: "Hmm, I'm not sure",
}

export const LANGS = [
  {
    label: '中文',
    value: 'cn',
  },
  {
    label: 'English',
    value: 'en',
  },
  {
    label: '日本語',
    value: 'jp',
  },
]

export const TIMES = ['200', '300', '500', '1000', '2000', '5000']

export const MIME_TYPES = [
  { value: 'wav', label: 'WAV' },
  { value: 'mp3', label: 'MP3' },
  { value: 'flac', label: 'FLAC' },
  { value: 'opus', label: 'OPUS' },
]
