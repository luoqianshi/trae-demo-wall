/* ================================================================
 *  焊点侠 — AI伴读式嵌入式学习助手 · 核心逻辑
 * ================================================================ */

/* ----- 全局状态 ----- */
let selectedLevel = null;
let selectedGoal = null;

/* ==========================
 *  Tab 切换
 * ========================== */
function switchTab(tab) {
  document
    .querySelectorAll(".nav-tab")
    .forEach((t) => t.classList.remove("active"));
  document.querySelector(`.nav-tab[data-tab="${tab}"]`).classList.add("active");
  document
    .querySelectorAll(".module")
    .forEach((m) => m.classList.remove("active"));
  document.getElementById("module-" + tab).classList.add("active");
}

/* ==========================
 *  代码伴读模块
 * ========================== */

/* 预置示例代码 */
const examples = [
  {
    name: "STM32 GPIO 点亮LED",
    code: `#include "stm32f10x.h"

void GPIO_Init(void) {
    // 配置PA5为推挽输出模式
    GPIOA->ODR &= ~(1 << 5);
    GPIOA->CRL &= ~(0xF << 20);
    GPIOA->CRL |= (0x3 << 20);
}

void delay_ms(uint32_t ms) {
    for (uint32_t i = 0; i < ms * 8000; i++) {
        __NOP();
    }
}

int main(void) {
    GPIO_Init();

    while (1) {
        GPIOA->ODR ^= (1 << 5);
        delay_ms(500);
    }
}`,
    analysis: [
      {
        type: "info",
        tag: "include",
        tagText: "头文件",
        lines: "第1行",
        title: "引入STM32标准外设库头文件",
        body: '<span class="code-ref">#include "stm32f10x.h"</span> 是STM32F10x系列的标准外设库头文件。它包含了所有外设的寄存器定义、结构体声明和宏定义，是编写STM32程序的<strong>基础入口</strong>。',
      },
      {
        type: "register",
        tag: "register",
        tagText: "寄存器",
        lines: "第5-6行",
        title: "GPIO输出数据寄存器操作",
        body: '<span class="register-ref">GPIOA->ODR</span> 是端口输出数据寄存器（Output Data Register）。<span class="code-ref">&= ~(1 << 5)</span> 先将PA5引脚置低（LED熄灭状态）。ODR的每一位对应一个引脚的高/低电平输出。',
      },
      {
        type: "register",
        tag: "register",
        tagText: "寄存器",
        lines: "第7-8行",
        title: "GPIO端口配置寄存器设置",
        body: '<span class="register-ref">GPIOA->CRL</span> 控制PA0~PA7的模式和速度。<span class="code-ref">&= ~(0xF << 20)</span> 清除PA5的配置位（4位一组），<span class="code-ref">|= (0x3 << 20)</span> 设置为<strong>通用推挽输出模式</strong>，速度50MHz。推挽输出可以主动驱动高低电平，适合驱动LED。',
      },
      {
        type: "warn",
        tag: "bug",
        tagText: "Bug预警",
        lines: "缺失",
        title: "未使能GPIOA时钟 — 严重错误",
        body: '<span class="bug-text">这段代码缺少最关键的步骤：未使能GPIOA的外设时钟！</span><br><br>STM32的所有外设在复位后默认是关闭的，必须先在<span class="register-ref">RCC->APB2ENR</span>寄存器中使能对应时钟。<br><br><strong>修复方法</strong>：在 GPIO_Init() 的开头添加：<br><span class="code-ref">RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;</span><br><br>没有这行代码，GPIOA寄存器的写入将<strong>完全无效</strong>，LED不会亮起。',
      },
      {
        type: "info",
        tag: "function",
        tagText: "函数",
        lines: "第10-13行",
        title: "软件延时函数",
        body: '<span class="code-ref">delay_ms()</span> 使用空循环实现粗略延时。循环次数 <span class="code-ref">ms * 8000</span> 是经验值，在72MHz主频下大约对应毫秒级延时。这种方法<strong>不精确</strong>，受编译器优化等级影响。工程中建议使用SysTick定时器或硬件延时。',
      },
      {
        type: "good",
        tag: "init",
        tagText: "主流程",
        lines: "第15-21行",
        title: "主函数与LED闪烁循环",
        body: '<span class="code-ref">GPIO_Init()</span> 完成初始化后，主循环中 <span class="code-ref">GPIOA->ODR ^= (1 << 5)</span> 使用异或操作翻转PA5的电平，实现LED闪烁效果。逻辑简洁明了，但要注意<strong>必须先修复时钟使能问题</strong>才能正常工作。',
      },
    ],
    flowchart: `
      <svg width="520" height="260" viewBox="0 0 520 260" style="font-family:var(--font-sans)">
        <defs>
          <marker id="arrowG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#00ff88"/>
          </marker>
          <marker id="arrowP" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#b388ff"/>
          </marker>
          <marker id="arrowR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff5252"/>
          </marker>
        </defs>
        <rect x="200" y="10" width="120" height="38" rx="6" fill="#00ff8820" stroke="#00ff88" stroke-width="1.5"/>
        <text x="260" y="34" text-anchor="middle" fill="#00ff88" font-size="13" font-weight="600">main()</text>
        <rect x="80" y="80" width="140" height="38" rx="6" fill="#b388ff20" stroke="#b388ff" stroke-width="1.5"/>
        <text x="150" y="104" text-anchor="middle" fill="#b388ff" font-size="13" font-weight="600">GPIO_Init()</text>
        <rect x="300" y="80" width="160" height="38" rx="6" fill="#ff525220" stroke="#ff5252" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text x="380" y="100" text-anchor="middle" fill="#ff5252" font-size="11" font-weight="600">RCC 时钟使能</text>
        <text x="380" y="114" text-anchor="middle" fill="#ff5252" font-size="10">（缺失！）</text>
        <rect x="80" y="170" width="140" height="38" rx="6" fill="#64b5f620" stroke="#64b5f6" stroke-width="1.5"/>
        <text x="150" y="194" text-anchor="middle" fill="#64b5f6" font-size="13" font-weight="600">delay_ms()</text>
        <rect x="290" y="170" width="160" height="38" rx="6" fill="#00ff8820" stroke="#00ff88" stroke-width="1.5"/>
        <text x="370" y="194" text-anchor="middle" fill="#00ff88" font-size="12" font-weight="600">GPIO ODR ^= 1&lt;&lt;5</text>
        <line x1="240" y1="48" x2="160" y2="78" stroke="#b388ff" stroke-width="1.5" marker-end="url(#arrowP)"/>
        <line x1="280" y1="48" x2="370" y2="78" stroke="#ff5252" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#arrowR)"/>
        <line x1="150" y1="118" x2="150" y2="168" stroke="#64b5f6" stroke-width="1.5" marker-end="url(#arrowG)"/>
        <line x1="220" y1="194" x2="288" y2="194" stroke="#00ff88" stroke-width="1.5" marker-end="url(#arrowG)"/>
        <path d="M 370 208 L 370 230 L 260 230 L 260 236" stroke="#00ff88" stroke-width="1.2" fill="none" stroke-dasharray="4,3" marker-end="url(#arrowG)"/>
        <text x="315" y="248" text-anchor="middle" fill="#707090" font-size="10">while(1) 循环</text>
      </svg>`,
  },
  {
    name: "STM32 I2C 读取温湿度传感器",
    code: `#include "stm32f10x.h"

#define SHT30_ADDR 0x44

void I2C1_Init(void) {
    // 使能I2C1和GPIOB时钟
    RCC->APB1ENR |= RCC_APB1ENR_I2C1EN;
    RCC->APB2ENR |= RCC_APB2ENR_IOPBEN;

    // 配置PB6=SCL, PB7=SDA为复用开漏输出
    GPIOB->CRL &= ~((0xF << 24) | (0xF << 28));
    GPIOB->CRL |= ((0xF << 24) | (0xF << 28));

    // I2C1配置：标准模式 100kHz
    I2C1->CR1 = 0x0000;
    I2C1->CR2 = 36;  // APB1时钟36MHz
    I2C1->CCR = 180; // 100kHz @ 36MHz
    I2C1->TRISE = 37;
    I2C1->CR1 |= I2C_CR1_PE; // 使能I2C1
}

uint8_t SHT30_ReadTemp(void) {
    uint8_t data[6];
    uint32_t timeout;

    // 发送起始条件 + 设备地址 + 写
    I2C1->CR1 |= I2C_CR1_START;
    timeout = 100000;
    while (!(I2C1->SR1 & I2C_SR1_SB)) {
        if (--timeout == 0) return 0xFF;
    }
    I2C1->DR = (SHT30_ADDR << 1) | 0;

    // 等待ADDR标志
    timeout = 100000;
    while (!(I2C1->SR1 & I2C_SR1_ADDR)) {
        if (--timeout == 0) return 0xFF;
    }
    (void)I2C1->SR1;
    (void)I2C1->SR2;

    // 发送测量命令 0x2C06
    I2C1->DR = 0x2C;
    while (!(I2C1->SR1 & I2C_SR1_TXE));

    I2C1->DR = 0x06;
    while (!(I2C1->SR1 & I2C_SR1_BTF));

    // 重新起始 + 读6字节
    I2C1->CR1 |= I2C_CR1_START;
    I2C1->DR = (SHT30_ADDR << 1) | 1;

    while (!(I2C1->SR1 & I2C_SR1_ADDR));
    (void)I2C1->SR1;
    (void)I2C1->SR2;

    for (int i = 0; i < 5; i++) {
        while (!(I2C1->SR1 & I2C_SR1_RXNE));
        data[i] = I2C1->DR;
    }

    I2C1->CR1 &= ~I2C_CR1_ACK;
    I2C1->CR1 |= I2C_CR1_STOP;
    while (!(I2C1->SR1 & I2C_SR1_RXNE));
    data[5] = I2C1->DR;

    // 计算温度（简化）
    uint16_t raw = (data[0] << 8) | data[1];
    return (uint8_t)(-45 + 175 * raw / 65535);
}

int main(void) {
    I2C1_Init();

    uint8_t temp;
    while (1) {
        temp = SHT30_ReadTemp();
        delay_ms(1000);
    }
}`,
    analysis: [
      {
        type: "register",
        tag: "register",
        tagText: "时钟",
        lines: "第7-8行",
        title: "正确使能I2C1和GPIOB时钟",
        body: '<span class="register-ref">RCC->APB1ENR</span> 使能I2C1外设时钟（挂载在APB1总线上），<span class="register-ref">RCC->APB2ENR</span> 使能GPIOB时钟。这是STM32编程的<strong>第一步</strong>——所有外设必须先使能时钟才能使用。',
      },
      {
        type: "register",
        tag: "register",
        tagText: "GPIO",
        lines: "第11-13行",
        title: "配置I2C引脚为复用开漏输出",
        body: 'PB6（SCL）和PB7（SDA）配置为<span class="register-ref">复用开漏输出</span>模式（<span class="code-ref">0xF = AF_OD</span>）。I2C总线<strong>必须使用开漏输出</strong>加外部上拉电阻，这是I2C协议的硬件要求。开漏模式下引脚只能拉低，高电平靠上拉电阻实现。',
      },
      {
        type: "info",
        tag: "function",
        tagText: "I2C配置",
        lines: "第15-21行",
        title: "I2C1标准模式初始化参数",
        body: '<span class="register-ref">I2C1->CR2 = 36</span> 设置APB1时钟频率为36MHz。<span class="register-ref">CCR = 180</span> 根据公式 <span class="code-ref">CRR = APB1_Freq / (2 * I2C_Clock)</span> 计算得到100kHz标准模式。<span class="register-ref">TRISE = 37</span> 设置上升时间（最大值=APB1/1MHz + 1）。最后<span class="code-ref">CR1 |= PE</span>使能I2C外设。',
      },
      {
        type: "info",
        tag: "function",
        tagText: "通信",
        lines: "第28-38行",
        title: "I2C起始条件与寻址",
        body: '<span class="code-ref">CR1 |= START</span> 产生起始条件。通过<span class="register-ref">SR1.SB</span>标志位等待起始条件发送完成。然后向<span class="register-ref">DR</span>写入设备地址 <span class="code-ref">0x44&lt;&lt;1 | 0</span>（写模式），表示要对SHT30传感器进行写操作。<span class="register-ref">SR1.ADDR</span>标志表示地址被应答。',
      },
      {
        type: "register",
        tag: "register",
        tagText: "数据",
        lines: "第44-49行",
        title: "发送SHT30测量命令",
        body: '向SHT30发送测量命令 <span class="code-ref">0x2C06</span>（单次测量，高重复性）。分两次写入 <span class="register-ref">DR</span> 寄存器。每次写入后通过 <span class="register-ref">SR1.TXE</span>（发送寄存器空）和 <span class="register-ref">SR1.BTF</span>（字节传输完成）标志等待传输完成。',
      },
      {
        type: "info",
        tag: "function",
        tagText: "数据接收",
        lines: "第52-67行",
        title: "重新起始条件后读取6字节数据",
        body: 'SHT30返回6字节数据：温度高8位、低8位、CRC、湿度高8位、低8位、CRC。读取前5字节时保持<span class="code-ref">ACK</span>开启，最后一个字节前关闭ACK并发送STOP条件，这是<strong>标准I2C多字节读取流程</strong>。',
      },
      {
        type: "info",
        tag: "function",
        tagText: "计算",
        lines: "第70-71行",
        title: "原始数据转换为温度值",
        body: 'SHT30温度计算公式：<span class="code-ref">T = -45 + 175 * raw / 65535</span>，其中raw是16位无符号整数。注意此处代码做了简化（直接强转uint8_t），实际项目中应保留浮点精度或放大100倍取整。',
      },
    ],
    flowchart: `
      <svg width="600" height="220" viewBox="0 0 600 220" style="font-family:var(--font-sans)">
        <defs>
          <marker id="arrowG2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#00ff88"/>
          </marker>
          <marker id="arrowP2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#b388ff"/>
          </marker>
        </defs>
        <rect x="20" y="10" width="110" height="36" rx="6" fill="#00ff8820" stroke="#00ff88" stroke-width="1.5"/>
        <text x="75" y="33" text-anchor="middle" fill="#00ff88" font-size="12" font-weight="600">main()</text>
        <rect x="10" y="80" width="130" height="36" rx="6" fill="#b388ff20" stroke="#b388ff" stroke-width="1.5"/>
        <text x="75" y="103" text-anchor="middle" fill="#b388ff" font-size="12" font-weight="600">I2C1_Init()</text>
        <rect x="180" y="80" width="160" height="36" rx="6" fill="#64b5f620" stroke="#64b5f6" stroke-width="1.5"/>
        <text x="260" y="103" text-anchor="middle" fill="#64b5f6" font-size="12" font-weight="600">SHT30_ReadTemp()</text>
        <rect x="400" y="10" width="100" height="30" rx="5" fill="#ffab4020" stroke="#ffab40" stroke-width="1.2"/>
        <text x="450" y="30" text-anchor="middle" fill="#ffab40" font-size="10">START + 写地址</text>
        <rect x="520" y="10" width="70" height="30" rx="5" fill="#4dd0e120" stroke="#4dd0e1" stroke-width="1.2"/>
        <text x="555" y="30" text-anchor="middle" fill="#4dd0e1" font-size="10">发命令</text>
        <rect x="400" y="50" width="100" height="30" rx="5" fill="#ffd74020" stroke="#ffd740" stroke-width="1.2"/>
        <text x="450" y="70" text-anchor="middle" fill="#ffd740" font-size="10">RESTART + 读</text>
        <rect x="520" y="50" width="70" height="30" rx="5" fill="#00ff8820" stroke="#00ff88" stroke-width="1.2"/>
        <text x="555" y="70" text-anchor="middle" fill="#00ff88" font-size="10">读6字节</text>
        <rect x="410" y="140" width="110" height="36" rx="6" fill="#64b5f620" stroke="#64b5f6" stroke-width="1.5"/>
        <text x="465" y="163" text-anchor="middle" fill="#64b5f6" font-size="11" font-weight="600">数据转换计算</text>
        <rect x="410" y="190" width="110" height="28" rx="5" fill="#b388ff20" stroke="#b388ff" stroke-width="1.2"/>
        <text x="465" y="209" text-anchor="middle" fill="#b388ff" font-size="10">返回温度值</text>
        <line x1="75" y1="46" x2="75" y2="78" stroke="#b388ff" stroke-width="1.5" marker-end="url(#arrowP2)"/>
        <line x1="75" y1="46" x2="260" y2="78" stroke="#00ff88" stroke-width="1.5" marker-end="url(#arrowG2)"/>
        <line x1="260" y1="80" x2="450" y2="42" stroke="#64b5f6" stroke-width="1.2" marker-end="url(#arrowG2)"/>
        <line x1="500" y1="42" x2="518" y2="42" stroke="#64b5f6" stroke-width="1" marker-end="url(#arrowG2)"/>
        <line x1="500" y1="82" x2="518" y2="82" stroke="#64b5f6" stroke-width="1" marker-end="url(#arrowG2)"/>
        <line x1="555" y1="82" x2="555" y2="140" stroke="#00ff88" stroke-width="1.2" marker-end="url(#arrowG2)"/>
        <line x1="465" y1="176" x2="465" y2="188" stroke="#b388ff" stroke-width="1.2" marker-end="url(#arrowP2)"/>
        <line x1="465" y1="218" x2="75" y2="218" stroke="#00ff88" stroke-width="1" stroke-dasharray="4,3" marker-end="url(#arrowG2)"/>
      </svg>`,
  },
  {
    name: "Arduino 超声波测距",
    code: `#define TRIG_PIN  9
#define ECHO_PIN  10

void setup() {
    Serial.begin(9600);
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
}

float getDistance() {
    // 发送10us高电平脉冲触发测距
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // 读取回波脉冲宽度（微秒）
    long duration = pulseIn(ECHO_PIN, HIGH);

    // 计算距离：声速340m/s，往返除以2
    float distance = duration * 0.034 / 2;
    return distance;
}

void loop() {
    float dist = getDistance();

    Serial.print("距离: ");
    Serial.print(dist);
    Serial.println(" cm");

    if (dist < 10) {
        Serial.println("警告：距离过近！");
    }

    delay(200);
}`,
    analysis: [
      {
        type: "info",
        tag: "include",
        tagText: "引脚定义",
        lines: "第1-2行",
        title: "超声波模块引脚定义",
        body: '<span class="code-ref">TRIG_PIN = 9</span> 为触发信号输出引脚，<span class="code-ref">ECHO_PIN = 10</span> 为回波信号输入引脚。HC-SR04超声波模块标准接法：Trig发送一个10us以上的脉冲，Echo返回高电平脉冲，脉冲宽度与距离成正比。',
      },
      {
        type: "info",
        tag: "init",
        tagText: "初始化",
        lines: "第4-8行",
        title: "Arduino setup() 初始化",
        body: '<span class="code-ref">Serial.begin(9600)</span> 以9600波特率初始化串口通信，用于在串口监视器输出测量结果。<span class="code-ref">pinMode()</span> 设置Trig为输出模式、Echo为输入模式。这是Arduino程序的<strong>标准入口</strong>。',
      },
      {
        type: "register",
        tag: "register",
        tagText: "信号",
        lines: "第13-17行",
        title: "发送超声波触发脉冲",
        body: '按照HC-SR04时序要求：先拉低Trig 2us确保干净信号，再拉高10us以上作为触发信号，最后拉低。这个时序<strong>必须严格遵守</strong>，否则传感器可能无法正确触发测量。<span class="code-ref">delayMicroseconds()</span> 提供微秒级精确延时。',
      },
      {
        type: "info",
        tag: "function",
        tagText: "测量",
        lines: "第20行",
        title: "pulseIn() 读取回波脉冲宽度",
        body: '<span class="code-ref">pulseIn(ECHO_PIN, HIGH)</span> 是Arduino内置函数，等待引脚变为HIGH后开始计时，变为LOW时停止计时，返回脉冲持续微秒数。注意：<strong>默认超时1秒</strong>，如果传感器无回波会阻塞程序1秒。',
      },
      {
        type: "info",
        tag: "function",
        tagText: "计算",
        lines: "第23行",
        title: "声速公式计算距离",
        body: '<span class="code-ref">distance = duration * 0.034 / 2</span><br><br>推导过程：<br>- 声速 = 340 m/s = 0.034 cm/us<br>- 脉冲时间对应<strong>往返距离</strong><br>- 除以2得到<strong>单程距离</strong><br><br>0.034是简化系数，实际温度会影响声速（每升高1度，声速约增0.6m/s）。',
      },
      {
        type: "good",
        tag: "function",
        tagText: "输出",
        lines: "第27-35行",
        title: "串口输出与近距离预警",
        body: '主循环每200ms测量一次，通过 <span class="code-ref">Serial.print()</span> 输出距离值。当距离 <span class="code-ref">&lt; 10cm</span> 时输出警告信息。这是一个完整的<strong>超声波避障</strong>基础框架，可扩展为自动避障小车、液位检测等项目。',
      },
    ],
    flowchart: `
      <svg width="500" height="240" viewBox="0 0 500 240" style="font-family:var(--font-sans)">
        <defs>
          <marker id="arrowG3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#00ff88"/>
          </marker>
          <marker id="arrowP3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#b388ff"/>
          </marker>
        </defs>
        <rect x="180" y="10" width="120" height="36" rx="6" fill="#ffab4020" stroke="#ffab40" stroke-width="1.5"/>
        <text x="240" y="33" text-anchor="middle" fill="#ffab40" font-size="12" font-weight="600">setup()</text>
        <rect x="30" y="70" width="140" height="36" rx="6" fill="#00ff8820" stroke="#00ff88" stroke-width="1.5"/>
        <text x="100" y="93" text-anchor="middle" fill="#00ff88" font-size="12" font-weight="600">getDistance()</text>
        <rect x="30" y="130" width="100" height="30" rx="5" fill="#b388ff20" stroke="#b388ff" stroke-width="1.2"/>
        <text x="80" y="149" text-anchor="middle" fill="#b388ff" font-size="10">发10us脉冲</text>
        <rect x="160" y="130" width="100" height="30" rx="5" fill="#64b5f620" stroke="#64b5f6" stroke-width="1.2"/>
        <text x="210" y="149" text-anchor="middle" fill="#64b5f6" font-size="10">pulseIn读回波</text>
        <rect x="300" y="130" width="100" height="30" rx="5" fill="#4dd0e120" stroke="#4dd0e1" stroke-width="1.2"/>
        <text x="350" y="149" text-anchor="middle" fill="#4dd0e1" font-size="10">计算距离</text>
        <rect x="280" y="70" width="190" height="36" rx="6" fill="#00ff8820" stroke="#00ff88" stroke-width="1.5"/>
        <text x="375" y="93" text-anchor="middle" fill="#00ff88" font-size="12" font-weight="600">Serial.print() + 判断</text>
        <line x1="100" y1="106" x2="80" y2="128" stroke="#b388ff" stroke-width="1.2" marker-end="url(#arrowP3)"/>
        <line x1="130" y1="140" x2="158" y2="140" stroke="#64b5f6" stroke-width="1" marker-end="url(#arrowG3)"/>
        <line x1="260" y1="140" x2="298" y2="140" stroke="#4dd0e1" stroke-width="1" marker-end="url(#arrowG3)"/>
        <line x1="100" y1="106" x2="375" y2="70" stroke="#00ff88" stroke-width="1.5" marker-end="url(#arrowG3)"/>
        <line x1="240" y1="46" x2="100" y2="68" stroke="#ffab40" stroke-width="1" stroke-dasharray="4,3"/>
        <path d="M 375 106 L 375 210 L 240 210 L 240 46" stroke="#00ff88" stroke-width="1.2" fill="none" stroke-dasharray="4,3" marker-end="url(#arrowG3)"/>
        <text x="310" y="228" text-anchor="middle" fill="#707090" font-size="10">loop() 循环 delay(200)</text>
      </svg>`,
  },
];

