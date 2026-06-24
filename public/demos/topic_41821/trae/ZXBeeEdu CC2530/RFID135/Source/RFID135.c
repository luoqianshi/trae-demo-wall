/*********************************************************************************************
* 文件：UserApp.c
* 作者：Zengwx 2015.1.29
* 说明：高频RFID传感器功能函数
* 修改：
* 注释：
*********************************************************************************************/

/*********************************************************************************************
* 头文件
*********************************************************************************************/
#include <stdbool.h>
#include <intrinsics.h>      
#include "RFID135.h" 

/*********************************************************************************************
* 宏定义
*********************************************************************************************/
#define MAXRLEN 18

/*********************************************************************************************
* 全局变量
*********************************************************************************************/
unsigned char g_ucTempbuf[20];

/************************************************************************
* 名称：delay1()
* 功能：延迟
* 参数：z
* 返回：无
************************************************************************/
void delay1(unsigned int z)
{
  unsigned int x,y;
  for(x=z;x>0;x--)
    for(y=110;y>0;y--);	
}  

/************************************************************************
* 名称：initSPIIO()
* 功能：初始化传感器
* 参数：无
* 返回：无
************************************************************************/
void initSPIIO(void)
{
#ifdef SENSOR_REV01  
  P0SEL &= ~0xE0;
  P0DIR |=0xA0;
  P0DIR &=~0x40;
  
  // 01底板(节点板)为P1_2
  P1SEL &=~0x0C;
  P1DIR |=0x0C;
  
#endif
#ifdef SENSOR_REV02     
  P0SEL &=~0x70;
  P0DIR |=0x30;
  P0DIR &=~0x40;
  P1SEL &=~0x09;
  P1DIR |=0x09;
#endif 
}

/************************************************************************
* 名称：rfid_id()
* 功能：寻卡处理
* 参数：无
* 返回：0或1
* 修改：
* 注释：
************************************************************************/
int rfid_id(char *id)
{
  char status;
  
  status = PcdRequest(PICC_REQALL, g_ucTempbuf);                // 寻卡
  
  if (status != MI_OK) return 0;
  
  // display_type();//寻到卡后显示出该卡的类型
  
  status = PcdAnticoll(g_ucTempbuf);                            //防冲撞
  
  PcdHalt();
  
  if (status != MI_OK) return 0;
  
  //display_cardnum();//显示寻到的卡的序列号 
  
  for(int i = 0; i < 4; ++i)
  {
    id[i]=g_ucTempbuf[i];           
  }  
  
  return 1;
}

/************************************************************************
*名  称：PcdRequest
*功  能：寻卡
*参  数： req_code[IN]:寻卡方式
*         0x52 = 寻感应区内所有符合14443A标准的卡
*         0x26 = 寻未进入休眠状态的卡
*         pTagType[OUT]：卡片类型代码
*         0x4400 = Mifare_UltraLight
*         0x0400 = Mifare_One(S50)
*         0x0200 = Mifare_One(S70)
*         0x0800 = Mifare_Pro(X)
*         0x4403 = Mifare_DESFire
*返回值：成功返回MI_OK
************************************************************************/
char PcdRequest(unsigned char req_code,unsigned char *pTagType)
{
   char status;  
   unsigned int  unLen;
   unsigned char ucComMF522Buf[MAXRLEN]; 

   ClearBitMask(Status2Reg,0x08);
   WriteRawRC(BitFramingReg,0x07);
   SetBitMask(TxControlReg,0x03);
 
   ucComMF522Buf[0] = req_code;

   status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,1,ucComMF522Buf,&unLen);
   
   if ((status == MI_OK) && (unLen == 0x10))
   {    
       *pTagType     = ucComMF522Buf[0];
       *(pTagType+1) = ucComMF522Buf[1];
   }
   else
   {   
     status = MI_ERR;  
   }   
   return status;
}

