/**
 * App.jsx — объединённая версия v3
 *
 * URL-маршрутизация:
 *   /?mode=teacher   → панель учителя (polling каждые 2 сек)
 *   /?student=daniyar → страница студента (шлёт кадры на сервер)
 *   /?mode=demo      → оригинальный одиночный режим с чатом
 *   /                → стартовая страница (выбор роли)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, BarChart3, Users, AlertCircle, Play, Pause,
  Download, MessageCircle, Send, Bot, User,
  Wifi, WifiOff, Activity, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const API = 'http://localhost:5000';

const EMOTIONS = {
  engaged:  { label: 'Вовлечён',       color: '#10b981', icon: '😊', bg: '#E1F5EE' },
  confused: { label: 'Замешательство', color: '#f59e0b', icon: '😕', bg: '#FAEEDA' },
  bored:    { label: 'Скука',          color: '#ef4444', icon: '😑', bg: '#FCEBEB' },
  neutral:  { label: 'Нейтрально',     color: '#6b7280', icon: '😐', bg: '#F1EFE8' },
  tired:    { label: 'Усталость',      color: '#8b5cf6', icon: '😴', bg: '#EEEDFE' },
};
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];

/* ════════════════════════════════════════════════════════════
   1. ОРИГИНАЛЬНЫЙ ИНТЕРФЕЙС (демо / одиночный режим)
   ════════════════════════════════════════════════════════════ */
