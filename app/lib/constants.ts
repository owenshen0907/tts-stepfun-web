// app/lib/constants.ts
export const STEPFUN_API_KEY = process.env.STEPFUN_API_KEY || ''
export const STEPFUN_API_URL = process.env.STEPFUN_API_URL || ''

export const STEPFUN_VOICES = [
  // 男声
  { value: 'cixingnansheng', label: '磁性男声', gender: 'male' },
  { value: 'zhengpaiqingnian', label: '正派青年', gender: 'male' },
  { value: 'yuanqinansheng', label: '元气男声', gender: 'male' },
  { value: 'qingniandaxuesheng', label: '青年大学生', gender: 'male' },
  { value: 'boyinnansheng', label: '播音男声', gender: 'male' },
  { value: 'ruyananshi', label: '儒雅男士', gender: 'male' },
  { value: 'shenchennanyin', label: '深沉男音', gender: 'male' },
  // 女声
  { value: 'qinqienvsheng', label: '亲切女声', gender: 'female' },
  { value: 'wenrounvsheng', label: '温柔女声', gender: 'female' },
  { value: 'jilingshaonv', label: '机灵少女', gender: 'female' },
  { value: 'yuanqishaonv', label: '元气少女', gender: 'female' },
  { value: 'ruanmengnvsheng', label: '软萌女声', gender: 'female' },
  { value: 'youyanvsheng', label: '优雅女声', gender: 'female' },
  { value: 'lengyanyujie', label: '冷艳御姐', gender: 'female' },
  { value: 'shuangkuaijiejie', label: '爽快姐姐', gender: 'female' },
  { value: 'wenjingxuejie', label: '文静学姐', gender: 'female' },
  { value: 'linjiajiejie', label: '邻家姐姐', gender: 'female' },
  { value: 'linjiameimei', label: '邻家妹妹', gender: 'female' },
  { value: 'zhixingjiejie', label: '知性姐姐', gender: 'female' },
]

// StepFun 最大输入长度
export const STEPFUN_MAX_INPUT_LENGTH = 1000

export const GITHUB_URL = 'https://github.com/owenshen0907/tts-stepfun-web'

export const DEFAULT_TEXT = {
  CN: '《将进酒》：李白 \n' +
    '君不见，黄河之水天上来，奔流到海不复回。\n' +
    '君不见，高堂明镜悲白发，朝如青丝暮成雪。\n' +
    '人生得意须尽欢，莫使金樽空对月。\n' +
    '天生我材必有用，千金散尽还复来。\n' +
    '烹羊宰牛且为乐，会须一饮三百杯。\n' +
    '岑夫子，丹丘生，将进酒，杯莫停。\n' +
    '与君歌一曲，请君为我倾耳听。\n' +
    '钟鼓馔玉不足贵，但愿长醉不复醒。\n' +
    '古来圣贤皆寂寞，惟有饮者留其名。\n' +
    '陈王昔时宴平乐，斗酒十千恣欢谑。\n' +
    '主人何为言少钱，径须沽取对君酌。\n' +
    '五花马，千金裘，呼儿将出换美酒，与尔同销万古愁。',
  EN: "Hmm, I'm not sure what to wear to the party tonight. I want to look nice, but I also want to be comfortable. Maybe I’ll wear my new dress and heels. Oh no, but what if my feet start hurting after a while? Maybe I should bring a pair of flats just in case.",
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
]

export const TIMES = ['200', '300', '500', '1000', '2000', '5000']

export const MIME_TYPES = [
  { value: 'wav', label: 'WAV' },
  { value: 'mp3', label: 'MP3' },
  { value: 'flac', label: 'FLAC' },
  { value: 'opus', label: 'OPUS' },
]