/************************************************************************
*名  称：PcdAnticoll
*功  能：防冲撞
*参  数： pSnr[OUT]:卡片序列号，4字节
*返回值：成功返回MI_OK
************************************************************************/
char PcdAnticoll(unsigned char *pSnr)
{
    char status;
    unsigned char i,snr_check=0;
    unsigned int  unLen;
    unsigned char ucComMF522Buf[MAXRLEN]; 
    

    ClearBitMask(Status2Reg,0x08);
    WriteRawRC(BitFramingReg,0x00);
    ClearBitMask(CollReg,0x80);
 
    ucComMF522Buf[0] = PICC_ANTICOLL1;
    ucComMF522Buf[1] = 0x20;

    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,2,ucComMF522Buf,&unLen);

    if (status == MI_OK)
    {
    	 for (i=0; i<4; i++)
         {   
             *(pSnr+i)  = ucComMF522Buf[i];
             snr_check ^= ucComMF522Buf[i];

         }
         if (snr_check != ucComMF522Buf[i])
         {   status = MI_ERR;    }
    }
    
    SetBitMask(CollReg,0x80);
    return status;
}

/************************************************************************
*名  称：PcdSelect
*功  能：选定卡片
*参  数：pSnr[IN]:卡片序列号，4字节
*返回值：成功返回MI_OK
************************************************************************/
char PcdSelect(unsigned char *pSnr)
{
    char status;
    unsigned char i;
    unsigned int  unLen;
    unsigned char ucComMF522Buf[MAXRLEN]; 
    
    ucComMF522Buf[0] = PICC_ANTICOLL1;
    ucComMF522Buf[1] = 0x70;
    ucComMF522Buf[6] = 0;
    for (i=0; i<4; i++)
    {
    	ucComMF522Buf[i+2] = *(pSnr+i);
    	ucComMF522Buf[6]  ^= *(pSnr+i);
    }
    CalulateCRC(ucComMF522Buf,7,&ucComMF522Buf[7]);
  
    ClearBitMask(Status2Reg,0x08);

    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,9,ucComMF522Buf,&unLen);
    
    if ((status == MI_OK) && (unLen == 0x18))
    {   status = MI_OK;  }
    else
    {   status = MI_ERR;    }

    return status;
}

/************************************************************************
*名  称：PcdAuthState
*功  能：验证卡片密码
*参  数：auth_mode[IN]: 密码验证模式
*        0x60 = 验证A密钥
*        0x61 = 验证B密钥 
*        addr[IN]：块地址
*        pKey[IN]：密码
*        pSnr[IN]：卡片序列号，4字节
*返回值：成功返回MI_OK
************************************************************************/
char PcdAuthState(unsigned char auth_mode,unsigned char addr,unsigned char *pKey,unsigned char *pSnr)
{
    char status;
    unsigned int  unLen;
    unsigned char i,ucComMF522Buf[MAXRLEN]; 

    ucComMF522Buf[0] = auth_mode;
    ucComMF522Buf[1] = addr;
    for (i=0; i<6; i++)
    {    ucComMF522Buf[i+2] = *(pKey+i);   }
    for (i=0; i<6; i++)
    {    ucComMF522Buf[i+8] = *(pSnr+i);   }
    
    status = PcdComMF522(PCD_AUTHENT,ucComMF522Buf,12,ucComMF522Buf,&unLen);
    if ((status != MI_OK) || (!(ReadRawRC(Status2Reg) & 0x08)))
    {   status = MI_ERR;   }
    
    return status;
}

/************************************************************************
*名  称：PcdRead
*功  能：读取M1卡一块数据
*参  数：addr[IN]：块地址
*        pData[OUT]：读出的数据，16字节
*返回值：成功返回MI_OK
************************************************************************/
char PcdRead(unsigned char addr,unsigned char *pData)
{
    char status;
    unsigned int  unLen;
    unsigned char i,ucComMF522Buf[MAXRLEN]; 

    ucComMF522Buf[0] = PICC_READ;
    ucComMF522Buf[1] = addr;
    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2]);
   
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen);
    if ((status == MI_OK) && (unLen == 0x90))
    {
        for (i=0; i<16; i++)
        {    *(pData+i) = ucComMF522Buf[i];   }
    }
    else
    {   status = MI_ERR;   }
    
    return status;
}

