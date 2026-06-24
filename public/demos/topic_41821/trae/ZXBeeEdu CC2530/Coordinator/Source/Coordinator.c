
/**************************************************************************************************
Filename:       Coordinator.c
Revised:        $Date: 2007-12-04 11:46:18 -0800 (Tue, 04 Dec 2007) $
Revision:       $Revision: 16007 $

Description:    Sample application utilizing the Simple API.


Copyright 2007 Texas Instruments Incorporated. All rights reserved.

IMPORTANT: Your use of this Software is limited to those specific rights
granted under the terms of a software license agreement between the user
who downloaded the software, his/her employer (which must be your employer)
and Texas Instruments Incorporated (the "License").  You may not use this
Software unless you agree to abide by the terms of the License. The License
limits your use, and you acknowledge, that the Software may not be modified,
copied or distributed unless embedded on a Texas Instruments microcontroller
or used solely and exclusively in conjunction with a Texas Instruments radio
frequency transceiver, which is integrated into your product.  Other than for
the foregoing purpose, you may not use, reproduce, copy, prepare derivative
works of, modify, distribute, perform, display or sell this Software and/or
its documentation for any purpose.

YOU FURTHER ACKNOWLEDGE AND AGREE THAT THE SOFTWARE AND DOCUMENTATION ARE
PROVIDED 揂S IS?WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF MERCHANTABILITY, TITLE, 
NON-INFRINGEMENT AND FITNESS FOR A PARTICULAR PURPOSE. IN NO EVENT SHALL
TEXAS INSTRUMENTS OR ITS LICENSORS BE LIABLE OR OBLIGATED UNDER CONTRACT,
NEGLIGENCE, STRICT LIABILITY, CONTRIBUTION, BREACH OF WARRANTY, OR OTHER
LEGAL EQUITABLE THEORY ANY DIRECT OR INDIRECT DAMAGES OR EXPENSES
INCLUDING BUT NOT LIMITED TO ANY INCIDENTAL, SPECIAL, INDIRECT, PUNITIVE
OR CONSEQUENTIAL DAMAGES, LOST PROFITS OR LOST DATA, COST OF PROCUREMENT
OF SUBSTITUTE GOODS, TECHNOLOGY, SERVICES, OR ANY CLAIMS BY THIRD PARTIES
(INCLUDING BUT NOT LIMITED TO ANY DEFENSE THEREOF), OR OTHER SIMILAR COSTS.

Should you have any questions regarding your right to use this Software,
contact Texas Instruments Incorporated at www.TI.com. 
**************************************************************************************************/

/******************************************************************************
* INCLUDES
*/

#include "ZComDef.h"
#include "OSAL.h"
#include "sapi.h"
#include "hal_key.h"
#include "hal_led.h"
#include "DebugTrace.h"
#include "SimpleApp.h"
#include "hal_flash.h"

#if defined( MT_TASK )
#include "osal_nv.h"
#endif
#include "mt_app.h"
#include "mt_uart.h"
#include "mt.h"
#include "rtg.h"
#include "mac_radio_defs.h"
#include "AddrMgr.h"
#include "nwk_util.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define USE_SYS_FIND_DEVICE   0
#define NODE_NAME  "000"
#define NODE_CATEGORY 1

#define OSAL_NV_PAGE_BEG        HAL_NV_PAGE_BEG
#define OSAL_NV_PAGE_END       (OSAL_NV_PAGE_BEG + HAL_NV_PAGE_CNT - 1)
/*********************************************************************
* CONSTANTS
*/

// Application States
#define APP_INIT                           0
#define APP_START                          1

// Application osal event identifiers
#define _START_EVT                0x0010
#define __REPORT_EVT               0x0020

// Same definitions as in SimpleSensor.c
#define TEMP_REPORT     0x01
#define BATTERY_REPORT  0x02
#define REPORT_DELAY    30
/*********************************************************************
* TYPEDEFS
*/

/*********************************************************************
* LOCAL VARIABLES
*/

static uint8 myAppState = APP_INIT;
static uint8 myStartRetryDelay = 10;

#if defined( MT_TASK )
extern uint8 aExtendedAddress[8];
#endif
static void my_report_proc(void);
static void process_set_command_call(int (*fun)(char *ptag, char *pval, char *pout));
static void process_package(char *pkg, int len);
static int process_command_callback(char *ptag, char *pval, char *pout);

