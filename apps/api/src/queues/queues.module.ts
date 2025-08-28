import { Module, Global } from '@nestjs/common'
import { queuesProviders } from './queues.providers'

@Global()
@Module({
  providers: [...queuesProviders],
  exports: [...queuesProviders],
})
export class QueuesModule {}
