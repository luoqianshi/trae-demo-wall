/**
 * AESTHETICS.js — Motion Design Aesthetics Knowledge System for WebMotion
 *
 * A self-contained, pro-level design knowledge engine. Provides color harmony,
 * typography rules, composition theory, motion aesthetics, visual hierarchy,
 * effects guidelines, and scene design patterns. Used by the AI module to
 * inject informed design decisions into generated animations.
 *
 * Integrates with TOKENS system (single source of truth from source.json).
 * No external dependencies. Exported as `window.AESTHETICS`.
 *
 * @module AESTHETICS
 * @author WebMotion
 */

/* ==========================================================================
   TOKENS Integration (Single Source of Truth)
   ========================================================================== */

// Get palette from TOKENS if available (LOOP refactor)
function _getDefaultPalette() {
  if (typeof TOKENS !== 'undefined' && TOKENS.palette) {
    return TOKENS.palette;
  }
  return ['#c9a96e', '#5eead4', '#a78bfa', '#fb7185', '#f59e0b'];
}

// Get spacing from TOKENS
function _getSpace(token) {
  if (typeof TOKENS !== 'undefined' && TOKENS.space && typeof TOKENS.space[token] !== 'undefined') {
    return TOKENS.space[token];
  }
  const defaults = { xs: 8, sm: 16, md: 24, lg: 32, xl: 48, xxl: 96 };
  return defaults[token] || defaults.sm;
}

// Get font size from TOKENS
function _getFontSize(token) {
  if (typeof TOKENS !== 'undefined' && TOKENS.fontSize && typeof TOKENS.fontSize[token] !== 'undefined') {
    return TOKENS.fontSize[token];
  }
  const defaults = { hero: 96, h1: 64, h2: 48, h3: 36, body: 24, caption: 16, small: 13 };
  return defaults[token] || defaults.body;
}

// Get motion duration from TOKENS
function _getDuration(token) {
  if (typeof TOKENS !== 'undefined' && TOKENS.motion && TOKENS.motion.duration && typeof TOKENS.motion.duration[token] !== 'undefined') {
    return parseFloat(TOKENS.motion.duration[token]);
  }
  const defaults = { instant: 0.15, fast: 0.3, normal: 0.5, slow: 0.8, dramatic: 1.2 };
  return defaults[token] || defaults.normal;
}

// Get motion easing from TOKENS
function _getEasing(token) {
  if (typeof TOKENS !== 'undefined' && TOKENS.motion && TOKENS.motion.easing && typeof TOKENS.motion.easing[token] !== 'undefined') {
    return TOKENS.motion.easing[token];
  }
  const defaults = { out: 'cubic-bezier(0.16,1,0.3,1)', inOut: 'cubic-bezier(0.65,0,0.35,1)', spring: 'cubic-bezier(0.34,1.56,0.64,1)' };
  return defaults[token] || defaults.out;
}

/* ==========================================================================
   Internal Color Utility Functions
   ========================================================================== */

/**
 * Convert a HEX color string to { r, g, b } (0-255).
 * @param {string} hex - Color in #RRGGBB or #RGB form.
 * @returns {{ r: number, g: number, b: number }}
 */
function _hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Convert { r, g, b } (0-255) to { h, s, l } (h 0-360, s/l 0-1).
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {{ h: number, s: number, l: number }}
 */
function _rgbToHsl(rgb) {
  var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: s, l: l };
}

/**
 * Convert { h, s, l } (h 0-360, s/l 0-1) to { r, g, b } (0-255).
 * @param {{ h: number, s: number, l: number }} hsl
 * @returns {{ r: number, g: number, b: number }}
 */
