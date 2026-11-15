# Ciko — подтверждённый отчёт о тестировании

Дата проверки: 15.11.2026.

## Результаты

| Проверка | Команда | Подтверждённый результат |
|---|---|---|
| Unit-тесты backend | `cd backend; npm test` | 15/15 |
| Покрытие сервисного слоя | `cd backend; npm run test:coverage` | 100% строк, 100% функций, 100% инструкций; 85,29% ветвей |
| Интеграционные тесты API + PostgreSQL | `cd backend; npm run test:integration` | 6/6 (в GitHub Actions) |
| React-тесты | `cd frontend; npm test` | 6/6 |
| Backend ESLint | `cd backend; npm run lint` | Успешно (CI) |
| Frontend ESLint | `cd frontend; npm run lint` | Успешно |
| Backend TypeScript | `cd backend; npm run build` | Успешно |
| Frontend TypeScript + Vite | `cd frontend; npm run build` | Успешно |
| Docker Compose | `docker compose build` | Успешно |
| HTTP API health | `Invoke-RestMethod http://localhost:8080/api/health` | `success: True`, `status: ok` |
| GitHub Actions | .github/workflows/ci.yml | Три задания frontend/backend/docker успешно завершены |

Всего 27 автоматических тестов (15 + 6 + 6), все успешно пройдены.

## Что именно означает процент покрытия

В `backend/vitest.config.ts` указано `coverage.include = ['src/services/**/*.ts']`.
На дату проверки каталог `backend/src/services/` содержит один файл — `security.service.ts`.
Поэтому это **покрытие текущего полного сервисного каталога**, но **не всего бэкенда**, контроллеров, маршрутов или React-компонентов.
Требуемый преподавателем порог 60% покрытия сервисного слоя достигнут.

## Доказательства

Успешный запуск CI: https://github.com/rwter5eretrtyer-dot/ciko/actions/runs/43754344799
Коммит исправлений перед успешным CI: e5c23d6.

## Как показать преподавателю

1. Открыть `https://github.com/rwter5eretrtyer-dot/ciko/actions` и успешный запуск.
2. Выполнить `cd C:\ciko\backend`, затем `npm run test:coverage`.
3. Выполнить `cd C:\ciko\frontend`, затем `npm test`.
4. Показать `docker compose ps` и `Invoke-RestMethod http://localhost:8080/api/health` из папки проекта.
5. Интеграционные тесты проще и надёжнее показывать в GitHub Actions: job backend, шаг `npm run test:integration` (6/6). Для локального запуска нужна отдельная PostgreSQL.

## Пока не подтверждено

- Полноценные E2E-тесты Playwright (не добавлены в текущие 27 тестов).
- Ручные проверки всех пользовательских сценариев на публичном сервере.
- Публичный деплой считать завершённым только после успешного HTTP-ответа HTTPS-сайта и API.
