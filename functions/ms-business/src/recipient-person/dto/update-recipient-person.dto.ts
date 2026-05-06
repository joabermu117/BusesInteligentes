import { PartialType } from '@nestjs/mapped-types';
import { CreateRecipientPersonDto } from './create-recipient-person.dto';

export class UpdateRecipientPersonDto extends PartialType(CreateRecipientPersonDto) {}
