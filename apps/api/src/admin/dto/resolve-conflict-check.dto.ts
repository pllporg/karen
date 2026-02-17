import { IsEnum, IsString, MinLength } from 'class-validator';

export enum ConflictResolutionDecision {
  CLEAR = 'CLEAR',
  WAIVE = 'WAIVE',
  BLOCK = 'BLOCK',
}

export class ResolveConflictCheckDto {
  @IsEnum(ConflictResolutionDecision)
  decision!: ConflictResolutionDecision;

  @IsString()
  @MinLength(3)
  rationale!: string;
}