void zb_HanderMsg(osal_event_hdr_t *pMsg);

static void processCommand(uint16 cmd, byte *dat, uint8 len);
void my_FindDevice(uint8 searchType, uint8 *searchKey);
int my_FindDeviceProc( uint16 source, uint16 command, uint16 len, uint8 *pData);
static char* read_al(char *buf, int len);
static char* read_nb(char *buf, int len);
static uint16 panid;
static uint8 logicalType;
static uint16 _tm_cnt, _tm_delay;

/*********************************************************************
* GLOBAL VARIABLES
*/

// Inputs and Outputs for Switch device
#define NUM_OUT_CMD_COLLECTOR                2
#define NUM_IN_CMD_COLLECTOR                 3

// List of output and input commands for Switch device
const cId_t zb_InCmdList[NUM_IN_CMD_COLLECTOR] =
{
  ID_CMD_READ_RES,
  ID_CMD_WRITE_RES,
  ID_CMD_REPORT,
};
const cId_t zb_OutCmdList[NUM_OUT_CMD_COLLECTOR] =
{
  ID_CMD_READ_REQ,
  ID_CMD_WRITE_REQ,
};

// Define SimpleDescriptor for Switch device
const SimpleDescriptionFormat_t zb_SimpleDesc =
{
  MY_ENDPOINT_ID,             //  Endpoint
  MY_PROFILE_ID,              //  Profile ID
  DEV_ID_COLLECTOR,           //  Device ID
  DEVICE_VERSION_COLLECTOR,   //  Device Version
  0,                          //  Reserved
  NUM_IN_CMD_COLLECTOR,       //  Number of Input Commands
  (cId_t *) zb_InCmdList,     //  Input Command List
  NUM_OUT_CMD_COLLECTOR,      //  Number of Output Commands
  (cId_t *) zb_OutCmdList     //  Output Command List
};

#define K4  P0_1
#define K5  P0_4
static void key_init(void);
static void key_init(void)
{
  /* P0.4 按键检测*/
  P0SEL &= ~0x12;        //通用IO    
  P0DIR &= ~0x12;        //作输入  
}
/******************************************************************************
* @fn          zb_HandleOsalEvent
*
* @brief       The zb_HandleOsalEvent function is called by the operating
*              system when a task event is set
*
* @param       event - Bitmask containing the events that have been set
*
* @return      none
*/
void zb_HandleOsalEvent( uint16 event )
{
  uint8 startOptions;
  
  
  if (event & ZB_ENTRY_EVENT) 
  {
    key_init();
    
    if ( K5 == 0  || K4 == 0) {
      /*
     
      extern void zgInitItems( uint8 setDefault );
      uint32 ch;
      osal_nv_read( ZCD_NV_PANID, 0, sizeof( panid ), &panid );
      osal_nv_read( ZCD_NV_CHANLIST, 0, sizeof( ch ), &ch );
      zgInitItems(TRUE); 
       uint8 pg;
      for ( pg = OSAL_NV_PAGE_BEG; pg <= OSAL_NV_PAGE_END; pg++ )
      {
        HalFlashErase(pg);
      }
      osal_nv_write( ZCD_NV_PANID, 0, sizeof( panid ), &panid );
      osal_nv_write( ZCD_NV_CHANLIST, 0, sizeof( ch ), &ch );
      */
      uint8 startOptions = ZCD_STARTOPT_DEFAULT_NETWORK_STATE;
      zb_WriteConfiguration( ZCD_NV_STARTUP_OPTION, sizeof(uint8), &startOptions ); //标记网络状态发生改变
   
      while (K5 == 0 || K4 == 0) {  
        HalLedSet( HAL_LED_1, HAL_LED_MODE_ON );
        HalLedSet( HAL_LED_2, HAL_LED_MODE_OFF );
        //HalLedSet( HAL_LED_1, HAL_LED_MODE_BLINK );
      }
      zb_SystemReset();
    }
    
    zb_ReadConfiguration( ZCD_NV_LOGICAL_TYPE, sizeof(uint8), &logicalType );
    if ( logicalType != ZG_DEVICETYPE_COORDINATOR )
    {
      logicalType = ZG_DEVICETYPE_COORDINATOR;
      zb_WriteConfiguration(ZCD_NV_LOGICAL_TYPE, sizeof(uint8), &logicalType);
    }
    zb_ReadConfiguration( ZCD_NV_STARTUP_OPTION, sizeof(uint8), &startOptions );
    if ((startOptions & ZCD_STARTOPT_AUTO_START) == 0) {
      zb_StartRequest();
    }
    osal_nv_read( ZCD_NV_PANID, 0, sizeof( panid ), &panid );
    HalLedSet( HAL_LED_2, HAL_LED_MODE_FLASH );
    process_set_command_call(process_command_callback);
 
  }
  
  if ( event & _START_EVT )
  {
    zb_StartRequest();
  } 
  if ( event & __REPORT_EVT) {
    if (_tm_cnt > 0) {
      my_report_proc();
      osal_start_timerEx( sapi_TaskID, __REPORT_EVT, _tm_delay * 1000);
      _tm_cnt --;
    }
  }
}