/************************************************************************
*名  称：PcdWrite
*功  能：写数据到M1卡一块
*参  数：addr[IN]：块地址
*        pData[IN]：写入的数据，16字节
*返回值：成功返回MI_OK
************************************************************************/
char PcdWrite(unsigned char addr,unsigned char *pData)
{
    char status;
    unsigned int  unLen;
    unsigned char i,ucComMF522Buf[MAXRLEN]; 
    
    ucComMF522Buf[0] = PICC_WRITE;
    ucComMF522Buf[1] = addr;
    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2]);
 
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen);

    if ((status != MI_OK) || (unLen != 4) || ((ucComMF522Buf[0] & 0x0F) != 0x0A))
    {   status = MI_ERR;   }
        
    if (status == MI_OK)
    {
        for (i=0; i<16; i++)
        {    ucComMF522Buf[i] = *(pData+i);   }
        CalulateCRC(ucComMF522Buf,16,&ucComMF522Buf[16]);

        status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,18,ucComMF522Buf,&unLen);
        if ((status != MI_OK) || (unLen != 4) || ((ucComMF522Buf[0] & 0x0F) != 0x0A))
        {   status = MI_ERR;   }
    }
    
    return status;
}

/************************************************************************
*名  称：PcdValue
*功  能：扣款和充值
*参  数：dd_mode[IN]：命令字
*        0xC0 = 扣款
*        0xC1 = 充值
*        addr[IN]：钱包地址
*        pValue[IN]：4字节增(减)值，低位在前
*返回值：成功返回MI_OK
************************************************************************/
char PcdValue(unsigned char dd_mode,unsigned char addr,unsigned char *pValue)
{
    char status;
    unsigned int  unLen;
    unsigned char i,ucComMF522Buf[MAXRLEN]; 
    
    ucComMF522Buf[0] = dd_mode;
    ucComMF522Buf[1] = addr;
    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2]);
 
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen);

    if ((status != MI_OK) || (unLen != 4) || ((ucComMF522Buf[0] & 0x0F) != 0x0A))
    {   status = MI_ERR;   }
        
    if (status == MI_OK)
    {
        for (i=0; i<16; i++)
        {    ucComMF522Buf[i] = *(pValue+i);   }
        CalulateCRC(ucComMF522Buf,4,&ucComMF522Buf[4]);
        unLen = 0;
        status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,6,ucComMF522Buf,&unLen);
        if (status != MI_ERR)
        {    status = MI_OK;    }
    }
    
    if (status == MI_OK)
    {
        ucComMF522Buf[0] = PICC_TRANSFER;
        ucComMF522Buf[1] = addr;
        CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2]); 
   
        status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen);

        if ((status != MI_OK) || (unLen != 4) || ((ucComMF522Buf[0] & 0x0F) != 0x0A))
        {   status = MI_ERR;   }
    }
    return status;
}

/************************************************************************
*名  称：PcdBakValue
*功  能：命令卡片进入休眠状态
*参  数：sourceaddr[IN]：源地址
*        goaladdr[IN]：目标地址
*返回值：成功返回MI_OK
************************************************************************/
char PcdBakValue(unsigned char sourceaddr, unsigned char goaladdr)
{
    char status;
    unsigned int  unLen;
    unsigned char ucComMF522Buf[MAXRLEN]; 

    ucComMF522Buf[0] = PICC_RESTORE;
    ucComMF522Buf[1] = sourceaddr;
    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2]);
 
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen);

    if ((status != MI_OK) || (unLen != 4) || ((ucComMF522Buf[0] & 0x0F) != 0x0A))
    {   status = MI_ERR;   }
    
    if (status == MI_OK)
    {
        ucComMF522Buf[0] = 0;
        ucComMF522Buf[1] = 0;
        ucComMF522Buf[2] = 0;
        ucComMF522Buf[3] = 0;
        CalulateCRC(ucComMF522Buf,4,&ucComMF522Buf[4]);
 
        status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,6,ucComMF522Buf,&unLen);
        if (status != MI_ERR)
        {    status = MI_OK;    }
    }
    
    if (status != MI_OK)
    {    return MI_ERR;   }
    
    ucComMF522Buf[0] = PICC_TRANSFER;
    ucComMF522Buf[1] = goaladdr;

    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2]);
 
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen);

    if ((status != MI_OK) || (unLen != 4) || ((ucComMF522Buf[0] & 0x0F) != 0x0A))
    {   status = MI_ERR;   }

    return status;
}

/************************************************************************
*名  称：PcdHalt
*功  能：命令卡片进入休眠状态
*参  数：
*返回值：成功返回MI_OK
************************************************************************/
char PcdHalt(void)
{
    char status;
    unsigned int  unLen;
    unsigned char ucComMF522Buf[MAXRLEN]; 

    ucComMF522Buf[0] = PICC_HALT;
    ucComMF522Buf[1] = 0;
    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2]);
 
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen);

    return MI_OK;
}

