import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { WeatherService } from './weather.service';
import { CreateWeatherPreferenceDto, UpdateWeatherPreferenceDto } from './dto/weather-preference.dto';

@Controller('api/weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  /**
   * GET /api/weather/forecast?city=Manizales
   * Get weather forecast for a city
   */
  @Get('forecast')
  async getForecast(@Param() params: { city?: string }) {
    return this.weatherService.getWeatherForecast(params.city || 'Manizales');
  }

  /**
   * GET /api/weather/forecast/:city
   * Get weather forecast for a specific city
   */
  @Get('forecast/:city')
  async getForecastByCity(@Param('city') city: string) {
    return this.weatherService.getWeatherForecast(city);
  }

  /**
   * GET /api/weather/preferences/:citizenId
   * Get weather preferences for a citizen
   */
  @Get('preferences/:citizenId')
  async getPreferences(@Param('citizenId') citizenId: string) {
    return this.weatherService.getPreference(citizenId);
  }

  /**
   * POST /api/weather/preferences/:citizenId
   * Create or update weather preferences
   */
  @Post('preferences/:citizenId')
  async upsertPreferences(
    @Param('citizenId') citizenId: string,
    @Body() dto: CreateWeatherPreferenceDto,
  ) {
    return this.weatherService.upsertPreference(citizenId, dto);
  }

  /**
   * PUT /api/weather/preferences/:citizenId
   * Update weather preferences
   */
  @Put('preferences/:citizenId')
  async updatePreferences(
    @Param('citizenId') citizenId: string,
    @Body() dto: UpdateWeatherPreferenceDto,
  ) {
    return this.weatherService.upsertPreference(citizenId, dto);
  }

  /**
   * DELETE /api/weather/preferences/:citizenId
   * Disable weather alerts for a citizen
   */
  @Delete('preferences/:citizenId')
  async disablePreferences(@Param('citizenId') citizenId: string) {
    await this.weatherService.disablePreference(citizenId);
    return { success: true };
  }

  /**
   * POST /api/weather/check/:citizenId
   * Manually trigger a weather check for a citizen (for testing)
   */
  @Post('check/:citizenId')
  async checkWeather(@Param('citizenId') citizenId: string) {
    return this.weatherService.triggerWeatherCheckForCitizen(citizenId);
  }
}
