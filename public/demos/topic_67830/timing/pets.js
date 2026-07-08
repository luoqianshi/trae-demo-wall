const PETS = {
    beagle: {
        id: 'beagle',
        name: '比格犬',
        emoji: '🐶',
        idle: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="85" rx="28" ry="18" fill="#D4A574"/>
            <ellipse cx="40" cy="90" rx="9" ry="7" fill="#D4A574"/>
            <ellipse cx="80" cy="90" rx="9" ry="7" fill="#D4A574"/>
            <circle cx="60" cy="45" r="32" fill="#D4A574"/>
            <ellipse cx="38" cy="28" rx="15" ry="22" fill="#D4A574"/>
            <ellipse cx="82" cy="28" rx="15" ry="22" fill="#D4A574"/>
            <ellipse cx="38" cy="35" rx="10" ry="16" fill="#8B4513"/>
            <ellipse cx="82" cy="35" rx="10" ry="16" fill="#8B4513"/>
            <ellipse cx="50" cy="42" rx="8" ry="10" fill="white"/>
            <ellipse cx="70" cy="42" rx="8" ry="10" fill="white"/>
            <ellipse cx="50" cy="44" rx="5" ry="7" fill="#4A3728"/>
            <ellipse cx="70" cy="44" rx="5" ry="7" fill="#4A3728"/>
            <circle cx="51" cy="42" r="3" fill="#2D2319"/>
            <circle cx="71" cy="42" r="3" fill="#2D2319"/>
            <circle cx="53" cy="40" r="1.5" fill="white"/>
            <circle cx="73" cy="40" r="1.5" fill="white"/>
            <circle cx="54" cy="39" r="0.6" fill="#2D2319"/>
            <circle cx="74" cy="39" r="0.6" fill="#2D2319"/>
            <ellipse cx="60" cy="56" rx="5" ry="4" fill="#8B4513"/>
            <path d="M54 62 Q60 68 66 62" stroke="#4A3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M53 60 Q60 65 67 60" stroke="#FFB6C1" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
            <ellipse cx="40" cy="54" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="80" cy="54" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <path d="M35 45 Q30 42 25 48" stroke="#4A3728" stroke-width="1.5" fill="none"/>
            <path d="M35 48 Q30 45 25 51" stroke="#4A3728" stroke-width="1.5" fill="none"/>
            <path d="M85 45 Q90 42 95 48" stroke="#4A3728" stroke-width="1.5" fill="none"/>
            <path d="M85 48 Q90 45 95 51" stroke="#4A3728" stroke-width="1.5" fill="none"/>
            <path d="M80 75 Q95 65 100 75 Q95 80 80 78" fill="#8B4513"/>
        </svg>`,
        work: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="85" rx="28" ry="18" fill="#D4A574"/>
            <ellipse cx="40" cy="90" rx="9" ry="7" fill="#D4A574"/>
            <ellipse cx="80" cy="90" rx="9" ry="7" fill="#D4A574"/>
            <circle cx="60" cy="45" r="32" fill="#D4A574"/>
            <ellipse cx="38" cy="28" rx="15" ry="22" fill="#D4A574"/>
            <ellipse cx="82" cy="28" rx="15" ry="22" fill="#D4A574"/>
            <ellipse cx="38" cy="35" rx="10" ry="16" fill="#8B4513"/>
            <ellipse cx="82" cy="35" rx="10" ry="16" fill="#8B4513"/>
            <rect x="38" y="35" rx="8" ry="8" width="44" height="18" fill="#333"/>
            <rect x="41" y="38" rx="5" ry="5" width="38" height="12" fill="#E8E8E8"/>
            <circle cx="50" cy="44" r="3" fill="#333"/>
            <circle cx="70" cy="44" r="3" fill="#333"/>
            <circle cx="51" cy="43" r="1" fill="white"/>
            <circle cx="71" cy="43" r="1" fill="white"/>
            <ellipse cx="60" cy="60" rx="5" ry="4" fill="#8B4513"/>
            <path d="M54 66 Q60 72 66 66" stroke="#4A3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M53 64 Q60 69 67 64" stroke="#FFB6C1" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
            <ellipse cx="40" cy="58" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="80" cy="58" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <rect x="85" y="65" width="25" height="4" fill="#8B4513" rx="2"/>
            <rect x="90" y="55" width="18" height="12" fill="#FFE4B5" rx="2"/>
            <rect x="92" y="58" width="14" height="6" fill="#8B4513" rx="1"/>
        </svg>`
    },
    alaska: {
        id: 'alaska',
        name: '阿拉斯加',
        emoji: '🐕',
        idle: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="85" rx="30" ry="20" fill="#F5F5F5"/>
            <ellipse cx="40" cy="90" rx="10" ry="8" fill="#F5F5F5"/>
            <ellipse cx="80" cy="90" rx="10" ry="8" fill="#F5F5F5"/>
            <circle cx="60" cy="42" r="34" fill="#F5F5F5"/>
            <polygon points="30,22 42,45 20,38" fill="#F5F5F5"/>
            <polygon points="90,22 78,45 100,38" fill="#F5F5F5"/>
            <polygon points="34,26 42,42 26,35" fill="#FFB6C1"/>
            <polygon points="86,26 78,42 94,35" fill="#FFB6C1"/>
            <ellipse cx="48" cy="40" rx="9" ry="11" fill="white"/>
            <ellipse cx="72" cy="40" rx="9" ry="11" fill="white"/>
            <ellipse cx="48" cy="42" rx="6" ry="8" fill="#333"/>
            <ellipse cx="72" cy="42" rx="6" ry="8" fill="#333"/>
            <circle cx="49" cy="40" r="3.5" fill="#1a1a1a"/>
            <circle cx="73" cy="40" r="3.5" fill="#1a1a1a"/>
            <circle cx="52" cy="38" r="1.8" fill="white"/>
            <circle cx="76" cy="38" r="1.8" fill="white"/>
            <circle cx="53" cy="37" r="0.7" fill="#1a1a1a"/>
            <circle cx="77" cy="37" r="0.7" fill="#1a1a1a"/>
            <ellipse cx="60" cy="54" rx="6" ry="5" fill="#333"/>
            <path d="M53 60 Q60 67 67 60" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M52 58 Q60 65 68 58" stroke="#FFB6C1" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
            <ellipse cx="38" cy="52" rx="9" ry="5" fill="#FFB6C1" opacity="0.3"/>
            <ellipse cx="82" cy="52" rx="9" ry="5" fill="#FFB6C1" opacity="0.3"/>
            <path d="M25 45 Q18 40 20 50" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M25 49 Q18 44 20 54" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M25 53 Q18 48 20 58" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 45 Q102 40 100 50" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 49 Q102 44 100 54" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 53 Q102 48 100 58" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M75 75 Q95 55 105 75 Q95 90 75 85" fill="#E8E8E8"/>
        </svg>`,
        work: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="85" rx="30" ry="20" fill="#F5F5F5"/>
            <ellipse cx="40" cy="90" rx="10" ry="8" fill="#F5F5F5"/>
            <ellipse cx="80" cy="90" rx="10" ry="8" fill="#F5F5F5"/>
            <circle cx="60" cy="42" r="34" fill="#F5F5F5"/>
            <polygon points="30,22 42,45 20,38" fill="#F5F5F5"/>
            <polygon points="90,22 78,45 100,38" fill="#F5F5F5"/>
            <rect x="36" y="32" rx="10" ry="10" width="48" height="22" fill="#333"/>
            <rect x="40" y="36" rx="7" ry="7" width="40" height="14" fill="#E8E8E8"/>
            <circle cx="48" cy="44" r="4" fill="#333"/>
            <circle cx="72" cy="44" r="4" fill="#333"/>
            <circle cx="49" cy="43" r="1.5" fill="white"/>
            <circle cx="73" cy="43" r="1.5" fill="white"/>
            <ellipse cx="60" cy="60" rx="6" ry="5" fill="#333"/>
            <path d="M53 66 Q60 73 67 66" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M52 64 Q60 71 68 64" stroke="#FFB6C1" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
            <ellipse cx="38" cy="58" rx="9" ry="5" fill="#FFB6C1" opacity="0.3"/>
            <ellipse cx="82" cy="58" rx="9" ry="5" fill="#FFB6C1" opacity="0.3"/>
            <rect x="25" y="65" width="8" height="28" fill="#8B4513"/>
            <rect x="25" y="65" width="8" height="10" fill="#CD853F"/>
            <path d="M33 68 Q40 65 38 72" stroke="#8B4513" stroke-width="2" fill="none"/>
        </svg>`
    },
    silver_shorthair: {
        id: 'silver_shorthair',
        name: '银渐层',
        emoji: '🐱',
        idle: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="78" rx="24" ry="16" fill="#D0D0D0"/>
            <ellipse cx="42" cy="82" rx="8" ry="6" fill="#D0D0D0"/>
            <ellipse cx="78" cy="82" rx="8" ry="6" fill="#D0D0D0"/>
            <circle cx="60" cy="40" r="32" fill="#D8D8D8"/>
            <polygon points="30,25 42,45 22,38" fill="#D8D8D8"/>
            <polygon points="90,25 78,45 98,38" fill="#D8D8D8"/>
            <polygon points="34,28 42,42 28,35" fill="#FFB6C1"/>
            <polygon points="86,28 78,42 92,35" fill="#FFB6C1"/>
            <ellipse cx="48" cy="38" rx="10" ry="12" fill="white"/>
            <ellipse cx="72" cy="38" rx="10" ry="12" fill="white"/>
            <ellipse cx="48" cy="40" rx="7" ry="9" fill="#333"/>
            <ellipse cx="72" cy="40" rx="7" ry="9" fill="#333"/>
            <ellipse cx="49" cy="38" rx="4" ry="6" fill="#555"/>
            <ellipse cx="73" cy="38" rx="4" ry="6" fill="#555"/>
            <circle cx="52" cy="36" r="2" fill="white"/>
            <circle cx="76" cy="36" r="2" fill="white"/>
            <circle cx="53" cy="35" r="0.8" fill="#1a1a1a"/>
            <circle cx="77" cy="35" r="0.8" fill="#1a1a1a"/>
            <ellipse cx="60" cy="52" rx="3" ry="2" fill="#FFB6C1"/>
            <path d="M55 54 L53 58 M65 54 L67 58" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M52 54 Q60 59 68 54" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="40" cy="50" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="80" cy="50" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <path d="M25 42 Q18 38 20 46" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M25 46 Q18 42 20 50" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M25 50 Q18 46 20 54" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 42 Q102 38 100 46" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 46 Q102 42 100 50" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 50 Q102 46 100 54" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M75 70 Q90 60 85 75" fill="#D0D0D0"/>
        </svg>`,
        work: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="78" rx="24" ry="16" fill="#D0D0D0"/>
            <ellipse cx="42" cy="82" rx="8" ry="6" fill="#D0D0D0"/>
            <ellipse cx="78" cy="82" rx="8" ry="6" fill="#D0D0D0"/>
            <circle cx="60" cy="40" r="32" fill="#D8D8D8"/>
            <polygon points="30,25 42,45 22,38" fill="#D8D8D8"/>
            <polygon points="90,25 78,45 98,38" fill="#D8D8D8"/>
            <rect x="38" y="32" rx="10" ry="10" width="44" height="20" fill="#333"/>
            <rect x="42" y="36" rx="7" ry="7" width="36" height="12" fill="#E8E8E8"/>
            <circle cx="48" cy="44" r="4" fill="#333"/>
            <circle cx="72" cy="44" r="4" fill="#333"/>
            <circle cx="49" cy="43" r="1.5" fill="white"/>
            <circle cx="73" cy="43" r="1.5" fill="white"/>
            <ellipse cx="60" cy="58" rx="3" ry="2" fill="#FFB6C1"/>
            <path d="M55 60 L53 64 M65 60 L67 64" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M52 60 Q60 65 68 60" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="40" cy="56" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="80" cy="56" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <rect x="25" y="62" width="8" height="25" fill="#8B4513"/>
            <rect x="25" y="62" width="8" height="10" fill="#CD853F"/>
        </svg>`
    },
    calico: {
        id: 'calico',
        name: '三花猫',
        emoji: '🐈',
        idle: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="78" rx="24" ry="16" fill="#FFE4C4"/>
            <ellipse cx="42" cy="82" rx="8" ry="6" fill="#333"/>
            <ellipse cx="78" cy="82" rx="8" ry="6" fill="#333"/>
            <circle cx="60" cy="40" r="32" fill="#FFE4C4"/>
            <polygon points="30,25 42,45 22,38" fill="#FFE4C4"/>
            <polygon points="90,25 78,45 98,38" fill="#FF6B6B"/>
            <polygon points="34,28 42,42 28,35" fill="#FFB6C1"/>
            <polygon points="86,28 78,42 92,35" fill="#FFB6C1"/>
            <ellipse cx="35" cy="48" rx="12" ry="10" fill="#333"/>
            <ellipse cx="48" cy="38" rx="10" ry="12" fill="white"/>
            <ellipse cx="72" cy="38" rx="10" ry="12" fill="white"/>
            <ellipse cx="48" cy="40" rx="7" ry="9" fill="#333"/>
            <ellipse cx="72" cy="40" rx="7" ry="9" fill="#333"/>
            <ellipse cx="49" cy="38" rx="4" ry="6" fill="#555"/>
            <ellipse cx="73" cy="38" rx="4" ry="6" fill="#555"/>
            <circle cx="52" cy="36" r="2" fill="white"/>
            <circle cx="76" cy="36" r="2" fill="white"/>
            <circle cx="53" cy="35" r="0.8" fill="#1a1a1a"/>
            <circle cx="77" cy="35" r="0.8" fill="#1a1a1a"/>
            <ellipse cx="60" cy="52" rx="3" ry="2" fill="#FFB6C1"/>
            <path d="M55 54 L53 58 M65 54 L67 58" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M52 54 Q60 59 68 54" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="40" cy="50" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="80" cy="50" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <path d="M25 42 Q18 38 20 46" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M25 46 Q18 42 20 50" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M25 50 Q18 46 20 54" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 42 Q102 38 100 46" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 46 Q102 42 100 50" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M95 50 Q102 46 100 54" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M75 70 Q90 60 85 75" fill="#FF6B6B"/>
        </svg>`,
        work: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="78" rx="24" ry="16" fill="#FFE4C4"/>
            <ellipse cx="42" cy="82" rx="8" ry="6" fill="#333"/>
            <ellipse cx="78" cy="82" rx="8" ry="6" fill="#333"/>
            <circle cx="60" cy="40" r="32" fill="#FFE4C4"/>
            <polygon points="30,25 42,45 22,38" fill="#FFE4C4"/>
            <polygon points="90,25 78,45 98,38" fill="#FF6B6B"/>
            <rect x="38" y="32" rx="10" ry="10" width="44" height="20" fill="#333"/>
            <rect x="42" y="36" rx="7" ry="7" width="36" height="12" fill="#E8E8E8"/>
            <circle cx="48" cy="44" r="4" fill="#333"/>
            <circle cx="72" cy="44" r="4" fill="#333"/>
            <circle cx="49" cy="43" r="1.5" fill="white"/>
            <circle cx="73" cy="43" r="1.5" fill="white"/>
            <ellipse cx="60" cy="58" rx="3" ry="2" fill="#FFB6C1"/>
            <path d="M55 60 L53 64 M65 60 L67 64" stroke="#333" stroke-width="1.5" fill="none"/>
            <path d="M52 60 Q60 65 68 60" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="40" cy="56" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="80" cy="56" rx="8" ry="5" fill="#FFB6C1" opacity="0.35"/>
            <rect x="25" y="62" width="8" height="25" fill="#8B4513"/>
            <rect x="25" y="62" width="8" height="10" fill="#CD853F"/>
        </svg>`
    },
    bird: {
        id: 'bird',
        name: '小鸟',
        emoji: '🐦',
        idle: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="60" rx="22" ry="25" fill="#FF6B6B"/>
            <circle cx="60" cy="35" r="20" fill="#FF6B6B"/>
            <ellipse cx="54" cy="28" rx="10" ry="12" fill="#FFD700"/>
            <ellipse cx="66" cy="28" rx="10" ry="12" fill="#FFD700"/>
            <polygon points="60,38 54,52 66,52" fill="#FFD700"/>
            <ellipse cx="52" cy="34" rx="7" ry="9" fill="white"/>
            <ellipse cx="68" cy="34" rx="7" ry="9" fill="white"/>
            <ellipse cx="52" cy="36" rx="5" ry="7" fill="#333"/>
            <ellipse cx="68" cy="36" rx="5" ry="7" fill="#333"/>
            <circle cx="53" cy="34" r="3" fill="#1a1a1a"/>
            <circle cx="69" cy="34" r="3" fill="#1a1a1a"/>
            <circle cx="56" cy="32" r="1.5" fill="white"/>
            <circle cx="72" cy="32" r="1.5" fill="white"/>
            <circle cx="57" cy="31" r="0.6" fill="#1a1a1a"/>
            <circle cx="73" cy="31" r="0.6" fill="#1a1a1a"/>
            <path d="M54 48 Q60 53 66 48" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M53 46 Q60 51 67 46" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="44" cy="46" rx="6" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="76" cy="46" rx="6" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <path d="M25 50 Q12 42 20 58 Q28 66 35 55" fill="#FF6B6B"/>
            <path d="M95 50 Q108 42 100 58 Q92 66 85 55" fill="#FF6B6B"/>
            <circle cx="45" cy="78" r="6" fill="#333"/>
            <circle cx="75" cy="78" r="6" fill="#333"/>
        </svg>`,
        work: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="60" rx="22" ry="25" fill="#FF6B6B"/>
            <circle cx="60" cy="35" r="20" fill="#FF6B6B"/>
            <ellipse cx="54" cy="28" rx="10" ry="12" fill="#FFD700"/>
            <ellipse cx="66" cy="28" rx="10" ry="12" fill="#FFD700"/>
            <rect x="42" y="28" rx="8" ry="8" width="36" height="16" fill="#333"/>
            <rect x="45" y="31" rx="5" ry="5" width="30" height="10" fill="#E8E8E8"/>
            <circle cx="52" cy="38" r="3" fill="#333"/>
            <circle cx="68" cy="38" r="3" fill="#333"/>
            <circle cx="53" cy="37" r="1" fill="white"/>
            <circle cx="69" cy="37" r="1" fill="white"/>
            <polygon points="60,52 54,62 66,62" fill="#FFD700"/>
            <path d="M54 56 Q60 61 66 56" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M53 54 Q60 59 67 54" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="44" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="76" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <path d="M25 50 Q12 42 20 58 Q28 66 35 55" fill="#FF6B6B"/>
            <path d="M95 50 Q108 42 100 58 Q92 66 85 55" fill="#FF6B6B"/>
            <rect x="85" y="58" width="22" height="4" fill="#8B4513" rx="2"/>
            <rect x="90" y="48" width="14" height="12" fill="#FFE4B5" rx="2"/>
            <circle cx="45" cy="78" r="6" fill="#333"/>
            <circle cx="75" cy="78" r="6" fill="#333"/>
        </svg>`
    },
    duck: {
        id: 'duck',
        name: '鸭子',
        emoji: '🦆',
        idle: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="72" rx="28" ry="22" fill="#FFD700"/>
            <circle cx="60" cy="42" r="24" fill="#FFD700"/>
            <ellipse cx="60" cy="58" rx="16" ry="14" fill="#FFD700"/>
            <rect x="54" y="58" width="12" height="20" fill="#FFA500"/>
            <rect x="50" y="72" width="20" height="10" rx="5" fill="#FFA500"/>
            <ellipse cx="48" cy="38" rx="7" ry="9" fill="white"/>
            <ellipse cx="72" cy="38" rx="7" ry="9" fill="white"/>
            <ellipse cx="48" cy="40" rx="5" ry="7" fill="#333"/>
            <ellipse cx="72" cy="40" rx="5" ry="7" fill="#333"/>
            <circle cx="49" cy="38" r="3" fill="#1a1a1a"/>
            <circle cx="73" cy="38" r="3" fill="#1a1a1a"/>
            <circle cx="52" cy="36" r="1.5" fill="white"/>
            <circle cx="76" cy="36" r="1.5" fill="white"/>
            <circle cx="53" cy="35" r="0.6" fill="#1a1a1a"/>
            <circle cx="77" cy="35" r="0.6" fill="#1a1a1a"/>
            <ellipse cx="45" cy="30" rx="10" ry="7" fill="#FFD700"/>
            <ellipse cx="75" cy="30" rx="10" ry="7" fill="#FFD700"/>
            <path d="M56 52 Q60 56 64 52" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M55 50 Q60 54 65 50" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="42" cy="48" rx="6" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="78" cy="48" rx="6" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="42" cy="82" rx="10" ry="8" fill="#FFD700"/>
            <ellipse cx="78" cy="82" rx="10" ry="8" fill="#FFD700"/>
        </svg>`,
        work: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="72" rx="28" ry="22" fill="#FFD700"/>
            <circle cx="60" cy="42" r="24" fill="#FFD700"/>
            <rect x="40" y="30" rx="10" ry="10" width="40" height="18" fill="#333"/>
            <rect x="44" y="34" rx="7" ry="7" width="32" height="10" fill="#E8E8E8"/>
            <circle cx="48" cy="40" r="3" fill="#333"/>
            <circle cx="72" cy="40" r="3" fill="#333"/>
            <circle cx="49" cy="39" r="1" fill="white"/>
            <circle cx="73" cy="39" r="1" fill="white"/>
            <ellipse cx="60" cy="58" rx="16" ry="14" fill="#FFD700"/>
            <rect x="54" y="58" width="12" height="20" fill="#FFA500"/>
            <rect x="50" y="72" width="20" height="10" rx="5" fill="#FFA500"/>
            <path d="M56 62 Q60 66 64 62" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M55 60 Q60 64 65 60" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="42" cy="54" rx="6" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="78" cy="54" rx="6" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <rect x="88" y="62" width="24" height="4" fill="#8B4513" rx="2"/>
            <rect x="93" y="52" width="16" height="12" fill="#FFE4B5" rx="2"/>
            <ellipse cx="42" cy="82" rx="10" ry="8" fill="#FFD700"/>
            <ellipse cx="78" cy="82" rx="10" ry="8" fill="#FFD700"/>
        </svg>`
    },
    hamster: {
        id: 'hamster',
        name: '仓鼠',
        emoji: '🐹',
        idle: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="65" rx="32" ry="28" fill="#FFE4C4"/>
            <circle cx="60" cy="38" r="28" fill="#FFE4C4"/>
            <circle cx="32" cy="38" r="12" fill="#FFE4C4"/>
            <circle cx="88" cy="38" r="12" fill="#FFE4C4"/>
            <circle cx="32" cy="38" r="7" fill="#FFB6C1"/>
            <circle cx="88" cy="38" r="7" fill="#FFB6C1"/>
            <ellipse cx="50" cy="36" rx="8" ry="10" fill="white"/>
            <ellipse cx="70" cy="36" rx="8" ry="10" fill="white"/>
            <ellipse cx="50" cy="38" rx="6" ry="8" fill="#333"/>
            <ellipse cx="70" cy="38" rx="6" ry="8" fill="#333"/>
            <circle cx="51" cy="36" r="3.5" fill="#1a1a1a"/>
            <circle cx="71" cy="36" r="3.5" fill="#1a1a1a"/>
            <circle cx="54" cy="34" r="1.8" fill="white"/>
            <circle cx="74" cy="34" r="1.8" fill="white"/>
            <circle cx="55" cy="33" r="0.7" fill="#1a1a1a"/>
            <circle cx="75" cy="33" r="0.7" fill="#1a1a1a"/>
            <ellipse cx="60" cy="50" rx="5" ry="4" fill="#333"/>
            <path d="M54 56 Q60 62 66 56" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M53 54 Q60 60 67 54" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="42" cy="48" rx="7" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="78" cy="48" rx="7" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="32" cy="70" rx="14" ry="12" fill="#FFE4C4"/>
            <ellipse cx="88" cy="70" rx="14" ry="12" fill="#FFE4C4"/>
            <ellipse cx="32" cy="74" rx="10" ry="8" fill="#FFB6C1"/>
            <ellipse cx="88" cy="74" rx="10" ry="8" fill="#FFB6C1"/>
        </svg>`,
        work: `<svg viewBox="0 0 120 120">
            <ellipse cx="60" cy="65" rx="32" ry="28" fill="#FFE4C4"/>
            <circle cx="60" cy="38" r="28" fill="#FFE4C4"/>
            <circle cx="32" cy="38" r="12" fill="#FFE4C4"/>
            <circle cx="88" cy="38" r="12" fill="#FFE4C4"/>
            <circle cx="32" cy="38" r="7" fill="#FFB6C1"/>
            <circle cx="88" cy="38" r="7" fill="#FFB6C1"/>
            <rect x="40" y="30" rx="10" ry="10" width="40" height="18" fill="#333"/>
            <rect x="44" y="34" rx="7" ry="7" width="32" height="10" fill="#E8E8E8"/>
            <circle cx="50" cy="40" r="3" fill="#333"/>
            <circle cx="70" cy="40" r="3" fill="#333"/>
            <circle cx="51" cy="39" r="1" fill="white"/>
            <circle cx="71" cy="39" r="1" fill="white"/>
            <ellipse cx="60" cy="56" rx="5" ry="4" fill="#333"/>
            <path d="M54 62 Q60 68 66 62" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M53 60 Q60 66 67 60" stroke="#FFB6C1" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            <ellipse cx="42" cy="54" rx="7" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <ellipse cx="78" cy="54" rx="7" ry="4" fill="#FFB6C1" opacity="0.35"/>
            <rect x="88" y="62" width="24" height="4" fill="#8B4513" rx="2"/>
            <rect x="93" y="52" width="16" height="12" fill="#FFE4B5" rx="2"/>
            <ellipse cx="32" cy="70" rx="14" ry="12" fill="#FFE4C4"/>
            <ellipse cx="88" cy="70" rx="14" ry="12" fill="#FFE4C4"/>
            <ellipse cx="32" cy="74" rx="10" ry="8" fill="#FFB6C1"/>
            <ellipse cx="88" cy="74" rx="10" ry="8" fill="#FFB6C1"/>
        </svg>`
    }
};