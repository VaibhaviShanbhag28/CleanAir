import { useStore } from '@/store'
import { useTranslation } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { Switch, Label, Separator } from '@/components/ui/index'
import { Sun, Moon, Globe, Type, Contrast, Bell, Shield, Info } from 'lucide-react'
import type { Language, Theme } from '@/types'

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, highContrast, setHighContrast, largeText, setLargeText } = useStore()
  const { t } = useTranslation(language)

  const applyTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('settings')}</h1>
          <p className="text-muted-foreground text-sm mt-1">Personalise your CleanAir experience</p>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sun className="h-4 w-4" /> Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => applyTheme(themeOption)}
                    className={`rounded-lg border p-3 text-sm font-medium capitalize transition-all ${
                      theme === themeOption ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {themeOption === 'light' ? '☀️' : themeOption === 'dark' ? '🌙' : '💻'} {themeOption}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="high-contrast" className="text-sm font-medium flex items-center gap-2">
                  <Contrast className="h-4 w-4" /> High Contrast Mode
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">Enhanced visibility for low-vision users</p>
              </div>
              <Switch id="high-contrast" checked={highContrast} onCheckedChange={(v) => {
                setHighContrast(v)
                document.documentElement.classList.toggle('high-contrast', v)
              }} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="large-text" className="text-sm font-medium flex items-center gap-2">
                  <Type className="h-4 w-4" /> Large Text
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">Increases base font size for readability</p>
              </div>
              <Switch id="large-text" checked={largeText} onCheckedChange={(v) => {
                setLargeText(v)
                document.documentElement.style.fontSize = v ? '18px' : ''
              }} />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Language</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {([
                { code: 'en', label: 'English', native: 'English' },
                { code: 'hi', label: 'Hindi', native: 'हिंदी' },
                { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
              ] as { code: Language; label: string; native: string }[]).map(({ code, label, native }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`rounded-lg border p-3 text-sm font-medium transition-all text-left ${
                    language === code ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="block font-semibold">{native}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'notif-severe', label: 'Severe Pollution Alerts', desc: 'Get notified when AQI exceeds 200 near you', defaultChecked: true },
              { id: 'notif-resolved', label: 'Report Status Updates', desc: 'Updates when your reports are actioned', defaultChecked: true },
              { id: 'notif-weekly', label: 'Weekly Summary', desc: 'Air quality digest every Monday morning', defaultChecked: false },
            ].map(({ id, label, desc, defaultChecked }) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <Switch id={id} checked={defaultChecked} onCheckedChange={() => {}} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Privacy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="anon-default" className="text-sm font-medium">Default Anonymous Reporting</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Submit reports without your name by default</p>
              </div>
              <Switch id="anon-default" checked={false} onCheckedChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="location-precise" className="text-sm font-medium">Precise Location Sharing</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Share exact GPS with reports (more accurate)</p>
              </div>
              <Switch id="location-precise" checked={true} onCheckedChange={() => {}} />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" /> About</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>CleanAir v1.0.0 — Built for Hack2Skill 2024</p>
            <p>Powered by Gemini Vision AI · Google Maps · OpenWeatherMap</p>
            <p>WCAG 2.1 AA Compliant · Made for Indian cities</p>
            <p className="text-xs pt-2">Tech stack: React + Vite · FastAPI · Firebase · Gemini AI · Google Cloud</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
