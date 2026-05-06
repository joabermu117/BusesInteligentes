import { PartialType } from '@nestjs/mapped-types';
import { CreateRecipientGroupDto } from './create-recipient-group.dto';

export class UpdateRecipientGroupDto extends PartialType(CreateRecipientGroupDto) {}
