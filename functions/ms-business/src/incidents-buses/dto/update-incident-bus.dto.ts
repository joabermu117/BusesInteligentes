import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidentBusDto } from './create-incident-bus.dto';

export class UpdateIncidentBusDto extends PartialType(CreateIncidentBusDto) {}