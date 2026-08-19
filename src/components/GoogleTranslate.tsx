import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function GoogleTranslate() {
  const [lang, setLang] = useState("en");

  // Read initial language from Google Translate cookie if it exists
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
    };

    const googtrans = getCookie("googtrans");
    if (googtrans) {
      const langCode = googtrans.split("/").pop();
      if (langCode) setLang(langCode);
    }
  }, []);

  useEffect(() => {
    // Only inject the script and container ONCE globally on the body.
    // This prevents React re-renders from destroying the widget and causing it to disappear.
    if (!document.getElementById("google_translate_element")) {
      const el = document.createElement("div");
      el.id = "google_translate_element";
      el.style.display = "none";
      document.body.appendChild(el);

      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,hi,mr,gu,bn,te,ta,kn,ml,pa,ur,or,as",
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      };

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const triggerTranslation = (targetLang: string) => {
    setLang(targetLang);
    
    // Find the hidden Google Translate select element and change its value
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = targetLang;
      select.dispatchEvent(new Event("change"));
    }
  };

  return (
    <div className="relative inline-flex items-center overflow-hidden rounded-full border border-orange-500/30 bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-md transition-all hover:bg-white/90 hover:shadow-md">
      <Globe className="mr-2 h-4 w-4 text-orange-600" />
      <select
        value={lang}
        onChange={(e) => triggerTranslation(e.target.value)}
        className="bg-transparent text-sm font-bold text-orange-700 outline-none cursor-pointer appearance-none pr-4"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी (Hindi)</option>
        <option value="mr">मराठी (Marathi)</option>
        <option value="gu">ગુજરાતી (Gujarati)</option>
        <option value="bn">বাংলা (Bengali)</option>
        <option value="te">తెలుగు (Telugu)</option>
        <option value="ta">தமிழ் (Tamil)</option>
        <option value="kn">ಕನ್ನಡ (Kannada)</option>
        <option value="ml">മലയാളം (Malayalam)</option>
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg className="h-3 w-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Global CSS to hide the annoying Google Translate top bar and popups */}
      <style>{`
        body { top: 0 !important; position: static !important; }
        .skiptranslate iframe { display: none !important; }
        #goog-gt-tt { display: none !important; }
        .goog-te-spinner-pos { display: none !important; }
        .goog-te-spinner-animation { display: none !important; }
      `}</style>
    </div>
  );
}
