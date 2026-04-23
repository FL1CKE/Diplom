import React, { useState, useRef, useEffect } from 'react';
import { Camera, BarChart3, Users, AlertCircle, Play, Pause, Download, MessageCircle, Send, Bot, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const EmotionRecognitionSystem = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [studentCount, setStudentCount] = useState(1);
  const [timelineData, setTimelineData] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Привет! Я AI-ассистент с расширенной базой знаний. Спрашивайте про ИИ в Казахстане, Python, космос, животных и многое другое!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [useCNN, setUseCNN] = useState(false);
  const [cnnStatus, setCnnStatus] = useState('disconnected');
  const [facesDetected, setFacesDetected] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const chatEndRef = useRef(null);
  const frameIntervalRef = useRef(null);

  const emotions = {
    engaged: { label: 'Вовлечен', color: '#10b981', icon: '😊' },
    confused: { label: 'Замешательство', color: '#f59e0b', icon: '😕' },
    bored: { label: 'Скука', color: '#ef4444', icon: '😑' },
    neutral: { label: 'Нейтрально', color: '#6b7280', icon: '😐' },
    tired: { label: 'Усталость', color: '#8b5cf6', icon: '😴' }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];

  useEffect(() => {
    if (isActive) {
      startCamera();
      startEmotionSimulation();
    } else {
      stopCamera();
      stopEmotionSimulation();
    }
    return () => {
      stopCamera();
      stopEmotionSimulation();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Ошибка доступа к камере:', err);
      alert('Не удалось получить доступ к камере. Проверьте разрешения.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startEmotionSimulation = () => {
    if (useCNN) {
      startCNNDetection();
    } else {
      startSimulatedDetection();
    }
  };

  const startCNNDetection = () => {
    // Отправка кадров на CNN backend каждые 2 секунды
    frameIntervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Конвертация в base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
          // Отправка на CNN backend
          const response = await fetch('http://localhost:5001/api/analyze-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.faces_detected > 0) {
              const emotion = data.current_emotion;
              const engagement = data.engagement;
              
              setCurrentEmotion(emotion);
              setFacesDetected(data.faces_detected);
              setStudentCount(data.faces_detected);
              
              // Обновление истории
              setEmotionHistory(prev => [...prev, emotion].slice(-100));
              
              // Обновление графика
              timeRef.current += 2;
              updateTimeline(emotion);
              
              setCnnStatus('connected');
            }
          } else {
            setCnnStatus('error');
          }
        } catch (error) {
          console.error('CNN Error:', error);
          setCnnStatus('error');
        }
      }
    }, 2000);
  };

  const startSimulatedDetection = () => {
    const emotionKeys = Object.keys(emotions);
    
    const simulate = () => {
      timeRef.current += 1;
      
      const randomEmotion = emotionKeys[Math.floor(Math.random() * emotionKeys.length)];
      setCurrentEmotion(randomEmotion);
      
      setEmotionHistory(prev => {
        const newHistory = [...prev, randomEmotion];
        return newHistory.slice(-100);
      });

      if (timeRef.current % 5 === 0) {
        setTimelineData(prev => {
          const emotionCounts = emotionKeys.reduce((acc, key) => {
            acc[key] = 0;
            return acc;
          }, {});

          emotionHistory.slice(-20).forEach(e => {
            emotionCounts[e]++;
          });

          const minutes = Math.floor(timeRef.current / 60);
          const seconds = (timeRef.current % 60).toString().padStart(2, '0');
          
          const newPoint = {
            time: `${minutes}:${seconds}`,
            engaged: emotionCounts.engaged || 0,
            confused: emotionCounts.confused || 0,
            bored: emotionCounts.bored || 0,
            neutral: emotionCounts.neutral || 0,
            tired: emotionCounts.tired || 0
          };

          return [...prev, newPoint].slice(-20);
        });
      }

      animationRef.current = setTimeout(simulate, 2000);
    };

    simulate();
  };

  const updateTimeline = (emotion) => {
    if (timeRef.current % 10 === 0) {
      setTimelineData(prev => {
        const emotionKeys = Object.keys(emotions);
        const emotionCounts = emotionKeys.reduce((acc, key) => {
          acc[key] = 0;
          return acc;
        }, {});

        emotionHistory.slice(-20).forEach(e => {
          emotionCounts[e]++;
        });

        const minutes = Math.floor(timeRef.current / 60);
        const seconds = (timeRef.current % 60).toString().padStart(2, '0');
        
        const newPoint = {
          time: `${minutes}:${seconds}`,
          engaged: emotionCounts.engaged || 0,
          confused: emotionCounts.confused || 0,
          bored: emotionCounts.bored || 0,
          neutral: emotionCounts.neutral || 0,
          tired: emotionCounts.tired || 0
        };

        return [...prev, newPoint].slice(-20);
      });
    }
  };

  const stopEmotionSimulation = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    timeRef.current = 0;
  };

  const toggleSystem = () => {
    setIsActive(!isActive);
    if (isActive) {
      setEmotionHistory([]);
      setTimelineData([]);
      setCurrentEmotion('neutral');
    }
  };

  const getEmotionStats = () => {
    if (emotionHistory.length === 0) return [];
    
    const counts = {};
    emotionHistory.forEach(emotion => {
      counts[emotion] = (counts[emotion] || 0) + 1;
    });

    return Object.keys(emotions).map(key => ({
      name: emotions[key].label,
      value: counts[key] || 0,
      percentage: ((counts[key] || 0) / emotionHistory.length * 100).toFixed(1)
    }));
  };

  const exportData = () => {
    const stats = getEmotionStats();
    const minutes = Math.floor(timeRef.current / 60);
    const seconds = timeRef.current % 60;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${minutes} мин ${seconds} сек`,
      totalRecords: emotionHistory.length,
      statistics: stats,
      timeline: timelineData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion-report-${Date.now()}.json`;
    a.click();
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Проверка подключения к Flask API при открытии чата
  useEffect(() => {
    if (showChat) {
      checkAPIConnection();
    }
  }, [showChat]);

  const checkAPIConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      setApiStatus('error');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // РЕАЛЬНЫЙ запрос к Flask API
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          session_id: 'web_user',
          emotion_data: {
            average_engagement: parseFloat(averageEngagement),
            current_emotion: emotions[currentEmotion].label,
            student_count: studentCount
          }
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка сервера');
      }

      const data = await response.json();

      const botMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: data.response
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Ошибка подключения:', error);
      
      const errorMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: '⚠️ Ошибка подключения к Flask серверу. Убедитесь что сервер запущен на порту 5000.\n\nЗапустите: python app.py'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const pieData = getEmotionStats();
  const averageEngagement = emotionHistory.length > 0 
    ? (emotionHistory.filter(e => e === 'engaged').length / emotionHistory.length * 100).toFixed(1)
    : 0;

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
            <button
              onClick={toggleSystem}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                isActive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isActive ? <Pause size={20} /> : <Play size={20} />}
              {isActive ? 'Остановить' : 'Запустить'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Студентов онлайн</span>
              <Users className="text-indigo-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{studentCount}</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Вовлеченность</span>
              <BarChart3 className="text-green-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{averageEngagement}%</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Текущая эмоция</span>
              <span className="text-3xl">{emotions[currentEmotion].icon}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: emotions[currentEmotion].color }}>
              {emotions[currentEmotion].label}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Camera size={24} className="text-indigo-600" />
              Видеопоток
            </h2>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                  <div className="text-center text-white">
                    <Camera size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Нажмите "Запустить" для начала анализа</p>
                  </div>
                </div>
              )}
              {isActive && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-70 px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">В ЭФИРЕ</span>
                  </div>
                </div>
              )}
              {isActive && (
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 px-4 py-3 rounded-lg">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-1">{emotions[currentEmotion].icon}</div>
                    <div className="text-sm font-semibold">{emotions[currentEmotion].label}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={24} className="text-indigo-600" />
              Распределение эмоций
            </h2>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Нет данных для отображения</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 size={24} className="text-indigo-600" />
              Динамика эмоций во времени
            </h2>
            {timelineData.length > 0 && (
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
              >
                <Download size={18} />
                Экспорт
              </button>
            )}
          </div>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="engaged" stroke="#10b981" strokeWidth={2} name="Вовлечен" />
                <Line type="monotone" dataKey="confused" stroke="#f59e0b" strokeWidth={2} name="Замешательство" />
                <Line type="monotone" dataKey="bored" stroke="#ef4444" strokeWidth={2} name="Скука" />
                <Line type="monotone" dataKey="neutral" stroke="#6b7280" strokeWidth={2} name="Нейтрально" />
                <Line type="monotone" dataKey="tired" stroke="#8b5cf6" strokeWidth={2} name="Усталость" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p>Начните анализ для сбора данных</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Демо-версия системы</p>
              <p>Это прототип использует симуляцию для демонстрации возможностей. В реальной версии будет использоваться CNN модель для распознавания эмоций по лицам студентов через веб-камеру.</p>
            </div>
          </div>
        </div>

        {/* Chat Assistant Button */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50"
        >
          <MessageCircle size={28} />
        </button>

        {/* Chat Window */}
        {showChat && (
          <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full">
                    <Bot className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">AI Ассистент</h3>
                    <p className="text-indigo-100 text-xs">
                      {apiStatus === 'connected' ? '🟢 Онлайн' : 
                       apiStatus === 'error' ? '🔴 Офлайн' : 
                       '🟡 Проверка...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' ? 'bg-indigo-600' : 'bg-purple-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="text-white" size={18} />
                      ) : (
                        <Bot className="text-white" size={18} />
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Bot className="text-white" size={18} />
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите ваш вопрос..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {apiStatus === 'connected' ? '✅ Подключен к Flask API' : 
                 apiStatus === 'error' ? '❌ Flask сервер не запущен' : 
                 '🔄 Подключение...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionRecognitionSystem;