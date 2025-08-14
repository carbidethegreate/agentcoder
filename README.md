# BotPad - Minimal GitHub Editor

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

## Manual testing

To confirm that `.env` persistence works:

1. Deploy the worker and open the app.
2. Connect to a repository.
3. Enter some content in the `.env` box and click **Save .env**.
4. Verify in the network panel that the request to `/api/env` uses the `POST` method and returns a successful response.