void zb_HanderMsg(osal_event_hdr_t *msg)
{
  mtSysAppMsg_t *pMsg = (mtSysAppMsg_t*)msg;
  
  uint16 dAddr;
  uint16 cmd;
  uint16 addr = NLME_GetShortAddr();
  
  HalLedSet( HAL_LED_1, HAL_LED_MODE_OFF );
  HalLedSet( HAL_LED_1, HAL_LED_MODE_BLINK );
  if (pMsg->hdr.event == MT_SYS_APP_MSG) {
    //if (pMsg->appDataLen < 4) return;
    dAddr = pMsg->appData[0]<<8 | pMsg->appData[1];
    cmd = pMsg->appData[2]<<8 | pMsg->appData[3];
    if (dAddr != 0) {
      zb_SendDataRequest(dAddr, cmd, pMsg->appDataLen-4, pMsg->appData+4, 0, AF_ACK_REQUEST, AF_DEFAULT_RADIUS );
    }
    if (dAddr == 0 || dAddr == 0xffff) {
      processCommand(cmd, pMsg->appData+4, pMsg->appDataLen-4);
    }
  }
}

/*********************************************************************
* @fn      zb_HandleKeys
*
* @brief   Handles all key events for this device.
*
* @param   shift - true if in shift/alt.
* @param   keys - bit field for key events. Valid entries:
*                 EVAL_SW4
*                 EVAL_SW3
*                 EVAL_SW2
*                 EVAL_SW1
*
* @return  none
*/
void zb_HandleKeys( uint8 shift, uint8 keys )
{
 
}
/******************************************************************************
* @fn          zb_StartConfirm
*
* @brief       The zb_StartConfirm callback is called by the ZigBee stack
*              after a start request operation completes
*
* @param       status - The status of the start operation.  Status of
*                       ZB_SUCCESS indicates the start operation completed
*                       successfully.  Else the status is an error code.
*
* @return      none
*/
void zb_StartConfirm( uint8 status )
{
  
  // If the device sucessfully started, change state to running
  if ( status == ZB_SUCCESS )
  {
    uint8 startOptions = ZCD_STARTOPT_AUTO_START;
    myAppState = APP_START;
    HalLedSet( HAL_LED_2, HAL_LED_MODE_ON );
    //zb_AllowBind(0xff);
    zb_WriteConfiguration( ZCD_NV_STARTUP_OPTION, sizeof(uint8), &startOptions );
    //osal_start_timerEx( sapi_TaskID, __REPORT_EVT, (osal_rand()%REPORT_DELAY) * 1000);
#ifdef AUTO_CLEARN
#include "OSAL_Nv.h"
 unsigned char success_counter = 0;
#define MAX_COUNTER    10                                       //最大组建网络次数
#define COUNTER_NV_ID  0x04FF                                   //条目ID
#define NV_INDEX       0                                        //条目索引
#define NV_LEN         1                                        //条目长度
osal_nv_item_init(COUNTER_NV_ID,NV_LEN,NULL);                   //初始化条目ID为COUNTER_NV_ID的条目，条目长度为NV_LEN，值为NULL
osal_nv_read(COUNTER_NV_ID,NV_INDEX,NV_LEN,&success_counter);
//如果正确组建网络MAX_COUNTER次
if(success_counter == MAX_COUNTER ){  
  unsigned char s_times = 0;
 osal_nv_write(COUNTER_NV_ID,NV_INDEX,NV_LEN,&s_times);         //成功组建网络次数清零
 uint8 startOptions = ZCD_STARTOPT_DEFAULT_NETWORK_STATE;       //标记网络状态发生改变
 zb_WriteConfiguration( ZCD_NV_STARTUP_OPTION, sizeof(uint8), &startOptions ); 
 zb_SystemReset();                                              //重启
}
//如果没到MAX_COUNTER次
else{
  if(success_counter == 0xFF ){                                 //第一次启动
    unsigned char s_times = 1;
    osal_nv_write(COUNTER_NV_ID,NV_INDEX,NV_LEN,&s_times);      //成功组建网络次数开始                  
  }else{
  success_counter+=1;
  osal_nv_write(COUNTER_NV_ID,NV_INDEX,NV_LEN,&success_counter);//成功组建网络次数加1;   
  }        
}   
#endif
  }
  else{
    // Try again later with a delay
    osal_start_timerEx( sapi_TaskID, _START_EVT, myStartRetryDelay * 1000);
  }
}
/******************************************************************************
* @fn          zb_SendDataConfirm
*
* @brief       The zb_SendDataConfirm callback function is called by the
*              ZigBee after a send data operation completes
*
* @param       handle - The handle identifying the data transmission.
*              status - The status of the operation.
*
* @return      none
*/
void zb_SendDataConfirm( uint8 handle, uint8 status )
{
}
/******************************************************************************
* @fn          zb_BindConfirm
*
* @brief       The zb_BindConfirm callback is called by the ZigBee stack
*              after a bind operation completes.
*
* @param       commandId - The command ID of the binding being confirmed.
*              status - The status of the bind operation.
*
* @return      none
*/
void zb_BindConfirm( uint16 commandId, uint8 status )
{
}
/******************************************************************************
* @fn          zb_AllowBindConfirm
*
* @brief       Indicates when another device attempted to bind to this device
*
* @param
*
* @return      none
*/
void zb_AllowBindConfirm( uint16 source )
{
}
/******************************************************************************
* @fn          zb_FindDeviceConfirm
*
* @brief       The zb_FindDeviceConfirm callback function is called by the
*              ZigBee stack when a find device operation completes.
*
* @param       searchType - The type of search that was performed.
*              searchKey - Value that the search was executed on.
*              result - The result of the search.
*
* @return      none
*/
void zb_FindDeviceConfirm( uint8 searchType, uint8 *searchKey, uint8 *result )
{
  byte res[Z_EXTADDR_LEN+2];
  
  if (ZB_IEEE_SEARCH == searchType) {           //通过mac地址寻找对应的节点
    osal_memcpy(res, searchKey, Z_EXTADDR_LEN);
    res[Z_EXTADDR_LEN] = result[1];
    res[Z_EXTADDR_LEN+1] = result[0];
    MT_ReverseBytes( res, Z_EXTADDR_LEN );
    zb_ReceiveDataIndication(0, 0x0101, 8+2,  res);
  }
  if (ZB_NWKA_SEARCH == searchType) {          //通过网络地址寻找对应的节点    
    res[0] = searchKey[1];
    res[1] = searchKey[0];
    osal_memcpy(res+2, result, Z_EXTADDR_LEN);
    MT_ReverseBytes( res+2, Z_EXTADDR_LEN );      //mac地址反转
    zb_ReceiveDataIndication(0, 0x0102, 8+2,  res);//网络地址在前，mac地址在后发送给网关
  }
}
/******************************************************************************
* @fn          zb_ReceiveDataIndication
*
* @brief       The zb_ReceiveDataIndication callback function is called
*              asynchronously by the ZigBee stack to notify the application
*              when data is received from a peer device.
*
* @param       source - The short address of the peer device that sent the data
*              command - The commandId associated with the data
*              len - The number of bytes in the pData parameter
*              pData - The data sent by the peer device
*
* @return      none
*/
void zb_ReceiveDataIndication( uint16 source, uint16 command, uint16 len, uint8 *pData  )
{
    HalLedSet( HAL_LED_1, HAL_LED_MODE_OFF );
    HalLedSet( HAL_LED_1, HAL_LED_MODE_BLINK );
    mtOSALSerialData_t* msg = (mtOSALSerialData_t*)osal_msg_allocate(sizeof(mtOSALSerialData_t)+len+4);
    if (msg) {
      msg->hdr.event = MT_SYS_APP_RSP_MSG;
      msg->hdr.status = len+4;
      msg->msg = (byte*)(msg+1);
      msg->msg[0] = (source>>8)&0xff;
      msg->msg[1] = source&0xff;
      msg->msg[2] = (command>>8)&0xff;
      msg->msg[3] = command&0xff;
      osal_memcpy(msg->msg+4, pData, len);
      osal_msg_send( MT_TaskID, (uint8 *)msg );
    } 
}

