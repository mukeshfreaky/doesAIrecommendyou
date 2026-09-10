import { WebRetriever } from "./types";
import { TavilyRetriever } from "./tavily";

export * from "./types";
export * from "./tavily";

let defaultRetriever: WebRetriever | null = null;

export function getWebRetriever(): WebRetriever {
  if (!defaultRetriever) {
    defaultRetriever = new TavilyRetriever();
  }
  return defaultRetriever;
}

export function setWebRetriever(retriever: WebRetriever | null): void {
  defaultRetriever = retriever;
}