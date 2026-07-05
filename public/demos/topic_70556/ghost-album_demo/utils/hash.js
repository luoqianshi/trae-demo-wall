function utf8Encode(input) {
  return unescape(encodeURIComponent(input));
}

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256(input) {
  var ascii = utf8Encode(input);
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var words = [];
  var asciiBitLength = ascii.length * 8;
  var hash = sha256.h = sha256.h || [];
  var k = sha256.k = sha256.k || [];
  var primeCounter = k.length;
  var isComposite = {};
  var candidate;
  var j;

  for (candidate = 2; primeCounter < 64; candidate += 1) {
    if (!isComposite[candidate]) {
      for (j = 0; j < 313; j += candidate) {
        isComposite[j] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter += 1;
    }
  }
  hash = hash.slice(0);

  ascii += "\x80";
  while ((ascii.length % 64) - 56) {
    ascii += "\x00";
  }

  for (j = 0; j < ascii.length; j += 1) {
    var code = ascii.charCodeAt(j);
    words[j >> 2] |= code << (((3 - j) % 4) * 8);
  }

  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; j += 16) {
    var w = words.slice(j, j + 16);
    var oldHash = hash.slice(0);
    var a = hash[0];
    var b = hash[1];
    var c = hash[2];
    var d = hash[3];
    var e = hash[4];
    var f = hash[5];
    var g = hash[6];
    var h = hash[7];

    for (var i = 0; i < 64; i += 1) {
      var w15 = w[i - 15];
      var w2 = w[i - 2];

      if (i >= 16) {
        w[i] = (
          w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
        ) | 0;
      }

      var ch = (e & f) ^ (~e & g);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var sigma0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      var sigma1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      var temp1 = (h + sigma1 + ch + k[i] + w[i]) | 0;
      var temp2 = (sigma0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  var result = "";
  for (j = 0; j < hash.length; j += 1) {
    for (var byteIndex = 3; byteIndex + 1; byteIndex -= 1) {
      var byte = (hash[j] >> (byteIndex * 8)) & 255;
      result += ((byte < 16) ? "0" : "") + byte.toString(16);
    }
  }
  return result;
}

function digestPassword(password, salt) {
  return sha256("ghost-album:v1:" + salt + ":" + password);
}

module.exports = {
  sha256: sha256,
  digestPassword: digestPassword
};
