import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as db from '@/database'

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  notificationEnabled: boolean
  reminderDays: number
  language: 'zh-CN' | 'en-US'
}

const defaultSettings: AppSettings = {
  theme: 'light',
  notificationEnabled: true,
  reminderDays: 1,
  language: 'zh-CN'
}

export const useSettingStore = defineStore('setting', () => {
  const settings = ref<AppSettings>({ ...defaultSettings })

  async function init() {
    try {
      const savedTheme = db.getSetting('theme')
      const savedNotification = db.getSetting('notificationEnabled')
      const savedReminderDays = db.getSetting('reminderDays')
      const savedLanguage = db.getSetting('language')

      settings.value = {
        theme: (savedTheme as AppSettings['theme']) || defaultSettings.theme,
        notificationEnabled: savedNotification === 'true',
        reminderDays: parseInt(savedReminderDays || '1', 10),
        language: (savedLanguage as AppSettings['language']) || defaultSettings.language
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    settings.value[key] = value
    db.setSetting(key, String(value))
  }

  function resetSettings() {
    settings.value = { ...defaultSettings }
    for (const key of Object.keys(defaultSettings)) {
      const value = defaultSettings[key as keyof AppSettings]
      db.setSetting(key, String(value))
    }
  }

  return {
    settings,
    init,
    updateSetting,
    resetSettings
  }
})
