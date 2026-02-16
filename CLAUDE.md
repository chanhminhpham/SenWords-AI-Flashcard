# AI Flash Card — AI Agent Quick Reference

## 10 Quick Reference Rules

| #   | Rule                                                        | Why                                                        |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Drizzle schema = single source of truth for DB types        | Prevents type drift between DB, validation, and TypeScript |
| 2   | TanStack Query owns server state, Zustand owns client state | Prevents data duplication and sync bugs                    |
| 3   | Named exports only (`export function X`)                    | Better tree-shaking, IDE auto-import, refactoring          |
| 4   | Files: PascalCase components, kebab-case everything else    | Consistent, matches React + Node conventions               |
| 5   | Zustand actions: `verbNoun` (not `setX`)                    | Expressive intent, not implementation detail               |
| 6   | Event types: `SCREAMING_SNAKE` past tense                   | Clear event naming, matches industry standard              |
| 7   | `@/` path alias for all internal imports                    | No `../../../` mess, clean imports                         |
| 8   | Co-located `.test.tsx` files                                | Tests stay near code, easy to find and maintain            |
| 9   | Edge Functions return `{ success, data/error }` camelCase   | Consistent API contract, matches TypeScript conventions    |
| 10  | Config in `src/config/`, env via `EXPO_PUBLIC_` prefix      | Centralized constants, Expo env convention                 |

**Exceptions:** Expo Router route files in `app/` and `app.config.ts` MUST use `export default`.

## Project Structure

```
ai-flash-card/
├── app/                    # Expo Router (file-based routing ONLY)
│   ├── _layout.tsx         # Root layout (providers, Sentry)
│   ├── (auth)/             # Auth stack
│   ├── (tabs)/             # Tab navigator
│   └── (modals)/           # Modal presentation
├── src/
│   ├── components/ui/      # Shared UI primitives
│   ├── components/features/ # Feature-specific components
│   ├── stores/             # Zustand stores
│   ├── services/supabase/  # Supabase client
│   ├── services/ai/        # AI service clients
│   ├── hooks/              # Custom hooks
│   ├── config/             # Config + type-safe env
│   ├── theme/              # SenWordTheme
│   ├── db/                 # Drizzle schemas
│   ├── i18n/               # Localization
│   ├── types/              # Type re-exports
│   └── utils/              # Utilities
├── supabase/               # Supabase CLI, migrations, Edge Functions
└── __mocks__/              # Test mocks
```

## Naming Conventions

| Element             | Convention                        | Example                                |
| ------------------- | --------------------------------- | -------------------------------------- |
| Components          | PascalCase file + export          | `FlashcardDetail.tsx`                  |
| Non-component files | kebab-case                        | `learning-engine.store.ts`             |
| Hook files          | kebab-case file, camelCase export | `use-device-tier.ts` → `useDeviceTier` |
| Functions           | camelCase                         | `calculateNextReview`                  |
| Constants           | SCREAMING_SNAKE                   | `MAX_WORD_MAP_NODES`                   |
| Types/Interfaces    | PascalCase                        | `VocabularyCard`                       |
| Database tables     | snake_case, plural                | `vocabulary_cards`                     |
| Edge Functions      | kebab-case                        | `pronunciation-rt`                     |

## Import Order

```
React/RN → Third-party → @/components/ → @/stores/, @/hooks/, @/utils/, @/config/ → @/types/
```

## Type Source of Truth Chain

```
db/local-schema.ts (Drizzle SQLite)  →  drizzle-zod  →  types/ re-export
db/server-schema.ts (Drizzle PG)     →  drizzle-zod  →  types/ re-export
```

- DO NOT write Zod schemas manually for DB entities — use `drizzle-zod`
- DO NOT define TypeScript types manually for DB entities — infer from Drizzle
- `types/` folder only re-exports + defines non-DB types

## Anti-Patterns to AVOID

| Anti-Pattern                          | Why                       |
| ------------------------------------- | ------------------------- |
| `export default` (except app/ routes) | Breaks tree-shaking       |
| Manual DB types                       | Drifts from schema        |
| Server data in Zustand                | Stale data, sync bugs     |
| `../../../` imports                   | Use `@/` alias instead    |
| Custom loading booleans               | Use TanStack Query states |

## Tech Stack

- Expo SDK 54 / React Native 0.81 / React 19.1
- NativeWind v4.2.0+ (NOT v5)
- Supabase (Auth + PostgreSQL + Edge Functions)
- Drizzle ORM + expo-sqlite
- Zustand (client state) + TanStack Query (server state)
- @sentry/react-native (crash reporting)