/* 加载示例代码 */
function loadExample(idx) {
  const textarea = document.getElementById("codeInput");
  const info = document.getElementById("codeInfo");

  /* 切换按钮高亮 */
  document.querySelectorAll(".example-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === idx);
  });

  textarea.value = examples[idx].code;
  info.textContent = `示例${idx + 1}：${examples[idx].name}`;
  updateLineNumbers();

  /* 重置分析结果 */
  document.getElementById("analysisResult").innerHTML = "";
  document.getElementById("analysisResult").classList.remove("visible");
  document.getElementById("analysisPlaceholder").style.display = "flex";
  document.getElementById("flowchartBody").classList.remove("visible");
  document.getElementById("flowchartBody").innerHTML = "";
  document.getElementById("analysisStatus").textContent = "等待代码输入...";
}

/* 更新行号 */
function updateLineNumbers() {
  const textarea = document.getElementById("codeInput");
  const lines = textarea.value.split("\n");
  const lineNumsEl = document.getElementById("lineNumbers");
  let html = "";
  for (let i = 1; i <= lines.length; i++) {
    html += `<div class="line-num" data-line="${i}">${i}</div>`;
  }
  lineNumsEl.innerHTML = html;
}

/* 同步滚动 */
function syncScroll() {
  const textarea = document.getElementById("codeInput");
  const lineNumsEl = document.getElementById("lineNumbers");
  lineNumsEl.scrollTop = textarea.scrollTop;
}

/* 开始AI伴读分析 */
function startAnalysis() {
  const textarea = document.getElementById("codeInput");
  const code = textarea.value.trim();

  if (!code) return;

  /* 判断当前是哪个示例 */
  let exampleIdx = -1;
  for (let i = 0; i < examples.length; i++) {
    if (textarea.value === examples[i].code) {
      exampleIdx = i;
      break;
    }
  }

  /* 如果不是预置示例，使用示例1的分析数据（演示用） */
  if (exampleIdx === -1) exampleIdx = 0;
  const example = examples[exampleIdx];

  /* 显示加载 */
  const loadingBar = document.getElementById("loadingBar");
  loadingBar.classList.add("active");
  loadingBar.querySelector(".loading-bar-inner").style.animation = "none";
  loadingBar.querySelector(".loading-bar-inner").offsetHeight; /* 强制回流 */
  loadingBar.querySelector(".loading-bar-inner").style.animation =
    "loadingProgress 2s ease-in-out";

  document.getElementById("analysisPlaceholder").style.display = "none";
  document.getElementById("analysisResult").innerHTML = "";
  document.getElementById("analysisResult").classList.add("visible");
  document.getElementById("flowchartBody").classList.remove("visible");
  document.getElementById("analysisStatus").textContent = "AI正在分析代码...";
  document.getElementById("analyzeBtn").disabled = true;

  /* 逐个显示分析块，模拟AI逐段输出 */
  const resultEl = document.getElementById("analysisResult");
  let delay = 400;

  example.analysis.forEach((block, idx) => {
    setTimeout(() => {
      const blockEl = document.createElement("div");
      blockEl.className = "analysis-block";
      blockEl.dataset.lines = block.lines;
      blockEl.innerHTML = `
        <div class="analysis-block-header">
          <div class="block-icon ${block.type}">${block.type === "info" ? "i" : block.type === "register" ? "R" : block.type === "warn" ? "!" : "✓"}</div>
          <span class="block-tag tag-${block.tag}">${block.tagText}</span>
          <span style="font-weight:600;font-size:0.82rem;">${block.title}</span>
          <span class="block-lines">${block.lines}</span>
        </div>
        <div class="analysis-block-body">${block.body}</div>
      `;

      /* 点击联动高亮 */
      blockEl.addEventListener("click", function () {
        document
          .querySelectorAll(".analysis-block")
          .forEach((b) => b.classList.remove("active-block"));
        this.classList.add("active-block");
        highlightLines(block.lines);
      });

      /* 鼠标进入也联动高亮 */
      blockEl.addEventListener("mouseenter", function () {
        highlightLines(block.lines);
      });

      resultEl.appendChild(blockEl);

      /* 最后一个块加载完毕后显示流程图 */
      if (idx === example.analysis.length - 1) {
        setTimeout(() => {
          loadingBar.classList.remove("active");
          document.getElementById("analysisStatus").textContent =
            `分析完成 · 共${example.analysis.length}个代码段`;
          document.getElementById("analyzeBtn").disabled = false;

          /* 显示流程图 */
          const flowchartBody = document.getElementById("flowchartBody");
          flowchartBody.innerHTML = example.flowchart;
          flowchartBody.classList.add("visible");
        }, 300);
      }
    }, delay);
    delay += 500;
  });
}

/* 高亮代码行号 */
function highlightLines(linesStr) {
  const lineNumEls = document.querySelectorAll(".line-num");

  /* 解析行号 */
  const lines = [];
  const parts = linesStr
    .replace("第", "")
    .replace("行", "")
    .split(/[,\-~]/);
  parts.forEach((p) => {
    const n = parseInt(p.trim());
    if (!isNaN(n)) lines.push(n);
  });

  /* 如果解析不出有效行号，清除高亮 */
  if (lines.length === 0) {
    lineNumEls.forEach((el) => el.classList.remove("highlighted"));
    return;
  }

  lineNumEls.forEach((el) => {
    const lineNum = parseInt(el.dataset.line);
    if (lines.includes(lineNum)) {
      el.classList.add("highlighted");
    } else {
      el.classList.remove("highlighted");
    }
  });
}

/* ==========================
 *  学习路径模块
 * ========================== */

/* 选择卡片 */
function selectCard(card) {
  const group = card.dataset.group;
  const value = card.dataset.value;

  document
    .querySelectorAll(`.select-card[data-group="${group}"]`)
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");

  if (group === "level") selectedLevel = value;
  if (group === "goal") selectedGoal = value;

  /* 两个都选了才启用按钮 */
  document.getElementById("generatePathBtn").disabled = !(
    selectedLevel && selectedGoal
  );
}

