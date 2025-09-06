import { Module } from '@nestjs/common'
import { EventBusModule } from '@grofit/event-bus'
import { DbModule } from '../../services/db/db.module'
import { AnalyticsSubscriber } from './analytics.subscriber'
import { PopularItemsComputeService } from './popular-items.compute'

@Module({
  imports: [EventBusModule, DbModule],
  providers: [AnalyticsSubscriber, PopularItemsComputeService],
})
export class AnalyticsModule {}
