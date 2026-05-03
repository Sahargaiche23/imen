import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { Send, Bot, User, RotateCcw, Globe, Zap, HelpCircle, ListChecks, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function CitizenChatbot() {
  const [lang, setLang] = useState('fr');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: WELCOME.fr },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e, overrideMsg) => {
    if (e) e.preventDefault();
    const userMsg = (overrideMsg || input).trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', { message: userMsg });
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
  };

  const quickActions = QUICK_ACTIONS[lang];

  return (
    <Layout>
      <div className="flex flex-col h-screen">
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
            {/* Language selector */}
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

        {/* Input */}
        <form onSubmit={sendMessage} className="bg-white border-t border-slate-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
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
