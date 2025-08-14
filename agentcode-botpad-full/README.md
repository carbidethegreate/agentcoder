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
