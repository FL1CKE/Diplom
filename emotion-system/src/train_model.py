"""
Скрипт для обучения CNN модели распознавания эмоций
Dataset: FER-2013 или кастомный датасет

Использование:
    python train_model.py --dataset fer2013 --epochs 50
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
import cv2
import os
import argparse


def create_model():
    """Создание CNN модели"""
    model = Sequential([
        # Блок 1
        Conv2D(32, (3, 3), activation='relu', padding='same', input_shape=(48, 48, 1)),
        BatchNormalization(),
        Conv2D(32, (3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        
        # Блок 2
        Conv2D(64, (3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        Conv2D(64, (3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        
        # Блок 3
        Conv2D(128, (3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        Conv2D(128, (3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        
        # Блок 4
        Conv2D(256, (3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        Conv2D(256, (3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        
        # Fully Connected
        Flatten(),
        Dense(512, activation='relu'),
        BatchNormalization(),
        Dropout(0.5),
        Dense(256, activation='relu'),
        BatchNormalization(),
        Dropout(0.5),
        Dense(7, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def load_fer2013_dataset(csv_path):
    """
    Загрузка датасета FER-2013
    
    Скачать можно здесь:
    https://www.kaggle.com/datasets/msambare/fer2013
    """
    print("📂 Загрузка FER-2013...")
    
    df = pd.read_csv(csv_path)
    
    # Извлечение пикселей и меток
    pixels = df['pixels'].tolist()
    emotions = df['emotion'].values
    
    # Преобразование в numpy arrays
    X = []
    for pixel_sequence in pixels:
        face = [int(pixel) for pixel in pixel_sequence.split(' ')]
        face = np.array(face).reshape(48, 48)
        X.append(face)
    
    X = np.array(X)
    X = X.reshape(X.shape[0], 48, 48, 1)
    X = X.astype('float32') / 255.0
    
    # One-hot encoding эмоций
    y = to_categorical(emotions, num_classes=7)
    
    print(f"✅ Загружено: {len(X)} изображений")
    print(f"📊 Классы: {np.unique(emotions)}")
    
    return X, y


def load_custom_dataset(data_dir):
    """
    Загрузка кастомного датасета
    
    Структура папок:
    data_dir/
        angry/
        disgust/
        fear/
        happy/
        sad/
        surprise/
        neutral/
    """
    print(f"📂 Загрузка датасета из {data_dir}...")
    
    emotion_folders = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    X = []
    y = []
    
    for emotion_idx, emotion in enumerate(emotion_folders):
        folder_path = os.path.join(data_dir, emotion)
        
        if not os.path.exists(folder_path):
            print(f"⚠️ Папка {emotion} не найдена, пропускаем...")
            continue
        
        for img_name in os.listdir(folder_path):
            img_path = os.path.join(folder_path, img_name)
            
            try:
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                img = cv2.resize(img, (48, 48))
                X.append(img)
                y.append(emotion_idx)
            except Exception as e:
                print(f"Ошибка загрузки {img_path}: {e}")
    
    X = np.array(X)
    X = X.reshape(X.shape[0], 48, 48, 1)
    X = X.astype('float32') / 255.0
    
    y = to_categorical(y, num_classes=7)
    
    print(f"✅ Загружено: {len(X)} изображений")
    
    return X, y


def train_model(X_train, y_train, X_val, y_val, epochs=50, batch_size=64):
    """
    Обучение модели
    """
    print("\n🏋️ Начало обучения модели...")
    
    # Создание модели
    model = create_model()
    
    print("\n📊 Архитектура модели:")
    model.summary()
    
    # Data Augmentation
    datagen = ImageDataGenerator(
        rotation_range=10,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1
    )
    
    # Callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        ModelCheckpoint(
            'emotion_model_best.h5',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        )
    ]
    
    # Обучение
    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=batch_size),
        validation_data=(X_val, y_val),
        epochs=epochs,
        callbacks=callbacks,
        verbose=1
    )
    
    # Сохранение финальной модели
    model.save('emotion_model.h5')
    print("\n✅ Модель сохранена как emotion_model.h5")
    
    return model, history


def plot_training_history(history):
    """Визуализация процесса обучения"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    # Точность
    ax1.plot(history.history['accuracy'], label='Train Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Val Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True)
    
    # Потери
    ax2.plot(history.history['loss'], label='Train Loss')
    ax2.plot(history.history['val_loss'], label='Val Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True)
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    print("📊 График сохранен как training_history.png")
    plt.show()


def evaluate_model(model, X_test, y_test):
    """Оценка модели"""
    print("\n📈 Оценка модели на тестовых данных...")
    
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    
    print(f"Test Loss: {loss:.4f}")
    print(f"Test Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    
    return loss, accuracy


def main():
    parser = argparse.ArgumentParser(description='Train Emotion Recognition Model')
    parser.add_argument('--dataset', type=str, default='fer2013', 
                        help='Dataset type: fer2013 or custom')
    parser.add_argument('--data-path', type=str, default='fer2013.csv',
                        help='Path to dataset (CSV for FER2013 or folder for custom)')
    parser.add_argument('--epochs', type=int, default=50,
                        help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=64,
                        help='Batch size')
    parser.add_argument('--val-split', type=float, default=0.2,
                        help='Validation split ratio')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("🧠 Emotion Recognition Model Training")
    print("=" * 70)
    
    # Загрузка датасета
    if args.dataset == 'fer2013':
        X, y = load_fer2013_dataset(args.data_path)
    else:
        X, y = load_custom_dataset(args.data_path)
    
    # Разделение на train/val/test
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=42
    )
    
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42
    )
    
    print(f"\n📊 Разделение данных:")
    print(f"   Train: {len(X_train)} samples")
    print(f"   Validation: {len(X_val)} samples")
    print(f"   Test: {len(X_test)} samples")
    
    # Обучение
    model, history = train_model(
        X_train, y_train, 
        X_val, y_val,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
    
    # Оценка
    evaluate_model(model, X_test, y_test)
    
    # Визуализация
    plot_training_history(history)
    
    print("\n" + "=" * 70)
    print("✅ Обучение завершено!")
    print("=" * 70)


if __name__ == '__main__':
    main()