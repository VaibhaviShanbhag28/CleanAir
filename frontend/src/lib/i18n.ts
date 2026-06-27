import type { Language } from '@/types'

type TranslationKey =
  | 'app_name'
  | 'app_tagline'
  | 'report_pollution'
  | 'view_map'
  | 'login'
  | 'signup'
  | 'anonymous_report'
  | 'upload_photo'
  | 'upload_video'
  | 'voice_report'
  | 'pollution_type'
  | 'severity'
  | 'description'
  | 'submit'
  | 'analyzing'
  | 'ai_analysis'
  | 'location'
  | 'detecting_location'
  | 'low'
  | 'medium'
  | 'high'
  | 'pending'
  | 'resolved'
  | 'total_reports'
  | 'people_affected'
  | 'response_time'
  | 'dashboard'
  | 'my_reports'
  | 'settings'
  | 'logout'
  | 'garbage_fire'
  | 'smoke'
  | 'construction_dust'
  | 'industrial'
  | 'vehicle'
  | 'burning_waste'
  | 'unknown'
  | 'health_advisory'
  | 'aqi_prediction'
  | 'hotspots'
  | 'filter'
  | 'today'
  | 'this_week'
  | 'last_hour'
  | 'all_types'

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    app_name: 'CleanAir',
    app_tagline: 'Spot and Fix Pollution in Your Neighbourhood',
    report_pollution: 'Report Pollution',
    view_map: 'View Heatmap',
    login: 'Login',
    signup: 'Sign Up',
    anonymous_report: 'Report Anonymously',
    upload_photo: 'Upload Photo',
    upload_video: 'Upload Video',
    voice_report: 'Voice Report',
    pollution_type: 'Pollution Type',
    severity: 'Severity',
    description: 'Description',
    submit: 'Submit Report',
    analyzing: 'AI is analysing...',
    ai_analysis: 'AI Analysis',
    location: 'Location',
    detecting_location: 'Detecting location...',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    pending: 'Pending',
    resolved: 'Resolved',
    total_reports: 'Total Reports',
    people_affected: 'People Affected',
    response_time: 'Avg Response Time',
    dashboard: 'Dashboard',
    my_reports: 'My Reports',
    settings: 'Settings',
    logout: 'Logout',
    garbage_fire: 'Garbage Fire',
    smoke: 'Smoke / Haze',
    construction_dust: 'Construction Dust',
    industrial: 'Industrial Pollution',
    vehicle: 'Vehicle Emission',
    burning_waste: 'Burning Waste',
    unknown: 'Unknown',
    health_advisory: 'Health Advisory',
    aqi_prediction: 'AQI Prediction',
    hotspots: 'Hotspots',
    filter: 'Filter',
    today: 'Today',
    this_week: 'This Week',
    last_hour: 'Last Hour',
    all_types: 'All Types',
  },
  hi: {
    app_name: 'स्वच्छ वायु',
    app_tagline: 'अपने इलाके में प्रदूषण खोजें और ठीक करें',
    report_pollution: 'प्रदूषण रिपोर्ट करें',
    view_map: 'हीटमैप देखें',
    login: 'लॉग इन',
    signup: 'साइन अप',
    anonymous_report: 'गुमनाम रिपोर्ट',
    upload_photo: 'फ़ोटो अपलोड करें',
    upload_video: 'वीडियो अपलोड करें',
    voice_report: 'आवाज़ रिपोर्ट',
    pollution_type: 'प्रदूषण का प्रकार',
    severity: 'गंभीरता',
    description: 'विवरण',
    submit: 'रिपोर्ट भेजें',
    analyzing: 'AI विश्लेषण कर रहा है...',
    ai_analysis: 'AI विश्लेषण',
    location: 'स्थान',
    detecting_location: 'स्थान पता कर रहे हैं...',
    low: 'कम',
    medium: 'मध्यम',
    high: 'उच्च',
    pending: 'लंबित',
    resolved: 'हल हो गया',
    total_reports: 'कुल रिपोर्ट',
    people_affected: 'प्रभावित लोग',
    response_time: 'औसत प्रतिक्रिया समय',
    dashboard: 'डैशबोर्ड',
    my_reports: 'मेरी रिपोर्ट',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    garbage_fire: 'कचरे में आग',
    smoke: 'धुआं',
    construction_dust: 'निर्माण धूल',
    industrial: 'औद्योगिक प्रदूषण',
    vehicle: 'वाहन उत्सर्जन',
    burning_waste: 'कचरा जलाना',
    unknown: 'अज्ञात',
    health_advisory: 'स्वास्थ्य सलाह',
    aqi_prediction: 'AQI पूर्वानुमान',
    hotspots: 'हॉटस्पॉट',
    filter: 'फ़िल्टर',
    today: 'आज',
    this_week: 'इस सप्ताह',
    last_hour: 'पिछले घंटे',
    all_types: 'सभी प्रकार',
  },
  kn: {
    app_name: 'ಶುದ್ಧ ವಾಯು',
    app_tagline: 'ನಿಮ್ಮ ಅಕ್ಕಪಕ್ಕದ ಮಾಲಿನ್ಯ ಪತ್ತೆ ಮಾಡಿ',
    report_pollution: 'ಮಾಲಿನ್ಯ ವರದಿ ಮಾಡಿ',
    view_map: 'ಹೀಟ್‌ಮ್ಯಾಪ್ ನೋಡಿ',
    login: 'ಲಾಗಿನ್',
    signup: 'ಸೈನ್ ಅಪ್',
    anonymous_report: 'ಅನಾಮಧೇಯ ವರದಿ',
    upload_photo: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್',
    upload_video: 'ವೀಡಿಯೋ ಅಪ್‌ಲೋಡ್',
    voice_report: 'ಧ್ವನಿ ವರದಿ',
    pollution_type: 'ಮಾಲಿನ್ಯದ ವಿಧ',
    severity: 'ತೀವ್ರತೆ',
    description: 'ವಿವರಣೆ',
    submit: 'ವರದಿ ಸಲ್ಲಿಸಿ',
    analyzing: 'AI ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...',
    ai_analysis: 'AI ವಿಶ್ಲೇಷಣೆ',
    location: 'ಸ್ಥಳ',
    detecting_location: 'ಸ್ಥಳ ಪತ್ತೆ ಮಾಡುತ್ತಿದೆ...',
    low: 'ಕಡಿಮೆ',
    medium: 'ಮಧ್ಯಮ',
    high: 'ಹೆಚ್ಚು',
    pending: 'ಬಾಕಿ',
    resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    total_reports: 'ಒಟ್ಟು ವರದಿಗಳು',
    people_affected: 'ಪ್ರಭಾವಿತ ಜನರು',
    response_time: 'ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    my_reports: 'ನನ್ನ ವರದಿಗಳು',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    logout: 'ಲಾಗ್ ಔಟ್',
    garbage_fire: 'ಕಸದ ಬೆಂಕಿ',
    smoke: 'ಹೊಗೆ',
    construction_dust: 'ನಿರ್ಮಾಣ ಧೂಳು',
    industrial: 'ಕೈಗಾರಿಕಾ ಮಾಲಿನ್ಯ',
    vehicle: 'ವಾಹನ ಹೊರಸೂಸುವಿಕೆ',
    burning_waste: 'ತ್ಯಾಜ್ಯ ಸುಡುವುದು',
    unknown: 'ಅಜ್ಞಾತ',
    health_advisory: 'ಆರೋಗ್ಯ ಸಲಹೆ',
    aqi_prediction: 'AQI ಮುನ್ಸೂಚನೆ',
    hotspots: 'ಹಾಟ್‌ಸ್ಪಾಟ್',
    filter: 'ಫಿಲ್ಟರ್',
    today: 'ಇಂದು',
    this_week: 'ಈ ವಾರ',
    last_hour: 'ಕಳೆದ ಗಂಟೆ',
    all_types: 'ಎಲ್ಲಾ ವಿಧಗಳು',
  },
}

export function useTranslation(lang: Language) {
  return {
    t: (key: TranslationKey) => translations[lang][key] || translations['en'][key] || key,
  }
}

export { translations }
export type { TranslationKey }
