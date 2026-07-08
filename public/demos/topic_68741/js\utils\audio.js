window.AudioManager = {
  isPlaying: false,
  currentAudio: null,
  speechSynth: null,

  COS_BASE: 'https://your-bucket.cos.ap-beijing.myqcloud.com',
  PINYIN_VOICE_DIR: '/static/pinyin_voice',
  AUDIO_DIR: '/static/audio',
  SENTENCES_DIR: '/static/audio/sentences',

  LOCAL_BASE: 'assets/audio',
  LOCAL_PINYIN_VOICE_DIR: '/pinyin_voice',
  LOCAL_SINGLE_DIR: '/single',
  LOCAL_SENTENCES_DIR: '/sentences',

  _queuePlaying: false,
  _queueItems: [],
  _queueIndex: 0,
  _queueTimer: null,

  _audioMap: null,
  _charPinyinMap: {},

  _EXTRA_PINYIN: {
    '咪': 'mī',
    '岁': 'suì'
  },

  PUNCTUATION_GAP: 300,
  CHAR_GAP: 80,

  TONE_MAP: {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v',
    'ü': 'v',
  },

  INITIALS: ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
    'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'],

  FINALS: new Set(['a', 'o', 'e', 'i', 'u', 'v',
    'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 've', 'er',
    'an', 'en', 'in', 'un', 'vn',
    'ang', 'eng', 'ing', 'ong']),

  init: function() {
    if ('speechSynthesis' in window) {
      this.speechSynth = window.speechSynthesis;
    }
    this._loadAudioMap();
  },

  _loadAudioMap: function() {
    const self = this;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.LOCAL_BASE + '/audio_map.json', true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          self._audioMap = JSON.parse(xhr.responseText);
        } catch (e) {
          console.log('[AudioManager] audio_map.json 解析失败:', e);
        }
      }
      self._buildCharPinyinMap();
    };
    xhr.onerror = function() {
      console.log('[AudioManager] audio_map.json 加载失败');
      self._buildCharPinyinMap();
    };
    xhr.send();
  },

  _buildCharPinyinMap: function() {
    this._charPinyinMap = {};
    if (window.DemoData && window.DemoData.cards) {
      window.DemoData.cards.forEach(function(card) {
        if (card.char && card.pinyin) {
          this._charPinyinMap[card.char] = card.pinyin;
        }
      }, this);
    }
    if (this._EXTRA_PINYIN) {
      Object.keys(this._EXTRA_PINYIN).forEach(function(ch) {
        if (!this._charPinyinMap[ch]) {
          this._charPinyinMap[ch] = this._EXTRA_PINYIN[ch];
        }
      }, this);
    }
    if (this._audioMap) {
      Object.keys(this._audioMap).forEach(function(key) {
        if (key.length === 1 && /[\u4e00-\u9fff]/.test(key)) {
          if (!this._charPinyinMap[key]) {
            const filename = this._audioMap[key];
            const pyMatch = filename.match(/^([a-zA-Z]+v?)([1-4])?\.wav$/);
            if (pyMatch) {
              let py = pyMatch[1];
              const tone = pyMatch[2] || '';
              py = py.replace(/v/g, 'ü');
              const toneMarks = { '1': '\u0304', '2': '\u0301', '3': '\u030c', '4': '\u0300' };
              if (tone && toneMarks[tone]) {
                const vowels = 'aeoiuü';
                let marked = false;
                for (let i = 0; i < py.length; i++) {
                  if (vowels.indexOf(py[i]) >= 0) {
                    py = py.substring(0, i) + py[i] + toneMarks[tone] + py.substring(i + 1);
                    marked = true;
                    break;
                  }
                }
                if (!marked) {
                  py = py + toneMarks[tone];
                }
              }
              this._charPinyinMap[key] = py;
            }
          }
        }
      }, this);
    }
  },

  _isPunctuation: function(ch) {
    return /[，。！？、；：""''（）,.!?;:'"()]/.test(ch);
  },

  _buildSentenceQueue: function(text) {
    const queue = [];
    const chars = text.split('');
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (this._isPunctuation(ch)) {
        queue.push({ type: 'gap', duration: this.PUNCTUATION_GAP });
        continue;
      }
      const pinyin = this._charPinyinMap[ch];
      if (pinyin) {
        const urls = this._getCharAudioUrl(pinyin, ch);
        if (urls && urls.length > 0) {
          queue.push({ type: 'audio', urls: urls, gap: this.CHAR_GAP, char: ch, urlIndex: 0 });
        } else {
          queue.push({ type: 'speak', text: ch, gap: this.CHAR_GAP });
        }
      } else {
        queue.push({ type: 'speak', text: ch, gap: this.CHAR_GAP });
      }
    }
    return queue;
  },

  _getAudioFilename: function(charOrPinyin) {
    if (!this._audioMap || !charOrPinyin) return '';
    return this._audioMap[charOrPinyin] || '';
  },

  _removeTone: function(pinyin) {
    let result = '';
    const lower = pinyin.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      const c = lower[i];
      if (c >= '0' && c <= '9') continue;
      result += this.TONE_MAP[c] || c;
    }
    return result;
  },

  _getToneNumber: function(pinyin) {
    const toneMap = {
      'ā': '1', 'á': '2', 'ǎ': '3', 'à': '4',
      'ō': '1', 'ó': '2', 'ǒ': '3', 'ò': '4',
      'ē': '1', 'é': '2', 'ě': '3', 'è': '4',
      'ī': '1', 'í': '2', 'ǐ': '3', 'ì': '4',
      'ū': '1', 'ú': '2', 'ǔ': '3', 'ù': '4',
      'ǖ': '1', 'ǘ': '2', 'ǚ': '3', 'ǜ': '4',
      'ü': '1',
    };
    for (let i = 0; i < pinyin.length; i++) {
      if (toneMap[pinyin[i]]) {
        return toneMap[pinyin[i]];
      }
    }
    return '';
  },



  _splitPinyin: function(pinyin) {
    if (!pinyin) return [];
    const clean = this._removeTone(pinyin);
    let initial = '';
    let rest = clean;
    for (let i = 0; i < this.INITIALS.length; i++) {
      const ini = this.INITIALS[i];
      if (clean.startsWith(ini)) {
        initial = ini;
        rest = clean.substring(ini.length);
        break;
      }
    }
    if (['j', 'q', 'x', 'y'].indexOf(initial) >= 0 && rest.startsWith('u')) {
      rest = 'v' + rest.substring(1);
    }
    if (this.FINALS.has(rest)) {
      const parts = [];
      if (initial) parts.push(initial);
      parts.push(rest);
      return parts;
    }
    let medial = '';
    let final = rest;
    if (rest.length >= 2 && 'iuv'.indexOf(rest[0]) >= 0 && this.FINALS.has(rest.substring(1))) {
      medial = rest[0];
      final = rest.substring(1);
    }
    const parts = [];
    if (initial) parts.push(initial);
    if (medial) parts.push(medial);
    if (final) parts.push(final);
    return parts;
  },

  _md5: function(str) {
    function rotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
      let lX8 = lX & 0x80000000;
      let lY8 = lY & 0x80000000;
      let lX4 = lX & 0x40000000;
      let lY4 = lY & 0x40000000;
      let lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
      if (lX4 | lY4) {
        if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
        else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      } else return lResult ^ lX8 ^ lY8;
    }
    let x = [];
    let k, AA, BB, CC, DD, a, b, c, d;
    let S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    let S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    let S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    let S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    function convertToWordArray(sMessage) {
      let lWordCount;
      let lMessageLength = sMessage.length;
      let lNumberOfWords_temp1 = lMessageLength + 8;
      let lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      let lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
      let lWordArray = Array(lNumberOfWords - 1);
      let lBytePosition = 0;
      let lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (sMessage.charCodeAt(lByteCount) << lBytePosition);
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    }
    function wordToHex(lValue) {
      let wordToHexValue = '', wordToHexValue_temp = '', lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValue_temp = '0' + lByte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
      }
      return wordToHexValue;
    }
    function utf8Encode(string) {
      string = string.replace(/\r\n/g, '\n');
      let utftext = '';
      for (let n = 0; n < string.length; n++) {
        let c = string.charCodeAt(n);
        if (c < 128) { utftext += String.fromCharCode(c); }
        else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }
    x = convertToWordArray(utf8Encode(str));
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return y ^ (x | (~z)); }
    function FF(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    for (k = 0; k < x.length; k += 16) {
      AA = a; BB = b; CC = c; DD = d;
      a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = GG(d, a, b, c, x[k + 10], S22, 0x02441453);
      c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = HH(b, c, d, a, x[k + 6], S34, 0x04881D05);
      a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }
    let result = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
    return result.toLowerCase();
  },

  _getPinyinVoiceUrl: function(letter) {
    const filename = encodeURIComponent(letter) + '.mp3';
    return [
      this.LOCAL_BASE + this.LOCAL_PINYIN_VOICE_DIR + '/' + filename,
      this.COS_BASE + this.PINYIN_VOICE_DIR + '/' + filename
    ];
  },

  _getCharAudioUrl: function(pinyin, char) {
    if (!pinyin && !char) return [];
    let file = '';
    if (char && this._audioMap) {
      file = this._audioMap[char] || '';
    }
    if (!file && pinyin) {
      const clean = this._removeTone(pinyin);
      const toneNum = this._getToneNumber(pinyin);
      const pinyinKey = clean.replace(/ü/g, 'v') + toneNum;
      if (this._audioMap) {
        file = this._audioMap[pinyinKey] || '';
      }
      if (!file) {
        file = clean.replace(/ü/g, 'v') + toneNum + '.wav';
      }
    }
    if (!file) return [];
    return [
      this.LOCAL_BASE + this.LOCAL_SINGLE_DIR + '/' + file,
      this.COS_BASE + this.AUDIO_DIR + '/' + file
    ];
  },

  _getSentenceAudioUrl: function(sentence) {
    const hashKey = this._md5('tencent_' + sentence + '_0').substring(0, 12);
    const file = 'sen_' + hashKey + '.wav';
    return [
      this.LOCAL_BASE + this.LOCAL_SENTENCES_DIR + '/' + file,
      this.COS_BASE + this.SENTENCES_DIR + '/' + file
    ];
  },

  playCharacter: function(char, pinyin, rate) {
    console.log('[AudioManager] 播放汉字:', char, pinyin);
    this.stop();
    this.isPlaying = true;
    this._updatePlayState(true);
    const urls = this._getCharAudioUrl(pinyin, char);
    if (urls && urls.length > 0) {
      this._playAudioUrlList(urls, rate || 0.7, char);
    } else {
      this._speak(char, 'zh-CN', rate || 0.7);
    }
  },

  playPinyin: function(pinyin, rate) {
    console.log('[AudioManager] 播放拼音:', pinyin);
    this.stop();
    this.isPlaying = true;
    this._updatePlayState(true);
    const urls = this._getCharAudioUrl(pinyin);
    if (urls && urls.length > 0) {
      this._playAudioUrlList(urls, rate || 0.7, pinyin);
    } else {
      this._speak(pinyin, 'zh-CN', rate || 0.7);
    }
  },

  playPinyinLetter: function(letter, rate) {
    console.log('[AudioManager] 播放拼音字母:', letter);
    this.stop();
    this.isPlaying = true;
    this._updatePlayState(true);
    const urls = this._getPinyinVoiceUrl(letter);
    this._playAudioUrlList(urls, rate || 0.7, letter);
  },

  playSpell: function(pinyin, char) {
    console.log('[AudioManager] 拼读:', pinyin, char);
    this.stop();
    const parts = this._splitPinyin(pinyin);
    const queue = [];
    parts.forEach(p => {
      const urls = this._getPinyinVoiceUrl(p);
      queue.push({ urls: urls, gap: 150, urlIndex: 0 });
    });
    const charUrls = this._getCharAudioUrl(pinyin, char);
    if (charUrls && charUrls.length > 0) {
      queue.push({ urls: charUrls, gap: 0, urlIndex: 0 });
    }
    this._playSequence(queue);
  },

  playSentence: function(text, rate) {
    console.log('[AudioManager] 播放句子（拼接模式）:', text);
    this.stop();
    const queue = this._buildSentenceQueue(text);
    this._playSequence(queue);
  },

  stop: function() {
    this._stopQueue();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    this.isPlaying = false;
    this._updatePlayState(false);
  },

  _playSequence: function(items) {
    if (!items || items.length === 0) return;
    this.stop();
    this._queueItems = items;
    this._queueIndex = 0;
    this._queuePlaying = true;
    this.isPlaying = true;
    this._updatePlayState(true);
    this._advanceQueue();
  },

  _tryNextUrl: function(item, onSuccess, onAllFailed) {
    const self = this;
    if (!item.urls || item.urlIndex >= item.urls.length) {
      onAllFailed();
      return;
    }
    const url = item.urls[item.urlIndex];
    item.urlIndex++;
    const audio = new Audio(url);
    this.currentAudio = audio;
    audio.playbackRate = 0.7;
    audio.oncanplaythrough = function() {
    };
    audio.onended = function() {
      self.currentAudio = null;
      onSuccess();
    };
    audio.onerror = function() {
      console.log('[AudioManager] 音频加载失败，尝试下一个源:', url);
      self.currentAudio = null;
      self._tryNextUrl(item, onSuccess, onAllFailed);
    };
    audio.play().catch(function(err) {
      console.log('[AudioManager] 音频播放失败:', url, err);
      self.currentAudio = null;
      self._tryNextUrl(item, onSuccess, onAllFailed);
    });
  },

  _advanceQueue: function() {
    if (!this._queuePlaying) return;
    if (this._queueIndex >= this._queueItems.length) {
      this._queuePlaying = false;
      this.isPlaying = false;
      this._updatePlayState(false);
      return;
    }
    const item = this._queueItems[this._queueIndex];
    this._queueIndex++;
    const self = this;

    if (!item) {
      this._advanceQueue();
      return;
    }

    if (item.type === 'gap') {
      this._queueTimer = setTimeout(function() {
        self._advanceQueue();
      }, item.duration || 0);
      return;
    }

    if (item.type === 'speak') {
      this._speakSingle(item.text, item.gap || 0);
      return;
    }

    const afterPlay = function() {
      const gap = item.gap || 0;
      if (gap > 0) {
        self._queueTimer = setTimeout(function() {
          self._advanceQueue();
        }, gap);
      } else {
        self._advanceQueue();
      }
    };

    const afterAllFailed = function() {
      console.log('[AudioManager] 所有音频源都失败，使用语音合成:', item.char || '');
      self.currentAudio = null;
      if (item.char) {
        self._speakSingle(item.char, item.gap || 0);
      } else {
        afterPlay();
      }
    };

    if (item.urls && item.urls.length > 0) {
      item.urlIndex = item.urlIndex || 0;
      this._tryNextUrl(item, afterPlay, afterAllFailed);
      return;
    }

    if (!item.url) {
      afterPlay();
      return;
    }

    const audio = new Audio(item.url);
    this.currentAudio = audio;
    audio.playbackRate = 0.7;
    audio.onended = function() {
      self.currentAudio = null;
      afterPlay();
    };
    audio.onerror = function() {
      console.log('[AudioManager] 队列音频加载失败:', item.url, item.char);
      self.currentAudio = null;
      afterAllFailed();
    };
    audio.play().catch(function(err) {
      console.log('[AudioManager] 队列播放失败:', err);
      self.currentAudio = null;
      afterAllFailed();
    });
  },

  _speakSingle: function(text, afterGap) {
    if (!this.speechSynth) {
      const self = this;
      this._queueTimer = setTimeout(function() {
        self._advanceQueue();
      }, afterGap || 200);
      return;
    }
    const self = this;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.6;
    utterance.pitch = 1;
    utterance.onend = function() {
      if (afterGap > 0) {
        self._queueTimer = setTimeout(function() {
          self._advanceQueue();
        }, afterGap);
      } else {
        self._advanceQueue();
      }
    };
    utterance.onerror = function() {
      if (afterGap > 0) {
        self._queueTimer = setTimeout(function() {
          self._advanceQueue();
        }, afterGap);
      } else {
        self._advanceQueue();
      }
    };
    this.speechSynth.speak(utterance);
  },

  _stopQueue: function() {
    this._queuePlaying = false;
    this._queueItems = [];
    this._queueIndex = 0;
    if (this._queueTimer) {
      clearTimeout(this._queueTimer);
      this._queueTimer = null;
    }
  },

  _playAudioUrlList: function(urls, rate, fallbackText, urlIndex) {
    const self = this;
    if (!urls || urlIndex >= urls.length) {
      console.log('[AudioManager] 所有音频源失败，使用语音合成:', fallbackText);
      self._speak(fallbackText || '', 'zh-CN', rate);
      return;
    }
    const url = urls[urlIndex];
    const audio = new Audio(url);
    this.currentAudio = audio;
    audio.playbackRate = rate || 0.7;

    audio.onended = function() {
      self.isPlaying = false;
      self.currentAudio = null;
      self._updatePlayState(false);
    };

    audio.onerror = function() {
      console.log('[AudioManager] 音频加载失败，尝试下一个源:', url);
      self.currentAudio = null;
      self._playAudioUrlList(urls, rate, fallbackText, urlIndex + 1);
    };

    audio.play().catch(function(err) {
      console.log('[AudioManager] 播放失败，尝试下一个源:', url, err);
      self.currentAudio = null;
      self._playAudioUrlList(urls, rate, fallbackText, urlIndex + 1);
    });
  },

  _playAudioUrl: function(url, rate, fallbackText) {
    this._playAudioUrlList([url], rate, fallbackText, 0);
  },

  _speak: function(text, lang, rate) {
    if (this.speechSynth) {
      this.speechSynth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || 'zh-CN';
      utterance.rate = rate || 0.7;
      utterance.pitch = 1;
      const self = this;
      utterance.onend = function() {
        self.isPlaying = false;
        self._updatePlayState(false);
      };
      utterance.onerror = function() {
        self.isPlaying = false;
        self._updatePlayState(false);
      };
      this.speechSynth.speak(utterance);
    } else {
      console.log('[AudioManager] Web Speech API 不可用，模拟播放:', text);
      const self = this;
      setTimeout(function() {
        self.isPlaying = false;
        self._updatePlayState(false);
      }, 1000);
    }
  },

  _updatePlayState: function(playing) {
    this.isPlaying = playing;
    window.dispatchEvent(new CustomEvent('audioStateChange', {
      detail: { playing: playing }
    }));
  }
};

document.addEventListener('DOMContentLoaded', function() {
  window.AudioManager.init();
});
