import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { AuditModule } from '../audit/audit.module';
import { GenericCsvImportPlugin } from './plugins/generic-csv.plugin';
import { MyCaseZipImportPlugin } from './plugins/mycase-zip.plugin';
import { ClioTemplateImportPlugin } from './plugins/clio-template.plugin';

@Module({
  imports: [AuditModule],
  controllers: [ImportsController],
  providers: [
    ImportsService,
    GenericCsvImportPlugin,
    MyCaseZipImportPlugin,
    ClioTemplateImportPlugin,
  ],
  exports: [ImportsService],
})
export class ImportsModule {}