/******************************************************************************
* @fn          myApp_ReadTemperature
*
* @brief       Reports temperature sensor reading
*
* @param
*
* @return
*/


static int paramWrite(uint16 pid, byte *dat)
{
  int len = 0;
  switch (pid) {
  default:
    break;
  }
  return len;
}

static int paramRead(uint16 pid, byte *dat)
{
  int len = 0;
  switch (pid) {
  case 0x0001:
    dat[0] = 0x12; dat[1] = 0x09;
    len = 2;
    break;
  case 0x0002:
    dat[0] = 0x11; dat[1] = 0x44;
    len = 2;
    break;
  case 0x0003:
    dat[0] = 0x00; dat[1] = 0x01;
    len = 2;
    break;
  case 0x0004:
    dat[0] = dat[1] = dat[2] = dat[3] = dat[4] = dat[5] = 1;
    len = 6;
    break;
  case 0x0005:
    dat[0] = DEV_ID_COLLECTOR;
    len = 1;
    break;
    /* -----------  网络参数 ------------------- */  
  case 0x0014: //mac地址
    /*osal_nv_read( ZCD_NV_EXTADDR, 0, Z_EXTADDR_LEN, pBuf ); rm by liren */
    ZMacGetReq( ZMacExtAddr, dat ); // add by liren
    // Outgoing extended address needs to be reversed
    MT_ReverseBytes( dat, Z_EXTADDR_LEN );
    len = Z_EXTADDR_LEN;
    break;
  case 0x0015:
    {
      uint8 assocCnt = 0;
      uint16 *assocList;
      int i;
#if defined(RTR_NWK) && !defined( NONWK )
      assocList = AssocMakeList( &assocCnt );
#else
      assocCnt = 0;
      assocList = NULL;
#endif
      dat[0] = assocCnt;
      for (i=0; i<assocCnt&&i<16; i++) {
        dat[1+2*i] = HI_UINT16(assocList[i]);
        dat[1+2*i+1] = LO_UINT16(assocList[i]);
      }
      len = 1 + 2 * assocCnt;
      break;
    }
  }
  /* ------------------------------------ */
  
  return len;
}

