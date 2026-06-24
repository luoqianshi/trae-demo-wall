// MD5 加密模块
class Md5Module {
    constructor() {
        this.title = 'MD5 加密';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输入文本</label>
                    <textarea id="md5-input" placeholder="输入要加密的文本..." style="width:100%;min-height:120px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="text-align:center;">
                    <button class="btn btn-primary" onclick="app.modules.md5.encrypt()" style="padding:10px 24px;">加密</button>
                </div>
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">MD5 结果（32位小写）</label>
                    <textarea id="md5-output" readonly style="width:100%;min-height:100px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--success);font-size:14px;font-family:monospace;"></textarea>
                </div>
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">MD5 结果（16位大写）</label>
                    <textarea id="md5-output-short" readonly style="width:100%;min-height:80px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--success);font-size:14px;font-family:monospace;"></textarea>
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-secondary" onclick="app.modules.md5.copyLong()" style="padding:6px 16px;">复制32位</button>
                    <button class="btn btn-secondary" onclick="app.modules.md5.copyShort()" style="padding:6px 16px;">复制16位</button>
                </div>
            </div>
        `;
    }

    encrypt() {
        const input = document.getElementById('md5-input').value;
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }

        const md5Long = this.md5(input);
        const md5Short = md5Long.substring(8, 24).toUpperCase();

        document.getElementById('md5-output').value = md5Long;
        document.getElementById('md5-output-short').value = md5Short;
        app.setStatus('加密成功');
    }

    copyLong() {
        const output = document.getElementById('md5-output').value;
        if (!output) {
            app.setStatus('请先生成 MD5', 'error');
            return;
        }
        app.copyText(output);
    }

    copyShort() {
        const output = document.getElementById('md5-output-short').value;
        if (!output) {
            app.setStatus('请先生成 MD5', 'error');
            return;
        }
        app.copyText(output);
    }

    // 标准 MD5 算法实现
    md5(string) {
        function rotateLeft(n, s) {
            return (n << s) | (n >>> (32 - s));
        }

        function addUnsigned(x, y) {
            const x8 = x & 0x80000000;
            const y8 = y & 0x80000000;
            const x4 = x & 0x40000000;
            const y4 = y & 0x40000000;
            const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
            if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
            if (x4 | y4) {
                if (result & 0x40000000) return result ^ 0xC0000000 ^ x8 ^ y8;
                else return result ^ 0x40000000 ^ x8 ^ y8;
            }
            return result ^ x8 ^ y8;
        }

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

        function convertToWordArray(str) {
            const wordCount = (((str.length + 8) - ((str.length + 8) % 64)) / 64 + 1) * 16;
            const wordArray = new Array(wordCount - 1);
            for (let i = 0; i < wordCount; i++) wordArray[i] = 0;
            let bytePos = 0;
            let byteCount = 0;
            while (byteCount < str.length) {
                const byteOffset = (byteCount % 4) * 8;
                wordArray[bytePos] = wordArray[bytePos] | (str.charCodeAt(byteCount) << byteOffset);
                byteCount++;
                bytePos = (byteCount - (byteCount % 4 === 0 ? 1 : 0)) + ((byteCount % 4 === 0) ? 1 : 0);
                if (((byteCount % 4) === 0)) bytePos++;
            }
            const byteOffset = (byteCount % 4) * 8;
            wordArray[bytePos] = wordArray[bytePos] | (0x80 << byteOffset);
            wordArray[wordCount - 2] = str.length << 3;
            wordArray[wordCount - 1] = str.length >>> 29;
            return wordArray;
        }

        function wordToHex(value) {
            let hex = '';
            for (let i = 0; i <= 3; i++) {
                const byte = (value >>> (i * 8)) & 255;
                hex += (byte < 16 ? '0' : '') + byte.toString(16);
            }
            return hex;
        }

        const x = convertToWordArray(string);
        let a = 0x67452301, b = 0xEFCDAB89, C = 0x98BADCFE, d = 0x10325476;
        for (let k = 0; k < x.length; k += 16) {
            const AA = a, BB = b, CC = C, DD = d;
            a = FF(a, b, C, d, x[k + 0], 7, 0xD76AA478);
            d = FF(d, a, b, C, x[k + 1], 12, 0xE8C7B756);
            C = FF(C, d, a, b, x[k + 2], 17, 0x242070DB);
            b = FF(b, C, d, a, x[k + 3], 22, 0xC1BDCEEE);
            a = FF(a, b, C, d, x[k + 4], 7, 0xF57C0FAF);
            d = FF(d, a, b, C, x[k + 5], 12, 0x4787C62A);
            C = FF(C, d, a, b, x[k + 6], 17, 0xA8304613);
            b = FF(b, C, d, a, x[k + 7], 22, 0xFD469501);
            a = FF(a, b, C, d, x[k + 8], 7, 0x698098D8);
            d = FF(d, a, b, C, x[k + 9], 12, 0x8B44F7AF);
            C = FF(C, d, a, b, x[k + 10], 17, 0xFFFF5BB1);
            b = FF(b, C, d, a, x[k + 11], 22, 0x895CD7BE);
            a = FF(a, b, C, d, x[k + 12], 7, 0x6B901122);
            d = FF(d, a, b, C, x[k + 13], 12, 0xFD987193);
            C = FF(C, d, a, b, x[k + 14], 17, 0xA679438E);
            b = FF(b, C, d, a, x[k + 15], 22, 0x49B40821);
            a = GG(a, b, C, d, x[k + 1], 5, 0xF61E2562);
            d = GG(d, a, b, C, x[k + 6], 9, 0xC040B340);
            C = GG(C, d, a, b, x[k + 11], 14, 0x265E5A51);
            b = GG(b, C, d, a, x[k + 0], 20, 0xE9B6C7AA);
            a = GG(a, b, C, d, x[k + 5], 5, 0xD62F105D);
            d = GG(d, a, b, C, x[k + 10], 9, 0x2441453);
            C = GG(C, d, a, b, x[k + 15], 14, 0xD8A1E681);
            b = GG(b, C, d, a, x[k + 4], 20, 0xE7D3FBC8);
            a = GG(a, b, C, d, x[k + 9], 5, 0x21E1CDE6);
            d = GG(d, a, b, C, x[k + 14], 9, 0xC33707D6);
            C = GG(C, d, a, b, x[k + 3], 14, 0xF4D50D87);
            b = GG(b, C, d, a, x[k + 8], 20, 0x455A14ED);
            a = GG(a, b, C, d, x[k + 13], 5, 0xA9E3E905);
            d = GG(d, a, b, C, x[k + 2], 9, 0xFCEFA3F8);
            C = GG(C, d, a, b, x[k + 7], 14, 0x676F02D9);
            b = GG(b, C, d, a, x[k + 12], 20, 0x8D2A4C8A);
            a = HH(a, b, C, d, x[k + 5], 4, 0xFFFA3942);
            d = HH(d, a, b, C, x[k + 8], 11, 0x8771F681);
            C = HH(C, d, a, b, x[k + 11], 16, 0x6D9D6122);
            b = HH(b, C, d, a, x[k + 14], 23, 0xFDE5380C);
            a = HH(a, b, C, d, x[k + 1], 4, 0xA4BEEA44);
            d = HH(d, a, b, C, x[k + 4], 11, 0x4BDECFA9);
            C = HH(C, d, a, b, x[k + 7], 16, 0xF6BB4B60);
            b = HH(b, C, d, a, x[k + 10], 23, 0xBEBFBC70);
            a = HH(a, b, C, d, x[k + 13], 4, 0x289B7EC6);
            d = HH(d, a, b, C, x[k + 0], 11, 0xEAA127FA);
            C = HH(C, d, a, b, x[k + 3], 16, 0xD4EF3085);
            b = HH(b, C, d, a, x[k + 6], 23, 0x4881D05);
            a = HH(a, b, C, d, x[k + 9], 4, 0xD9D4D039);
            d = HH(d, a, b, C, x[k + 12], 11, 0xE6DB99E5);
            C = HH(C, d, a, b, x[k + 15], 16, 0x1FA27CF8);
            b = HH(b, C, d, a, x[k + 2], 23, 0xC4AC5665);
            a = II(a, b, C, d, x[k + 0], 6, 0xF4292244);
            d = II(d, a, b, C, x[k + 7], 10, 0x432AFF97);
            C = II(C, d, a, b, x[k + 14], 15, 0xAB9423A7);
            b = II(b, C, d, a, x[k + 5], 21, 0xFC93A039);
            a = II(a, b, C, d, x[k + 12], 6, 0x655B59C3);
            d = II(d, a, b, C, x[k + 3], 10, 0x8F0CCC92);
            C = II(C, d, a, b, x[k + 10], 15, 0xFFEFF47D);
            b = II(b, C, d, a, x[k + 1], 21, 0x85845DD1);
            a = II(a, b, C, d, x[k + 8], 6, 0x6FA87E4F);
            d = II(d, a, b, C, x[k + 15], 10, 0xFE2CE6E0);
            C = II(C, d, a, b, x[k + 6], 15, 0xA3014314);
            b = II(b, C, d, a, x[k + 13], 21, 0x4E0811A1);
            a = II(a, b, C, d, x[k + 4], 6, 0xF7537E82);
            d = II(d, a, b, C, x[k + 11], 10, 0xBD3AF235);
            C = II(C, d, a, b, x[k + 2], 15, 0x2AD7D2BB);
            b = II(b, C, d, a, x[k + 9], 21, 0xEB86D391);
            a = addUnsigned(a, AA);
            b = addUnsigned(b, BB);
            C = addUnsigned(C, CC);
            d = addUnsigned(d, DD);
        }
        return (wordToHex(a) + wordToHex(b) + wordToHex(C) + wordToHex(d)).toLowerCase();
    }
}
