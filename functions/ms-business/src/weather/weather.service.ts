import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { WeatherPreference } from './entities/weather-preference.entity';
import { NotificationsGateway } from '../gateways/notifications/notifications.gateway';
import { CreateWeatherPreferenceDto, UpdateWeatherPreferenceDto } from './dto/weather-preference.dto';

export interface WeatherForecast {
  temperature: number;
  condition: string;
  precipitationProbability: number;
  windSpeed: number;
  humidity: number;
  icon: string;
}

export interface GeocodingResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @InjectRepository(WeatherPreference)
    private readonly weatherPrefRepository: Repository<WeatherPreference>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ── Preferences CRUD ────────────────────────────────────────

  async getPreference(citizenId: string): Promise<WeatherPreference | null> {
    return this.weatherPrefRepository.findOne({
      where: { citizenId, active: true },
    });
  }

  async upsertPreference(
    citizenId: string,
    dto: CreateWeatherPreferenceDto | UpdateWeatherPreferenceDto,
  ): Promise<WeatherPreference> {
    let pref = await this.weatherPrefRepository.findOne({
      where: { citizenId },
    });

    if (pref) {
      Object.assign(pref, dto);
    } else {
      pref = this.weatherPrefRepository.create({
        citizenId,
        ...dto,
        active: true,
      });
    }

    return this.weatherPrefRepository.save(pref);
  }

  async disablePreference(citizenId: string): Promise<void> {
    const pref = await this.weatherPrefRepository.findOne({
      where: { citizenId },
    });
    if (pref) {
      pref.weatherAlertsEnabled = false;
      pref.active = false;
      await this.weatherPrefRepository.save(pref);
    }
  }

  // ── Weather Data ────────────────────────────────────────────

  /**
   * Geocode a city name to coordinates using Open-Meteo Geocoding API
   */
  async geocodeCity(city: string): Promise<GeocodingResult | null> {
    try {
      const { data } = await axios.get(
        'https://geocoding-api.open-meteo.com/v1/search',
        {
          params: {
            name: city,
            count: 1,
            language: 'es',
            format: 'json',
          },
        },
      );

      if (!data.results || data.results.length === 0) {
        this.logger.warn(`City not found: ${city}`);
        return null;
      }

      const result = data.results[0];
      return {
        name: result.name,
        country: result.country || '',
        latitude: result.latitude,
        longitude: result.longitude,
      };
    } catch (error) {
      this.logger.error(`Error geocoding city ${city}: ${error}`);
      return null;
    }
  }

  /**
   * Get weather forecast for a city using Open-Meteo API
   * This follows the pattern from the professor's LangChain example
   * but adapted for NestJS
   */
  async getWeatherForecast(city: string): Promise<{
    location: GeocodingResult | null;
    forecast: WeatherForecast | null;
    rainLikely: boolean;
  }> {
    const location = await this.geocodeCity(city);
    if (!location) {
      return { location: null, forecast: null, rainLikely: false };
    }

    try {
      const { data } = await axios.get(
        'https://api.open-meteo.com/v1/forecast',
        {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            daily: [
              'temperature_2m_max',
              'temperature_2m_min',
              'precipitation_probability_max',
              'weathercode',
              'windspeed_10m_max',
            ].join(','),
            current: [
              'temperature_2m',
              'relative_humidity_2m',
              'weathercode',
            ].join(','),
            timezone: 'auto',
            forecast_days: 1,
          },
        },
      );

      const daily = data.daily;
      const current = data.current;

      // Map weather code to condition description
      const condition = this.mapWeatherCode(
        daily.weathercode?.[0] ?? current.weathercode ?? 0,
      );
      const precipProbability = daily.precipitation_probability_max?.[0] ?? 0;

      const forecast: WeatherForecast = {
        temperature: Math.round(current.temperature_2m ?? daily.temperature_2m_max?.[0] ?? 0),
        condition,
        precipitationProbability: precipProbability,
        windSpeed: daily.windspeed_10m_max?.[0] ?? 0,
        humidity: current.relative_humidity_2m ?? 0,
        icon: this.getWeatherIcon(condition, precipProbability),
      };

      return {
        location,
        forecast,
        rainLikely: precipProbability > 50,
      };
    } catch (error) {
      this.logger.error(`Error fetching weather for ${city}: ${error}`);
      return { location, forecast: null, rainLikely: false };
    }
  }

  /**
   * Generate a human-readable weather message in Spanish
   */
  generateWeatherMessage(
    forecast: WeatherForecast,
    city: string,
  ): string {
    if (forecast.precipitationProbability > 50) {
      return (
        `${forecast.icon} Hoy lloverá (${forecast.precipitationProbability}% probabilidad). ` +
        `Temperatura: ${forecast.temperature}°C. ` +
        `Te recomendamos salir 15 minutos antes. ¡No olvides tu paraguas!`
      );
    }

    return (
      `${forecast.icon} Clima favorable hoy. Temperatura: ${forecast.temperature}°C. ¡Buen viaje!`
    );
  }

  // ── Scheduled Task ──────────────────────────────────────────

  /**
   * Run every day at 6:00 AM to check weather and send alerts
   * This handles the N8N-like scheduled automation
   */
  @Cron('0 6 * * *')
  async dailyWeatherCheck() {
    this.logger.log('⏰ Ejecutando verificación diaria del clima...');

    const activePrefs = await this.weatherPrefRepository.find({
      where: { weatherAlertsEnabled: true, active: true },
    });

    this.logger.log(
      `📋 ${activePrefs.length} usuarios con alertas de clima activas`,
    );

    for (const pref of activePrefs) {
      try {
        const city = pref.city || 'Manizales';
        const result = await this.getWeatherForecast(city);

        if (!result.forecast) continue;

        const message = this.generateWeatherMessage(result.forecast, city);

        // Send notification via WebSocket to the citizen
        this.notificationsGateway.broadcastNotification({
          type: 'weather_alert',
          citizenId: pref.citizenId,
          title: '☀️ Alerta del clima',
          message,
          forecast: result.forecast,
          city,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `✅ Alerta de clima enviada a ciudadano ${pref.citizenId}: ${message}`,
        );
      } catch (error) {
        this.logger.error(
          `Error sending weather alert to ${pref.citizenId}: ${error}`,
        );
      }
    }
  }

  // ── Manual trigger for testing ──────────────────────────────

  async triggerWeatherCheckForCitizen(citizenId: string): Promise<{
    message: string;
    forecast: WeatherForecast | null;
  }> {
    const pref = await this.getPreference(citizenId);
    if (!pref || !pref.weatherAlertsEnabled) {
      return {
        message: 'No tienes alertas de clima activadas',
        forecast: null,
      };
    }

    const city = pref.city || 'Manizales';
    const result = await this.getWeatherForecast(city);

    if (!result.forecast) {
      return {
        message: 'No se pudo obtener el pronóstico del clima',
        forecast: null,
      };
    }

    const message = this.generateWeatherMessage(result.forecast, city);

    return { message, forecast: result.forecast };
  }

  // ── Helpers ─────────────────────────────────────────────────

  private mapWeatherCode(code: number): string {
    // WMO Weather codes
    if (code === 0) return 'Despejado';
    if (code <= 3) return 'Parcialmente nublado';
    if (code <= 19) return 'Niebla';
    if (code <= 29) return 'Tormenta';
    if (code <= 39) return 'Polvo';
    if (code <= 49) return 'Niebla densa';
    if (code <= 59) return 'Llovizna';
    if (code <= 69) return 'Lluvia';
    if (code <= 79) return 'Nieve';
    if (code <= 84) return 'Chubascos';
    if (code <= 99) return 'Tormenta eléctrica';
    return 'Variable';
  }

  private getWeatherIcon(condition: string, precipProbability: number): string {
    if (precipProbability > 70) return '🌧️';
    if (precipProbability > 50) return '🌦️';
    if (precipProbability > 30) return '⛅';
    if (condition.includes('Lluvia') || condition.includes('Llovizna')) return '🌧️';
    if (condition.includes('Nieve')) return '❄️';
    if (condition.includes('Tormenta')) return '⛈️';
    if (condition.includes('Niebla')) return '🌫️';
    if (condition.includes('Despejado')) return '☀️';
    if (condition.includes('nublado')) return '⛅';
    return '☀️';
  }
}
