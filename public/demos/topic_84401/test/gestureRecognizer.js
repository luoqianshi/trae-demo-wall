const Finger = {
    Thumb: 0,
    Index: 1,
    Middle: 2,
    Ring: 3,
    Pinky: 4
};

const FingerCurl = {
    NoCurl: 0,
    HalfCurl: 1,
    FullCurl: 2
};

const FingerDirection = {
    VerticalUp: 0,
    VerticalDown: 1,
    HorizontalLeft: 2,
    HorizontalRight: 3,
    DiagonalUpRight: 4,
    DiagonalUpLeft: 5,
    DiagonalDownRight: 6,
    DiagonalDownLeft: 7
};

class GestureDescription {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName || name;
        this.curls = {};
        this.directions = {};
        
        for (let i = 0; i < 5; i++) {
            this.curls[i] = [];
            this.directions[i] = [];
        }
    }

    addCurl(finger, curl, weight = 1.0) {
        this.curls[finger].push({ curl, weight });
    }

    addDirection(finger, direction, weight = 1.0) {
        this.directions[finger].push({ direction, weight });
    }
}

class FingerPoseEstimator {
    static getFingerCurl(landmarks, fingerIndex) {
        const fingerTips = [4, 8, 12, 16, 20];
        const fingerPips = [2, 6, 10, 14, 18];
        const fingerMCPs = [1, 5, 9, 13, 17];
        
        const tip = landmarks[fingerTips[fingerIndex]];
        const pip = landmarks[fingerPips[fingerIndex]];
        const mcp = landmarks[fingerMCPs[fingerIndex]];
        const wrist = landmarks[0];

        if (fingerIndex === Finger.Thumb) {
            const thumbTipToMCP = Math.sqrt(
                Math.pow(tip.x - mcp.x, 2) + Math.pow(tip.y - mcp.y, 2)
            );
            const indexMCPToWrist = Math.sqrt(
                Math.pow(landmarks[5].x - wrist.x, 2) + Math.pow(landmarks[5].y - wrist.y, 2)
            );
            
            const thumbToIndex = Math.sqrt(
                Math.pow(tip.x - landmarks[5].x, 2) + Math.pow(tip.y - landmarks[5].y, 2)
            );

            if (thumbTipToMCP > indexMCPToWrist * 0.6) {
                if (thumbToIndex < indexMCPToWrist * 0.5) {
                    return FingerCurl.HalfCurl;
                }
                return FingerCurl.NoCurl;
            }
            return FingerCurl.FullCurl;
        }

        const vectorTipPip = { x: tip.x - pip.x, y: tip.y - pip.y };
        const vectorPipMCP = { x: pip.x - mcp.x, y: pip.y - mcp.y };
        
        const dotProduct = vectorTipPip.x * vectorPipMCP.x + vectorTipPip.y * vectorPipMCP.y;
        const magnitudeTipPip = Math.sqrt(vectorTipPip.x ** 2 + vectorTipPip.y ** 2);
        const magnitudePipMCP = Math.sqrt(vectorPipMCP.x ** 2 + vectorPipMCP.y ** 2);
        
        const cosAngle = dotProduct / (magnitudeTipPip * magnitudePipMCP + 0.0001);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

        if (angle < 0.5) {
            return FingerCurl.NoCurl;
        } else if (angle < 1.5) {
            return FingerCurl.HalfCurl;
        } else {
            return FingerCurl.FullCurl;
        }
    }

