// Компактная OpenAPI-спецификация для Swagger UI. Полные схемы см. docs/api.md.
export const openapi={
  openapi:'3.0.3',info:{title:'Ciko API',version:'1.0.0',description:'REST API минималистичного онлайн-кинотеатра Ciko'},
  servers:[{url:'/api'}],components:{
    securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'}},
    schemas:{Movie:{type:'object',properties:{id:{type:'string',format:'uuid'},title:{type:'string'},description:{type:'string'},kind:{type:'string',enum:['movie','series']},release_year:{type:'integer'},video_url:{type:'string'}}}}
  },paths:{
    '/health':{get:{summary:'Статус сервера',responses:{'200':{description:'OK'}}}},
    '/auth/register':{post:{summary:'Регистрация',requestBody:{content:{'application/json':{schema:{type:'object',required:['name','email','password'],properties:{name:{type:'string'},email:{type:'string'},password:{type:'string'}}}}}},responses:{'200':{description:'Создана сессия'}}}},
    '/auth/login':{post:{summary:'Вход',requestBody:{content:{'application/json':{schema:{type:'object',properties:{email:{type:'string'},password:{type:'string'}}}}}},responses:{'200':{description:'Токен доступа'}}}},
    '/auth/refresh':{post:{summary:'Обновить токен',responses:{'200':{description:'Новая пара токенов'}}}},
    '/auth/logout':{post:{summary:'Выход',responses:{'200':{description:'OK'}}}},
    '/auth/forgot-password':{post:{summary:'Запрос сброса пароля',responses:{'200':{description:'OK'}}}},
    '/auth/reset-password':{post:{summary:'Установить новый пароль',responses:{'200':{description:'OK'}}}},
    '/movies':{
      get:{summary:'Каталог с поиском, фильтрами, сортировкой и пагинацией',parameters:[{name:'search',in:'query',schema:{type:'string'}},{name:'kind',in:'query',schema:{type:'string'}},{name:'genre',in:'query',schema:{type:'string'}},{name:'page',in:'query',schema:{type:'integer'}},{name:'sort',in:'query',schema:{type:'string'}}],responses:{'200':{description:'Список'}}},
      post:{summary:'Добавить фильм (редактор/админ)',security:[{bearerAuth:[]}],responses:{'201':{description:'Создан'}}}
    },
    '/movies/genres':{get:{summary:'Жанры',responses:{'200':{description:'Список жанров'}}}},
    '/movies/{id}':{
      get:{summary:'Страница фильма',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Фильм'}}},
      put:{summary:'Изменить фильм',security:[{bearerAuth:[]}],parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Обновлён'}}},
      delete:{summary:'Удалить фильм',security:[{bearerAuth:[]}],parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Удалён'}}}
    },
    '/movies/{id}/reviews':{get:{summary:'Отзывы',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Отзывы'}}},post:{summary:'Добавить/изменить свой отзыв',security:[{bearerAuth:[]}],parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'201':{description:'Сохранён'}}}},
    '/me':{get:{summary:'Профиль',security:[{bearerAuth:[]}],responses:{'200':{description:'Профиль'}}},patch:{summary:'Изменить профиль',security:[{bearerAuth:[]}],responses:{'200':{description:'Обновлён'}}}},
    '/me/password':{post:{summary:'Сменить пароль',security:[{bearerAuth:[]}],responses:{'200':{description:'OK'}}}},
    '/me/favorites':{get:{summary:'Моё избранное',security:[{bearerAuth:[]}],responses:{'200':{description:'Список'}}}},
    '/me/favorites/{id}':{post:{summary:'В избранное',security:[{bearerAuth:[]}],responses:{'200':{description:'OK'}}},delete:{summary:'Удалить из избранного',security:[{bearerAuth:[]}],responses:{'200':{description:'OK'}}}},
    '/me/history':{get:{summary:'История просмотров',security:[{bearerAuth:[]}],responses:{'200':{description:'Список'}}}},
    '/me/progress/{id}':{put:{summary:'Сохранить место просмотра',security:[{bearerAuth:[]}],responses:{'200':{description:'OK'}}}},
    '/uploads':{post:{summary:'Загрузка MP4/WebM/OGG либо JPG/PNG/WebP',security:[{bearerAuth:[]}],responses:{'201':{description:'Путь к файлу'}}}},
    '/rooms/mine':{get:{summary:'Мои комнаты',security:[{bearerAuth:[]}],responses:{'200':{description:'Комнаты'}}}},
    '/rooms':{post:{summary:'Создать комнату: фильм, локальный файл или внешняя ссылка',security:[{bearerAuth:[]}],responses:{'201':{description:'Создана'}}}},
    '/rooms/join':{post:{summary:'Присоединиться по коду',security:[{bearerAuth:[]}],responses:{'200':{description:'Комната'}}}},
    '/rooms/{id}':{
      get:{summary:'Данные комнаты и участники',security:[{bearerAuth:[]}],parameters:[{name:'id',in:'path',required:true,schema:{type:'string',format:'uuid'}}],responses:{'200':{description:'Комната'}}},
      patch:{summary:'Изменить название (создатель)',security:[{bearerAuth:[]}],responses:{'200':{description:'Обновлено'}}},
      delete:{summary:'Удалить комнату (создатель)',security:[{bearerAuth:[]}],responses:{'200':{description:'Удалено'}}}
    },
    '/rooms/{id}/state':{put:{summary:'Управление воспроизведением (создатель)',security:[{bearerAuth:[]}],responses:{'200':{description:'Позиция обновлена'}}}},
    '/rooms/{id}/messages':{get:{summary:'Чат комнаты',security:[{bearerAuth:[]}],responses:{'200':{description:'Сообщения'}}},post:{summary:'Отправить сообщение',security:[{bearerAuth:[]}],responses:{'201':{description:'Отправлено'}}}},
    '/rooms/{id}/leave':{post:{summary:'Покинуть комнату',security:[{bearerAuth:[]}],responses:{'200':{description:'Выход'}}}},
    '/admin/users':{get:{summary:'Пользователи (админ)',security:[{bearerAuth:[]}],responses:{'200':{description:'Список'}}}},
    '/admin/users/{id}':{patch:{summary:'Роли и блокировка (админ)',security:[{bearerAuth:[]}],responses:{'200':{description:'Обновлено'}}}},
    '/admin/dashboard':{get:{summary:'Статистика (админ)',security:[{bearerAuth:[]}],responses:{'200':{description:'График и показатели'}}}},
    '/admin/audit':{get:{summary:'Журнал аудита (админ)',security:[{bearerAuth:[]}],responses:{'200':{description:'События'}}}},
    '/admin/export':{get:{summary:'Экспорт CSV (админ)',security:[{bearerAuth:[]}],responses:{'200':{description:'Файл CSV'}}}}
  }
};
