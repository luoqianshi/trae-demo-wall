import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SetApiKeyDto {
  @ApiProperty({
    example: 'xxxxxxxx.xxxxxx',
    description: 'GLM API Key 明文，后端会用 AES-256-GCM 加密后存入数据库',
  })
  @IsString()
  @IsNotEmpty({ message: 'API Key 不能为空' })
  @MaxLength(500, { message: 'API Key 过长' })
  apiKey!: string;
}
