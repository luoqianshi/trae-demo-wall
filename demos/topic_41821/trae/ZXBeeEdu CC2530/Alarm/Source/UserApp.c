/*********************************************************************************************
* 文件：UserApp.c
* 作者：Zengwx 2015.1.22
* 说明：声光报警传感器驱动程序
*       通过P0_1，P1_3，P0_6,P0_5端口控制声光报警器灯的颜色（红，绿，蓝）和蜂鸣器，
*       变量D1表示声光报警状态，OD1/CD1进行控制，V0表示主动上报时间间隔
*       默认值：D1=0,V0=120
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
* 宏定义
*********************************************************************************************/
#define SENSOR_RED      P0_1
#define SENSOR_GREEN    P1_3
#define SENSOR_BLUE     P0_6
#define SENSOR_BUZZER   P0_5
#define SENSOR_SEL      P0SEL
#define SENSOR_DIR      P0DIR
#define CLKDIV  ( CLKCONCMD & 0x07 )

/*********************************************************************************************
* 全局变量
*********************************************************************************************/
static uint8 D0 = 1;                                            // 默认打开主动上报功能
static uint8 D1 = 0;                                            // Bit0表示声光报警状态,1报警，0不报警
static uint16 V0 = 120;                                         // V0设置为上报时间间隔，默认为120s
static uint16 myReportInterval = 120;                           // 上报时间间隔，seconds
static uint16 myAlarmDelay = 250;                               // 报警灯呼吸灯延时，毫秒
static uint8 Flag = 0; 

#ifdef SPI_LCD
static uint16 V1 = 1;                                           //V1设置LCD更新时间间隔，默认1s
static uint16 myLcdUpdateInterval = 1;                          //更新LCD时间间隔，seconds
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
  //初始化传感器代码
  P1SEL &= ~ BV(3);
  P1DIR |= BV(3); 
  
  SENSOR_SEL &= ~(BV(1) | BV(5) | BV(6));
  P0DIR |= BV(1) | BV(5) | BV(6);
  
  SENSOR_RED = 1;                                               // RGB_LDE中的红色,1灭,0亮
  SENSOR_GREEN = 1;                                             // RGB_LDE中的绿色,1灭,0亮
  SENSOR_BLUE = 1;                                              // RGB_LDE中的蓝色,1灭,0亮
  SENSOR_BUZZER = 0;                                            // 蜂鸣器，1开，0关

  // 启动定时器，触发事件：MY_REPORT_EVT、MY_OFF_EVT
  osal_start_timerEx(sapi_TaskID, MY_REPORT_EVT, (uint16)((osal_rand()%10) * 1000));
  osal_start_timerEx( sapi_TaskID, MY_ALARM_EVT,myAlarmDelay);  // 开启报警灯循环呼吸灯
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
  if ((D0 & 0x01) == 0x01){                                     // 若控制编码上报允许，则pData的数据包中添加控制编码数据
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
  if ((D0 & 0x01) == 0x01){                                     // 若控制编码上报允许，则pData的数据包中添加控制编码数据
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
  }
  if (0 == strcmp("OD1", ptag)) {
    D1 |= val;
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
    osal_start_timerEx( sapi_TaskID, MY_REPORT_EVT, (uint16)(myReportInterval * 1000));
  }
  
  // 报警灯正常态呼吸灯，绿灯每隔1s闪烁,蜂鸣器不响
  if ( event & MY_ALARM_EVT )
  {  
    if(!D1) {
      SENSOR_RED = 1;
      SENSOR_GREEN = Flag; 
      SENSOR_BLUE = 1; 
      SENSOR_BUZZER = 0;
    }else {
      SENSOR_RED = Flag; 
      SENSOR_GREEN = 1; 
      SENSOR_BLUE = 1; 
      SENSOR_BUZZER = Flag;	
    }
    Flag = !Flag;
    osal_start_timerEx( sapi_TaskID, MY_ALARM_EVT, 3 * !D1 * myAlarmDelay + myAlarmDelay);
  }
    
  #ifdef SPI_LCD
  if (event & MY_LCD_EVT) { 
    lcd_update(); 
    // 启动定时器，触发事件：MY_REPORT_EVT 
    osal_start_timerEx(sapi_TaskID, MY_LCD_EVT, (uint16)(myLcdUpdateInterval * 1000));
  }  
  #endif
}