    static getFingerDirection(landmarks, fingerIndex) {
        const fingerTips = [4, 8, 12, 16, 20];
        const fingerMCPs = [1, 5, 9, 13, 17];
        
        const tip = landmarks[fingerTips[fingerIndex]];
        const mcp = landmarks[fingerMCPs[fingerIndex]];
        
        const dx = tip.x - mcp.x;
        const dy = tip.y - mcp.y;
        
        const angle = Math.atan2(dy, dx);
        
        if (angle >= -Math.PI / 8 && angle < Math.PI / 8) {
            return FingerDirection.HorizontalRight;
        } else if (angle >= Math.PI / 8 && angle < 3 * Math.PI / 8) {
            return FingerDirection.DiagonalDownRight;
        } else if (angle >= 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) {
            return FingerDirection.VerticalDown;
        } else if (angle >= 5 * Math.PI / 8 && angle < 7 * Math.PI / 8) {
            return FingerDirection.DiagonalDownLeft;
        } else if (angle >= 7 * Math.PI / 8 || angle < -7 * Math.PI / 8) {
            return FingerDirection.HorizontalLeft;
        } else if (angle >= -7 * Math.PI / 8 && angle < -5 * Math.PI / 8) {
            return FingerDirection.DiagonalUpLeft;
        } else if (angle >= -5 * Math.PI / 8 && angle < -3 * Math.PI / 8) {
            return FingerDirection.VerticalUp;
        } else {
            return FingerDirection.DiagonalUpRight;
        }
    }

    static estimatePose(landmarks) {
        const poseData = [];
        
        for (let i = 0; i < 5; i++) {
            const curl = this.getFingerCurl(landmarks, i);
            const direction = this.getFingerDirection(landmarks, i);
            poseData.push({ finger: i, curl, direction });
        }
        
        return poseData;
    }
}

class GestureEstimator {
    constructor(gestures) {
        this.gestures = gestures;
    }

    estimate(landmarks, minScore = 8.0) {
        const poseData = FingerPoseEstimator.estimatePose(landmarks);
        
        const results = [];
        
        for (const gesture of this.gestures) {
            let score = 0;
            let maxScore = 0;
            
            for (let i = 0; i < 5; i++) {
                const fingerPose = poseData[i];
                
                if (gesture.curls[i].length > 0) {
                    maxScore += 2;
                    let bestCurlMatch = 0;
                    for (const curlDesc of gesture.curls[i]) {
                        if (curlDesc.curl === fingerPose.curl) {
                            bestCurlMatch = Math.max(bestCurlMatch, curlDesc.weight);
                        }
                    }
                    score += bestCurlMatch * 2;
                }
                
                if (gesture.directions[i].length > 0) {
                    maxScore += 2;
                    let bestDirMatch = 0;
                    for (const dirDesc of gesture.directions[i]) {
                        if (dirDesc.direction === fingerPose.direction) {
                            bestDirMatch = Math.max(bestDirMatch, dirDesc.weight);
                        }
                    }
                    score += bestDirMatch * 2;
                }
            }
            
            if (maxScore > 0) {
                score = (score / maxScore) * 10;
            }
            
            if (score >= minScore) {
                results.push({
                    name: gesture.name,
                    displayName: gesture.displayName,
                    score: Math.round(score * 100) / 100,
                    poseData
                });
            }
        }
        
        results.sort((a, b) => b.score - a.score);
        
        return {
            poseData,
            gestures: results
        };
    }
}

const Gestures = {};

function createBasicGesture(name, displayName, fingerStates) {
    const gesture = new GestureDescription(name, displayName);
    for (let i = 0; i < 5; i++) {
        if (fingerStates[i] === 1) {
            gesture.addCurl(i, FingerCurl.NoCurl, 1.0);
            gesture.addCurl(i, FingerCurl.HalfCurl, 0.9);
        } else if (fingerStates[i] === 0) {
            gesture.addCurl(i, FingerCurl.FullCurl, 1.0);
            gesture.addCurl(i, FingerCurl.HalfCurl, 0.9);
        } else {
            gesture.addCurl(i, FingerCurl.NoCurl, 0.5);
            gesture.addCurl(i, FingerCurl.FullCurl, 0.5);
        }
    }
    return gesture;
}

Gestures.ThumbsUp = (() => {
    const g = new GestureDescription('thumbs_up', '👍 点赞');
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
    g.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 1.0);
    g.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.9);
    g.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.9);
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.FullCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    return g;
})();

Gestures.ThumbsDown = (() => {
    const g = new GestureDescription('thumbs_down', '👎 踩');
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
    g.addDirection(Finger.Thumb, FingerDirection.VerticalDown, 1.0);
    g.addDirection(Finger.Thumb, FingerDirection.DiagonalDownLeft, 0.9);
    g.addDirection(Finger.Thumb, FingerDirection.DiagonalDownRight, 0.9);
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.FullCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    return g;
})();

