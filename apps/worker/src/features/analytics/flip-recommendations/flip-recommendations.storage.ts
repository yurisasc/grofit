import { Injectable } from '@nestjs/common'
import { FlipResult } from '@grofit/analytics'
import { FlipRecommendationsService } from '../../../services/db/flip-recommendations'

/**
 * Service responsible for storing flip recommendation analytics data
 */
@Injectable()
export class FlipRecommendationsStorage {
  constructor(private readonly flipRecommendationsService: FlipRecommendationsService) {}

  /**
   * Store flip analytics data
   */
  async storeFlipAnalytics(date: string, results: FlipResult[]): Promise<void> {
    const upserts = results.map((result, idx) => ({
      date,
      itemName: result.itemName,
      modRank: result.modRank,
      score: result.overallScore.toString(),
      rank: idx + 1,
      recommendation: result.recommendation,
      confidence: result.confidence.toString(),
      trendStrength: result.factors.trendStrength.toString(),
      performanceRank: result.factors.performanceRank.toString(),
      stabilityScore: result.factors.stabilityScore.toString(),
      volumeRank: result.factors.volumeRank.toString(),
      volatilityScore: result.factors.volatilityScore.toString(),
      seasonalMultiplier: result.factors.seasonalMultiplier.toString(),
      marketHealth: result.factors.marketHealth.toString(),
      patternConfidence: result.factors.patternConfidence.toString(),
      factorsJson: result.factors,
    }))

    await this.flipRecommendationsService.upsertDaily(upserts)
  }
}