#include "ZDApp.h"
static void processCommand(uint16 cmd, byte *pData, uint8 len)
{
  int i;
  uint16 pid;
  byte dat[64];
  byte rlen = 1;
  int ret;
  
  switch (cmd) {
  case 0x0000:
    process_package(pData, len);
    break;
  case 0x0101:          //通过mac地址寻找对应的节点
    {
      uint8 *pExtAddr = pData;
      MT_ReverseBytes( pExtAddr, Z_EXTADDR_LEN );
      ZMacGetReq( ZMacExtAddr, dat );     //获取当前节点的mac地址
#if USE_SYS_FIND_DEVICE
      zb_FindDeviceRequest(ZB_IEEE_SEARCH, pExtAddr);
#else
      if (TRUE == osal_memcmp(pExtAddr, dat, Z_EXTADDR_LEN) ||   //如果mac地址匹配
          TRUE == osal_memcmp(pData, "\x00\x00\x00\x00\x00\x00\x00\x00", Z_EXTADDR_LEN))
      {
        ret = 0;
        zb_FindDeviceConfirm(ZB_IEEE_SEARCH, pExtAddr, (unsigned char *)&ret);       
      } else {
        my_FindDevice(ZB_IEEE_SEARCH, pExtAddr);
      }
#endif
    }
    break;
    
  case 0x0102:          //通过网络地址寻找对应的节点
    {
      uint16 shortAddr = (pData[0]<<8) | pData[1];
      uint16 sa = NLME_GetShortAddr();   //获取当前节点的网络地址
      if (shortAddr == sa) {             //如果网络地址匹配
        ZMacGetReq( ZMacExtAddr, dat );  //获取当前节点的mac地址 
        zb_FindDeviceConfirm(ZB_NWKA_SEARCH, (unsigned char *)&sa, dat);
      } else {
#if USE_SYS_FIND_DEVICE
        ZDP_IEEEAddrReq( shortAddr, ZDP_ADDR_REQTYPE_SINGLE, 0, 0 );
#else
        my_FindDevice(ZB_NWKA_SEARCH, (uint8*)pData);
#endif
      }
    }
    break;
    
  case ID_CMD_WRITE_REQ:
    for (i=0; i<len; i+=2) {
      pid = pData[i]<<8 | pData[i+1];
      ret = paramWrite(pid, &pData[i+2]);
      if (ret <= 0) {
        dat[0] = 1;
        zb_ReceiveDataIndication( 0, ID_CMD_WRITE_RES, 1, dat );
        return;
      } 
      i += ret;
    }
    dat[0] = 0;
    zb_ReceiveDataIndication( 0, ID_CMD_WRITE_RES, 1, dat);
    break;
  case ID_CMD_READ_REQ:
    for (i=0; i<len; i+=2) {
      pid = pData[i]<<8 | pData[i+1];
      dat[rlen++] = pData[i];
      dat[rlen++] = pData[i+1];
      ret = paramRead(pid, dat+rlen);
      if (ret <= 0) {
        dat[0] = 1;
        zb_ReceiveDataIndication( 0, ID_CMD_READ_RES, 1, dat );
        return;
      }
      rlen += ret;
    }
    dat[0] = 0;
    zb_ReceiveDataIndication( 0, ID_CMD_READ_RES, rlen, dat );
    break;
  }    
}

