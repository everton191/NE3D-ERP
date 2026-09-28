# ModelManifest

`config/ai/model-manifest.json` is the single model-description source. Android packages that exact file as an asset and `prepare-web.js` copies it to `dist/config/ai/model-manifest.json`.

The Needle entry is pinned to `Cactus-Compute/needle3` revision `b274efcb211a9eef48c9a88da4b43bd569696a39`; it declares the 35,335,380-byte `needle3.cact` SHA-256 and the internal-only destination `files/ai/models/needle3/needle3.cact`.

The LFM entry is pinned to `LiquidAI/LFM2.5-1.2B-Instruct-GGUF` revision `8ed288026e23958ad9dfa92d53ed773a8eee7125`, with the 695,755,488-byte `LFM2.5-1.2B-Instruct-QAD-Q4_0.gguf` SHA-256 and the `LFM1.0` license. Its role is `language_interpreter`; it remains shadow-only and has no tool or write authority.
