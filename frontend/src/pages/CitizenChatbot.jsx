import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import Layout from '../components/Layout';
import { Send, Bot, User, RotateCcw, Globe, MapPin, Camera, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TUNIS_CENTER = [36.8065, 10.1815];

const LANG_FLAGS = { fr: '🇫🇷', en: '🇬🇧', ar: '🇹🇳', tn: '🇹🇳' };
const LANG_NAMES = { fr: 'Français', en: 'English', ar: 'العربية', tn: 'تونسي' };

const WELCOME = {
  fr: "Bonjour ! Je suis l'assistant intelligent **Plainte360**. 🤖\nJe comprends le **français**, **l'anglais**, **l'arabe** et le **dialecte tunisien**.\n\nComment puis-je vous aider ? Décrivez votre problème ou utilisez les raccourcis ci-dessous.",
  en: "Hello! I'm the **Plainte360** smart assistant. 🤖\nI understand **French**, **English**, **Arabic** and **Tunisian dialect**.\n\nHow can I help you? Describe your problem or use the shortcuts below.",
  ar: "مرحبا! أنا المساعد الذكي **Plainte360**. 🤖\nأفهم **الفرنسية** و**الإنجليزية** و**العربية** و**اللهجة التونسية**.\n\nكيف يمكنني مساعدتك؟ صف لي مشكلتك أو استعمل الأزرار أسفله.",
  tn: "أهلا! أنا المساعد الذكي **Plainte360**. 🤖\nنفهم **بالفرنسي** و**بالإنجليزي** و**بالعربي** و**بالتونسي**.\n\nقولي شنوا المشكلة متاعك ولا استعمل الأزرار إلي لتحت.",
};

const QUICK_ACTIONS = {
  fr: [
    { label: '🆘 Aide', msg: 'aide' },
    { label: '📂 Catégories', msg: 'catégories' },
    { label: '📊 Suivi', msg: 'suivi' },
  ],
  en: [
    { label: '🆘 Help', msg: 'help' },
    { label: '📂 Categories', msg: 'categories' },
    { label: '📊 Track', msg: 'track my complaints' },
  ],
  ar: [
    { label: '🆘 مساعدة', msg: 'مساعدة' },
    { label: '📂 الفئات', msg: 'الفئات' },
    { label: '📊 متابعة', msg: 'متابعة' },
  ],
  tn: [
    { label: '🆘 مساعدة', msg: 'مساعدة' },
    { label: '📂 الأنواع', msg: 'الأنواع' },
    { label: '📊 متابعة', msg: 'متابعة' },
  ],
};

const PLACEHOLDERS = {
  fr: 'Décrivez votre problème dans n\'importe quelle langue...',
  en: 'Describe your problem in any language...',
  ar: 'صف مشكلتك بأي لغة تريدها...',
  tn: 'قولي المشكلة متاعك بأي لغة تحبها...',
};

function isRTL(text) {
  const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  return arabicChars > text.length * 0.3;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`);
    const data = await res.json();
    if (data && data.display_name) {
      const addr = data.address || {};
      const neighbourhood = addr.suburb || addr.neighbourhood || addr.quarter || '';
      const city = addr.city || addr.town || addr.village || '';
      const state = addr.state || '';
      const road = addr.road || addr.pedestrian || '';
      // Build address: neighbourhood first, then city, then state. Road only if short and doesn't reference other cities
      const parts = [];
      if (neighbourhood) parts.push(neighbourhood);
      if (road && road.length < 40 && !road.toLowerCase().includes('nationale')) parts.push(road);
      if (city && city !== neighbourhood) parts.push(city);
      if (state && state !== city) parts.push(state);
      return parts.length > 0 ? parts.join(', ') : data.display_name;
    }
    return null;
  } catch {
    return null;
  }
}

function MiniMap({ coords }) {
  if (!coords) return null;
  return (
    <div className="rounded-lg overflow-hidden border border-white/20 mb-2" style={{ height: 140, width: '100%' }}>
      <MapContainer center={coords} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} dragging={false} zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={coords} />
      </MapContainer>
    </div>
  );
}

function FlyToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

function LocationPicker({ onSelect, onClose, lang }) {
  const [position, setPosition] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [address, setAddress] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);

  const doReverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    setAddress(null);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setGeocoding(false);
  };

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const p = [e.latlng.lat, e.latlng.lng];
        setPosition(p);
        doReverseGeocode(p[0], p[1]);
      },
    });
    return null;
  }

  const useMyGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setPosition(p);
        setFlyTarget(p);
        doReverseGeocode(p[0], p[1]);
        setGpsLoading(false);
      },
      (err) => {
        console.error('GPS error:', err);
        toast.error(lang === 'en' ? 'GPS access denied' : 'Accès GPS refusé');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const labels = {
    fr: { title: 'Choisir la localisation', gps: 'Ma position GPS', confirm: 'Confirmer', click: 'Cliquez sur la carte ou utilisez le GPS' },
    en: { title: 'Choose location', gps: 'My GPS location', confirm: 'Confirm', click: 'Click on the map or use GPS' },
    ar: { title: 'اختر الموقع', gps: 'موقعي GPS', confirm: 'تأكيد', click: 'انقر على الخريطة أو استخدم GPS' },
    tn: { title: 'اختار البلاصة', gps: 'بلاصتي GPS', confirm: 'أكّد', click: 'أنقر على الخريطة ولا استعمل GPS' },
  };
  const l = labels[lang] || labels.fr;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#1e3a5f] to-[#2a4a72]">
          <h3 className="text-white font-semibold flex items-center gap-2"><MapPin size={18} /> {l.title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>
        <div style={{ height: 350 }}>
          <MapContainer center={TUNIS_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler />
            <FlyToPosition position={flyTarget} />
            {position && <Marker position={position} />}
          </MapContainer>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500 text-center">{l.click}</p>
          {position && (
            <div className="text-center">
              <p className="text-xs text-green-600 font-medium">
                📍 {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </p>
              {geocoding && <p className="text-xs text-slate-400 mt-1 animate-pulse">🔍 ...</p>}
              {address && !geocoding && (
                <p className="text-xs text-slate-600 mt-1 font-medium bg-slate-50 px-2 py-1 rounded inline-block">
                  🏠 {address}
                </p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={useMyGPS}
              disabled={gpsLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
            >
              <MapPin size={14} /> {gpsLoading ? '...' : l.gps}
            </button>
            <button
              onClick={() => position && onSelect(position, address)}
              disabled={!position}
              className="flex-1 px-3 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a4a72] text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
            >
              {l.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CitizenChatbot() {
  const [lang, setLang] = useState('fr');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: WELCOME.fr },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = (h * maxWidth) / w;
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error(lang === 'en' ? 'Photo too large (max 20MB)' : 'Photo trop volumineuse (max 20Mo)');
      return;
    }
    setSelectedPhoto(file);
    const compressed = await compressImage(file);
    setPhotoPreview(compressed);
    toast.success(lang === 'en' ? 'Photo ready' : 'Photo prête');
  };

  const sendMessage = async (e, overrideMsg) => {
    if (e) e.preventDefault();
    const userMsg = (overrideMsg || input).trim();
    if (!userMsg || loading) return;

    setInput('');

    setMessages((prev) => [...prev, {
      role: 'user',
      text: userMsg,
      photoPreview: photoPreview || null,
      coords: selectedCoords || null,
      address: selectedAddress || null,
    }]);
    setLoading(true);

    try {
      const payload = { message: userMsg };
      if (selectedCoords) {
        payload.latitude = selectedCoords[0];
        payload.longitude = selectedCoords[1];
        if (selectedAddress) {
          payload.address = selectedAddress;
        }
      }
      if (photoPreview) {
        payload.photo_base64 = photoPreview;
      }

      const res = await api.post('/chatbot/message', payload);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: res.data.reply, plainte_id: res.data.plainte_id, plainte_created: res.data.plainte_created },
      ]);
      if (res.data.plainte_created) {
        toast.success(lang === 'ar' || lang === 'tn' ? 'تم تسجيل الشكوى بنجاح!' : lang === 'en' ? 'Complaint registered!' : 'Plainte enregistrée !');
      }
    } catch {
      const errMsgs = {
        fr: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        en: "Sorry, an error occurred. Please try again.",
        ar: "عذرا، حدث خطأ. يرجى المحاولة مرة أخرى.",
        tn: "سامحني، صار مشكل. عاود جرب.",
      };
      toast.error(lang === 'en' ? 'Communication error' : 'Erreur de communication');
      setMessages((prev) => [...prev, { role: 'bot', text: errMsgs[lang] }]);
    } finally {
      setLoading(false);
      setSelectedCoords(null);
      setSelectedAddress(null);
      setSelectedPhoto(null);
      setPhotoPreview(null);
    }
  };

  const switchLang = (newLang) => {
    setLang(newLang);
    setShowLangMenu(false);
    resetChat(newLang);
  };

  const resetChat = async (newLang) => {
    const l = newLang || lang;
    try {
      await api.post('/chatbot/reset');
      setMessages([{ role: 'bot', text: WELCOME[l] }]);
    } catch {
      setMessages([{ role: 'bot', text: WELCOME[l] }]);
    }
    setSelectedCoords(null);
    setSelectedAddress(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const quickActions = QUICK_ACTIONS[lang];

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        {showMap && (
          <LocationPicker
            lang={lang}
            onClose={() => setShowMap(false)}
            onSelect={(coords, addr) => {
              setSelectedCoords(coords);
              setSelectedAddress(addr);
              setShowMap(false);
              toast.success(addr || (lang === 'en' ? 'Location selected' : lang === 'ar' || lang === 'tn' ? 'تم اختيار الموقع' : 'Localisation sélectionnée'));
            }}
          />
        )}

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f] to-[#2a4a72] rounded-full flex items-center justify-center shadow-md">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-800">Chatbot Plainte360</h1>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {lang === 'en' ? 'Online' : lang === 'ar' || lang === 'tn' ? 'متصل' : 'En ligne'}
                <span className="mx-1 text-slate-300">|</span>
                <span className="text-slate-400">{LANG_FLAGS[lang]} {LANG_NAMES[lang]}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
              >
                <Globe size={16} />
                {LANG_FLAGS[lang]}
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden z-50 min-w-[140px]">
                  {Object.entries(LANG_NAMES).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => switchLang(code)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        lang === code ? 'bg-blue-50 text-[#1e3a5f] font-medium' : 'text-slate-600'
                      }`}
                    >
                      <span>{LANG_FLAGS[code]}</span>
                      <span>{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => resetChat()}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
              title={lang === 'en' ? 'New conversation' : 'Nouvelle conversation'}
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">{lang === 'en' ? 'New' : lang === 'ar' || lang === 'tn' ? 'جديد' : 'Nouveau'}</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white">
          {messages.map((msg, idx) => {
            const msgRtl = isRTL(msg.text);
            return (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2.5 max-w-[80%] sm:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-sm'
                        : 'bg-gradient-to-br from-[#1e3a5f] to-[#2a4a72] text-white shadow-sm'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div
                    dir={msgRtl ? 'rtl' : 'ltr'}
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#1e3a5f] to-[#2a4a72] text-white rounded-tr-sm shadow-md'
                        : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.photoPreview && (
                      <div className="mb-2">
                        <img src={msg.photoPreview} alt="Photo" className="rounded-lg max-h-40 w-auto" />
                      </div>
                    )}
                    {msg.coords && (
                      <div className="mb-2">
                        <MiniMap coords={msg.coords} />
                        <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
                          <MapPin size={12} />
                          <span>{msg.address || `${msg.coords[0].toFixed(4)}, ${msg.coords[1].toFixed(4)}`}</span>
                        </div>
                      </div>
                    )}
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
                        {line.split('**').map((part, j) =>
                          j % 2 === 1 ? <strong key={j} className={msg.role === 'user' ? 'text-orange-200' : 'text-[#1e3a5f]'}>{part}</strong> : part
                        )}
                      </p>
                    ))}
                    {msg.plainte_created && (
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                          ✅ {lang === 'en' ? 'Registered' : lang === 'ar' || lang === 'tn' ? 'تم التسجيل' : 'Enregistrée'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2a4a72] text-white flex items-center justify-center shadow-sm">
                  <Bot size={14} />
                </div>
                <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#1e3a5f] rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-[#1e3a5f] rounded-full animate-bounce opacity-60" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-[#1e3a5f] rounded-full animate-bounce opacity-60" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        {messages.length <= 2 && !loading && (
          <div className="bg-white border-t border-slate-100 px-4 py-3">
            <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
              {quickActions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(null, a.msg)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-600 hover:text-slate-800 transition-all hover:shadow-sm"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachments preview */}
        {(selectedCoords || photoPreview) && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2">
            <div className="flex items-center gap-3 max-w-4xl mx-auto flex-wrap">
              {selectedCoords && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  <MapPin size={12} /> {selectedAddress || `${selectedCoords[0].toFixed(4)}, ${selectedCoords[1].toFixed(4)}`}
                  <button onClick={() => { setSelectedCoords(null); setSelectedAddress(null); }} className="ml-1 hover:text-red-500"><X size={12} /></button>
                </span>
              )}
              {photoPreview && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <Image size={12} /> {selectedPhoto?.name}
                  <button onClick={() => { setSelectedPhoto(null); setPhotoPreview(null); }} className="ml-1 hover:text-red-500"><X size={12} /></button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="bg-white border-t border-slate-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
              title={lang === 'en' ? 'Attach photo' : 'Joindre une photo'}
            >
              <Camera size={20} />
            </button>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
              title={lang === 'en' ? 'Pick location' : 'Choisir la localisation'}
            >
              <MapPin size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDERS[lang]}
              dir={isRTL(input) ? 'rtl' : 'ltr'}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] outline-none text-sm transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-gradient-to-br from-[#1e3a5f] to-[#2a4a72] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-slate-400">
            <span>🇫🇷 Français</span>
            <span>•</span>
            <span>🇬🇧 English</span>
            <span>•</span>
            <span>🇹🇳 العربية</span>
            <span>•</span>
            <span>🇹🇳 تونسي</span>
          </div>
        </form>
      </div>
    </Layout>
  );
}
