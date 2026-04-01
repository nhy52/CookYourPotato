import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('potato')
export class Potato {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @Column()
  name: string;

  @Column()
  birthday: string;

  // ── 게임 진행 ───────────────────────────────────────────────
  @Column({ default: 1 })
  day: number;

  @Column({ default: 10 })
  dailyHp: number;

  @Column({ default: 'day' })
  phase: string;

  @Column({ nullable: true, type: 'text' })
  ending: string | null;

  @Column({ nullable: true, type: 'text' })
  endingDetail: string | null;

  // ── 스탯 ────────────────────────────────────────────────────
  @Column({ default: 30 })
  constitution: number;

  @Column({ default: 20 })
  intelligence: number;

  @Column({ default: 20 })
  grace: number;

  @Column({ default: 20 })
  charm: number;

  @Column({ default: 20 })
  sensitivity: number;

  @Column({ default: 50 })
  morality: number;

  @Column({ default: 50 })
  mental: number;

  @Column({ default: 0 })
  stress: number;

  @Column({ default: 300 })
  money: number;

  // ── 상태 플래그 ──────────────────────────────────────────────
  @Column({ default: false })
  isDelinquent: boolean;

  @Column({ default: false })
  kogumaEncountered: boolean;

  // ── 카운트/이벤트 (JSON) ─────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  counts: Record<string, number> | null;

  @Column({ default: 0 })
  rainEvents: number;

  @Column({ default: 0 })
  leaniEvents: number;

  @Column({ default: 0 })
  rustleEvents: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
