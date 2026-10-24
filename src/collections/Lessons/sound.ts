// Database chỉ lưu tên âm ("Th", "Tr", "Ch"); giao diện tự thêm chữ "Âm".
// Bỏ tiền tố "Âm " nếu Admin lỡ gõ vào, để không bao giờ hiển thị "Âm Âm Th".
const SOUND_PREFIX = /^âm\s+(?=\S)/iu

export const normalizeSound = (value: string): string => {
  let sound = value.normalize('NFC').trim()

  while (SOUND_PREFIX.test(sound)) {
    sound = sound.replace(SOUND_PREFIX, '').trim()
  }

  return sound
}

export const formatSoundLabel = (sound: string): string => `Âm ${normalizeSound(sound)}`
