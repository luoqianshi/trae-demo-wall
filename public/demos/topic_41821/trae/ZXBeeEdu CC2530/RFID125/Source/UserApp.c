/*********************************************************************************************
* 文件：UserApp.c
* 作者：Zengwx 2015.2.3
* 说明：低频RFID传感器
*       变量A0表示卡号，V0表示主动上报时间间隔，D0(Bit0)表示主动上报使能
*       默认值：A0=0,V0=30,D0=1
* 修改：lixm 2016.10.27增加全局变量check_flag，串口接收回调函数根据此变量判断是否为读卡数据
* 注释：
*********************************************************************************************/

/*********************************************************************************************
* 头文件
*********************************************************************************************/
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "sapi.h"
#include "osal_nv.h"
#include "addrmgr.h"
#include "mt.h"
#include "hal_led.h"
#include "hal_adc.h"
#include "hal_uart.h"
#include "UserApp.h"
#ifdef SPI_LCD
#include "AppCommon.h"
#endif
/*********************************************************************************************
* 宏定义
*********************************************************************************************/

/*********************************************************************************************
* 全局变量
*********************************************************************************************/
static uint8 D0 = 1;                                            // 默认打开主动上报功能
static uint8 A0[16];                                            // A0存储卡号
static uint16 V0 = 30;                                          // V0设置为上报时间间隔，默认为30s
static uint16 myReportInterval = 30;                            // 上报时间间隔，seconds
static uint8 u8Buff[6];                                         // 存储读到的信息，前5个字节为卡号，最后一个字节为校验和
static unsigned char ucReadCardCMD = 0xaa;                      // 读卡指令
static uint8 u8Flag = 0;                                        // 标志

#ifdef SPI_LCD
static uint16 V1 = 1;                                           //V1设置LCD更新时间间隔，默认1s
static uint16 myLcdUpdateInterval = 1;                          //更新LCD时间间隔，seconds
unsigned char check_flag = 0;
#endif

/*********************************************************************************************
* 名称：sensor_init()
* 功能：传感器硬件初始化
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void sensor_init(void)
{
  // 初始化传感器代码
  MyUartInit();
  // 发送读卡指令
  HalUARTWrite(HAL_UART_PORT_0, &ucReadCardCMD, 1);

  // 启动定时器，触发事件：MY_REPORT_EVT
  osal_start_timerEx(sapi_TaskID, MY_REPORT_EVT, (uint16)((osal_rand()%10) * 1000));
  osal_start_timerEx(sapi_TaskID, MY_CHECK_EVT, (uint16)((osal_rand()%10) * 1000));

   #ifdef SPI_LCD
  osal_start_timerEx(sapi_TaskID, MY_LCD_EVT, (uint16)((osal_rand()%10) * 1000));
   #endif
}

/*********************************************************************************************
* 名称：updateV0()
* 功能：更新V0的值
* 参数：*val -- 待更新的变量
* 返回：V0 -- 返回更新后的V0值
* 修改：
* 注释：
*********************************************************************************************/
uint16 updateV0(char *val)
{
  // 将字符串变量val解析转换为整型变量赋值
  myReportInterval = atoi(val);
  V0 = myReportInterval;

  return V0;
}

 #ifdef SPI_LCD
/*********************************************************************************************
* 名称：updateV1()
* 功能：更新V1的值
* 参数：*val -- 待更新的变量
* 返回：V1 -- 返回更新后的V1值
* 修改：
* 注释：
*********************************************************************************************/
uint16 updateV1(char *val)
{
  // 将字符串变量val解析转换为整型变量赋值
  myLcdUpdateInterval = atoi(val);
  V1 = myLcdUpdateInterval;
	
  return V1;
}
#endif

/*********************************************************************************************
* 名称：updateA0()
* 功能：更新A0的值
* 参数：无
* 返回：A0 -- 返回更新后的A0值
* 修改：
* 注释：
*********************************************************************************************/
uint8 *updateA0(void)
{
  return A0;
}

