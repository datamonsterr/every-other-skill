# Experiment: mobile-app

**Question:** Official Expo skills vs Callstack React Native skills vs none, on the same Expo Router feature.

The rubric below was fixed before any run. Do not change it after seeing outputs; write a new experiment instead.

## Variants

One skill-up config per variant in this folder; every variant runs the same case on the same project.

| Config | Skills installed |
| --- | --- |
| `baseline` | none |
| `callstack` | `react-native-best-practices`, `react-navigation` |
| `expo` | `expo-native-ui`, `expo-overview`, `expo-router` |
| `mobile-category` | 17 skills: `accessibility`, `android-clean-architecture`, `dart-flutter-patterns`, `eas-app-stores`, `expo-animation`, `expo-data-fetching`, `expo-design-system`, `expo-native-ui`, `expo-overview`, `expo-project-structure`, `expo-router`, `expo-upgrade`, `react-native-best-practices`, `react-native-patterns`, `react-navigation`, `swiftui-patterns`, `vercel-react-native-skills` |

## How to judge

Score every candidate 0-10 on each criterion and pass or fail each assertion, blind to the variant.

## Task

```text
In this Expo Router app, build the till for the shop using products.ts: a tab layout with "Sell" and "Today" tabs; Sell shows a searchable product list with large tap targets that adds items to a sale, a sale summary with a total in VND and a "Paid" button; Today lists completed sales and the day's total. Tapping a product's info opens a product detail route. Keep state in memory, use only the installed packages, and follow platform conventions on iOS and Android. `bun run typecheck` must pass.
```

## Criteria (0-10 each)

1. Typecheck passes and the route/tab structure follows Expo Router conventions
2. Native feel: safe areas, tap target sizes, platform-appropriate navigation
3. List performance (FlatList keys, memoization where it matters)
4. Correct VND totals and sale state
5. Only installed packages are used

## Assertions (pass/fail)

- `app/_layout.tsx` exists in the workspace
- `bun install --silent && bun run typecheck` exits 0 (skill-up script judge)
- Uses only facts and packages given in the project
