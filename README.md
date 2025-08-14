# BotPad - Minimal But Amazing GitHub Editor 

Drop these files over your current folder, then:

```
wrangler deploy
wrangler tail
```

For Pages:

```
mkdir -p dist
cp index.html dist/index.html
wrangler pages deploy dist --project-name agentcode
```

## Configuring API base

The app looks for an API base URL in the following order and falls back to
relative paths when nothing is provided:

1. `window.API_BASE` global variable.
2. `<meta name="api-base" content="https://api.example.com">` tag.
3. `API_BASE` environment variable at build time.

To point the frontend at a different API deployment, define one of the above
before loading `index.html`. For example:

```html
<meta name="api-base" content="https://botpad-api.example.workers.dev">
```

or

```html
<script>window.API_BASE = "https://botpad-api.example.workers.dev";</script>
```

## Manual testing

To confirm that `.env` persistence works:

1. Deploy the worker and open the app.
2. Connect to a repository.
3. Enter some content in the `.env` box and click **Save .env**.
4. Verify in the network panel that the request to `/api/env` uses the `PUT` method and returns a successful response.

