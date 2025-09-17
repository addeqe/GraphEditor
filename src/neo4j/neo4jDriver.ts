import neo4j, { Driver, Session } from 'neo4j-driver';

const driver: Driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password')
);

export const getSession = (): Session => driver.session();

export default driver;