/**
 * Base class for Person entity from MongoDB security microservice
 * This is a reference class - NOT a physical table in MySQL
 * Used for inheritance by Citizen and Driver entities
 */
export abstract class Person {
  /**
   * MongoDB ObjectId from Security microservice
   * Serves as the primary identifier for citizens and drivers
   */
  person_id: string;

  /**
   * Shared attributes between Citizen and Driver
   * Additional attributes are stored in MongoDB
   */
  constructor(person_id: string) {
    this.person_id = person_id;
  }
}