/*********************************************************************************************
* 名称：sensor_update()
* 功能：处理主动上报的数据
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void sensor_update(void)
{
  uint16 cmd = 0;
  uint8 pData[128];
  uint8 *p = pData + 1;
  int len;

  // 根据D0的位状态判定需要主动上报的数值  
  if ((D0 & 0x01) == 0x01){                                     // 若报警值上报允许，则pData的数据包中添加报警值数据
    len = sprintf((char*)p, "A0=%s", A0);
    p += len;
    *p++ = ','; 
  }
  
  // 将需要上传的数据进行打包操作，并通过zb_SendDataRequest()发送到协调器
  if (p - pData > 1) {
    pData[0] = '{'; 
    p[0] = 0;
    p[-1] = '}';

    zb_SendDataRequest( 0, cmd, p-pData, pData, 0, AF_ACK_REQUEST, AF_DEFAULT_RADIUS );
    HalLedSet( HAL_LED_1, HAL_LED_MODE_BLINK );                 // 通信LED闪烁一次
  }
}

/*********************************************************************************************
* 名称：lcd_update()
* 功能：lcd更新数据
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void lcd_update(void)
{
  uint8 pData[128];
  uint8 *p = pData + 1;
  int len;
  check_flag = 1;
  // 根据D0的位状态判定需要主动上报的数值  
  if ((D0 & 0x01) == 0x01){                                     // 若报警值上报允许，则pData的数据包中添加报警值数据
    len = sprintf((char*)p, "A0=%s", A0);
    p += len;
    *p++ = ','; 
  }
  
  // 将需要上传的数据进行打包操作，并通过zb_SendDataRequest()发送到协调器
  if (p - pData > 1) {
    pData[0] = '{'; 
    p[0] = 0;
    p[-1] = '}';
   uart0_init();
   Uart0_Send_string((char*)pData,p-pData);
  }
  extern void CC2530_delay_ms(uint16 xms);
  CC2530_delay_ms(1);
  MyUartInit();
  check_flag = 0;
}

/*********************************************************************************************
* 名称：sensor_check()
* 功能：监测报警值
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void sensor_check(void)
{ 
  uint16 cmd = 0;
  uint8 pData[128];
  int len;
  
  if((D0 & 0x01) == 1){

    // 当监测到维持高电平状态，上报报警值A0=1
    if (u8Flag == 1) {
      sprintf(A0, "%02X%02X%02X%02X%02X", u8Buff[0], u8Buff[1], u8Buff[2], u8Buff[3], u8Buff[4]);	
      len = sprintf((char*)pData, "{A0=%s}", A0);
      zb_SendDataRequest(0, cmd, len, (uint8*)pData, 0, AF_ACK_REQUEST, AF_DEFAULT_RADIUS); // 发送数据到协调器
      HalLedSet(HAL_LED_1, HAL_LED_MODE_BLINK);               // 通信LED闪烁一次  
    } else {
      sprintf(A0, "%u", 0);
    }
    u8Flag = 0;
  }
}

/*********************************************************************************************
* 名称：usr_process_command_call()
* 功能：解析收到的控制命令
* 参数：*ptag -- 控制命令名称
*       *pval -- 控制命令参数
*       *pout -- 控制响应数据，将数据返回给上级调用，通过zb_SendDataRequest{}发送给协调器
* 返回：ret -- pout字符串长度
* 修改：
* 注释：
*********************************************************************************************/
int usr_process_command_call(char *ptag, char *pval, char *pout)
{ 
  int val;
  int ret = 0;

  // 将字符串变量pval解析转换为整型变量赋值
  val = atoi(pval);

  // 控制命令解析
  if (0 == strcmp("CD0", ptag)) { 
    D0 &= ~val;
  }
  if (0 == strcmp("OD0", ptag)) {
    D0 |= val;
  }
  if (0 == strcmp("D0", ptag)) { 
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "D0=%u", D0);
    } 
  }
  if (0 == strcmp("A0", ptag)) { 
    if (0 == strcmp("?", pval)) {
      updateA0();     
      ret = sprintf(pout, "A0=%s", A0);     
    } 
  }
  if (0 == strcmp("V0", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "V0=%u", V0);     
    }else{
      updateV0(pval);
    }
  }
  #ifdef SPI_LCD
  if (0 == strcmp("V1", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "V1=%u", V1);     
    }else{
      updateV1(pval);
    }
  }
  #endif
  
  return ret;
}

/*********************************************************************************************
* 名称：MyEventProcess()
* 功能：自定义事件处理
* 参数：event -- 事件编号
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void MyEventProcess( uint16 event )
{
  if (event & MY_REPORT_EVT) { 
    sensor_update(); 
    // 启动定时器，触发事件：MY_REPORT_EVT 
    osal_start_timerEx(sapi_TaskID, MY_REPORT_EVT, (uint16)(myReportInterval * 1000));
  }
  if (event & MY_CHECK_EVT) { 
    sensor_check(); 
    // 启动定时器，触发事件：MY_CHECK_EVT，定时查询报警值
    osal_start_timerEx(sapi_TaskID, MY_CHECK_EVT, 1000);
  }
   
  #ifdef SPI_LCD
  if (event & MY_LCD_EVT) { 
    lcd_update(); 
    // 启动定时器，触发事件：MY_REPORT_EVT 
    osal_start_timerEx(sapi_TaskID, MY_LCD_EVT, (uint16)(myLcdUpdateInterval * 1000));
  }  
  #endif
}

/*********************************************************************************************
* 名称：MyUartInit()
* 功能：串口初始化
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void MyUartInit(void)
{
  halUARTCfg_t uartConfig;
  
  //串口配置
  uartConfig.configured           = TRUE;
  uartConfig.baudRate             = HAL_UART_BR_9600;
  uartConfig.flowControl          = FALSE;
  uartConfig.rx.maxBufSize        = 128;
  uartConfig.tx.maxBufSize        = 128;
  uartConfig.flowControlThreshold = (128 / 2);
  uartConfig.idleTimeout          = 6;
  uartConfig.intEnable            = TRUE;
  uartConfig.callBackFunc         = MyUartCallBack;
  
  //打开串口
  HalUARTOpen (HAL_UART_PORT_0, &uartConfig);
}

/*********************************************************************************************
* 名称：MyUartCallBack()
* 功能：串口回调
* 参数：port - 端口
*       event - 事件，保留未用
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void MyUartCallBack ( uint8 port, uint8 event )
{
  (void)event;                                                  // 未使用，留作扩展
  uint8  ch;  
  static uint8  rlen = 0;
if(check_flag == 0)
{
  while (Hal_UART_RxBufLen(port))
  {
    HalUARTRead (port, &ch, 1);
    u8Buff[rlen++] = ch;
    if (rlen >= 6) 
    {
      rlen = 0;
    }
  }
}
  u8Flag =1;
}

