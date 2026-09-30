# 🌍 Земля

**Земля** — отдельная open-source discovery-платформа в стиле Blink Maps по визуальному языку, но **без мессенджера и общения**. Пользователь открывает сервис и получает удобную витрину для:

- 📺 ТВ;
- 📻 радио;
- 🎬 видео;
- 📰 чтения форума;
- 🔎 индексируемых страниц отдельных материалов.

Контент не копируется в базу Земли: приложение забирает публичные данные через API/HTTP-источники на сервере и показывает их в едином интерфейсе.

## Стек

- Next.js 16 + React 19
- TypeScript
- Node.js 22+
- Vercel-ready
- Server-side fetching + ISR/revalidation
- Schema.org JSON-LD
- `sitemap.xml` и `robots.txt`
- Cheerio для безопасного чтения публичной HTML-страницы темы форума, если API источника не отдаёт полный текст темы

Vercel в 2026 поддерживает Node.js-серверы с zero-configuration, а Node.js 20 переводится в deprecated-режим для новых deployments, поэтому проект целится в Node 22+. 

## Источники

По умолчанию проект рассчитан на:

- `https://domtv.blyz.ru`
- `https://streamlivetv.freedev.app`
- `https://streamliveru.web1.websitegame.ru`
- `https://mtwixoffbe846.users.myrn.ru`

Для StreamLive API проект понимает формат:

```text
/api.php?type=videos&limit=40
/api.php?type=channels&type_filter=tv&limit=40
/api.php?type=channels&type_filter=radio&limit=40
/api.php?type=forum&limit=40
```

Секретный `X-API-Key` задаётся только на сервере через `.env` и никогда не попадает в браузер.

## Настройка

```bash
cp .env.example .env.local
npm install
npm run dev
```

Откройте `http://localhost:3000`.

### Переменные

`NEXT_PUBLIC_SITE_URL` — настоящий домен Земли.

`ZEMLYA_CACHE_SECONDS` — TTL кэша. Для бесплатной инфраструктуры рекомендуется `60` или `120`.

`ZEMLYA_REQUEST_TIMEOUT_MS` — таймаут внешнего источника.

`ZEMLYA_STREAMLIVE_API` / `ZEMLYA_STREAMLIVE_API_KEY` — основной API.

`ZEMLYA_SOURCES_JSON` — список источников. Формат:

```json
[
  {"id":"catalog","name":"Catalog","baseUrl":"https://example.com","apiUrl":"https://example.com/api.php","apiKey":""}
]
```

`ZEMLYA_FORUM_DETAIL_API` — необязательный API полного треда. Если он не задан, Земля использует публичную `forum_thread.php?id=...` первого источника и читает только HTML контента темы сервером.

## Что происходит с embed

Земля не превращает все материалы в голые ссылки. Для видео и каналов используется URL плеера/embed, переданный API. Если API отдаёт только `slug`, проект строит стандартный `/embed.php?slug=...` на том же источнике.

Поэтому карточка → отдельная SEO-страница → красивый player shell → embed.

## SEO

SEO сделано с расчётом на Google и Яндекс:

- SSR/HTML с контентом, а не пустая SPA-оболочка;
- уникальные `<title>` и description для разделов и материалов;
- Open Graph;
- canonical через `metadataBase` и URL страниц;
- `sitemap.xml`;
- `robots.txt`;
- Schema.org JSON-LD для организации, видео и форума;
- семантические `h1/h2`, текстовые описания и `alt` для изображений.

Google указывает, что structured data помогает системам понять содержимое страниц, а для видео и обсуждений есть поддерживаемые типы разметки. Яндекс также учитывает title/description, семантическую структуру и Schema.org/другую разметку. Разметка сама по себе не гарантирует более высокую позицию в поиске.

## Публикация на Vercel

1. Создайте репозиторий `zemlya`.
2. Загрузите проект.
3. Импортируйте репозиторий в Vercel.
4. Поставьте Node.js 22.
5. Добавьте переменные из `.env.example`.
6. `npm run build` должен пройти без изменений.

После публикации укажите домен в `NEXT_PUBLIC_SITE_URL` и заново задеплойте.

## Tatnet / Onreza / Layero

Проект не зависит от Vercel. На хостинге нужен Node.js 22+ и возможность запустить:

```bash
npm ci
npm run build
npm start
```

Если площадка поддерживает только статический hosting, этот проект не следует экспортировать как полностью static: SSR нужен для SEO и свежего server-side API aggregation.

## GitHub / GitVerse

Репозиторий можно публиковать как обычный open-source проект. Перед commit:

- не добавляйте `.env`;
- не публикуйте API-ключи;
- используйте `.env.example`;
- проверьте права на внешний контент и embed.

## Лицензия

Проект распространяется под MIT. Это относится к исходному коду Земли, а не к контенту внешних источников.

## Интеграция StreamLive v28.5

«Земля» адаптирована под API и структуру движка StreamLive v28.5. По умолчанию подключены четыре источника:

- `https://domtv.blyz.ru`
- `https://streamlivetv.freedev.app`
- `https://streamliveru.web1.websitegame.ru`
- `https://mtwixoffbe846.users.myrn.ru`

Адаптер использует штатные endpoint'ы движка: `api.php`, `api_channels.php`, `api_videos.php`, `platforma/api_channels.php`, `platforma/api_forum.php`, а для резервного чтения — RSS. Видео открываются через штатный `video_embed.php`, форум — через `forum_thread.php`.

Если задан `ZEMLYA_SOURCES_JSON`, он заменяет встроенный список источников.
