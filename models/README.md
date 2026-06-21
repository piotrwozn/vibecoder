Place the Vibex GGUF model here before a full desktop release build:

`SmolLM2-135M-Instruct-Q4_K_M.gguf`

`npm run build:full` copies this file to `dist/models/` when it exists. Demo builds skip it,
so the web/demo package stays small. At runtime, Vibex local AI tries the bundled model first
and falls back to the Hugging Face/cache path only when the bundled file is missing.