/* 生成路线图 */
function generateRoadmap() {
  if (!selectedLevel || !selectedGoal) return;

  const roadmap = document.getElementById("roadmap");
  const timeline = document.getElementById("timeline");
  const titleEl = document.getElementById("roadmapTitle");
  const descEl = document.getElementById("roadmapDesc");

  /* 根据选择匹配路线 */
  let path = null;
  let pathTitle = "";
  let pathDesc = "";

  if (selectedLevel === "zero" && selectedGoal === "stm32") {
    path = roadmapData.zeroToStm32;
    pathTitle = "零基础 → STM32入门 学习路线";
    pathDesc = "从编程基础到独立完成STM32项目，预计总周期16周";
  } else if (selectedLevel === "c-lang" && selectedGoal === "thesis") {
    path = roadmapData.cLangToThesis;
    pathTitle = "会C语言 → 毕业设计 学习路线";
    pathDesc = "从嵌入式入门到完成毕业设计项目，预计总周期14周";
  } else {
    /* 其他组合使用默认路线 */
    path = roadmapData.zeroToStm32;
    pathTitle = "嵌入式学习路线（推荐）";
    pathDesc = "根据你的情况推荐以下学习计划";
  }

  titleEl.textContent = pathTitle;
  descEl.textContent = pathDesc;

  /* 生成时间线节点 */
  timeline.innerHTML = "";
  const progressKey = `roadmap_${selectedLevel}_${selectedGoal}`;
  const savedProgress = loadRoadmapProgress(progressKey);

  path.forEach((node, idx) => {
    const nodeEl = document.createElement("div");
    nodeEl.className = "timeline-node";
    nodeEl.style.animationDelay = `${idx * 0.15}s`;

    /* 恢复已完成状态 */
    if (savedProgress.includes(idx)) {
      nodeEl.classList.add("completed");
    }

    /* 知识点列表 */
    let knowledgeHtml = node.knowledge.map((k) => `<li>${k}</li>`).join("");
    let projectHtml = node.projects.map((p) => `<li>${p}</li>`).join("");
    let timeHtml = `<li>预计耗时：${node.duration}</li>`;

    nodeEl.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <div class="timeline-card-header" onclick="toggleTimelineNode(this.parentElement.parentElement)">
          <div class="timeline-node-title">
            <span class="timeline-node-badge">${node.phase}</span>
            ${node.title}
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <label class="progress-checkbox-wrap" onclick="event.stopPropagation()" title="标记为已完成">
              <input type="checkbox" class="progress-checkbox" ${savedProgress.includes(idx) ? "checked" : ""} onchange="toggleNodeProgress(${idx}, '${progressKey}')">
              <span class="progress-checkmark"></span>
            </label>
            <span class="timeline-time">${node.duration}</span>
            <span class="timeline-expand-icon">&#9660;</span>
          </div>
        </div>
        <div class="timeline-card-body">
          <div class="detail-section">
            <h4>&#128218; 知识点清单</h4>
            <ul class="detail-list">${knowledgeHtml}</ul>
          </div>
          <div class="detail-section">
            <h4>&#127912; 推荐练手项目</h4>
            <ul class="detail-list project-list">${projectHtml}</ul>
          </div>
          <div class="detail-section">
            <h4>&#9201; 学习时间</h4>
            <ul class="detail-list time-list">${timeHtml}</ul>
          </div>
        </div>
      </div>
    `;

    timeline.appendChild(nodeEl);
  });

  /* 更新进度条 */
  updateRoadmapProgress(progressKey, path.length);

  roadmap.classList.add("visible");

  /* 滚动到路线图 */
  setTimeout(() => {
    roadmap.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 200);
}

/**
 * 加载学习路线进度
 * @param {string} key - 存储键名
 * @returns {number[]} 已完成的节点索引数组
 */
function loadRoadmapProgress(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * 切换节点完成状态并保存
 * @param {number} idx - 节点索引
 * @param {string} key - 存储键名
 */
function toggleNodeProgress(idx, key) {
  const progress = loadRoadmapProgress(key);
  const pos = progress.indexOf(idx);

  if (pos === -1) {
    progress.push(idx);
  } else {
    progress.splice(pos, 1);
  }

  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (e) {
    console.warn("无法保存进度:", e);
  }

  /* 更新节点样式 */
  const nodes = document.querySelectorAll(".timeline-node");
  if (nodes[idx]) {
    nodes[idx].classList.toggle("completed", progress.includes(idx));
  }

  /* 更新进度条 */
  const totalNodes = nodes.length;
  updateRoadmapProgress(key, totalNodes);
}

/**
 * 更新进度条显示
 * @param {string} key - 存储键名
 * @param {number} total - 总节点数
 */
function updateRoadmapProgress(key, total) {
  const progress = loadRoadmapProgress(key);
  const percent = total > 0 ? Math.round((progress.length / total) * 100) : 0;

  const bar = document.getElementById("roadmapProgressBar");
  const text = document.getElementById("roadmapProgressText");
  if (bar) bar.style.width = percent + "%";
  if (text) text.textContent = `学习进度：${progress.length}/${total} (${percent}%)`;
}

/* 展开/收起时间线节点 */
function toggleTimelineNode(nodeEl) {
  nodeEl.classList.toggle("expanded");
}

/* 路线数据 */
const roadmapData = {
  /* 路线1：零基础 → STM32入门 */
  zeroToStm32: [
    {
      phase: "第1阶段",
      title: "C语言速成与开发环境搭建",
      duration: "2-3周",
      knowledge: [
        "C语言基本语法：变量、数据类型、运算符",
        "控制结构：if/else、for、while、switch",
        "函数定义与调用、数组与指针基础",
        "结构体与位操作（嵌入式必备）",
        "Keil MDK / STM32CubeIDE 安装与配置",
        "开发板选型与USB串口驱动安装",
      ],
      projects: [
        "在PC上用C写一个学生成绩管理系统",
        "点亮STM32开发板上的第一个LED（复制示例代码）",
        "配置好完整的开发环境并成功编译下载",
      ],
    },
    {
      phase: "第2阶段",
      title: "STM32基础外设：GPIO与时钟系统",
      duration: "3周",
      knowledge: [
        "STM32芯片架构概览：Cortex-M3内核、总线矩阵",
        "时钟树（HSE/HSI/PLL）与RCC时钟配置",
        "GPIO工作模式：输入、输出、复用、模拟",
        "HAL库与寄存器操作的区别与联系",
        "按键输入检测与软件消抖",
        "LED闪烁、蜂鸣器控制",
      ],
      projects: [
        "实现按键控制LED亮灭（含消抖）",
        "做一个流水灯效果（多种模式切换）",
        "用寄存器和HAL库两种方式分别实现GPIO控制",
      ],
    },
    {
      phase: "第3阶段",
      title: "中断系统与定时器",
      duration: "3-4周",
      knowledge: [
        "NVIC中断优先级机制（抢占优先级+响应优先级）",
        "EXTI外部中断配置与回调函数",
        "SysTick系统定时器的原理与应用",
        "通用定时器TIM的PWM输出",
        "输入捕获与输出比较模式",
        "中断服务函数编写注意事项",
      ],
      projects: [
        "用外部中断实现按键唤醒",
        "SysTick精确延时替代软件delay",
        "PWM控制LED呼吸灯亮度",
        "用定时器PWM驱动舵机旋转指定角度",
      ],
    },
    {
      phase: "第4阶段",
      title: "通信协议与传感器应用",
      duration: "3-4周",
      knowledge: [
        "UART串口通信原理与printf重定向",
        "I2C协议时序分析（起始、应答、停止）",
        "SPI协议基础与读写操作",
        "ADC模数转换（单通道/多通道/DMA）",
        "常用传感器模块使用：温湿度(DHT11/SHT30)、光照、加速度",
        "OLED/LCD显示屏驱动",
      ],
      projects: [
        "串口通信上位机：STM32发送数据到PC端",
        "I2C读取SHT30温湿度并在OLED上显示",
        "ADC采集电位器值并串口输出",
        "做一个室内环境监测站（温湿度+光照+显示）",
      ],
    },
    {
      phase: "第5阶段",
      title: "综合项目实战",
      duration: "3-4周",
      knowledge: [
        "模块化代码架构设计",
        "多外设协同工作的时序管理",
        "低功耗模式（Sleep/Stop/Standby）",
        "代码调试技巧（串口打印、断点、逻辑分析仪）",
        "项目工程规范与文档编写",
      ],
      projects: [
        "智能风扇控制系统（温湿度检测+PWM调速+OLED显示）",
        "超声波避障小车（舵机+超声波+电机驱动）",
        "基于STM32的智能门锁原型（ keypad + 舵机 + OLED）",
        "选一个作为最终作品，整理代码和报告",
      ],
    },
  ],

  /* 路线2：会C语言 → 做毕业设计 */
  cLangToThesis: [
    {
      phase: "第1阶段",
      title: "嵌入式开发快速入门",
      duration: "1-2周",
      knowledge: [
        "STM32开发环境搭建（Keil/CubeIDE + 串口工具）",
        "STM32最小系统电路理解（晶振、复位、BOOT）",
        "GPIO输入输出操作（寄存器+HAL库双轨）",
        "代码编译、下载、调试基本流程",
        "常用工具：万用表、逻辑分析仪基础使用",
      ],
      projects: [
        "搭建开发环境并成功下载第一个程序",
        "LED闪烁 + 按键控制（入门验证）",
        "阅读一个完整的小型示例工程",
      ],
    },
    {
      phase: "第2阶段",
      title: "外设驱动开发与调试",
      duration: "2-3周",
      knowledge: [
        "UART串口通信与数据解析协议设计",
        "I2C/SPI传感器驱动编写",
        "ADC数据采集与滤波算法（均值滤波/中值滤波）",
        "定时器中断与PWM输出",
        "OLED/TFT屏幕显示驱动",
        "看门狗与系统可靠性",
      ],
      projects: [
        "写一个I2C温湿度传感器驱动并验证数据准确性",
        "串口通信协议：自定义帧格式收发数据",
        "ADC采集多路传感器数据并滤波处理",
        "做一个传感器数据采集终端（采集+显示+串口上传）",
      ],
    },
    {
      phase: "第3阶段",
      title: "毕设选题与方案设计",
      duration: "2周",
      knowledge: [
        "毕设开题报告撰写要点",
        "系统框图设计与模块划分",
        "硬件选型原则（MCU选型、传感器选型、通信方案）",
        "PCB设计基础（立创EDA/KiCad入门）",
        "BOM清单与预算评估",
        "项目里程碑规划与时间管理",
      ],
      projects: [
        "完成毕设开题报告和技术方案文档",
        "绘制系统框图和模块接口定义",
        "采购元器件并焊接最小系统板（如需自绘PCB）",
        "确定开发板型号并验证核心功能可行性",
      ],
    },
    {
      phase: "第4阶段",
      title: "核心功能开发与联调",
      duration: "4-5周",
      knowledge: [
        "多模块协同开发与接口调试",
        "WiFi/蓝牙模块通信（ESP8266/HC-05/BL602）",
        "RTOS基础（FreeRTOS任务调度、信号量、队列）",
        "OTA远程升级基础",
        "数据存储（Flash/EEPROM/SD卡）",
        "异常处理与容错机制",
      ],
      projects: [
        "完成毕设所有硬件模块的驱动开发",
        "实现核心业务逻辑（主控流程）",
        "通信模块联调（如有无线功能需求）",
        "系统集成测试：所有模块联调跑通",
      ],
    },
    {
      phase: "第5阶段",
      title: "系统优化与毕设答辩准备",
      duration: "2-3周",
      knowledge: [
        "代码优化：减少RAM/Flash占用、提高运行效率",
        "系统稳定性测试与边界条件处理",
        "低功耗设计（休眠策略、外设时钟门控）",
        "毕业论文撰写规范与技巧",
        "答辩PPT制作与演示准备",
        "项目演示视频拍摄",
      ],
      projects: [
        "全功能压力测试与Bug修复",
        "优化系统功耗并测量实际功耗",
        "完成毕业论文初稿",
        "制作答辩PPT并准备现场演示Demo",
        "预答辩演练，准备评委可能的问题",
      ],
    },
  ],
};

/* ==========================
 *  模块3：电路图智析
 * ========================== */

/**
 * 处理电路图图片上传
 * @param {Event} event - 文件上传事件
 */
function handleSchematicUpload(event) {
  /** @type {HTMLInputElement} */
  const input = event.target;
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  if (!file.type.startsWith("image/")) {
    alert("请上传图片文件");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    drawSchematicOnCanvas(e.target.result);
    document.getElementById("analyzeSchematicBtn").style.display =
      "inline-flex";
    document.getElementById("schematicInfo").textContent =
      '图片已上传，点击"AI智能分析"开始检测';
  };
  reader.readAsDataURL(file);
}

/**
 * 在Canvas上绘制电路图
 * @param {string} imgSrc - 图片Base64地址
 */
function drawSchematicOnCanvas(imgSrc) {
  const canvas = document.getElementById("schematicCanvas");
  const ctx = canvas.getContext("2d");
  const uploadZone = document.getElementById("schematicUploadZone");

  const img = new Image();
  img.onload = function () {
    const container = document.getElementById("schematicCanvasContainer");
    const maxWidth = container.clientWidth - 40;
    const maxHeight = 450;

    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = (maxWidth / width) * height;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (maxHeight / height) * width;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    uploadZone.style.display = "none";
    canvas.style.display = "block";
  };
  img.src = imgSrc;
}

/**
 * 加载示例电路图（演示用，生成模拟标注）
 */
function loadDemoSchematic() {
  const canvas = document.getElementById("schematicCanvas");
  const ctx = canvas.getContext("2d");
  const uploadZone = document.getElementById("schematicUploadZone");
  const container = document.getElementById("schematicCanvasContainer");

  const width = Math.min(container.clientWidth - 40, 600);
  const height = 420;
  canvas.width = width;
  canvas.height = height;

  /* 绘制模拟电路图背景 */
  ctx.fillStyle = "#f5f5dc";
  ctx.fillRect(0, 0, width, height);

  /* 绘制简单的STM32最小系统示意 */
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;

  /* 芯片轮廓 */
  ctx.strokeRect(width / 2 - 60, 80, 120, 160);
  ctx.fillStyle = "#333";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText("STM32F103", width / 2, 165);

  /* 引脚 */
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(width / 2 - 60, 100 + i * 28);
    ctx.lineTo(width / 2 - 80, 100 + i * 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width / 2 + 60, 100 + i * 28);
    ctx.lineTo(width / 2 + 80, 100 + i * 28);
    ctx.stroke();
  }

  /* 电源电路 - 电容 */
  ctx.beginPath();
  ctx.moveTo(80, 80);
  ctx.lineTo(80, 130);
  ctx.moveTo(60, 100);
  ctx.lineTo(100, 100);
  ctx.moveTo(65, 115);
  ctx.lineTo(95, 115);
  ctx.stroke();
  ctx.fillStyle = "#666";
  ctx.font = "10px Arial";
  ctx.fillText("10uF", 80, 145);

  /* LED + 电阻 */
  ctx.beginPath();
  ctx.moveTo(width / 2 + 80, 128);
  ctx.lineTo(width / 2 + 120, 128);
  ctx.lineTo(width / 2 + 120, 180);
  ctx.stroke();

  /* 电阻符号 */
  ctx.beginPath();
  ctx.moveTo(width / 2 + 120, 145);
  for (let i = 0; i < 4; i++) {
    ctx.lineTo(width / 2 + 128, 150 + i * 8);
    ctx.lineTo(width / 2 + 112, 154 + i * 8);
  }
  ctx.lineTo(width / 2 + 120, 180);
  ctx.stroke();

  /* LED符号 */
  ctx.beginPath();
  ctx.moveTo(width / 2 + 120, 200);
  ctx.lineTo(width / 2 + 120, 220);
  ctx.moveTo(width / 2 + 110, 200);
  ctx.lineTo(width / 2 + 130, 200);
  ctx.lineTo(width / 2 + 120, 215);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#666";
  ctx.fillText("LED", width / 2 + 145, 210);

  uploadZone.style.display = "none";
  canvas.style.display = "block";

  document.getElementById("analyzeSchematicBtn").style.display = "inline-flex";
  document.getElementById("schematicInfo").textContent =
    '示例电路图已加载，点击"AI智能分析"开始检测';
}

/** 元器件识别结果数据（模拟AI识别）
 *  坐标为相对Canvas的比例值 (0~1)
 */
const schematicComponents = [
  {
    type: "ic",
    name: "U1",
    fullName: "STM32F103C8T6",
    desc: "32位ARM Cortex-M3主控芯片，72MHz主频，64KB Flash",
    x: 0.4,
    y: 0.2,
    w: 0.2,
    h: 0.38,
    color: "#b388ff",
  },
  {
    type: "cap",
    name: "C1",
    fullName: "10uF 电解电容",
    desc: "电源输入滤波电容，平滑电源电压，滤除低频纹波",
    x: 0.07,
    y: 0.18,
    w: 0.09,
    h: 0.28,
    color: "#64b5f6",
  },
  {
    type: "resistor",
    name: "R1",
    fullName: "330Ω 限流电阻",
    desc: "LED限流电阻，限制流过LED的电流，防止烧毁",
    x: 0.69,
    y: 0.34,
    w: 0.06,
    h: 0.12,
    color: "#ffab40",
  },
  {
    type: "led",
    name: "D1",
    fullName: "红色LED指示灯",
    desc: "电源/状态指示灯，通过GPIO输出高低电平控制亮灭",
    x: 0.69,
    y: 0.49,
    w: 0.08,
    h: 0.1,
    color: "#ff5252",
  },
  {
    type: "cap",
    name: "C2",
    fullName: "0.1uF 去耦电容 (缺失)",
    desc: "芯片VDD去耦电容，应放置在电源引脚旁，滤除高频噪声",
    x: 0.25,
    y: 0.12,
    w: 0.07,
    h: 0.1,
    color: "#ff5252",
    missing: true,
  },
  {
    type: "resistor",
    name: "R2",
    fullName: "10KΩ NRST上拉 (缺失)",
    desc: "复位引脚外部上拉电阻，提高复位电路抗干扰能力",
    x: 0.62,
    y: 0.1,
    w: 0.06,
    h: 0.1,
    color: "#ff5252",
    missing: true,
  },
];

/** 信号流向数据（模拟AI分析）
 *  from/to 为相对坐标 (0~1)，color 为信号颜色
 */
const schematicSignals = [
  {
    name: "VCC 电源",
    from: { x: 0.12, y: 0.08 },
    to: { x: 0.4, y: 0.2 },
    color: "#00ff88",
    desc: "电源输入 → C1滤波 → 芯片VDD引脚",
  },
  {
    name: "GPIO输出",
    from: { x: 0.6, y: 0.31 },
    to: { x: 0.69, y: 0.34 },
    color: "#4dd0e1",
    desc: "PA0引脚输出 → R1限流电阻",
  },
  {
    name: "LED电流",
    from: { x: 0.72, y: 0.46 },
    to: { x: 0.72, y: 0.59 },
    color: "#ffab40",
    desc: "LED → GND 地回路",
  },
  {
    name: "GND 地",
    from: { x: 0.2, y: 0.55 },
    to: { x: 0.72, y: 0.59 },
    color: "#90a4ae",
    desc: "公共地网络，所有电路参考点",
  },
];

/**
 * 执行AI电路图分析（模拟）
 */
function analyzeSchematic() {
  const loadingBar = document.getElementById("schematicLoadingBar");
  const issueList = document.getElementById("schematicIssueList");
  const statusEl = document.getElementById("schematicStatus");

  /* 显示加载 */
  loadingBar.classList.add("active");
  loadingBar.querySelector(".loading-bar-inner").style.animation = "none";
  loadingBar.querySelector(".loading-bar-inner").offsetHeight;
  loadingBar.querySelector(".loading-bar-inner").style.animation =
    "loadingProgress 2.5s ease-in-out";

  statusEl.textContent = "AI正在分析...";

  /* 模拟AI分析延迟 */
  setTimeout(() => {
    loadingBar.classList.remove("active");
    const compCount = schematicComponents.length;
    const issueCount = 4;
    statusEl.textContent = `分析完成 · 识别${compCount}个元件 · 发现${issueCount}个问题`;

    /* 元件统计 */
    const statsHtml = `
      <div class="component-stats">
        <div class="stat-item">
          <div class="stat-num">1</div>
          <div class="stat-label">芯片/IC</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">2</div>
          <div class="stat-label">电阻</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">2</div>
          <div class="stat-label">电容</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">1</div>
          <div class="stat-label">LED</div>
        </div>
      </div>
    `;

    /* 问题列表 */
    const issues = [
      {
        severity: "high",
        title: "缺少电源去耦电容 C2",
        desc: "STM32芯片VDD引脚附近未放置0.1uF去耦电容，可能导致电源噪声干扰芯片正常工作。建议在每个电源引脚旁放置0.1uF陶瓷电容，尽量靠近引脚。",
        component: "C2",
      },
      {
        severity: "high",
        title: "复位电路不完善 R2",
        desc: "NRST引脚缺少外部上拉电阻和复位按键，仅靠内部上拉可能不够可靠。建议增加10K上拉电阻和100nF滤波电容，提升系统抗干扰能力。",
        component: "R2",
      },
      {
        severity: "medium",
        title: "LED限流电阻阻值偏小",
        desc: "R1阻值约100Ω偏小，若GPIO输出3.3V、LED压降2V，电流约13mA，虽在允许范围内但余量不大。建议使用220Ω~1KΩ以保护LED和GPIO引脚。",
        component: "R1",
      },
      {
        severity: "low",
        title: "BOOT引脚未连接",
        desc: "BOOT0和BOOT1引脚悬空，虽然内部有下拉，但建议明确接地以确保从Flash启动的可靠性，避免干扰导致误进入启动模式。",
        component: "U1",
      },
    ];

    let issuesHtml = "";
    issues.forEach((issue, idx) => {
      issuesHtml += `
        <div class="issue-item severity-${issue.severity}" style="animation: fadeSlideIn 0.3s ease ${idx * 0.1}s both;">
          <div class="issue-header">
            <span class="issue-badge ${issue.severity}">${issue.severity === "high" ? "严重" : issue.severity === "medium" ? "中等" : "提示"}</span>
            <span class="issue-title">${issue.title}</span>
          </div>
          <div class="issue-desc">${issue.desc}</div>
        </div>
      `;
    });

    issueList.innerHTML = statsHtml + issuesHtml;

    /* 在Canvas上绘制完整标注 */
    drawSchematicAnnotations();
  }, 2500);
}

/**
 * 在电路图Canvas上绘制完整的AI标注
 * 包括：元器件标注框 + 名称标签 + 信号流向箭头
 */
function drawSchematicAnnotations() {
  const canvas = document.getElementById("schematicCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  /* 清除原有标注（先重绘原图） */
  /* 注意：如果是上传的图片，需要重新绘制；示例图是直接画在canvas上的，
     这里我们在已有的基础上叠加标注 */

  ctx.font = "11px 'Microsoft YaHei', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  /* 1. 绘制信号流向箭头（在元件标注下方） */
  schematicSignals.forEach((sig) => {
    const x1 = sig.from.x * W;
    const y1 = sig.from.y * H;
    const x2 = sig.to.x * W;
    const y2 = sig.to.y * H;

    /* 虚线信号路径 */
    ctx.strokeStyle = sig.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    /* 箭头 */
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 8;
    ctx.fillStyle = sig.color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle - Math.PI / 6),
      y2 - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle + Math.PI / 6),
      y2 - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    /* 信号名称标签 */
    const labelW = ctx.measureText(sig.name).width + 12;
    const labelH = 18;
    const lx = (x1 + x2) / 2 - labelW / 2;
    const ly = (y1 + y2) / 2 - labelH / 2;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(lx, ly, labelW, labelH);
    ctx.fillStyle = sig.color;
    ctx.fillText(sig.name, lx + 6, ly + 3);
  });

  /* 2. 绘制元器件标注框 + 名称标签 */
  schematicComponents.forEach((comp) => {
    const x = comp.x * W;
    const y = comp.y * H;
    const w = comp.w * W;
    const h = comp.h * H;

    /* 半透明填充 */
    ctx.fillStyle = comp.color + "22";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

    /* 虚线边框 */
    ctx.strokeStyle = comp.color;
    ctx.lineWidth = comp.missing ? 2.5 : 2;
    ctx.setLineDash(comp.missing ? [5, 4] : [3, 2]);
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.setLineDash([]);

    /* 元件名称标签（左上角） */
    const labelText = comp.name;
    const labelW = ctx.measureText(labelText).width + 10;
    const labelH = 18;
    ctx.fillStyle = comp.color;
    ctx.fillRect(x - 2, y - labelH - 2, labelW, labelH);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px Arial";
    ctx.fillText(labelText, x + 3, y - labelH + 2);
    ctx.font = "11px 'Microsoft YaHei', Arial, sans-serif";

    /* 缺失元件标记 */
    if (comp.missing) {
      const warnText = "⚠ 缺失";
      const warnW = ctx.measureText(warnText).width + 8;
      ctx.fillStyle = "rgba(255,82,82,0.9)";
      ctx.fillRect(x + w - warnW + 4, y - labelH - 2, warnW, labelH);
      ctx.fillStyle = "#fff";
      ctx.fillText(warnText, x + w - warnW + 8, y - labelH + 2);
    }

    /* 元件全称和说明（鼠标悬停提示 - 用小标签表示） */
    const descText = comp.fullName;
    const descW = ctx.measureText(descText).width + 8;
    const descH = 16;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 2, y + h + 4, descW, descH);
    ctx.fillStyle = comp.color;
    ctx.font = "10px 'Microsoft YaHei', Arial";
    ctx.fillText(descText, x + 2, y + h + 6);
    ctx.font = "11px 'Microsoft YaHei', Arial, sans-serif";
  });

  /* 3. 绘制图例 */
  const legendX = 8;
  const legendY = H - 60;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(legendX, legendY, 180, 52);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px 'Microsoft YaHei', Arial";
  ctx.fillText("信号流向图例:", legendX + 8, legendY + 6);
  ctx.font = "10px 'Microsoft YaHei', Arial";

  const legendItems = [
    { color: "#00ff88", label: "电源信号" },
    { color: "#4dd0e1", label: "控制信号" },
    { color: "#90a4ae", label: "地回路" },
  ];
  legendItems.forEach((item, i) => {
    const ly = legendY + 22 + i * 10;
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legendX + 8, ly + 5);
    ctx.lineTo(legendX + 28, ly + 5);
    ctx.stroke();
    ctx.setLineDash([]);

    /* 小箭头 */
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.moveTo(legendX + 28, ly + 5);
    ctx.lineTo(legendX + 22, ly + 2);
    ctx.lineTo(legendX + 22, ly + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ccc";
    ctx.fillText(item.label, legendX + 34, ly);
  });
}

/* ==========================
 *  模块4：焊点质量检测
 * ========================== */

/**
 * 处理焊点照片上传
 * @param {Event} event - 文件上传事件
 */
function handleSolderUpload(event) {
  /** @type {HTMLInputElement} */
  const input = event.target;
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  if (!file.type.startsWith("image/")) {
    alert("请上传图片文件");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    drawSolderOnCanvas(e.target.result);
    document.getElementById("analyzeSolderBtn").style.display = "inline-flex";
    document.getElementById("solderInfo").textContent =
      '照片已上传，点击"开始检测"分析焊点质量';
  };
  reader.readAsDataURL(file);
}

/**
 * 在Canvas上绘制焊点图片
 * @param {string} imgSrc - 图片Base64地址
 */
function drawSolderOnCanvas(imgSrc) {
  const canvas = document.getElementById("solderCanvas");
  const ctx = canvas.getContext("2d");
  const uploadZone = document.getElementById("solderUploadZone");

  const img = new Image();
  img.onload = function () {
    const container = document.getElementById("solderCanvasContainer");
    const maxWidth = container.clientWidth - 40;
    const maxHeight = 450;

    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = (maxWidth / width) * height;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (maxHeight / height) * width;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    uploadZone.style.display = "none";
    canvas.style.display = "block";
  };
  img.src = imgSrc;
}

/**
 * 加载示例焊点图片（模拟）
 */
function loadDemoSolder() {
  const canvas = document.getElementById("solderCanvas");
  const ctx = canvas.getContext("2d");
  const uploadZone = document.getElementById("solderUploadZone");

  const width = 500;
  const height = 400;
  canvas.width = width;
  canvas.height = height;

  /* 绘制PCB背景 */
  ctx.fillStyle = "#0a5c36";
  ctx.fillRect(0, 0, width, height);

  /* 绘制铜箔走线 */
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 200);
  ctx.lineTo(180, 200);
  ctx.moveTo(320, 200);
  ctx.lineTo(400, 200);
  ctx.stroke();

  /* 绘制焊盘 */
  function drawPad(x, y, quality) {
    /* 焊盘铜环 */
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#c9a227";
    ctx.fill();

    /* 焊锡 */
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);

    if (quality === "good") {
      /* 良好焊点 - 圆润有光泽 */
      const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 18);
      grad.addColorStop(0, "#f0f0f0");
      grad.addColorStop(0.5, "#c0c0c0");
      grad.addColorStop(1, "#808080");
      ctx.fillStyle = grad;
    } else if (quality === "cold") {
      /* 冷焊 - 灰暗、不规则 */
      ctx.fillStyle = "#6a6a6a";
    } else if (quality === "little") {
      /* 锡量不足 - 小 */
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#909090";
    } else {
      ctx.fillStyle = "#a0a0a0";
    }
    ctx.fill();

    /* 元件引脚 */
    ctx.fillStyle = "#555";
    ctx.fillRect(x - 4, y - 25, 8, 14);
  }

  /* 绘制5个不同质量的焊点：良好/冷焊/锡量不足/桥连/虚焊 */
  drawPad(120, 200, "good");
  drawPad(220, 200, "cold");
  drawPad(320, 200, "little");
  drawPad(170, 300, "good");
  drawPad(270, 300, "bridge");

  /* 桥连焊点 - 两个焊点之间有多余焊锡连接 */
  ctx.fillStyle = "#c0c0c0";
  ctx.beginPath();
  ctx.ellipse(275, 298, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  /* 丝印 */
  ctx.fillStyle = "#ffffff";
  ctx.font = "11px Arial";
  ctx.fillText("R1", 110, 160);
  ctx.fillText("R2", 210, 160);
  ctx.fillText("C1", 310, 160);
  ctx.fillText("R3", 160, 260);
  ctx.fillText("C2", 260, 260);

  uploadZone.style.display = "none";
  canvas.style.display = "block";

  document.getElementById("analyzeSolderBtn").style.display = "inline-flex";
  document.getElementById("solderInfo").textContent =
    '示例焊点图已加载，点击"开始检测"分析质量';
}

/**
 * 执行焊点质量检测（模拟）
 */
function analyzeSolder() {
  const scoreCard = document.getElementById("solderScoreCard");
  const issuesEl = document.getElementById("solderIssues");
  const tipsEl = document.getElementById("solderTips");
  const scoreCircle = document.getElementById("scoreCircle");
  const scoreNum = document.getElementById("scoreNum");
  const scoreLabel = document.getElementById("scoreLabel");
  const scoreDesc = document.getElementById("scoreDesc");

  /* 模拟检测过程 */
  document.getElementById("solderInfo").textContent = "AI正在检测焊点质量...";
  document.getElementById("analyzeSolderBtn").disabled = true;

  setTimeout(() => {
    document.getElementById("solderInfo").textContent =
      "检测完成 · 共检测5个焊点";
    document.getElementById("analyzeSolderBtn").disabled = false;

    /* 评分 */
    const score = 68;
    scoreNum.textContent = score;

    if (score >= 80) {
      scoreCircle.className = "score-circle score-good";
      scoreLabel.textContent = "质量良好";
      scoreDesc.textContent = "整体焊接质量优秀，继续保持！";
    } else if (score >= 60) {
      scoreCircle.className = "score-circle score-fair";
      scoreLabel.textContent = "质量一般";
      scoreDesc.textContent = "存在部分问题，建议针对性改进";
    } else {
      scoreCircle.className = "score-circle score-poor";
      scoreLabel.textContent = "质量较差";
      scoreDesc.textContent = "多处问题需要修复，请参考改进建议";
    }

    scoreCard.style.display = "block";

    /* 检测详情列表 - 包含5种焊点质量类型 */
    const issues = [
      {
        type: "good",
        icon: "✓",
        title: "焊点1 (R1) - 良好",
        desc: "焊锡量适中，润湿良好，形成理想的弯月面，表面光亮有光泽",
      },
      {
        type: "warn",
        icon: "!",
        title: "焊点2 (R2) - 冷焊",
        desc: "焊点表面灰暗无光泽，呈颗粒状。可能是烙铁温度不足或加热时间不够，焊锡未充分熔化形成合金层",
      },
      {
        type: "bad",
        icon: "✕",
        title: "焊点3 (C1) - 锡量不足",
        desc: "焊锡量太少，未完全覆盖焊盘，引脚裸露。容易造成虚焊或接触不良，需补锡重焊",
      },
      {
        type: "good",
        icon: "✓",
        title: "焊点4 (R3) - 良好",
        desc: "焊点圆润有光泽，引脚润湿良好，弯月面完美",
      },
      {
        type: "bad",
        icon: "✕",
        title: "焊点5 (C2) - 桥连",
        desc: "两个相邻焊点之间有多余焊锡连接，形成短路。可能导致元器件损坏或电路功能异常，必须用吸锡带清除",
      },
    ];

    let issuesHtml = "";
    issues.forEach((issue, idx) => {
      issuesHtml += `
        <div class="solder-issue-item" style="animation: fadeSlideIn 0.3s ease ${idx * 0.1}s both;">
          <div class="solder-issue-icon ${issue.type}">${issue.icon}</div>
          <div class="solder-issue-content">
            <div class="solder-issue-title">${issue.title}</div>
            <div class="solder-issue-desc">${issue.desc}</div>
          </div>
        </div>
      `;
    });
    issuesEl.innerHTML = issuesHtml;

    /* 改进建议 */
    const tips = [
      "适当提高烙铁温度（建议320-360℃），确保焊锡充分熔化",
      "增加焊接停留时间1-2秒，让热量充分传递到焊盘",
      "对于锡量不足的焊点，补充适量焊锡并重新加热",
      "桥连焊点：使用吸锡带或吸锡器清除多余焊锡，调整焊锡量后重新焊接",
      "检查烙铁头是否氧化，及时清洁或更换烙铁头",
      "保持焊接角度约45度，确保焊锡顺利流动，避免相邻焊点上锡过多",
    ];

    let tipsHtml = "";
    tips.forEach((tip) => {
      tipsHtml += `
        <div class="tip-item">
          <span class="tip-icon">💡</span>
          <span>${tip}</span>
        </div>
      `;
    });
    document.getElementById("solderTipsList").innerHTML = tipsHtml;
    tipsEl.style.display = "block";

    /* 在Canvas上标注问题焊点 */
    drawSolderAnnotations();
  }, 2000);
}

/**
 * 在焊点Canvas上绘制标注
 */
function drawSolderAnnotations() {
  const canvas = document.getElementById("solderCanvas");
  const ctx = canvas.getContext("2d");

  ctx.lineWidth = 2;
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";

  /* 焊点1 (R1) - 绿色标注 - 良好 */
  ctx.strokeStyle = "#00ff88";
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.arc(120, 200, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#00ff88";
  ctx.fillRect(95, 168, 50, 16);
  ctx.fillStyle = "#fff";
  ctx.fillText("良好", 120, 172);

  /* 焊点2 (R2) - 橙色标注 - 冷焊 */
  ctx.strokeStyle = "#ffab40";
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.arc(220, 200, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffab40";
  ctx.fillRect(193, 168, 54, 16);
  ctx.fillStyle = "#fff";
  ctx.fillText("冷焊", 220, 172);

  /* 焊点3 (C1) - 红色标注 - 锡量不足 */
  ctx.strokeStyle = "#ff5252";
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.arc(320, 200, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ff5252";
  ctx.fillRect(283, 168, 74, 16);
  ctx.fillStyle = "#fff";
  ctx.fillText("锡量不足", 320, 172);

  /* 焊点4 (R3) - 绿色标注 - 良好 */
  ctx.strokeStyle = "#00ff88";
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.arc(170, 300, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#00ff88";
  ctx.fillRect(145, 268, 50, 16);
  ctx.fillStyle = "#fff";
  ctx.fillText("良好", 170, 272);

  /* 焊点5 (C2) - 红色标注 - 桥连 */
  ctx.strokeStyle = "#ff5252";
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.arc(270, 300, 32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ff5252";
  ctx.fillRect(247, 268, 46, 16);
  ctx.fillStyle = "#fff";
  ctx.fillText("桥连", 270, 272);
}

/* ==========================
 *  模块5：故障排查助手
 * ========================== */

let currentDebugPath = null;
let debugStepIndex = 0;

/** 故障排查决策树数据 */
const debugTrees = {
  no_power: {
    title: "板子完全不工作",
    steps: [
      {
        question: "电源指示灯是否亮起？",
        detail:
          "观察开发板上的电源指示灯（通常是红色或绿色LED），上电后是否常亮。",
        yes: "step1_yes",
        no: "check_power",
      },
      {
        id: "check_power",
        question: "供电电压是否正常？",
        detail:
          "使用万用表测量电源输入端电压：USB供电应约5V，外部电源应匹配标称电压。",
        yes: "check_boot",
        no: "result_power_supply",
      },
      {
        id: "step1_yes",
        question: "是否能正常下载程序？",
        detail:
          "尝试用ST-Link或串口下载一个简单的LED闪烁程序，看是否下载成功。",
        yes: "check_program",
        no: "check_debug_if",
      },
      {
        id: "check_boot",
        question: "BOOT引脚配置是否正确？",
        detail: "检查BOOT0和BOOT1引脚电平：都接低电平（GND）才是从Flash启动。",
        yes: "check_reset",
        no: "result_boot_pin",
      },
      {
        id: "check_reset",
        question: "复位电路是否正常？",
        detail: "测量NRST引脚电压，正常应为高电平。按下复位键时应能拉低。",
        yes: "check_clock",
        no: "result_reset_circuit",
      },
      {
        id: "check_clock",
        question: "外部晶振是否起振？",
        detail: "用示波器测量晶振引脚是否有波形。也可以尝试改用内部HSI时钟。",
        yes: "check_mcu",
        no: "result_hse",
      },
      {
        id: "result_power_supply",
        result: true,
        title: "供电问题",
        icon: "🔌",
        desc: "电源输入电压不正常，导致板子无法工作。",
        solutions: [
          "检查USB线是否完好，更换一条USB线试试",
          "如果使用外部电源，确认电源输出电压和极性正确",
          "检查电源插座是否有虚焊或接触不良",
          "检查板上电源芯片（如AMS1117）输出是否正常",
        ],
      },
      {
        id: "result_boot_pin",
        result: true,
        title: "BOOT引脚配置错误",
        icon: "🔧",
        desc: "BOOT引脚电平配置不正确，导致芯片没有从正确的位置启动。",
        solutions: [
          "将BOOT0和BOOT1都接GND（低电平），从Flash启动",
          "如果有BOOT跳帽，确认跳帽插在正确位置",
          "检查BOOT引脚是否有虚焊或短路",
        ],
      },
      {
        id: "result_reset_circuit",
        result: true,
        title: "复位电路故障",
        icon: "🔄",
        desc: "复位电路异常导致芯片持续处于复位状态。",
        solutions: [
          "检查NRST引脚上拉电阻是否焊接正确",
          "检查复位按键是否卡住或短路",
          "测量NRST引脚电压，正常应约等于VDD",
          "检查复位电路中的电容是否短路",
        ],
      },
      {
        id: "result_hse",
        result: true,
        title: "外部晶振不起振",
        icon: "💎",
        desc: "外部高速晶振（HSE）未起振，导致系统时钟无法正常运行。",
        solutions: [
          "检查晶振是否焊接正确，引脚有无虚焊",
          "检查晶振两端的负载电容是否匹配（通常20-22pF）",
          "先用内部HSI时钟验证芯片是否正常工作",
          "更换晶振试试，可能是晶振损坏",
        ],
      },
      {
        id: "check_debug_if",
        question: "调试器（ST-Link）是否被识别？",
        detail: "在电脑设备管理器中查看ST-Link是否正常显示，驱动是否安装正确。",
        yes: "check_target",
        no: "result_stlink_driver",
      },
      {
        id: "check_target",
        question: "是否能检测到目标芯片？",
        detail: "在Keil或STM32CubeProgrammer中查看是否能连接到目标MCU。",
        yes: "check_program",
        no: "result_swd_connection",
      },
      {
        id: "check_program",
        question: "程序编译是否有错误？",
        detail: "检查编译输出是否有Error，确保程序正确生成了.hex或.bin文件。",
        yes: "check_code",
        no: "result_compile_error",
      },
      {
        id: "check_code",
        question: "程序中是否正确配置了时钟和外设？",
        detail:
          "检查main函数中是否调用了时钟初始化函数，以及相关外设是否正确使能。",
        yes: "check_mcu",
        no: "result_code_config",
      },
      {
        id: "result_stlink_driver",
        result: true,
        title: "ST-Link驱动问题",
        icon: "💻",
        desc: "电脑无法识别ST-Link调试器，通常是驱动问题。",
        solutions: [
          "安装最新的ST-Link驱动程序",
          "更换USB口，尽量使用主板后置USB口",
          "检查USB线是否支持数据传输（有些只能充电）",
          "在设备管理器中卸载设备后重新扫描",
        ],
      },
      {
        id: "result_swd_connection",
        result: true,
        title: "SWD连接失败",
        icon: "🔗",
        desc: "调试器无法通过SWD接口连接到目标芯片。",
        solutions: [
          "检查SWDIO和SWCLK接线是否正确",
          "确认目标板已上电",
          "检查复位电路，尝试连接时按住复位键",
          "降低调试器的通信速率试试",
          "检查芯片是否被读保护了",
        ],
      },
      {
        id: "result_compile_error",
        result: true,
        title: "编译错误",
        icon: "📝",
        desc: "程序编译失败，没有正确生成可执行文件。",
        solutions: [
          "查看编译错误信息，逐行修复",
          "确认头文件路径配置正确",
          "检查是否缺少源文件或库文件",
          "确保芯片型号选择正确",
        ],
      },
      {
        id: "result_code_config",
        result: true,
        title: "代码配置问题",
        icon: "⚙️",
        desc: "程序中时钟或外设配置有误，导致系统无法正常运行。",
        solutions: [
          "检查SystemInit()和时钟配置是否正确",
          "确认所有用到的外设时钟都已使能（RCC寄存器）",
          "用一个最简单的LED闪烁程序验证基本功能",
          "检查中断向量表是否正确配置",
        ],
      },
      {
        id: "check_mcu",
        question: "芯片是否有发烫或异味？",
        detail: "用手触摸芯片表面，温度是否异常高？有没有烧焦的味道？",
        yes: "result_mcu_damaged",
        no: "result_unknown",
      },
      {
        id: "result_mcu_damaged",
        result: true,
        title: "芯片可能已损坏",
        icon: "💥",
        desc: "芯片异常发烫，很可能已经因为过压/反接等原因损坏了。",
        solutions: [
          "立即断电，避免进一步损坏",
          "检查电源是否有过压或反接情况",
          "更换一颗同型号的MCU芯片试试",
          "检查板上是否有短路的地方",
        ],
      },
      {
        id: "result_unknown",
        result: true,
        title: "暂无法定位",
        icon: "🤔",
        desc: "根据当前信息暂无法确定具体原因，建议尝试更多排查步骤。",
        solutions: [
          "用万用表测量各电源引脚电压是否正常",
          "检查所有芯片引脚是否有虚焊或短路",
          "换一片新的最小系统板交叉验证",
          "到技术论坛发帖求助，附上详细现象描述",
        ],
      },
    ],
  },
  led_no_blink: {
    title: "LED不亮/不闪烁",
    steps: [
      {
        question: "板子其他功能正常吗？",
        detail: "比如串口输出、按键响应等其他功能是否正常工作。",
        yes: "check_led_hw",
        no: "no_power",
      },
      {
        id: "check_led_hw",
        question: "LED硬件连接是否正确？",
        detail:
          "检查LED正负极、串联电阻是否焊接正确。可以用万用表二极管档测LED是否能点亮。",
        yes: "check_led_gpio",
        no: "result_led_hw",
      },
      {
        id: "check_led_gpio",
        question: "GPIO时钟是否使能？",
        detail:
          "检查代码中是否使能了对应GPIO端口的时钟（如RCC_APB2Periph_GPIOA）。",
        yes: "check_gpio_mode",
        no: "result_rcc_enable",
      },
      {
        id: "check_gpio_mode",
        question: "GPIO模式配置是否正确？",
        detail:
          "确认LED对应的GPIO引脚是否配置为推挽输出模式（GPIO_Mode_Out_PP）。",
        yes: "check_led_logic",
        no: "result_gpio_mode",
      },
      {
        id: "check_led_logic",
        question: "LED点亮的电平逻辑是否正确？",
        detail:
          "确认LED是高电平点亮还是低电平点亮。检查原理图中LED阳极接VCC还是接GPIO。",
        yes: "check_delay",
        no: "result_led_logic",
      },
      {
        id: "check_delay",
        question: "延时函数是否正常工作？",
        detail:
          "如果延时不准确，LED可能闪得太快或太慢。可以用示波器或逻辑分析仪测量GPIO波形。",
        yes: "result_unknown_led",
        no: "result_delay",
      },
      {
        id: "result_led_hw",
        result: true,
        title: "LED硬件问题",
        icon: "💡",
        desc: "LED或其串联电阻的硬件连接有问题。",
        solutions: [
          "检查LED正负极是否焊反（长脚是正极）",
          "用万用表二极管档直接测LED，看是否能微亮",
          "检查串联电阻阻值是否合适（通常220Ω-1KΩ）",
          "检查LED和电阻是否有虚焊、假焊",
        ],
      },
      {
        id: "result_rcc_enable",
        result: true,
        title: "GPIO时钟未使能",
        icon: "⏰",
        desc: "代码中没有使能对应GPIO端口的外设时钟，导致GPIO寄存器写入无效。",
        solutions: [
          "在GPIO初始化前添加时钟使能代码",
          "STM32F1: RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOx, ENABLE)",
          "确认是APB1还是APB2上的外设",
          "检查时钟使能函数调用是否在初始化之前",
        ],
      },
      {
        id: "result_gpio_mode",
        result: true,
        title: "GPIO模式配置错误",
        icon: "🔧",
        desc: "GPIO引脚没有正确配置为输出模式。",
        solutions: [
          "将GPIO配置为推挽输出模式（GPIO_Mode_Out_PP）",
          "确认GPIO_InitTypeDef结构体配置正确",
          "检查引脚号（Pin）是否正确",
          "如果是开漏输出，需要外接上拉电阻才能输出高电平",
        ],
      },
      {
        id: "result_led_logic",
        result: true,
        title: "LED电平逻辑搞反",
        icon: "🔄",
        desc: "代码中控制LED的电平与实际电路设计相反。",
        solutions: [
          "查看原理图：LED阳极接GPIO则高电平点亮，接GND则低电平点亮",
          "将GPIO输出电平取反试试",
          "用万用表测量GPIO引脚输出电平是否符合预期",
        ],
      },
      {
        id: "result_delay",
        result: true,
        title: "延时函数问题",
        icon: "⏱️",
        desc: "软件延时不准确，可能导致LED闪烁太快肉眼看不出，或太慢误以为不亮。",
        solutions: [
          "用示波器或逻辑分析仪测量GPIO波形",
          "如果使用SysTick延时，确认时钟配置正确",
          "软件delay要注意编译器优化等级的影响",
          "可以用LED常亮的程序先验证硬件是否正常",
        ],
      },
      {
        id: "result_unknown_led",
        result: true,
        title: "暂无法定位",
        icon: "🤔",
        desc: "建议使用示波器或逻辑分析仪进一步观察GPIO波形。",
        solutions: [
          "用示波器测量GPIO引脚输出波形",
          "在Debug模式下单步运行，观察寄存器值",
          "写一个最简单的LED翻转程序，排除其他代码干扰",
          "检查是否有中断在频繁修改GPIO状态",
        ],
      },
    ],
  },
  uart_no_output: {
    title: "串口无输出",
    steps: [
      {
        question: "LED闪烁等简单功能正常吗？",
        detail: "先确认芯片基本运行正常，排除系统级问题。",
        yes: "check_uart_hw",
        no: "no_power",
      },
      {
        id: "check_uart_hw",
        question: "USB转串口模块是否正常？",
        detail: "检查设备管理器中是否有COM端口，驱动是否正常。",
        yes: "check_uart_wiring",
        no: "result_usb_serial",
      },
      {
        id: "check_uart_wiring",
        question: "串口接线是否正确？",
        detail: "确认TX接RX、RX接TX，GND共地。接反了肯定收不到数据。",
        yes: "check_uart_clock",
        no: "result_uart_wiring",
      },
      {
        id: "check_uart_clock",
        question: "UART时钟是否使能？",
        detail:
          "检查代码中是否使能了USART的外设时钟（如RCC_APB2Periph_USART1）。",
        yes: "check_uart_gpio",
        no: "result_rcc_enable",
      },
      {
        id: "check_uart_gpio",
        question: "UART的GPIO是否正确配置？",
        detail:
          "TX引脚应配置为复用推挽输出，RX引脚应配置为浮空输入或上拉输入。",
        yes: "check_baudrate",
        no: "result_uart_gpio",
      },
      {
        id: "check_baudrate",
        question: "波特率等参数是否一致？",
        detail:
          "确认串口助手上的波特率、数据位、停止位、校验位与代码中配置一致。",
        yes: "check_uart_enable",
        no: "result_baudrate",
      },
      {
        id: "check_uart_enable",
        question: "UART外设是否使能？",
        detail: "检查是否调用了USART_Cmd()来使能UART外设。",
        yes: "check_send_code",
        no: "result_uart_enable",
      },
      {
        id: "check_send_code",
        question: "发送函数是否正确调用？",
        detail:
          "检查是否调用了USART_SendData()，并等待发送完成标志（TC或TXE）。",
        yes: "result_unknown_uart",
        no: "result_send_code",
      },
      {
        id: "result_usb_serial",
        result: true,
        title: "USB转串口模块问题",
        icon: "🔌",
        desc: "电脑无法识别USB转串口模块。",
        solutions: [
          "安装对应芯片的驱动（CH340/CP2102/PL2303等）",
          "更换USB线或USB口试试",
          "在设备管理器中查看是否有黄色感叹号设备",
          "换一个USB转串口模块交叉验证",
        ],
      },
      {
        id: "result_uart_wiring",
        result: true,
        title: "串口接线错误",
        icon: "🔗",
        desc: "串口线接反或接触不良。",
        solutions: [
          "TX接RX、RX接TX，一定是交叉连接",
          "GND必须共地，这是通信的基础",
          "检查杜邦线是否完好，换一根试试",
          "用万用表测量接线是否导通",
        ],
      },
      {
        id: "result_uart_gpio",
        result: true,
        title: "UART引脚配置错误",
        icon: "🔧",
        desc: "UART的GPIO引脚没有正确配置为复用功能。",
        solutions: [
          "TX引脚配置为复用推挽输出（GPIO_Mode_AF_PP）",
          "RX引脚配置为浮空输入（GPIO_Mode_IN_FLOATING）",
          "确认引脚是否支持UART功能（查数据手册引脚定义）",
          "检查是否开启了对应端口的GPIO时钟",
        ],
      },
      {
        id: "result_baudrate",
        result: true,
        title: "波特率不匹配",
        icon: "📊",
        desc: "串口两端波特率设置不一致，导致接收数据乱码或完全收不到。",
        solutions: [
          "确认代码和串口助手波特率设置一致（常用9600/115200）",
          "检查系统时钟配置是否正确，波特率计算依赖PCLK",
          "如果用外部晶振，确认晶振频率宏定义是否正确",
          "数据位、停止位、校验位也要保持一致",
        ],
      },
      {
        id: "result_uart_enable",
        result: true,
        title: "UART外设未使能",
        icon: "⚡",
        desc: "忘记使能UART外设，导致发送接收都不工作。",
        solutions: [
          "初始化最后调用 USART_Cmd(USARTx, ENABLE) 使能外设",
          "确认在配置完所有寄存器后才使能",
          "检查USART_CR1寄存器的UE位是否置1",
        ],
      },
      {
        id: "result_send_code",
        result: true,
        title: "发送函数调用有误",
        icon: "📤",
        desc: "数据发送的代码逻辑有问题。",
        solutions: [
          "发送数据后等待TXE标志：while(!USART_GetFlagStatus(USARTx, USART_FLAG_TXE))",
          "如果需要确保发送完成，等待TC标志",
          "检查printf重定向是否正确实现（fputc函数）",
          "直接用USART_SendData()发送一个字节试试，排除printf问题",
        ],
      },
      {
        id: "result_unknown_uart",
        result: true,
        title: "暂无法定位",
        icon: "🤔",
        desc: "建议用示波器测量TX引脚波形来进一步分析。",
        solutions: [
          "用示波器测量TX引脚，发送数据时是否有波形",
          "如果有波形但收不到，可能是串口助手或模块问题",
          "如果没有波形，检查代码是否真正执行到了发送处",
          "用LED调试法，在发送前后翻转LED看代码是否运行",
        ],
      },
    ],
  },
  sensor_no_data: {
    title: "传感器读不到数据",
    steps: [
      {
        question: "单片机其他功能正常吗？",
        detail: "先确认系统基本运行正常，比如LED闪烁、串口输出等。",
        yes: "check_sensor_power",
        no: "no_power",
      },
      {
        id: "check_sensor_power",
        question: "传感器供电是否正常？",
        detail:
          "用万用表测量传感器VCC引脚电压，确认在规格范围内（常见3.3V或5V）。",
        yes: "check_sensor_wiring",
        no: "result_sensor_power",
      },
      {
        id: "check_sensor_wiring",
        question: "传感器接线是否正确？",
        detail:
          "对照传感器 datasheet，确认VCC、GND、SDA/SCL（或其他信号线）连接正确。",
        yes: "check_bus_type",
        no: "result_sensor_wiring",
      },
      {
        id: "check_bus_type",
        question: "是什么通信协议的传感器？",
        detail: "确定传感器使用的是I2C、SPI、单总线还是模拟输出。",
        yes: "check_i2c",
        no: "check_spi",
      },
      {
        id: "check_i2c",
        question: "I2C通信是否正常？",
        detail: "用逻辑分析仪或示波器测量SDA/SCL波形，看是否有通信信号。",
        yes: "check_i2c_addr",
        no: "result_i2c_bus",
      },
      {
        id: "check_i2c_addr",
        question: "传感器地址是否正确？",
        detail:
          "确认代码中使用的I2C地址与传感器datasheet一致，注意是7位还是8位地址。",
        yes: "check_sensor_init",
        no: "result_i2c_addr",
      },
      {
        id: "check_sensor_init",
        question: "传感器初始化是否正确？",
        detail: "检查是否按照datasheet要求的初始化序列配置了传感器的寄存器。",
        yes: "result_unknown_sensor",
        no: "result_sensor_init",
      },
      {
        id: "check_spi",
        question: "SPI通信是否正常？",
        detail: "用逻辑分析仪测量SCK、MOSI、MISO波形，确认通信时序正确。",
        yes: "check_spi_mode",
        no: "result_spi_bus",
      },
      {
        id: "check_spi_mode",
        question: "SPI模式配置是否匹配？",
        detail: "确认CPOL和CPHA配置与传感器datasheet要求一致（模式0-3）。",
        yes: "check_cs_pin",
        no: "result_spi_mode",
      },
      {
        id: "check_cs_pin",
        question: "CS片选引脚控制是否正确？",
        detail: "确认通信前拉低CS，通信结束后拉高。多个SPI设备时注意不要冲突。",
        yes: "result_unknown_sensor",
        no: "result_cs_pin",
      },
      {
        id: "result_sensor_power",
        result: true,
        title: "传感器供电问题",
        icon: "🔋",
        desc: "传感器没有正确供电，导致无法工作。",
        solutions: [
          "确认供电电压符合传感器规格（3.3V或5V）",
          "检查电源线是否接反（VCC和GND）",
          "建议在传感器电源引脚旁加0.1uF去耦电容",
          "如果使用3.3V传感器，确认单片机IO也是3.3V的",
        ],
      },
      {
        id: "result_sensor_wiring",
        result: true,
        title: "传感器接线错误",
        icon: "🔌",
        desc: "传感器与单片机之间的接线有误。",
        solutions: [
          "仔细对照datasheet引脚定义逐一检查",
          "I2C的话，SDA接SDA、SCL接SCL（同名字相连）",
          "SPI的话，MOSI接MOSI、MISO接MISO、SCK接SCK",
          "用万用表测量每根线是否导通",
        ],
      },
      {
        id: "result_i2c_bus",
        result: true,
        title: "I2C总线问题",
        icon: "🔗",
        desc: "I2C通信总线有问题。",
        solutions: [
          "检查SDA和SCL线上是否有上拉电阻（通常4.7KΩ）",
          "确认I2C引脚配置为复用开漏输出",
          "检查I2C时钟频率是否在传感器支持范围内",
          "用I2C扫描程序扫描总线，看能否发现设备",
        ],
      },
      {
        id: "result_i2c_addr",
        result: true,
        title: "I2C地址错误",
        icon: "📍",
        desc: "传感器的I2C地址配置不正确。",
        solutions: [
          "仔细查看datasheet，确认7位地址是多少",
          "注意：代码中可能需要左移1位（因为8位格式）",
          "有些传感器的地址引脚（ADDR/SA0）会影响地址",
          "用I2C扫描程序确认实际地址",
        ],
      },
      {
        id: "result_sensor_init",
        result: true,
        title: "传感器初始化错误",
        icon: "⚙️",
        desc: "没有正确初始化传感器的配置寄存器。",
        solutions: [
          "仔细阅读datasheet的初始化流程章节",
          "确认所有必须的寄存器都配置了",
          "检查寄存器的默认值是否符合需求",
          "可以先读取芯片ID寄存器，确认通信是否通畅",
        ],
      },
      {
        id: "result_spi_bus",
        result: true,
        title: "SPI总线问题",
        icon: "⚡",
        desc: "SPI通信总线配置或硬件有问题。",
        solutions: [
          "确认SCK、MOSI、MISO引脚配置正确",
          "检查SPI时钟频率是否在传感器支持范围内",
          "确认SPI的主机/从机模式配置正确",
          "检查是否有其他SPI设备干扰总线",
        ],
      },
      {
        id: "result_spi_mode",
        result: true,
        title: "SPI模式不匹配",
        icon: "🔄",
        desc: "SPI的CPOL和CPHA配置与传感器不匹配。",
        solutions: [
          "查阅datasheet，确认传感器使用的SPI模式（0/1/2/3）",
          "对应配置SPI的CPOL和CPHA位",
          "四种模式都试试，有时datasheet可能描述不清",
        ],
      },
      {
        id: "result_cs_pin",
        result: true,
        title: "CS片选控制错误",
        icon: "🎯",
        desc: "SPI片选引脚控制不正确。",
        solutions: [
          "通信前拉低CS，通信完成后拉高CS",
          "确认CS引脚配置为通用推挽输出",
          "多个SPI设备共享总线时，确保只有一个CS被拉低",
          "检查CS引脚是否有虚焊",
        ],
      },
      {
        id: "result_unknown_sensor",
        result: true,
        title: "暂无法定位",
        icon: "🤔",
        desc: "建议使用逻辑分析仪或示波器抓取通信波形来分析。",
        solutions: [
          "用逻辑分析仪抓取通信波形，分析协议是否正确",
          "先读取芯片ID/版本寄存器，确认通信基本通畅",
          "找一个已知可用的传感器例程来对比",
          "检查传感器是否损坏（换一个试试）",
        ],
      },
    ],
  },
  program_crash: {
    title: "程序死机/跑飞",
    steps: [
      {
        question: "死机是随机的还是必现的？",
        detail: "是每次运行到某个地方必死机，还是偶尔随机死机？",
        yes: "check_hard_fault",
        no: "check_ram_overflow",
      },
      {
        id: "check_hard_fault",
        question: "是否进入了HardFault中断？",
        detail:
          "在HardFault_Handler函数中打断点或翻转LED，看是否进入了硬件错误中断。",
        yes: "result_hard_fault",
        no: "check_watchdog",
      },
      {
        id: "check_watchdog",
        question: "是否开启了看门狗？",
        detail: "检查是否使能了IWDG或WWDG看门狗，以及喂狗是否及时。",
        yes: "result_watchdog",
        no: "check_ram_overflow",
      },
      {
        id: "check_ram_overflow",
        question: "栈是否溢出？",
        detail: "检查是否有大的局部数组、深层递归调用、或中断嵌套太深的情况。",
        yes: "result_stack_overflow",
        no: "check_interrupt",
      },
      {
        id: "check_interrupt",
        question: "中断配置是否正确？",
        detail:
          "检查中断优先级配置、中断服务函数是否正确注册、中断标志是否清除。",
        yes: "check_memory",
        no: "result_interrupt",
      },
      {
        id: "check_memory",
        question: "是否有内存越界访问？",
        detail:
          "检查数组下标是否越界、指针是否为野指针、是否访问了未初始化的内存。",
        yes: "result_memory_overflow",
        no: "result_unknown_crash",
      },
      {
        id: "result_hard_fault",
        result: true,
        title: "硬件错误（HardFault）",
        icon: "💥",
        desc: "程序触发了硬件错误异常，通常是非法内存访问或指令错误。",
        solutions: [
          "在HardFault_Handler中排查，可使用Fault Analyzer工具",
          "检查是否有数组越界、野指针访问",
          "查看LR寄存器和堆栈，找到死机前的代码位置",
          "可能是未初始化的函数指针或中断向量表问题",
        ],
      },
      {
        id: "result_watchdog",
        result: true,
        title: "看门狗复位",
        icon: "🐕",
        desc: "程序运行时间过长，没有及时喂狗，导致看门狗复位。",
        solutions: [
          "确保主循环中定期调用喂狗函数",
          "检查是否有某段代码阻塞时间过长",
          "适当增大看门狗超时时间",
          "复杂操作中适当插入喂狗语句",
        ],
      },
      {
        id: "result_stack_overflow",
        result: true,
        title: "栈溢出",
        icon: "📚",
        desc: "程序运行时栈空间不足，导致数据溢出覆盖了其他内存区域。",
        solutions: [
          "增大栈大小（启动文件中修改Stack_Size）",
          "避免大数组作为局部变量，改用全局数组或malloc",
          "减少函数递归调用深度",
          "检查中断嵌套是否太深",
        ],
      },
      {
        id: "result_interrupt",
        result: true,
        title: "中断配置问题",
        icon: "🚨",
        desc: "中断配置或处理有误导致程序异常。",
        solutions: [
          "检查中断优先级分组和优先级配置",
          "确保中断服务函数中清除了中断标志位",
          "中断服务函数应尽量短，避免执行复杂逻辑",
          "检查是否有中断优先级冲突或嵌套问题",
        ],
      },
      {
        id: "result_memory_overflow",
        result: true,
        title: "内存越界访问",
        icon: "🚧",
        desc: "数组越界或野指针访问，导致内存数据被破坏。",
        solutions: [
          "仔细检查所有数组访问，确保下标不越界",
          "使用指针前务必检查是否为NULL",
          "避免返回局部变量的地址",
          "使用编译器的静态分析工具检查警告",
        ],
      },
      {
        id: "result_unknown_crash",
        result: true,
        title: "暂无法定位",
        icon: "🤔",
        desc: "随机死机问题通常较难定位，建议系统性地排查。",
        solutions: [
          "使用Debug模式和断点逐步定位死机位置",
          "通过串口或LED输出来跟踪程序执行流程",
          "注释掉部分功能，二分法定位问题模块",
          "检查编译器告警，修复所有Warning",
        ],
      },
    ],
  },
  download_fail: {
    title: "程序下载失败",
    steps: [
      {
        question: "调试器是否被电脑识别？",
        detail: "在设备管理器中查看ST-Link/J-Link是否正常显示。",
        yes: "check_target_power",
        no: "result_driver",
      },
      {
        id: "check_target_power",
        question: "目标板是否已上电？",
        detail: "目标板需要正常供电才能连接调试器。",
        yes: "check_swd_wiring",
        no: "result_target_power",
      },
      {
        id: "check_swd_wiring",
        question: "SWD接线是否正确？",
        detail: "确认SWDIO、SWCLK、GND连接正确。",
        yes: "check_boot_pin_2",
        no: "result_swd_wiring",
      },
      {
        id: "check_boot_pin_2",
        question: "BOOT引脚配置是否正确？",
        detail:
          "确认BOOT0是低电平（从Flash启动）。如果芯片被读保护了，需要先解除。",
        yes: "check_read_protection",
        no: "result_boot_pin_2",
      },
      {
        id: "check_read_protection",
        question: "芯片是否设置了读保护？",
        detail: "如果之前设置了读保护（RDP），需要先解除才能重新下载。",
        yes: "result_read_protection",
        no: "check_mcu_supply",
      },
      {
        id: "check_mcu_supply",
        question: "芯片电压是否正常？",
        detail: "测量VDD引脚电压是否在规格范围内（通常2.0-3.6V）。",
        yes: "result_unknown_dl",
        no: "result_mcu_power",
      },
      {
        id: "result_driver",
        result: true,
        title: "调试器驱动问题",
        icon: "💻",
        desc: "电脑无法识别调试器，通常是驱动安装问题。",
        solutions: [
          "安装对应调试器的驱动程序",
          "ST-Link建议安装最新版STM32CubeProgrammer",
          "更换USB口，尽量用主板后置USB",
          "检查USB线是否支持数据传输",
        ],
      },
      {
        id: "result_target_power",
        result: true,
        title: "目标板未供电",
        icon: "🔌",
        desc: "目标板没有上电，调试器无法连接。",
        solutions: [
          "给目标板接上电源",
          "确认电源指示灯亮",
          "有些调试器可以给目标板供电，检查设置",
        ],
      },
      {
        id: "result_swd_wiring",
        result: true,
        title: "SWD接线错误",
        icon: "🔗",
        desc: "SWD接口接线不正确。",
        solutions: [
          "确认SWDIO接SWDIO、SWCLK接SWCLK",
          "GND必须共地",
          "NRST也建议接上，可以提高连接成功率",
          "检查杜邦线是否导通，换一根试试",
        ],
      },
      {
        id: "result_boot_pin_2",
        result: true,
        title: "BOOT引脚配置错误",
        icon: "🔧",
        desc: "BOOT引脚电平配置不正确，导致芯片处于系统存储器或SRAM启动模式。",
        solutions: [
          "BOOT0接GND（低电平），从Flash启动",
          "如果BOOT0接了VCC，芯片会进入ISP模式",
          "检查跳帽或接线是否正确",
        ],
      },
      {
        id: "result_read_protection",
        result: true,
        title: "芯片读保护",
        icon: "🔒",
        desc: "芯片设置了读保护（RDP），无法下载和读取程序。",
        solutions: [
          "使用STM32CubeProgrammer连接并解除读保护",
          "解除读保护会擦除整片Flash，请提前备份",
          '在Debug配置中选择"Connect under reset"试试',
          "如果是芯片出厂保护，需要先解除",
        ],
      },
      {
        id: "result_mcu_power",
        result: true,
        title: "芯片供电异常",
        icon: "⚡",
        desc: "MCU的供电电压不正常，导致无法正常工作。",
        solutions: [
          "测量VDD引脚电压，正常应为3.3V左右",
          "检查电源电路（如LDO芯片）是否正常",
          "检查所有VDD和VSS引脚是否都焊好了",
          "检查是否有短路导致电压被拉低",
        ],
      },
      {
        id: "result_unknown_dl",
        result: true,
        title: "暂无法定位",
        icon: "🤔",
        desc: "建议尝试更多调试手段来定位问题。",
        solutions: [
          "降低调试器的通信速率再试",
          "按住复位键的同时尝试连接",
          "用STM32CubeProgrammer试试，比Keil更稳定",
          "换一颗芯片或换一块开发板交叉验证",
        ],
      },
    ],
  },
};

/**
 * 选择故障现象，开始排查
 * @param {string} symptom - 故障类型标识
 */
function selectSymptom(symptom) {
  currentDebugPath = symptom;
  debugStepIndex = 0;

  document.getElementById("symptomSelector").style.display = "none";
  document.getElementById("decisionTree").classList.add("visible");
  document.getElementById("debugResetWrap").style.display = "block";

  /* 开始第一步 */
  showDebugStep(debugStepIndex);
}

/**
 * 显示当前排查步骤
 * @param {number} stepIdx - 步骤索引
 */
function showDebugStep(stepIdx) {
  const tree = debugTrees[currentDebugPath];
  if (!tree) return;

  const step = tree.steps[stepIdx];
  if (!step) return;

  const treeEl = document.getElementById("decisionTree");

  /* 如果是结果，显示诊断结果 */
  if (step.result) {
    showDiagnosisResult(step);
    return;
  }

  const nodeEl = document.createElement("div");
  nodeEl.className = "decision-node current";
  nodeEl.id = `debug-node-${stepIdx}`;
  nodeEl.innerHTML = `
    <div class="node-header">
      <div class="node-step">${stepIdx + 1}</div>
      <div class="node-question">${step.question}</div>
    </div>
    <div class="node-detail">${step.detail}</div>
    <div class="node-actions">
      <button class="btn-yes" onclick="answerDebug(true)">是</button>
      <button class="btn-no" onclick="answerDebug(false)">否</button>
    </div>
  `;

  treeEl.appendChild(nodeEl);

  /* 滚动到新节点 */
  nodeEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * 回答问题（是/否）
 * @param {boolean} isYes - 是否为"是"
 */
function answerDebug(isYes) {
  const tree = debugTrees[currentDebugPath];
  const currentStep = tree.steps[debugStepIndex];

  /* 将当前节点标记为已完成 */
  const currentNode = document.getElementById(`debug-node-${debugStepIndex}`);
  if (currentNode) {
    currentNode.classList.remove("current");
    currentNode.classList.add("done");
  }

  /* 找到下一步 */
  const nextStepId = isYes ? currentStep.yes : currentStep.no;
  let nextIdx = -1;

  /* 先在当前树中查找 */
  for (let i = 0; i < tree.steps.length; i++) {
    if (tree.steps[i].id === nextStepId) {
      nextIdx = i;
      break;
    }
  }

  /* 如果没找到，检查是否是跳转到其他故障类型 */
  if (nextIdx === -1 && debugTrees[nextStepId]) {
    currentDebugPath = nextStepId;
    debugStepIndex = 0;
    showDebugStep(0);
    return;
  }

  if (nextIdx === -1) {
    console.warn("未找到下一步:", nextStepId);
    return;
  }

  debugStepIndex = nextIdx;
  showDebugStep(debugStepIndex);
}

/**
 * 显示最终诊断结果
 * @param {Object} result - 诊断结果对象
 */
function showDiagnosisResult(result) {
  const resultEl = document.getElementById("diagnosisResult");

  let solutionsHtml = "";
  result.solutions.forEach((s) => {
    solutionsHtml += `<li>${s}</li>`;
  });

  resultEl.innerHTML = `
    <div class="diagnosis-icon">${result.icon}</div>
    <div class="diagnosis-title">${result.title}</div>
    <div class="diagnosis-desc">${result.desc}</div>
    <div class="diagnosis-solution">
      <h4>解决方法：</h4>
      <ul>${solutionsHtml}</ul>
    </div>
  `;

  resultEl.classList.add("visible");
  resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * 重置故障排查，回到初始状态
 */
function resetDebug() {
  currentDebugPath = null;
  debugStepIndex = 0;

  document.getElementById("symptomSelector").style.display = "block";
  document.getElementById("decisionTree").classList.remove("visible");
  document.getElementById("decisionTree").innerHTML = "";
  document.getElementById("diagnosisResult").classList.remove("visible");
  document.getElementById("diagnosisResult").innerHTML = "";
  document.getElementById("debugResetWrap").style.display = "none";
}

/* ==========================
 *  模块6：外设知识库
 * ========================== */

/** 外设知识库数据 */
const peripheralData = {
  gpio: {
    name: "GPIO",
    icon: "🔌",
    title: "通用输入输出 (GPIO)",
    desc: "GPIO是STM32最基础的外设，用于控制引脚的输入输出状态，实现与外部电路的交互。",
    sections: [
      {
        title: "工作模式",
        content: `
          <h4>输入模式</h4>
          <ul>
            <li><strong>浮空输入 (IN_FLOATING)</strong>：引脚电平由外部电路决定，常用在按键输入等场景</li>
            <li><strong>上拉输入 (IPU)</strong>：内部接上拉电阻，默认高电平，按键接GND按下变低</li>
            <li><strong>下拉输入 (IPD)</strong>：内部接下拉电阻，默认低电平，按键接VCC按下变高</li>
            <li><strong>模拟输入 (AIN)</strong>：引脚连接ADC，用于模拟信号采集</li>
          </ul>
          <h4>输出模式</h4>
          <ul>
            <li><strong>推挽输出 (Out_PP)</strong>：可以输出高低电平，常用在LED控制、片选信号等</li>
            <li><strong>开漏输出 (Out_OD)</strong>：只能拉低，高电平靠外部上拉，常用于I2C等总线</li>
            <li><strong>复用推挽 (AF_PP)</strong>：片上外设（USART/SPI等）控制的推挽输出</li>
            <li><strong>复用开漏 (AF_OD)</strong>：片上外设控制的开漏输出，如I2C的SDA/SCL</li>
          </ul>
        `,
      },
      {
        title: "代码示例",
        content: `
          <h4>STM32 标准库 - GPIO初始化</h4>
<pre>
/* 使能GPIOA时钟 */
RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);

/* 配置PA5为推挽输出，50MHz */
GPIO_InitTypeDef GPIO_InitStructure;
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_5;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOA, &GPIO_InitStructure);

/* 设置PA5高电平 */
GPIO_SetBits(GPIOA, GPIO_Pin_5);

/* 设置PA5低电平 */
GPIO_ResetBits(GPIOA, GPIO_Pin_5);

/* 翻转PA5电平 */
GPIO_WriteBit(GPIOA, GPIO_Pin_5,
    (BitAction)(1 - GPIO_ReadOutputDataBit(GPIOA, GPIO_Pin_5)));
</pre>
          <h4>Arduino - GPIO操作</h4>
<pre>
/* 设置引脚模式 */
pinMode(13, OUTPUT);     // 设置13脚为输出
pinMode(2, INPUT_PULLUP); // 设置2脚为上拉输入

/* 输出控制 */
digitalWrite(13, HIGH);  // 输出高电平
digitalWrite(13, LOW);   // 输出低电平

/* 输入读取 */
int val = digitalRead(2); // 读取引脚电平
</pre>
        `,
      },
      {
        title: "寄存器速查表",
        content: `
          <table class="cheatsheet-table">
            <tr><th>寄存器</th><th>功能</th><th>说明</th></tr>
            <tr><td><code>GPIOx_CRL</code></td><td>配置寄存器低</td><td>配置Pin0~Pin7的模式和速度</td></tr>
            <tr><td><code>GPIOx_CRH</code></td><td>配置寄存器高</td><td>配置Pin8~Pin15的模式和速度</td></tr>
            <tr><td><code>GPIOx_IDR</code></td><td>输入数据寄存器</td><td>只读，读取引脚输入电平</td></tr>
            <tr><td><code>GPIOx_ODR</code></td><td>输出数据寄存器</td><td>读写，控制引脚输出电平</td></tr>
            <tr><td><code>GPIOx_BSRR</code></td><td>置位/复位寄存器</td><td>原子操作，写1置位，高16位复位</td></tr>
            <tr><td><code>GPIOx_BRR</code></td><td>复位寄存器</td><td>原子操作，写1复位对应引脚</td></tr>
            <tr><td><code>GPIOx_LCKR</code></td><td>锁定寄存器</td><td>锁定引脚配置，防止意外修改</td></tr>
          </table>
        `,
      },
      {
        title: "常见问题",
        content: `
          <h4>Q: GPIO输出没反应？</h4>
          <p>A: 首先检查是否使能了对应端口的时钟！这是最常见的错误。然后确认模式配置正确。</p>
          <h4>Q: 开漏输出和推挽输出怎么选？</h4>
          <p>A: 普通IO控制用推挽；I2C、1-Wire等总线协议用开漏+外部上拉。</p>
          <h4>Q: 输入模式选择上拉还是下拉？</h4>
          <p>A: 看你的电路设计。按键一端接GND就用上拉输入，按键一端接VCC就用下拉输入。</p>
        `,
      },
    ],
  },
  uart: {
    name: "UART",
    icon: "📡",
    title: "通用异步收发器 (UART)",
    desc: "UART是最常用的串行通信接口，用于与PC、蓝牙模块、GPS等设备通信。",
    sections: [
      {
        title: "工作原理",
        content: `
          <h4>通信特点</h4>
          <ul>
            <li><strong>异步通信</strong>：不需要时钟线，双方约定波特率</li>
            <li><strong>两根线</strong>：TX（发送）和RX（接收），交叉连接</li>
            <li><strong>帧格式</strong>：起始位 + 数据位 + 校验位 + 停止位</li>
          </ul>
          <h4>常用参数</h4>
          <ul>
            <li><strong>波特率</strong>：9600、115200、921600 bps等</li>
            <li><strong>数据位</strong>：通常8位</li>
            <li><strong>停止位</strong>：1位（常用）或2位</li>
            <li><strong>校验位</strong>：无校验、奇校验、偶校验</li>
          </ul>
        `,
      },
      {
        title: "代码示例",
        content: `
          <h4>STM32 标准库 - USART1初始化</h4>
<pre>
/* 使能时钟 */
RCC_APB2PeriphClockCmd(RCC_APB2Periph_USART1 |
    RCC_APB2Periph_GPIOA, ENABLE);

/* 配置TX引脚(PA9)为复用推挽输出 */
GPIO_InitTypeDef GPIO_InitStructure;
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOA, &GPIO_InitStructure);