/************************************************************************
*名  称：CalulateCRC
*功  能：用MF522计算CRC16函数
*参  数：pIndata:输入的数据
*        len:长度
*        pOutData:输出的数据
*返回值：成功返回MI_OK
************************************************************************/
void CalulateCRC(unsigned char *pIndata,unsigned char len,unsigned char *pOutData)
{
    unsigned char i,n;
    ClearBitMask(DivIrqReg,0x04);
    WriteRawRC(CommandReg,PCD_IDLE);
    SetBitMask(FIFOLevelReg,0x80);
    for (i=0; i<len; i++)
    {   WriteRawRC(FIFODataReg, *(pIndata+i));   }
    WriteRawRC(CommandReg, PCD_CALCCRC);
    i = 0xFF;
    do 
    {
        n = ReadRawRC(DivIrqReg);
        i--;
    }
    while ((i!=0) && !(n&0x04));
    pOutData[0] = ReadRawRC(CRCResultRegL);
    pOutData[1] = ReadRawRC(CRCResultRegM);
}

/************************************************************************
*名  称：PcdReset
*功  能：复位RC522
*参  数：Address[IN]:寄存器地址
*返回值：成功返回MI_OK
************************************************************************/
char PcdReset(void)
{
    MF522_RST=1;
    
		__no_operation();                  

    MF522_RST=0;

		__no_operation();                   

    MF522_RST=1;

		__no_operation();                 
	
    WriteRawRC(CommandReg,PCD_RESETPHASE);

		__no_operation();                  
	
    
    WriteRawRC(ModeReg,0x3D);                                   //和Mifare卡通讯，CRC初始值0x6363
    WriteRawRC(TReloadRegL,30);           
    WriteRawRC(TReloadRegH,0);
    WriteRawRC(TModeReg,0x8D);
    WriteRawRC(TPrescalerReg,0x3E);
   WriteRawRC(TxAutoReg,0x40);
    return MI_OK;
}

/************************************************************************
*名  称：ReadRawRC
*功  能：读RC632寄存器
*参  数：Address[IN]:寄存器地址
*返回值：读出的值
************************************************************************/
unsigned char ReadRawRC(unsigned char Address)
{
     unsigned char i, ucAddr;
     unsigned char ucResult=0;

     MF522_SCK = 0;
     MF522_NSS = 0;
     ucAddr = ((Address<<1)&0x7E)|0x80;

     for(i=8;i>0;i--)
     {
         MF522_SI = ((ucAddr&0x80)==0x80);
         MF522_SCK = 1;
         ucAddr <<= 1;
         MF522_SCK = 0;
     }

     for(i=8;i>0;i--)
     {
         MF522_SCK = 1;
         ucResult <<= 1;
         ucResult|=(bool)(MF522_SO);
         MF522_SCK = 0;
     }

     MF522_NSS = 1;
     MF522_SCK = 1;
     return ucResult;
}

/************************************************************************
*名  称：WriteRawRC
*功  能：写RC632寄存器
*参  数：Address[IN]:寄存器地址
*        value[IN]:写入的值
*返回值：无
************************************************************************/
void WriteRawRC(unsigned char Address, unsigned char value)
{  
    unsigned char i, ucAddr;

    MF522_SCK = 0;
    MF522_NSS = 0;
    ucAddr = ((Address<<1)&0x7E);

    for(i=8;i>0;i--)
    {
        MF522_SI = ((ucAddr&0x80)==0x80);
        MF522_SCK = 1;
        ucAddr <<= 1;
        MF522_SCK = 0;
    }

    for(i=8;i>0;i--)
    {
        MF522_SI = ((value&0x80)==0x80);
        MF522_SCK = 1;
        value <<= 1;
        MF522_SCK = 0;
    }
    MF522_NSS = 1;
    MF522_SCK = 1;
}

/************************************************************************
*名  称：置RC522寄存器位
*功  能：清RC522寄存器位
*参  数：reg[IN]:寄存器地址
*        mask[IN]:置位值
*返回值：无
************************************************************************/
void SetBitMask(unsigned char reg,unsigned char mask)  
{
    char tmp = 0x0;
    tmp = ReadRawRC(reg);
    WriteRawRC(reg,tmp | mask);                                 // 设置位掩码
}