function _hslToRgb(hsl) {
  var h = hsl.h / 360, s = hsl.s, l = hsl.l;
  var r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    var hue2rgb = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Convert { r, g, b } (0-255) back to a HEX string.
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {string}
 */
function _rgbToHex(rgb) {
  return '#' + [rgb.r, rgb.g, rgb.b].map(function (v) {
    var hex = v.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Rotate an HSL color's hue by `deg` degrees.
 */
function _rotateHue(hex, deg) {
  var rgb = _hexToRgb(hex);
  var hsl = _rgbToHsl(rgb);
  hsl.h = ((hsl.h + deg) % 360 + 360) % 360;
  return _rgbToHex(_hslToRgb(hsl));
}

/**
 * Set the lightness of a HEX color.
 */
function _setLightness(hex, newL) {
  var rgb = _hexToRgb(hex);
  var hsl = _rgbToHsl(rgb);
  hsl.l = Math.max(0, Math.min(1, newL));
  return _rgbToHex(_hslToRgb(hsl));
}

/**
 * Set the saturation of a HEX color.
 */
function _setSaturation(hex, newS) {
  var rgb = _hexToRgb(hex);
  var hsl = _rgbToHsl(rgb);
  hsl.s = Math.max(0, Math.min(1, newS));
  return _rgbToHex(_hslToRgb(hsl));
}

/**
 * Clamp a number between min and max.
 */
function _clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Linearly interpolate between two values.
 */
function _lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Generate a HEX string from h, s, l values.
 */
function _hslToHex(h, s, l) {
  return _rgbToHex(_hslToRgb({ h: h, s: s, l: l }));
}

/* ==========================================================================
   Curated Palette Data — Each palette is hand-crafted using color theory
   ========================================================================== */

var _PALETTES = {
  // Cool blue-cyan palette with electric accents
  tech: [
    { h: 220, s: 0.90, l: 0.55 },  // Electric blue
    { h: 195, s: 0.85, l: 0.50 },  // Vivid cyan
    { h: 250, s: 0.60, l: 0.65 },  // Soft violet
    { h: 175, s: 0.70, l: 0.45 },  // Teal
    { h: 200, s: 0.15, l: 0.95 },  // Ice white
    { h: 230, s: 0.80, l: 0.25 },  // Deep navy
    { h: 190, s: 0.95, l: 0.40 },  // Bright aqua
  ],
  // Warm amber-coral palette
  warm: [
    { h: 25, s: 0.90, l: 0.58 },   // Warm amber
    { h: 12, s: 0.80, l: 0.55 },   // Coral
    { h: 40, s: 0.85, l: 0.60 },   // Golden yellow
    { h: 350, s: 0.65, l: 0.45 },  // Warm rose
    { h: 30, s: 0.30, l: 0.92 },   // Cream
    { h: 18, s: 0.75, l: 0.30 },   // Burnt umber
    { h: 45, s: 0.70, l: 0.50 },   // Ochre
  ],
  // Cool blue-green palette with mint
  cool: [
    { h: 200, s: 0.75, l: 0.55 },  // Steel blue
    { h: 170, s: 0.65, l: 0.50 },  // Sea green
    { h: 220, s: 0.50, l: 0.60 },  // Periwinkle
    { h: 185, s: 0.80, l: 0.45 },  // Deep teal
    { h: 210, s: 0.20, l: 0.93 },  // Pale blue
    { h: 195, s: 0.70, l: 0.28 },  // Dark teal
    { h: 160, s: 0.55, l: 0.65 },  // Sage
  ],
  // High-energy red-orange-yellow palette
  energy: [
    { h: 0, s: 0.85, l: 0.55 },    // Vivid red
    { h: 25, s: 0.95, l: 0.55 },   // Hot orange
    { h: 50, s: 0.90, l: 0.55 },   // Bright yellow
    { h: 340, s: 0.80, l: 0.50 },  // Magenta
    { h: 15, s: 0.20, l: 0.95 },   // Warm white
    { h: 355, s: 0.75, l: 0.30 },  // Deep crimson
    { h: 40, s: 0.85, l: 0.50 },   // Dark gold
  ],
  // Calm muted palette with soft tones
  calm: [
    { h: 210, s: 0.40, l: 0.70 },  // Dusty blue
    { h: 180, s: 0.35, l: 0.65 },  // Soft mint
    { h: 200, s: 0.30, l: 0.75 },  // Powder blue
    { h: 160, s: 0.25, l: 0.70 },  // Seafoam
    { h: 220, s: 0.15, l: 0.95 },  // Cloud white
    { h: 190, s: 0.35, l: 0.40 },  // Muted teal
    { h: 170, s: 0.30, l: 0.60 },  // Eucalyptus
  ],
  // Deep blacks, golds, and rich tones
  luxury: [
    { h: 45, s: 0.80, l: 0.50 },   // Rich gold
    { h: 220, s: 0.20, l: 0.15 },  // Near-black navy
    { h: 0, s: 0.00, l: 0.08 },    // Pure black
    { h: 30, s: 0.50, l: 0.35 },   // Bronze
    { h: 50, s: 0.60, l: 0.85 },   // Champagne
    { h: 270, s: 0.30, l: 0.20 },  // Dark plum
    { h: 40, s: 0.70, l: 0.65 },   // Honey
  ],
  // Earth tones with green
  nature: [
    { h: 130, s: 0.50, l: 0.40 },  // Forest green
    { h: 35, s: 0.60, l: 0.55 },   // Warm brown
    { h: 85, s: 0.45, l: 0.50 },   // Olive
    { h: 25, s: 0.50, l: 0.65 },   // Terracotta
    { h: 45, s: 0.25, l: 0.92 },   // Parchment
    { h: 150, s: 0.55, l: 0.25 },  // Dark green
    { h: 15, s: 0.45, l: 0.40 },   // Sienna
  ],
  // Muted vintage palette
  retro: [
    { h: 15, s: 0.60, l: 0.55 },   // Burnt orange
    { h: 340, s: 0.50, l: 0.55 },  // Dusty pink
    { h: 50, s: 0.55, l: 0.60 },   // Mustard
    { h: 180, s: 0.40, l: 0.45 },  // Vintage teal
    { h: 30, s: 0.25, l: 0.90 },   // Cream
    { h: 350, s: 0.50, l: 0.30 },  // Dark rose
    { h: 200, s: 0.35, l: 0.50 },  // Slate blue
  ]
};

/* ==========================================================================
   MOOD → PALETTE KEYWORD MAPPING (for fuzzy matching)
   ========================================================================== */

var _MOOD_MAP = {
  tech: ['tech', 'technology', 'digital', 'cyber', 'futuristic', 'sci-fi', 'ai', 'code', 'data', 'computing', 'innovation', 'smart', 'neon', 'electric'],
  warm: ['warm', 'cozy', 'comfort', 'home', 'autumn', 'fall', 'sunset', 'love', 'romantic', 'tender', 'soft'],
  cool: ['cool', 'ocean', 'sea', 'water', 'ice', 'frost', 'winter', 'blue', 'serene', 'fresh', 'clean', 'crisp'],
  energy: ['energy', 'exciting', 'passion', 'fire', 'intense', 'bold', 'dynamic', 'power', 'sport', 'rush', 'adventure', 'speed', 'fast', 'hot', 'vibrant'],
  calm: ['calm', 'peace', 'quiet', 'gentle', 'meditation', 'zen', 'relax', 'soft', 'breathe', 'tranquil', 'serene', 'minimal', 'subtle'],
  luxury: ['luxury', 'elegant', 'premium', 'gold', 'classy', 'sophisticated', 'high-end', 'exclusive', 'royal', 'prestige', 'glamour', 'rich'],
  nature: ['nature', 'green', 'eco', 'earth', 'organic', 'forest', 'garden', 'plant', 'sustainable', 'natural', 'outdoor', 'mountain', 'landscape'],
  retro: ['retro', 'vintage', 'nostalgic', 'classic', '80s', '70s', '60s', '90s', 'old-school', 'analog', 'film', 'memory', 'pastel']
};

/* ==========================================================================
   MAIN AESTHETICS OBJECT
   ========================================================================== */

window.AESTHETICS = {

  /* ======================================================================
     1. COLOR_HARMONY — 色彩和声系统
     ====================================================================== */

  COLOR_HARMONY: {

    /**
     * Generate a harmonious palette based on a mood keyword.
     * @param {string} mood - Mood keyword: 'tech','warm','cool','energy','calm','luxury','nature','retro',
     *                        or any fuzzy word (e.g. 'ocean' maps to 'cool').
     * @param {number} [count=5] - Number of colors to return.
     * @returns {string[]} Array of HEX color strings.
     */
    palette: function (mood, count) {
      if (count === undefined) count = 5;
      mood = (mood || 'tech').toLowerCase();

      // Fuzzy match mood to palette key
      var resolved = 'tech';
      var moodLower = mood.toLowerCase();
      var keys = Object.keys(_MOOD_MAP);
      for (var i = 0; i < keys.length; i++) {
        var keywords = _MOOD_MAP[keys[i]];
        if (keys[i].indexOf(moodLower) !== -1 || moodLower.indexOf(keys[i]) !== -1) {
          resolved = keys[i];
          break;
        }
        for (var j = 0; j < keywords.length; j++) {
          if (moodLower.indexOf(keywords[j]) !== -1) {
            resolved = keys[i];
            break;
          }
        }
        if (resolved !== 'tech') break;
      }

      var source = _PALETTES[resolved] || _PALETTES.tech;
      var result = [];
      for (var k = 0; k < count && k < source.length; k++) {
        result.push(_hslToHex(source[k].h, source[k].s, source[k].l));
      }
      // If count > available, generate additional colors via hue rotation
      for (var extra = source.length; extra < count; extra++) {
        var base = source[extra % source.length];
        result.push(_hslToHex(
          (base.h + (extra - source.length) * 40) % 360,
          base.s,
          _clamp(base.l + (extra - source.length) * 0.05, 0.2, 0.8)
        ));
      }
      return result;
    },

    /**
     * Color relationship generators.
     * Each method takes a base HEX color and returns relationship HEX values.
     */
    relationships: {
      /**
       * Complementary color (opposite on the color wheel).
       * @param {string} hex - Base color.
       * @param {number} [angle=180] - Degrees of separation.
       * @returns {string}
       */
      complementary: function (hex, angle) {
        if (angle === undefined) angle = 180;
        return _rotateHue(hex, angle);
      },

      /**
       * Analogous colors (adjacent on the color wheel).
       * @param {string} hex - Base color.
       * @param {number} [spread=30] - Degrees spread.
       * @returns {string[]} Two analogous colors.
       */
      analogous: function (hex, spread) {
        if (spread === undefined) spread = 30;
        return [
          _rotateHue(hex, -spread),
          _rotateHue(hex, spread)
        ];
      },

      /**
       * Split-complementary: base + two colors adjacent to its complement.
       * @param {string} hex
       * @returns {string[]}
       */
      splitComplementary: function (hex) {
        return [
          _rotateHue(hex, 150),
          _rotateHue(hex, 210)
        ];
      },

      /**
       * Triadic: three evenly spaced colors.
       * @param {string} hex
       * @returns {string[]}
       */
      triadic: function (hex) {
        return [
          _rotateHue(hex, 120),
          _rotateHue(hex, 240)
        ];
      },

      /**
       * Tetradic: four evenly spaced colors (rectangle).
       * @param {string} hex
       * @returns {string[]}
       */
      tetradic: function (hex) {
        return [
          _rotateHue(hex, 90),
          _rotateHue(hex, 180),
          _rotateHue(hex, 270)
        ];
      }
    },

    /**
     * Analyze the temperature of a color.
     * @param {string} hex
     * @returns {'warm'|'cool'|'neutral'}
     */
    temperature: function (hex) {
      var rgb = _hexToRgb(hex);
      var hsl = _rgbToHsl(rgb);
      var h = hsl.h;
      var s = hsl.s;

      // Desaturated colors are neutral
      if (s < 0.12) return 'neutral';

      // Warm hues: 0-60, 300-360
      if ((h >= 0 && h <= 60) || (h >= 300 && h <= 360)) return 'warm';

      // Cool hues: 150-270
      if (h >= 150 && h <= 270) return 'cool';

      // Transitional zones (60-150, 270-300)
      if (h > 60 && h < 150) return s > 0.5 ? 'warm' : 'neutral';
      if (h > 270 && h < 300) return s > 0.5 ? 'cool' : 'neutral';

      return 'neutral';
    },

    /**
     * Calculate WCAG contrast ratio between two colors.
     * @param {string} hex1
     * @param {string} hex2
     * @returns {number} Contrast ratio (1:1 to 21:1).
     */
    contrastRatio: function (hex1, hex2) {
      function _relativeLuminance(hex) {
        var rgb = _hexToRgb(hex);
        var srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
        var linear = srgb.map(function (c) {
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      }
      var l1 = _relativeLuminance(hex1);
      var l2 = _relativeLuminance(hex2);
      var lighter = Math.max(l1, l2);
      var darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    },

    /**
     * Generate a CSS gradient string for text.
     * @param {string[]} colors - Array of HEX colors for gradient stops.
     * @param {number} [angle=0] - Gradient angle in degrees (0 = left-to-right).
     * @returns {string} CSS linear-gradient value.
     */
    textGradient: function (colors, angle) {
      if (angle === undefined) angle = 0;
      if (!colors || colors.length < 2) return colors ? colors[0] || '#ffffff' : '#ffffff';
      var stops = colors.map(function (c, i) {
        var pct = colors.length === 1 ? 100 : Math.round((i / (colors.length - 1)) * 100);
        return c + ' ' + pct + '%';
      });
      return 'linear-gradient(' + angle + 'deg, ' + stops.join(', ') + ')';
    }
  },


  /* ======================================================================
     2. TYPOGRAPHY — 字体排版美学
     ====================================================================== */

  TYPOGRAPHY: {

    /**
     * Type scale using Major Third (1.25 ratio), classic for motion graphics.
     * Values in pixels.
     */
    scale: {
      display: [120, 96, 80, 64, 48, 36, 28],
      heading: [48, 40, 32, 28, 24],
      body: [24, 20, 18, 16, 14],
      caption: [14, 12, 11, 10]
    },

    /**
     * Font-weight pairing recommendations.
     * Each entry: [primary weight, secondary weight].
     */
    weightPairs: {
      display: ['900', '300'],
      elegant: ['600', '300'],
      strong: ['800', '400'],
      minimal: ['500', '400']
    },

    /**
     * Recommended letter-spacing (tracking) based on font size.
     * Large titles need negative tracking; body text needs positive.
     * @param {number} fontSize - Font size in pixels.
     * @returns {string} Tracking value in em units.
     */
    letterSpacing: function (fontSize) {
      if (fontSize >= 80) return '-0.04em';
      if (fontSize >= 64) return '-0.035em';
      if (fontSize >= 48) return '-0.03em';
      if (fontSize >= 36) return '-0.02em';
      if (fontSize >= 28) return '-0.015em';
      if (fontSize >= 20) return '0em';
      if (fontSize >= 16) return '0.01em';
      return '0.02em';
    },

    /**
     * Recommended line-height based on font size and language.
     * Chinese text needs more line height; English less.
     * @param {number} fontSize - Font size in pixels.
     * @param {string} [lang='zh'] - Language code: 'zh' or 'en'.
     * @returns {number} Line-height multiplier.
     */
    lineHeight: function (fontSize, lang) {
      if (!lang) lang = 'zh';
      if (lang === 'zh' || lang === 'ja' || lang === 'ko') {
        // CJK characters are taller and need more leading
        if (fontSize >= 80) return 1.2;
        if (fontSize >= 48) return 1.3;
        if (fontSize >= 32) return 1.5;
        if (fontSize >= 24) return 1.6;
        if (fontSize >= 16) return 1.8;
        return 1.8;
      }
      // Latin-based scripts
      if (fontSize >= 80) return 1.05;
      if (fontSize >= 48) return 1.1;
      if (fontSize >= 32) return 1.2;
      if (fontSize >= 24) return 1.3;
      if (fontSize >= 16) return 1.4;
      return 1.5;
    },

    /**
     * Text shadow presets for various visual effects.
     * Each function returns a Canvas-compatible shadow config object.
     */
    shadowPresets: {
      /**
       * Glow effect — soft colored halo.
       * @param {string} [color='#ffffff']
       * @param {number} [intensity=1]
       * @returns {{ shadowColor: string, shadowBlur: number, shadowOffsetX: number, shadowOffsetY: number }}
       */
      glow: function (color, intensity) {
        if (!color) color = '#ffffff';
        if (intensity === undefined) intensity = 1;
        return {
          shadowColor: color,
          shadowBlur: Math.round(20 * intensity),
          shadowOffsetX: 0,
          shadowOffsetY: 0
        };
      },

      /**
       * Depth effect — offset shadow for 3D appearance.
       * @param {number} [distance=4]
       * @returns {Object}
       */
      depth: function (distance) {
        if (distance === undefined) distance = 4;
        return {
          shadowColor: 'rgba(0,0,0,0.4)',
          shadowBlur: Math.round(distance * 2),
          shadowOffsetX: distance,
          shadowOffsetY: distance
        };
      },

      /**
       * Hard shadow — crisp, minimal blur for bold impact.
       * @param {number} [distance=2]
       * @returns {Object}
       */
      hard: function (distance) {
        if (distance === undefined) distance = 2;
        return {
          shadowColor: 'rgba(0,0,0,0.6)',
          shadowBlur: 0,
          shadowOffsetX: distance,
          shadowOffsetY: distance
        };
      },

      /**
       * Soft shadow — diffused, gentle elevation.
       * @param {number} [blur=8]
       * @returns {Object}
       */
      soft: function (blur) {
        if (blur === undefined) blur = 8;
        return {
          shadowColor: 'rgba(0,0,0,0.2)',
          shadowBlur: blur,
          shadowOffsetX: 0,
          shadowOffsetY: Math.round(blur * 0.3)
        };
      },

      /**
       * Neon effect — intense colored glow simulating neon light.
       * @param {string} [color='#00ffff']
       * @returns {Object}
       */
      neon: function (color) {
        if (!color) color = '#00ffff';
        return {
          shadowColor: color,
          shadowBlur: 40,
          shadowOffsetX: 0,
          shadowOffsetY: 0
        };
      }
    }
  },


  /* ======================================================================
     3. COMPOSITION — 构图法则
     ====================================================================== */

  COMPOSITION: {

    /**
     * Rule of thirds — returns 9 intersection points.
     * @param {number} w - Canvas width.
     * @param {number} h - Canvas height.
     * @returns {{ x: number, y: number, label: string }[]}
     */
    thirds: function (w, h) {
      var cols = [w / 3, w * 2 / 3];
      var rows = [h / 3, h * 2 / 3];
      var labels = [
        'top-left', 'top-center', 'top-right',
        'mid-left', 'mid-center', 'mid-right',
        'bottom-left', 'bottom-center', 'bottom-right'
      ];
      var points = [];
      var idx = 0;
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          points.push({
            x: cols[c],
            y: rows[r],
            label: labels[idx++]
          });
        }
      }
      return points;
    },

    /**
     * Golden ratio focal points.
     * Returns the 4 "power points" derived from the golden spiral.
     * @param {number} w
     * @param {number} h
     * @returns {{ x: number, y: number, label: string }[]}
     */
    goldenRatio: function (w, h) {
      var phi = 1.618033988749895;
      return [
        { x: w / phi, y: h / phi, label: 'golden-1' },
        { x: w - w / phi, y: h / phi, label: 'golden-2' },
        { x: w / phi, y: h - h / phi, label: 'golden-3' },
        { x: w - w / phi, y: h - h / phi, label: 'golden-4' }
      ];
    },

    /**
     * Visual balance calculator.
     * Computes the center of visual weight for an array of elements.
     * Each element should have: { x, y, width, height, opacity, color (optional) }.
     * @param {{ x: number, y: number, width: number, height: number, opacity?: number, color?: string }[]} elements
     * @returns {{ centerOfGravity: { x: number, y: number }, imbalance: number, recommendation: string }}
     */
    balance: function (elements) {
      if (!elements || elements.length === 0) {
        return { centerOfGravity: { x: 0, y: 0 }, imbalance: 0, recommendation: 'No elements to analyze.' };
      }
      var totalWeight = 0;
      var weightedX = 0;
      var weightedY = 0;

      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var area = (el.width || 0) * (el.height || 0);
        var cx = el.x + (el.width || 0) / 2;
        var cy = el.y + (el.height || 0) / 2;

        // Color weight: warm colors and high saturation feel heavier
        var colorWeight = 1.0;
        if (el.color) {
          var rgb = _hexToRgb(el.color);
          var hsl = _rgbToHsl(rgb);
          colorWeight = 1.0 + hsl.s * 0.3;
          // Warm hues feel heavier
          if ((hsl.h >= 0 && hsl.h <= 60) || (hsl.h >= 300 && hsl.h <= 360)) {
            colorWeight += 0.15;
          }
        }

        var weight = area * (el.opacity !== undefined ? el.opacity : 1) * colorWeight;
        totalWeight += weight;
        weightedX += cx * weight;
        weightedY += cy * weight;
      }

      var cogX = totalWeight > 0 ? weightedX / totalWeight : 0;
      var cogY = totalWeight > 0 ? weightedY / totalWeight : 0;

      // Simple canvas center for reference
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (var j = 0; j < elements.length; j++) {
        minX = Math.min(minX, elements[j].x);
        maxX = Math.max(maxX, elements[j].x + (elements[j].width || 0));
        minY = Math.min(minY, elements[j].y);
        maxY = Math.max(maxY, elements[j].y + (elements[j].height || 0));
      }
      var canvasCenterX = (minX + maxX) / 2;
      var canvasCenterY = (minY + maxY) / 2;
      var canvasW = Math.max(maxX - minX, 1);
      var canvasH = Math.max(maxY - minY, 1);
      var imbalance = Math.sqrt(
        Math.pow((cogX - canvasCenterX) / canvasW, 2) +
        Math.pow((cogY - canvasCenterY) / canvasH, 2)
      );

      var recommendation;
      if (imbalance < 0.1) recommendation = 'Well balanced.';
      else if (imbalance < 0.25) recommendation = 'Slightly off-center — intentional tension may work.';
      else recommendation = 'Heavily imbalanced — consider repositioning elements toward the center of gravity.';

      return {
        centerOfGravity: { x: cogX, y: cogY },
        imbalance: imbalance,
        recommendation: recommendation
      };
    },

    /**
     * Layout templates for common motion graphics scenes.
     * Each returns positioning data for the scene.
     */
    layouts: {
      /**
       * Centered layout — all content at the visual center.
       */
      centered: function (w, h) {
        return {
          focalX: w / 2,
          focalY: h / 2,
          anchorX: w / 2,
          anchorY: h / 2,
          padding: { top: h * 0.1, bottom: h * 0.1, left: w * 0.1, right: w * 0.1 }
        };
      },

      /**
       * Off-center layout — content pushed to one side.
       * @param {string} [direction='left'] - 'left' or 'right'.
       */
      offCenter: function (w, h, direction) {
        if (!direction) direction = 'left';
        var offset = w * 0.15;
        var focalX = direction === 'left' ? w * 0.35 : w * 0.65;
        return {
          focalX: focalX,
          focalY: h / 2,
          anchorX: focalX,
          anchorY: h / 2,
          direction: direction,
          padding: { top: h * 0.1, bottom: h * 0.1, left: w * 0.05, right: w * 0.05 }
        };
      },

      /**
       * Split screen layout — two panels.
       * @param {number} [ratio=0.6] - Left panel width ratio.
       */
      splitScreen: function (w, h, ratio) {
        if (ratio === undefined) ratio = 0.6;
        var splitX = w * ratio;
        return {
          left: { x: 0, y: 0, w: splitX, h: h, focalX: splitX / 2, focalY: h / 2 },
          right: { x: splitX, y: 0, w: w - splitX, h: h, focalX: splitX + (w - splitX) / 2, focalY: h / 2 },
          dividerX: splitX,
          ratio: ratio
        };
      },

      /**
       * Diagonal layout — content aligned along a diagonal axis.
       * @param {number} [angle=-15] - Angle in degrees.
       */
      diagonal: function (w, h, angle) {
        if (angle === undefined) angle = -15;
        var rad = angle * Math.PI / 180;
        return {
          angle: angle,
          focalX: w / 2,
          focalY: h / 2,
          slope: Math.tan(rad),
          anchorX: w / 2,
          anchorY: h / 2,
          transform: 'rotate(' + angle + 'deg)'
        };
      },

      /**
       * Radial layout — elements arranged in a circle.
       */
      radial: function (w, h) {
        return {
          centerX: w / 2,
          centerY: h / 2,
          radius: Math.min(w, h) * 0.35,
          focalX: w / 2,
          focalY: h / 2
        };
      },

      /**
       * Card layout — grid of cards.
       * @param {number} cardCount - Total number of cards.
       */
      cardLayout: function (w, h, cardCount) {
        var cols = Math.ceil(Math.sqrt(cardCount * (w / h)));
        var rows = Math.ceil(cardCount / cols);
        var padding = Math.min(w, h) * 0.05;
        var gap = padding * 0.5;
        var cellW = (w - padding * 2 - gap * (cols - 1)) / cols;
        var cellH = (h - padding * 2 - gap * (rows - 1)) / rows;
        var cards = [];
        for (var i = 0; i < cardCount; i++) {
          var col = i % cols;
          var row = Math.floor(i / cols);
          cards.push({
            x: padding + col * (cellW + gap),
            y: padding + row * (cellH + gap),
            w: cellW,
            h: cellH
          });
        }
        return { cols: cols, rows: rows, cards: cards, gap: gap, padding: padding };
      },

      /**
       * List layout — vertical stack of items.
       * @param {number} itemCount - Total items.
       */
      listLayout: function (w, h, itemCount) {
        var padding = h * 0.06;
        var gap = padding * 0.4;
        var totalGap = gap * (itemCount - 1);
        var itemH = (h - padding * 2 - totalGap) / itemCount;
        var items = [];
        for (var i = 0; i < itemCount; i++) {
          items.push({
            x: padding,
            y: padding + i * (itemH + gap),
            w: w - padding * 2,
            h: itemH
          });
        }
        return { items: items, gap: gap, padding: padding };
      }
    }
  },


  /* ======================================================================
     4. MOTION — 动效美学
     ====================================================================== */

  MOTION: {

    /**
     * Easing recommendations mapped to emotional intent.
     * Keys are emotion keywords; values are GSAP-compatible easing names.
     */
    easingByEmotion: {
      urgent: 'outExpo',
      gentle: 'outSine',
      playful: 'outBack',
      dramatic: 'inOutCubic',
      precision: 'outQuart',
      organic: 'inOutSine',
      powerful: 'outElastic',
      smooth: 'inOutCubic'
    },

    /**
     * Timing recommendations in seconds.
     */
    timing: {
      entrance: 0.4,
      entranceDramatic: 0.8,
      exit: 0.3,
      transition: 0.5,
      hold: 2.0,
      readSpeed: 3.5   // Characters per second for Chinese text
    },

    /**
     * Stagger patterns for group animations.
     * Each function: (index, total, ...) => delay in seconds.
     */
    stagger: {
      /** Sequential cascade from first to last. */
      cascade: function (index, total, delay) {
        if (delay === undefined) delay = 0.08;
        return delay * index;
      },
      /** Wave pattern — slower, more visible delay. */
      wave: function (index, total, delay) {
        if (delay === undefined) delay = 0.12;
        return delay * index;
      },
      /** Random stagger for organic feel. */
      random: function (index, total) {
        return Math.random() * 0.3;
      },
      /** From center outward — middle items animate first. */
      fromCenter: function (index, total, delay) {
        if (delay === undefined) delay = 0.06;
        return delay * Math.abs(index - total / 2);
      },
      /** Alternating — even items first, odd items staggered after. */
      alternating: function (index, delay) {
        if (delay === undefined) delay = 0.1;
        return (index % 2 === 0 ? 0 : delay / 2) + Math.floor(index / 2) * delay;
      }
    },

    /**
     * Secondary motion parameters for realistic movement.
     */
    secondaryMotion: {
      settleOvershoot: 1.08,   // Scale overshoot ratio
      wobbleDecay: 0.85,       // Wobble amplitude decay per frame
      inertiaFactor: 0.3       // How much momentum carries after release
    },

    /**
     * Choreography patterns — how multiple elements should move together.
     * Each value is a human-readable description used by the AI module.
     */
    choreography: {
      unified: 'all move together, same easing',
      cascading: 'sequential reveal, slight delays',
      opposing: 'elements move in opposite directions',
      converging: 'elements move toward center',
      diverging: 'elements spread from center',
      orbiting: 'elements rotate around focal point',
      breathing: 'all elements pulse in sync'
    }
  },


  /* ======================================================================
     5. VISUAL_HIERARCHY — 视觉层级
     ====================================================================== */

  VISUAL_HIERARCHY: {

    /**
     * Size contrast ratios relative to a primary (1.0) base size.
     */
    sizeContrast: {
      primary: 1.0,
      secondary: 0.6,
      tertiary: 0.4,
      caption: 0.25
    },

    /**
     * Opacity levels for depth layering.
     */
    depthLayers: {
      foreground: 1.0,
      midground: 0.85,
      background: 0.5,
      atmosphere: 0.15
    },

    /**
     * Color emphasis strategies.
     * Values are descriptions the AI module interprets.
     */
    emphasis: {
      accent: 'use palette color at full saturation',
      highlight: 'use palette color at 80% opacity',
      muted: 'use palette color at 40% opacity',
      neutral: 'use white at reduced opacity'
    },

    /**
     * Spacing rhythm based on an 8px base grid.
     */
    spacing: {
      tight: 8,
      snug: 16,
      normal: 24,
      relaxed: 40,
      spacious: 64,
      dramatic: 100
    }
  },


  /* ======================================================================
     6. EFFECTS_LIBRARY — 特效美学准则
     ====================================================================== */

  EFFECTS_LIBRARY: {

    /**
     * Particle effect guidelines.
     */
    particles: {
      appropriate: ['celebration', 'magic', 'technology', 'nature', 'energy'],

      /** Particle density counts (number of particles). */
      density: {
        minimal: 15,
        medium: 40,
        dense: 80,
        intense: 150
      },

      /** Particle behavior patterns. */
      behavior: {
        float: 'gentle random drift',
        converge: 'attract toward point',
        explode: 'radial burst from center',
        trail: 'follow a path',
        orbit: 'circular movement around point'
      }
    },

    /**
     * Glow and light effect parameters.
     */
    glow: {
      subtle: { blur: 10, alpha: 0.3 },
      medium: { blur: 20, alpha: 0.5 },
      intense: { blur: 40, alpha: 0.8 },
      bloom: { blur: 60, alpha: 1.0 }
    },

    /**
     * Gradient quality guidelines.
     */
    gradients: {
      minimumStops: 3,
      recommendedStops: 5,
      angleGuide: {
        uplifting: Math.PI / 2,    // bottom to top
        grounding: -Math.PI / 2,   // top to bottom
        dynamic: Math.PI / 4,      // diagonal
        stable: 0                   // left to right
      }
    }
  },


  /* ======================================================================
     7. SCENE_DESIGN — 场景设计模式
     ====================================================================== */

  SCENE_DESIGN: {

    /**
     * Predefined scene patterns with recommended visual approaches.
     */
    patterns: {
      title: {
        layout: 'centered',
        typography: 'display scale',
        animation: 'dramatic entrance with settle',
        decoration: 'subtle atmospheric particles + glow',
        readHold: 1.5
      },
      statement: {
        layout: 'centered or card',
        typography: 'heading scale',
        animation: 'reveal with emphasis on key words',
        decoration: 'accent line + corner detail',
        readHold: 2.0
      },
      data: {
        layout: 'structured grid',
        typography: 'body + display numbers',
        animation: 'grow from baseline',
        decoration: 'subtle grid + value callouts',
        readHold: 2.5
      },
      comparison: {
        layout: 'split screen',
        typography: 'heading + body',
        animation: 'simultaneous dual reveal',
        decoration: 'center dividing line + mirrored accents',
        readHold: 2.5
      },
      closing: {
        layout: 'centered',
        typography: 'display scale',
        animation: 'converge and glow',
        decoration: 'particle burst + radial glow',
        readHold: 1.5
      }
    },

    /**
     * Background atmosphere guidelines.
     */
    atmosphere: {
      minimal: 'single subtle gradient orb, alpha 0.05-0.1',
      standard: '2-3 gradient orbs + fine particle dust',
      rich: 'multi-layer gradient + grid + particles + decorative lines',
      cinematic: 'dramatic gradient + volumetric rays + particle fields'
    }
  },


  /* ======================================================================
     8. getSceneDesignAdvice — 场景设计建议生成器
     ====================================================================== */

  /**
   * Analyze text and scene context, then return comprehensive design recommendations.
   *
   * @param {string} text - The content text to analyze.
   * @param {string} [sceneType='auto'] - Scene type: 'title','statement','data','comparison','closing', or 'auto' (auto-detect).
   * @param {string} [style='modern'] - Visual style preference: 'modern','minimal','dramatic','playful','corporate','cinematic'.
   * @returns {{
   *   palette: string[],
   *   layout: string,
   *   typography: { scale: string, weights: string[], letterSpacing: string, lineHeight: number },
   *   motion: { easing: string, timing: number, stagger: string, choreography: string },
   *   effects: { particles: boolean, density: string, glow: string, atmosphere: string },
   *   atmosphere: string,
   *   readHold: number
   * }}
   */
  getSceneDesignAdvice: function (text, sceneType, style) {
    if (!sceneType) sceneType = 'auto';
    if (!style) style = 'modern';

    // --- 1. Detect emotion/mood from text ---
    var mood = 'tech';
    var textLower = (text || '').toLowerCase();
    var moodKeywords = Object.keys(_MOOD_MAP);
    for (var mi = 0; mi < moodKeywords.length; mi++) {
      var mKey = moodKeywords[mi];
      var words = _MOOD_MAP[mKey];
      for (var wi = 0; wi < words.length; wi++) {
        if (textLower.indexOf(words[wi]) !== -1) {
          mood = mKey;
          break;
        }
      }
      if (mood !== 'tech') break;
    }

    // --- 2. Auto-detect scene type from text length and structure ---
    if (sceneType === 'auto') {
      var len = (text || '').replace(/\s/g, '').length;
      if (len <= 20) {
        sceneType = 'title';
      } else if (len <= 80) {
        sceneType = 'statement';
      } else if (/[\d%$¥€]/.test(text)) {
        sceneType = 'data';
      } else if (/[vs|vs\.|versus|对比|比较]/i.test(text)) {
        sceneType = 'comparison';
      } else {
        sceneType = 'statement';
      }
    }

    // --- 3. Select palette ---
    var palette = this.COLOR_HARMONY.palette(mood, 6);

    // --- 4. Get scene pattern ---
    var pattern = this.SCENE_DESIGN.patterns[sceneType] || this.SCENE_DESIGN.patterns.statement;

    // --- 5. Style overrides ---
    var styleConfig = {
      modern: { easing: 'smooth', atmosphere: 'standard', glow: 'subtle', particles: true, density: 'minimal' },
      minimal: { easing: 'gentle', atmosphere: 'minimal', glow: null, particles: false, density: 'minimal' },
      dramatic: { easing: 'dramatic', atmosphere: 'cinematic', glow: 'intense', particles: true, density: 'medium' },
      playful: { easing: 'playful', atmosphere: 'standard', glow: 'medium', particles: true, density: 'medium' },
      corporate: { easing: 'precision', atmosphere: 'minimal', glow: 'subtle', particles: false, density: 'minimal' },
      cinematic: { easing: 'dramatic', atmosphere: 'cinematic', glow: 'medium', particles: true, density: 'dense' }
    };
    var sCfg = styleConfig[style] || styleConfig.modern;

    // --- 6. Determine typography ---
    var typoScale = pattern.typography.indexOf('display') !== -1 ? 'display' : 'heading';
    var weightKey = style === 'minimal' ? 'minimal' : style === 'dramatic' ? 'display' : style === 'playful' ? 'elegant' : 'strong';
    var weights = this.TYPOGRAPHY.weightPairs[weightKey] || this.TYPOGRAPHY.weightPairs.strong;

    // Estimate a reasonable font size
    var estimatedSize = 48;
    if (sceneType === 'title') estimatedSize = 64;
    if (sceneType === 'statement') estimatedSize = 36;
    if (sceneType === 'data') estimatedSize = 28;
    if (sceneType === 'closing') estimatedSize = 56;

    // --- 7. Motion ---
    var easing = this.MOTION.easingByEmotion[sCfg.easing] || 'inOutCubic';
    var timing = sceneType === 'title' ? this.MOTION.timing.entranceDramatic : this.MOTION.timing.entrance;

    // --- 8. Compose result ---
    return {
      palette: palette,
      mood: mood,
      layout: pattern.layout,
      typography: {
        scale: typoScale,
        weights: weights,
        letterSpacing: this.TYPOGRAPHY.letterSpacing(estimatedSize),
        lineHeight: this.TYPOGRAPHY.lineHeight(estimatedSize, 'zh'),
        estimatedSize: estimatedSize
      },
      motion: {
        easing: easing,
        timing: timing,
        stagger: 'cascade',
        choreography: sceneType === 'closing' ? 'converging' : 'cascading'
      },
      effects: {
        particles: sCfg.particles,
        density: sCfg.density,
        glow: sCfg.glow,
        atmosphere: sCfg.atmosphere
      },
      atmosphere: this.SCENE_DESIGN.atmosphere[sCfg.atmosphere] || this.SCENE_DESIGN.atmosphere.standard,
      readHold: pattern.readHold || 2.0,
      scenePattern: pattern
    };
  },


  /* ======================================================================
     9. generateAestheticCodeSnippets — 美学代码片段生成器
     ====================================================================== */

  /**
   * Generate ready-to-inject Canvas/JS code snippets based on design advice.
   * These snippets can be directly used in scene rendering.
   *
   * @param {Object} advice - The object returned by `getSceneDesignAdvice()`.
   * @returns {{
   *   background: string,
   *   textTreatment: string,
   *   decorations: string,
   *   animation: string
   * }}
   */
  generateAestheticCodeSnippets: function (advice) {
    if (!advice) return { background: '', textTreatment: '', decorations: '', animation: '' };

    var palette = advice.palette || ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'];
    var primary = palette[0];
    var accent = palette[1] || palette[0];
    var bg = palette[palette.length - 1] || '#0a0a1a';

    var bgCode = '';
    // --- Background atmosphere ---
    var atmosphere = advice.atmosphere || 'standard';
    if (atmosphere.indexOf('cinematic') !== -1) {
      bgCode =
        '// Cinematic background — multi-layer gradient orbs\n' +
        'var bgGrad = ctx.createRadialGradient(w*0.3, h*0.4, 0, w*0.3, h*0.4, w*0.6);\n' +
        'bgGrad.addColorStop(0, "' + primary + '22");\n' +
        'bgGrad.addColorStop(0.5, "' + bg + 'aa");\n' +
        'bgGrad.addColorStop(1, "' + bg + 'ff");\n' +
        'ctx.fillStyle = bgGrad;\n' +
        'ctx.fillRect(0, 0, w, h);\n' +
        '// Volumetric ray\n' +
        'ctx.save();\n' +
        'ctx.globalAlpha = 0.06;\n' +
        'var rayGrad = ctx.createLinearGradient(w*0.2, 0, w*0.8, h);\n' +
        'rayGrad.addColorStop(0, "' + accent + '");\n' +
        'rayGrad.addColorStop(1, "transparent");\n' +
        'ctx.fillStyle = rayGrad;\n' +
        'ctx.fillRect(0, 0, w, h);\n' +
        'ctx.restore();\n';
    } else if (atmosphere.indexOf('rich') !== -1) {
      bgCode =
        '// Rich background — multi-layer with grid\n' +
        'ctx.fillStyle = "' + bg + '";\n' +
        'ctx.fillRect(0, 0, w, h);\n' +
        '// Gradient orb 1\n' +
        'var orb1 = ctx.createRadialGradient(w*0.2, h*0.3, 0, w*0.2, h*0.3, w*0.4);\n' +
        'orb1.addColorStop(0, "' + primary + '33");\n' +
        'orb1.addColorStop(1, "transparent");\n' +
        'ctx.fillStyle = orb1;\n' +
        'ctx.fillRect(0, 0, w, h);\n' +
        '// Gradient orb 2\n' +
        'var orb2 = ctx.createRadialGradient(w*0.8, h*0.7, 0, w*0.8, h*0.7, w*0.35);\n' +
        'orb2.addColorStop(0, "' + accent + '28");\n' +
        'orb2.addColorStop(1, "transparent");\n' +
        'ctx.fillStyle = orb2;\n' +
        'ctx.fillRect(0, 0, w, h);\n' +
        '// Subtle grid\n' +
        'ctx.save();\n' +
        'ctx.strokeStyle = "' + primary + '12";\n' +
        'ctx.lineWidth = 1;\n' +
        'for (var gx = 0; gx < w; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }\n' +
        'for (var gy = 0; gy < h; gy += 60) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }\n' +
        'ctx.restore();\n';
    } else if (atmosphere.indexOf('standard') !== -1) {
      bgCode =
        '// Standard background — gradient orbs + particle dust\n' +
        'ctx.fillStyle = "' + bg + '";\n' +
        'ctx.fillRect(0, 0, w, h);\n' +
        'var orb = ctx.createRadialGradient(w*0.5, h*0.4, 0, w*0.5, h*0.4, w*0.5);\n' +
        'orb.addColorStop(0, "' + primary + '18");\n' +
        'orb.addColorStop(1, "transparent");\n' +
        'ctx.fillStyle = orb;\n' +
        'ctx.fillRect(0, 0, w, h);\n';
    } else {
      // minimal
      bgCode =
        '// Minimal background\n' +
        'ctx.fillStyle = "' + bg + '";\n' +
        'ctx.fillRect(0, 0, w, h);\n' +
        'var minOrb = ctx.createRadialGradient(w*0.5, h*0.5, 0, w*0.5, h*0.5, w*0.4);\n' +
        'minOrb.addColorStop(0, "' + primary + '0a");\n' +
        'minOrb.addColorStop(1, "transparent");\n' +
        'ctx.fillStyle = minOrb;\n' +
        'ctx.fillRect(0, 0, w, h);\n';
    }

    // --- Text treatment ---
    var typo = advice.typography || {};
    var glow = advice.effects && advice.effects.glow;
    var textCode = '';
    var shadowSetup = '';
    if (glow === 'intense' || glow === 'bloom') {
      shadowSetup = 'ctx.shadowColor = "' + accent + '"; ctx.shadowBlur = 40; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;';
    } else if (glow === 'medium') {
      shadowSetup = 'ctx.shadowColor = "' + accent + '"; ctx.shadowBlur = 20; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;';
    } else if (glow === 'subtle') {
      shadowSetup = 'ctx.shadowColor = "' + accent + '"; ctx.shadowBlur = 10; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;';
    }

    textCode =
      '// Text treatment\n' +
      'ctx.font = "' + (typo.weights ? typo.weights[0] : '700') + ' ' + (typo.estimatedSize || 48) + 'px sans-serif";\n' +
      'ctx.textAlign = "center";\n' +
      'ctx.textBaseline = "middle";\n' +
      (shadowSetup ? shadowSetup + '\n' : '') +
      'ctx.fillStyle = "' + primary + '";\n' +
      'ctx.letterSpacing = "' + (typo.letterSpacing || '0em') + '";\n' +
      'ctx.fillText(text, w/2, h/2);\n';
    if (shadowSetup) {
      textCode += 'ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;\n';
    }

    // --- Decorations ---
    var decoCode = '';
    var scenePattern = advice.scenePattern || {};
    if (scenePattern.decoration && scenePattern.decoration.indexOf('corner') !== -1) {
      decoCode =
        '// Corner accent decorations\n' +
        'ctx.save();\n' +
        'ctx.strokeStyle = "' + accent + '40";\n' +
        'ctx.lineWidth = 2;\n' +
        'var cornerLen = 40;\n' +
        '// Top-left corner\n' +
        'ctx.beginPath(); ctx.moveTo(24, 24 + cornerLen); ctx.lineTo(24, 24); ctx.lineTo(24 + cornerLen, 24); ctx.stroke();\n' +
        '// Bottom-right corner\n' +
        'ctx.beginPath(); ctx.moveTo(w-24-cornerLen, h-24); ctx.lineTo(w-24, h-24); ctx.lineTo(w-24, h-24-cornerLen); ctx.stroke();\n' +
        'ctx.restore();\n';
    }
    if (scenePattern.decoration && scenePattern.decoration.indexOf('accent line') !== -1) {
      decoCode +=
        '// Accent line\n' +
        'ctx.save();\n' +
        'ctx.strokeStyle = "' + accent + '";\n' +
        'ctx.lineWidth = 3;\n' +
        'ctx.beginPath(); ctx.moveTo(w*0.3, h*0.62); ctx.lineTo(w*0.7, h*0.62); ctx.stroke();\n' +
        'ctx.restore();\n';
    }
    if (decoCode === '') {
      decoCode = '// No decorations for this scene type\n';
    }

    // --- Animation choreography ---
    var motion = advice.motion || {};
    var animCode =
      '// Animation choreography\n' +
      '// Easing: ' + (motion.easing || 'inOutCubic') + '\n' +
      '// Timing: ' + (motion.timing || 0.4) + 's entrance\n' +
      '// Stagger: ' + (motion.stagger || 'cascade') + '\n' +
      '// Choreography: ' + (motion.choreography || 'cascading') + '\n' +
      '// Read hold: ' + (advice.readHold || 2.0) + 's\n' +
      '//\n' +
      '// Example GSAP timeline:\n' +
      '// var tl = gsap.timeline();\n' +
      '// tl.from(element, {\n' +
      '//   opacity: 0,\n' +
      '//   y: 30,\n' +
      '//   scale: 0.9,\n' +
      '//   duration: ' + (motion.timing || 0.4) + ',\n' +
      '//   ease: "' + (motion.easing || 'inOutCubic') + '",\n' +
      '//   stagger: 0.08\n' +
      '// });\n';

    return {
      background: bgCode,
      textTreatment: textCode,
      decorations: decoCode,
      animation: animCode
    };
  }
};
