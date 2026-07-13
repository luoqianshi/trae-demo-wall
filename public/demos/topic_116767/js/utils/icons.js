var Icons = (function() {
    'use strict';

    var S = 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" viewBox="0 0 24 24" width="20" height="20"';

    function svg(content) {
        return '<svg ' + S + '>' + content + '</svg>';
    }

    var icons = {
        home:
            svg(
                '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>' +
                '<polyline points="9,22 9,12 15,12 15,22"/>'
            ),

        clipboard:
            svg(
                '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>' +
                '<rect x="8" y="2" width="8" height="4" rx="1"/>'
            ),

        coins:
            svg(
                '<circle cx="8" cy="8" r="6"/>' +
                '<path d="M18.09 10.37A6 6 0 1120 16"/>' +
                '<path d="M12.93 18.67A4 4 0 1016 22"/>' +
                '<path d="M15.59 14.37A2 2 0 1018 16"/>'
            ),

        ruler:
            svg(
                '<path d="M21.3 15.3a2.4 2.4 0 00.1-2.6L15 3.6a2.4 2.4 0 00-2.1-1.3H5.5a2.4 2.4 0 00-2.1 3.6L8.9 18.4a2.4 2.4 0 002.1 1.3h7.4a2.4 2.4 0 001.9-.9"/>' +
                '<path d="M14.5 7.5l-2.1 3.6 2.1 3.6"/>' +
                '<path d="M10.4 7.5l-2.1 3.6 2.1 3.6"/>'
            ),

        hammer:
            svg(
                '<path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9"/>' +
                '<path d="M17.64 15L22 10.64a2.12 2.12 0 00-3-3L14.5 12"/>' +
                '<path d="M2 22l5-5"/>'
            ),

        window:
            svg(
                '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
                '<line x1="12" y1="3" x2="12" y2="21"/>' +
                '<line x1="3" y1="12" x2="21" y2="12"/>'
            ),

        sofa:
            svg(
                '<path d="M4 11V8a2 2 0 012-2h12a2 2 0 012 2v3"/>' +
                '<path d="M2 11v5a2 2 0 002 2h16a2 2 0 002-2v-5a2 2 0 00-4 0v1H6v-1a2 2 0 00-4 0z"/>' +
                '<path d="M4 18v2"/>' +
                '<path d="M20 18v2"/>' +
                '<path d="M6 14h12"/>'
            ),

        sparkles:
            svg(
                '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>' +
                '<path d="M18 14l.9 2.7L21.6 17.6l-2.7.9L18 21.2l-.9-2.7L14.4 17.6l2.7-.9L18 14z"/>' +
                '<path d="M5 17l.6 1.8L7.4 19.4l-1.8.6L5 21.8l-.6-1.8L2.6 19.4l1.8-.6L5 17z"/>'
            ),

        trophy:
            svg(
                '<path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>' +
                '<path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>' +
                '<path d="M4 22h16"/>' +
                '<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>' +
                '<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>' +
                '<path d="M18 2H6v7a6 6 0 0012 0V2z"/>'
            ),

        party:
            svg(
                '<path d="M5.8 11.3L2 22l10.7-3.79"/>' +
                '<path d="M4 3h.01"/>' +
                '<path d="M22 8h.01"/>' +
                '<path d="M15 2h.01"/>' +
                '<path d="M22 20h.01"/>' +
                '<path d="M22 2l-2.24.75a2.9 2.9 0 00-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/>' +
                '<path d="M22 13l-2.24.75a2.9 2.9 0 00-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 20"/>' +
                '<path d="M2 8l2.24-.75A2.9 2.9 0 006.2 4.13c-.1-.86.57-1.63 1.45-1.63h.38c.86 0 1.6-.6 1.76-1.44L10 2"/>'
            ),

        box:
            svg(
                '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>' +
                '<polyline points="3.27,6.96 12,12.01 20.73,6.96"/>' +
                '<line x1="12" y1="22.08" x2="12" y2="12"/>'
            ),

        lightbulb:
            svg(
                '<path d="M9 18h6"/>' +
                '<path d="M10 22h4"/>' +
                '<path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/>'
            ),

        wrench:
            svg(
                '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>'
            ),

        scroll:
            svg(
                '<path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 01-2 2 2 2 0 01-2-2V5a2 2 0 012-2h1a2 2 0 012 2v12"/>' +
                '<path d="M19 3H9v7h12"/>' +
                '<path d="M12 3v0"/>'
            ),

        paintbrush:
            svg(
                '<path d="M18.37 2.63a2.12 2.12 0 013 3L14 13l-4 1 1-4 7.37-7.37z"/>' +
                '<path d="M9 15v-2a1 1 0 011-1h0a1 1 0 011 1v2"/>' +
                '<path d="M9 17v2a2 2 0 01-2 2 2 2 0 01-2-2v-2"/>'
            ),

        key:
            svg(
                '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'
            ),

        vase:
            svg(
                '<path d="M9 3h6"/>' +
                '<path d="M8.5 7h7"/>' +
                '<path d="M7 11c-1.5 2-2 4.5-1 7s3.5 4 6 4 5-1.5 6-4-.5-5-2-7"/>' +
                '<path d="M10 7v4"/>' +
                '<path d="M14 7v4"/>'
            ),

        gift:
            svg(
                '<rect x="3" y="8" width="18" height="4" rx="1"/>' +
                '<path d="M12 8v13"/>' +
                '<path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/>' +
                '<path d="M7.5 8a2.5 2.5 0 010-5C9 3 12 8 12 8"/>' +
                '<path d="M16.5 8a2.5 2.5 0 000-5C14 3 12 8 12 8"/>'
            ),

        clock:
            svg(
                '<circle cx="12" cy="12" r="10"/>' +
                '<polyline points="12,6 12,12 16,14"/>'
            ),

        'shopping-cart':
            svg(
                '<circle cx="8" cy="21" r="1"/>' +
                '<circle cx="19" cy="21" r="1"/>' +
                '<path d="M2.05 2.05h2l2.66 12.42a2 2 0 002 1.58h9.78a2 2 0 002-1.58l1.3-6.02a1 1 0 00-.98-1.23H5.82"/>'
            ),

        'bar-chart':
            svg(
                '<line x1="12" y1="20" x2="12" y2="10"/>' +
                '<line x1="18" y1="20" x2="18" y2="4"/>' +
                '<line x1="6" y1="20" x2="6" y2="16"/>'
            ),

        image:
            svg(
                '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
                '<circle cx="8.5" cy="8.5" r="1.5"/>' +
                '<polyline points="21,15 16,10 5,21"/>'
            ),

        plant:
            svg(
                '<path d="M7 20h10"/>' +
                '<path d="M10 20c5.5-2.5.8-6.4 3-10"/>' +
                '<path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>' +
                '<path d="M14.1 6a7 7 0 00-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>'
            ),

        'trending-up':
            svg(
                '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>' +
                '<polyline points="17,6 23,6 23,12"/>'
            ),

        'nian-default':
            '<img src="images/nian-icons/nian-default.png" class="housekeeper-icon housekeeper-default" width="20" height="20" alt="小管家"/>',

        'nian-happy':
            '<img src="images/nian-icons/nian-happy.png" class="housekeeper-icon housekeeper-happy" width="20" height="20" alt="小管家开心"/>',

        'nian-confused':
            '<img src="images/nian-icons/nian-confused.png" class="housekeeper-icon housekeeper-confused" width="20" height="20" alt="小管家困惑"/>',

        'nian-nervous':
            '<img src="images/nian-icons/nian-nervous.png" class="housekeeper-icon housekeeper-nervous" width="20" height="20" alt="小管家紧张"/>',

        'arrow-left':
            svg(
                '<line x1="19" y1="12" x2="5" y2="12"/>' +
                '<polyline points="12,19 5,12 12,5"/>'
            ),

        close:
            svg(
                '<line x1="18" y1="6" x2="6" y2="18"/>' +
                '<line x1="6" y1="6" x2="18" y2="18"/>'
            ),

        check:
            svg(
                '<polyline points="20,6 9,17 4,12"/>'
            ),

        star:
            '<svg ' + S + ' fill="var(--zhu-red)" stroke="var(--zhu-red)">' +
                '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>' +
            '</svg>',

        sparkle:
            svg(
                '<path d="M12 8l1.5 4.5L18 14l-4.5 1.5L12 20l-1.5-4.5L6 14l4.5-1.5L12 8z"/>'
            ),

        'chevron-down':
            svg(
                '<polyline points="6,9 12,15 18,9"/>'
            ),

        'chevron-right':
            svg(
                '<polyline points="9,6 15,12 9,18"/>'
            ),

        'chevron-left':
            svg(
                '<polyline points="15,6 9,12 15,18"/>'
            ),

        gem:
            svg(
                '<path d="M6 3h12l4 6-10 13L2 9z"/>' +
                '<path d="M2 9h20"/>' +
                '<path d="M10 3l-4 6"/>' +
                '<path d="M14 3l4 6"/>'
            ),

        calendar:
            svg(
                '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
                '<line x1="16" y1="2" x2="16" y2="6"/>' +
                '<line x1="8" y1="2" x2="8" y2="6"/>' +
                '<line x1="3" y1="10" x2="21" y2="10"/>'
            ),

        lock:
            svg(
                '<rect x="5" y="11" width="14" height="10" rx="2"/>' +
                '<path d="M7 11V7a5 5 0 0110 0v4"/>' +
                '<circle cx="12" cy="16" r="1"/>'
            ),

        x:
            svg(
                '<line x1="18" y1="6" x2="6" y2="18"/>' +
                '<line x1="6" y1="6" x2="18" y2="18"/>'
            ),

        pencil:
            svg(
                '<path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>'
            ),

        search:
            svg(
                '<circle cx="11" cy="11" r="8"/>' +
                '<line x1="21" y1="21" x2="16.65" y2="16.65"/>'
            ),

        'alert-triangle':
            svg(
                '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>' +
                '<line x1="12" y1="9" x2="12" y2="13"/>' +
                '<line x1="12" y1="17" x2="12.01" y2="17"/>'
            ),

        clapperboard:
            svg(
                '<path d="M20.2 7l-3.4 5H2v13a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-1.8-2z"/>' +
                '<path d="M20.2 7l-7-5-7 5h14z"/>' +
                '<line x1="13.2" y1="2" x2="6.2" y2="7"/>'
            ),

        pause:
            svg(
                '<rect x="6" y="4" width="4" height="16" rx="1"/>' +
                '<rect x="14" y="4" width="4" height="16" rx="1"/>'
            ),

        target:
            svg(
                '<circle cx="12" cy="12" r="10"/>' +
                '<circle cx="12" cy="12" r="6"/>' +
                '<circle cx="12" cy="12" r="2"/>'
            ),

        wallet:
            svg(
                '<path d="M21 12V7H5a2 2 0 010-4h14v4"/>' +
                '<path d="M3 5v14a2 2 0 002 2h16v-5"/>' +
                '<path d="M18 12a2 2 0 000 4h4v-4z"/>'
            ),

        user:
            svg(
                '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>' +
                '<circle cx="12" cy="7" r="4"/>'
            ),

        settings:
            svg(
                '<circle cx="12" cy="12" r="3"/>' +
                '<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>'
            ),

        plus:
            svg(
                '<line x1="12" y1="5" x2="12" y2="19"/>' +
                '<line x1="5" y1="12" x2="19" y2="12"/>'
            ),

        'plus-circle':
            svg(
                '<circle cx="12" cy="12" r="10"/>' +
                '<line x1="12" y1="8" x2="12" y2="16"/>' +
                '<line x1="8" y1="12" x2="16" y2="12"/>'
            ),

        trash:
            svg(
                '<polyline points="3,6 5,6 21,6"/>' +
                '<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>' +
                '<line x1="10" y1="11" x2="10" y2="17"/>' +
                '<line x1="14" y1="11" x2="14" y2="17"/>'
            ),

        share:
            svg(
                '<circle cx="18" cy="5" r="3"/>' +
                '<circle cx="6" cy="12" r="3"/>' +
                '<circle cx="18" cy="19" r="3"/>' +
                '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>' +
                '<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'
            ),

        'check-circle':
            svg(
                '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>' +
                '<polyline points="22,4 12,14.01 9,11.01"/>'
            ),

        'x-circle':
            svg(
                '<circle cx="12" cy="12" r="10"/>' +
                '<line x1="15" y1="9" x2="9" y2="15"/>' +
                '<line x1="9" y1="9" x2="15" y2="15"/>'
            ),

        'info-icon':
            svg(
                '<circle cx="12" cy="12" r="10"/>' +
                '<line x1="12" y1="16" x2="12" y2="12"/>' +
                '<line x1="12" y1="8" x2="12.01" y2="8"/>'
            ),

        'alert-circle':
            svg(
                '<circle cx="12" cy="12" r="10"/>' +
                '<line x1="12" y1="8" x2="12" y2="12"/>' +
                '<line x1="12" y1="16" x2="12.01" y2="16"/>'
            ),

        loader:
            svg(
                '<line x1="12" y1="2" x2="12" y2="6"/>' +
                '<line x1="12" y1="18" x2="12" y2="22"/>' +
                '<line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>' +
                '<line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>' +
                '<line x1="2" y1="12" x2="6" y2="12"/>' +
                '<line x1="18" y1="12" x2="22" y2="12"/>' +
                '<line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>' +
                '<line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>'
            ),

        calculator:
            svg(
                '<rect x="4" y="2" width="16" height="20" rx="2"/>' +
                '<line x1="8" y1="6" x2="16" y2="6"/>' +
                '<line x1="8" y1="10" x2="8" y2="10"/>' +
                '<line x1="12" y1="10" x2="12" y2="10"/>' +
                '<line x1="16" y1="10" x2="16" y2="10"/>' +
                '<line x1="8" y1="14" x2="8" y2="14"/>' +
                '<line x1="12" y1="14" x2="12" y2="14"/>' +
                '<line x1="16" y1="14" x2="16" y2="14"/>' +
                '<line x1="8" y1="18" x2="8" y2="18"/>' +
                '<line x1="12" y1="18" x2="12" y2="18"/>' +
                '<line x1="16" y1="18" x2="16" y2="18"/>'
            ),

        bed:
            svg(
                '<path d="M2 4v16"/>' +
                '<path d="M2 8h18a2 2 0 012 2v10"/>' +
                '<path d="M2 17h20"/>' +
                '<path d="M6 8v9"/>'
            ),

        table:
            svg(
                '<path d="M3 10h18"/>' +
                '<path d="M5 10v10"/>' +
                '<path d="M19 10v10"/>' +
                '<path d="M3 14h18"/>'
            ),

        chair:
            svg(
                '<path d="M7 11h10v4H7z"/>' +
                '<path d="M7 15v4"/>' +
                '<path d="M17 15v4"/>' +
                '<path d="M7 11V7a2 2 0 012-2h6a2 2 0 012 2v4"/>'
            ),

        lamp:
            svg(
                '<path d="M9 2h6l3 7H6z"/>' +
                '<path d="M12 9v4"/>' +
                '<path d="M8 13h8v2H8z"/>' +
                '<path d="M12 15v5"/>' +
                '<path d="M9 20h6"/>'
            ),

        door:
            svg(
                '<rect x="4" y="2" width="16" height="20" rx="1"/>' +
                '<circle cx="17" cy="12" r="1.5"/>'
            ),

        heart:
            svg(
                '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>'
            ),

        book:
            svg(
                '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>' +
                '<path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>'
            ),

        'chevron-up':
            svg(
                '<polyline points="18,15 12,9 6,15"/>'
            ),

        'arrow-right':
            svg(
                '<line x1="5" y1="12" x2="19" y2="12"/>' +
                '<polyline points="12,5 19,12 12,19"/>'
            ),

        'arrow-down':
            svg(
                '<line x1="12" y1="5" x2="12" y2="19"/>' +
                '<polyline points="19,12 12,19 5,12"/>'
            ),

        'arrow-up':
            svg(
                '<line x1="12" y1="19" x2="12" y2="5"/>' +
                '<polyline points="5,12 12,5 19,12"/>'
            ),

        home2:
            svg(
                '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>' +
                '<polyline points="9,22 9,12 15,12 15,22"/>'
            ),

        clipboard2:
            svg(
                '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>' +
                '<rect x="8" y="2" width="8" height="4" rx="1"/>'
            ),

        'thumb-up':
            svg(
                '<path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>'
            ),

        medal:
            svg(
                '<path d="M7.21 15l1.1 5.5a2 2 0 002 1.5h3.38a2 2 0 002-1.5L16.79 15"/>' +
                '<circle cx="12" cy="9" r="7"/>'
            ),

        flag:
            svg(
                '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>' +
                '<line x1="4" y1="22" x2="4" y2="15"/>'
            ),

        zap:
            svg(
                '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>'
            ),

        shirt:
            svg(
                '<path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>'
            )
    };

    function get(name) {
        return icons[name] || icons.sparkle;
    }

    function render(name, className) {
        var svgStr = get(name);
        var cls = className ? 'icon ' + className : 'icon';
        return '<span class="' + cls + '">' + svgStr + '</span>';
    }

    return {
        get: get,
        render: render
    };
})();
