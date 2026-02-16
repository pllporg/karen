import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { MalwareScanService } from './malware-scan.service';

@Global()
@Module({
  providers: [S3Service, MalwareScanService],
  exports: [S3Service, MalwareScanService],
})
export class FilesModule {}
