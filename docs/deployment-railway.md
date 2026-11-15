# Публичное развёртывание Ciko (Railway)

## Подготовлено

- Railway project `ciko`, environment `production`.
- `Postgres` с постоянным томом.
- `ciko-web` из GitHub `rwter5eretrtyer-dot/ciko`, корневой Dockerfile.
- Постоянный том загрузок `/app/uploads`.
- HTTPS-домен: https://ciko-web-production.up.railway.app
- Отдельные сильные JWT-ключи хранятся только в переменных Railway.
- `COOKIE_SECURE=true`, `SEED_DEMO=false`, `NODE_ENV=production`.
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `PORT=4000`, `FRONTEND_DIR=/app/public`.

## Обязательный следующий шаг — дать Railway доступ к приватному GitHub

1. Открыть https://github.com/settings/installations
2. Найти `Railway` -> `Configure`.
3. `Repository access`: добавить `rwter5eretrtyer-dot/ciko`, сохранить.
4. Если репозиторий по-прежнему не виден, обновить GitHub-интеграцию Railway в https://railway.com/account.
5. В Railway открыть проект `ciko`, сервис `ciko-web`, подключить исходный репозиторий `rwter5eretrtyer-dot/ciko`, ветка `main`; запустить первый деплой.

## Как проверить

Открыть https://ciko-web-production.up.railway.app
Проверить https://ciko-web-production.up.railway.app/api/health
Должен прийти `{"success":true,"data":{"status":"ok","service":"ciko-api"}}`.

PowerShell:
```powershell
Invoke-RestMethod "https://ciko-web-production.up.railway.app/api/health"
```

## Безопасность

- На публичном сервере `SEED_DEMO=false`: стандартные аккаунты и пароль `CikoDemo2026!` не создаются.
- Не копировать локальный `.env` с паролями на GitHub.
- После регистрации по умолчанию выдаётся роль viewer; назначение редактора/администратора нужно делать отдельно и защищённо.
- Не разворачивать с `SEED_DEMO=true` на общедоступном адресе.
- Публичный деплой требует наличия лимита/кредита Railway; действующие цены следует смотреть в биллинге Railway.
- Никаких обещаний готовности без успешной проверки домена и API.
