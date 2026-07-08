## ADDED Requirements

### Requirement: History list page displays past order records
The system SHALL provide a dedicated history page that loads and displays the user's past order records from `/api/history` endpoint. Each record card MUST show: creation time, user input summary (truncated to 30 chars), recommended dish names with thumbnail images (max 3 visible), and total price.

#### Scenario: Load history on page enter
- **WHEN** user navigates to the history tab
- **THEN** system fetches records from `/api/history?limit=20` and renders them in reverse chronological order

#### Scenario: Empty history state
- **WHEN** user has no past order records
- **THEN** system displays a friendly empty state illustration with text "还没有点餐记录哦，去聊天页试试吧"

### Requirement: History record detail expansion
The system SHALL allow users to tap a history record card to expand/collapse full details including all recommended dishes with images, prices, tags, and recommendation reasons.

#### Scenario: Expand a record
- **WHEN** user taps a collapsed history card
- **THEN** card expands smoothly to show all dishes with full info

#### Scenario: Collapse a record
- **WHEN** user taps an expanded history card
- **THEN** card collapses back to summary view

### Requirement: History page visual design quality
The history page MUST follow frontend-design skill guidelines: distinctive typography (no Inter/Roboto/Arial), cohesive color palette matching existing chat page (#FFF8F0 background, #2D5F3E primary, #C84B31 accent), intentional spatial composition, and refined micro-interactions. The design MUST avoid generic AI aesthetics.

#### Scenario: Visual consistency check
- **WHEN** history page is rendered
- **THEN** color palette, typography scale, and spacing rhythm are consistent with the chat page while maintaining distinct page identity