/* 配置RX引脚(PA10)为浮空输入 */
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
GPIO_Init(GPIOA, &GPIO_InitStructure);

/* USART配置 */
USART_InitTypeDef USART_InitStructure;
USART_InitStructure.USART_BaudRate = 115200;
USART_InitStructure.USART_WordLength = USART_WordLength_8b;
USART_InitStructure.USART_StopBits = USART_StopBits_1;
USART_InitStructure.USART_Parity = USART_Parity_No;
USART_InitStructure.USART_HardwareFlowControl =
    USART_HardwareFlowControl_None;
USART_InitStructure.USART_Mode = USART_Mode_Tx | USART_Mode_Rx;
USART_Init(USART1, &USART_InitStructure);

/* 使能USART */
USART_Cmd(USART1, ENABLE);
</pre>
          <h4>发送一个字节</h4>
<pre>
void USART_SendByte(uint8_t data)
{
    /* 等待发送数据寄存器空 */
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
    USART_SendData(USART1, data);
    /* 可选：等待发送完成 */
    while (USART_GetFlagStatus(USART1, USART_FLAG_TC) == RESET);
}
</pre>
          <h4>printf重定向</h4>
<pre>
int fputc(int ch, FILE *f)
{
    USART_SendData(USART1, (uint8_t)ch);
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
    return ch;
}
</pre>
        `,
      },
      {
        title: "寄存器速查表",
        content: `
          <table class="cheatsheet-table">
            <tr><th>寄存器</th><th>功能</th><th>说明</th></tr>
            <tr><td><code>USART_SR</code></td><td>状态寄存器</td><td>TXE、TC、RXNE等标志位</td></tr>
            <tr><td><code>USART_DR</code></td><td>数据寄存器</td><td>读写数据，双缓冲结构</td></tr>
            <tr><td><code>USART_BRR</code></td><td>波特率寄存器</td><td>设置波特率分频值</td></tr>
            <tr><td><code>USART_CR1</code></td><td>控制寄存器1</td><td>UE使能、M字长、PCE校验等</td></tr>
            <tr><td><code>USART_CR2</code></td><td>控制寄存器2</td><td>停止位数、LIN模式等</td></tr>
            <tr><td><code>USART_CR3</code></td><td>控制寄存器3</td><td>DMA使能、硬件流控等</td></tr>
          </table>
        `,
      },
      {
        title: "常见问题",
        content: `
          <h4>Q: 串口收到乱码？</h4>
          <p>A: 波特率不匹配是最常见原因。检查代码和串口助手的波特率是否一致，系统时钟配置是否正确。</p>
          <h4>Q: printf不输出？</h4>
          <p>A: 确保fputc函数正确实现，并且工程中勾选了Use MicroLIB。</p>
          <h4>Q: 接收数据丢失？</h4>
          <p>A: 建议使用中断+环形缓冲区的方式接收数据，避免处理不及时导致丢失。</p>
        `,
      },
    ],
  },
  i2c: {
    name: "I2C",
    icon: "🔗",
    title: "集成电路总线 (I2C)",
    desc: "I2C是一种两线制串行通信协议，常用于连接传感器、EEPROM等低速外设。",
    sections: [
      {
        title: "协议基础",
        content: `
          <h4>物理层</h4>
          <ul>
            <li><strong>SCL</strong>：时钟线，由主机控制</li>
            <li><strong>SDA</strong>：数据线，双向传输</li>
            <li><strong>上拉电阻</strong>：必须外接，通常4.7KΩ</li>
            <li><strong>开漏输出</strong>：所有设备都用开漏模式，实现"线与"</li>
          </ul>
          <h4>关键时序</h4>
          <ul>
            <li><strong>起始条件 (S)</strong>：SCL高电平时，SDA由高变低</li>
            <li><strong>停止条件 (P)</strong>：SCL高电平时，SDA由低变高</li>
            <li><strong>应答 (ACK)</strong>：接收方第9个时钟拉低SDA表示应答</li>
            <li><strong>非应答 (NACK)</strong>：接收方第9个时钟保持高电平</li>
          </ul>
        `,
      },
      {
        title: "代码示例",
        content: `
          <h4>STM32 软件I2C - 起始条件</h4>
