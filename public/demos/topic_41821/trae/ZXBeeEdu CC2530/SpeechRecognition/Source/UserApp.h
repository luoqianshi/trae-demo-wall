/*********************************************************************************************
* 文件：UserApp.h
* 作者：Zengwx 2015.2.5
* 说明：UserApp头文件
* 修改：
* 注释：
*********************************************************************************************/
#ifndef USER_APP_H
#define USER_APP_H

/*********************************************************************************************
* 宏定义
*********************************************************************************************/
#define MY_REPORT_EVT 0x0001                                    // 主动上报事件
#define MY_CHECK_EVT 0x0002
#define MY_INIT_EVT 0x0004

#ifdef SPI_LCD
#define MY_LCD_EVT 0x0008
#endif

#define NODE_NAME  "105"                                        // 节点的名称
#define NODE_CATEGORY 1                                         // 节点的类别：1：zigbee 2：电力载波 3：IPV6

/*********************************************************************************************
* 函数原型
*********************************************************************************************/
extern void sensor_init(void);                                  // 节点传感器初始化
extern uint16 updateV0(char *val);                              // 更新V0值
extern uint16 updateV1(char *val);
extern uint8 updateA0(void);
extern void sensor_update(void);                                // 上传允许主动上报的数据
extern void lcd_update(void);
extern void sensor_check(void);
extern int usr_process_command_call(char *ptag, char *pval, char *pout); // 用户命令处理函数
extern void MyEventProcess( uint16 event );                     // 用户自定义事件

void halWait(unsigned char wait);
void buzz_init(void);
void MyUartInit(void);
void MyUartCallBack ( uint8 port, uint8 event );

#endif // USER_APP_H