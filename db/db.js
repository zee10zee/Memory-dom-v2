

import pkg from "pg"
const {Pool} = pkg;
const pool = new Pool({
   user : 'postgres',
   host :'localhost',
   database : 'neverGiveUp',
   password :  'Zohrajan10@',
   port :  5432
});


export default pool;