<pre>
void I2C_Start(void)
{
    SDA_OUT();     // SDA设为输出
    I2C_SDA(1);
    I2C_SCL(1);
    delay_us(4);
    I2C_SDA(0);    // SDA先变低
    delay_us(4);
    I2C_SCL(0);    // 钳住SCL，准备发送
}
</pre>
          <h4>软件I2C - 发送一个字节</h4>
<pre>
uint8_t I2C_SendByte(uint8_t data)
{
    uint8_t i;
    SDA_OUT();
    for (i = 0; i < 8; i++)
    {
        I2C_SDA((data & 0x80) >> 7);
        data <<= 1;
        I2C_SCL(1);
        delay_us(2);
        I2C_SCL(0);
        delay_us(2);
    }
    /* 等待ACK */
    I2C_SDA(1);    // 释放SDA
    delay_us(2);
    SDA_IN();      // SDA设为输入
    I2C_SCL(1);
    delay_us(2);
    uint8_t ack = GPIO_ReadInputDataBit(I2C_PORT, SDA_PIN);
    I2C_SCL(0);
    return ack;    // 0=ACK, 1=NACK
}
</pre>
          <h4>硬件I2C初始化</h4>
<pre>
/* 使能时钟 */
RCC_APB1PeriphClockCmd(RCC_APB1Periph_I2C1, ENABLE);
RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);

