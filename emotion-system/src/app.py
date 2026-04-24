"""
Emotion Recognition System - Flask Backend
AI Assistant with Extended Knowledge Base

Интегрирована расширенная база знаний из AL ChatBot
Версия: 2.0.0
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import random
import re

# Инициализация Flask
app = Flask(__name__)
CORS(app)

# Хранилище истории чата
chat_history = {}


# ==========================================
# РАСШИРЕННАЯ БАЗА ЗНАНИЙ (из AL ChatBot)
# ==========================================

def init_knowledge_base():
    """
    Полная база знаний, объединяющая:
    - Образовательную систему распознавания эмоций
    - Общие знания из AL ChatBot
    """
    
    knowledge = {
        # === ИИ и Технологии ===
        "ai_kazakhstan": """🤖 **ИИ в Казахстане**

В Казахстане разработка искусственного интеллекта активно развивается, но находится на стадии формирования сильной экосистемы.

**1) Образование и кадры**
• В университетах (Назарбаев Университет, Satbayev University) появляются программы по Data Science, ML, AI
• Проводятся курсы и буткемпы по Python, нейросетям через хабы (Astana Hub, Atyrau Hub)
• Формируется сообщество разработчиков: митапы, хакатоны, AI-чаты

**2) Государственные инициативы**
• Стратегии цифровизации (eGov, Smart City, автоматизация госуслуг)
• ИИ в аналитике больших данных, распознавании документов

**3) Бизнес и стартапы**
• Применение AI в финтехе, EdTech, медицине, безопасности
• Astana Hub помогает проектам: менторство, нетворкинг, льготы

**4) Ограничения**
• Нехватка опытных специалистов по глубокому обучению
• Меньше собственных больших датасетов
• Многие продукты опираются на зарубежные модели

**Итог:** ИИ в Казахстане растёт — появляются курсы, сообщества, стартапы, но впереди много работы по развитию собственных команд и исследований.""",

        "python": """🐍 **Python** — высокоуровневый язык программирования, созданный Гвидо ван Россумом в 1991 году.

**Преимущества:**
• Простой и читаемый синтаксис
• Огромная экосистема библиотек
• Кросс-платформенность

**Где применяется:**
• **Веб-разработка:** Django, Flask, FastAPI
• **Data Science:** NumPy, pandas, Matplotlib
• **Machine Learning:** TensorFlow, PyTorch, scikit-learn
• **Автоматизация:** скрипты, DevOps
• **Боты, игры:** Telegram API, Pygame

Python часто выбирают как первый язык, но его используют и крупные компании (Google, YouTube, Instagram).""",

        "ai": """🤖 **Искусственный интеллект (AI)** — направление информатики, создающее системы, которые выполняют задачи, требующие человеческого интеллекта.

**Основные области:**
• Машинное обучение (Machine Learning)
• Глубокое обучение (нейронные сети)
• Обработка естественного языка (NLP)
• Компьютерное зрение
• Рекомендательные системы

**Примеры использования:**
• Голосовые помощники (Siri, Alexa)
• Рекомендации (YouTube, Netflix)
• Фильтрация спама
• Автопилот в автомобилях
• Медицинская диагностика
• Система распознавания эмоций студентов 😊""",

        "apple": {
            "fruit": """🍎 **Яблоко** — сочный плод яблони. Богат витаминами (C, группы B), клетчаткой и антиоксидантами.

**Польза:**
• Поддержка здоровья сердца
• Улучшение пищеварения
• Снижение риска хронических заболеваний

**Сорта:** Фуджи, Гала, Грэнни Смит, Семеренко

**Применение:** Свежими, в выпечке, соки, варенье, пюре""",
            
            "company": """🍏 **Apple Inc.** — американская технологическая компания, основанная в 1976 году (Стив Джобс, Стив Возняк, Рональд Уэйн).

**Продукты:**
• Компьютеры: MacBook, iMac
• Смартфоны: iPhone
• Планшеты: iPad
• Носимые: Apple Watch, AirPods

**Экосистема:**
• Операционные системы: macOS, iOS, iPadOS, watchOS
• Сервисы: App Store, iCloud, Apple Music, Apple TV+

**Преимущества:**
• Глубокая интеграция устройств
• Дизайн и UX
• Безопасность и конфиденциальность"""
        },

        # === Хабы Казахстана ===
        "atyrau_hub": """🚀 **Atyrau Hub** — технологическое и образовательное пространство в Атырау, объединяющее студентов, разработчиков и предпринимателей.

