import { MongoClient } from "mongodb";

const url =
  "mongodb+srv://e-commerce:fIYhazydN2Zx7r9A@cluster0.2mxc4y6.mongodb.net/";
const dbName = "node-project";
export const collectionName = "todo";

const client = new MongoClient(url);

export const connection = async () => {
  await client.connect();
  console.log("Database connected");
  return client.db(dbName);
};
