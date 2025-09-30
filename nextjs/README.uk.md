# FFmpeg + Next.js Demo

Демо‑проєкт для роботи з FFmpeg (через ffmpeg.wasm) у середовищі Next.js. Показує, як:
- отримувати медіапотік з камери та мікрофона в браузері,
- кешувати артефакти FFmpeg для пришвидшення старту,
- обробляти записані медіафайли (транскодування/конвертація) без сервера, прямо в браузері.

![Скріншот демо](screenshot.png)

---

## Як запустити проєкт

Вимоги:
- Node.js 18+ (рекомендовано LTS)
- npm або yarn (будь‑який один менеджер пакетів)

Кроки:
1) Встановіть залежності в папці `nextjs`:
   - npm i
   - або: yarn
2) Запустіть dev‑сервер:
   - npm run dev
   - або: yarn dev
3) Відкрийте у браузері http://localhost:3000

Продакшн‑збірка:
- npm run build && npm run start
- або: yarn build && yarn start

Важливо:
- Для роботи камери браузер попросить дозвіл.
- У деяких браузерах доступ до камери/мікрофона можливий лише через HTTPS або на `localhost`.

---

## Основні компоненти

1) Кеш FFmpeg
   - Шлях: `components/converter/front/cacheFfmpeg/ffmpegCache.ts`.
   - Відповідає за кешування бінарників і даних ffmpeg.wasm (наприклад, у памʼяті/IndexedDB), щоб під час повторних запусків не витрачати час на повторне завантаження. Передбачено завантаження, читання та очищення кешу.

2) Робота з камерою
   - Файли: `components/recorder/media.ts`, `components/recorder/RecorderDashboard.tsx`.
   - Використовує MediaDevices.getUserMedia / MediaRecorder для захоплення відео/аудіо в браузері. Обробляє запити на дозволи, старт/стоп запису та передачу отриманих медіаблобів далі у конвеєр обробки.

3) Обробка готового медіа
   - Компоненти фронтенд‑воркера: `components/converter/front/worker/FfmpegWorkerPanel.tsx` та повʼязані модулі.
   - Запускає ffmpeg.wasm усередині Web Worker, виконує транскодування/конвертацію записаних файлів, вилучення треків/превʼю та інші операції — повністю на стороні клієнта.

---

## Author

**Oleksandr Nykytin**

- Website: [ninydev.com](https://ninydev.com)
- Email: [keeper@ninydev.com](mailto:keeper@ninydev.com)
