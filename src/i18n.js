import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome_back: "Welcome back",
      enter_credentials: "Enter your credentials to access your CRM workspace.",
      login_or_email: "Login or Email",
      password: "Password",
      placeholder_username: "e.g. admin",
      sign_in: "Sign In",
      logging_in: "Logging in...",
      fill_fields: "Please fill in all fields.",
      login_success: "Logged in successfully!",
      login_failed: "Invalid credentials or login failed.",
      network_error: "Network error. Please check your connection and try again.",
      show_password: "Show password",
      hide_password: "Hide password"
    }
  },
  gu: {
    translation: {
      welcome_back: "ફરી સ્વાગત છે",
      enter_credentials: "તમારા CRM વર્કસ્પેસને એક્સેસ કરવા માટે તમારા ઓળખપત્રો દાખલ કરો.",
      login_or_email: "લોગિન અથવા ઇમેઇલ",
      password: "પાસવર્ડ",
      placeholder_username: "દા.ત. admin",
      sign_in: "સાઇન ઇન કરો",
      logging_in: "સાઇન ઇન થઈ રહ્યું છે...",
      fill_fields: "કૃપા કરીને બધા ફીલ્ડ્સ ભરો.",
      login_success: "સફળતાપૂર્વક લોગ ઇન થયા!",
      login_failed: "અમાન્ય ઓળખપત્રો અથવા લૉગિન નિષ્ફળ ગયું.",
      network_error: "નેટવર્ક ભૂલ. કૃપા કરીને તમારું જોડાણ તપાસો અને ફરી પ્રયાસ કરો.",
      show_password: "પાસવર્ડ બતાવો",
      hide_password: "પાસવર્ડ છુપાવો"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
