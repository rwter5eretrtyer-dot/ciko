# REST API комнат

Ответы единообразны: `{ "success": true, "data": ... }`. Для всех методов требуется access JWT.

| Метод | Путь | Что делает |
|---|---|---|
| GET | `/api/rooms/mine` | Мои комнаты |
| POST | `/api/rooms` | Создать комнату `{title, movieId}` или `{title, videoUrl}` |
| POST | `/api/rooms/join` | Войти по `{code}` |
| GET | `/api/rooms/:id` | Комната, участники, рассчитанное время воспроизведения |
| PATCH | `/api/rooms/:id` | Изменить название (создатель) |
| PUT | `/api/rooms/:id/state` | `{playing, seconds}` (создатель) |
| GET | `/api/rooms/:id/messages` | Последние 60 сообщений |
| POST | `/api/rooms/:id/messages` | `{body}` до 500 символов |
| POST | `/api/rooms/:id/leave` | Покинуть комнату (гость) |
| DELETE | `/api/rooms/:id` | Удалить комнату (создатель) |

Для загрузки видео в комнату: `POST /api/uploads?kind=video` с multipart-формой, поле `file`. После загрузки сервер возвращает URL, который передаётся в `videoUrl` при создании комнаты.
