import { Pool } from 'pg';
import 'dotenv/config';

/************************************* USAGE *************************************************
INPUTS: N/A (READS process.env.DATABASE_URL)
OUTPUTS: OBJ -> PG CONNECTION POOL
FUNCTION: CREATES A SINGLE SHARED POSTGRES CONNECTION POOL FOR THE WHOLE APP TO REUSE,
          RATHER THAN OPENING A NEW CONNECTION PER QUERY
************************************* USAGE **************************************************/
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
