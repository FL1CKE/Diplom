import React, { useState, useRef, useEffect } from 'react';
import { Camera, BarChart3, Users, AlertCircle, Play, Pause, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const EmotionRecognitionSystem = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [studentCount, setStudentCount] = useState(1);
  const [timelineData, setTimelineData] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

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

  const stopEmotionSimulation = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
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
      </div>
    </div>
  );
};

export default EmotionRecognitionSystem;