import { Client, Account, Databases, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_URL)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

export const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export const COLLECTIONS = {
  TRIPS: import.meta.env.VITE_TRIPS_COLLECTION_ID,
  STOPS: import.meta.env.VITE_STOPS_COLLECTION_ID,
  ACTIVITIES: import.meta.env.VITE_ACTIVITIES_COLLECTION_ID,
  NOTES: import.meta.env.VITE_NOTES_COLLECTION_ID,
  CHECKLIST: import.meta.env.VITE_CHECKLIST_COLLECTION_ID,
};

export { ID, Query };