**Чем занимается:**
• Курсы по программированию, дизайну, стартапам
• Хакатоны, митапы, воркшопы
• Командная работа над проектами
• Менторство и карьерные советы

**Для кого:** Новички в IT, студенты, начинающие разработчики

Atyrau Hub — место для прокачки IT-навыков и запуска проектов в Атырау.""",

        "astana_hub": """🏙 **Astana Hub** — крупнейший международный технопарк IT-стартапов в Казахстане (Астана).

**Возможности:**
• Акселерация и инкубация стартапов
• Лекции от местных и зарубежных экспертов
• Комьюнити: разработчики, инвесторы, менторы
• Льготные условия для IT-бизнеса
• Консультации по развитию продукта

**Цель:** Развивать IT-экосистему Казахстана, создавать конкурентоспособные стартапы для глобального рынка.""",

        # === Природа и Космос ===
        "sun": """☀️ **Солнце** — звезда в центре Солнечной системы.

**Характеристики:**
• Диаметр: ~1,4 млн км
• Масса: 99,8% массы Солнечной системы
• Температура поверхности: ~5500°C
• Температура ядра: десятки миллионов °C

**Процессы:**
• Термоядерные реакции (водород → гелий)
• Выделение энергии (свет и тепло для Земли)

**Структура:** ядро, зона излучения, зона конвекции, фотосфера, хромосфера, корона

**Явления:** солнечные пятна, вспышки, корональные выбросы (влияют на магнитное поле Земли).""",

        "moon": """🌙 **Луна** — единственный естественный спутник Земли.

**Параметры:**
• Расстояние до Земли: ~384 400 км
• Влияние: приливы и отливы в океанах
• Приливной захват: всегда повёрнута одной стороной

**Фазы:** новолуние, первая четверть, полнолуние, последняя четверть

**История:** Первая высадка человека — Apollo 11 (1969)

**Значение:** Изучение Луны, будущие пилотируемые миссии.""",

        "space": """🚀 **Космос** — всё пространство за пределами атмосферы Земли.

**Содержит:**
• Планеты, звёзды, галактики
• Туманности, чёрные дыры
• Тёмная материя и тёмная энергия

**Вселенная:**
• Возраст: ~13,8 млрд лет
• Начало: Большой взрыв
• Млечный Путь: наша галактика (сотни миллиардов звёзд)

**Исследования:**
• Телескопы, спутники, космические зонды
• Человек на Луне
• Марсоходы, миссии к астероидам""",

        "water": """💧 **Вода (H₂O)** — основа жизни на Земле.

**Покрытие планеты:** ~71% (океаны, моря, реки, озёра, ледники)

**Уникальные свойства:**
• Высокая теплоёмкость
• Максимальная плотность при ~4°C
• Лёд плавает (защищает водную среду)

**Роль:**
• Универсальный растворитель
• Участие в химических реакциях
• Транспорт веществ в организме
• Формирование погоды и климата

Без воды невозможна известная нам жизнь.""",

        # === Животные ===
        "cat": """🐱 **Кошки** — домашние животные семейства кошачьих, одомашнены ~10 000 лет назад.

**Особенности:**
• Независимость и ловкость
• Развитый охотничий инстинкт
• Отличное ночное зрение
• Чувствительный слух

**Общение:**
• Звуки: мяуканье, урчание, шипение
• Мимика и положение хвоста

**Роль:** Борьба с грызунами, компаньоны, снятие стресса.""",

        "dog": """🐕 **Собаки** — домашние животные, происходящие от волков, одомашнены тысячи лет назад.

**Разнообразие:** 300+ пород (декоративные, служебные, пастушьи, поводыри)

**Способности:**
• Развитое обоняние
• Обучаемость (сотни команд)
• Поисково-спасательные операции
• Полицейские и таможенные собаки
• Терапия и помощь людям с инвалидностью

**Роль:** Верные спутники человека, охрана, работа.""",

        # === Напитки ===
        "coffee": """☕ **Кофе** — напиток из обжаренных зёрен кофейного дерева.

**Эффект:** Кофеин стимулирует ЦНС, повышает бодрость и концентрацию

**Способы приготовления:**
• Эспрессо, американо, капучино
• Латте, фильтр-кофе, турка

