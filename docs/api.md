# REST API Ciko

Базовый URL: `http://localhost:8080/api`. Интерактивная документация: `/api/docs`, машина-читаемая OpenAPI: `/api/openapi.json`.

Все JSON-ответы: успешный `{"success": true, "data": ...}`; ошибка `{"success": false, "error": {"code": "...", "message": "..."}}`. Исключение — экспорт CSV.

## Основные маршруты

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| POST | `/auth/register` | любой | регистрация зрителя |
| POST | `/auth/login` | любой | вход, JWT и cookie |
| POST | `/auth/refresh` | cookie | обновить токены |
| POST | `/auth/logout` | любой | выход |
| POST | `/auth/forgot-password` | любой | создать reset-ссылку в логах |
| POST | `/auth/reset-password` | любой с reset-токеном | новый пароль |
| GET | `/movies` | любой | каталог, page,limit,search,kind,genre,year,sort |
| GET | `/movies/genres` | любой | жанры |
| GET | `/movies/:id` | любой | карточка опубликованного фильма |
| POST | `/movies` | editor/admin | новый фильм |
| PUT | `/movies/:id` | editor/admin | обновление |
| DELETE | `/movies/:id` | editor/admin | удаление |
| GET, POST | `/movies/:id/reviews` | любой / авторизован | читать / добавить отзыв |
| POST | `/uploads?kind=video` | editor/admin | загрузка видео FormData field=file |
| POST | `/uploads?kind=image` | editor/admin | загрузка постера |
| GET, PATCH | `/me` | авторизован | профиль |
| POST | `/me/password` | авторизован | смена пароля |
| GET | `/me/favorites` | авторизован | избранное |
| POST, DELETE | `/me/favorites/:id` | авторизован | добавить/убрать |
| GET | `/me/history` | авторизован | история |
| PUT | `/me/progress/:id` | авторизован | сохранить секунды просмотра |
| GET | `/studio/movies` | editor/admin | фильмы, включая черновики |
| GET | `/studio/movies/:id` | editor/admin | черновик фильма |
| GET | `/admin/users` | admin | пользователи |
| PATCH | `/admin/users/:id` | admin | роль/блокировка |
| GET | `/admin/dashboard` | admin | статистика и график |
| GET | `/admin/audit` | admin | журнал |
| GET | `/admin/export` | admin | CSV-экспорт |
| GET | `/health` | любой | проверка БД и API |

## Примеры запросов

Регистрация:

```bash
curl -X POST http://localhost:8080/api/auth/register -H 'Content-Type: application/json' -d '{"name":"Зритель","email":"new@example.test","password":"SecretPassword123!"}'
```

Поиск с фильтрами:

```bash
curl 'http://localhost:8080/api/movies?search=свет&genre=documentary&page=1&limit=12&sort=year'
```

Добавление фильма (нужен токен editor/admin):

```bash
curl -X POST http://localhost:8080/api/movies -H 'Authorization: Bearer ACCESS_TOKEN' -H 'Content-Type: application/json' -d '{"title":"Мой фильм","description":"История","kind":"movie","releaseYear":2026,"durationMinutes":3,"ageRating":0,"genreIds":[1],"videoUrl":"https://example.com/film.mp4","published":true}'
```

Загрузка файла (нужен токен editor/admin):

```bash
curl -X POST 'http://localhost:8080/api/uploads?kind=video' -H 'Authorization: Bearer ACCESS_TOKEN' -F 'file=@my-film.mp4'
```

Для воспроизведения допускаются только собственные видео или контент с соответствующей лицензией. Встраивание с YouTube/Vimeo зависит от настроек владельца ролика.
