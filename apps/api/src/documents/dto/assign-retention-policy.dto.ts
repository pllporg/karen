import { IsString } from 'class-validator';

export class AssignRetentionPolicyDto {
  @IsString()
  policyId!: string;
}
