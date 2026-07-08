## ADDED Requirements

### Requirement: Bottom TabBar navigation
The mini-program SHALL provide a native bottom TabBar with two tabs: "聊天" (chat) and "历史" (history). Each tab MUST have an icon and label. The active tab MUST use the primary color (#2D5F3E), inactive tabs use gray (#999999).

#### Scenario: Navigate between tabs
- **WHEN** user taps the "历史" tab
- **THEN** app navigates to history page without losing chat session state

#### Scenario: Navigate back to chat
- **WHEN** user taps the "聊天" tab from history page
- **THEN** app returns to chat page with previous messages intact

### Requirement: Chat page adapts to TabBar layout
The chat page MUST adjust its bottom spacing to account for the native TabBar height, ensuring the input bar is not obscured.

#### Scenario: Input bar visibility with TabBar
- **WHEN** chat page is displayed with TabBar visible
- **THEN** input bar sits above the TabBar with appropriate padding and is fully interactive
