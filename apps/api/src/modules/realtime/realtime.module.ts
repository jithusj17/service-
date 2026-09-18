import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { RealtimeListener } from './realtime.listener';
import { AppConfigModule } from '../../config/config.module';

@Global()
@Module({
  imports: [JwtModule.register({}), AppConfigModule],
  providers: [RealtimeGateway, RealtimeService, RealtimeListener],
  exports: [RealtimeService],
})
export class RealtimeModule {}
