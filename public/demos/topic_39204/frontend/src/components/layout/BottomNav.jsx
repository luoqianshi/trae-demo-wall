const TAB_ICONS = {
  live: "M12 3v18m-5-5 5 5 5-5M5 8h14",
  view: "M4 5h16v10H4zM9 19h6",
  screen: "M4 5h16v10H4zM9 19h6",
  timeline: "M5 6h14M5 12h10M5 18h14",
  review: "M7 4h10v16H7zM10 8h4M10 12h4M10 16h3",
  export: "M12 3v12m0 0 4-4m-4 4-4-4M5 19h14",
};

function TabIcon({ tabId }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="bottom-nav-icon">
      <path d={TAB_ICONS[tabId]} />
    </svg>
  );
}

export function BottomNav({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bottom-nav-button ${activeTab === tab.id ? "active" : ""}`}
          aria-label={`切换到${tab.name}`}
          aria-current={activeTab === tab.id ? "page" : undefined}
          onClick={() => onTabChange(tab.id)}
        >
          <TabIcon tabId={tab.id} />
          <span>{tab.name}</span>
        </button>
      ))}
    </nav>
  );
}