/* 配置PB6(SCL) PB7(SDA)为复用开漏 */
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6 | GPIO_Pin_7;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_OD;
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOB, &GPIO_InitStructure);

/* I2C配置 */
I2C_InitTypeDef I2C_InitStructure;
I2C_InitStructure.I2C_Mode = I2C_Mode_I2C;
I2C_InitStructure.I2C_ClockSpeed = 100000;  // 100kHz
I2C_InitStructure.I2C_DutyCycle = I2C_DutyCycle_2;
I2C_InitStructure.I2C_Ack = I2C_Ack_Enable;
I2C_InitStructure.I2C_OwnAddress1 = 0x30;
I2C_Init(I2C1, &I2C_InitStructure);
I2C_Cmd(I2C1, ENABLE);
</pre>
        `,
      },
      {
        title: "寄存器速查表",
        content: `
          <table class="cheatsheet-table">
            <tr><th>寄存器</th><th>功能</th><th>说明</th></tr>
            <tr><td><code>I2C_CR1</code></td><td>控制寄存器1</td><td>PE使能、START/STOP、ACK等</td></tr>
            <tr><td><code>I2C_CR2</code></td><td>控制寄存器2</td><td>频率设置、DMA/中断使能</td></tr>
            <tr><td><code>I2C_OAR1</code></td><td>自身地址1</td><td>从机模式下的自身地址</td></tr>
            <tr><td><code>I2C_DR</code></td><td>数据寄存器</td><td>发送/接收数据</td></tr>
            <tr><td><code>I2C_SR1</code></td><td>状态寄存器1</td><td>SB、ADDR、TXE、RXNE等标志</td></tr>
            <tr><td><code>I2C_SR2</code></td><td>状态寄存器2</td><td>MSL、BUSY、TRA等</td></tr>
            <tr><td><code>I2C_CCR</code></td><td>时钟控制</td><td>标准/快速模式，时钟分频</td></tr>
            <tr><td><code>I2C_TRISE</code></td><td>上升时间</td><td>最大上升时间配置</td></tr>
          </table>
        `,
      },
      {
        title: "常见问题",
        content: `
          <h4>Q: I2C通信失败？</h4>
          <p>A: 先检查硬件：SDA/SCL上拉电阻是否焊接？引脚是否配置为开漏输出？</p>
          <h4>Q: 软件I2C和硬件I2C哪个好？</h4>
          <p>A: 硬件I2C效率高但引脚固定；软件I2C可以用任意GPIO但占用CPU。建议优先用硬件的。</p>
          <h4>Q: I2C地址是7位还是8位？</h4>
          <p>A: I2C地址是7位的，第8位是读写方向位。代码中通常需要左移1位再或上读写位。</p>
        `,
      },
    ],
  },
  spi: {
    name: "SPI",
    icon: "⚡",
    title: "串行外设接口 (SPI)",
    desc: "SPI是一种高速串行通信协议，常用于连接Flash、显示屏、ADC等高速外设。",
    sections: [
      {
        title: "协议基础",
        content: `
          <h4>物理层</h4>
          <ul>
            <li><strong>SCK</strong>：时钟线，主机产生</li>
            <li><strong>MOSI</strong>：主机输出，从机输入</li>
            <li><strong>MISO</strong>：主机输入，从机输出</li>
            <li><strong>CS/SS</strong>：片选，每个从机一个</li>
          </ul>
          <h4>SPI四种模式</h4>
          <ul>
            <li><strong>模式0</strong>：CPOL=0, CPHA=0 - 空闲低，第1个边沿采样</li>
            <li><strong>模式1</strong>：CPOL=0, CPHA=1 - 空闲低，第2个边沿采样</li>
            <li><strong>模式2</strong>：CPOL=1, CPHA=0 - 空闲高，第1个边沿采样</li>
            <li><strong>模式3</strong>：CPOL=1, CPHA=1 - 空闲高，第2个边沿采样</li>
          </ul>
        `,
      },
      {
        title: "代码示例",
        content: `
          <h4>STM32 硬件SPI初始化</h4>
<pre>
/* 使能时钟 */
RCC_APB2PeriphClockCmd(RCC_APB2Periph_SPI1 |
    RCC_APB2Periph_GPIOA, ENABLE);

/* 配置SCK(PA5) MOSI(PA7)为复用推挽 */
GPIO_InitTypeDef GPIO_InitStructure;
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_5 | GPIO_Pin_7;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOA, &GPIO_InitStructure);

/* MISO(PA6)为浮空输入 */
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
GPIO_Init(GPIOA, &GPIO_InitStructure);

/* SPI配置 */
SPI_InitTypeDef SPI_InitStructure;
SPI_InitStructure.SPI_Direction = SPI_Direction_2Lines_FullDuplex;
SPI_InitStructure.SPI_Mode = SPI_Mode_Master;
SPI_InitStructure.SPI_DataSize = SPI_DataSize_8b;
SPI_InitStructure.SPI_CPOL = SPI_CPOL_Low;
SPI_InitStructure.SPI_CPHA = SPI_CPHA_1Edge;
SPI_InitStructure.SPI_NSS = SPI_NSS_Soft;
SPI_InitStructure.SPI_BaudRatePrescaler = SPI_BaudRatePrescaler_8;
SPI_InitStructure.SPI_FirstBit = SPI_FirstBit_MSB;
SPI_Init(SPI1, &SPI_InitStructure);

SPI_Cmd(SPI1, ENABLE);
</pre>
          <h4>SPI读写一个字节</h4>
<pre>
uint8_t SPI_ReadWriteByte(uint8_t data)
{
    /* 等待发送缓冲区空 */
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET);
    SPI_I2S_SendData(SPI1, data);
    /* 等待接收缓冲区有数据 */
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) == RESET);
    return SPI_I2S_ReceiveData(SPI1);
}
</pre>
        `,
      },
      {
        title: "寄存器速查表",
        content: `
          <table class="cheatsheet-table">
            <tr><th>寄存器</th><th>功能</th><th>说明</th></tr>
            <tr><td><code>SPI_CR1</code></td><td>控制寄存器1</td><td>CPOL/CPHA、主从模式、波特率等</td></tr>
            <tr><td><code>SPI_CR2</code></td><td>控制寄存器2</td><td>DMA使能、中断使能等</td></tr>
            <tr><td><code>SPI_SR</code></td><td>状态寄存器</td><td>TXE、RXNE、BSY等标志</td></tr>
            <tr><td><code>SPI_DR</code></td><td>数据寄存器</td><td>发送/接收数据</td></tr>
            <tr><td><code>SPI_CRCPR</code></td><td>CRC多项式</td><td>CRC校验多项式设置</td></tr>
          </table>
        `,
      },
      {
        title: "常见问题",
        content: `
          <h4>Q: SPI数据不对？</h4>
          <p>A: 检查CPOL和CPHA配置是否与从设备一致，四种模式都试试。</p>
          <h4>Q: SPI速度能到多少？</h4>
          <p>A: 最高可达系统时钟的1/2。STM32F1在72MHz下最高36MHz。但实际速度受限于从设备。</p>
          <h4>Q: 多个SPI设备怎么接？</h4>
          <p>A: SCK/MOSI/MISO都并联，每个设备单独一根CS线。通信时只拉低对应设备的CS。</p>
        `,
      },
    ],
  },
  adc: {
    name: "ADC",
    icon: "📊",
    title: "模数转换器 (ADC)",
    desc: "ADC用于将模拟电压信号转换为数字值，是采集传感器数据的核心外设。",
    sections: [
      {
        title: "基本概念",
        content: `
          <h4>关键参数</h4>
          <ul>
            <li><strong>分辨率</strong>：STM32F1为12位，取值范围0~4095</li>
            <li><strong>采样时间</strong>：可配置，影响精度和速度</li>
            <li><strong>输入范围</strong>：0 ~ VDDA（通常3.3V）</li>
            <li><strong>通道数</strong>：最多18个通道（16外部+2内部）</li>
          </ul>
          <h4>工作模式</h4>
          <ul>
            <li><strong>单次转换</strong>：转换一次就停止</li>
            <li><strong>连续转换</strong>：转换完自动开始下一次</li>
            <li><strong>扫描模式</strong>：自动扫描多个通道</li>
            <li><strong>间断模式</strong>：分批次转换</li>
          </ul>
        `,
      },
      {
        title: "代码示例",
        content: `
          <h4>STM32 ADC单通道单次转换</h4>
<pre>
/* 使能时钟 */
RCC_APB2PeriphClockCmd(RCC_APB2Periph_ADC1 |
    RCC_APB2Periph_GPIOA, ENABLE);

/* 配置PA0为模拟输入 */
GPIO_InitTypeDef GPIO_InitStructure;
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN;
GPIO_Init(GPIOA, &GPIO_InitStructure);

/* ADC分频 - APB2的1/6=12MHz */
RCC_ADCCLKConfig(RCC_PCLK2_Div6);

/* ADC配置 */
ADC_InitTypeDef ADC_InitStructure;
ADC_InitStructure.ADC_Mode = ADC_Mode_Independent;
ADC_InitStructure.ADC_ScanConvMode = DISABLE;
ADC_InitStructure.ADC_ContinuousConvMode = DISABLE;
ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;
ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;
ADC_InitStructure.ADC_NbrOfChannel = 1;
ADC_Init(ADC1, &ADC_InitStructure);

/* 配置通道和采样时间 */
ADC_RegularChannelConfig(ADC1, ADC_Channel_0, 1,
    ADC_SampleTime_55Cycles5);

/* 使能ADC */
ADC_Cmd(ADC1, ENABLE);

/* ADC校准 */
ADC_ResetCalibration(ADC1);
while (ADC_GetResetCalibrationStatus(ADC1));
ADC_StartCalibration(ADC1);
while (ADC_GetCalibrationStatus(ADC1));
</pre>
          <h4>读取一次ADC值</h4>
<pre>
uint16_t ADC_GetValue(void)
{
    /* 启动软件转换 */
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);
    /* 等待转换完成 */
    while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET);
    /* 读取结果 */
    return ADC_GetConversionValue(ADC1);
}

/* 转换为电压值（单位mV）*/
float ADC_ToVoltage(uint16_t adc_val)
{
    return (float)adc_val * 3300.0f / 4095.0f;
}
</pre>
        `,
      },
      {
        title: "寄存器速查表",
        content: `
          <table class="cheatsheet-table">
            <tr><th>寄存器</th><th>功能</th><th>说明</th></tr>
            <tr><td><code>ADC_SR</code></td><td>状态寄存器</td><td>EOC、JEOC、AWD等标志</td></tr>
            <tr><td><code>ADC_CR1</code></td><td>控制寄存器1</td><td>扫描模式、AWD、中断等</td></tr>
            <tr><td><code>ADC_CR2</code></td><td>控制寄存器2</td><td>ADON、CONT、SWSTART、校准等</td></tr>
            <tr><td><code>ADC_SMPR1</code></td><td>采样时间1</td><td>通道10~17采样时间</td></tr>
            <tr><td><code>ADC_SMPR2</code></td><td>采样时间2</td><td>通道0~9采样时间</td></tr>
            <tr><td><code>ADC_JOFRx</code></td><td>注入通道偏移</td><td>注入组通道偏移校正</td></tr>
            <tr><td><code>ADC_SQR1/2/3</code></td><td>规则序列</td><td>规则组通道顺序配置</td></tr>
            <tr><td><code>ADC_DR</code></td><td>数据寄存器</td><td>规则组转换结果</td></tr>
          </table>
        `,
      },
      {
        title: "常见问题",
        content: `
          <h4>Q: ADC值不准？</h4>
          <p>A: 参考电压是否稳定？VDDA最好加滤波电容。建议多次采样取平均值。</p>
          <h4>Q: 采样时间选多少？</h4>
          <p>A: 输入阻抗越高，需要的采样时间越长。一般默认选55.5周期比较保险。</p>
          <h4>Q: 必须做校准吗？</h4>
          <p>A: 建议上电后做一次校准，可以有效提高精度。校准过程大约需要几十个时钟周期。</p>
        `,
      },
    ],
  },
  dma: {
    name: "DMA",
    icon: "🚀",
    title: "直接存储器访问 (DMA)",
    desc: "DMA可以在外设和内存之间自动传输数据，不占用CPU，大幅提高系统效率。",
    sections: [
      {
        title: "工作原理",
        content: `
          <h4>DMA特点</h4>
          <ul>
            <li><strong>无需CPU干预</strong>：数据传输完全由DMA控制器完成</li>
            <li><strong>高速传输</strong>：可以达到系统总线速度</li>
            <li><strong>多种方向</strong>：外设→内存、内存→外设、内存→内存</li>
            <li><strong>循环模式</strong>：传输完成后自动重新开始</li>
          </ul>
          <h4>STM32F1的DMA资源</h4>
          <ul>
            <li><strong>DMA1</strong>：7个通道，挂载在AHB总线上</li>
            <li><strong>DMA2</strong>：5个通道（大容量产品才有）</li>
            <li>每个通道都有独立的配置</li>
            <li>支持外设触发和软件触发</li>
          </ul>
        `,
      },
      {
        title: "代码示例",
        content: `
          <h4>USART TX DMA配置</h4>
<pre>
void DMA_USART_TX_Init(uint8_t *buf, uint16_t size)
{
    /* 使能DMA时钟 */
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    DMA_InitTypeDef DMA_InitStructure;
    DMA_DeInit(DMA1_Channel4);  // USART1_TX是通道4

    DMA_InitStructure.DMA_PeripheralBaseAddr =
        (uint32_t)&USART1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)buf;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralDST;
    DMA_InitStructure.DMA_BufferSize = size;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize =
        DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize =
        DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStructure.DMA_Priority = DMA_Priority_Medium;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel4, &DMA_InitStructure);

    /* 使能USART的TX DMA */
    USART_DMACmd(USART1, USART_DMAReq_Tx, ENABLE);
}