Gestures.Victory = (() => {
    const g = new GestureDescription('victory', '✌️ 胜利');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.9);
    return g;
})();

Gestures.Peace = Gestures.Victory;

Gestures.ILoveYou = (() => {
    const g = new GestureDescription('i_love_you', '🤟 我爱你');
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.HalfCurl, 0.9);
    return g;
})();

Gestures.Rock = (() => {
    const g = new GestureDescription('rock', '🤘 摇滚');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.9);
    return g;
})();

Gestures.OpenHand = (() => {
    const g = new GestureDescription('open_hand', '🖐️ 张开手');
    for (let f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    return g;
})();

Gestures.Fist = (() => {
    const g = new GestureDescription('fist', '✊ 握拳');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.FullCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
    return g;
})();

Gestures.One = createBasicGesture('one', '✋ 一', [0, 1, 0, 0, 0]);
Gestures.Two = createBasicGesture('two', '✌️ 二', [0, 1, 1, 0, 0]);
Gestures.Three = createBasicGesture('three', '🤟 三', [0, 1, 1, 1, 0]);
Gestures.Four = createBasicGesture('four', '🖐️ 四', [0, 1, 1, 1, 1]);
Gestures.Five = createBasicGesture('five', '🖐️ 五', [1, 1, 1, 1, 1]);
Gestures.Six = createBasicGesture('six', '🤙 六', [1, 1, 0, 0, 0]);
Gestures.Seven = createBasicGesture('seven', '👍 七', [1, 0, 0, 0, 0]);
Gestures.Eight = createBasicGesture('eight', '🤟 八', [1, 1, 0, 0, 0]);
Gestures.Nine = createBasicGesture('nine', '💅 九', [0, 0, 0, 0, 1]);
Gestures.Zero = createBasicGesture('zero', '✊ 零', [0, 0, 0, 0, 0]);

Gestures.Hello = (() => {
    const g = new GestureDescription('hello', '👋 你好');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
    return g;
})();

Gestures.ThankYou = (() => {
    const g = new GestureDescription('thank_you', '🙏 谢谢');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 0.6);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 0.6);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 0.6);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 0.6);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.6);
    return g;
})();

Gestures.Sorry = (() => {
    const g = new GestureDescription('sorry', '🙇 抱歉');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.6);
    return g;
})();

Gestures.Yes = (() => {
    const g = new GestureDescription('yes', '👌 是');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.5);
    return g;
})();

Gestures.No = (() => {
    const g = new GestureDescription('no', '🙅 不');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.8);
    return g;
})();

Gestures.Help = (() => {
    const g = new GestureDescription('help', '🆘 帮助');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
    return g;
})();

Gestures.Friend = (() => {
    const g = new GestureDescription('friend', '🤝 朋友');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.6);
    return g;
})();

Gestures.Like = (() => {
    const g = new GestureDescription('like', '❤️ 喜欢');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.6);
    return g;
})();

Gestures.Love = (() => {
    const g = new GestureDescription('love', '💕 爱');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
    g.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 0.8);
    return g;
})();

Gestures.Good = (() => {
    const g = new GestureDescription('good', '👌 很棒');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.6);
    return g;
})();

Gestures.Ok = (() => {
    const g = new GestureDescription('ok', '👌 没问题');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.8);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.HalfCurl, 0.8);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
    return g;
})();

Gestures.Stop = (() => {
    const g = new GestureDescription('stop', '✋ 停');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
    return g;
})();

Gestures.Quiet = (() => {
    const g = new GestureDescription('quiet', '🤫 安静');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.6);
    return g;
})();

Gestures.Please = (() => {
    const g = new GestureDescription('please', '🙏 请');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 0.8);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 0.8);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 0.8);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 0.8);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.6);
    return g;
})();