/************************************************************************
*名  称：ClearBitMask
*功  能：清RC522寄存器位
*参  数：reg[IN]:寄存器地址
*        mask[IN]:清位值
*返回值：无
************************************************************************/
void ClearBitMask(unsigned char reg,unsigned char mask)  
{
    char tmp = 0x0;
    tmp = ReadRawRC(reg);
    WriteRawRC(reg, tmp & ~mask);                               // 清除位掩码
} 

/************************************************************************
*名  称：PcdComMF522
*功  能：通过RC522和ISO14443卡通讯
*参  数：Command[IN]:RC522命令字
*        pInData[IN]:通过RC522发送到卡片的数据
*        InLenByte[IN]:发送数据的字节长度
*        pOutData[OUT]:接收到的卡片返回数据
*        *pOutLenBit[OUT]:返回数据的位长度
*返回值：status-成功返回MI_OK
************************************************************************/
char PcdComMF522(unsigned char Command, 
                 unsigned char *pInData, 
                 unsigned char InLenByte,
                 unsigned char *pOutData, 
                 unsigned int  *pOutLenBit)
{
    char status = MI_ERR;
    unsigned char irqEn   = 0x00;
    unsigned char waitFor = 0x00;
    unsigned char lastBits;
    unsigned char n;
    unsigned int i;
    switch (Command)
    {
       case PCD_AUTHENT:
          irqEn   = 0x12;
          waitFor = 0x10;
          break;
       case PCD_TRANSCEIVE:
          irqEn   = 0x77;
          waitFor = 0x30;
          break;
       default:
         break;
    }
   
    WriteRawRC(ComIEnReg,irqEn|0x80);
    ClearBitMask(ComIrqReg,0x80);
    WriteRawRC(CommandReg,PCD_IDLE);
    SetBitMask(FIFOLevelReg,0x80);
    
    for (i=0; i<InLenByte; i++)
    {   WriteRawRC(FIFODataReg, pInData[i]);    }
    WriteRawRC(CommandReg, Command);
   
    
    if (Command == PCD_TRANSCEIVE)
    {    SetBitMask(BitFramingReg,0x80);  }
    
    i = 600;                                                    //根据时钟频率调整，操作M1卡最大等待时间25ms
    do 
    {
         n = ReadRawRC(ComIrqReg);
         i--;
    }
    while ((i!=0) && !(n&0x01) && !(n&waitFor));
    ClearBitMask(BitFramingReg,0x80);
	      
    if (i!=0)
    {    
         if(!(ReadRawRC(ErrorReg)&0x1B))
         {
             status = MI_OK;
             if (n & irqEn & 0x01)
             {   status = MI_NOTAGERR;   }
             if (Command == PCD_TRANSCEIVE)
             {
               	n = ReadRawRC(FIFOLevelReg);
              	lastBits = ReadRawRC(ControlReg) & 0x07;
                if (lastBits)
                {   *pOutLenBit = (n-1)*8 + lastBits;   }
                else
                {   *pOutLenBit = n*8;   }
                if (n == 0)
                {   n = 1;    }
                if (n > MAXRLEN)
                {   n = MAXRLEN;   }
                for (i=0; i<n; i++)
                {   pOutData[i] = ReadRawRC(FIFODataReg);    }
            }
         }
         else
         {   status = MI_ERR;   }
        
   }
   

   SetBitMask(ControlReg,0x80);                                 // 停止计时器
   WriteRawRC(CommandReg,PCD_IDLE); 
   return status;
}

/************************************************************************
*名  称：PcdAntennaOn
*功  能：开启天线
*        每次启动或关闭天险发射之间应至少有1ms的间隔
*参  数：无
*返回值：无
************************************************************************/
void PcdAntennaOn()
{
    unsigned char i;
    i = ReadRawRC(TxControlReg);
    if (!(i & 0x03))
    {
        SetBitMask(TxControlReg, 0x03);
    }
}

/************************************************************************
*名  称：PcdAntennaOff
*功  能：关闭天线
*参  数：无
*返回值：无
************************************************************************/
void PcdAntennaOff()
{
    ClearBitMask(TxControlReg, 0x03);
}