/* 启动一次DMA发送 */
void DMA_USART_Send(uint16_t size)
{
    DMA_Cmd(DMA1_Channel4, DISABLE);
    DMA_SetCurrDataCounter(DMA1_Channel4, size);
    DMA_Cmd(DMA1_Channel4, ENABLE);
}
</pre>
        `,
      },
      {
        title: "寄存器速查表",
        content: `
          <table class="cheatsheet-table">
            <tr><th>寄存器</th><th>功能</th><th>说明</th></tr>
            <tr><td><code>DMA_ISR</code></td><td>中断状态</td><td>所有通道的中断标志</td></tr>
            <tr><td><code>DMA_IFCR</code></td><td>中断标志清除</td><td>清除对应中断标志</td></tr>
            <tr><td><code>DMA_CCRx</code></td><td>通道配置</td><td>使能、方向、增量、优先级等</td></tr>
            <tr><td><code>DMA_CNDTRx</code></td><td>数据数量</td><td>待传输的数据个数</td></tr>
            <tr><td><code>DMA_CPARx</code></td><td>外设地址</td><td>外设端基地址</td></tr>
            <tr><td><code>DMA_CMARx</code></td><td>内存地址</td><td>内存端基地址</td></tr>
          </table>
        `,
      },
      {
        title: "常见问题",
        content: `
          <h4>Q: DMA和CPU访问内存冲突吗？</h4>
          <p>A: 不会冲突。DMA和CPU共享总线，通过总线矩阵仲裁，DMA优先级低于CPU。</p>
          <h4>Q: 什么情况用DMA最合适？</h4>
          <p>A: 大数据量传输时，比如串口接收缓冲区、ADC多通道采样、显示屏刷新等。</p>
          <h4>Q: 循环模式和普通模式区别？</h4>
          <p>A: 普通模式传完就停止；循环模式传完自动重装，适合环形缓冲区。</p>
        `,
      },
    ],
  },
  timer: {
    name: "TIM",
    icon: "⏱️",
    title: "定时器 (TIM)",
    desc: "STM32的定时器功能非常强大，可以用于延时、PWM、输入捕获、输出比较等多种场景。",
    sections: [
      {
        title: "定时器分类",
        content: `
          <h4>高级控制定时器 (TIM1/TIM8)</h4>
          <ul>
            <li>16位自动重装载计数器</li>
            <li>4个独立通道：输入捕获/输出比较/PWM</li>
            <li>支持死区插入、互补输出（电机驱动必备）</li>
            <li>最多可达72MHz时钟</li>
          </ul>
          <h4>通用定时器 (TIM2~TIM5)</h4>
          <ul>
            <li>16位自动重装载计数器</li>
            <li>4个独立通道</li>
            <li>支持编码器接口</li>
          </ul>
          <h4>基本定时器 (TIM6/TIM7)</h4>
          <ul>
            <li>只有计数功能，没有输入输出通道</li>
            <li>主要用于DAC触发和基本延时</li>
          </ul>
        `,
      },
      {
        title: "代码示例",
        content: `
          <h4>定时器中断配置</h4>
<pre>
void TIM2_Init(uint16_t arr, uint16_t psc)
{
    /* 使能时钟 */
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);

    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_TimeBaseStructure.TIM_Period = arr;
    TIM_TimeBaseStructure.TIM_Prescaler = psc;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(TIM2, &TIM_TimeBaseStructure);

    /* 使能更新中断 */
    TIM_ITConfig(TIM2, TIM_IT_Update, ENABLE);

    /* NVIC配置 */
    NVIC_InitTypeDef NVIC_InitStructure;
    NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 3;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);

    TIM_Cmd(TIM2, ENABLE);
}

/* 计算方法：溢出频率 = 72MHz / (psc+1) / (arr+1) */
/* 例如：psc=7199, arr=9999 → 1Hz = 1秒 */
</pre>
          <h4>PWM输出配置</h4>
<pre>
void TIM3_PWM_Init(uint16_t arr, uint16_t psc)
{
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);

    /* PA6为TIM3_CH1，复用推挽输出 */
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_TimeBaseStructure.TIM_Period = arr;
    TIM_TimeBaseStructure.TIM_Prescaler = psc;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(TIM3, &TIM_TimeBaseStructure);

    /* PWM模式1配置 */
    TIM_OCInitTypeDef TIM_OCInitStructure;
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 0;
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC1Init(TIM3, &TIM_OCInitStructure);

    TIM_Cmd(TIM3, ENABLE);
}

/* 设置占空比：0 ~ arr */
void TIM3_SetCompare1(uint16_t compare)
{
    TIM_SetCompare1(TIM3, compare);
}
</pre>
        `,
      },
      {
        title: "寄存器速查表",
        content: `
          <table class="cheatsheet-table">
            <tr><th>寄存器</th><th>功能</th><th>说明</th></tr>
            <tr><td><code>TIM_CR1</code></td><td>控制寄存器1</td><td>CEN使能、DIR方向、ARPE预装载等</td></tr>
            <tr><td><code>TIM_SMCR</code></td><td>从模式控制</td><td>编码器、门控、触发从模式等</td></tr>
            <tr><td><code>TIM_DIER</code></td><td>DMA/中断使能</td><td>各种中断和DMA使能位</td></tr>
            <tr><td><code>TIM_SR</code></td><td>状态寄存器</td><td>各种中断标志位</td></tr>
            <tr><td><code>TIM_CNT</code></td><td>计数器</td><td>当前计数值</td></tr>
            <tr><td><code>TIM_PSC</code></td><td>预分频器</td><td>时钟预分频系数</td></tr>
            <tr><td><code>TIM_ARR</code></td><td>自动重装载</td><td>计数周期值</td></tr>
            <tr><td><code>TIM_CCRx</code></td><td>捕获/比较</td><td>各通道比较值/捕获值</td></tr>
          </table>
        `,
      },
      {
        title: "常见问题",
        content: `
          <h4>Q: 定时器频率怎么算？</h4>
          <p>A: 溢出频率 = 定时器时钟 / (PSC+1) / (ARR+1)。注意APB1定时器时钟是PCLK1的2倍（当PPRE1≠1时）。</p>
          <h4>Q: PWM模式1和模式2区别？</h4>
          <p>A: 模式1：CNT&lt;CCR时有效；模式2：CNT&gt;CCR时有效。两者是互补的。</p>
          <h4>Q: ARPE预装载有什么用？</h4>
          <p>A: 开启后ARR值在更新事件才生效，避免计数过程中改变ARR导致异常。</p>
        `,
      },
    ],
  },
  exti: {
    name: "EXTI",
    icon: "🚨",
    title: "外部中断/事件 (EXTI)",
    desc: "EXTI用于检测GPIO引脚的电平变化，触发中断或事件，实现按键唤醒、脉冲计数等功能。",
    sections: [
      {
        title: "基本概念",
        content: `
          <h4>EXTI特点</h4>
          <ul>
            <li><strong>19个中断/事件线</strong>：16个GPIO + 3个内部信号</li>
            <li><strong>独立触发配置</strong>：每根线可单独配置上升沿/下降沿/双边沿</li>
            <li><strong>软件触发</strong>：可以通过软件寄存器主动触发</li>
            <li><strong>状态标志</strong>：每根线都有独立的挂起标志</li>
          </ul>
          <h4>GPIO与EXTI映射</h4>
          <ul>
            <li>PA0/PB0/PC0... → EXTI0</li>
            <li>PA1/PB1/PC1... → EXTI1</li>
            <li>...以此类推</li>
            <li>同一时刻，同一EXTI线只能映射到一个端口</li>
            <li>由AFIO_EXTICR寄存器选择具体端口</li>
          </ul>
        `,
      },
      {
        title: "代码示例",
        content: `
          <h4>外部中断初始化（按键为例）</h4>
<pre>
void EXTI_Key_Init(void)
{
    /* 使能时钟 */
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA |
        RCC_APB2Periph_AFIO, ENABLE);

    /* PA0上拉输入 */
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    /* 映射EXTI0到PA0 */
    GPIO_EXTILineConfig(GPIO_PortSourceGPIOA,
        GPIO_PinSource0);

    /* EXTI配置 - 下降沿触发 */
    EXTI_InitTypeDef EXTI_InitStructure;
    EXTI_InitStructure.EXTI_Line = EXTI_Line0;
    EXTI_InitStructure.EXTI_Mode = EXTI_Mode_Interrupt;
    EXTI_InitStructure.EXTI_Trigger = EXTI_Trigger_Falling;
    EXTI_InitStructure.EXTI_LineCmd = ENABLE;
    EXTI_Init(&EXTI_InitStructure);

    /* NVIC配置 */
    NVIC_InitTypeDef NVIC_InitStructure;
    NVIC_InitStructure.NVIC_IRQChannel = EXTI0_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 2;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 2;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
}
</pre>
          <h4>中断服务函数</h4>
<pre>
/* 注意：函数名必须与启动文件中一致 */
void EXTI0_IRQHandler(void)
{
    if (EXTI_GetITStatus(EXTI_Line0) != RESET)
    {
        /* 中断处理代码 */
        // 翻转LED、发送数据等...

        /* 必须清除中断标志！ */
        EXTI_ClearITPendingBit(EXTI_Line0);
    }
}
</pre>
        `,
      },
      {
        title: "寄存器速查表",
        content: `
          <table class="cheatsheet-table">
            <tr><th>寄存器</th><th>功能</th><th>说明</th></tr>
            <tr><td><code>EXTI_IMR</code></td><td>中断屏蔽</td><td>使能/禁用对应线的中断</td></tr>
            <tr><td><code>EXTI_EMR</code></td><td>事件屏蔽</td><td>使能/禁用对应线的事件</td></tr>
            <tr><td><code>EXTI_RTSR</code></td><td>上升沿触发</td><td>配置上升沿触发</td></tr>
            <tr><td><code>EXTI_FTSR</code></td><td>下降沿触发</td><td>配置下降沿触发</td></tr>
            <tr><td><code>EXTI_SWIER</code></td><td>软件中断</td><td>写1软件触发中断</td></tr>
            <tr><td><code>EXTI_PR</code></td><td>挂起寄存器</td><td>中断标志，写1清除</td></tr>
          </table>
        `,
      },
      {
        title: "常见问题",
        content: `
          <h4>Q: 中断进不去？</h4>
          <p>A: 检查：1. GPIO时钟和AFIO时钟都使能了吗？2. NVIC中断使能了吗？3. 触发方式对吗？4. 函数名对吗？</p>
          <h4>Q: 中断一直在进？</h4>
          <p>A: 通常是因为没有清除中断标志位。在中断服务函数最后一定要调用EXTI_ClearITPendingBit()。</p>
          <h4>Q: 按键需要消抖吗？</h4>
          <p>A: 需要。机械按键有抖动，建议用定时器延时消抖，或在中断里加延时后再判断一次。</p>
        `,
      },
    ],
  },
};

/** 当前选中的外设 */
let currentPeripheral = "gpio";

/**
 * 选择并显示外设知识
 * @param {string} periKey - 外设标识符
 */
function selectPeripheral(periKey) {
  if (!peripheralData[periKey]) return;

  currentPeripheral = periKey;

  /* 更新左侧选中状态 */
  document.querySelectorAll(".peripheral-item").forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.peri === periKey) item.classList.add("active");
  });

  const peri = peripheralData[periKey];
  const contentEl = document.getElementById("peripheralContent");

  /* 生成章节内容 */
  let sectionsHtml = "";
  peri.sections.forEach((section, idx) => {
    sectionsHtml += `
      <div class="peri-section">
        <div class="peri-section-header" onclick="togglePeriSection(this)">
          <span class="peri-section-icon">${idx === 0 ? "📖" : "📌"}</span>
          <span class="peri-section-title">${section.title}</span>
          <span style="margin-left:auto;transition:transform 0.3s;" class="peri-arrow">&#9660;</span>
        </div>
        <div class="peri-section-body">${section.content}</div>
      </div>
    `;
  });

  contentEl.innerHTML = `
    <div class="peri-hero">
      <h1>${peri.icon} ${peri.title}</h1>
      <p>${peri.desc}</p>
    </div>
    ${sectionsHtml}
  `;

  /* 默认展开第一个章节 */
  const firstSection = contentEl.querySelector(".peri-section");
  if (firstSection) {
    const body = firstSection.querySelector(".peri-section-body");
    const arrow = firstSection.querySelector(".peri-arrow");
    body.style.display = "block";
    arrow.style.transform = "rotate(180deg)";
  }
}

/**
 * 切换外设章节展开/收起
 * @param {HTMLElement} headerEl - 章节头部元素
 */
function togglePeriSection(headerEl) {
  const body = headerEl.nextElementSibling;
  const arrow = headerEl.querySelector(".peri-arrow");

  if (body.style.display === "none" || !body.style.display) {
    body.style.display = "block";
    arrow.style.transform = "rotate(180deg)";
  } else {
    body.style.display = "none";
    arrow.style.transform = "rotate(0deg)";
  }
}

/**
 * 过滤外设列表（搜索）
 */
function filterPeripherals() {
  const keyword = document
    .getElementById("peripheralSearch")
    .value.trim()
    .toLowerCase();
  const items = document.querySelectorAll(".peripheral-item");

  items.forEach((item) => {
    const name = item.textContent.toLowerCase();
    if (name.includes(keyword)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

/* ==========================
 *  模块9：代码风格审查
 * ========================== */

/** 预置示例代码 */
const styleExampleCode = `#include "stm32f10x.h"

int x;  // 全局变量

void init(void) {
    RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;
    GPIOA->CRL &= ~(0xF << 20);
    GPIOA->CRL |= (0x3 << 20);
}

void delay(int d) {
    for (int i = 0; i < d; i++);
}

int main(void) {
    init();
    while (1) {
        GPIOA->ODR ^= (1 << 5);
        delay(500000);
    }
}`;

/** 审查规则数据 */
const styleReviewRules = [
  {
    severity: "warn",
    title: "全局变量命名不规范",
    line: "第3行 int x",
    body: "全局变量 <code>x</code> 命名过于简单，无法表达其用途。建议使用有意义的名称，如 <code>g_ledState</code> 或 <code>g_systemTick</code>，并加 <code>g_</code> 前缀标识全局变量。",
  },
  {
    severity: "warn",
    title: "函数名 init 缺乏描述性",
    line: "第5行 void init(void)",
    body: "<code>init()</code> 无法区分是初始化什么外设。建议改为 <code>LED_GPIO_Init()</code> 或 <code>BSP_LED_Init()</code>，体现具体功能。",
  },
  {
    severity: "error",
    title: "delay() 参数无类型检查",
    line: "第12行 void delay(int d)",
    body: "<code>int</code> 可能为负数导致死循环。建议：<code>void delay_ms(uint32_t ms)</code>，使用无符号整型避免负值，并在函数名中体现单位。",
  },
  {
    severity: "warn",
    title: "缺少关键注释",
    line: "第5-10行",
    body: "函数没有注释说明功能、参数、返回值。建议添加函数头注释：<code>/** @brief 初始化LED对应的GPIO */</code> 等。",
  },
  {
    severity: "info",
    title: "延时实现不够精确",
    line: "第12-14行",
    body: "空循环延时受编译器优化等级影响大。建议使用 <code>SysTick</code> 定时器或 <code>HAL_Delay()</code> 实现精确延时。",
  },
  {
    severity: "error",
    title: "主循环无喂狗机制",
    line: "第17行 while(1)",
    body: "如果启用了看门狗但主循环未喂狗，延时过长可能触发看门狗复位。建议在循环中添加 <code>IWDG_ReloadCounter()</code> 调用。",
  },
  {
    severity: "good",
    title: "GPIO配置正确",
    line: "第7-9行",
    body: "正确使能了GPIOA时钟，并配置PA5为推挽输出模式，这是控制LED的标准做法。",
  },
];

/**
 * 加载代码风格审查示例代码
 */
function loadStyleExample() {
  document.getElementById("styleCodeInput").value = styleExampleCode;
}

/**
 * 启动AI代码风格审查
 */
function startStyleReview() {
  const code = document.getElementById("styleCodeInput").value.trim();
  if (!code) {
    alert("请先粘贴代码！");
    return;
  }

  const btn = document.getElementById("reviewBtn");
  const statusEl = document.getElementById("styleStatus");
  const loadingBar = document.getElementById("styleLoadingBar");
  const resultArea = document.getElementById("styleResultArea");

  btn.disabled = true;
  statusEl.textContent = "AI正在审查代码...";
  loadingBar.classList.add("active");
  loadingBar.querySelector(".loading-bar-inner").style.animation = "none";
  loadingBar.querySelector(".loading-bar-inner").offsetHeight;
  loadingBar.querySelector(".loading-bar-inner").style.animation =
    "loadingProgress 2s ease-in-out";

  resultArea.innerHTML = "";

  setTimeout(() => {
    /* 评分卡片 */
    const errorCount = styleReviewRules.filter(
      (r) => r.severity === "error",
    ).length;
    const warnCount = styleReviewRules.filter(
      (r) => r.severity === "warn",
    ).length;
    const score = Math.max(40, 95 - errorCount * 15 - warnCount * 8);
    const grade =
      score >= 85
        ? "A (优秀)"
        : score >= 70
          ? "B (良好)"
          : score >= 60
            ? "C (合格)"
            : "D (需改进)";

    let html = `<div class="review-score">
            <div class="score-big">${score}<span style="font-size:1rem;color:var(--text-muted);">/100</span></div>
            <div class="score-grade">${grade}<br><span style="font-size:0.75rem;color:var(--text-muted);">${errorCount}个错误 · ${warnCount}个警告</span></div>
          </div>`;

    styleReviewRules.forEach((rule) => {
      const icons = {
        error: "&#x274C;",
        warn: "&#x26A0;&#xFE0F;",
        info: "&#x2139;&#xFE0F;",
        good: "&#x2705;",
      };
      html += `<div class="review-item">
              <div class="review-item-header">
                <span class="review-severity severity-${rule.severity}">${rule.severity.toUpperCase()}</span>
                <span style="font-weight:600;font-size:0.82rem;">${rule.title}</span>
                <span class="review-line">${rule.line}</span>
              </div>
              <div class="review-body">${rule.body}</div>
            </div>`;
    });

    resultArea.innerHTML = html;
    loadingBar.classList.remove("active");
    statusEl.textContent = `审查完成 · 得分 ${score}/100`;
    btn.disabled = false;
  }, 2000);
}

/* ==========================
 *  模块10：FreeRTOS任务分析
 * ========================== */

/** 预置RTOS示例代码 */
const rtosExampleCode = `#include "FreeRTOS.h"
#include "task.h"

TaskHandle_t task1Handle, task2Handle, task3Handle;