Gestures.Welcome = (() => {
    const g = new GestureDescription('welcome', '🤗 欢迎');
    for (let f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    return g;
})();

Gestures.Goodbye = (() => {
    const g = new GestureDescription('goodbye', '👋 再见');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
    return g;
})();

Gestures.Come = (() => {
    const g = new GestureDescription('come', '👋 过来');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.6);
    return g;
})();

Gestures.Call = (() => {
    const g = new GestureDescription('call', '📞 打电话');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
    return g;
})();

Gestures.Clap = (() => {
    const g = new GestureDescription('clap', '👏 鼓掌');
    for (let f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    return g;
})();

Gestures.Cheer = (() => {
    const g = new GestureDescription('cheer', '💪 加油');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.FullCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
    return g;
})();

Gestures.Great = (() => {
    const g = new GestureDescription('great', '🌟 很棒');
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);
    return g;
})();

Gestures.Need = (() => {
    const g = new GestureDescription('need', '💡 需要');
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);
    return g;
})();

Gestures.Open = (() => {
    const g = new GestureDescription('open', '📖 打开');
    for (let f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    return g;
})();

Gestures.Close = (() => {
    const g = new GestureDescription('close', '🔒 关闭');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.FullCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
    return g;
})();

Gestures.Up = (() => {
    const g = new GestureDescription('up', '⬆️ 上');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
        g.addDirection(f, FingerDirection.VerticalUp, 0.8);
    }
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.6);
    return g;
})();

Gestures.Down = (() => {
    const g = new GestureDescription('down', '⬇️ 下');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
        g.addDirection(f, FingerDirection.VerticalDown, 0.8);
    }
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.6);
    return g;
})();

Gestures.Left = (() => {
    const g = new GestureDescription('left', '⬅️ 左');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
        g.addDirection(f, FingerDirection.HorizontalLeft, 0.8);
    }
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.6);
    return g;
})();

Gestures.Right = (() => {
    const g = new GestureDescription('right', '➡️ 右');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.NoCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
        g.addDirection(f, FingerDirection.HorizontalRight, 0.8);
    }
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.6);
    return g;
})();

Gestures.Water = (() => {
    const g = new GestureDescription('water', '💧 水');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);
    return g;
})();

Gestures.Food = (() => {
    const g = new GestureDescription('food', '🍎 食物');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
    return g;
})();

Gestures.Happy = (() => {
    const g = new GestureDescription('happy', '😊 开心');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.8);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
    return g;
})();

Gestures.Sad = (() => {
    const g = new GestureDescription('sad', '😢 难过');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.6);
    return g;
})();

Gestures.Angry = (() => {
    const g = new GestureDescription('angry', '😠 生气');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.FullCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
    return g;
})();

Gestures.Sick = (() => {
    const g = new GestureDescription('sick', '🤒 生病');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);
    return g;
})();

Gestures.Tired = (() => {
    const g = new GestureDescription('tired', '😴 累');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
    return g;
})();

Gestures.Sleep = (() => {
    const g = new GestureDescription('sleep', '💤 睡觉');
    for (let f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
        g.addCurl(f, FingerCurl.FullCurl, 1.0);
        g.addCurl(f, FingerCurl.HalfCurl, 0.9);
    }
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
    return g;
})();

Gestures.Bathroom = (() => {
    const g = new GestureDescription('bathroom', '🚽 厕所');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);
    return g;
})();

Gestures.Hospital = (() => {
    const g = new GestureDescription('hospital', '🏥 医院');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);
    return g;
})();

Gestures.School = (() => {
    const g = new GestureDescription('school', '🏫 学校');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);
    return g;
})();

Gestures.Work = (() => {
    const g = new GestureDescription('work', '💼 工作');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
    return g;
})();

Gestures.Money = (() => {
    const g = new GestureDescription('money', '💰 钱');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
    return g;
})();

Gestures.Time = (() => {
    const g = new GestureDescription('time', '⏰ 时间');
    g.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
    return g;
})();

Gestures.Home = (() => {
    const g = new GestureDescription('home', '🏠 家');
    g.addCurl(Finger.Index, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.9);
    g.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
    g.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.7);
    return g;
})();

const AllGestures = Object.values(Gestures);

function getGestureList() {
    return AllGestures.map(g => g.displayName);
}