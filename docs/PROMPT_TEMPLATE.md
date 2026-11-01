# Prompt template

Copy the block below, fill in what applies, and delete the rest. Short tasks only need Goal and Done when.

```text
## Goal
<One or two sentences: what should be true when this is finished.>

## Context
<Screen, route, or file involved (e.g. src/screens/LibraryScreen.jsx). Current behavior, and what is wrong or missing.>

## Requirements
- <Specific behavior or rule>
- <Another one>

## Constraints
- <e.g. no new dependencies, keep existing theme tokens, JavaScript only>
- <Files or areas not to touch>

## Done when
- <Observable result, e.g. "Library shows an error state when the API is down">
- npm test passes (add tests for new API/validation behavior)
- <Manual check, e.g. "verified on npm run web">

## Notes
<Screenshots, error messages, links, or edge cases.>
```

## Example

```text
## Goal
Let users sort the Library by title or by last updated.

## Context
src/screens/LibraryScreen.jsx lists entries filtered by status and list, with no sort control.

## Requirements
- Add a sort control: Title (A-Z) and Recently updated.
- Sort applies after the existing status/list/search filters.

## Constraints
- Use existing ui.jsx primitives. No new dependencies.

## Done when
- Sorting works with each filter combination.
- Loading, empty and error states are unchanged.
- npm test passes.
```
