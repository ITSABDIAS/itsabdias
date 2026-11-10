# Project Architecture

- Keep progression discovery on `/niveles`; `/bug-hunter` remains focused on bug reports and its leaderboard so progression UI has one canonical home.
- Keep membership prices and context/history limits in `src/lib/membership.ts`; Plus includes the Premium role for existing displays, while server access and preferences use the active, unexpired subscription via `is_plus`.
- Founder membership grants use an authenticated database RPC with immutable staff history and recipient notifications; removing Plus preserves Premium and user content.