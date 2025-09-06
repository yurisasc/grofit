import { Injectable } from '@nestjs/common'
import { FlipResult, AllAnalyticsResult } from '@grofit/analytics'
import logger from '@grofit/logger'

const log = logger.child({ service: 'FlipRecommendationsProcessor' })

/**
 * Service responsible for processing flip recommendation analytics
 */
@Injectable()
export class FlipRecommendationsProcessor {
  /**
   * Process flip recommendations from pre-computed analytics results
   * @param unifiedResults - Pre-computed analytics results
   * @returns Flip recommendation results
   */
  async processAllFlipRecommendations(unifiedResults: AllAnalyticsResult[]): Promise<FlipResult[]> {
    log.info(
      { itemCount: unifiedResults.length },
      'Processing flip recommendations from unified results',
    )

    const flipResults = unifiedResults.map((result) => result.flipResult)

    // Sort flip results by overall score (highest first)
    flipResults.sort((a, b) => b.overallScore - a.overallScore)

    log.info({ processedItems: flipResults.length }, 'Flip recommendations processing completed')

    return flipResults
  }
}
