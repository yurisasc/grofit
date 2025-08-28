import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WarframeMarketAPI } from '@grofit/wfm-sdk'

type Platform = 'pc' | 'ps4' | 'xb1' | 'swi'

@Injectable()
export class WfmApiService {
  private instances: Map<Platform, WarframeMarketAPI> = new Map()

  constructor(private configService: ConfigService) {}

  private createInstance(platform: Platform): WarframeMarketAPI {
    return new WarframeMarketAPI({ platform })
  }

  getInstance(platform?: Platform): WarframeMarketAPI {
    const defaultPlatform =
      (this.configService.get<string>('worker.wfmPlatform') as Platform) || 'pc'
    const targetPlatform = platform || defaultPlatform

    if (!this.instances.has(targetPlatform)) {
      const newInstance = this.createInstance(targetPlatform)
      this.instances.set(targetPlatform, newInstance)
    }

    return this.instances.get(targetPlatform)!
  }
}