**Факторы вкуса:**
• Сорт: арабика, робуста
• Степень обжарки
• Помол

**Польза:** Антиоксиданты, может снижать риск некоторых заболеваний (при умеренном употреблении)

**Предупреждение:** Избыток кофеина → бессонница, тревога, нагрузка на сердце.""",

        # === Здоровье и спорт ===
        "fitness": """🏋️‍♂️ **Как накачаться / набрать форму:**

⚠️ Важно: Быстро накачаться за 2 недели невозможно без вреда для здоровья. Мышцы растут постепенно.

**Что работает:**

**1) Регулярные тренировки**
• 3-4 силовые тренировки в неделю
• Базовые упражнения: приседания, жим лёжа, тяга, отжимания, подтягивания
• Прогрессивная перегрузка: постепенно увеличивать вес

**2) Питание**
• Профицит калорий (есть немного больше)
• Белок: 1.6-2 г на кг массы тела

**3) Сон и восстановление**
• 7-9 часов сна
• Отдых между тренировками

**4) Терпение и безопасность**
• Правильная техника важнее больших весов
• Никаких опасных препаратов

**Итог:** Заметные результаты за 4-6 месяцев стабильных тренировок и питания."""
    }
    
    # Синонимы для поиска
    aliases = {
        # ИИ в КЗ
        "ии в казахстане": "ai_kazakhstan",
        "ai в рк": "ai_kazakhstan",
        "искусственный интеллект в казахстане": "ai_kazakhstan",
        "развитие ии": "ai_kazakhstan",
        "текущее состояние ии": "ai_kazakhstan",
        "каково нынешнее положение разработки искусственного интеллекта в казахстане": "ai_kazakhstan",
        "состояние ai в казахстане": "ai_kazakhstan",
        
        # Технологии
        "питон": "python",
        "пайтон": "python",
        "ии": "ai",
        "искусственный интеллект": "ai",
        "что такое ии": "ai",
        
        # Apple
        "эпл": "apple",
        "яблоко": "apple",
        "айфон": "apple",
        "iphone": "apple",
        
        # Хабы
        "атырау хаб": "atyrau_hub",
        "атырау hub": "atyrau_hub",
        "астана хаб": "astana_hub",
        "астана hub": "astana_hub",
        "технопарк": "astana_hub",
        
        # Природа
        "солнце": "sun",
        "солнышко": "sun",
        "луна": "moon",
        "космос": "space",
        "вселенная": "space",
        "звезды": "space",
        "вода": "water",
        
        # Животные
        "кот": "cat",
        "кошка": "cat",
        "собака": "dog",
        "пес": "dog",
        
        # Напитки
        "кофе": "coffee",
        
        # Спорт
        "как накачаться": "fitness",
        "как быстро накачаться": "fitness",
        "мышцы": "fitness",
        "качалка": "fitness",
        "набрать массу": "fitness"
    }
    
    return knowledge, aliases


# Инициализируем базу знаний
KNOWLEDGE, ALIASES = init_knowledge_base()


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Главный эндпоинт для чата с расширенной базой знаний
    """
    try:
        data = request.json
        user_message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        emotion_data = data.get('emotion_data', {})
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Инициализация истории
        if session_id not in chat_history:
            chat_history[session_id] = []
        
        # Добавляем сообщение пользователя
        chat_history[session_id].append({
            'role': 'user',
            'content': user_message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Генерация ответа
        bot_response = generate_smart_response(user_message, emotion_data, chat_history[session_id])
        
        # Добавляем ответ в историю
        chat_history[session_id].append({
            'role': 'assistant',
            'content': bot_response,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({
            'response': bot_response,
            'session_id': session_id,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_smart_response(message, emotion_data, history):
    """
    Умная генерация ответов с интеграцией AL ChatBot базы знаний
    """
    message_lower = message.lower().strip()
    
    avg_engagement = float(emotion_data.get('average_engagement', 0))
    current_emotion = emotion_data.get('current_emotion', 'нейтрально')
    student_count = emotion_data.get('student_count', 0)
    
    # ========================================
    # 1. ПРИВЕТСТВИЯ
    # ========================================
    greetings = ['привет', 'здравствуй', 'hello', 'hi', 'добрый', 'хай', 'ку']
    if any(word in message_lower for word in greetings):
        return random.choice([
            "Привет! 👋 Я AI-ассистент с расширенной базой знаний. Могу рассказать про ИИ в Казахстане, Python, космос, животных и многое другое!",
            "Здравствуйте! 😊 Готов помочь с вопросами об эмоциях студентов, технологиях и общих знаниях.",
            "Приветствую! 🎓 Спрашивайте о чем угодно: от распознавания эмоций до устройства космоса!"
        ])
    
    # ========================================
    # 2. БЛАГОДАРНОСТИ
    # ========================================
    thanks = ['спасибо', 'благодар', 'thanks', 'thx']
    if any(word in message_lower for word in thanks):
        return random.choice([
            "Пожалуйста! Рад был помочь! 😊",
            "Всегда к вашим услугам! 🤝",
            "Не за что! Обращайтесь! 👍"
        ])
    
    # ========================================
    # 3. ПОИСК В РАСШИРЕННОЙ БАЗЕ ЗНАНИЙ
    # ========================================
    
    # Проверка алиасов
    for alias, key in ALIASES.items():
        if alias in message_lower:
            if key in KNOWLEDGE:
                data = KNOWLEDGE[key]
                
                # Если это словарь (например, apple)
                if isinstance(data, dict):
                    if "фрукт" in message_lower or "еда" in message_lower:
                        return data["fruit"]
                    if "компания" in message_lower or "iphone" in message_lower:
                        return data["company"]
                    # По умолчанию - оба варианта
                    return f"{data['fruit']}\n\n---\n\n{data['company']}"
                
                # Обычный текстовый ответ
                return data
    
    # ========================================
    # 4. ВОПРОСЫ О СИСТЕМЕ РАСПОЗНАВАНИЯ ЭМОЦИЙ
    # ========================================
    
    if any(word in message_lower for word in ['вовлеченность', 'engagement', 'интерес']):
        if avg_engagement > 70:
            return f"🌟 Отличная вовлеченность! Показатель {avg_engagement}% говорит о том, что студенты активно участвуют в процессе обучения. Продолжайте в том же духе!"
        elif avg_engagement > 40:
            return f"📊 Вовлеченность {avg_engagement}% — нормальный показатель. Можно улучшить, добавив больше интерактивных элементов."
        else:
            return f"⚠️ Вовлеченность {avg_engagement}% требует внимания. Рекомендую сделать перерыв или изменить формат подачи материала."
    
    if any(word in message_lower for word in ['эмоция', 'настроение', 'состояние']):
        return f"😊 Текущее эмоциональное состояние студентов: {current_emotion}. Система анализирует мимику в режиме реального времени."
    
    if any(word in message_lower for word in ['студент', 'класс', 'аудитория']):
        return f"👥 Сейчас {student_count} студент(ов) онлайн. Система отслеживает эмоциональное состояние каждого."
    
    # ========================================
    # 5. ОБЩИЕ ТЕМЫ (прямой поиск по ключам)
    # ========================================
    
    # Python
    if "python" in message_lower or "питон" in message_lower:
        return KNOWLEDGE["python"]
    
    # AI
    if message_lower in ["ai", "ии", "искусственный интеллект"]:
        return KNOWLEDGE["ai"]
    
    # ИИ в Казахстане (расширенные триггеры)
    if ("казахстан" in message_lower or "рк" in message_lower or "kazakhstan" in message_lower) and \
       ("ии" in message_lower or "ai" in message_lower or "искусственн" in message_lower):
        return KNOWLEDGE["ai_kazakhstan"]
    
    # Космос
    if any(word in message_lower for word in ['космос', 'вселенная', 'space']):
        return KNOWLEDGE["space"]
    
    # ========================================
    # 6. МАТЕМАТИКА (простая)
    # ========================================
    
    # Проверка на простые математические выражения
    if re.match(r'^[\d\+\-\*\/\.\(\)\s]+$', message_lower):
        try:
            result = eval(message_lower, {"__builtins__": {}}, {})
            return f"🔢 Результат: {result}"
        except:
            pass
    
    # ========================================
    # 7. ВОПРОСЫ - ПРЕДЛОЖЕНИЕ ПОМОЩИ
    # ========================================
    
    questions = ["как", "что", "почему", "зачем", "когда", "где", "кто", "какой", "можно"]
    if any(q in message_lower for q in questions) or "?" in message_lower:
        topics = ["Python", "ИИ в Казахстане", "космос", "Astana Hub", "здоровье", "животные"]
        return f"""🤔 Интересный вопрос! Я могу рассказать про:

• **Образование:** Система распознавания эмоций, вовлеченность студентов
• **Технологии:** Python, AI, хабы Казахстана
• **Наука:** Космос, планеты, физика
• **Жизнь:** Животные, здоровье, фитнес

Попробуйте спросить: "Расскажи про ИИ в Казахстане" или "Что такое Python?" """
    
    # ========================================
    # 8. ОТВЕТ ПО УМОЛЧАНИЮ
    # ========================================
    
    return random.choice([
        f"🤔 Интересный запрос про '{message}'! Я могу помочь с:\n\n"
        "• Анализом эмоций и вовлеченности студентов\n"
        "• Информацией про Python, AI, технологии\n"
        "• Рассказами про космос, природу, животных\n"
        "• Советами по здоровью и фитнесу\n\n"
        "Попробуйте переформулировать вопрос!",
        
        "Я пока не знаю ответа на этот вопрос. Но могу рассказать про:\n"
        "• ИИ в Казахстане 🇰🇿\n"
        "• Python и программирование 💻\n"
        "• Космос и планеты 🚀\n"
        "• Систему распознавания эмоций 😊",
        
        f"По вопросу '{message}' у меня пока нет готового ответа. "
        "Спросите про технологии, науку или систему эмоций!"
    ])


@app.route('/api/emotion-analysis', methods=['POST'])
def analyze_emotions():
    """Детальный анализ эмоций"""
    try:
        data = request.json
        emotion_history = data.get('emotion_history', [])
        
        if not emotion_history:
            return jsonify({'error': 'Emotion history is required'}), 400
        
        total = len(emotion_history)
        emotion_counts = {}
        
        for emotion in emotion_history:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        emotion_percentages = {
            emotion: round((count / total) * 100, 2)
            for emotion, count in emotion_counts.items()
        }
        
        recommendations = generate_recommendations(emotion_percentages)
        
        return jsonify({
            'total_records': total,
            'emotion_counts': emotion_counts,
            'emotion_percentages': emotion_percentages,
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_recommendations(emotion_percentages):
    """Генерация рекомендаций"""
    recommendations = []
    
    confused = emotion_percentages.get('confused', 0)
    bored = emotion_percentages.get('bored', 0)
    engaged = emotion_percentages.get('engaged', 0)
    tired = emotion_percentages.get('tired', 0)
    
    if confused > 30:
        recommendations.append({
            'type': 'warning',
            'message': f'⚠️ Высокий уровень замешательства ({confused}%). Упростите материал или добавьте примеры.'
        })
    
    if bored > 25:
        recommendations.append({
            'type': 'warning',
            'message': f'😴 Признаки скуки ({bored}%). Добавьте интерактив или смените формат.'
        })
    
    if tired > 20:
        recommendations.append({
            'type': 'info',
            'message': f'💤 Усталость ({tired}%). Рекомендуется перерыв.'
        })
    
    if engaged > 60:
        recommendations.append({
            'type': 'success',
            'message': f'🌟 Отличная вовлеченность ({engaged}%)!'
        })
    elif engaged < 30:
        recommendations.append({
            'type': 'warning',
            'message': f'📉 Низкая вовлеченность ({engaged}%). Измените темп.'
        })
    
    if not recommendations:
        recommendations.append({
            'type': 'info',
            'message': '✅ Эмоциональное состояние в норме.'
        })
    
    return recommendations


@app.route('/api/health', methods=['GET'])
def health_check():
    """Проверка работоспособности"""
    return jsonify({
        'status': 'healthy',
        'ai_method': 'Smart Logic + Extended Knowledge Base',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0',
        'knowledge_topics': len(KNOWLEDGE),
        'aliases': len(ALIASES)
    })


@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    """Очистка истории"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        
        if session_id in chat_history:
            chat_history[session_id] = []
        
        return jsonify({
            'message': 'History cleared',
            'session_id': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/', methods=['GET'])
def index():
    """Корневой эндпоинт"""
    return jsonify({
        'name': 'Emotion Recognition System API',
        'version': '2.0.0',
        'ai_method': 'Smart Logic + Extended Knowledge Base',
        'features': [
            'Emotion analysis',
            'Student engagement monitoring',
            'Extended knowledge base (Python, AI, Space, Animals, etc.)',
            'Kazakh IT ecosystem info (Astana Hub, Atyrau Hub)',
            'AI in Kazakhstan overview',
            'Math calculations',
            'Context-aware responses'
        ],
        'knowledge_topics': list(KNOWLEDGE.keys())
    })

# Хранилище студентов (в памяти)
students_db = {}

@app.route('/api/student/join', methods=['POST'])
def student_join():
    data = request.json
    student_id = data.get('student_id')
    display_name = data.get('display_name', student_id)
    students_db[student_id] = {
        'student_id': student_id,
        'display_name': display_name,
        'current_emotion': 'neutral',
        'avg_engagement': 0,
        'total_records': 0,
        'emotion_counts': {},
        'last_seen': datetime.now().isoformat()
    }
    return jsonify({'status': 'joined'})

@app.route('/api/student/leave', methods=['POST'])
def student_leave():
    data = request.json
    student_id = data.get('student_id')
    students_db.pop(student_id, None)
    return jsonify({'status': 'left'})

@app.route('/api/student/frame', methods=['POST'])
def student_frame():
    data = request.json
    student_id = data.get('student_id')
    if student_id not in students_db:
        return jsonify({'error': 'Student not found'}), 404

    emotions = ['engaged', 'confused', 'bored', 'neutral', 'tired']
    weights  = [0.35, 0.20, 0.15, 0.20, 0.10]
    emotion  = random.choices(emotions, weights=weights)[0]
    engagement = round(random.uniform(30, 90), 1)

    s = students_db[student_id]
    s['current_emotion'] = emotion
    s['total_records']  += 1
    s['last_seen']       = datetime.now().isoformat()
    s['emotion_counts'][emotion] = s['emotion_counts'].get(emotion, 0) + 1
    # скользящее среднее вовлечённости
    n = s['total_records']
    s['avg_engagement'] = round((s['avg_engagement'] * (n - 1) + engagement) / n, 1)

    return jsonify({'emotion': emotion, 'engagement': engagement})

@app.route('/api/teacher/status', methods=['GET'])
def teacher_status():
    active = list(students_db.values())
    avg_eng = round(sum(s['avg_engagement'] for s in active) / len(active), 1) if active else 0

    alerts = [
        {'student_id': s['student_id'], 'display_name': s['display_name'], 'emotion': s['current_emotion']}
        for s in active
        if s['current_emotion'] in ('bored', 'tired') and s['total_records'] > 0
    ]
    return jsonify({'students': active, 'avg_engagement': avg_eng, 'alerts': alerts})

@app.route('/api/teacher/history', methods=['GET'])
def teacher_history():
    # Простая история из текущей сессии (в памяти)
    limit = int(request.args.get('limit', 100))
    records = []
    for s in students_db.values():
        records.append({
            'student_id': s['student_id'],
            'emotion': s['current_emotion'],
            'engagement': s['avg_engagement'],
            'timestamp': s['last_seen'],
            'session_date': datetime.now().strftime('%Y-%m-%d')
        })
    return jsonify({'records': records[:limit]})

@app.route('/api/teacher/export', methods=['GET'])
def teacher_export():
    return jsonify({'students': list(students_db.values()), 'exported_at': datetime.now().isoformat()})

if __name__ == '__main__':
    print("=" * 70)
    print("🚀 Emotion Recognition System - Extended AI Server")
    print("=" * 70)
    print("\n📡 Server: http://localhost:5000")
    print("🤖 AI: Smart Logic + Extended Knowledge Base")
    print(f"📚 Knowledge Topics: {len(KNOWLEDGE)}")
    print(f"🔗 Aliases: {len(ALIASES)}")
    print("\n📖 Available Topics:")
    
    topics = {
        "🤖 Technology": ["Python", "AI", "AI in Kazakhstan"],
        "🏢 Hubs": ["Astana Hub", "Atyrau Hub"],
        "🌌 Science": ["Space", "Sun", "Moon", "Water"],
        "🐾 Animals": ["Cat", "Dog"],
        "💪 Health": ["Fitness", "Coffee"],
        "🍎 Other": ["Apple (fruit & company)"]
    }
    
    for category, items in topics.items():
        print(f"   {category}: {', '.join(items)}")
    
    print("\n" + "=" * 70)
    print("✨ Server ready with extended knowledge!")
    print("=" * 70 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)