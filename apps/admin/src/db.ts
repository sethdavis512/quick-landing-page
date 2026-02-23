import { DATABASE_URL } from "astro:env/server";
import postgres from "postgres";

const sql = postgres(DATABASE_URL);

export default sql;
