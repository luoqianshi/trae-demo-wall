/*********************************************************************************************
* 文件：TCS3200.c
* 作者：Dengcy 2015.2.3
* 说明：颜色识别驱动程序
* 修改：
* 注释：
*********************************************************************************************/
/*********************************************************************************************
* 头文件
*********************************************************************************************/
#include <ioCC2530.h>
#include "hal_types.h"
#include "hal_mcu.h"
#include "color.h"

/*********************************************************************************************
* 全局变量
*********************************************************************************************/
unsigned char ucFlag = 0;
unsigned int ulCount = 0;

unsigned char ucFilter[3] = {TCS3200_FILTER_RED, TCS3200_FILTER_GREEN, TCS3200_FILTER_BLUE};

/*********************************************************************************************
* 名称：TCS3200Init()
* 功能：颜色识别传感器初始化
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void TCS3200Init(void)
{
  P0SEL &= ~0x50;
  P0DIR |= 0x50;
  P1SEL &= ~0x0B;
  P1DIR |= 0x0B;
  
  SENSOR_SEL &= ~(SENSOR_BIT);                        // Set pin function to GPIO
  SENSOR_DIR &= ~(SENSOR_BIT);                        // Set pin direction to Input
  P0INP &= ~0x20;                                     // 上拉  P0.5
  P2INP &= ~0x20;
  P0IEN |= 0x20;                                      // P0.5 设置为中断方式 
  PICTL |= 0x20;                                      // P0.5下降沿触发
  
  //
  //初始化计数器1
  //
  T1CCTL0  |= 0x04;
  
  T1CNTL = 0x00;
  T1CNTH = 0x00;
  
  T1CC0H = 0x28;                                      // 10ms
  T1CC0L = 0x00;
  
  IEN1 |= 0x02;                                       //定时器1中断使能
  IEN1 |= 0x20;                                       //P0中断使能
  EA = 1;                                             //开总中断
  
  TCS3200OutFrequencyScalingSet(TCS3200_SCALING_100);
}

void TCS3200FilterSet(unsigned int ulFilterSet)
{
  switch(ulFilterSet)
  {
    //
    // Red
    //
  case TCS3200_FILTER_RED:
    TCS3200_PIN_S2 = 0;
    TCS3200_PIN_S3 = 0;
    break;
    //
    // Green
    //
  case TCS3200_FILTER_GREEN:
    TCS3200_PIN_S2 = 1;
    TCS3200_PIN_S3 = 1;
    break;
    //
    // Blue
    //
  case TCS3200_FILTER_BLUE:
    TCS3200_PIN_S2 = 0;
    TCS3200_PIN_S3 = 1;
    break;
    //
    // None
    //
  case TCS3200_FILTER_NONE:
    TCS3200_PIN_S2 = 1;
    TCS3200_PIN_S3 = 0;
    break;
  }
}

void TCS3200OutFrequencyScalingSet(unsigned int ulScalingSet)
{
  switch(ulScalingSet)
  {
    //
    // Power Down
    //
  case TCS3200_SCALINF_DOWN:
    TCS3200_PIN_S0 = 0;
    TCS3200_PIN_S1 = 0;
    break;
    //
    // 2%
    //
  case TCS3200_SCALING_2:
    TCS3200_PIN_S0 = 0;
    TCS3200_PIN_S1 = 1;
    break;
    //
    // 20%
    //
  case TCS3200_SCALING_20:
    TCS3200_PIN_S0 = 1;
    TCS3200_PIN_S1 = 0;
    break;
    //
    // 100%
    //
  case TCS3200_SCALING_100:
    TCS3200_PIN_S0 = 1;
    TCS3200_PIN_S1 = 1;
    break;
  }
}

void baipingheng(int *ryz, int *gyz, int *byz)
{
  //获取三原色的R值
  TCS3200FilterSet(ucFilter[0]);
  TCS3200_PIN_OE = 0;
  IEN1 |= 0x20; 
  T1CTL = 0x0A;
  while(!ucFlag);
  T1CTL = 0x00;   
  IEN1 &= ~0x20;                                   
  *ryz = ulCount;
  
  ulCount = 0;
  ucFlag = 0;                                  
  
  //获取三原色的G值
  TCS3200FilterSet(ucFilter[1]);
  IEN1 |= 0x20; 
  T1CTL = 0x0A;
  while(!ucFlag);
  T1CTL = 0x00;    
  IEN1 &= ~0x20;                                   
  *gyz = ulCount;
  
  ulCount = 0;
  ucFlag = 0;
  
  //获取三原色的B值
  TCS3200FilterSet(ucFilter[2]);
  IEN1 |= 0x20; 
  T1CTL = 0x0A;
  while(!ucFlag);
  T1CTL = 0x00;  
  TCS3200_PIN_OE = 1;
  
  IEN1 &= ~0x20;                                   
  *byz = ulCount;
  
  ulCount = 0;
  ucFlag = 0; 
}


void get_rgb(int ryz, int gyz, int byz, int *rb, int *gb, int *bb)
{
  //获取三原色的R值
  TCS3200FilterSet(ucFilter[0]);
  TCS3200_PIN_OE = 0;
  IEN1 |= 0x20;
  T1CTL = 0x0A;
  while(!ucFlag);
  T1CTL = 0x00;   
  IEN1 &= ~0x20;
  
  *rb = (unsigned int)((float)ulCount/ryz*255);
  if (*rb > 255) *rb = 255;
  
  ulCount = 0;
  ucFlag = 0;
  
  //获取三原色的G值
  TCS3200FilterSet(ucFilter[1]);
  IEN1 |= 0x20; 
  T1CTL = 0x0A;
  while(!ucFlag);
  T1CTL = 0x00;
  IEN1 &= ~0x20;
  
  *gb = (unsigned int)((float)ulCount/gyz*255);
  if (*gb > 255) *gb = 255;
  
  ulCount = 0;
  ucFlag = 0;
  
  //获取三原色的B值
  TCS3200FilterSet(ucFilter[2]);
  IEN1 |= 0x20; 
  T1CTL = 0x0A;
  while(!ucFlag);
  T1CTL = 0x00;
  IEN1 &= ~0x20;
  TCS3200_PIN_OE = 1;
  
  *bb = (unsigned int)((float)ulCount/byz*255);
  if (*bb > 255) *bb = 255;
  
  ulCount = 0;
  ucFlag = 0;
}

/*中断服务子程序
-------------------------------------------------------*/
HAL_ISR_FUNCTION( P0_ISR, P0INT_VECTOR )
{
  HAL_ENTER_ISR();
  
  if((P0IFG & 0x20 ) >0 )       // p0_5
  {
    P0IFG &= ~0x20;               //P0.5中断标志清0
    ulCount++;                 
  }  
  
  P0IF = 0;                       //P0中断标志清0
  
  HAL_EXIT_ISR();
}

/*中断服务子程序
-------------------------------------------------------*/
HAL_ISR_FUNCTION( T1_ISR, T1_VECTOR )
{
  HAL_ENTER_ISR();
  
  if((T1STAT & 0x01 ) > 0 )       
  {
    T1STAT &= ~0x01;              
    ucFlag = 1;                
  }  
  
  T1IF = 0;                      
  
  HAL_EXIT_ISR();
}