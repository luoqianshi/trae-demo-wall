/*********************************************************************************************
* 文件：UserApp.c
* 作者：Dengcy 2015.1.31
* 说明：红外遥控传感器驱动程序
*       通过配置串口来实现红外遥控
*       变量D1(Bit0)表示工作模式，V0表示主动上报时间间隔，V1表示键值，D0(Bit0)表示主动上报使能
*       默认值：D0=0,D1=1,V0=120,V1=0
* 修改：
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
* 全局变量
*********************************************************************************************/
static uint8 D0 = 1;                                            // 默认打开主动上报功能
static uint8 D1 = 0;                                            // 默认为遥控模式
static uint16 V0 = 120;                                         // V0设置为上报时间间隔，默认为120s
static uint8 V1 = 0;                                            // V1存储键值
static uint16 myReportInterval = 120;                           // 上报时间间隔，seconds

#ifdef SPI_LCD
static uint16 V2 = 1;                                           //V1设置LCD更新时间间隔，默认1s
static uint16 myLcdUpdateInterval = 1;                          //更新LCD时间间隔，seconds
#endif

/*********************************************************************************************
* 名称：NodeUartInit()
* 功能：串口配置
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void NodeUartInit(void)
{
  halUARTCfg_t uartConfig;
  
  uartConfig.configured           = TRUE;
  uartConfig.baudRate             = HAL_UART_BR_115200;
  uartConfig.flowControl          = FALSE;
  uartConfig.rx.maxBufSize        = 128;
  uartConfig.tx.maxBufSize        = 128;
  uartConfig.flowControlThreshold = (128 / 2);
  uartConfig.idleTimeout          = 6;
  uartConfig.intEnable            = TRUE;
  uartConfig.callBackFunc         = NULL;
  
  HalUARTOpen (HAL_UART_PORT_0, &uartConfig);
}

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
  //初始化传感器代码
  NodeUartInit();  
  
  // 启动定时器，触发事件：MY_REPORT_EVT
  osal_start_timerEx(sapi_TaskID, MY_REPORT_EVT, (uint16)((osal_rand()%10) * 1000));

   #ifdef SPI_LCD
  osal_start_timerEx(sapi_TaskID, MY_LCD_EVT, (uint16)((osal_rand()%10) * 1000));
   #endif
}

/*********************************************************************************************
* 名称：sensor_control()
* 功能：传感器控制
* 参数：cmd - 控制命令
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void sensor_control(uint8 cmd)
{
  uint8 key;
  
  if ((cmd & 0x01) == 0){
    key = V1;
    HalUARTWrite(HAL_UART_PORT_0, &key, 1);
  } else if ((cmd & 0x01) == 1){
    key = 0 - V1;
    HalUARTWrite(HAL_UART_PORT_0, &key, 1);
  }   
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

/************************************************************************
* 名称：updateV1
* 功能：设置V1的值
* 参数：待设置的V1值
* 返回：无
* 修改：
* 注释：
************************************************************************/
uint8 updateV1(char *val)
{
  V1 = atoi(val);  

  return V1;
}

 #ifdef SPI_LCD
/*********************************************************************************************
* 名称：updateV2()
* 功能：更新V2的值
* 参数：*val -- 待更新的变量
* 返回：V2 -- 返回更新后的V2值
* 修改：
* 注释：
*********************************************************************************************/
uint16 updateV2(char *val)
{
  // 将字符串变量val解析转换为整型变量赋值
  myLcdUpdateInterval = atoi(val);
  V2 = myLcdUpdateInterval;
	
  return V2;
}
#endif

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
  if ((D0 & 0x01) == 0x01){                                     // 若上报允许，则pData的数据包中添加遥控的工作模式
    len = sprintf((char*)p, "D1=%u", D1);
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
  
  // 根据D0的位状态判定需要主动上报的数值  
  if ((D0 & 0x01) == 0x01){                                     // 若上报允许，则pData的数据包中添加遥控的工作模式
    len = sprintf((char*)p, "D1=%u", D1);
    p += len;
    *p++ = ','; 
  }
  
  // 将需要上传的数据进行打包操作，并通过zb_SendDataRequest()发送到协调器
  if (p - pData > 1) {
    pData[0] = '{'; 
    p[0] = 0;
    p[-1] = '}';

    Uart0_Send_string((char*)pData,p-pData);
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
  if (0 == strcmp("CD1", ptag)) {
    D1 &= ~val;
    sensor_control(D1);
  }
  if (0 == strcmp("OD1", ptag)) {
    D1 |= val;
    sensor_control(D1);
  }
  if (0 == strcmp("D1", ptag)) { 
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "D1=%u", D1);
    } 
  }
  if (0 == strcmp("V0", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "V0=%u", V0);     
    }else{
      updateV0(pval);                                           //更新V0的值
    }
  }
  if (0 == strcmp("V1", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "V1=%u", V0);     
    }else{
      updateV1(pval);                                           //更新V1的值
    }
  }
    #ifdef SPI_LCD
  if (0 == strcmp("V2", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "V2=%u", V2);     
    }else{
      updateV2(pval);
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
     
  #ifdef SPI_LCD
  if (event & MY_LCD_EVT) { 
    lcd_update(); 
    // 启动定时器，触发事件：MY_REPORT_EVT 
    osal_start_timerEx(sapi_TaskID, MY_LCD_EVT, (uint16)(myLcdUpdateInterval * 1000));
  }  
  #endif
}