////////////////////////////////////////////////////////////////////////////////
static int (*process_command_call)(char *ptag, char *pval, char *pout);

static void process_set_command_call(int (*fun)(char *ptag, char *pval, char *pout)) 
{
  process_command_call = fun;
}
static char wbuf[256];
static void process_package(char *pkg, int len)
{  
  char *p;
  char *ptag = NULL;
  char *pval = NULL;
  
  char *pwbuf = wbuf+1;
  
  
  if (pkg[0] != '{' || pkg[len-1] != '}') return;
  pkg[len-1] = 0;
  p = pkg+1; 
  do {
    ptag = p;
    p = strchr(p, '=');
    if (p != NULL) {
      *p++ = 0;
      pval = p;
      p = strchr(p, ',');
      if (p != NULL) *p++ = 0;
      if (process_command_call != NULL) {
        int ret;
        ret = process_command_call(ptag, pval, pwbuf);
        if (ret > 0) {
          pwbuf += ret;
          *pwbuf++ = ',';
        }
      }
    }
  } while (p != NULL);
  if (pwbuf - wbuf > 1) {
    wbuf[0] = '{';
    pwbuf[0] = 0;
    pwbuf[-1] = '}';
    uint16 cmd = 0;    
    zb_ReceiveDataIndication( 0, cmd, pwbuf-wbuf, wbuf );
  }
}

