# Архитектура и ER-модель Ciko

## Общая архитектура

```mermaid
flowchart LR
  A[Браузер — React SPA] -->|HTTPS + JSON| B[Nginx]
  B -->|/api| C[Express REST API]
  B -->|/uploads| C
  B -->|статические файлы| A
  C --> D[(PostgreSQL 16)]
  C --> E[(Docker Volume с видео)]
  C --> F[Swagger / OpenAPI]
  G[GitHub Actions] -->|lint тесты build| C
  G -->|lint тесты build| A
```

В среде Docker Compose поднимаются `db`, `api`, `web`. Контейнер `web` компилирует React/Vite в HTML/CSS/JS, Nginx раздаёт файлы и проксирует `/api` и `/uploads`; API хранит файлы в отдельном volume и обращается к PostgreSQL.

## Слои backend

```mermaid
flowchart TD
  R[HTTP routes — обработка запросов] --> S[Services — правила безопасности]
  R --> P[Repositories — SQL для фильмов]
  R --> M[Middleware — JWT и RBAC]
  M --> D[(PostgreSQL)]
  S --> D
  P --> D
```

Контроллеры/маршруты отвечают за HTTP, сервисы — за проверку токенов и правил, репозитории — за выборку и сохранение данных. Часть небольших запросов профиля и админки пока расположена в соответствующих маршрутах — дальнейшая нормализация проекта возможна перед защитой.

## ER-диаграмма, 10 основных сущностей

```mermaid
erDiagram
  USERS ||--o{ REFRESH_TOKENS : owns
  USERS ||--o{ PASSWORD_RESET_TOKENS : requests
  USERS ||--o{ MOVIES : creates
  USERS ||--o{ FAVORITES : adds
  USERS ||--o{ WATCH_HISTORY : watches
  USERS ||--o{ REVIEWS : writes
  USERS ||--o{ AUDIT_LOGS : performs
  MOVIES ||--o{ MOVIE_GENRES : classified
  GENRES ||--o{ MOVIE_GENRES : includes
  MOVIES ||--o{ FAVORITES : saved
  MOVIES ||--o{ WATCH_HISTORY : watched
  MOVIES ||--o{ REVIEWS : receives
  USERS { uuid id PK string email string role boolean blocked }
  MOVIES { uuid id PK string title string kind int release_year string video_url boolean published }
  GENRES { int id PK string slug string name }
  MOVIE_GENRES { uuid movie_id FK int genre_id FK }
  FAVORITES { uuid user_id FK uuid movie_id FK }
  WATCH_HISTORY { uuid user_id FK uuid movie_id FK int progress_seconds boolean completed }
  REVIEWS { uuid id PK uuid user_id FK uuid movie_id FK int rating }
  REFRESH_TOKENS { uuid id PK uuid user_id FK string token_hash }
  PASSWORD_RESET_TOKENS { uuid id PK uuid user_id FK string token_hash }
  AUDIT_LOGS { int id PK uuid user_id FK string action }
```

Нормализация: жанры вынесены отдельно, связь много-ко-многим — в `movie_genres`; избранное/история/отзывы связывают пользователей и фильмы отдельными сущностями. В таблицах нет повторяющихся списков жанров. Поиск по имени фильма индексирован выражением `LOWER(title)`, годы и даты — отдельными индексами.

## Безопасность

- bcrypt для паролей; refresh-токены хранятся в виде SHA-256, не в исходном виде.
- RBAC проверяется middleware на сервере; роль читается заново из БД при каждом защищённом запросе.
- Параметризованные SQL-запросы против SQL-инъекций.
- JSON-валидация через Zod, ограничения на MIME-типы и размеры файлов.
- CORS на список адресов; ответы API имеют единый формат `success/data` или `success/error`.
- На публичном сервере дополнительно обязательны HTTPS, безопасные секреты, отключение демо-пользователей, резервные копии и лимиты запросов.

## Нефункциональные требования

Frontend рассчитан на ширину от 320 до 1920 px через адаптивные сетки и медиазапросы. Время API менее 500 мс и точное покрытие тестами **пока не измерены**. Эти показатели необходимо зафиксировать после запуска на тестовой базе и приложить скриншоты/логи.

## Расширение: комнаты

Миграция `002_rooms.sql` добавляет таблицы `rooms`, `room_members`, `room_messages`. Пользователь создаёт комнату через `POST /api/rooms`, второй пользователь входит по коду через `POST /api/rooms/join`. Все действия с комнатой проверяют членство в `room_members`. Состояние просмотра обновляет только создатель через `PUT /api/rooms/:id/state`. У гостей каждые 2,5 секунды сверяется положение прямого видео с сервером. Чат также доступен только участникам. YouTube/Vimeo остаются без общей синхронизации.
