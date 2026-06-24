// SHA 加密模块（SHA-1 / SHA-256）
class ShaModule {
    constructor() {
        this.title = 'SHA 加密';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输入文本</label>
                    <textarea id="sha-input" placeholder="输入要加密的文本..." style="width:100%;min-height:120px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="text-align:center;">
                    <button class="btn btn-primary" onclick="app.modules.sha.encryptAll()" style="padding:10px 24px;">加密</button>
                </div>
                <div style="display:grid;gap:12px;">
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">SHA-1 (40位)</div>
                        <div id="sha1-output" style="font-family:monospace;font-size:13px;color:var(--success);word-break:break-all;">-</div>
                    </div>
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">SHA-256 (64位)</div>
                        <div id="sha256-output" style="font-family:monospace;font-size:13px;color:var(--success);word-break:break-all;">-</div>
                    </div>
                </div>
            </div>
        `;
    }

    encryptAll() {
        const input = document.getElementById('sha-input').value;
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }

        document.getElementById('sha1-output').textContent = this.sha1(input);
        document.getElementById('sha256-output').textContent = this.sha256(input);
        app.setStatus('加密成功');
    }

    // SHA-1 算法
    sha1(str) {
        function rotateLeft(n, s) {
            return (n << s) | (n >>> (32 - s));
        }

        function cvtHex(val) {
            let str = '';
            for (let i = 7; i >= 0; i--) {
                str += ((val >>> (i * 4)) & 0xF).toString(16);
            }
            return str;
        }

        let blockStart;
        let i;
        let j;
        const W = new Array(80);
        let H0 = 0x67452301;
        let H1 = 0xEFCDAB89;
        let H2 = 0x98BADCFE;
        let H3 = 0x10325476;
        let H4 = 0xC3D2E1F0;
        let A, B, C, D, E;
        let temp;
        const strLen = str.length;
        const wordArray = new Array();
        const wordCount = ((strLen + 8) - ((strLen + 8) % 64)) / 64 + 1;
        for (i = 0; i < wordCount; i++) {
            wordArray[i] = new Array(16);
            for (j = 0; j < 16; j++) {
                wordArray[i][j] = 0;
            }
        }
        for (i = 0; i < strLen; i++) {
            const k = Math.floor(i / 4);
            const l = (i % 4) * 8;
            wordArray[k][3 - (i % 4)] = wordArray[k][3 - (i % 4)] | (str.charCodeAt(i) << l);
        }
        const byteLen = strLen * 8;
        const lsw = (byteLen & 0xFFFF);
        const msw = Math.floor(byteLen / 0x10000);
        const k = Math.floor(strLen / 4);
        const l = strLen % 4;
        wordArray[k][15 - l] = 0x80 << (l * 8);
        wordArray[wordCount - 1][0] = msw;
        wordArray[wordCount - 1][1] = lsw;

        for (blockStart = 0; blockStart < wordCount; blockStart++) {
            for (i = 0; i < 16; i++) W[i] = wordArray[blockStart][i];
            for (i = 16; i < 80; i++) W[i] = rotateLeft(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);

            A = H0; B = H1; C = H2; D = H3; E = H4;

            for (i = 0; i < 20; i++) {
                temp = (rotateLeft(A, 5) + ((B & C) | ((~B) & D)) + E + W[i] + 0x5A827999) & 0xFFFFFFFF;
                E = D; D = C; C = rotateLeft(B, 30); B = A; A = temp;
            }
            for (; i < 40; i++) {
                temp = (rotateLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0xFFFFFFFF;
                E = D; D = C; C = rotateLeft(B, 30); B = A; A = temp;
            }
            for (; i < 60; i++) {
                temp = (rotateLeft(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0xFFFFFFFF;
                E = D; D = C; C = rotateLeft(B, 30); B = A; A = temp;
            }
            for (; i < 80; i++) {
                temp = (rotateLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0xFFFFFFFF;
                E = D; D = C; C = rotateLeft(B, 30); B = A; A = temp;
            }

            H0 = (H0 + A) & 0xFFFFFFFF;
            H1 = (H1 + B) & 0xFFFFFFFF;
            H2 = (H2 + C) & 0xFFFFFFFF;
            H3 = (H3 + D) & 0xFFFFFFFF;
            H4 = (H4 + E) & 0xFFFFFFFF;
        }

        return (cvtHex(H0) + cvtHex(H1) + cvtHex(H2) + cvtHex(H3) + cvtHex(H4)).toLowerCase();
    }

    // SHA-256 算法
    sha256(str) {
        function safeAdd(x, y) {
            const lsw = (x & 0xFFFF) + (y & 0xFFFF);
            const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        }
        function rotr(num, cnt) { return (num >>> cnt) | (num << (32 - cnt)); }

        function ch(x, y, z) { return (x & y) ^ ((~x) & z); }
        function maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }
        function sigma0(x) { return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22); }
        function sigma1(x) { return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25); }
        function gamma0(x) { return rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3); }
        function gamma1(x) { return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10); }

        const K = new Array(
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        );

        // 将字符串转换为字节数组（UTF-8）
        const utf8 = unescape(encodeURIComponent(str));
        const bytes = new Array(utf8.length);
        for (let i = 0; i < utf8.length; i++) {
            bytes[i] = utf8.charCodeAt(i);
        }

        const byteLen = bytes.length;
        const bitLenHigh = Math.floor(byteLen / 0x20000000);
        const bitLenLow = byteLen * 8;

        // 填充
        const blockCount = Math.floor((byteLen + 8 + 64) / 64);
        const blocks = new Array(blockCount * 16);

        for (let i = 0; i < blocks.length; i++) blocks[i] = 0;
        for (let i = 0; i < byteLen; i++) {
            blocks[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
        }
        blocks[byteLen >> 2] |= 0x80 << (24 - (byteLen % 4) * 8);
        blocks[blocks.length - 2] = bitLenHigh;
        blocks[blocks.length - 1] = bitLenLow;

        let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
            h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

        for (let block = 0; block < blocks.length; block += 16) {
            const w = new Array(64);
            for (let i = 0; i < 16; i++) w[i] = blocks[block + i];
            for (let i = 16; i < 64; i++) {
                w[i] = safeAdd(safeAdd(safeAdd(gamma1(w[i - 2]), w[i - 7]), gamma0(w[i - 15])), w[i - 16]);
            }

            let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

            for (let i = 0; i < 64; i++) {
                const t1 = safeAdd(safeAdd(safeAdd(safeAdd(h, sigma1(e)), ch(e, f, g)), K[i]), w[i]);
                const t2 = safeAdd(sigma0(a), maj(a, b, c));
                h = g; g = f; f = e; e = safeAdd(d, t1); d = c; c = b; b = a; a = safeAdd(t1, t2);
            }

            h0 = safeAdd(h0, a); h1 = safeAdd(h1, b); h2 = safeAdd(h2, c); h3 = safeAdd(h3, d);
            h4 = safeAdd(h4, e); h5 = safeAdd(h5, f); h6 = safeAdd(h6, g); h7 = safeAdd(h7, h);
        }

        function toHex(num) {
            let hex = '';
            for (let i = 7; i >= 0; i--) {
                hex += ((num >>> (i * 4)) & 0xF).toString(16);
            }
            return hex;
        }

        return (toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7)).toLowerCase();
    }
}
