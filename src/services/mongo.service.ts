import { client } from "..";

import * as mongoDB from "mongodb";
import "dotenv/config";

export const collections: { messages?: mongoDB.Collection } = {};

export async function connectToDatabase() {
  const dbclient: mongoDB.MongoClient = new mongoDB.MongoClient(
    process.env.DB_URI as string,
  );

  await dbclient.connect();

  const database: mongoDB.Db = dbclient.db(process.env.DB_NAME);

  const messagesCollection: mongoDB.Collection = database.collection(
    process.env.MESSAGES_COLLECTION_NAME as string,
  );

  collections.messages = messagesCollection;

  client.logger.info(
    `Successfully connected to database: ${database.databaseName}`,
  );
}