int process_command_callback(char *ptag, char *pval, char *pout)
{ 
  int val;
  int ret = 0;
  
  val = atoi(pval);
  if (0 == strcmp("DEFNWS", ptag)) { 
    if (val == 1) {
      uint8 startOptions = ZCD_STARTOPT_DEFAULT_NETWORK_STATE;
      zb_WriteConfiguration( ZCD_NV_STARTUP_OPTION, sizeof(uint8), &startOptions ); //标记网络状态发生改变
    }
  }else
  if (0 == strcmp("ECHO", ptag)) {
    ret = sprintf(pout, "ECHO=%s",pval);
  } else  
  if (0 == strcmp("PANID", ptag)) { 
    if (0 == strcmp("?", pval)) {
      uint16 tmp16;
      osal_nv_read( ZCD_NV_PANID, 0, sizeof( tmp16 ), &tmp16 );
      ret = sprintf(pout, "PANID=%u", tmp16);
    } else {
      uint8 startOptions = ZCD_STARTOPT_DEFAULT_NETWORK_STATE;
      uint16 tmp16;
      osal_nv_read( ZCD_NV_PANID, 0, sizeof( tmp16 ), &tmp16 );
      if (tmp16 != val) {
        osal_nv_write(ZCD_NV_PANID, 0, osal_nv_item_len( ZCD_NV_PANID ), &val);
        zb_WriteConfiguration( ZCD_NV_STARTUP_OPTION, sizeof(uint8), &startOptions ); //标记网络状态发生改变
      }
    } 
  }
  if (0 == strcmp("CHANNEL", ptag)) { 
    static uint32 chs[] = {0x00000800, 0x00001000, 0x00002000, 0x00004000, 0x00008000,
        0x00010000, 0x00020000, 0x00040000,0x00080000,0x00100000,0x00200000,
        0x00400000,0x00800000,0x01000000,0x02000000,0x04000000}; 
    if (0 == strcmp("?", pval)) {
      uint32 tmp32;
      uint8 i;
      osal_nv_read( ZCD_NV_CHANLIST, 0, sizeof( tmp32 ), &tmp32 );
     
      for (i=0; i<16; i++) {
        if (tmp32 == chs[i]) break;
      }
      i += 11;
      ret = sprintf(pout, "CHANNEL=%u", i);
    } else {
      uint32 tmp32, t32;
      uint8 startOptions = ZCD_STARTOPT_DEFAULT_NETWORK_STATE;
      tmp32 = val - 11;
      osal_nv_read( ZCD_NV_CHANLIST, 0, sizeof( tmp32 ), &t32 );
      if (tmp32 < 16) {
        if (t32 != chs[tmp32]) {
          osal_nv_write(ZCD_NV_CHANLIST, 0, osal_nv_item_len( ZCD_NV_CHANLIST ), &chs[tmp32]);
          zb_WriteConfiguration( ZCD_NV_STARTUP_OPTION, sizeof(uint8), &startOptions ); //标记网络状态发生改变
        }
      }
    }
  }
  /*if (0 == strcmp("RSSI", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "RSSI=%d", rssi);
    }
  }*/
  if (0 == strcmp("TYPE", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "TYPE=%d%d%s", NODE_CATEGORY, logicalType, NODE_NAME);
    }
  }
  if (0 == strcmp("NODE_CATEGORY", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "NODE_CATEGORY=%d", NODE_CATEGORY);
    }
  }
  if (0 == strcmp("NODE_TYPE", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "NODE_TYPE=%d", logicalType);
    }else{
      logicalType = val;
      zb_WriteConfiguration(ZCD_NV_LOGICAL_TYPE, sizeof(uint8), &logicalType);
    }
  }
  if (0 == strcmp("NODE_NAME", ptag)) {
    if (0 == strcmp("?", pval)) {
      ret = sprintf(pout, "NODE_NAME=%s", NODE_NAME);
    }
  }
  if (0 == strcmp("RTG", ptag)) {
    if (0 == strcmp("?", pval)) {
      int i;
      char *p;
      sprintf(pout, "RTG=");
      p = &pout[4];
      for (i=0; i<MAX_RTG_ENTRIES; i++) {
        rtgEntry_t *prtg;
        prtg = &rtgTable[i];
        if (prtg->status == RT_ACTIVE) {
          char mac[Z_EXTADDR_LEN];
          if (AddrMgrExtAddrLookup(prtg->nextHopAddress, mac) == TRUE) {
            MT_ReverseBytes( mac, Z_EXTADDR_LEN );
            sprintf(p, "%02X%02X", mac[6], mac[7]);
            p = p + strlen(p);              
          }
        }
      }
      if (strlen(pout) == 4) {
        sprintf(p, "NULL");
      }
      ret = strlen(pout);
    }
  } // RTG
  if (0 == strcmp("AL", ptag)) { 
    if (0 == strcmp("?", pval)) {
      char *p;
      sprintf(pout, "AL=");
      p = read_al(pout+3, -1);
      if (strlen(p) == 0) {
        sprintf(pout+3, "NULL");
      }
      ret = strlen(pout);
    }
  }// AL
  if (0 == strcmp("NB", ptag)) {
    if (0 == strcmp("?", pval)) {
      sprintf(pout, "NB=");
      read_nb(pout+strlen(pout), -1);
      if (strlen(pout) == 3) {
        sprintf(pout+3, "NULL");
      }
      ret = strlen(pout);
    }
  }//NB
  if (0 == strcmp("AN", ptag)) { 
    if (0 == strcmp("?", pval)) {
      sprintf(pout, "AN=");
      read_al(pout+strlen(pout), -1);
      read_nb(pout+strlen(pout), -1);
      if (strlen(pout) == 3) {
        sprintf(wbuf+3, "NULL");
      }
      ret = strlen(pout);
    }
  } //AN
  if (0 == strcmp("TPN", ptag)) { 
    /*  参数格式 x/y  表示在y分钟内上报x次数据 
     *  x = 0 停止上报,
     *  限制每分钟最大上报6次,最少上报1次
    */
    char *s = strchr(pval, '/');
    if (s != NULL) {
      int v1, v2;
      
      *s = 0;
      v1 = atoi(pval);
      v2 = atoi(s+1);
      
      if (v1 > 0 && v2 > 0) {
        _tm_delay = v2*60/v1;
        if (_tm_delay >= 10 && _tm_delay <= 65) {
          if (_tm_cnt == 0) {
            // start timer
            osal_start_timerEx( sapi_TaskID, __REPORT_EVT, (osal_rand()%_tm_delay) * 1000);
          } 
          _tm_cnt = v1;
        }
      }
    }
  } //TMAN
  return ret;
}
static char* read_nb(char *buf, int len)
{
  int i;
  char *p;
  
  buf[0] = 0;
  p = buf;     
  for (i=0; i<MAX_NEIGHBOR_ENTRIES; i++) {
    neighborEntry_t *pnb = &neighborTable[i];
    if (pnb->panId == panid 
        && memcmp(pnb->neighborExtAddr,"\x00\x00\x00\x00\x00\x00\x00\x00", 8)!=0 
        && pnb->age <= NWK_ROUTE_AGE_LIMIT) {
          sprintf(p, "%02X%02X", pnb->neighborExtAddr[1], pnb->neighborExtAddr[0]);
          p = p + strlen(p);         
    }
  }
  return buf;
}
static char* read_al(char *buf, int len)
{
  uint8 assocCnt = 0, i;
  uint16 *assocList;
  char mac[8];
  char *p = buf;
  p[0] = 0;
 
  for (i=0; i<NWK_MAX_DEVICES; i++) {
    associated_devices_t *pa = &AssociatedDevList[i];
    if (pa->nodeRelation == CHILD_FFD_RX_IDLE || pa->nodeRelation == CHILD_FFD) {
      if (pa->age > NWK_ROUTE_AGE_LIMIT) {
        if (TRUE == AddrMgrExtAddrLookup(pa->shortAddr,  mac)) {
          AssocRemove(mac);
        }
      }
    }
  }
  
  assocList = AssocMakeList( &assocCnt );
  for (i=0; i<assocCnt; i++) { 
    if (TRUE == AddrMgrExtAddrLookup(assocList[i],  mac)) {
      MT_ReverseBytes( mac, Z_EXTADDR_LEN );
      sprintf(p, "%02X%02X", mac[6], mac[7]);
      p = p + strlen(p);    
    }
  }
  return buf;
}

static void my_report_proc(void)
{
  
  
  sprintf(wbuf, "{PN=");
  //read_al(wbuf+strlen(wbuf), -1);
  read_nb(wbuf+strlen(wbuf), -1);
  if (strlen(wbuf) == 4) {
    sprintf(wbuf+4, "NULL");
  } 
  sprintf(wbuf+strlen(wbuf), ",TYPE=%d%d%s}", NODE_CATEGORY, logicalType, NODE_NAME);
  zb_ReceiveDataIndication(0/*source*/, 0/*cmd*/, strlen(wbuf), wbuf);
}
////////////////////////////////////////////////////////////////////////////////