const EmotionRecognitionSystem = () => {
  const [isActive,       setIsActive]       = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [timelineData,   setTimelineData]   = useState([]);
  const [showChat,       setShowChat]       = useState(false);
  const [messages,       setMessages]       = useState([
    { id: 1, sender: 'bot', text: 'Привет! Я AI-ассистент. Спрашивайте про ИИ в Казахстане, Python, космос и многое другое!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping,     setIsTyping]     = useState(false);
  const [apiStatus,    setApiStatus]    = useState('checking');
  const [useCNN,       setUseCNN]       = useState(false);
  const [cnnStatus,    setCnnStatus]    = useState('disconnected');

  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const animationRef     = useRef(null);
  const timeRef          = useRef(0);
  const chatEndRef       = useRef(null);
  const frameIntervalRef = useRef(null);

  useEffect(() => {
    if (isActive) { startCamera(); startEmotionSimulation(); }
    else          { stopCamera();  stopEmotionSimulation();  }
    return () => { stopCamera(); stopEmotionSimulation(); };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { console.error('Камера:', err); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startEmotionSimulation = () => useCNN ? startCNNDetection() : startSimulatedDetection();

  const startCNNDetection = () => {
    frameIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current, video = videoRef.current;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      try {
        const res = await fetch('http://localhost:5001/api/analyze-frame', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.faces_detected > 0) {
            setCurrentEmotion(data.current_emotion);
            setEmotionHistory(prev => [...prev, data.current_emotion].slice(-100));
            timeRef.current += 2; updateTimeline(data.current_emotion);
            setCnnStatus('connected');
          }
        } else { setCnnStatus('error'); }
      } catch { setCnnStatus('error'); }
    }, 2000);
  };

  const startSimulatedDetection = () => {
    const keys = Object.keys(EMOTIONS);
    const simulate = () => {
      timeRef.current += 1;
      const e = keys[Math.floor(Math.random() * keys.length)];
      setCurrentEmotion(e);
      setEmotionHistory(prev => [...prev, e].slice(-100));
      if (timeRef.current % 5 === 0) {
        setTimelineData(prev => {
          const counts = keys.reduce((a, k) => ({ ...a, [k]: 0 }), {});
          emotionHistory.slice(-20).forEach(x => { counts[x]++; });
          const m = Math.floor(timeRef.current / 60), s = (timeRef.current % 60).toString().padStart(2, '0');
          return [...prev, { time: `${m}:${s}`, ...counts }].slice(-20);
        });
      }
      animationRef.current = setTimeout(simulate, 2000);
    };
    simulate();
  };

  const updateTimeline = (emotion) => {
    if (timeRef.current % 10 !== 0) return;
    setTimelineData(prev => {
      const keys = Object.keys(EMOTIONS);
      const counts = keys.reduce((a, k) => ({ ...a, [k]: 0 }), {});
      emotionHistory.slice(-20).forEach(x => { counts[x]++; });
      const m = Math.floor(timeRef.current / 60), s = (timeRef.current % 60).toString().padStart(2, '0');
      return [...prev, { time: `${m}:${s}`, ...counts }].slice(-20);
    });
  };

  const stopEmotionSimulation = () => {
    clearTimeout(animationRef.current);
    clearInterval(frameIntervalRef.current);
    timeRef.current = 0;
  };

  const toggleSystem = () => {
    setIsActive(v => !v);
    if (isActive) { setEmotionHistory([]); setTimelineData([]); setCurrentEmotion('neutral'); }
  };

  const getEmotionStats = () => {
    if (!emotionHistory.length) return [];
    const counts = {};
    emotionHistory.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
    return Object.keys(EMOTIONS).map(key => ({
      name: EMOTIONS[key].label,
      value: counts[key] || 0,
      percentage: ((counts[key] || 0) / emotionHistory.length * 100).toFixed(1)
    }));
  };

  const exportData = () => {
    const stats = getEmotionStats();
    const m = Math.floor(timeRef.current / 60), s = timeRef.current % 60;
    const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), duration: `${m} мин ${s} сек`, totalRecords: emotionHistory.length, statistics: stats, timeline: timelineData }, null, 2)], { type: 'application/json' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `emotion-report-${Date.now()}.json` }).click();
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!showChat) return;
    fetch(`${API}/api/health`).then(r => setApiStatus(r.ok ? 'connected' : 'error')).catch(() => setApiStatus('error'));
  }, [showChat]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    const text = inputMessage;
    setMessages(prev => [...prev, { id: prev.length + 1, sender: 'user', text }]);
    setInputMessage(''); setIsTyping(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: 'web_user', emotion_data: { average_engagement: parseFloat(averageEngagement), current_emotion: EMOTIONS[currentEmotion].label, student_count: 1 } })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, { id: prev.length + 1, sender: 'bot', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { id: prev.length + 1, sender: 'bot', text: '⚠️ Сервер недоступен. Запустите: python app.py' }]);
    } finally { setIsTyping(false); }
  };

  const pieData = getEmotionStats();
  const averageEngagement = emotionHistory.length > 0
    ? (emotionHistory.filter(e => e === 'engaged').length / emotionHistory.length * 100).toFixed(1) : 0;
  const em = EMOTIONS[currentEmotion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Camera className="text-indigo-600" size={36} />
                Система распознавания эмоций
              </h1>
              <p className="text-gray-600 mt-2">Мониторинг эмоционального состояния студентов в реальном времени</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Симуляция</span>
                <button onClick={() => setUseCNN(v => !v)} className={`relative w-10 h-5 rounded-full transition-colors ${useCNN ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useCNN ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span>CNN</span>
                {useCNN && <span className={`text-xs px-2 py-0.5 rounded-full ${cnnStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cnnStatus}</span>}
              </div>
              <a href="/?mode=teacher" className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all">👨‍🏫 Панель учителя</a>
              <button onClick={toggleSystem} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                {isActive ? <><Pause size={20} /> Остановить</> : <><Play size={20} /> Запустить</>}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[
            { label: 'Студентов онлайн', value: 1, icon: <Users className="text-indigo-600" size={24} /> },
            { label: 'Вовлеченность',    value: `${averageEngagement}%`, icon: <BarChart3 className="text-green-600" size={24} /> },
            { label: 'Текущая эмоция',   value: em.label, icon: <span className="text-3xl">{em.icon}</span>, color: em.color },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-medium">{m.label}</span>{m.icon}
              </div>
              <div className="text-3xl font-bold" style={{ color: m.color || '#1f2937' }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Camera size={24} className="text-indigo-600" /> Видеопоток</h2>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                  <div className="text-center text-white"><Camera size={48} className="mx-auto mb-3 opacity-50" /><p>Нажмите «Запустить» для начала анализа</p></div>
                </div>
              )}
              {isActive && <>
                <div className="absolute top-4 left-4 bg-black bg-opacity-70 px-4 py-2 rounded-lg flex items-center gap-2 text-white">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /><span className="font-semibold">В ЭФИРЕ</span>
                </div>
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 px-4 py-3 rounded-lg text-white text-center">
                  <div className="text-4xl mb-1">{em.icon}</div><div className="text-sm font-semibold">{em.label}</div>
                </div>
              </>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={24} className="text-indigo-600" /> Распределение эмоций</h2>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name}: ${percentage}%`} outerRadius={80} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center"><AlertCircle size={48} className="mx-auto mb-3 opacity-50" /><p>Нет данных для отображения</p></div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={24} className="text-indigo-600" /> Динамика эмоций во времени</h2>
            {timelineData.length > 0 && (
              <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"><Download size={18} /> Экспорт</button>
            )}
          </div>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Legend />
                <Line type="monotone" dataKey="engaged"  stroke="#10b981" strokeWidth={2} name="Вовлечен" />
                <Line type="monotone" dataKey="confused" stroke="#f59e0b" strokeWidth={2} name="Замешательство" />
                <Line type="monotone" dataKey="bored"    stroke="#ef4444" strokeWidth={2} name="Скука" />
                <Line type="monotone" dataKey="neutral"  stroke="#6b7280" strokeWidth={2} name="Нейтрально" />
                <Line type="monotone" dataKey="tired"    stroke="#8b5cf6" strokeWidth={2} name="Усталость" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center"><AlertCircle size={48} className="mx-auto mb-3 opacity-50" /><p>Начните анализ для сбора данных</p></div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Демо-версия · одиночный режим</p>
              <p>Для мониторинга нескольких студентов — <a href="/?mode=teacher" className="underline font-medium">откройте панель учителя</a>, студенты открывают <code className="bg-blue-100 px-1 rounded">/?student=имя</code></p>
            </div>
          </div>
        </div>

        <button onClick={() => setShowChat(v => !v)} className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50">
          <MessageCircle size={28} />
        </button>

        {showChat && (
          <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full"><Bot className="text-indigo-600" size={24} /></div>
                  <div>
                    <h3 className="text-white font-bold">AI Ассистент</h3>
                    <p className="text-indigo-100 text-xs">{apiStatus === 'connected' ? '🟢 Онлайн' : apiStatus === 'error' ? '🔴 Офлайн' : '🟡 Проверка...'}</p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                      {msg.sender === 'user' ? <User className="text-white" size={18} /> : <Bot className="text-white" size={18} />}
                    </div>
                    <div className={`px-4 py-2 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>{msg.text}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center"><Bot className="text-white" size={18} /></div>
                    <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 flex gap-1 items-center">
                      {[0, 0.2, 0.4].map((d, i) => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Введите ваш вопрос..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={sendMessage} disabled={!inputMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-all">
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{apiStatus === 'connected' ? '✅ Подключен к Flask API' : apiStatus === 'error' ? '❌ Flask сервер не запущен' : '🔄 Подключение...'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   2. СТРАНИЦА СТУДЕНТА
   ════════════════════════════════════════════════════════════ */
const StudentView = () => {
  const params      = new URLSearchParams(window.location.search);
  const studentId   = params.get('student') || 'student_1';
  const displayName = params.get('name') || studentId;

  const [isActive,       setIsActive]       = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [engagement,     setEngagement]     = useState(0);
  const [connected,      setConnected]      = useState(false);
  const [totalFrames,    setTotalFrames]    = useState(0);
  const [history,        setHistory]        = useState([]);
  const [statusMsg,      setStatusMsg]      = useState('Нажмите «Начать» для запуска');

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const intervalRef = useRef(null);

  const joinSession = useCallback(async () => {
    try {
      await fetch(`${API}/api/student/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, display_name: displayName })
      });
      setConnected(true); setStatusMsg('Подключён к серверу');
    } catch { setConnected(false); setStatusMsg('Сервер недоступен — режим офлайн'); }
  }, [studentId, displayName]);

  const leaveSession = useCallback(() => {
    navigator.sendBeacon(`${API}/api/student/leave`, JSON.stringify({ student_id: studentId }));
  }, [studentId]);

  useEffect(() => {
    joinSession();
    window.addEventListener('beforeunload', leaveSession);
    return () => { leaveSession(); window.removeEventListener('beforeunload', leaveSession); };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setStatusMsg('Камера недоступна — используется симуляция'); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const sendFrame = useCallback(async () => {
    let imageData = null;
    if (videoRef.current?.srcObject && canvasRef.current) {
      const canvas = canvasRef.current, video = videoRef.current;
      canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
      canvas.getContext('2d').drawImage(video, 0, 0);
      imageData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    }
    try {
      const res = await fetch(`${API}/api/student/frame`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, image: imageData, simulated: !imageData })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentEmotion(data.emotion); setEngagement(data.engagement);
        setTotalFrames(f => f + 1); setConnected(true); setStatusMsg('Анализ идёт...');
        setHistory(prev => [...prev, { emotion: data.emotion, time: new Date().toLocaleTimeString('ru-RU') }].slice(-20));
      } else { setConnected(false); }
    } catch { setConnected(false); setStatusMsg('Нет связи с сервером'); }
  }, [studentId]);

  const toggle = async () => {
    if (isActive) {
      clearInterval(intervalRef.current); stopCamera();
      setIsActive(false); setStatusMsg('Сессия приостановлена');
    } else {
      await joinSession(); await startCamera(); setIsActive(true); setStatusMsg('Запуск...');
      sendFrame(); intervalRef.current = setInterval(sendFrame, 2000);
    }
  };
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const em = EMOTIONS[currentEmotion] ?? EMOTIONS.neutral;
  const stats = Object.keys(EMOTIONS).map(k => ({
    key: k, ...EMOTIONS[k],
    pct: history.length ? Math.round(history.filter(h => h.emotion === k).length / history.length * 100) : 0
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center"><User size={22} className="text-indigo-600" /></div>
            <div><div className="font-bold text-lg text-gray-800">{displayName}</div><div className="text-xs text-gray-400">ID: {studentId}</div></div>
          </div>
          <div className="flex items-center gap-4">
            {connected ? <span className="flex items-center gap-1 text-green-600 text-sm"><Wifi size={14} /> Онлайн</span> : <span className="flex items-center gap-1 text-red-500 text-sm"><WifiOff size={14} /> Офлайн</span>}
            <a href="/" className="text-xs text-indigo-500 hover:underline">← На главную</a>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Camera size={20} className="text-indigo-600" /> Видеопоток</h2>
            <button onClick={toggle} className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm text-white ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {isActive ? <><Pause size={15} /> Стоп</> : <><Play size={15} /> Начать</>}
            </button>
          </div>
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                <div className="text-center text-white"><Camera size={40} className="mx-auto mb-2 opacity-40" /><p className="text-sm">Нажмите «Начать»</p></div>
              </div>
            )}
            {isActive && <>
              <div className="absolute top-3 left-3 bg-black bg-opacity-70 px-3 py-1.5 rounded-lg flex items-center gap-2 text-white text-sm">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" /><span className="font-semibold">В ЭФИРЕ</span>
              </div>
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 px-3 py-2 rounded-xl text-white text-center">
                <div className="text-3xl">{em.icon}</div><div className="text-xs mt-1">{em.label}</div>
              </div>
            </>}
          </div>
          <p className="text-xs text-gray-400 mt-2 flex justify-between"><span>{statusMsg}</span><span>Кадров: {totalFrames}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-2xl shadow-md p-5 text-center">
            <p className="text-gray-500 text-sm mb-2">Текущая эмоция</p>
            <div className="text-5xl mb-2">{em.icon}</div>
            <div className="font-bold text-lg" style={{ color: em.color }}>{em.label}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5 text-center">
            <p className="text-gray-500 text-sm mb-2">Вовлечённость</p>
            <div className="text-5xl font-bold" style={{ color: engagement > 60 ? '#10b981' : engagement > 35 ? '#f59e0b' : '#ef4444' }}>{Math.round(engagement)}%</div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${engagement}%`, background: engagement > 60 ? '#10b981' : engagement > 35 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5">
            <h3 className="font-bold text-gray-800 mb-4">История за сессию</h3>
            {stats.filter(s => s.pct > 0).map(s => (
              <div key={s.key} className="flex items-center gap-3 mb-3">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm text-gray-600 w-36">{s.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <span className="text-sm text-gray-400 w-8 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   3. ПАНЕЛЬ УЧИТЕЛЯ
   ════════════════════════════════════════════════════════════ */
const TeacherView = () => {
  const [tab,         setTab]         = useState('live');
  const [students,    setStudents]    = useState([]);
  const [avgEng,      setAvgEng]      = useState(0);
  const [selectedSt,  setSelectedSt]  = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [serverOk,    setServerOk]    = useState(true);
  const [history,     setHistory]     = useState([]);
  const [filterSt,    setFilterSt]    = useState('');
  const alertLogRef = useRef([]);
  const [alerts, setAlerts] = useState([]);

  const poll = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/teacher/status`);
      const data = await res.json();
      setStudents(data.students ?? []); setAvgEng(data.avg_engagement ?? 0);
      setLastUpdated(new Date()); setServerOk(true);
      setSelectedSt(prev => prev ? (data.students.find(s => s.student_id === prev.student_id) ?? prev) : prev);
      (data.alerts ?? []).forEach(a => {
        const key = a.student_id + a.emotion;
        if (!alertLogRef.current.find(x => x.key === key && Date.now() - x.ts < 15000)) {
          alertLogRef.current.unshift({ ...a, key, ts: Date.now(), time: new Date().toLocaleTimeString('ru-RU') });
          if (alertLogRef.current.length > 30) alertLogRef.current.pop();
          setAlerts([...alertLogRef.current]);
        }
      });
    } catch { setServerOk(false); }
  }, []);

  useEffect(() => { poll(); const id = setInterval(poll, 2000); return () => clearInterval(id); }, [poll]);

  const loadHistory = useCallback(async () => {
    try {
      const url = filterSt ? `${API}/api/teacher/history?student_id=${encodeURIComponent(filterSt)}&limit=100` : `${API}/api/teacher/history?limit=100`;
      const res = await fetch(url); const data = await res.json();
      setHistory(data.records ?? []);
    } catch { setHistory([]); }
  }, [filterSt]);

  useEffect(() => { if (tab === 'db') loadHistory(); }, [tab, filterSt, loadHistory]);

  const exportData = async () => {
    const res = await fetch(`${API}/api/teacher/export`); const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `emotion-export-${Date.now()}.json` }).click();
  };

  const alertCount = students.filter(s => ['bored', 'tired'].includes(s.current_emotion) && s.total_records > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><Activity className="text-purple-600" size={28} /> Панель учителя</h1>
            <p className="text-gray-500 text-sm mt-1">{serverOk ? `Обновлено: ${lastUpdated?.toLocaleTimeString('ru-RU') ?? '—'} · polling каждые 2 сек` : '⚠️ Сервер недоступен'}</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-indigo-500 hover:underline">← Главная</a>
            <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"><Download size={14} /> Экспорт</button>
            <button onClick={poll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium"><RefreshCw size={14} /> Обновить</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Студентов онлайн',  value: students.length, icon: <Users size={22} className="text-purple-600" /> },
            { label: 'Ср. вовлечённость', value: `${avgEng}%`,    icon: <BarChart3 size={22} className="text-green-600" /> },
            { label: 'Требуют внимания',  value: alertCount,      icon: <AlertCircle size={22} className="text-red-500" />, danger: alertCount > 0 },
          ].map(m => (
            <div key={m.label} className={`bg-white rounded-xl shadow-md p-5 ${m.danger ? 'border border-red-200' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="text-gray-500 text-sm">{m.label}</span>{m.icon}</div>
              <div className={`text-3xl font-bold ${m.danger ? 'text-red-500' : 'text-gray-800'}`}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-5 bg-white rounded-xl shadow-md p-1 w-fit">
          {[['live', 'Реальное время'], ['db', 'База данных']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
          ))}
        </div>

        {tab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              {students.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-12 text-center text-gray-400">
                  <Users size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Нет активных студентов</p>
                  <p className="text-sm mt-1">Студент открывает: <code className="bg-gray-100 px-2 py-0.5 rounded">/?student=имя</code></p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {students.map(s => {
                    const e = EMOTIONS[s.current_emotion] ?? EMOTIONS.neutral;
                    const isAlert = ['bored', 'tired'].includes(s.current_emotion) && s.total_records > 0;
                    const secAgo = Math.round((Date.now() - new Date(s.last_seen)) / 1000);
                    return (
                      <div key={s.student_id} onClick={() => setSelectedSt(s)}
                        className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${selectedSt?.student_id === s.student_id ? 'ring-2 ring-purple-500' : ''} ${isAlert ? 'border border-red-300' : 'border border-transparent'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-gray-800 truncate">{s.display_name}</span>
                          <div className={`w-2 h-2 rounded-full ${secAgo < 10 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        </div>
                        <div className="text-center py-2">
                          <div className="text-3xl">{e.icon}</div>
                          <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: e.bg, color: e.color }}>{e.label}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Вовлечённость</span><span>{s.avg_engagement}%</span></div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.avg_engagement}%`, background: s.avg_engagement > 60 ? '#10b981' : '#f59e0b' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {alerts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-md p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">Последние события</h3>
                    <button onClick={() => { alertLogRef.current = []; setAlerts([]); }} className="text-xs text-gray-400 hover:text-gray-600">Очистить</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {alerts.slice(0, 12).map((a, i) => {
                      const e = EMOTIONS[a.emotion] ?? EMOTIONS.neutral;
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400 text-xs w-14">{a.time}</span>
                          <strong className="text-gray-700">{a.display_name}</strong>
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: e.bg, color: e.color }}>{e.icon} {e.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 self-start sticky top-4">
              <h3 className="font-bold text-gray-800 mb-4">Детали студента</h3>
              {!selectedSt ? (
                <p className="text-gray-400 text-sm text-center py-8">Выберите студента из списка</p>
              ) : (() => {
                const e = EMOTIONS[selectedSt.current_emotion] ?? EMOTIONS.neutral;
                const total = selectedSt.total_records || 1;
                const counts = selectedSt.emotion_counts || {};
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-4xl">{e.icon}</div>
                      <div><div className="font-bold text-gray-800">{selectedSt.display_name}</div><div className="text-sm" style={{ color: e.color }}>{e.label}</div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-400">Вовлечённость</div><div className="font-bold text-lg">{selectedSt.avg_engagement}%</div></div>
                      <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-400">Кадров</div><div className="font-bold text-lg">{selectedSt.total_records}</div></div>
                    </div>
                    {Object.keys(EMOTIONS).map(k => {
                      const cnt = counts[k] || 0;
                      const pct = Math.round(cnt / total * 100);
                      const em2 = EMOTIONS[k];
                      return (
                        <div key={k} className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{em2.icon}</span>
                          <span className="text-xs text-gray-500 w-28">{em2.label}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: em2.color }} />
                          </div>
                          <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {tab === 'db' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <select value={filterSt} onChange={e => setFilterSt(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Все студенты</option>
                {students.map(s => <option key={s.student_id} value={s.student_id}>{s.display_name}</option>)}
              </select>
              <button onClick={loadHistory} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"><RefreshCw size={12} /> Обновить</button>
              <span className="text-sm text-gray-400">{history.length} записей</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>{['Студент', 'Эмоция', 'Вовлечённость', 'Время', 'Дата'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет данных</td></tr>
                  ) : history.map((r, i) => {
                    const e = EMOTIONS[r.emotion] ?? EMOTIONS.neutral;
                    return (
                      <tr key={i} className={['bored', 'tired'].includes(r.emotion) ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{r.student_id}</td>
                        <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: e.bg, color: e.color }}>{e.icon} {e.label}</span></td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${r.engagement}%`, background: r.engagement > 60 ? '#10b981' : '#f59e0b' }} /></div>
                            <span className="text-gray-500">{r.engagement}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400">{new Date(r.timestamp).toLocaleTimeString('ru-RU')}</td>
                        <td className="px-4 py-2.5 text-gray-400">{r.session_date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   4. СТАРТОВАЯ СТРАНИЦА
   ════════════════════════════════════════════════════════════ */
const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
    <div className="text-center max-w-lg w-full">
      <div className="text-6xl mb-4">🎓</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Система мониторинга эмоций</h1>
      <p className="text-gray-500 mb-10">Выберите роль для входа</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <a href="/?mode=teacher" className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-400 block">
          <div className="text-5xl mb-3">👨‍🏫</div><div className="font-bold text-gray-800 mb-1">Я учитель</div>
          <div className="text-sm text-gray-400">Панель наблюдения в реальном времени</div>
        </a>
        <a href="/?mode=demo" className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition-all border-2 border-transparent hover:border-indigo-400 block">
          <div className="text-5xl mb-3">🖥️</div><div className="font-bold text-gray-800 mb-1">Демо-режим</div>
          <div className="text-sm text-gray-400">Одиночный режим с графиками и чатом</div>
        </a>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="text-sm font-medium text-gray-600 mb-3">Войти как студент</div>
        <div className="flex gap-2">
          <input id="sid" placeholder="Введите имя (daniyar, aliya...)"
            onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/?student=${e.target.value.trim() || 'student1'}`; }}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <button onClick={() => { window.location.href = `/?student=${document.getElementById('sid').value.trim() || 'student1'}`; }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all">Войти</button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Прямая ссылка: <code className="bg-gray-100 px-1.5 py-0.5 rounded">/?student=daniyar</code></p>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   5. КОРНЕВОЙ РОУТЕР
   ════════════════════════════════════════════════════════════ */
export default function App() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('mode') === 'teacher') return <TeacherView />;
  if (p.get('student'))            return <StudentView />;
  if (p.get('mode') === 'demo')    return <EmotionRecognitionSystem />;
  return <HomePage />;
}