void vTask1(void *pv) {
    while (1) {
        // 传感器采集
        readSensor();
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void vTask2(void *pv) {
    while (1) {
        // LCD显示 - 高优先级
        updateDisplay();
        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

void vTask3(void *pv) {
    while (1) {
        // 网络通信
        sendNetworkData();
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

int main(void) {
    xTaskCreate(vTask1, "Task1", 128, NULL, 1, &task1Handle);
    xTaskCreate(vTask2, "Task2", 256, NULL, 3, &task2Handle);
    xTaskCreate(vTask3, "Task3", 512, NULL, 1, &task3Handle);
    vTaskStartScheduler();
    while (1);
}`;

/** RTOS分析数据 */
const rtosAnalysisData = {
  tasks: [
    {
      name: "vTask1 (传感器采集)",
      priority: 1,
      stack: 128,
      period: "100ms",
      desc: "周期性读取传感器数据。优先级低，栈较小(128 word = 512 byte)。",
    },
    {
      name: "vTask2 (LCD显示)",
      priority: 3,
      stack: 256,
      period: "50ms",
      desc: "更新LCD显示。最高优先级，栈较大。若显示内容多需注意栈溢出。",
    },
    {
      name: "vTask3 (网络通信)",
      priority: 1,
      stack: 512,
      period: "1000ms",
      desc: "发送网络数据。优先级低但栈最大，网络协议栈可能需要较大空间。",
    },
  ],
  risks: [
    {
      level: "high",
      title: "Task1 和 Task3 优先级相同 — 竞争风险",
      desc: "两个任务优先级都是1，同时就绪时由时间片轮转调度。若 readSensor() 执行时间过长会延迟网络发送。建议网络任务设为优先级2，或使用队列解耦。",
    },
    {
      level: "medium",
      title: "Task2 栈大小可能不足",
      desc: "LCD显示任务栈256 word (1KB)，若使用printf或浮点运算可能不足。建议开启 <code>configCHECK_FOR_STACK_OVERFLOW</code> 并适当增大栈。",
    },
    {
      level: "medium",
      title: "缺少任务间同步机制",
      desc: "三个任务独立运行，若 Task1 采集的数据需要传给 Task2 显示，需要使用队列(Queue)或信号量(Semaphore)进行同步，否则可能出现数据竞争。",
    },
    {
      level: "low",
      title: "主循环未处理空闲任务",
      desc: "<code>while(1);</code> 是冗余的，调度器启动后正常不会返回。建议添加错误处理：<code>while(1) { /* 调度器启动失败 */ }</code> 并在前面加日志输出。",
    },
  ],
};

/**
 * 加载RTOS示例代码
 */
function loadRtosExample() {
  document.getElementById("rtosCodeInput").value = rtosExampleCode;
}

/**
 * 启动RTOS代码分析
 */
function startRtosAnalysis() {
  const code = document.getElementById("rtosCodeInput").value.trim();
  if (!code) {
    alert("请先粘贴RTOS代码！");
    return;
  }

  const btn = document.getElementById("rtosBtn");
  const statusEl = document.getElementById("rtosStatus");
  const loadingBar = document.getElementById("rtosLoadingBar");
  const resultArea = document.getElementById("rtosResultArea");

  btn.disabled = true;
  statusEl.textContent = "AI正在分析任务...";
  loadingBar.classList.add("active");
  loadingBar.querySelector(".loading-bar-inner").style.animation = "none";
  loadingBar.querySelector(".loading-bar-inner").offsetHeight;
  loadingBar.querySelector(".loading-bar-inner").style.animation =
    "loadingProgress 2s ease-in-out";

  resultArea.innerHTML = "";

  setTimeout(() => {
    let html = "";

    /* 优先级可视化 */
    html += `<div class="priority-viz">
            <div style="font-size:0.85rem;font-weight:600;margin-bottom:6px;color:var(--text-primary);">&#x1F4CA; 任务优先级分布</div>`;
    rtosAnalysisData.tasks.forEach((t) => {
      const widthPct = (t.priority / 5) * 100;
      const color =
        t.priority >= 3 ? "#ff5252" : t.priority >= 2 ? "#ffab40" : "#00ff88";
      html += `<div class="priority-bar">
              <span style="width:140px;font-family:var(--font-mono);font-size:0.75rem;">${t.name.split(" ")[0]}</span>
              <div class="priority-bar-track"><div class="priority-bar-fill" style="width:${widthPct}%;background:${color};"></div></div>
              <span style="color:${color};font-weight:600;">P${t.priority}</span>
            </div>`;
    });
    html += `</div>`;

    /* 任务详情 */
    rtosAnalysisData.tasks.forEach((t) => {
      html += `<div class="task-card">
              <div class="task-header">
                <span class="task-name">${t.name}</span>
                <span class="task-prio">P${t.priority}</span>
                <span class="task-stack">栈: ${t.stack} word | 周期: ${t.period}</span>
              </div>
              <div class="task-body">${t.desc}</div>
            </div>`;
    });

    /* 风险列表 */
    const riskIcons = {
      high: "&#x1F534;",
      medium: "&#x1F7E0;",
      low: "&#x1F7E2;",
    };
    html += `<div style="font-size:0.85rem;font-weight:600;margin-top:8px;color:var(--text-primary);">&#x26A0;&#xFE0F; 风险分析报告</div>`;
    rtosAnalysisData.risks.forEach((risk) => {
      html += `<div class="rtos-risk-item risk-level-${risk.level}">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span>${riskIcons[risk.level]}</span>
                <span style="font-weight:600;font-size:0.82rem;">${risk.title}</span>
              </div>
              <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">${risk.desc}</div>
            </div>`;
    });

    resultArea.innerHTML = html;
    loadingBar.classList.remove("active");
    statusEl.textContent = "分析完成 · 3个任务 / 4个风险";
    btn.disabled = false;
  }, 2000);
}

/* ==========================
 *  模块11：代码对比分析
 * ========================== */

/** 预置代码对比示例 */
const diffExampleData = {
  oldCode: `void GPIO_Init(void) {
    GPIOA->CRL &= ~(0xF << 20);
    GPIOA->CRL |= (0x3 << 20);
    GPIOA->ODR &= ~(1 << 5);
}

int main(void) {
    GPIO_Init();
    while (1) {
        GPIOA->ODR ^= (1 << 5);
        delay(500000);
    }
}`,
  newCode: `void GPIO_Init(void) {
    // 使能GPIOA时钟 - 必须先做！
    RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;

    // PA5推挽输出50MHz
    GPIOA->CRL &= ~(0xF << 20);
    GPIOA->CRL |= (0x3 << 20);
    GPIOA->ODR &= ~(1 << 5);
}

int main(void) {
    GPIO_Init();
    while (1) {
        GPIOA->ODR ^= (1 << 5);
        delay_ms(500);
    }
}`,
  explanations: [
    {
      line: "第3行（新增）",
      title: "添加了RCC时钟使能",
      desc: "Bug版本完全缺失了 <code>RCC->APB2ENR |= RCC_APB2ENR_IOPAEN</code> 这行关键代码。STM32复位后所有外设时钟默认关闭，不使能时钟GPIO寄存器写入完全无效，LED不会亮。",
    },
    {
      line: "第5-6行（新增注释）",
      title: "添加了功能注释",
      desc: "修复版添加了注释说明每步的作用。注释虽然不影响运行，但对代码可维护性至关重要，特别是寄存器操作这种不直观的代码。",
    },
    {
      line: "第13行 delay → delay_ms",
      title: "延时函数改名",
      desc: "<code>delay(500000)</code> 无法体现延时单位。改为 <code>delay_ms(500)</code> 后明确表示延时500毫秒，参数值更小也更易读。",
    },
  ],
};

/**
 * 加载代码对比示例
 */
function loadDiffExample() {
  document.getElementById("diffCodeOld").value = diffExampleData.oldCode;
  document.getElementById("diffCodeNew").value = diffExampleData.newCode;
}

/**
 * 启动代码对比分析
 */
function startDiffAnalysis() {
  const oldCode = document.getElementById("diffCodeOld").value.trim();
  const newCode = document.getElementById("diffCodeNew").value.trim();

  if (!oldCode || !newCode) {
    alert("请粘贴两段代码！");
    return;
  }

  const btn = document.getElementById("diffBtn");
  btn.disabled = true;

  const resultEl = document.getElementById("diffResult");
  const explanationEl = document.getElementById("diffExplanation");
  const explanationList = document.getElementById("diffExplanationList");

  resultEl.style.display = "block";
  explanationEl.style.display = "block";

  /* 简易diff：按行比较 */
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  let html = "";
  let i = 0;

  while (i < oldLines.length || i < newLines.length) {
    const oldLine = i < oldLines.length ? oldLines[i] : "";
    const newLine = i < newLines.length ? newLines[i] : "";

    if (oldLine === newLine) {
      html += `<div class="diff-line diff-line-unchanged">
              <span class="diff-line-num">${i + 1}</span>
              <span class="diff-line-sign"> </span>
              <span class="diff-line-content">${escapeHtml(oldLine)}</span>
            </div>`;
    } else {
      if (oldLine) {
        html += `<div class="diff-line diff-line-removed">
                <span class="diff-line-num">${i + 1}</span>
                <span class="diff-line-sign removed">-</span>
                <span class="diff-line-content">${escapeHtml(oldLine)}</span>
              </div>`;
      }
      if (newLine) {
        html += `<div class="diff-line diff-line-added">
                <span class="diff-line-num">${i + 1}</span>
                <span class="diff-line-sign added">+</span>
                <span class="diff-line-content">${escapeHtml(newLine)}</span>
              </div>`;
      }
    }
    i++;
  }

  resultEl.innerHTML = html;

  /* 渲染修复解释 */
  let expHtml = "";
  diffExampleData.explanations.forEach((exp) => {
    expHtml += `<div class="diff-explanation-item">
            <strong style="color:var(--accent-green);">${exp.line}</strong> — <strong>${exp.title}</strong><br>
            ${exp.desc}
          </div>`;
  });
  explanationList.innerHTML = expHtml;

  btn.disabled = false;
}

/**
 * HTML转义
 * @param {string} text - 原始文本
 * @returns {string} 转义后的HTML
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ==========================
 *  模块12：知识测验
 * ========================== */

/** 测验题库 */
const quizQuestions = {
  easy: [
    {
      topic: "GPIO基础",
      q: "STM32的GPIO引脚要正常工作，第一步必须做什么？",
      options: [
        "配置GPIO模式",
        "使能GPIO时钟",
        "设置GPIO速度",
        "配置上下拉电阻",
      ],
      answer: 1,
      explanation:
        "STM32所有外设复位后时钟默认关闭。必须先在 RCC->APB2ENR 中使能对应GPIO端口时钟，否则后续寄存器配置完全无效。",
    },
    {
      topic: "延时函数",
      q: "为什么嵌入式开发中不推荐使用空循环delay延时？",
      options: [
        "代码不够美观",
        "占用CPU且不精确",
        "编译器会优化掉",
        "会触发看门狗",
      ],
      answer: 1,
      explanation:
        "空循环延时期间CPU被完全占用无法执行其他任务，且延时时间受编译器优化等级、主频波动等影响，不精确。推荐使用硬件定时器(SysTick/TIM)实现精确延时。",
    },
    {
      topic: "LED控制",
      q: "用GPIO控制LED亮灭，应将引脚配置为哪种模式？",
      options: ["浮空输入", "模拟输入", "推挽输出", "开漏输出"],
      answer: 2,
      explanation:
        "推挽输出可以主动输出高低电平驱动LED，是最常用的LED控制模式。开漏输出只能拉低，高电平靠外部上拉电阻，一般用于I2C等总线。",
    },
    {
      topic: "上拉电阻",
      q: "按键一端接GND，另一端接GPIO输入。GPIO应配置为？",
      options: ["浮空输入", "上拉输入", "下拉输入", "模拟输入"],
      answer: 1,
      explanation:
        "按键接GND，按下时引脚被拉低。使用上拉输入，松开时默认高电平，按下变低电平。逻辑：1=松开，0=按下。若用下拉输入则默认低电平，按键无效果。",
    },
    {
      topic: "Arduino",
      q: "Arduino中 analogRead() 函数的返回值范围是？",
      options: ["0~255", "0~1023", "0~4095", "0~65535"],
      answer: 1,
      explanation:
        "Arduino UNO的ADC是10位精度，返回值范围0~1023，对应0~5V电压。STM32的ADC通常是12位，范围0~4095。",
    },
  ],
  medium: [
    {
      topic: "I2C协议",
      q: "I2C总线的SCL和SDA引脚必须配置为哪种GPIO模式？",
      options: ["推挽输出", "复用推挽输出", "复用开漏输出", "浮空输入"],
      answer: 2,
      explanation:
        "I2C总线要求线与逻辑，必须使用开漏输出+外部上拉电阻。复用开漏模式(AF_OD)让I2C外设控制引脚，同时保持开漏特性。推挽输出会导致总线冲突。",
    },
    {
      topic: "UART通信",
      q: "STM32和PC串口通信时，MCU的TX应连接USB-TTL的哪个引脚？",
      options: ["TX", "RX", "GND", "VCC"],
      answer: 1,
      explanation:
        "串口通信必须交叉连接：MCU的TX(发送)接USB-TTL的RX(接收)，MCU的RX(接收)接USB-TTL的TX(发送)。直连(TX-TX)会导致两个发送引脚冲突。",
    },
    {
      topic: "中断优先级",
      q: "STM32的NVIC中，抢占优先级和响应优先级有什么区别？",
      options: [
        "没有区别",
        "抢占可以打断正在执行的低优先级中断，响应仅决定同时触发时的执行顺序",
        "响应可以打断中断，抢占仅排序",
        "两者都决定执行顺序",
      ],
      answer: 1,
      explanation:
        "抢占优先级允许高优先级中断打断正在执行的低优先级中断(中断嵌套)。响应优先级仅在多个中断同时 pending 时决定先执行哪个，不能打断正在执行的中断。",
    },
    {
      topic: "ADC采样",
      q: "STM32 ADC采样时间设置较长的主要目的是？",
      options: [
        "提高采样速率",
        "降低功耗",
        "提高采样精度(高阻抗源)",
        "减少CPU占用",
      ],
      answer: 2,
      explanation:
        "采样时间需足够长以保证采样电容充分充电。信号源阻抗越高，需要的采样时间越长。采样时间不足会导致采样值偏小、不准确。",
    },
    {
      topic: "PWM配置",
      q: "PWM频率 = 定时器时钟 / (PSC+1) / (ARR+1)。若PCLK=72MHz，想要1kHz PWM，PSC=71，ARR应设为？",
      options: ["999", "1000", "72000", "72"],
      answer: 0,
      explanation:
        "PSC=71 → 计数频率 = 72MHz/(71+1) = 1MHz。ARR=999 → PWM频率 = 1MHz/(999+1) = 1kHz。注意公式中分母是 PSC+1 和 ARR+1，因为从0开始计数。",
    },
  ],
  hard: [
    {
      topic: "RTOS死锁",
      q: "以下哪种情况会导致FreeRTOS死锁？",
      options: [
        "任务优先级过高",
        "任务A持有信号量S1并请求S2，任务B持有S2并请求S1",
        "任务使用vTaskDelay",
        "任务栈过大",
      ],
      answer: 1,
      explanation:
        "经典死锁：两个任务互相等待对方持有的资源。预防方法：1)按固定顺序获取多个信号量 2)使用带超时的获取函数 3)避免在持有锁时调用阻塞API。",
    },
    {
      topic: "DMA",
      q: "使用ADC+DMA循环模式采集多通道数据，如何确保读到完整一帧数据？",
      options: [
        "直接读取数组",
        "使用DMA半传输中断和传输完成中断",
        "关闭DMA再读",
        "在ADC中断中读",
      ],
      answer: 1,
      explanation:
        "DMA在后台不断搬运数据，直接读取可能读到半更新状态。使用半传输(HT)中断和传输完成(TC)中断，在前半段读后半缓冲区，后半段读前半缓冲区，实现乒乓缓冲(Double Buffer)。",
    },
    {
      topic: "启动流程",
      q: "STM32从复位到进入main()函数之间，经历了什么？",
      options: [
        "直接跳转到main",
        "执行Bootloader → 设置SP → 初始化.data/.bss → 调用SystemInit → main",
        "初始化外设 → main",
        "加载RTOS → main",
      ],
      answer: 1,
      explanation:
        "启动文件(startup.s)首先设置栈指针SP，然后将.data段从Flash复制到RAM、清零.bss段，调用SystemInit()配置时钟，最后跳转到main()。理解这一流程对调试hardfault很有帮助。",
    },
    {
      topic: "低功耗",
      q: "STM32的Stop模式与Standby模式的主要区别是？",
      options: [
        "Stop功耗更低",
        "Stop保留RAM内容可快速唤醒，Standby丢失RAM但功耗最低",
        "两者完全相同",
        "Standby唤醒更快",
      ],
      answer: 1,
      explanation:
        "Stop模式：1.2V域时钟停止但寄存器/RAM保留，唤醒后从停止处继续执行，唤醒快(数μs)。Standby模式：内核断电，RAM内容丢失，唤醒相当于复位重启，但功耗最低(<1μA)。",
    },
    {
      topic: "HardFault",
      q: "程序跑飞进入HardFault，以下哪种方法最适合定位问题？",
      options: [
        "增加delay",
        "在HardFault_Handler中查看LR寄存器值并回溯调用栈",
        "更换芯片",
        "降低主频",
      ],
      answer: 1,
      explanation:
        "HardFault发生时，LR寄存器含有EXC_RETURN值，MSP/PSP指向的栈帧保存了出错时的PC、SP等寄存器值。通过调试器查看这些值可以定位到具体哪行代码导致的异常(如非法内存访问、除零等)。",
    },
  ],
};

let quizState = {
  difficulty: null,
  questions: [],
  currentIdx: 0,
  answers: [],
};

/**
 * 选择测验难度
 * @param {HTMLElement} card - 卡片元素
 */
function selectQuizDifficulty(card) {
  document
    .querySelectorAll(".quiz-card")
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
  quizState.difficulty = card.dataset.difficulty;
  document.getElementById("quizStartBtn").disabled = false;
}

/**
 * 开始测验
 */
function startQuiz() {
  if (!quizState.difficulty) return;

  quizState.questions = quizQuestions[quizState.difficulty];
  quizState.currentIdx = 0;
  quizState.answers = [];

  document.getElementById("quizStart").style.display = "none";
  document.getElementById("quizResult").classList.remove("visible");
  document.getElementById("quizResult").innerHTML = "";

  renderQuizQuestion();
}

/**
 * 渲染当前题目
 */
function renderQuizQuestion() {
  const q = quizState.questions[quizState.currentIdx];
  const total = quizState.questions.length;
  const questionEl = document.getElementById("quizQuestion");

  let optionsHtml = "";
  const letters = ["A", "B", "C", "D"];
  q.options.forEach((opt, idx) => {
    optionsHtml += `<div class="quiz-option" onclick="selectQuizAnswer(${idx})">
            <span class="quiz-option-letter">${letters[idx]}</span>
            <span>${opt}</span>
          </div>`;
  });

  questionEl.innerHTML = `
          <div class="quiz-q-header">
            <span class="quiz-q-num">第 ${quizState.currentIdx + 1} / ${total} 题</span>
            <span class="quiz-q-topic">${q.topic}</span>
          </div>
          <div class="quiz-q-text">${q.q}</div>
          <div class="quiz-options">${optionsHtml}</div>
          <div class="quiz-explanation" id="quizExplanation"></div>
          <div class="quiz-nav">
            <button class="action-btn" onclick="prevQuizQuestion()" ${quizState.currentIdx === 0 ? "disabled" : ""}>&#x2190; 上一题</button>
            <span style="font-size:0.78rem;color:var(--text-muted);" id="quizAnswered"></span>
            <button class="action-btn action-btn-primary" id="quizNextBtn" onclick="nextQuizQuestion()" style="display:none;">下一题 &#x2192;</button>
          </div>
        `;
  questionEl.classList.add("active");

  /* 恢复已选答案 */
  if (quizState.answers[quizState.currentIdx] !== undefined) {
    const selectedIdx = quizState.answers[quizState.currentIdx];
    const options = questionEl.querySelectorAll(".quiz-option");
    const correctIdx = q.answer;
    options.forEach((opt, idx) => {
      if (idx === correctIdx) opt.classList.add("correct");
      if (idx === selectedIdx && idx !== correctIdx) opt.classList.add("wrong");
    });
    document.getElementById("quizExplanation").innerHTML =
      `<strong>&#x1F4DD; 解析：</strong>${q.explanation}`;
    document.getElementById("quizExplanation").classList.add("visible");
    document.getElementById("quizNextBtn").style.display =
      quizState.currentIdx === total - 1 ? "none" : "inline-flex";
    if (quizState.currentIdx === total - 1) {
      showQuizResult();
    }
  }
}

/**
 * 选择答案
 * @param {number} idx - 选项索引
 */
function selectQuizAnswer(idx) {
  const q = quizState.questions[quizState.currentIdx];
  const options = document.querySelectorAll(".quiz-option");

  /* 如果已答过，不允许重新选择 */
  if (quizState.answers[quizState.currentIdx] !== undefined) return;

  quizState.answers[quizState.currentIdx] = idx;
  const correctIdx = q.answer;

  options.forEach((opt, i) => {
    opt.style.cursor = "default";
    if (i === correctIdx) opt.classList.add("correct");
    if (i === idx && i !== correctIdx) opt.classList.add("wrong");
  });

  document.getElementById("quizExplanation").innerHTML =
    `<strong>&#x1F4DD; 解析：</strong>${q.explanation}`;
  document.getElementById("quizExplanation").classList.add("visible");

  const isLast = quizState.currentIdx === quizState.questions.length - 1;
  if (isLast) {
    setTimeout(() => showQuizResult(), 1500);
  } else {
    document.getElementById("quizNextBtn").style.display = "inline-flex";
  }
}

/**
 * 下一题
 */
function nextQuizQuestion() {
  if (quizState.currentIdx < quizState.questions.length - 1) {
    quizState.currentIdx++;
    renderQuizQuestion();
  }
}

/**
 * 上一题
 */
function prevQuizQuestion() {
  if (quizState.currentIdx > 0) {
    quizState.currentIdx--;
    renderQuizQuestion();
  }
}

/**
 * 显示测验结果
 */
function showQuizResult() {
  const total = quizState.questions.length;
  let correct = 0;
  quizState.answers.forEach((ans, idx) => {
    if (ans === quizState.questions[idx].answer) correct++;
  });
  const score = Math.round((correct / total) * 100);
  const grade =
    score >= 90
      ? "S (大师级)"
      : score >= 80
        ? "A (优秀)"
        : score >= 70
          ? "B (良好)"
          : score >= 60
            ? "C (及格)"
            : "D (需努力)";

  const resultEl = document.getElementById("quizResult");
  resultEl.innerHTML = `
          <div class="quiz-result-score">${score}<span style="font-size:1.2rem;color:var(--text-muted);">分</span></div>
          <div class="quiz-result-grade">${grade}</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:20px;">
            答对 ${correct} / ${total} 题
          </div>
          <button class="generate-btn" onclick="resetQuiz()">&#x1F504; 重新测验</button>
        `;
  resultEl.classList.add("visible");
  document.getElementById("quizQuestion").classList.remove("active");
  resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * 重置测验
 */
function resetQuiz() {
  quizState = { difficulty: null, questions: [], currentIdx: 0, answers: [] };
  document.getElementById("quizStart").style.display = "block";
  document.getElementById("quizQuestion").classList.remove("active");
  document.getElementById("quizResult").classList.remove("visible");
  document
    .querySelectorAll(".quiz-card")
    .forEach((c) => c.classList.remove("selected"));
  document.getElementById("quizStartBtn").disabled = true;
}

/* ==========================
 *  页面初始化
 * ========================== */
window.addEventListener("DOMContentLoaded", () => {
  /* 默认加载第一个示例 */
  loadExample(0);

  /* 初始化外设知识库，默认显示GPIO */
  selectPeripheral("gpio");
});
