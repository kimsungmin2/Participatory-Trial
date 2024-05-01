import { EntityManager } from "typeorm";

export interface QueryRunner {
  /**
   * Entity manager working only with this query runner.
   */
  readonly manager: EntityManager;
}
